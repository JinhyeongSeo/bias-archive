/**
 * kgirls.net community parser
 * Custom HTML parsing for Korean idol community posts (XE CMS based)
 * Supports both /mgall and /issue boards
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

      if (seenUrls.has(absoluteUrl)) return
      seenUrls.add(absoluteUrl)

      const lowerSrc = absoluteUrl.toLowerCase()
      let type: MediaType = mediaType || 'image'
      if (!mediaType) {
        if (lowerSrc.endsWith('.gif')) {
          type = 'gif'
        } else if (lowerSrc.endsWith('.mp4') || lowerSrc.endsWith('.webm') || lowerSrc.endsWith('.mov')) {
          type = 'video'
        }
      }
      media.push({ url: absoluteUrl, type })
    }

    // Pattern 1: Images in content area
    // kgirls.net uses /files/ path for uploaded content
    $('.bd img, .document_content img, .content img, article img').each((_, el) => {
      const src = $(el).attr('src')
      if (src && src.includes('/files/')) {
        // Skip thumbnails, get full size
        const fullSrc = src.replace(/\/\d+x\d+\.fill\./, '/').replace(/\?.*$/, '')
        addMedia(fullSrc)
      }
    })

    // Pattern 2: Attached files (videos, images)
    // XE CMS stores attachments with specific patterns
    $('a[href*="/files/attach/"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        const lowerHref = href.toLowerCase()
        if (lowerHref.match(/\.(jpg|jpeg|png|gif|mp4|webm|mov)(\?|$)/)) {
          addMedia(href)
        }
      }
    })

    // Pattern 3: Regex for kgirls.net file URLs in raw HTML
    // /files/attach/images/... or /files/thumbnails/...
    const filePattern = /\/files\/(attach|thumbnails)\/[^"'\s]+\.(jpg|jpeg|png|gif|mp4|webm|mov)/gi
    for (const match of html.matchAll(filePattern)) {
      let src = match[0]
      // Skip thumbnail versions, prefer full images
      if (!src.includes('/100x100.') && !src.includes('/thumb_')) {
        addMedia(src)
      }
    }

    // Pattern 4: Direct image URLs in HTML
    const imgPattern = /https?:\/\/(?:www\.)?kgirls\.net\/files\/[^"'\s]+\.(jpg|jpeg|png|gif)/gi
    for (const match of html.matchAll(imgPattern)) {
      if (!match[0].includes('/100x100.') && !match[0].includes('/thumb_')) {
        addMedia(match[0])
      }
    }

    // First image is thumbnail
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
