import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, unauthorized, badRequest, notFound } from '@/lib/api-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/links/[id]
 * Get a single link by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!id) {
      badRequest('링크 ID가 필요합니다')
    }

    const { data: link, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        notFound('링크를 찾을 수 없습니다')
      }
      throw error
    }

    return NextResponse.json(link)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/links/[id]
 * Update a link's memo or starred status (requires authentication)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const { id } = await params

    if (!id) {
      badRequest('링크 ID가 필요합니다')
    }

    const body = await request.json()
    const { memo, starred } = body as { memo?: string | null; starred?: boolean }

    // Validate that at least one field is being updated
    if (memo === undefined && starred === undefined) {
      badRequest('업데이트할 필드가 필요합니다 (memo 또는 starred)')
    }

    // Build update object
    const updateData: { memo?: string | null; starred?: boolean; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }
    if (memo !== undefined) updateData.memo = memo
    if (starred !== undefined) updateData.starred = starred

    const { data: link, error } = await supabase
      .from('links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        notFound('링크를 찾을 수 없습니다')
      }
      throw error
    }

    return NextResponse.json(link)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/links/[id]
 * Delete a link by ID (requires authentication)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const { id } = await params

    if (!id) {
      badRequest('링크 ID가 필요합니다')
    }

    // Check if link exists
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !link) {
      notFound('링크를 찾을 수 없습니다')
    }

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
