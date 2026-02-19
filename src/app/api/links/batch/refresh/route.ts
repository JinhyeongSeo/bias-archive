import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, unauthorized, badRequest } from '@/lib/api-error'
import { extractMetadata } from '@/lib/metadata'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Batch Refresh API')

/**
 * POST /api/links/batch/refresh
 * Re-extract metadata for selected links (title, thumbnail, media, etc.)
 * Useful when parsers have been improved and existing links need updating.
 *
 * Body: { linkIds: string[] }
 * Returns: { refreshed: number, failed: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const body = await request.json()
    const { linkIds } = body

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      badRequest('리프레시할 링크 ID 목록이 필요합니다')
    }

    // Fetch links to refresh
    const { data: links, error: fetchError } = await supabase
      .from('links')
      .select('id, url, platform')
      .in('id', linkIds)

    if (fetchError) throw fetchError
    if (!links || links.length === 0) {
      badRequest('해당 링크를 찾을 수 없습니다')
    }

    let refreshed = 0
    let failed = 0

    for (const link of links) {
      try {
        const extracted = await extractMetadata(link.url)

        // Update link metadata
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }
        if (extracted.title) updateData.title = extracted.title
        if (extracted.description) updateData.description = extracted.description
        if (extracted.thumbnailUrl) updateData.thumbnail_url = extracted.thumbnailUrl
        if (extracted.originalDate) updateData.original_date = extracted.originalDate
        if (extracted.authorName) updateData.author_name = extracted.authorName
        if (extracted.platform && extracted.platform !== 'other' && extracted.platform !== 'generic') {
          updateData.platform = extracted.platform
        }

        await supabase
          .from('links')
          .update(updateData)
          .eq('id', link.id)

        // Replace media: delete old, insert new
        if (extracted.media && extracted.media.length > 0) {
          await supabase
            .from('link_media')
            .delete()
            .eq('link_id', link.id)

          const mediaInserts = extracted.media
            .filter(m => m.url && ['image', 'video', 'gif'].includes(m.type))
            .map((m, index) => ({
              link_id: link.id,
              media_url: m.url,
              media_type: m.type,
              position: index,
              user_id: user.id,
            }))

          if (mediaInserts.length > 0) {
            await supabase.from('link_media').insert(mediaInserts)
          }
        }

        refreshed++
      } catch (error) {
        logger.error(`Failed to refresh link ${link.id} (${link.url}):`, error)
        failed++
      }
    }

    return NextResponse.json({ refreshed, failed })
  } catch (error) {
    return handleApiError(error)
  }
}
