/**
 * Weverse metadata parser
 * Uses Open Graph scraper for Weverse content
 * Supports: weverse.io/artist/media, weverse.io/artist/moments
 */

import ogs from 'open-graph-scraper'
import type { VideoMetadata } from './index'

/**
 * Extract artist/community name from Weverse URL
 * Pattern: weverse.io/{artistName}/...
 */
function extractCommunityFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    if (pathParts.length > 0) {
      // First path segment is the artist/community name
      return pathParts[0].toUpperCase()
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extract member name from Weverse description
 * Pattern: "content - MEMBER_NAME" or "content - 멤버명"
 */
function extractMemberFromDescription(description: string | null): string | null {
  if (!description) return null
  // Match pattern: "... - NAME" at the end
  const match = description.match(/\s-\s([A-Za-z가-힣]+)$/)
  if (match) {
    return match[1]
  }
  return null
}

/**
 * Parse Weverse URL and extract metadata
 * @param url - Weverse URL
 * @returns VideoMetadata with Weverse-specific handling
 */
export async function parseWeverse(url: string): Promise<VideoMetadata> {
  // Extract community name from URL as fallback
  const communityFromUrl = extractCommunityFromUrl(url)

  try {
    const { result, error } = await ogs({
      url,
      timeout: 5000,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BiasArchiveBot/1.0)',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        },
      },
    })

    if (error) {
      throw new Error('Weverse Open Graph scraping failed')
    }

    // Get best available image
    let thumbnailUrl: string | null = null
    if (result.ogImage && result.ogImage.length > 0) {
      thumbnailUrl = result.ogImage[0].url
    } else if (result.twitterImage && result.twitterImage.length > 0) {
      thumbnailUrl = result.twitterImage[0].url
    }

    // Extract description
    const description = result.ogDescription || result.twitterDescription || null

    // Try to extract member name from description (pattern: "content - MEMBER")
    const memberName = extractMemberFromDescription(description)

    return {
      title: result.ogTitle || result.twitterTitle || null,
      description,
      thumbnailUrl,
      platform: 'weverse',
      originalDate: result.ogDate || result.articlePublishedTime || null,
      authorName: memberName || communityFromUrl || result.ogSiteName || null,
    }
  } catch (error) {
    console.error('[Weverse Parser] Error:', error)

    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'weverse',
      originalDate: null,
      authorName: communityFromUrl,
    }
  }
}
