import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { Tag, LinkMedia } from '@/types/database'
import type { LinkWithTagsAndMedia } from '@/lib/links'
import { handleApiError, unauthorized } from '@/lib/api-error'

/**
 * Export data structure version
 */
const EXPORT_VERSION = '1.0'

/**
 * GET /api/export
 * Export all archive data as a downloadable JSON file (requires authentication)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    // Fetch biases (RLS filters by user_id automatically)
    const { data: biases, error: biasesError } = await supabase
      .from('biases')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (biasesError) {
      throw new Error(`Failed to fetch biases: ${biasesError.message}`)
    }

    // Fetch tags (RLS filters by user_id automatically)
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (tagsError) {
      throw new Error(`Failed to fetch tags: ${tagsError.message}`)
    }

    // Fetch links with tags and media (RLS filters by user_id automatically)
    const { data: linksRaw, error: linksError } = await supabase
      .from('links')
      .select(`
        *,
        link_tags (
          tags (*)
        ),
        link_media (*)
      `)
      .order('created_at', { ascending: false })

    if (linksError) {
      throw new Error(`Failed to fetch links: ${linksError.message}`)
    }

    // Transform links to include tags and media arrays
    const links: LinkWithTagsAndMedia[] = (linksRaw ?? []).map((link) => {
      const linkTags = (link.link_tags as Array<{ tags: Tag }>) ?? []
      const linkTagsArray = linkTags
        .map((lt) => lt.tags)
        .filter((tag): tag is Tag => tag !== null)

      const media = ((link.link_media as LinkMedia[]) ?? []).sort(
        (a, b) => a.position - b.position
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { link_tags: _lt, link_media: _lm, ...linkWithoutRelations } = link
      return {
        ...linkWithoutRelations,
        tags: linkTagsArray,
        media,
      } as LinkWithTagsAndMedia
    })

    const data = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      biases: biases ?? [],
      tags: tags ?? [],
      links,
    }

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const filename = `bias-archive-backup-${date}.json`

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
