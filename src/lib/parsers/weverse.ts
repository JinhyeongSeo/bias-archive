/**
 * Weverse metadata parser
 * Uses Open Graph scraper for Weverse content
 * Supports: weverse.io/artist/media, weverse.io/artist/moments
 */

import ogs from 'open-graph-scraper'
import type { VideoMetadata } from './index'

/**
 * Parse Weverse URL and extract metadata
 * @param url - Weverse URL
 * @returns VideoMetadata with Weverse-specific handling
 */
export async function parseWeverse(url: string): Promise<VideoMetadata> {
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

    return {
      title: result.ogTitle || result.twitterTitle || null,
      description: result.ogDescription || result.twitterDescription || null,
      thumbnailUrl,
      platform: 'weverse',
      originalDate: result.ogDate || result.articlePublishedTime || null,
      authorName: result.author || result.ogSiteName || null,
    }
  } catch (error) {
    console.error('[Weverse Parser] Error:', error)

    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'weverse',
      originalDate: null,
      authorName: null,
    }
  }
}
