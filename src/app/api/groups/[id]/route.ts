import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/groups/[id]
 * Delete a group (requires authentication)
 * FK constraint ON DELETE SET NULL ensures biases.group_id becomes NULL
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: '그룹을 삭제하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
