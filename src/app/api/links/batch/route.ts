import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * DELETE /api/links/batch
 * Delete multiple links at once
 * Requires authentication
 * Body: { linkIds: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { linkIds } = body

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      return NextResponse.json(
        { error: '삭제할 링크 ID 목록이 필요합니다' },
        { status: 400 }
      )
    }

    // Delete link_tags first (foreign key constraint)
    await supabase
      .from('link_tags')
      .delete()
      .in('link_id', linkIds)

    // Delete link_media
    await supabase
      .from('link_media')
      .delete()
      .in('link_id', linkIds)

    // Delete links
    const { error, count } = await supabase
      .from('links')
      .delete({ count: 'exact' })
      .in('id', linkIds)

    if (error) throw error

    return NextResponse.json({ deleted: count ?? 0 })
  } catch (error) {
    console.error('Error batch deleting links:', error)
    return NextResponse.json(
      { error: '일괄 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
