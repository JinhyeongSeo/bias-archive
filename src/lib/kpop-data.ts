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
