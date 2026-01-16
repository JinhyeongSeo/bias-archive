import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/groups/[id]
 * Delete a group and all its members (requires authentication)
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

    // First, delete all biases belonging to this group
    const { error: biasesError } = await supabase
      .from('biases')
      .delete()
      .eq('group_id', id)

    if (biasesError) throw biasesError

    // Then, delete the group itself
    const { error: groupError } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)

    if (groupError) throw groupError
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: '그룹을 삭제하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
