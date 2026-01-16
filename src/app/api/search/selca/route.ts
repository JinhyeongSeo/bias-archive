/**
 * selca.kastden.org Search API
 *
 * 아이돌 이름으로 selca.kastden.org 검색, 미디어 목록 반환
 *
 * @remarks
 * - slug 직접 전달: Bias.selca_slug 사용 시 즉시 검색 (권장)
 * - 이름 검색: searchMembers 호출 후 매칭 (타임아웃 가능성)
 */

import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'node-html-parser'
import { searchMembers, fetchHtmlFromSelca } from '@/lib/parsers/selca'
import { SelcaSearchResult, SelcaSearchResponse } from '@/lib/selca-types'

const BASE_URL = 'https://selca.kastden.org'

/** slug 형식 패턴: 영문 소문자, 숫자, 언더스코어만 허용 */
const SLUG_PATTERN = /^[a-z0-9_]+$/

/**
 * 미디어 URL에서 ID를 추출
 * @param href - /original/6753580/... 또는 /thumb/6753580.jpg 형식
 * @returns 미디어 ID 또는 null
 */
function extractMediaId(href: string): string | null {
  const originalMatch = href.match(/\/original\/(\d+)\//)
  const thumbMatch = href.match(/\/thumb\/(\d+)\.jpg/)
  return originalMatch?.[1] || thumbMatch?.[1] || null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const maxTimeId = searchParams.get('maxTimeId')

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    // Step 1: Determine idol slug
    let idolSlug: string
    let idolName: string

    // slug 형식 감지: 언더스코어 포함 + 영문소문자/숫자만
    // 예: "aespa_winter", "ive_yujin"
    if (query.includes('_') && SLUG_PATTERN.test(query)) {
      // Query is already a slug - use it directly (Bias.selca_slug 활용)
      idolSlug = query
      idolName = query.replace(/_/g, ' ')
      console.log(`[Selca Search API] Using slug directly: "${idolSlug}"`)
    } else {
      // Query is not a slug - search for matching idol
      // NOTE: searchMembers는 @deprecated, 타임아웃 가능성 있음
      console.log(`[Selca Search API] Searching for idol: "${query}"`)
      const idols = await searchMembers(query)

      if (idols.length === 0) {
        return NextResponse.json(
          {
            error: '매칭되는 아이돌을 찾을 수 없습니다',
            hint: '영문 이름이나 아이돌 드롭다운을 사용해보세요',
          },
          { status: 404 }
        )
      }

      const idol = idols[0]
      idolSlug = idol.id
      idolName = idol.name_original || idol.name
    }

    // Step 2: Fetch idol's owner page with pagination
    const params = new URLSearchParams()
    if (maxTimeId) {
      params.set('max_time_id', maxTimeId)
    }
    const ownerUrl = params.toString()
      ? `${BASE_URL}/owner/${idolSlug}/?${params}`
      : `${BASE_URL}/owner/${idolSlug}/`
    const html = await fetchHtmlFromSelca(ownerUrl)
    const root = parse(html)

    // Step 3: Parse media items and track nextMaxTimeId
    const results: SelcaSearchResult[] = []
    const seenUrls = new Set<string>()
    let nextMaxTimeId: string | null = null

    const mediaLinks = root.querySelectorAll('a[href^="/media/"], a[href^="/original/"]')

    for (const link of mediaLinks) {
      const href = link.getAttribute('href')
      if (!href) continue

      const url = `${BASE_URL}${href}`

      if (seenUrls.has(url)) continue
      seenUrls.add(url)

      const img = link.querySelector('img[src^="/thumb/"]')
      const thumbnailSrc = img?.getAttribute('src')
      const thumbnailUrl = thumbnailSrc ? `${BASE_URL}${thumbnailSrc}` : ''

      if (!thumbnailUrl) continue

      // Extract media ID for pagination tracking
      const mediaId = extractMediaId(thumbnailSrc || href)
      if (mediaId) {
        // Track the smallest (oldest) ID as nextMaxTimeId
        if (!nextMaxTimeId || parseInt(mediaId, 10) < parseInt(nextMaxTimeId, 10)) {
          nextMaxTimeId = mediaId
        }
      }

      let title = ''
      const parent = link.parentNode
      if (parent) {
        const textContent = parent.textContent?.trim() || ''
        const lines = textContent.split('\n').filter(line => {
          const trimmed = line.trim()
          return trimmed && !trimmed.startsWith('Posted by') && !trimmed.includes('ago')
        })
        if (lines.length > 0) {
          title = lines[0].trim().substring(0, 200)
        }
      }

      results.push({
        url,
        title: title || `${idolName} 미디어`,
        thumbnailUrl,
        author: idolName,
      })
    }

    // Step 4: Pagination - return all results (selca returns ~75 per page)
    // hasNextPage is true if we got results (more likely exist)
    const hasNextPage = results.length > 0 && nextMaxTimeId !== null

    const responseData: SelcaSearchResponse = {
      results,
      hasNextPage,
      currentPage: page,
      nextMaxTimeId: nextMaxTimeId || undefined,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[Selca Search] Error:', error)

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
