import ogs from 'open-graph-scraper'

export type Platform = 'youtube' | 'twitter' | 'weverse' | 'other'

export interface LinkMetadata {
  title: string | null
  description: string | null
  thumbnailUrl: string | null
  platform: Platform
  originalDate: string | null
  authorName: string | null
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): Platform {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // YouTube patterns
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }

    // Twitter patterns
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter'
    }

    // Weverse patterns
    if (hostname.includes('weverse.io')) {
      return 'weverse'
    }

    return 'other'
  } catch {
    return 'other'
  }
}

/**
 * Extract metadata from YouTube using oEmbed API
 */
async function extractYouTubeMetadata(url: string): Promise<LinkMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const response = await fetch(oembedUrl, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`YouTube oEmbed failed: ${response.status}`)
    }

    const data = await response.json()

    return {
      title: data.title || null,
      description: null, // oEmbed doesn't provide description
      thumbnailUrl: data.thumbnail_url || null,
      platform: 'youtube',
      originalDate: null, // oEmbed doesn't provide date
      authorName: data.author_name || null,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Extract metadata from Twitter using oEmbed API
 */
async function extractTwitterMetadata(url: string): Promise<LinkMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
    const response = await fetch(oembedUrl, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`Twitter oEmbed failed: ${response.status}`)
    }

    const data = await response.json()

    // Twitter oEmbed returns HTML, we extract text from it
    const htmlContent = data.html || ''
    // Extract tweet text from the blockquote - simple extraction
    const tweetTextMatch = htmlContent.match(/<p[^>]*>([^<]+)<\/p>/)
    const tweetText = tweetTextMatch ? tweetTextMatch[1] : null

    return {
      title: tweetText || data.author_name ? `${data.author_name}의 트윗` : null,
      description: tweetText,
      thumbnailUrl: null, // Twitter oEmbed doesn't provide thumbnail
      platform: 'twitter',
      originalDate: null,
      authorName: data.author_name || null,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Extract metadata using Open Graph scraper for other URLs
 */
async function extractOpenGraphMetadata(url: string): Promise<LinkMetadata> {
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
  } catch {
    return {
      title: null,
      description: null,
      thumbnailUrl: null,
      platform: 'other',
      originalDate: null,
      authorName: null,
    }
  }
}

/**
 * Extract metadata from URL based on platform
 */
export async function extractMetadata(url: string): Promise<LinkMetadata> {
  const platform = detectPlatform(url)

  switch (platform) {
    case 'youtube':
      return extractYouTubeMetadata(url)
    case 'twitter':
      return extractTwitterMetadata(url)
    default:
      return extractOpenGraphMetadata(url)
  }
}
