/**
 * Instagram metadata parser
 * Extracts metadata from Instagram post/reel URLs via HTML meta tag parsing
 */

import type { VideoMetadata } from './index'

/**
 * Parse Instagram URL and extract metadata
 * Uses HTML meta tag parsing for og:title, og:image, og:description
 *
 * @param url - Instagram URL (post, reel, or profile)
 * @returns VideoMetadata with Instagram-specific handling
 */
export async function parseInstagram(url: string): Promise<VideoMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    // Try to fetch HTML and parse meta tags
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Extract og:title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i)
    const title = titleMatch?.[1] || null

    // Extract og:image
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i)
    const thumbnailUrl = imageMatch?.[1] || null

    // Extract og:description
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i)
      || html.match(/<meta\s+content="([^"]*)"\s+property="og:description"/i)
    const description = descMatch?.[1] || null

    // Extract author from title pattern: "Username on Instagram: ..." or "@username"
    let authorName: string | null = null
    if (title) {
      const authorMatch = title.match(/^(.+?)\s+on\s+Instagram:/i)
        || title.match(/@([a-zA-Z0-9_.]+)/)
      if (authorMatch) {
        authorName = authorMatch[1].trim()
      }
    }

    return {
      title: title ? decodeHtmlEntities(title) : url,
      description: description ? decodeHtmlEntities(description) : null,
      thumbnailUrl,
      platform: 'instagram',
      originalDate: null,
      authorName,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Instagram Parser] Timeout fetching metadata')
    } else {
      console.error('[Instagram Parser] Error:', error)
    }

    // Fallback: Return minimal metadata with URL as title
    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'instagram',
      originalDate: null,
      authorName: null,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
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

  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity)
}
