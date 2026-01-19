/**
 * Instagram Search API
 *
 * Uses Apify Instagram Search Scraper for hashtag/user search
 *
 * @remarks
 * - Requires APIFY_API_TOKEN environment variable
 * - Returns { notConfigured: true } if token not set
 * - Search types: 'hashtag' (default), 'user'
 * - Caching is handled client-side via Supabase (like other platforms)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApifyClient } from 'apify-client'

// Extend max duration for Apify actor execution (Vercel Hobby: max 60s)
export const maxDuration = 60

interface ApifyInstagramResult {
  type: string
  id: string
  url: string
  name?: string
  username?: string
  profilePicUrl?: string
  biography?: string
  followersCount?: number
  followsCount?: number
  postsCount?: number
}

interface InstagramSearchResult {
  url: string
  title: string
  thumbnailUrl: string | null
  author: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const searchType = searchParams.get('type') || 'hashtag' // 'user' | 'hashtag'
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  // Check for API token
  const apiToken = process.env.APIFY_API_TOKEN
  if (!apiToken) {
    return NextResponse.json({ notConfigured: true, results: [], hasMore: false })
  }

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    console.log(`[Instagram Search] Calling Apify for: ${query}`)
    const client = new ApifyClient({ token: apiToken })

    // Run Instagram Search Scraper actor
    // Actor ID: apify/instagram-search-scraper
    const run = await client.actor('apify/instagram-search-scraper').call(
      {
        search: query,
        searchType: searchType as 'user' | 'hashtag',
        resultsLimit: limit,
      },
      {
        timeout: 60, // 60 seconds timeout
      }
    )

    // Get results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    // Transform results to unified format
    const results: InstagramSearchResult[] = (items as unknown as ApifyInstagramResult[]).map((item) => {
      // For user search results
      if (item.type === 'user' || item.username) {
        return {
          url: item.url || `https://www.instagram.com/${item.username}/`,
          title: item.name || item.username || query,
          thumbnailUrl: item.profilePicUrl || null,
          author: item.username || query,
        }
      }

      // For hashtag search results
      return {
        url: item.url || `https://www.instagram.com/explore/tags/${query}/`,
        title: item.name || `#${query}`,
        thumbnailUrl: null,
        author: `#${query}`,
      }
    })

    const hasMore = results.length >= limit

    return NextResponse.json({
      results,
      hasMore,
    })
  } catch (error) {
    console.error('[Instagram Search] Error:', error)

    if (error instanceof Error) {
      // Handle Apify-specific errors
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        return NextResponse.json(
          { error: 'Instagram 검색 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' },
          { status: 504 }
        )
      }

      if (error.message.includes('API_KEY') || error.message.includes('token')) {
        return NextResponse.json(
          { error: 'Instagram API 설정에 문제가 있습니다.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Instagram 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
