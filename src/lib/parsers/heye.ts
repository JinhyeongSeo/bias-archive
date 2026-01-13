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

    // Extract images using regex (content is loaded via JavaScript, so DOM parsing doesn't work)
    // Look for img1.heye.kr image URLs in the HTML source
    const media: ParsedMedia[] = []
    const seenUrls = new Set<string>()

    // Pattern: https://img1.heye.kr/image/idol/YYYY/MM/timestamp.jpeg|jpg|png|gif
    const imagePattern = /https?:\/\/img1\.heye\.kr\/image\/idol\/\d{4}\/\d{2}\/\d+\.(jpeg|jpg|png|gif)/gi
    const matches = html.matchAll(imagePattern)

    for (const match of matches) {
      const src = match[0]

      // Skip duplicate URLs
      if (seenUrls.has(src)) continue
      seenUrls.add(src)

      // Determine media type
      const lowerSrc = src.toLowerCase()
      let type: MediaType = 'image'
      if (lowerSrc.endsWith('.gif')) {
        type = 'gif'
      }

      media.push({ url: src, type })
    }

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
