import { NextRequest, NextResponse } from 'next/server'
import { getGroupMembers, searchGroups } from '@/lib/parsers/selca'
import { getGroupMembersFromNamuwiki } from '@/lib/parsers/namuwiki'
import type { KpopMember } from '@/lib/selca-types'

/**
 * 이름 정규화 (비교용)
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z가-힣]/g, '')
}

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

      const namuwikiResult = await getGroupMembersFromNamuwiki(groupName)

      if (!namuwikiResult || namuwikiResult.members.length === 0) {
        return NextResponse.json(
          { error: '나무위키에서 그룹 멤버를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      // 나무위키에서 영문 그룹명 추출 후 selca에서 검색하여 멤버 slug 매칭
      let selcaMembers: KpopMember[] = []
      const englishName = namuwikiResult.groupNameEn

      if (englishName) {
        console.log(`[K-pop Members API] Searching selca for: ${englishName}`)
        const selcaGroups = await searchGroups(englishName)

        if (selcaGroups.length > 0) {
          // selca 그룹의 멤버 목록 가져오기
          const selcaResult = await getGroupMembers(selcaGroups[0].id)
          selcaMembers = selcaResult.members
          console.log(`[K-pop Members API] Found ${selcaMembers.length} selca members`)
        }
      }

      // 나무위키 멤버를 KpopMember 형식으로 변환, selca 멤버와 매칭
      const members: KpopMember[] = namuwikiResult.members.map((nwMember) => {
        // selca 멤버에서 이름 매칭 시도
        const matchedSelca = selcaMembers.find((sMember) => {
          const nwNameNorm = normalizeName(nwMember.name_ko)
          const sNameOrigNorm = normalizeName(sMember.name_original)
          const sNameKoNorm = sMember.name_stage_ko ? normalizeName(sMember.name_stage_ko) : ''
          const sNameNorm = normalizeName(sMember.name)

          return nwNameNorm === sNameOrigNorm ||
                 nwNameNorm === sNameKoNorm ||
                 (nwMember.name_en && normalizeName(nwMember.name_en) === sNameNorm)
        })

        if (matchedSelca) {
          // selca 멤버 정보 사용 (slug, hasSelcaOwner 포함)
          return {
            id: matchedSelca.id,
            name: matchedSelca.name,
            name_original: nwMember.name_ko, // 나무위키 한글명 사용
            name_stage_ko: nwMember.name_ko,
            hasSelcaOwner: matchedSelca.hasSelcaOwner,
          }
        }

        // selca에서 못 찾으면 나무위키 정보만 사용
        return {
          id: `namuwiki_${nwMember.name_ko}`,
          name: nwMember.name_en || nwMember.name_ko,
          name_original: nwMember.name_ko,
          name_stage_ko: nwMember.name_ko,
          hasSelcaOwner: false,
        }
      })

      // selca 그룹 정보도 포함
      const selcaGroup = selcaMembers.length > 0
        ? await searchGroups(englishName || '').then(g => g[0])
        : null

      return NextResponse.json({
        groupName: namuwikiResult.groupNameEn || namuwikiResult.groupNameKo,
        groupNameOriginal: namuwikiResult.groupNameKo,
        members,
        hasSelcaGroup: selcaMembers.length > 0,
        selcaGroupSlug: selcaGroup?.id,
        source: 'namuwiki', // 원본 소스는 namuwiki지만 selca 정보 보강됨
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
