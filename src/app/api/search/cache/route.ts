import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls'

const CACHE_TTL_HOURS = 24

/**
 * GET /api/search/cache?query=...&platform=...
 * Get cached search results (global shared cache)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim().toLowerCase()
    const platform = searchParams.get('platform') as Platform | null

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Build query
    let dbQuery = supabase
      .from('search_cache')
      .select('*')
      .eq('query', query)
      .gte('cached_at', new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString())

    if (platform) {
      dbQuery = dbQuery.eq('platform', platform)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    // Return as object keyed by platform for easier access
    const cacheByPlatform: Record<string, typeof data[0]> = {}
    for (const entry of data ?? []) {
      cacheByPlatform[entry.platform] = entry
    }

    return NextResponse.json(cacheByPlatform)
  } catch (error) {
    console.error('Error fetching search cache:', error)
    return NextResponse.json(
      { error: '캐시 조회 실패' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/search/cache
 * Save or update cached search results
 * Body: { query, platform, results, nextCursor?, nextPageToken?, currentPage?, currentOffset?, hasMore? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      query,
      platform,
      results,
      nextCursor,
      nextPageToken,
      currentPage = 1,
      currentOffset = 0,
      hasMore = true,
    } = body as {
      query: string
      platform: Platform
      results: unknown[]
      nextCursor?: string
      nextPageToken?: string
      currentPage?: number
      currentOffset?: number
      hasMore?: boolean
    }

    if (!query || !platform || !results) {
      return NextResponse.json(
        { error: 'query, platform, results are required' },
        { status: 400 }
      )
    }

    const normalizedQuery = query.trim().toLowerCase()

    // Upsert cache entry
    const { data, error } = await supabase
      .from('search_cache')
      .upsert(
        {
          query: normalizedQuery,
          platform,
          results,
          next_cursor: nextCursor || null,
          next_page_token: nextPageToken || null,
          current_page: currentPage,
          current_offset: currentOffset,
          has_more: hasMore,
          cached_at: new Date().toISOString(),
        },
        {
          onConflict: 'query,platform',
        }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error saving search cache:', error)
    return NextResponse.json(
      { error: '캐시 저장 실패' },
      { status: 500 }
    )
  }
}
