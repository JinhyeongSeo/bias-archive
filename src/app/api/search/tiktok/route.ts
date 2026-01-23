/**
 * TikTok Search API
 *
 * Uses RapidAPI TikTok Scraper to search for videos by keyword
 *
 * @remarks
 * - Requires RAPIDAPI_KEY environment variable
 * - Returns { notConfigured: true } if key not set
 * - Searches for videos with the given keyword
 * - Free tier: 500 requests/month
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { ParsedMedia } from '@/lib/parsers'
import { createLogger } from '@/lib/logger'

const logger = createLogger('TikTok Search API')

// Extend max duration for RapidAPI execution
export const maxDuration = 30

interface RapidApiVideo {
  video_id: string
  title?: string
  cover?: string
  play?: string
  author?: {
    unique_id?: string
    nickname?: string
  }
}

interface RapidApiResponse {
  code?: number
  msg?: string
  data?: {
    videos?: RapidApiVideo[]
  }
}

interface TikTokSearchResult {
  url: string
  title: string
  thumbnailUrl: string | null
  author: string
  media: ParsedMedia[]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 30)

  // Check for API key
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ notConfigured: true, results: [], hasMore: false })
  }

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    logger.debug(`Calling RapidAPI TikTok Scraper for: ${query}`)

    const url = new URL('https://tiktok-scraper7.p.rapidapi.com/feed/search')
    url.searchParams.set('keywords', query)
    url.searchParams.set('region', 'kr')
    url.searchParams.set('count', String(limit))
    url.searchParams.set('cursor', '0')
    url.searchParams.set('publish_time', '0') // 0=all time
    url.searchParams.set('sort_type', '0') // 0=relevance

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    })

    if (!response.ok) {
      // Handle rate limit
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'TikTok API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        )
      }

      throw new Error(`RapidAPI error: ${response.status}`)
    }

    const data: RapidApiResponse = await response.json()

    // Check for API errors
    if (data.code !== 0 && data.msg) {
      logger.error(`RapidAPI error: ${data.msg}`)
      return NextResponse.json(
        { error: 'TikTok 검색 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }

    // Handle empty results
    if (!data.data?.videos || data.data.videos.length === 0) {
      logger.debug(`No results found for: ${query}`)
      return NextResponse.json({
        results: [],
        hasMore: false,
      })
    }

    // Transform results to unified format
    const results: TikTokSearchResult[] = data.data.videos.map((video) => {
      const author = video.author?.nickname || video.author?.unique_id || 'TikTok'
      const username = video.author?.unique_id || 'user'

      // Truncate title if too long
      const rawTitle = video.title || `@${username}'s TikTok`
      const title = rawTitle.length > 50 ? rawTitle.substring(0, 50) + '...' : rawTitle

      // Build media array
      const media: ParsedMedia[] = []
      if (video.play) {
        media.push({ type: 'video', url: video.play })
      }

      return {
        url: `https://www.tiktok.com/@${username}/video/${video.video_id}`,
        title,
        thumbnailUrl: video.cover || null,
        author,
        media,
      }
    })

    const hasMore = results.length >= limit

    return NextResponse.json({
      results,
      hasMore,
    })
  } catch (error) {
    logger.error(error)

    if (error instanceof Error) {
      // Handle timeout errors
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        return NextResponse.json(
          { error: 'TikTok 검색 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' },
          { status: 504 }
        )
      }

      // Handle API key errors
      if (error.message.includes('API') || error.message.includes('key') || error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'TikTok API 설정에 문제가 있습니다.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'TikTok 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
