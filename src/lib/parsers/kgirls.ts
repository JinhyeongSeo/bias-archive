/**
 * kgirls.net community parser
 * Custom HTML parsing for Korean idol community posts (XE CMS based)
 * Supports both /mgall and /issue boards
 *
 * Actual content is in /files/attach/images/ path, NOT /files/thumbnails/
 * Video tags have: src="/files/attach/images/.../xxx.mp4" poster="/files/attach/images/.../xxx.jpg"
 */

import * as cheerio from 'cheerio'
import type { VideoMetadata, ParsedMedia, MediaType } from './index'

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
      // Skip thumbnails path - only use /files/attach/ for actual content
      if (src.includes('/files/thumbnails/')) return

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

    // Pattern 1: Video tags with src and poster attributes
    // <video src="/files/attach/images/.../xxx.mp4" poster="/files/attach/images/.../xxx.jpg">
    $('video[src*="/files/attach/"]').each((_, el) => {
      const src = $(el).attr('src')
      const poster = $(el).attr('poster')

      // Add video
      if (src) {
        addMedia(src, 'video')
      }
      // Add poster image as well (for thumbnail)
      if (poster && poster.includes('/files/attach/')) {
        addMedia(poster, 'image')
      }
    })

    // Pattern 2: Images in /files/attach/ path (actual content images)
    $('img[src*="/files/attach/"]').each((_, el) => {
      const src = $(el).attr('src')
      if (src) {
        addMedia(src)
      }
    })

    // Pattern 3: Regex for /files/attach/images/ URLs in raw HTML
    // This catches any URLs that might not be in standard tags
    const attachPattern = /\/files\/attach\/images\/[^"'\s<>]+\.(jpg|jpeg|png|gif|mp4|webm|mov)/gi
    for (const match of html.matchAll(attachPattern)) {
      addMedia(match[0])
    }

    // First image is thumbnail (prefer poster images for videos)
    const thumbnailUrl = media.length > 0
      ? media.find(m => m.type === 'image')?.url || media[0].url
      : null

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
