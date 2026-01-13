import type { Bias } from '@/types/database'

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
 * @param text - Combined text from title + description + author_name
 * @param biases - List of registered biases to match against
 * @returns Array of matched bias names (deduplicated)
 *
 * @example
 * const biases = [{name: 'RORA', group_name: 'BABYMONSTER'}]
 * extractAutoTags('RORA fancam video', biases) // ['RORA']
 */
export function extractAutoTags(text: string, biases: Bias[]): string[] {
  if (!text || !biases || biases.length === 0) {
    return []
  }

  const normalizedText = normalizeText(text)
  const matchedTags = new Set<string>()

  for (const bias of biases) {
    // Check for member name match
    if (bias.name && isNameInText(normalizedText, bias.name)) {
      matchedTags.add(bias.name)
    }

    // Check for group name match
    // If group name matches, add all member names from that group
    if (bias.group_name && isNameInText(normalizedText, bias.group_name)) {
      matchedTags.add(bias.name)
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
