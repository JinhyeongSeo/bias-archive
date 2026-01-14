import kpopData from 'kpopnet.json'

// Types for our API responses
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

/**
 * Search for K-pop groups by name (English or Korean)
 * Returns top 10 matches, case-insensitive partial matching
 */
export function searchGroups(query: string): KpopGroup[] {
  const normalizedQuery = query.toLowerCase()

  const matches = kpopData.groups
    .filter((group) => {
      const nameMatch = group.name.toLowerCase().includes(normalizedQuery)
      const originalMatch = group.name_original.toLowerCase().includes(normalizedQuery)
      const aliasMatch = group.name_alias?.toLowerCase().includes(normalizedQuery) ?? false
      return nameMatch || originalMatch || aliasMatch
    })
    .map((group) => ({
      id: group.id,
      name: group.name,
      name_original: group.name_original,
      memberCount: group.members.length,
    }))
    .slice(0, 10)

  return matches
}

/**
 * Get all members of a group by group ID
 * Returns member name and original name (Korean)
 */
export function getGroupMembers(groupId: string): KpopMember[] {
  const group = kpopData.groups.find((g) => g.id === groupId)
  if (!group) {
    return []
  }

  // Create a map of idol IDs to idol data for quick lookup
  const idolMap = new Map(kpopData.idols.map((idol) => [idol.id, idol]))

  return group.members
    .map((member) => {
      const idol = idolMap.get(member.idol_id)
      if (!idol) {
        return null
      }
      return {
        id: idol.id,
        name: idol.name,
        name_original: idol.name_original,
      }
    })
    .filter((member): member is KpopMember => member !== null)
}

// Types for member search with group info
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

/**
 * Search for K-pop idols by name (English or Korean)
 * Returns top 10 matches with their group info
 */
export function searchMembers(query: string): KpopMemberWithGroup[] {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) {
    return []
  }

  // Create a map from idol_id to group for quick lookup
  const idolToGroup = new Map<string, typeof kpopData.groups[0]>()
  for (const group of kpopData.groups) {
    for (const member of group.members) {
      idolToGroup.set(member.idol_id, group)
    }
  }

  const matches = kpopData.idols
    .filter((idol) => {
      const nameMatch = idol.name.toLowerCase().includes(normalizedQuery)
      const originalMatch = idol.name_original.toLowerCase().includes(normalizedQuery)
      return nameMatch || originalMatch
    })
    .map((idol) => {
      const group = idolToGroup.get(idol.id)
      return {
        id: idol.id,
        name: idol.name,
        name_original: idol.name_original,
        group: group
          ? {
              id: group.id,
              name: group.name,
              name_original: group.name_original,
            }
          : null,
      }
    })
    .slice(0, 10)

  return matches
}
