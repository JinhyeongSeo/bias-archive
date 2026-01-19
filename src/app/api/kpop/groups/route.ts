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
 * 한글 검색어인지 확인
 */
function isKoreanQuery(query: string): boolean {
  return /[가-힣]/.test(query)
}

/**
 * GET /api/kpop/groups?q=검색어
 * Search for K-pop groups by name (English or Korean)
 *
 * 검색 전략:
 * 1. 한글 검색어 → namuwiki에서 영문명 추출 → selca에서 영문명으로 재검색
 * 2. 영문 검색어 → selca에서 직접 검색
 * 3. selca에 없으면 namuwiki 결과 반환
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

    // 1. 영문 검색어면 selca에서 바로 검색
    if (!isKoreanQuery(trimmedQuery)) {
      const selcaGroups = await searchGroups(trimmedQuery)

      if (selcaGroups.length > 0) {
        const groupsWithSource: GroupWithSource[] = selcaGroups.map((group) => ({
          ...group,
          source: 'selca' as const,
        }))
        return NextResponse.json({ groups: groupsWithSource })
      }
    }

    // 2. 한글 검색어이거나 영문 검색에서 결과 없음 → namuwiki에서 검색
    console.log(`[K-pop Groups API] Searching namuwiki for: ${trimmedQuery}`)

    const namuwikiGroup = await searchGroupFromNamuwiki(trimmedQuery)

    if (namuwikiGroup) {
      // 나무위키에서 영문 그룹명과 멤버 정보 가져오기
      const membersResult = await getGroupMembersFromNamuwiki(trimmedQuery)
      const memberCount = membersResult?.members.length || 0
      const englishName = membersResult?.groupNameEn

      // 3. 영문명이 있으면 selca에서 재검색 시도
      if (englishName) {
        console.log(`[K-pop Groups API] Found English name: ${englishName}, searching selca...`)
        const selcaGroups = await searchGroups(englishName)

        if (selcaGroups.length > 0) {
          // selca에서 찾음! selca 결과 반환
          const groupsWithSource: GroupWithSource[] = selcaGroups.map((group) => ({
            ...group,
            source: 'selca' as const,
          }))
          return NextResponse.json({ groups: groupsWithSource })
        }
      }

      // 4. selca에 없으면 namuwiki 결과 반환
      const groupWithSource: GroupWithSource = {
        id: `namuwiki:${trimmedQuery}`,
        name: englishName || namuwikiGroup.name_ko,
        name_original: namuwikiGroup.name_ko,
        memberCount,
        source: 'namuwiki',
      }

      return NextResponse.json({ groups: [groupWithSource] })
    }

    // 5. namuwiki에도 없으면 selca에서 한글로 검색 시도 (일부 그룹은 한글명 있음)
    if (isKoreanQuery(trimmedQuery)) {
      const selcaGroups = await searchGroups(trimmedQuery)

      if (selcaGroups.length > 0) {
        const groupsWithSource: GroupWithSource[] = selcaGroups.map((group) => ({
          ...group,
          source: 'selca' as const,
        }))
        return NextResponse.json({ groups: groupsWithSource })
      }
    }

    // 6. 결과 없음
    return NextResponse.json({ groups: [] })
  } catch (error) {
    console.error('Error searching K-pop groups:', error)
    return NextResponse.json(
      { error: '그룹 검색에 실패했습니다' },
      { status: 500 }
    )
  }
}
