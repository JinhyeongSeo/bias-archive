import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error'

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls' | 'kgirls-issue' | 'selca' | 'instagram'

/**
 * GET /api/search/viewed?query=...
 * Get user's viewed state for a search query
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({}) // Return empty for unauthenticated
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim().toLowerCase()

    if (!query) {
      badRequest('query parameter is required')
    }

    const { data, error } = await supabase
      .from('user_search_viewed')
      .select('*')
      .eq('user_id', user.id)
      .eq('query', query)

    if (error) throw error

    // Return as object keyed by platform
    const viewedByPlatform: Record<string, { displayedIndex: number; viewedAt: string }> = {}
    for (const entry of data ?? []) {
      viewedByPlatform[entry.platform] = {
        displayedIndex: entry.displayed_index,
        viewedAt: entry.viewed_at,
      }
    }

    return NextResponse.json(viewedByPlatform)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/search/viewed
 * Update user's viewed state for a search query
 * Body: { query, platform, displayedIndex }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      unauthorized()
    }

    const body = await request.json()
    const { query, platform, displayedIndex } = body as {
      query: string
      platform: Platform
      displayedIndex: number
    }

    if (!query || !platform || displayedIndex === undefined) {
      badRequest('query, platform, displayedIndex are required')
    }

    const normalizedQuery = query.trim().toLowerCase()

    // Upsert viewed state
    const { data, error } = await supabase
      .from('user_search_viewed')
      .upsert(
        {
          user_id: user.id,
          query: normalizedQuery,
          platform,
          displayed_index: displayedIndex,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,query,platform',
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
