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
    // oEmbed failed, try OG scraper as fallback
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Twitter Parser] Timeout fetching oEmbed')
    } else {
      console.error('[Twitter Parser] oEmbed failed, trying OG scraper:', error)
    }

    // Fallback to OG scraper for basic metadata
    try {
      const ogResult = await ogs({ url, timeout: 5000 })
      const result = ogResult.result

      const title = result.ogTitle || result.twitterTitle || null
      const thumbnailUrl = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null
      const description = result.ogDescription || result.twitterDescription || null

      return {
        title,
        description,
        thumbnailUrl,
        platform: 'twitter',
        originalDate: null,
        authorName: null,
      }
    } catch (ogError) {
      console.error('[Twitter Parser] OG scraper also failed:', ogError)
      return {
        title: url,
        description: null,
        thumbnailUrl: null,
        platform: 'twitter',
        originalDate: null,
        authorName: null,
      }
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
