import { NextRequest, NextResponse } from 'next/server'
import { getGroupMembers } from '@/lib/parsers/selca'

/**
 * GET /api/kpop/groups/[id]/members
 * Get all members of a K-pop group by group slug
 * Uses selca.kastden.org for real-time data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupSlug } = await params

    const result = await getGroupMembers(groupSlug)

    // If no group name found, group doesn't exist
    if (!result.groupName) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      groupName: result.groupName,
      groupNameOriginal: result.groupNameOriginal,
      members: result.members,
      hasSelcaGroup: result.hasSelcaGroup,
      selcaGroupSlug: result.selcaGroupSlug,
    })
  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json(
      { error: '그룹 멤버 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
