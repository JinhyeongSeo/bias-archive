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
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const board = searchParams.get('board') || 'mgall' // mgall or issue

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
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const results: KgirlsSearchResult[] = []
    const seenUrls = new Set<string>()

    // Parse search results
    // kgirls.net uses list items with thumbnails and links
    // Pattern: <a href="/mgall/123456?search_target=...">Title</a>
    $('a[href^="/' + board + '/"]').each((_, el) => {
      const $link = $(el)
      const href = $link.attr('href')
      if (!href) return

      // Extract post ID from href - pattern: /mgall/123456 or /issue/123456
      const postMatch = href.match(new RegExp(`^/${board}/(\\d+)`))
      if (!postMatch) return

      const postId = postMatch[1]

      // Get title from link text
      let title = $link.text().trim()

      // Skip navigation links and empty titles
      if (!title || title.length < 2) return
      // Skip if it's just a number (thumbnail link)
      if (/^\d+$/.test(title)) return
      // Skip common navigation text
      if (['이전', '다음', '처음', '마지막'].includes(title)) return

      // Build clean URL (without search params)
      const url = `https://www.kgirls.net/${board}/${postId}`

      // Skip duplicates
      if (seenUrls.has(url)) return
      seenUrls.add(url)

      // Try to find thumbnail - look for img in the same container or nearby
      let thumbnailUrl: string | null = null
      const $parent = $link.closest('li, tr, div')
      const $img = $parent.find('img[src*="/files/thumbnails/"]').first()
      if ($img.length) {
        const src = $img.attr('src')
        if (src) {
          // Convert relative URL to absolute
          thumbnailUrl = src.startsWith('http') ? src : `https://www.kgirls.net${src}`
        }
      }

      // Try to find author
      let author = ''
      // Look for author text in the same list item
      const $authorArea = $parent.find('.no_img, .nick, [class*="author"]')
      if ($authorArea.length) {
        author = $authorArea.first().text().trim()
      }

      results.push({
        url,
        title,
        thumbnailUrl,
        author,
      })
    })

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

    const responseData: KgirlsSearchResponse = {
      results,
      totalPages,
      currentPage: page,
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
