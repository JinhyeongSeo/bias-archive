/**
 * YouTube metadata parser
 * Uses oEmbed API for reliable metadata extraction
 */

import type { VideoMetadata } from './index'

/**
 * Extract video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/
 */
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // youtube.com/watch?v=VIDEO_ID
    if (hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v')
      if (videoId) return videoId

      // youtube.com/shorts/VIDEO_ID
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?]+)/)
      if (shortsMatch) return shortsMatch[1]

      // youtube.com/embed/VIDEO_ID
      const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/)
      if (embedMatch) return embedMatch[1]
    }

    // youtu.be/VIDEO_ID
    if (hostname.includes('youtu.be')) {
      const pathParts = urlObj.pathname.split('/')
      if (pathParts[1]) return pathParts[1]
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get high quality thumbnail URL
 * Converts to maxresdefault for best quality
 */
function getHighQualityThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

/**
 * Convert any YouTube URL to standard watch URL for oEmbed compatibility
 * Shorts and other formats need conversion since oEmbed only supports watch URLs
 */
function normalizeToWatchUrl(url: string): string {
  const videoId = extractVideoId(url)
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`
  }
  return url
}

/**
 * Parse YouTube URL and extract metadata
 * @param url - YouTube video URL
 * @returns VideoMetadata with YouTube-specific optimizations
 */
export async function parseYouTube(url: string): Promise<VideoMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    // Convert shorts/embed URLs to watch URL for oEmbed compatibility
    const watchUrl = normalizeToWatchUrl(url)
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    const response = await fetch(oembedUrl, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`YouTube oEmbed failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract video ID for high quality thumbnail
    const videoId = extractVideoId(url)
    const thumbnailUrl = videoId
      ? getHighQualityThumbnail(videoId)
      : data.thumbnail_url || null

    return {
      title: data.title || null,
      description: null, // oEmbed doesn't provide description
      thumbnailUrl,
      platform: 'youtube',
      originalDate: null, // oEmbed doesn't provide upload date
      authorName: data.author_name || null,
    }
  } catch (error) {
    // Return fallback on error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[YouTube Parser] Timeout fetching metadata')
    } else {
      console.error('[YouTube Parser] Error:', error)
    }

    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'youtube',
      originalDate: null,
      authorName: null,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
