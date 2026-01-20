import { NextRequest, NextResponse } from 'next/server'
import { searchTwitter, type DateRestrict, type SortOption } from '@/lib/search'
import {
  searchTwitterWithScrapeBadger,
  isScrapeBadgerConfigured,
  type SearchType,
} from '@/lib/scrapebadger'
import { handleApiError, badRequest } from '@/lib/api-error'

const VALID_DATE_RESTRICTS = ['d1', 'd7', 'w1', 'w2', 'm1', 'm3', 'm6', 'y1']
const VALID_SORT_OPTIONS = ['relevance', 'date']
const VALID_SEARCH_TYPES = ['top', 'latest', 'media']

/**
 * GET /api/search/twitter
 * Search Twitter using ScrapeBadger API (preferred) or Google CSE (fallback)
 *
 * ScrapeBadger: Real-time search, $0.10/1,000 tweets
 * Google CSE: Indexed tweets only (past popular tweets), free but limited
 *
 * Query params:
 *   - q: search query (required)
 *   - page: page number for pagination (optional, default: 1) - Google CSE only
 *   - cursor: pagination cursor (optional) - ScrapeBadger only
 *   - type: search type ('top', 'latest', 'media') - ScrapeBadger only
 *   - dateRestrict: date filter (optional, e.g., 'd1', 'w1', 'm1', 'y1') - Google CSE only
 *   - sort: sort order (optional, 'relevance' or 'date') - Google CSE only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      badRequest('검색어를 입력해주세요')
    }

    // Use ScrapeBadger if configured (preferred - real-time search)
    if (isScrapeBadgerConfigured()) {
      const typeParam = searchParams.get('type')
      const cursor = searchParams.get('cursor') || undefined
      const count = parseInt(searchParams.get('count') || '20', 10)

      const type: SearchType =
        typeParam && VALID_SEARCH_TYPES.includes(typeParam)
          ? (typeParam as SearchType)
          : 'top'

      const response = await searchTwitterWithScrapeBadger(query, {
        type,
        cursor,
        count,
      })

      return NextResponse.json({
        ...response,
        provider: 'scrapebadger',
      })
    }

    // Fallback to Google CSE (indexed tweets only)
    if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_ID) {
      return NextResponse.json(
        { error: 'Twitter 검색이 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    const page = parseInt(searchParams.get('page') || '1', 10)
    const dateRestrictParam = searchParams.get('dateRestrict')
    const sortParam = searchParams.get('sort')

    const dateRestrict: DateRestrict =
      dateRestrictParam && VALID_DATE_RESTRICTS.includes(dateRestrictParam)
        ? (dateRestrictParam as DateRestrict)
        : null

    const sort: SortOption =
      sortParam && VALID_SORT_OPTIONS.includes(sortParam)
        ? (sortParam as SortOption)
        : 'relevance'

    const response = await searchTwitter(query, { page, dateRestrict, sort })

    return NextResponse.json({
      ...response,
      provider: 'google_cse',
    })
  } catch (error) {
    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        { error: 'Twitter 검색이 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    return handleApiError(error)
  }
}
