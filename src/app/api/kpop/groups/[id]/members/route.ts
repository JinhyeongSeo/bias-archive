import { NextRequest, NextResponse } from 'next/server'
import { getGroupMembers } from '@/lib/parsers/selca'
import { getGroupMembersFromNamuwiki } from '@/lib/parsers/namuwiki'
import type { KpopMember } from '@/lib/selca-types'

/**
 * GET /api/kpop/groups/[id]/members
 * Get all members of a K-pop group by group slug
 * Uses selca.kastden.org for real-time data, falls back to namuwiki
 *
 * Group ID format:
 * - selca: "{slug}" (e.g., "ive", "aespa")
 * - namuwiki: "namuwiki:{groupName}" (e.g., "namuwiki:아이브")
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params

    // namuwiki: 접두사인 경우 나무위키에서 조회
    if (groupId.startsWith('namuwiki:')) {
      const groupName = groupId.replace('namuwiki:', '')
      console.log(`[K-pop Members API] Fetching from namuwiki: ${groupName}`)

      const result = await getGroupMembersFromNamuwiki(groupName)

      if (!result || result.members.length === 0) {
        return NextResponse.json(
          { error: '나무위키에서 그룹 멤버를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      // 나무위키 멤버를 KpopMember 형식으로 변환
      const members: KpopMember[] = result.members.map((member) => ({
        id: `namuwiki_${member.name_ko}`, // namuwiki_ 접두사로 식별
        name: member.name_en || member.name_ko, // 영문명 우선, 없으면 한글
        name_original: member.name_ko,
        name_stage_ko: member.name_ko,
        hasSelcaOwner: false, // 나무위키 소스는 selca 검색 불가
      }))

      return NextResponse.json({
        groupName: result.groupNameEn || result.groupNameKo,
        groupNameOriginal: result.groupNameKo,
        members,
        hasSelcaGroup: false, // 나무위키 소스
        source: 'namuwiki',
      })
    }

    // 기존 selca 로직
    const result = await getGroupMembers(groupId)

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
      source: 'selca',
    })
  } catch (error) {
    console.error('Error fetching group members:', error)
    return NextResponse.json(
      { error: '그룹 멤버 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
