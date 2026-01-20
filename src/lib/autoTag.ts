import type { Bias } from '@/types/index'

/**
 * Auto tag extraction utility
 * Detects registered bias names in text content
 */

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Trim whitespace
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}

/**
 * Check if a name is found in text
 * @param text - The text to search in (already normalized)
 * @param name - The name to search for (will be normalized)
 * @returns true if name is found
 */
function isNameInText(text: string, name: string): boolean {
  const normalizedName = normalizeText(name)
  if (!normalizedName) return false

  // For short names (< 3 chars), use word boundary to avoid false positives
  // For longer names and Korean names, use simple includes
  if (normalizedName.length < 3 && /^[a-z]+$/i.test(normalizedName)) {
    try {
      const escapedName = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escapedName}\\b`, 'i')
      return regex.test(text)
    } catch {
      return text.includes(normalizedName)
    }
  }

  // For Korean and longer names, simple includes works well
  return text.includes(normalizedName)
}

/**
 * Extract auto tags from text content based on registered biases
 *
 * Supports bidirectional name matching (영어/한글 양방향 매칭):
 * - Matches against bias.name (display name)
 * - Matches against bias.name_en (English name, if set)
 * - Matches against bias.name_ko (Korean name, if set)
 * - Any match returns bias.name as the tag (consistent display)
 *
 * @param text - Combined text from title + description + author_name
 * @param biases - List of registered biases to match against
 * @returns Array of matched bias names (deduplicated)
 *
 * @example
 * const biases = [{name: 'RORA', name_en: 'RORA', name_ko: '로라', group_name: 'BABYMONSTER'}]
 * extractAutoTags('RORA fancam video', biases) // ['RORA']
 * extractAutoTags('로라 직캠', biases) // ['RORA'] - Korean name also matches
 * extractAutoTags('BABYMONSTER stage', biases) // ['BABYMONSTER'] - Group name as tag
 * extractAutoTags('BABYMONSTER RORA fancam', biases) // ['RORA', 'BABYMONSTER'] - Both member and group
 */
export function extractAutoTags(text: string, biases: Bias[]): string[] {
  if (!text || !biases || biases.length === 0) {
    return []
  }

  const normalizedText = normalizeText(text)
  const matchedTags = new Set<string>()

  for (const bias of biases) {
    // Check for member name match (display name)
    if (bias.name && isNameInText(normalizedText, bias.name)) {
      matchedTags.add(bias.name)
      continue // Already matched, skip other checks for this bias
    }

    // Check for English name match (양방향 매칭)
    if (bias.name_en && isNameInText(normalizedText, bias.name_en)) {
      matchedTags.add(bias.name)
      continue
    }

    // Check for Korean name match (양방향 매칭)
    if (bias.name_ko && isNameInText(normalizedText, bias.name_ko)) {
      matchedTags.add(bias.name)
      continue
    }

    // Check for group name match
    // If group name matches, add the group name itself as a tag (not individual members)
    if (bias.group_name && isNameInText(normalizedText, bias.group_name)) {
      matchedTags.add(bias.group_name)
    }
  }

  // Return deduplicated array (Set already handles this)
  return Array.from(matchedTags)
}

/**
 * Combine link metadata into searchable text
 * @param title - Link title
 * @param description - Link description
 * @param authorName - Author/member name
 * @param searchQuery - Optional search query hint (from external search)
 * @returns Combined text for tag extraction
 */
export function combineTextForTagExtraction(
  title: string | null,
  description: string | null,
  authorName: string | null,
  searchQuery?: string | null
): string {
  const parts: string[] = []

  if (title) parts.push(title)
  if (description) parts.push(description)
  if (authorName) parts.push(authorName)
  if (searchQuery) parts.push(searchQuery)

  return parts.join(' ')
}
