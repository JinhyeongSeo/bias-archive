/**
 * kgirls.net Search API
 * Searches kgirls.net community boards (mgall, issue) and returns post listings with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface KgirlsSearchResult {
  url: string
  title: string
  thumbnailUrl: string | null
  author: string
}

interface KgirlsSearchResponse {
  results: KgirlsSearchResult[]
  totalPages: number
  currentPage: number
  totalResults: number
  hasMore: boolean
}

/**
 * Convert thumbnail URL to larger size
 * kgirls.net thumbnail pattern: /files/thumbnails/{id}/{id}/{num}/100x100.fill.jpg?t=...
 */
function convertThumbnailToLarger(thumbnailUrl: string): string {
  let url = thumbnailUrl.split('?')[0]
  // Replace small sizes with larger
  url = url.replace(/\/100x100\.fill\./, '/320x480.fill.')
  return url
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const board = searchParams.get('board') || 'mgall' // mgall or issue
  const limit = parseInt(searchParams.get('limit') || '0', 10) // 0 means no limit
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    // kgirls.net search URL
    // XE CMS uses search_target and search_keyword parameters
    const searchUrl = `https://www.kgirls.net/${board}?search_target=title&search_keyword=${encodeURIComponent(query)}&page=${page}`

    const response = await fetch(searchUrl, {
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

    const results: KgirlsSearchResult[] = []
    const seenUrls = new Set<string>()

    // Collect all thumbnails using regex (more reliable than Cheerio selectors)
    const thumbnails: string[] = []
    const thumbPattern = /src="(\/files\/thumbnails\/[^"]+)"/g
    let thumbMatch
    while ((thumbMatch = thumbPattern.exec(html)) !== null) {
      const src = thumbMatch[1]
      const absoluteUrl = `https://www.kgirls.net${src}`
      thumbnails.push(convertThumbnailToLarger(absoluteUrl))
    }
    console.log('[Kgirls Search] Found thumbnails:', thumbnails.length)

    // Collect all post IDs in order using regex
    const postIds: string[] = []
    const postPattern = new RegExp(`href="/${board}/(\\d+)[^"]*"`, 'g')
    let postMatch
    while ((postMatch = postPattern.exec(html)) !== null) {
      const postId = postMatch[1]
      if (!postIds.includes(postId)) {
        postIds.push(postId)
      }
    }
    console.log('[Kgirls Search] Found postIds:', postIds.length)

    // Build results by matching postIds with thumbnails (same order)
    postIds.forEach((postId, index) => {
      // Find the title for this post
      const $links = $(`a[href^="/${board}/${postId}"]`)
      let title = ''
      $links.each((_, el) => {
        const text = $(el).text().trim()
        // Skip navigation, numbers, empty titles
        if (!text || text.length < 2) return
        if (/^\d+$/.test(text)) return
        if (['이전', '다음', '처음', '마지막', '_NEW_'].includes(text)) return
        if (!title) {
          title = text.replace(/_NEW_/g, '').trim()
        }
      })

      if (!title) return

      const url = `https://www.kgirls.net/${board}/${postId}`
      if (seenUrls.has(url)) return
      seenUrls.add(url)

      results.push({
        url,
        title,
        thumbnailUrl: thumbnails[index] || null,
        author: '',
      })
    })
    console.log('[Kgirls Search] Final results:', results.length, 'with thumbnails:', results.filter(r => r.thumbnailUrl).length)

    // Extract total pages from pagination
    // XE CMS pagination typically uses numbered links
    let totalPages = 1

    // Find pagination links with page parameter
    $('a[href*="page="]').each((_, el) => {
      const href = $(el).attr('href') || ''
      const pageMatch = href.match(/page=(\d+)/)
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1], 10)
        if (pageNum > totalPages && pageNum < 1000) { // sanity check
          totalPages = pageNum
        }
      }
    })

    // Also check text content for page numbers in pagination area
    $('.pagination, .paginate, .paging').find('a, span').each((_, el) => {
      const text = $(el).text().trim()
      const num = parseInt(text, 10)
      if (!isNaN(num) && num > totalPages && num < 1000) {
        totalPages = num
      }
    })

    // Apply offset and limit for client-side pagination within a page
    const totalResults = results.length
    const paginatedResults = limit > 0
      ? results.slice(offset, offset + limit)
      : results.slice(offset)

    // Check if there are more results available
    const hasMoreInPage = offset + paginatedResults.length < totalResults
    const hasMorePages = totalPages > page
    const hasMore = hasMoreInPage || hasMorePages

    const responseData: KgirlsSearchResponse = {
      results: paginatedResults,
      totalPages,
      currentPage: page,
      totalResults,
      hasMore,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[Kgirls Search] Error:', error)
    return NextResponse.json(
      { error: 'kgirls.net 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
