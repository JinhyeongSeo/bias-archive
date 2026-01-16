/**
 * selca.kastden.org parser module
 *
 * selca.kastden.org에서 K-pop 아이돌 그룹 및 멤버 데이터를 파싱하여 제공
 * 원본 kpopnet.json 데이터 소스를 대체
 *
 * @module selca
 */

import { parse, HTMLElement } from 'node-html-parser'
import {
  KpopGroup,
  KpopMember,
  KpopMemberWithGroup,
  CacheEntry,
  GroupMembersResult,
} from '@/lib/selca-types'

// Re-export types for backwards compatibility
export type { KpopGroup, KpopMember, KpopMemberWithGroup } from '@/lib/selca-types'

const BASE_URL = 'https://selca.kastden.org'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const TIMEOUT_MS = 5000
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// In-memory caches
let groupsCache: CacheEntry<KpopGroup[]> | undefined = undefined
const groupMembersCache = new Map<string, CacheEntry<GroupMembersResult>>()
const idolStageNameCache = new Map<string, CacheEntry<string>>()

/**
 * HTML 페이지를 가져오는 유틸리티 함수 (공유용으로 export)
 */
export async function fetchHtmlFromSelca(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeoutId)
  }
}

function getText(element: HTMLElement | null): string {
  return element?.textContent?.trim() ?? ''
}

async function fetchIdolKoreanStageName(idolSlug: string): Promise<string> {
  const cached = idolStageNameCache.get(idolSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const html = await fetchHtmlFromSelca(`${BASE_URL}/noona/idol/${idolSlug}/`)
    const root = parse(html)

    const rows = root.querySelectorAll('tr')
    let koreanStageName = ''

    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 2) {
        const label = getText(cells[0])
        const value = getText(cells[1])

        if (label === 'Stage name (original)') {
          koreanStageName = value
          break
        }
      }
    }

    idolStageNameCache.set(idolSlug, {
      data: koreanStageName,
      timestamp: Date.now(),
    })

    return koreanStageName
  } catch (error) {
    console.error(`[Selca Parser] Error fetching Korean stage name for ${idolSlug}:`, error)
    return ''
  }
}

async function fetchAllGroups(): Promise<KpopGroup[]> {
  if (groupsCache && Date.now() - groupsCache.timestamp < CACHE_TTL_MS) {
    return groupsCache.data
  }

  try {
    const html = await fetchHtmlFromSelca(`${BASE_URL}/noona/group/`)
    const root = parse(html)

    const groups: KpopGroup[] = []
    const rows = root.querySelectorAll('tbody tr')

    for (const row of rows) {
      const link = row.querySelector('a[href^="/noona/group/"]')
      if (!link) continue

      const href = link.getAttribute('href') || ''
      const match = href.match(/\/noona\/group\/([^/]+)\//)
      if (!match) continue

      const slug = match[1]
      const nameEnglish = getText(link)

      const td = link.closest('td')
      if (!td) continue

      const spans = td.querySelectorAll('span.nobr')
      let nameOriginal = ''
      for (const span of spans) {
        const text = getText(span)
        if (text.startsWith('(') && text.endsWith(')')) {
          nameOriginal = text.slice(1, -1)
          break
        }
      }

      if (!nameOriginal) {
        nameOriginal = nameEnglish
      }

      groups.push({
        id: slug,
        name: nameEnglish,
        name_original: nameOriginal,
        memberCount: 0,
      })
    }

    groupsCache = {
      data: groups,
      timestamp: Date.now(),
    }

    return groups
  } catch (error) {
    console.error('[Selca Parser] Error fetching groups:', error)
    return []
  }
}

/**
 * K-pop 그룹 검색
 */
export async function searchGroups(query: string): Promise<KpopGroup[]> {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) {
    return []
  }

  try {
    const allGroups = await fetchAllGroups()

    const matches = allGroups
      .filter((group) => {
        const nameMatch = group.name.toLowerCase().includes(normalizedQuery)
        const originalMatch = group.name_original.toLowerCase().includes(normalizedQuery)
        return nameMatch || originalMatch
      })
      .slice(0, 10)

    const groupsWithCounts = await Promise.all(
      matches.map(async (group) => {
        try {
          const { members } = await getGroupMembers(group.id)
          return { ...group, memberCount: members.length }
        } catch {
          return group
        }
      })
    )

    return groupsWithCounts
  } catch (error) {
    console.error('[Selca Parser] Error searching groups:', error)
    return []
  }
}

/**
 * 그룹의 모든 멤버 조회
 */
