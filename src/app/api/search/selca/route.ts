/**
 * selca.kastden.org Search API
 * Searches selca.kastden.org by idol name and returns media listings with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'node-html-parser'
import { searchMembers } from '@/lib/parsers/selca'

interface SelcaSearchResult {
  url: string
  title: string
  thumbnailUrl: string
  author: string
}

interface SelcaSearchResponse {
  results: SelcaSearchResult[]
  hasNextPage: boolean
  currentPage: number
}

const BASE_URL = 'https://selca.kastden.org'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const TIMEOUT_MS = 5000

/**
 * Fetch HTML from URL with timeout and User-Agent
 */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    // Step 1: Search for matching idol
    const idols = await searchMembers(query)

    if (idols.length === 0) {
      return NextResponse.json(
        { error: '매칭되는 아이돌을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Use the first (most relevant) match
    const idol = idols[0]
    const idolSlug = idol.id // e.g., "ive_yujin"
    const idolName = idol.name_original || idol.name

    // Step 2: Fetch idol's owner page with pagination
    let ownerUrl = `${BASE_URL}/owner/${idolSlug}/`

    // Add max_time_id for pagination (if page > 1)
    // For now, we'll fetch the page and extract max_time_id from the "Next page" link
    // This is a simplified approach - in production you might want to track max_time_id across requests

    const html = await fetchHtml(ownerUrl)
    const root = parse(html)

    // Step 3: Parse media items
    const results: SelcaSearchResult[] = []
    const seenUrls = new Set<string>()

    // Find all media items
    // Pattern: <a href="/media/[ID]/" or "/original/[ID]/"><img src="/thumb/[ID].jpg"></a>
    const mediaLinks = root.querySelectorAll('a[href^="/media/"], a[href^="/original/"]')

    for (const link of mediaLinks) {
      const href = link.getAttribute('href')
      if (!href) continue

      // Build absolute URL
      const url = `${BASE_URL}${href}`

      // Skip duplicates
      if (seenUrls.has(url)) continue
      seenUrls.add(url)

      // Get thumbnail from img inside the link
      const img = link.querySelector('img[src^="/thumb/"]')
      const thumbnailSrc = img?.getAttribute('src')
      const thumbnailUrl = thumbnailSrc ? `${BASE_URL}${thumbnailSrc}` : ''

      if (!thumbnailUrl) continue

      // Get caption/title from nearby text (if any)
      // selca.kastden.org doesn't always have captions, so we'll use empty string
      let title = ''

      // Try to find caption in parent container
      const parent = link.parentNode
      if (parent) {
        const textContent = parent.textContent?.trim() || ''
        // Extract any meaningful text (excluding "Posted by" info)
        const lines = textContent.split('\n').filter(line => {
          const trimmed = line.trim()
          return trimmed && !trimmed.startsWith('Posted by') && !trimmed.includes('ago')
        })
        if (lines.length > 0) {
          title = lines[0].trim().substring(0, 200) // Limit length
        }
      }

      results.push({
        url,
        title: title || `${idolName} 미디어`, // Fallback to idol name
        thumbnailUrl,
        author: idolName,
      })
    }

    // Step 4: Check for next page
    let hasNextPage = false
    const nextPageLink = root.querySelector('a:contains("Next page")')
    if (nextPageLink) {
      hasNextPage = true
    }

    // Limit results per page
    const pageSize = 20
    const paginatedResults = results.slice(0, pageSize)

    const responseData: SelcaSearchResponse = {
      results: paginatedResults,
      hasNextPage,
      currentPage: page,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[Selca Search] Error:', error)

    // Check if it's a 404 (idol not found)
    if (error instanceof Error && error.message.includes('HTTP 404')) {
      return NextResponse.json(
        { error: '해당 아이돌의 페이지를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'selca.kastden.org 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
