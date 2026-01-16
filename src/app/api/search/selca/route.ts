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

    // Step 2: Fetch idol's owner page
    // NOTE: 페이지네이션 미구현 (max_time_id 추적 필요)
    const ownerUrl = `${BASE_URL}/owner/${idolSlug}/`
    const html = await fetchHtmlFromSelca(ownerUrl)
    const root = parse(html)

    // Step 3: Parse media items
    const results: SelcaSearchResult[] = []
    const seenUrls = new Set<string>()

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

    // Step 4: Pagination (미구현)
    // selca.kastden.org는 무한 스크롤 방식으로 max_time_id 파라미터 사용
    // Phase 30에서 구현 예정
    const hasNextPage = false

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
