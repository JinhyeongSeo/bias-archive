import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  saveToArchive,
  checkArchiveStatus,
} from '@/lib/archive';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/links/[id]/archive
 * Trigger archive of a link to Internet Archive (requires authentication)
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

    // If already archived, return existing archive URL
    if (link.archive_status === 'archived' && link.archive_url) {
      return NextResponse.json({
        status: 'archived',
        archive_url: link.archive_url,
        archived_at: link.archived_at,
      });
    }

    // Trigger archive
    const result = await saveToArchive(link.url);

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.error || '아카이브 요청에 실패했습니다' },
        { status: 500 }
      );
    }

    // Update link with archive status
    const updateData: {
      archive_status: string;
      archive_job_id?: string | null;
      archive_url?: string | null;
      archived_at?: string | null;
    } = {
      archive_status: result.status === 'success' ? 'archived' : 'pending',
      archive_job_id: result.job_id || null,
      archive_url: result.archive_url || null,
      archived_at: result.status === 'success' ? new Date().toISOString() : null,
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
      job_id: result.job_id,
      archive_url: result.archive_url,
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

    // If not pending or no job_id, return current status
    if (link.archive_status !== 'pending' || !link.archive_job_id) {
      return NextResponse.json({
        status: link.archive_status || null,
        archive_url: link.archive_url,
        archived_at: link.archived_at,
      });
    }

    // Check if archive.org credentials are configured
    if (!process.env.ARCHIVE_ORG_ACCESS_KEY || !process.env.ARCHIVE_ORG_SECRET_KEY) {
      return NextResponse.json({
        status: link.archive_status,
        archive_url: link.archive_url,
        archived_at: link.archived_at,
      });
    }

    // Check status of pending job
    const result = await checkArchiveStatus(link.archive_job_id);

    if (result.status === 'success') {
      // Update link with completed archive
      const updateData = {
        archive_status: 'archived',
        archive_url: result.archive_url || link.archive_url,
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
        archive_url: updateData.archive_url,
        archived_at: updateData.archived_at,
      });
    }

    if (result.status === 'error') {
      // Update link with failed status
      const { error: updateError } = await supabase
        .from('links')
        .update({ archive_status: 'failed' })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating link archive status:', updateError);
      }

      return NextResponse.json({
        status: 'failed',
        error: result.error,
      });
    }

    // Still pending
    return NextResponse.json({
      status: 'pending',
      job_id: link.archive_job_id,
    });
  } catch (error) {
    console.error('Error checking archive status:', error);
    return NextResponse.json(
      { error: '아카이브 상태 확인에 실패했습니다' },
      { status: 500 }
    );
  }
}
