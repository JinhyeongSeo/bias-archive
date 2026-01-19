import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  saveToArchive,
  checkWaybackAvailability,
  getWaybackUrl,
} from '@/lib/archive';

// Process limit per call (rate limit: 15/min, so process 3 items with ~5 URLs each)
const ITEMS_PER_BATCH = 3;
const DELAY_BETWEEN_REQUESTS = 4500; // 4.5 seconds

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Archive a media URL and return its Wayback URL
 */
async function archiveMediaUrl(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    const availability = await checkWaybackAvailability(url);
    if (availability.available && availability.url) {
      return availability.url;
    }

    const result = await saveToArchive(url);
    if (result.status === 'success' && result.archive_url) {
      return result.archive_url;
    }
    if (result.status === 'pending') {
      return getWaybackUrl(url);
    }
  } catch (error) {
    console.error(`Error archiving media URL ${url}:`, error);
  }

  return null;
}

/**
 * POST /api/archive/process
 * Process queued links for archiving (called by cron or manually)
 * Processes a limited batch to stay within rate limits
 */
export async function POST(request: NextRequest) {
  try {
    // Check if archive.org credentials are configured
    if (!process.env.ARCHIVE_ORG_ACCESS_KEY || !process.env.ARCHIVE_ORG_SECRET_KEY) {
      return NextResponse.json(
        { message: 'Archive not configured', processed: 0 },
        { status: 200 }
      );
    }

    const supabase = await createClient();

    // Get queued links (oldest first)
    const { data: queuedLinks, error: fetchError } = await supabase
      .from('links')
      .select('*, link_media(*)')
      .eq('archive_status', 'queued')
      .order('created_at', { ascending: true })
      .limit(ITEMS_PER_BATCH);

    if (fetchError) {
      console.error('Error fetching queued links:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    if (!queuedLinks || queuedLinks.length === 0) {
      return NextResponse.json({
        message: 'No items in queue',
        processed: 0,
      });
    }

    let processedCount = 0;
    const results: { id: string; status: string }[] = [];

    for (const link of queuedLinks) {
      try {
        // Set status to pending
        await supabase
          .from('links')
          .update({ archive_status: 'pending' })
          .eq('id', link.id);

        // Archive thumbnail URL
        let archivedThumbnailUrl: string | null = null;
        if (link.thumbnail_url) {
          archivedThumbnailUrl = await archiveMediaUrl(link.thumbnail_url);
          await delay(DELAY_BETWEEN_REQUESTS);
        }

        // Archive link_media URLs
        const mediaItems = link.link_media || [];
        for (const media of mediaItems) {
          if (media.media_url && !media.archived_url) {
            const archivedUrl = await archiveMediaUrl(media.media_url);
            if (archivedUrl) {
              await supabase
                .from('link_media')
                .update({ archived_url: archivedUrl })
                .eq('id', media.id);
            }
            await delay(DELAY_BETWEEN_REQUESTS);
          }
        }

        // Update link with archive status
        await supabase
          .from('links')
          .update({
            archive_status: 'archived',
            archived_thumbnail_url: archivedThumbnailUrl,
            archived_at: new Date().toISOString(),
          })
          .eq('id', link.id);

        processedCount++;
        results.push({ id: link.id, status: 'archived' });
      } catch (error) {
        console.error(`Error processing link ${link.id}:`, error);

        // Mark as failed
        await supabase
          .from('links')
          .update({ archive_status: 'failed' })
          .eq('id', link.id);

        results.push({ id: link.id, status: 'failed' });
      }
    }

    // Check remaining queue
    const { count } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('archive_status', 'queued');

    return NextResponse.json({
      message: `Processed ${processedCount} items`,
      processed: processedCount,
      remaining: count || 0,
      results,
    });
  } catch (error) {
    console.error('Error processing archive queue:', error);
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/archive/process
 * Get queue status
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { count: queuedCount } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('archive_status', 'queued');

    const { count: pendingCount } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('archive_status', 'pending');

    const { count: archivedCount } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('archive_status', 'archived');

    return NextResponse.json({
      queued: queuedCount || 0,
      pending: pendingCount || 0,
      archived: archivedCount || 0,
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}
