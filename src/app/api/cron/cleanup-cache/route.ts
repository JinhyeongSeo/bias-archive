import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const CACHE_TTL_HOURS = 24

/**
 * GET /api/cron/cleanup-cache
 * Vercel Cron job to delete expired search cache entries
 * Runs daily at 3:00 AM KST (18:00 UTC previous day)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    const cutoffDate = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString()

    // Delete expired search_cache entries
    const { count: cacheCount, error: cacheError } = await supabase
      .from('search_cache')
      .delete()
      .lt('cached_at', cutoffDate)
      .select('*', { count: 'exact', head: true })

    if (cacheError) throw cacheError

    // Delete expired search_viewed entries
    const { count: viewedCount, error: viewedError } = await supabase
      .from('search_viewed')
      .delete()
      .lt('viewed_at', cutoffDate)
      .select('*', { count: 'exact', head: true })

    if (viewedError) throw viewedError

    console.log(`Cleanup complete: ${cacheCount ?? 0} cache, ${viewedCount ?? 0} viewed entries deleted`)

    return NextResponse.json({
      success: true,
      deleted: {
        search_cache: cacheCount ?? 0,
        search_viewed: viewedCount ?? 0,
      },
    })
  } catch (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
