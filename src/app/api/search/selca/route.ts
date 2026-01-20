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
import { createLogger } from '@/lib/logger'
import { handleApiError, badRequest, notFound } from '@/lib/api-error'

const logger = createLogger('Selca Search API')

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
  const searchType = searchParams.get('type') || 'member' // 'member' (default) or 'group'

  if (!query) {
    badRequest('검색어가 필요합니다')
  }

  try {
    let slug: string
    let displayName: string

    // 그룹 검색인 경우
    if (searchType === 'group') {
      // 그룹은 slug 형식이 단순함 (예: "nmixx", "aespa")
      slug = query.toLowerCase()
      displayName = query
      logger.debug(`Group search: "${slug}"`)
    }
    // 멤버 검색인 경우
    else {
      // slug 형식 감지: 언더스코어 포함 + 영문소문자/숫자만
      // 예: "aespa_winter", "ive_yujin"
      if (query.includes('_') && SLUG_PATTERN.test(query)) {
        // Query is already a slug - use it directly (Bias.selca_slug 활용)
        slug = query
        displayName = query.replace(/_/g, ' ')
        logger.debug(`Using slug directly: "${slug}"`)
      } else {
        // Query is not a slug - search for matching idol
        // NOTE: searchMembers는 @deprecated, 타임아웃 가능성 있음
        logger.debug(`Searching for idol: "${query}"`)
        const idols = await searchMembers(query)

        if (idols.length === 0) {
          notFound('매칭되는 아이돌을 찾을 수 없습니다')
        }

        const idol = idols[0]
        slug = idol.id
        displayName = idol.name_original || idol.name
      }
    }

    // Step 2: Fetch page with pagination (그룹: /group/, 멤버: /owner/)
    const basePath = searchType === 'group' ? 'group' : 'owner'
    const params = new URLSearchParams()
    if (maxTimeId) {
      params.set('max_time_id', maxTimeId)
    }
    const pageUrl = params.toString()
      ? `${BASE_URL}/${basePath}/${slug}/?${params}`
      : `${BASE_URL}/${basePath}/${slug}/`
    const html = await fetchHtmlFromSelca(pageUrl)
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
        title: title || `${displayName} 미디어`,
        thumbnailUrl,
        author: displayName,
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
    return handleApiError(error)
  }
}
