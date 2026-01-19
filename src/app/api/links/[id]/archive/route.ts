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

/**
 * POST /api/links/[id]/archive
 * Archive the original page URL to Internet Archive
 * Simplified: archives the page URL only (not individual media files)
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

    // Get link and verify ownership
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('*')
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
    if (link.archive_status === 'archived' && link.archive_url) {
      return NextResponse.json({
        status: 'archived',
        archive_url: link.archive_url,
        archived_at: link.archived_at,
      });
    }

    // Set status to pending immediately
    await supabase
      .from('links')
      .update({ archive_status: 'pending' })
      .eq('id', id);

    // Archive the original page URL (not individual media)
    let archivedUrl: string | null = null;
    try {
      // First check if already archived
      const availability = await checkWaybackAvailability(link.url);
      if (availability.available && availability.url) {
        archivedUrl = availability.url;
      } else {
        // Save to archive
        const result = await saveToArchive(link.url);
        if (result.status === 'success' && result.archive_url) {
          archivedUrl = result.archive_url;
        } else if (result.status === 'pending') {
          // Return the expected URL format even if pending
          archivedUrl = getWaybackUrl(link.url);
        }
      }
    } catch (error) {
      console.error(`Error archiving page URL ${link.url}:`, error);
    }

    // Update link with archive status
    const updateData = {
      archive_status: archivedUrl ? 'archived' : 'failed',
      archive_url: archivedUrl,
      archived_at: archivedUrl ? new Date().toISOString() : null,
    };

    const { error: updateError } = await supabase
      .from('links')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating link archive status:', updateError);
    }

    return NextResponse.json({
      status: updateData.archive_status,
      archive_url: archivedUrl,
      archived_at: updateData.archived_at,
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

    // Get link and verify ownership
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('*')
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

    // Return current status
    return NextResponse.json({
      status: link.archive_status || null,
      archive_url: link.archive_url,
      archived_at: link.archived_at,
    });
  } catch (error) {
    console.error('Error checking archive status:', error);
    return NextResponse.json(
      { error: '아카이브 상태 확인에 실패했습니다' },
      { status: 500 }
    );
  }
}
