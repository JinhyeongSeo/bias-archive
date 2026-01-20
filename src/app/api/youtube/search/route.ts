import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import type { YouTubeSearchOptions } from '@/lib/youtube';
import { searchYouTube } from '@/lib/youtube'
import { handleApiError, badRequest } from '@/lib/api-error'

type OrderType = 'relevance' | 'date' | 'viewCount' | 'rating'
type PeriodType = 'today' | 'week' | 'month' | 'year'

/**
 * Convert period string to ISO 8601 publishedAfter date
 */
function periodToPublishedAfter(period: PeriodType): string {
  const now = new Date()
  let date: Date

  switch (period) {
    case 'today':
      date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      date = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      date = new Date(0) // epoch if unknown
  }

  return date.toISOString()
}

/**
 * GET /api/youtube/search
 * Search YouTube videos using YouTube Data API v3
 * Query params:
 *   - q: search query (required)
 *   - max: maximum results (optional, default: 10, max: 50)
 *   - order: sort order (optional: relevance, date, viewCount, rating)
 *   - period: time filter (optional: today, week, month, year)
 *   - pageToken: pagination token for next page (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = parseInt(searchParams.get('max') || '10', 10)
    const order = searchParams.get('order') as OrderType | null
    const period = searchParams.get('period') as PeriodType | null
    const pageToken = searchParams.get('pageToken')

    if (!query || query.trim() === '') {
      badRequest('검색어를 입력해주세요')
    }

    // Check if API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API가 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    // Build search options
    const options: YouTubeSearchOptions = {}
    if (order) {
      options.order = order
    }
    if (period) {
      options.publishedAfter = periodToPublishedAfter(period)
    }
    if (pageToken) {
      options.pageToken = pageToken
    }

    const response = await searchYouTube(query, maxResults, options)
    return NextResponse.json(response)
  } catch (error) {
    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        { error: 'YouTube API가 설정되지 않았습니다', notConfigured: true },
        { status: 501 }
      )
    }

    return handleApiError(error)
  }
}
