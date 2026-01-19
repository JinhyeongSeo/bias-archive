/**
 * Shared HTML entity decoding utility
 *
 * Handles:
 * - Named entities: &amp;, &lt;, &gt;, &quot;, &#039;, &apos;, &nbsp;, etc.
 * - Hex entities: &#xHHHH; (e.g., &#xd55c; -> '한')
 * - Decimal entities: &#DDDD; (e.g., &#54620; -> '한')
 */

/**
 * Common HTML named entities
 */
const namedEntities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&apos;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&nbsp;': ' ',
}

/**
 * Decode HTML entities in a string
 *
 * @param text - The string containing HTML entities to decode
 * @returns The decoded string with all entities converted to their characters
 *
 * @example
 * decodeHtmlEntities('&amp;') // returns '&'
 * decodeHtmlEntities('&#xd55c;&#xae00;') // returns '한글'
 * decodeHtmlEntities('&#54620;&#44544;') // returns '한글'
 */
export function decodeHtmlEntities(text: string): string {
  // First handle named/numeric entities from lookup table
  let result = text.replace(/&[#\w]+;/g, (entity) => namedEntities[entity] || entity)

  // Then handle hex entities like &#xd558; &#xd55c;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )

  // Handle decimal entities like &#54616; &#54620;
  result = result.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  )

  return result
}
