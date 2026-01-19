/**
 * Instagram metadata parser
 * Extracts metadata from Instagram post/reel URLs via HTML meta tag parsing
 */

import type { VideoMetadata } from './index'

/**
 * Extract post ID and type from Instagram URL
 */
function parseInstagramUrl(url: string): { type: 'post' | 'reel' | 'profile' | 'unknown'; id: string | null; username: string | null } {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Post: /p/{id}/
    const postMatch = pathname.match(/^\/p\/([A-Za-z0-9_-]+)/)
    if (postMatch) {
      return { type: 'post', id: postMatch[1], username: null }
    }

    // Reel: /reel/{id}/ or /reels/{id}/
    const reelMatch = pathname.match(/^\/reels?\/([A-Za-z0-9_-]+)/)
    if (reelMatch) {
      return { type: 'reel', id: reelMatch[1], username: null }
    }

    // Profile: /{username}/
    const profileMatch = pathname.match(/^\/([A-Za-z0-9_.]+)\/?$/)
    if (profileMatch && !['p', 'reel', 'reels', 'explore', 'stories'].includes(profileMatch[1])) {
      return { type: 'profile', id: null, username: profileMatch[1] }
    }

    return { type: 'unknown', id: null, username: null }
  } catch {
    return { type: 'unknown', id: null, username: null }
  }
}

/**
 * Parse Instagram URL and extract metadata
 * Uses HTML meta tag parsing for og:title, og:image, og:description
 *
 * @param url - Instagram URL (post, reel, or profile)
 * @returns VideoMetadata with Instagram-specific handling
 */
export async function parseInstagram(url: string): Promise<VideoMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // Increased timeout

  // Parse URL for fallback info
  const urlInfo = parseInstagramUrl(url)

  try {
    // Try to fetch HTML and parse meta tags
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Use realistic browser User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Try multiple meta tag patterns
    let title: string | null = null
    let thumbnailUrl: string | null = null
    let description: string | null = null

    // 1. Try og:* meta tags (multiple patterns for attribute order)
    const ogTitleMatch = html.match(/<meta\s+(?:property="og:title"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:title")/i)
    title = ogTitleMatch?.[1] || ogTitleMatch?.[2] || null

    const ogImageMatch = html.match(/<meta\s+(?:property="og:image"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:image")/i)
    thumbnailUrl = ogImageMatch?.[1] || ogImageMatch?.[2] || null

    const ogDescMatch = html.match(/<meta\s+(?:property="og:description"\s+content="([^"]*)"|content="([^"]*)"\s+property="og:description")/i)
    description = ogDescMatch?.[1] || ogDescMatch?.[2] || null

    // 2. Fallback to twitter:* meta tags
    if (!title) {
      const twitterTitleMatch = html.match(/<meta\s+(?:name="twitter:title"\s+content="([^"]*)"|content="([^"]*)"\s+name="twitter:title")/i)
      title = twitterTitleMatch?.[1] || twitterTitleMatch?.[2] || null
    }

    if (!thumbnailUrl) {
      const twitterImageMatch = html.match(/<meta\s+(?:name="twitter:image"\s+content="([^"]*)"|content="([^"]*)"\s+name="twitter:image")/i)
      thumbnailUrl = twitterImageMatch?.[1] || twitterImageMatch?.[2] || null
    }

    // 3. Fallback to standard meta description
    if (!description) {
      const metaDescMatch = html.match(/<meta\s+(?:name="description"\s+content="([^"]*)"|content="([^"]*)"\s+name="description")/i)
      description = metaDescMatch?.[1] || metaDescMatch?.[2] || null
    }

    // 4. Try to extract from <title> tag
    if (!title) {
      const htmlTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (htmlTitleMatch) {
        title = htmlTitleMatch[1].trim()
      }
    }

    // Extract author from title pattern: "Username on Instagram: ..." or "@username"
    let authorName: string | null = null
    if (title) {
      const authorMatch = title.match(/^(.+?)\s+on\s+Instagram:/i)
        || title.match(/@([a-zA-Z0-9_.]+)/)
      if (authorMatch) {
        authorName = authorMatch[1].trim()
      }
    }

    // Use URL info as additional fallback for author
    if (!authorName && urlInfo.username) {
      authorName = urlInfo.username
    }

    // Generate fallback title if none found
    if (!title) {
      if (urlInfo.type === 'post' && urlInfo.id) {
        title = `Instagram Post ${urlInfo.id}`
      } else if (urlInfo.type === 'reel' && urlInfo.id) {
        title = `Instagram Reel ${urlInfo.id}`
      } else if (urlInfo.type === 'profile' && urlInfo.username) {
        title = `@${urlInfo.username} on Instagram`
        authorName = urlInfo.username
      } else {
        title = url
      }
    }

    return {
      title: decodeHtmlEntities(title),
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

    // Fallback: Use URL-based info
    let fallbackTitle = url
    let fallbackAuthor: string | null = null

    if (urlInfo.type === 'post' && urlInfo.id) {
      fallbackTitle = `Instagram Post ${urlInfo.id}`
    } else if (urlInfo.type === 'reel' && urlInfo.id) {
      fallbackTitle = `Instagram Reel ${urlInfo.id}`
    } else if (urlInfo.type === 'profile' && urlInfo.username) {
      fallbackTitle = `@${urlInfo.username} on Instagram`
      fallbackAuthor = urlInfo.username
    }

    return {
      title: fallbackTitle,
      description: null,
      thumbnailUrl: null,
      platform: 'instagram',
      originalDate: null,
      authorName: fallbackAuthor,
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
