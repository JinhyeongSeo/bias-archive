import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  saveToArchive,
  checkWaybackAvailability,
  getWaybackUrl,
} from '@/lib/archive';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Delay helper for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Archive a media URL and return its Wayback URL
 * Checks if already archived first, then saves if not
 */
async function archiveMediaUrl(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    // First check if already archived
    const availability = await checkWaybackAvailability(url);
    if (availability.available && availability.url) {
      return availability.url;
    }

    // Save to archive
    const result = await saveToArchive(url);
    if (result.status === 'success' && result.archive_url) {
      return result.archive_url;
    }
    if (result.status === 'pending') {
      // Return the expected URL format even if pending
      return getWaybackUrl(url);
    }
  } catch (error) {
    console.error(`Error archiving media URL ${url}:`, error);
  }

  return null;
}

/**
 * POST /api/links/[id]/archive
 * Trigger archive of link media (thumbnail + link_media) to Internet Archive
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // Check if archive.org credentials are configured
    if (!process.env.ARCHIVE_ORG_ACCESS_KEY || !process.env.ARCHIVE_ORG_SECRET_KEY) {
      return NextResponse.json(
        { error: '아카이브 기능이 비활성화되어 있습니다' },
        { status: 501 }
      );
    }

    // Get link with media and verify ownership
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('*, link_media(*)')
      .eq('id', id)
      .single();

    if (fetchError || !link) {
      return NextResponse.json(
        { error: '링크를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (link.user_id !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // If already archived, return existing status
    if (link.archive_status === 'archived' && link.archived_thumbnail_url) {
      return NextResponse.json({
        status: 'archived',
        archived_thumbnail_url: link.archived_thumbnail_url,
        archived_at: link.archived_at,
      });
    }

    // Set status to pending immediately
    await supabase
      .from('links')
      .update({ archive_status: 'pending' })
      .eq('id', id);

    // Archive thumbnail URL
    let archivedThumbnailUrl: string | null = null;
    if (link.thumbnail_url) {
      archivedThumbnailUrl = await archiveMediaUrl(link.thumbnail_url);
      await delay(4500); // Wait 4.5 seconds between requests (15/min limit)
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
        await delay(4500); // Rate limit
      }
    }

    // Update link with archive status
    const updateData = {
      archive_status: 'archived',
      archived_thumbnail_url: archivedThumbnailUrl,
      archived_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('links')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating link archive status:', updateError);
    }

    return NextResponse.json({
      status: 'archived',
      archived_thumbnail_url: archivedThumbnailUrl,
      archived_at: updateData.archived_at,
      media_count: mediaItems.length,
    });
  } catch (error) {
    console.error('Error archiving link:', error);
    return NextResponse.json(
      { error: '아카이브 요청에 실패했습니다' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/links/[id]/archive
 * Check archive status of a link (requires authentication)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // Get link with media and verify ownership
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('*, link_media(*)')
      .eq('id', id)
      .single();

    if (fetchError || !link) {
      return NextResponse.json(
        { error: '링크를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (link.user_id !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // Return current status with media archive info
    const mediaItems = link.link_media || [];
    const archivedMediaCount = mediaItems.filter((m: { archived_url?: string | null }) => m.archived_url).length;

    return NextResponse.json({
      status: link.archive_status || null,
      archived_thumbnail_url: link.archived_thumbnail_url,
      archived_at: link.archived_at,
      media_count: mediaItems.length,
      archived_media_count: archivedMediaCount,
    });
  } catch (error) {
    console.error('Error checking archive status:', error);
    return NextResponse.json(
      { error: '아카이브 상태 확인에 실패했습니다' },
      { status: 500 }
    );
  }
}
