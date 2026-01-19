import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  saveToArchive,
  checkWaybackAvailability,
  getWaybackUrl,
} from '@/lib/archive';

// Process limit per call - increased since we only archive page URLs now (1 API call per link)
const ITEMS_PER_BATCH = 10;
const DELAY_BETWEEN_REQUESTS = 4500; // 4.5 seconds between links
const STALE_PENDING_MINUTES = 5; // Reset pending items older than 5 minutes

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Archive a page URL and return its Wayback URL
 */
async function archivePageUrl(url: string): Promise<string | null> {
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
    console.error(`Error archiving page URL ${url}:`, error);
  }

  return null;
}

/**
 * POST /api/archive/process
 * Process queued links for archiving (called by cron or manually)
 * Simplified: archives original page URL only (not individual media files)
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

    const supabase = createAdminClient();

    // Reset stale pending items (older than 5 minutes) back to queued
    const staleThreshold = new Date(Date.now() - STALE_PENDING_MINUTES * 60 * 1000).toISOString();
    const { data: resetData } = await supabase
      .from('links')
      .update({ archive_status: 'queued' })
      .eq('archive_status', 'pending')
      .lt('updated_at', staleThreshold)
      .select('id');

    const resetCount = resetData?.length || 0;

    if (resetCount && resetCount > 0) {
      console.log(`[Archive] Reset ${resetCount} stale pending items to queued`);
    }

    // Get queued links (oldest first) - no need to fetch link_media anymore
    const { data: queuedLinks, error: fetchError } = await supabase
      .from('links')
      .select('*')
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

        // Archive the original page URL (single API call per link)
        const archivedUrl = await archivePageUrl(link.url);

        // Update link with archive status
        await supabase
          .from('links')
          .update({
            archive_status: archivedUrl ? 'archived' : 'failed',
            archive_url: archivedUrl,
            archived_at: archivedUrl ? new Date().toISOString() : null,
          })
          .eq('id', link.id);

        processedCount++;
        results.push({ id: link.id, status: archivedUrl ? 'archived' : 'failed' });

        // Rate limit between links
        await delay(DELAY_BETWEEN_REQUESTS);
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
    const supabase = createAdminClient();

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
