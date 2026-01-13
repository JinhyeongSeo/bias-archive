import { NextRequest, NextResponse } from 'next/server'
import { searchYouTube } from '@/lib/youtube'

/**
 * GET /api/youtube/search
 * Search YouTube videos using YouTube Data API v3
 * Query params:
 *   - q: search query (required)
 *   - max: maximum results (optional, default: 10, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = parseInt(searchParams.get('max') || '10', 10)

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '검색어를 입력해주세요' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API가 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    const results = await searchYouTube(query, maxResults)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[YouTube Search] Error:', error)

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        { error: 'YouTube API가 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: 'YouTube 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
