/**
 * heye.kr Search API
 * Searches heye.kr community board and returns post listings with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface HeyeSearchResult {
  url: string
  title: string
  thumbnailUrl: string | null
  author: string
}

interface HeyeSearchResponse {
  results: HeyeSearchResult[]
  totalPages: number
  currentPage: number
  totalResults: number
  hasMore: boolean
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '0', 10) // 0 means no limit
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    // heye.kr search URL
    const searchUrl = `https://www.heye.kr/board/index.html?id=idol&smode=both&skey=${encodeURIComponent(query)}&page=${page}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const results: HeyeSearchResult[] = []
    const seenUrls = new Set<string>()

    // Parse search results - heye.kr uses td with links containing &no= parameter
    // Pattern: <td align="left"><a href="./index.html?id=idol&smode=both&skey=...&page=X&no=YYYYY">Title</a>
    $('td[align="left"] > a[href*="&no="]').each((_, el) => {
      const $link = $(el)
      const href = $link.attr('href')
      if (!href) return

      // Extract post number from href
      const noMatch = href.match(/no=(\d+)/)
      if (!noMatch) return

      const postNo = noMatch[1]

      // Get title - remove font tags and clean up
      let title = $link.text().trim()
      // Remove comment count like [3] at the end
      title = title.replace(/\s*\[\d+\]\s*$/, '').trim()

      // Skip if title is empty or too short
      if (!title || title.length < 2) return

      // Build absolute URL (clean URL without search params)
      const url = `https://www.heye.kr/board/index.html?id=idol&no=${postNo}`

      // Skip duplicates
      if (seenUrls.has(url)) return
      seenUrls.add(url)

      // Try to find author in the same row
      // Author is typically in a td with class "list_unick"
      let author = ''
      const $row = $link.closest('tr')
      const $authorCell = $row.find('td.list_unick a')
      if ($authorCell.length) {
        // Get text after the level icon
        author = $authorCell.text().trim()
      }

      results.push({
        url,
        title,
        thumbnailUrl: null, // heye.kr search results don't have thumbnails in list view
        author,
      })
    })

    // Extract total pages from pagination
    // Pattern: <span class='num'>...<a href='?id=idol&smode=both&skey=카리나&page=10'>10</a>...</span>
    let totalPages = 1

    // Find all page links and get the maximum page number
    $('span.num a[href*="page="]').each((_, el) => {
      const href = $(el).attr('href') || ''
      const pageMatch = href.match(/page=(\d+)/)
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1], 10)
        if (pageNum > totalPages) {
          totalPages = pageNum
        }
      }
    })

    // Also check the text content for page numbers
    const paginationText = $('span.num').text()
    const pageNumbers = paginationText.match(/\d+/g)
    if (pageNumbers) {
      for (const numStr of pageNumbers) {
        const num = parseInt(numStr, 10)
        if (num > totalPages && num < 1000) { // sanity check
          totalPages = num
        }
      }
    }

    // Apply offset and limit for client-side pagination within a page
    const totalResults = results.length
    const paginatedResults = limit > 0
      ? results.slice(offset, offset + limit)
      : results.slice(offset)

    // Check if there are more results available
    const hasMoreInPage = offset + paginatedResults.length < totalResults
    const hasMorePages = totalPages > page
    const hasMore = hasMoreInPage || hasMorePages

    const responseData: HeyeSearchResponse = {
      results: paginatedResults,
      totalPages,
      currentPage: page,
      totalResults,
      hasMore,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[Heye Search] Error:', error)
    return NextResponse.json(
      { error: 'heye.kr 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
