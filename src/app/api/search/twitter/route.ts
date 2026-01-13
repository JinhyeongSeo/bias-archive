import { NextRequest, NextResponse } from 'next/server'
import { searchTwitter } from '@/lib/search'

/**
 * GET /api/search/twitter
 * Search Twitter using Google Custom Search Engine
 * Returns indexed tweets (past popular tweets, not real-time)
 * Query params:
 *   - q: search query (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

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

    const results = await searchTwitter(query)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[Twitter Search] Error:', error)

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        { error: 'Twitter 검색이 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: 'Twitter 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
