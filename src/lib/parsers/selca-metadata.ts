/**
 * selca.kastden.org metadata parser
 * Extracts image metadata from selca media pages for viewer support
 */

import { parse } from 'node-html-parser'
import type { VideoMetadata, ParsedMedia } from './index'

const BASE_URL = 'https://selca.kastden.org'
const TIMEOUT_MS = 30000

/**
 * Parse selca.kastden.org media/owner page and extract images
 * @param url - selca.kastden.org URL (e.g., https://selca.kastden.org/media/123/)
 * @returns VideoMetadata with images extracted as media
 */
export async function parseSelcaMetadata(url: string): Promise<VideoMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const root = parse(html)

    // Extract OG metadata
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content') || null
    const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || null
    const ogDesc = root.querySelector('meta[property="og:description"]')?.getAttribute('content') || null

    // Fallback to <title> tag
    const titleTag = root.querySelector('title')?.textContent?.trim() || null
    const title = ogTitle || titleTag

    // Extract original image URLs from the page
    const media: ParsedMedia[] = []
    const seenUrls = new Set<string>()

    // Pattern 1: /original/{id}/{filename} links (full-size images)
    const originalLinks = root.querySelectorAll('a[href*="/original/"]')
    for (const link of originalLinks) {
      const href = link.getAttribute('href')
      if (!href) continue
      const imageUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`
      if (!seenUrls.has(imageUrl)) {
        seenUrls.add(imageUrl)
        media.push({ type: 'image', url: imageUrl })
      }
    }

    // Pattern 2: img tags with /original/ src (inline images)
    const originalImgs = root.querySelectorAll('img[src*="/original/"]')
    for (const img of originalImgs) {
      const src = img.getAttribute('src')
      if (!src) continue
      const imageUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`
      if (!seenUrls.has(imageUrl)) {
        seenUrls.add(imageUrl)
        media.push({ type: 'image', url: imageUrl })
      }
    }

    // Pattern 3: If no original images found, try thumbnail as fallback
    if (media.length === 0 && ogImage) {
      const imageUrl = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`
      media.push({ type: 'image', url: imageUrl })
    }

    // If still no media, try /thumb/ images
    if (media.length === 0) {
      const thumbImgs = root.querySelectorAll('img[src*="/thumb/"]')
      for (const img of thumbImgs) {
        const src = img.getAttribute('src')
        if (!src) continue
        const imageUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`
        if (!seenUrls.has(imageUrl)) {
          seenUrls.add(imageUrl)
          media.push({ type: 'image', url: imageUrl })
        }
      }
    }

    // Extract author from URL or page content
    let authorName: string | null = null
    // Try to find "Posted by ..." pattern
    const pageText = root.textContent || ''
    const authorMatch = pageText.match(/Posted by\s+(\S+)/)
    if (authorMatch) {
      authorName = authorMatch[1]
    }

    const thumbnailUrl = ogImage
      ? (ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`)
      : (media.length > 0 ? media[0].url : null)

    return {
      title,
      description: ogDesc,
      thumbnailUrl,
      platform: 'selca',
      originalDate: null,
      authorName,
      media: media.length > 0 ? media : undefined,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Selca Metadata Parser] Timeout')
    } else {
      console.error('[Selca Metadata Parser] Error:', error)
    }

    return {
      title: url,
      description: null,
      thumbnailUrl: null,
      platform: 'selca',
      originalDate: null,
      authorName: null,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
