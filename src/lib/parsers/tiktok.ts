/**
 * TikTok metadata parser
 * Extracts metadata from TikTok video URLs via HTML meta tag parsing
 */

import type { VideoMetadata, ParsedMedia } from './index'
import { decodeHtmlEntities } from '@/lib/utils/decodeHtmlEntities'

/**
 * Extract username and videoId from TikTok URL
 */
function parseTikTokUrl(url: string): { username: string | null; videoId: string | null } {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Standard format: /@username/video/videoId
    const standardMatch = pathname.match(/^\/@([^/]+)\/video\/(\d+)/)
    if (standardMatch) {
      return { username: standardMatch[1], videoId: standardMatch[2] }
    }

    // Short URL: vm.tiktok.com/XXXXX (needs redirect resolution)
    // For short URLs, we can't extract info without following redirect
    if (urlObj.hostname === 'vm.tiktok.com') {
      const shortCode = pathname.replace(/^\//, '').replace(/\/$/, '')
      return { username: null, videoId: shortCode }
    }

    // Alternative format: /t/videoId
    const shortMatch = pathname.match(/^\/t\/(\w+)/)
    if (shortMatch) {
      return { username: null, videoId: shortMatch[1] }
    }

    return { username: null, videoId: null }
  } catch {
    return { username: null, videoId: null }
  }
}

/**
 * Parse TikTok URL and extract metadata
 * Uses HTML meta tag parsing for og:title, og:image, og:description
 *
 * @param url - TikTok video URL
 * @returns VideoMetadata with TikTok-specific handling
 */
export async function parseTikTok(url: string): Promise<VideoMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  // Parse URL for fallback info
  const urlInfo = parseTikTokUrl(url)

  try {
    // Try to fetch HTML and parse meta tags
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
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

    // Extract author from title pattern: "@username" or "username on TikTok"
    let authorName: string | null = null
    if (title) {
      const authorMatch = title.match(/@([a-zA-Z0-9_.]+)/)
        || title.match(/^(.+?)\s+on\s+TikTok/i)
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
      if (urlInfo.videoId) {
        title = `TikTok Video ${urlInfo.videoId}`
      } else {
        title = url
      }
    }

    return {
      title: decodeHtmlEntities(title),
      description: description ? decodeHtmlEntities(description) : null,
      thumbnailUrl,
      platform: 'tiktok',
      originalDate: null,
      authorName,
      // Include thumbnailUrl as media for viewer support (empty array if no media)
      media: thumbnailUrl ? [{ type: 'video', url: thumbnailUrl } as ParsedMedia] : [],
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[TikTok Parser] Timeout fetching metadata')
    } else {
      console.error('[TikTok Parser] Error:', error)
    }

    // Fallback: Use URL-based info
    let fallbackTitle = url
    let fallbackAuthor: string | null = null

    if (urlInfo.videoId) {
      fallbackTitle = `TikTok Video ${urlInfo.videoId}`
    }
    if (urlInfo.username) {
      fallbackAuthor = urlInfo.username
      fallbackTitle = `@${urlInfo.username}'s TikTok`
    }

    return {
      title: fallbackTitle,
      description: null,
      thumbnailUrl: null,
      platform: 'tiktok',
      originalDate: null,
      authorName: fallbackAuthor,
      media: [],
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
