/**
 * heye.kr community parser
 * Custom HTML parsing for Korean idol community posts
 * (No OG metadata available, requires HTML scraping)
 */

import * as cheerio from 'cheerio'
import type { VideoMetadata, ParsedMedia, MediaType } from './index'

/**
 * Parse heye.kr board post and extract images/GIFs
 * @param url - heye.kr board URL (e.g., https://www.heye.kr/board/index.html?id=idol&no=12345)
 * @returns VideoMetadata with all images extracted
 */
export async function parseHeye(url: string): Promise<VideoMetadata> {
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

    // Extract title from <title> tag
    let title = $('title').text().trim()
    // Clean up title (remove site suffix if present)
    if (title.includes(' - ')) {
      title = title.split(' - ')[0].trim()
    }
    if (title.includes(' | ')) {
      title = title.split(' | ')[0].trim()
    }

    // Extract date from "등록일: YY-MM-DD" pattern
    let originalDate: string | null = null
    const pageText = $('body').text()
    const dateMatch = pageText.match(/등록일\s*:\s*(\d{2}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2})/)
    if (dateMatch) {
      const datePart = dateMatch[1]
      // Convert YY-MM-DD to YYYY-MM-DD
      if (datePart.length === 8) {
        originalDate = `20${datePart}`
      } else {
        originalDate = datePart
      }
    }

    // Extract author (near level icon or nickname area)
    let authorName: string | null = null
    // Try to find author from various patterns
    const authorMatch = pageText.match(/작성자\s*:\s*([^\s\n]+)/)
    if (authorMatch) {
      authorName = authorMatch[1].trim()
    }

    // Extract all images from #div_content
    const contentDiv = $('#div_content')
    const media: ParsedMedia[] = []
    const seenUrls = new Set<string>()

    contentDiv.find('img').each((_, img) => {
      let src = $(img).attr('src')
      if (!src) return

      // Convert relative URL to absolute
      if (src.startsWith('/')) {
        src = `https://www.heye.kr${src}`
      } else if (src.startsWith('./')) {
        src = `https://www.heye.kr${src.substring(1)}`
      } else if (!src.startsWith('http')) {
        // Handle other relative paths
        const urlObj = new URL(url)
        src = `${urlObj.origin}/${src}`
      }

      // Skip duplicate URLs
      if (seenUrls.has(src)) return
      seenUrls.add(src)

      // Skip small icons, emoticons, etc.
      if (src.includes('/icon/') || src.includes('/emoticon/') || src.includes('/level/')) {
        return
      }

      // Determine media type
      const lowerSrc = src.toLowerCase()
      let type: MediaType = 'image'
      if (lowerSrc.endsWith('.gif') || lowerSrc.includes('.gif?')) {
        type = 'gif'
      }

      media.push({ url: src, type })
    })

    // First image is thumbnail
    const thumbnailUrl = media.length > 0 ? media[0].url : null

    return {
      title: title || null,
      description: null,
      thumbnailUrl,
      platform: 'heye',
      originalDate,
      authorName,
      media: media.length > 0 ? media : undefined,
    }
  } catch (error) {
    console.error('[Heye Parser] Error:', error)

    // Return default values on error
    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'heye',
      originalDate: null,
      authorName: null,
    }
  }
}
