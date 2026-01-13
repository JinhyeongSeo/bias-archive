import { NextRequest, NextResponse } from 'next/server'
import { getGroupMembers } from '@/lib/kpop-data'
import kpopData from 'kpopnet.json'

/**
 * GET /api/kpop/groups/[id]/members
 * Get all members of a K-pop group by group ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the group to get its name
    const group = kpopData.groups.find((g) => g.id === id)
    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const members = getGroupMembers(id)

    return NextResponse.json({
      groupName: group.name,
      groupNameOriginal: group.name_original,
      members,
    })
  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json(
      { error: '그룹 멤버 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
