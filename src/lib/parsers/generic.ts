/**
 * Generic metadata parser
 * Uses Open Graph scraper for any URL with OG/Twitter Card metadata
 */

import ogs from 'open-graph-scraper'
import type { VideoMetadata } from './index'

/**
 * Parse any URL and extract OG/Twitter Card metadata
 * @param url - Any valid URL
 * @returns VideoMetadata extracted from Open Graph or Twitter Card tags
 */
export async function parseGeneric(url: string): Promise<VideoMetadata> {
  try {
    const { result, error } = await ogs({
      url,
      timeout: 5000,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BiasArchiveBot/1.0)',
        },
      },
    })

    if (error) {
      throw new Error('Open Graph scraping failed')
    }

    // Get best available image
    let thumbnailUrl: string | null = null
    if (result.ogImage && result.ogImage.length > 0) {
      thumbnailUrl = result.ogImage[0].url
    } else if (result.twitterImage && result.twitterImage.length > 0) {
      thumbnailUrl = result.twitterImage[0].url
    }

    return {
      title: result.ogTitle || result.twitterTitle || result.dcTitle || null,
      description: result.ogDescription || result.twitterDescription || result.dcDescription || null,
      thumbnailUrl,
      platform: 'other',
      originalDate: result.ogDate || result.articlePublishedTime || null,
      authorName: result.author || result.ogArticleAuthor || null,
    }
  } catch (error) {
    console.error('[Generic Parser] Error:', error)

    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'other',
      originalDate: null,
      authorName: null,
    }
  }
}