export async function getGroupMembers(groupSlug: string): Promise<GroupMembersResult> {
  const cached = groupMembersCache.get(groupSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const html = await fetchHtmlFromSelca(`${BASE_URL}/noona/group/${groupSlug}/`)
    const root = parse(html)

    let groupName = ''
    let groupNameOriginal = ''

    const infoRows = root.querySelectorAll('table tr')
    for (const row of infoRows) {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 2) {
        const label = getText(cells[0])
        const value = getText(cells[1])

        if (label === 'Display name (romanized)') {
          groupName = value
        } else if (label === 'Display name (original)') {
          groupNameOriginal = value
        }
      }
    }

    if (!groupName) {
      const h1 = root.querySelector('h1')
      groupName = getText(h1)
    }

    if (!groupNameOriginal) {
      groupNameOriginal = groupName
    }

    interface BasicMember {
      id: string
      name: string
    }
    const basicMembers: BasicMember[] = []
    const memberLinks = root.querySelectorAll('a[href^="/noona/idol/"]')

    for (const link of memberLinks) {
      const href = link.getAttribute('href') || ''
      const match = href.match(/\/noona\/idol\/([^/]+)\//)
      if (!match) continue

      const idolSlug = match[1]
      const stageName = getText(link)

      const row = link.closest('tr')
      if (!row) continue

      basicMembers.push({
        id: idolSlug,
        name: stageName,
      })
    }

    const membersWithKoreanNames: KpopMember[] = await Promise.all(
      basicMembers.map(async (member) => {
        const koreanStageName = await fetchIdolKoreanStageName(member.id)
        return {
          id: member.id,
          name: member.name,
          name_original: koreanStageName || member.name,
          name_stage_ko: koreanStageName || undefined,
        }
      })
    )

    const result: GroupMembersResult = { groupName, groupNameOriginal, members: membersWithKoreanNames }

    groupMembersCache.set(groupSlug, {
      data: result,
      timestamp: Date.now(),
    })

    return result
  } catch (error) {
    console.error('[Selca Parser] Error fetching group members:', error)
    return { groupName: '', groupNameOriginal: '', members: [] }
  }
}

/**
 * K-pop 아이돌 검색 (이름 기반)
 *
 * @deprecated 500+ 아이돌 로드로 인한 타임아웃 문제. Bias.selca_slug 사용 권장.
 */
export async function searchMembers(query: string): Promise<KpopMemberWithGroup[]> {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) {
    return []
  }

  try {
    const allIdols = await fetchAllIdols()

    const matches = allIdols
      .filter((idol) => {
        const nameMatch = idol.name.toLowerCase().includes(normalizedQuery)
        const originalMatch = idol.name_original.toLowerCase().includes(normalizedQuery)
        const stageKoMatch = idol.name_stage_ko?.toLowerCase().includes(normalizedQuery) || false
        return nameMatch || originalMatch || stageKoMatch
      })
      .slice(0, 10)

    return matches
  } catch (error) {
    console.error('[Selca Parser] Error searching members:', error)
    return []
  }
}

/**
 * 전체 아이돌 목록 파싱 (내부 함수)
 * WARNING: 500+ 아이돌 개별 페이지 방문으로 타임아웃 가능
 */
async function fetchAllIdols(): Promise<KpopMemberWithGroup[]> {
  try {
    const html = await fetchHtmlFromSelca(`${BASE_URL}/noona/idol/`)
    const root = parse(html)

    const basicIdols: Array<{
      id: string
      stageName: string
      realName: string
      group: KpopMemberWithGroup['group']
    }> = []
    const rows = root.querySelectorAll('tbody tr')

    for (const row of rows) {
      const idolLink = row.querySelector('a[href^="/noona/idol/"]')
      if (!idolLink) continue

      const href = idolLink.getAttribute('href') || ''
      const match = href.match(/\/noona\/idol\/([^/]+)\//)
      if (!match) continue

      const idolSlug = match[1]
      const stageName = getText(idolLink)

      const groupLink = row.querySelector('a.main_group_link')
      let group: KpopMemberWithGroup['group'] = null

      if (groupLink) {
        const groupHref = groupLink.getAttribute('href') || ''
        const groupMatch = groupHref.match(/\/noona\/group\/([^/]+)\//)

        if (groupMatch) {
          const groupSlug = groupMatch[1]
          const groupName = getText(groupLink)

          group = {
            id: groupSlug,
            name: groupName,
            name_original: groupName,
          }
        }
      }

      const realNameTd = row.querySelectorAll('td')[1]
      let nameOriginal = ''

      if (realNameTd) {
        const spans = realNameTd.querySelectorAll('span.nobr')
        for (const span of spans) {
          const text = getText(span)
          if (text.startsWith('(') && text.endsWith(')')) {
            nameOriginal = text.slice(1, -1)
            break
          }
        }
      }

      if (!nameOriginal) {
        nameOriginal = stageName
      }

      basicIdols.push({
        id: idolSlug,
        stageName,
        realName: nameOriginal,
        group,
      })
    }

    const idolsWithKoreanNames = await Promise.all(
      basicIdols.map(async (idol) => {
        const koreanStageName = await fetchIdolKoreanStageName(idol.id)
        return {
          id: idol.id,
          name: idol.stageName,
          name_original: idol.realName,
          name_stage_ko: koreanStageName || undefined,
          group: idol.group,
        }
      })
    )

    return idolsWithKoreanNames
  } catch (error) {
    console.error('[Selca Parser] Error fetching idols:', error)
    return []
  }
}
