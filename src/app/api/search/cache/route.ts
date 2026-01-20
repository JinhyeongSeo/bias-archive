import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error'

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls' | 'kgirls-issue' | 'selca' | 'instagram'

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
      badRequest('query parameter is required')
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
    return handleApiError(error)
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
      unauthorized()
    }

    const body = await request.json()
    const {
      query,
      platform,
      results,
      nextCursor,
      nextPageToken,
      nextMaxTimeId,
      currentPage = 1,
      currentOffset = 0,
      hasMore = true,
    } = body as {
      query: string
      platform: Platform
      results: unknown[]
      nextCursor?: string
      nextPageToken?: string
      nextMaxTimeId?: string
      currentPage?: number
      currentOffset?: number
      hasMore?: boolean
    }

    if (!query || !platform || !results) {
      badRequest('query, platform, results are required')
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
          next_max_time_id: nextMaxTimeId || null,
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
    return handleApiError(error)
  }
}
