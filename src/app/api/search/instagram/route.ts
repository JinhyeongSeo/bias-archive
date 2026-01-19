/**
 * Instagram Search API
 *
 * Uses Apify Instagram Search Scraper for hashtag/user search
 *
 * @remarks
 * - Requires APIFY_API_TOKEN environment variable
 * - Returns { notConfigured: true } if token not set
 * - Search types: 'hashtag' (default), 'user'
 * - Results are cached for 1 hour to reduce API calls and improve speed
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

interface CacheEntry {
  results: InstagramSearchResult[]
  hasMore: boolean
  timestamp: number
}

// In-memory cache (1 hour TTL)
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

function getCacheKey(query: string, searchType: string, limit: number): string {
  return `${query.toLowerCase()}:${searchType}:${limit}`
}

function getFromCache(key: string): CacheEntry | null {
  const entry = cache.get(key)
  if (!entry) return null

  // Check if cache is expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry
}

function setCache(key: string, results: InstagramSearchResult[], hasMore: boolean): void {
  // Limit cache size to prevent memory issues
  if (cache.size > 100) {
    // Remove oldest entries
    const entries = Array.from(cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    for (let i = 0; i < 20; i++) {
      cache.delete(entries[i][0])
    }
  }

  cache.set(key, {
    results,
    hasMore,
    timestamp: Date.now(),
  })
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

  // Check cache first
  const cacheKey = getCacheKey(query, searchType, limit)
  const cached = getFromCache(cacheKey)
  if (cached) {
    console.log(`[Instagram Search] Cache hit for: ${query}`)
    return NextResponse.json({
      results: cached.results,
      hasMore: cached.hasMore,
      cached: true,
    })
  }

  try {
    console.log(`[Instagram Search] Cache miss, calling Apify for: ${query}`)
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

    // Save to cache
    setCache(cacheKey, results, hasMore)

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
