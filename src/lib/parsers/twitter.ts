/**
 * Twitter/X metadata parser
 * Uses vxtwitter API for reliable metadata extraction including images
 */

import type { VideoMetadata, ParsedMedia, MediaType } from './index'

interface VxTwitterMedia {
  url: string
  type: string // 'image', 'video', 'gif'
  thumbnail_url?: string
}

interface VxTwitterResponse {
  text: string
  user_name: string
  user_screen_name: string
  date: string
  mediaURLs?: string[]
  media_extended?: VxTwitterMedia[]
  tweetID: string
}

/**
 * Extract tweet ID and username from Twitter/X URL
 */
function parseTweetUrl(url: string): { username: string; tweetId: string } | null {
  try {
    const urlObj = new URL(url)
    // Pattern: twitter.com/username/status/1234 or x.com/username/status/1234
    const match = urlObj.pathname.match(/\/([^/]+)\/status\/(\d+)/)
    if (match) {
      return { username: match[1], tweetId: match[2] }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Parse Twitter/X URL and extract metadata
 * Uses vxtwitter API for reliable metadata including images
 * @param url - Twitter or X.com URL
 * @returns VideoMetadata with Twitter-specific handling
 */
export async function parseTwitter(url: string): Promise<VideoMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const parsed = parseTweetUrl(url)
    if (!parsed) {
      throw new Error('Invalid Twitter URL format')
    }

    const apiUrl = `https://api.vxtwitter.com/${parsed.username}/status/${parsed.tweetId}`
    const response = await fetch(apiUrl, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`vxtwitter API failed: ${response.status}`)
    }

    const data: VxTwitterResponse = await response.json()

    // Use first line of tweet as title
    const title = data.text
      ? data.text.split('\n')[0].substring(0, 100)
      : `${data.user_name}의 트윗`

    // Get first media URL as thumbnail
    const thumbnailUrl = data.mediaURLs?.[0] || null

    // Parse date
    const originalDate = data.date ? new Date(data.date).toISOString().split('T')[0] : null

    // Parse all media from media_extended (for multi-image support)
    const media: ParsedMedia[] = []
    if (data.media_extended && data.media_extended.length > 0) {
      for (const item of data.media_extended) {
        // Normalize type to our MediaType
        const type: MediaType = item.type === 'video' ? 'video'
          : item.type === 'gif' ? 'gif'
          : 'image'
        media.push({ url: item.url, type })
      }
    }

    return {
      title,
      description: data.text || null,
      thumbnailUrl,
      platform: 'twitter',
      originalDate,
      authorName: data.user_name || null,
      media: media.length > 0 ? media : undefined,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Twitter Parser] Timeout fetching metadata')
    } else {
      console.error('[Twitter Parser] Error:', error)
    }

    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'twitter',
      originalDate: null,
      authorName: null,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
