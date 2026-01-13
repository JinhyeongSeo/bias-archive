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
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1', 10)

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
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const results: HeyeSearchResult[] = []

    // Parse search results from the board list
    // heye.kr uses a table-based layout for post listings
    $('tr').each((_, row) => {
      const $row = $(row)

      // Find the link to the post
      const $link = $row.find('a[href*="no="]')
      if (!$link.length) return

      const href = $link.attr('href')
      if (!href) return

      // Extract post number from href
      const noMatch = href.match(/no=(\d+)/)
      if (!noMatch) return

      const postNo = noMatch[1]
      const title = $link.text().trim()

      // Skip if title is empty or too short (likely navigation)
      if (!title || title.length < 2) return

      // Build absolute URL
      const url = `https://www.heye.kr/board/index.html?id=idol&no=${postNo}`

      // Try to find author (usually in a separate column)
      let author = ''
      const $cells = $row.find('td')
      if ($cells.length >= 3) {
        // Author is typically in the 3rd column
        author = $cells.eq(2).text().trim()
      }

      // Try to find thumbnail in the row
      let thumbnailUrl: string | null = null
      const $img = $row.find('img[src*="heye.kr"]')
      if ($img.length) {
        thumbnailUrl = $img.attr('src') || null
      }

      results.push({
        url,
        title,
        thumbnailUrl,
        author,
      })
    })

    // Extract total pages from pagination
    let totalPages = 1
    const $pagination = $('.pagination, .paging, [class*="page"]')

    // Find the last page number
    $pagination.find('a').each((_, el) => {
      const text = $(el).text().trim()
      const pageNum = parseInt(text, 10)
      if (!isNaN(pageNum) && pageNum > totalPages) {
        totalPages = pageNum
      }
    })

    // Also check for "마지막" or "끝" links
    const lastPageLink = $pagination.find('a[href*="page="]').last()
    if (lastPageLink.length) {
      const href = lastPageLink.attr('href') || ''
      const pageMatch = href.match(/page=(\d+)/)
      if (pageMatch) {
        const lastPage = parseInt(pageMatch[1], 10)
        if (lastPage > totalPages) {
          totalPages = lastPage
        }
      }
    }

    const responseData: HeyeSearchResponse = {
      results,
      totalPages,
      currentPage: page,
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
