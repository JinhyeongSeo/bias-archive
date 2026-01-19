import { NextRequest, NextResponse } from 'next/server'
import { searchGroups } from '@/lib/parsers/selca'
import { searchGroupFromNamuwiki, getGroupMembersFromNamuwiki } from '@/lib/parsers/namuwiki'

/**
 * API 응답용 그룹 타입 (source 필드 포함)
 */
interface GroupWithSource {
  id: string
  name: string
  name_original: string
  memberCount: number
  source: 'selca' | 'namuwiki'
}

/**
 * GET /api/kpop/groups?q=검색어
 * Search for K-pop groups by name (English or Korean)
 * Uses selca.kastden.org for real-time data, falls back to namuwiki
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '검색어가 필요합니다' },
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()

    // 1. selca.kastden.org에서 먼저 검색
    const selcaGroups = await searchGroups(trimmedQuery)

    if (selcaGroups.length > 0) {
      // selca 결과가 있으면 source 필드 추가하여 반환
      const groupsWithSource: GroupWithSource[] = selcaGroups.map((group) => ({
        ...group,
        source: 'selca' as const,
      }))
      return NextResponse.json({ groups: groupsWithSource })
    }

    // 2. selca에 결과가 없으면 나무위키에서 폴백 검색
    console.log(`[K-pop Groups API] Falling back to namuwiki for: ${trimmedQuery}`)

    const namuwikiGroup = await searchGroupFromNamuwiki(trimmedQuery)

    if (namuwikiGroup) {
      // 멤버 수 조회를 위해 멤버 목록 가져오기
      const membersResult = await getGroupMembersFromNamuwiki(trimmedQuery)
      const memberCount = membersResult?.members.length || 0

      const groupWithSource: GroupWithSource = {
        id: `namuwiki:${trimmedQuery}`, // namuwiki: 접두사로 식별
        name: membersResult?.groupNameEn || namuwikiGroup.name_ko,
        name_original: namuwikiGroup.name_ko,
        memberCount,
        source: 'namuwiki',
      }

      return NextResponse.json({ groups: [groupWithSource] })
    }

    // 3. 둘 다 결과 없음
    return NextResponse.json({ groups: [] })
  } catch (error) {
    console.error('Error searching K-pop groups:', error)
    return NextResponse.json(
      { error: '그룹 검색에 실패했습니다' },
      { status: 500 }
    )
  }
}
