/**
 * selca.kastden.org parser module
 * Fetches K-pop idol group and member data from selca.kastden.org
 * (Original source of kpopnet.json data)
 */

import { parse, HTMLElement } from 'node-html-parser'

// Types matching existing API interfaces
export interface KpopGroup {
  id: string
  name: string
  name_original: string
  memberCount: number
}

export interface KpopMember {
  id: string
  name: string
  name_original: string
}

export interface KpopMemberWithGroup {
  id: string
  name: string
  name_original: string
  group: {
    id: string
    name: string
    name_original: string
  } | null
}

const BASE_URL = 'https://selca.kastden.org'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const TIMEOUT_MS = 5000

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes (extended for better performance)
const groupsCache: CacheEntry<KpopGroup[]> | null = null
const groupMembersCache = new Map<string, CacheEntry<{ groupName: string; groupNameOriginal: string; members: KpopMember[] }>>()
let idolsCache: CacheEntry<KpopMemberWithGroup[]> | null = null
// Cache for individual idol Korean stage names
const idolStageNameCache = new Map<string, CacheEntry<string>>()

/**
 * Fetch HTML from URL with timeout and User-Agent
 */
async function fetchHtml(url: string): Promise<string> {
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

/**
 * Extract text content safely from an element
 */
function getText(element: HTMLElement | null): string {
  return element?.textContent?.trim() ?? ''
}

/**
 * Fetch Korean stage name from individual idol page
 * Looks for "Stage name (original)" field which contains Korean/Japanese stage name
 */
async function fetchIdolKoreanStageName(idolSlug: string): Promise<string> {
  // Check cache
  const cached = idolStageNameCache.get(idolSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const html = await fetchHtml(`${BASE_URL}/noona/idol/${idolSlug}/`)
    const root = parse(html)

    // Find "Stage name (original)" row in the info table
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

    // Cache the result (even if empty, to avoid repeated requests)
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

/**
 * Parse groups from the group listing page
 */
async function fetchAllGroups(): Promise<KpopGroup[]> {
  // Check cache
  if (groupsCache && Date.now() - groupsCache.timestamp < CACHE_TTL_MS) {
    return groupsCache.data
  }

  try {
    const html = await fetchHtml(`${BASE_URL}/noona/group/`)
    const root = parse(html)

    const groups: KpopGroup[] = []
    const rows = root.querySelectorAll('tbody tr')

    for (const row of rows) {
      // Get group link - format: /noona/group/{slug}/
      const link = row.querySelector('a[href^="/noona/group/"]')
      if (!link) continue

      const href = link.getAttribute('href') || ''
      const match = href.match(/\/noona\/group\/([^/]+)\//)
      if (!match) continue

      const slug = match[1]
      const nameEnglish = getText(link)

      // Get Korean/original name from the span next to the link
      // Pattern: <span class="nobr">Name</span> <span class="nobr">(한글)</span>
      const td = link.closest('td')
      if (!td) continue

      const spans = td.querySelectorAll('span.nobr')
      let nameOriginal = ''
      for (const span of spans) {
        const text = getText(span)
        // Check if it's wrapped in parentheses (original name)
        if (text.startsWith('(') && text.endsWith(')')) {
          nameOriginal = text.slice(1, -1)
          break
        }
      }

      // If no original name found, use English name
      if (!nameOriginal) {
        nameOriginal = nameEnglish
      }

      groups.push({
        id: slug,
        name: nameEnglish,
        name_original: nameOriginal,
        memberCount: 0, // Will be fetched when needed
      })
    }

    // Update cache - using object assignment since const
    Object.assign(groupsCache ?? {}, {
      data: groups,
      timestamp: Date.now(),
    })

    return groups
  } catch (error) {
    console.error('[Selca Parser] Error fetching groups:', error)
    return []
  }
}

/**
 * Search for K-pop groups by name (English or Korean)
 * Returns top 10 matches, case-insensitive partial matching
 * Fetches member count for each matched group (cached for performance)
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

    // Fetch member counts in parallel for matched groups
    // Uses cache so subsequent requests are fast
    const groupsWithCounts = await Promise.all(
      matches.map(async (group) => {
        try {
          const { members } = await getGroupMembers(group.id)
          return { ...group, memberCount: members.length }
        } catch {
          return group // Keep memberCount as 0 on error
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
 * Get all members of a group by group slug
 * Returns group name, original name, and member list
 */
export async function getGroupMembers(
  groupSlug: string
): Promise<{ groupName: string; groupNameOriginal: string; members: KpopMember[] }> {
  // Check cache
  const cached = groupMembersCache.get(groupSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const html = await fetchHtml(`${BASE_URL}/noona/group/${groupSlug}/`)
    const root = parse(html)

    // Get group names from the info table
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

    // If no romanized name found, try h1
    if (!groupName) {
      const h1 = root.querySelector('h1')
      groupName = getText(h1)
    }

    // If no original name found, use English name
    if (!groupNameOriginal) {
      groupNameOriginal = groupName
    }

    // Get members from the member table (basic info first)
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

      const idolSlug = match[1] // e.g., "ive_gaeul"
      const stageName = getText(link)

      // Skip if not in a table row (could be other links)
      const row = link.closest('tr')
      if (!row) continue

      basicMembers.push({
        id: idolSlug,
        name: stageName,
      })
    }

    // Fetch Korean stage names for all members in parallel
    const membersWithKoreanNames = await Promise.all(
      basicMembers.map(async (member) => {
        const koreanStageName = await fetchIdolKoreanStageName(member.id)
        return {
          id: member.id,
          name: member.name,
          // Use Korean stage name if available, otherwise fall back to English stage name
          name_original: koreanStageName || member.name,
        }
      })
    )

    const result = { groupName, groupNameOriginal, members: membersWithKoreanNames }

    // Update cache
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
 * Fetch all idols from the idol listing page
 */
async function fetchAllIdols(): Promise<KpopMemberWithGroup[]> {
  // Check cache
  if (idolsCache && Date.now() - idolsCache.timestamp < CACHE_TTL_MS) {
    return idolsCache.data
  }

  try {
    const html = await fetchHtml(`${BASE_URL}/noona/idol/`)
    const root = parse(html)

    const idols: KpopMemberWithGroup[] = []
    const rows = root.querySelectorAll('tbody tr')

    for (const row of rows) {
      // Get idol link - format: /noona/idol/{group}_{name}/
      const idolLink = row.querySelector('a[href^="/noona/idol/"]')
      if (!idolLink) continue

      const href = idolLink.getAttribute('href') || ''
      const match = href.match(/\/noona\/idol\/([^/]+)\//)
      if (!match) continue

      const idolSlug = match[1]
      const stageName = getText(idolLink)

      // Get group info from the same cell
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
            name_original: groupName, // Will be same for now
          }
        }
      }

      // Get Korean name from real name column
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

      idols.push({
        id: idolSlug,
        name: stageName,
        name_original: nameOriginal,
        group,
      })
    }

    // Update cache
    idolsCache = {
      data: idols,
      timestamp: Date.now(),
    }

    return idols
  } catch (error) {
    console.error('[Selca Parser] Error fetching idols:', error)
    return []
  }
}

/**
 * Search for K-pop idols by name (English or Korean)
 * Returns top 10 matches with their group info
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
        return nameMatch || originalMatch
      })
      .slice(0, 10)

    return matches
  } catch (error) {
    console.error('[Selca Parser] Error searching members:', error)
    return []
  }
}
