import { NextRequest, NextResponse } from 'next/server'
import { searchTwitter, type DateRestrict, type SortOption } from '@/lib/search'

const VALID_DATE_RESTRICTS = ['d1', 'd7', 'w1', 'w2', 'm1', 'm3', 'm6', 'y1']
const VALID_SORT_OPTIONS = ['relevance', 'date']

/**
 * GET /api/search/twitter
 * Search Twitter using Google Custom Search Engine
 * Returns indexed tweets (past popular tweets, not real-time)
 * Query params:
 *   - q: search query (required)
 *   - page: page number for pagination (optional, default: 1)
 *   - dateRestrict: date filter (optional, e.g., 'd1', 'w1', 'm1', 'y1')
 *   - sort: sort order (optional, 'relevance' or 'date')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const dateRestrictParam = searchParams.get('dateRestrict')
    const sortParam = searchParams.get('sort')

    // Validate dateRestrict
    const dateRestrict: DateRestrict = dateRestrictParam && VALID_DATE_RESTRICTS.includes(dateRestrictParam)
      ? dateRestrictParam as DateRestrict
      : null

    // Validate sort
    const sort: SortOption = sortParam && VALID_SORT_OPTIONS.includes(sortParam)
      ? sortParam as SortOption
      : 'relevance'

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '검색어를 입력해주세요' },
        { status: 400 }
      )
    }

    // Check if API keys are configured
    if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_ID) {
      return NextResponse.json(
        { error: 'Twitter 검색이 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    const response = await searchTwitter(query, { page, dateRestrict, sort })
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Twitter Search] Error:', error)

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        { error: 'Twitter 검색이 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Twitter 검색 중 오류: ${errorMessage}` },
      { status: 500 }
    )
  }
}
