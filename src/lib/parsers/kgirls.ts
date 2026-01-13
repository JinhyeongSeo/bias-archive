/**
 * kgirls.net community parser
 * Custom HTML parsing for Korean idol community posts (XE CMS based)
 * Supports both /mgall and /issue boards
 */

import * as cheerio from 'cheerio'
import type { VideoMetadata, ParsedMedia, MediaType } from './index'

/**
 * Convert thumbnail URL to larger size or full image
 * kgirls.net thumbnail pattern: /files/thumbnails/{id}/{id}/{num}/100x100.fill.jpg?t=...
 * Try larger sizes: 320x480, 640x960, or original
 */
function convertThumbnailToLarger(thumbnailUrl: string): string {
  // Remove query string
  let url = thumbnailUrl.split('?')[0]

  // Replace small thumbnail sizes with larger ones
  // 100x100 -> 640x960 (largest commonly available)
  url = url.replace(/\/100x100\.fill\./, '/640x960.fill.')
  url = url.replace(/\/320x480\.fill\./, '/640x960.fill.')

  return url
}

/**
 * Parse kgirls.net board post and extract images/GIFs/videos
 * @param url - kgirls.net board URL (e.g., https://www.kgirls.net/mgall/123456)
 * @returns VideoMetadata with all media extracted
 */
export async function parseKgirls(url: string): Promise<VideoMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.kgirls.net/',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract title from <h2> or <title> tag
    let title = $('h2').first().text().trim()
    if (!title) {
      title = $('title').text().trim()
      // Clean up title (remove site suffix if present)
      if (title.includes(' - ')) {
        title = title.split(' - ')[0].trim()
      }
    }

    // Extract date from page content
    // Pattern: "YYYY.MM.DD HH:MM" or similar
    let originalDate: string | null = null
    const pageText = $('body').text()
    const dateMatch = pageText.match(/(\d{4}[.\-/]\d{2}[.\-/]\d{2})/)
    if (dateMatch) {
      // Normalize date format to YYYY-MM-DD
      originalDate = dateMatch[1].replace(/[./]/g, '-')
    }

    // Extract author
    let authorName: string | null = null
    // Look for author in common XE CMS patterns
    const authorArea = $('.no_img, .nick, [class*="author"], [class*="writer"]').first()
    if (authorArea.length) {
      authorName = authorArea.text().trim()
    }

    // Extract media from post content
    const media: ParsedMedia[] = []
    const seenUrls = new Set<string>()

    // Helper to add media if not duplicate
    const addMedia = (src: string, mediaType?: MediaType) => {
      // Make URL absolute if relative
      let absoluteUrl = src
      if (src.startsWith('/')) {
        absoluteUrl = `https://www.kgirls.net${src}`
      } else if (!src.startsWith('http')) {
        absoluteUrl = `https://www.kgirls.net/${src}`
      }

      // Normalize URL for dedup (remove query string for comparison)
      const normalizedUrl = absoluteUrl.split('?')[0]
      if (seenUrls.has(normalizedUrl)) return
      seenUrls.add(normalizedUrl)

      const lowerSrc = absoluteUrl.toLowerCase()
      let type: MediaType = mediaType || 'image'
      if (!mediaType) {
        if (lowerSrc.includes('.gif')) {
          type = 'gif'
        } else if (lowerSrc.includes('.mp4') || lowerSrc.includes('.webm') || lowerSrc.includes('.mov')) {
          type = 'video'
        }
      }
      media.push({ url: absoluteUrl, type })
    }

    // Pattern 1: All images with /files/ path (including thumbnails)
    $('img[src*="/files/"]').each((_, el) => {
      const src = $(el).attr('src')
      if (src) {
        // Convert thumbnail to larger size
        const largerSrc = convertThumbnailToLarger(src)
        addMedia(largerSrc)
      }
    })

    // Pattern 2: Thumbnail images in specific sizes
    // /files/thumbnails/{id}/{id}/{num}/{size}.fill.jpg
    const thumbnailPattern = /\/files\/thumbnails\/[^"'\s]+\.(jpg|jpeg|png|gif)/gi
    for (const match of html.matchAll(thumbnailPattern)) {
      const src = convertThumbnailToLarger(match[0])
      // Skip 100x100 small thumbnails after conversion
      if (!src.includes('/100x100.')) {
        addMedia(src)
      }
    }

    // Pattern 3: Attached files links (videos, images)
    // XE CMS download links
    $('a[href*="file_srl"]').each((_, el) => {
      const href = $(el).attr('href')
      const text = $(el).text().toLowerCase()
      if (href && (text.includes('.mp4') || text.includes('.mov') || text.includes('.webm'))) {
        // This is a video download link
        const fullUrl = href.startsWith('http') ? href : `https://www.kgirls.net${href}`
        addMedia(fullUrl, 'video')
      }
    })

    // Pattern 4: Direct file attach links
    $('a[href*="/files/attach/"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        const lowerHref = href.toLowerCase()
        if (lowerHref.match(/\.(jpg|jpeg|png|gif|mp4|webm|mov)/)) {
          addMedia(href)
        }
      }
    })

    // Pattern 5: Regex for any kgirls.net file URLs in raw HTML
    const filePattern = /\/files\/[^"'\s<>]+\.(jpg|jpeg|png|gif|mp4|webm|mov)/gi
    for (const match of html.matchAll(filePattern)) {
      let src = match[0]
      // Convert thumbnails to larger size
      src = convertThumbnailToLarger(src)
      // Skip small thumbnails
      if (!src.includes('/100x100.')) {
        addMedia(src)
      }
    }

    // First image is thumbnail (prefer larger version)
    const thumbnailUrl = media.length > 0 ? media[0].url : null

    return {
      title: title || null,
      description: null,
      thumbnailUrl,
      platform: 'kgirls',
      originalDate,
      authorName,
      media: media.length > 0 ? media : undefined,
    }
  } catch (error) {
    console.error('[Kgirls Parser] Error:', error)

    // Return default values on error
    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'kgirls',
      originalDate: null,
      authorName: null,
    }
  }
}
