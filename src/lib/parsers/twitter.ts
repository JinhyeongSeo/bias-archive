/**
 * Twitter/X metadata parser
 * Uses oEmbed API for tweet metadata extraction
 * Falls back to OG scraper for thumbnail
 */

import ogs from 'open-graph-scraper'
import type { VideoMetadata } from './index'

/**
 * Parse Twitter/X URL and extract metadata
 * @param url - Twitter or X.com URL
 * @returns VideoMetadata with Twitter-specific handling
 */
export async function parseTwitter(url: string): Promise<VideoMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`Twitter oEmbed failed: ${response.status}`)
    }

    const data = await response.json()

    // Twitter oEmbed returns HTML, extract text from it
    const htmlContent = data.html || ''

    // Extract tweet text from the blockquote paragraph
    // The paragraph may contain <a> tags for hashtags/links, so we need to capture everything inside <p>
    const tweetTextMatch = htmlContent.match(/<p[^>]*>([\s\S]*?)<\/p>/)
    // Strip HTML tags to get plain text
    const rawText = tweetTextMatch ? tweetTextMatch[1].replace(/<[^>]+>/g, '').trim() : null
    const tweetText = rawText || null

    // Use first line of tweet as title, or author name
    const title = tweetText
      ? tweetText.split('\n')[0].substring(0, 100)
      : data.author_name
        ? `${data.author_name}의 트윗`
        : null

    // Try to get thumbnail via OG scraper
    let thumbnailUrl: string | null = null
    try {
      const ogResult = await ogs({ url, timeout: 5000 })
      if (ogResult.result.ogImage && ogResult.result.ogImage.length > 0) {
        thumbnailUrl = ogResult.result.ogImage[0].url || null
      }
    } catch {
      // OG scraper failed, continue without thumbnail
    }

    return {
      title,
      description: tweetText,
      thumbnailUrl,
      platform: 'twitter',
      originalDate: null,
      authorName: data.author_name || null,
    }
  } catch (error) {
    // Return fallback on error
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
