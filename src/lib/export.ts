import { supabase as browserClient } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Bias, Tag, LinkMedia } from '@/types/index'
import type { LinkWithTagsAndMedia } from './links'

/**
 * Export data structure version
 */
export const EXPORT_VERSION = '1.0'

/**
 * Complete archive export data structure
 */
export interface ExportData {
  version: string
  exportedAt: string
  biases: Bias[]
  tags: Tag[]
  links: LinkWithTagsAndMedia[]
}

/**
 * Import operation result
 */
export interface ImportResult {
  imported: {
    biases: number
    tags: number
    links: number
  }
  skipped: {
    biases: number
    tags: number
    links: number
  }
  errors: string[]
}

/**
 * Export all archive data as a structured JSON object
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function exportAllData(
  client: SupabaseClient<Database> = browserClient
): Promise<ExportData> {
  // Fetch biases
  const { data: biases, error: biasesError } = await client
    .from('biases')
    .select('*')
    .order('created_at', { ascending: false })

  if (biasesError) {
    throw new Error(`Failed to fetch biases: ${biasesError.message}`)
  }

  // Fetch tags
  const { data: tags, error: tagsError } = await client
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (tagsError) {
    throw new Error(`Failed to fetch tags: ${tagsError.message}`)
  }

  // Fetch links with tags and media
  const { data: linksRaw, error: linksError } = await client
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

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    biases: biases ?? [],
    tags: tags ?? [],
    links,
  }
}

/**
 * Validate that imported data has the correct structure
 */
export function validateImportData(data: unknown): ExportData | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const obj = data as Record<string, unknown>

  // Check required fields
  if (typeof obj.version !== 'string') {
    return null
  }

  if (typeof obj.exportedAt !== 'string') {
    return null
  }

  if (!Array.isArray(obj.biases)) {
    return null
  }

  if (!Array.isArray(obj.tags)) {
    return null
  }

  if (!Array.isArray(obj.links)) {
    return null
  }

  // Validate biases structure
  for (const bias of obj.biases) {
    if (!bias || typeof bias !== 'object') return null
    const b = bias as Record<string, unknown>
    if (typeof b.name !== 'string') return null
  }

  // Validate tags structure
  for (const tag of obj.tags) {
    if (!tag || typeof tag !== 'object') return null
    const t = tag as Record<string, unknown>
    if (typeof t.name !== 'string') return null
  }

  // Validate links structure
  for (const link of obj.links) {
    if (!link || typeof link !== 'object') return null
    const l = link as Record<string, unknown>
    if (typeof l.url !== 'string') return null
  }

  return data as ExportData
}

/**
 * Import archive data, handling duplicates by skipping existing entries
 * @param data - Export data to import
 * @param userId - Optional user ID for the imported records
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function importData(
  data: ExportData,
  userId?: string | null,
  client: SupabaseClient<Database> = browserClient
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: { biases: 0, tags: 0, links: 0 },
    skipped: { biases: 0, tags: 0, links: 0 },
    errors: [],
  }

  // Map old IDs to new IDs for reference resolution
  const biasIdMap = new Map<string, string>()
  const tagIdMap = new Map<string, string>()

  // 1. Import biases (match by name)
  for (const bias of data.biases) {
    try {
      // Check if bias with same name exists
      const { data: existing } = await client
        .from('biases')
        .select('id')
        .eq('name', bias.name)
        .limit(1)

      if (existing && existing.length > 0) {
        biasIdMap.set(bias.id, existing[0].id)
        result.skipped.biases++
      } else {
        const { data: newBias, error } = await client
          .from('biases')
          .insert({
            name: bias.name,
            group_name: bias.group_name,
            user_id: userId || null,
          })
          .select()
          .single()

        if (error) {
          result.errors.push(`Bias "${bias.name}": ${error.message}`)
        } else {
          biasIdMap.set(bias.id, newBias.id)
          result.imported.biases++
        }
      }
    } catch (error) {
      result.errors.push(`Bias "${bias.name}": ${String(error)}`)
    }
  }

  // 2. Import tags (match by name)
  for (const tag of data.tags) {
    try {
      // Check if tag with same name exists
      const { data: existing } = await client
        .from('tags')
        .select('id')
        .eq('name', tag.name)
        .limit(1)

      if (existing && existing.length > 0) {
        tagIdMap.set(tag.id, existing[0].id)
        result.skipped.tags++
      } else {
        const { data: newTag, error } = await client
          .from('tags')
          .insert({ name: tag.name, user_id: userId || null })
          .select()
          .single()

        if (error) {
          result.errors.push(`Tag "${tag.name}": ${error.message}`)
        } else {
          tagIdMap.set(tag.id, newTag.id)
          result.imported.tags++
        }
      }
    } catch (error) {
      result.errors.push(`Tag "${tag.name}": ${String(error)}`)
    }
  }

  // 3. Import links (skip existing URLs)
  for (const link of data.links) {
    try {
      // Check if link with same URL exists
      const { data: existing } = await client
        .from('links')
        .select('id')
        .eq('url', link.url)
        .limit(1)

      if (existing && existing.length > 0) {
        result.skipped.links++
        continue
      }

      // Resolve bias_id to new ID
      const newBiasId = link.bias_id ? biasIdMap.get(link.bias_id) : null

      const { data: newLink, error: linkError } = await client
        .from('links')
        .insert({
          url: link.url,
          title: link.title,
          description: link.description,
          thumbnail_url: link.thumbnail_url,
          platform: link.platform,
          original_date: link.original_date,
          author_name: link.author_name,
          bias_id: newBiasId || null,
          user_id: userId || null,
        })
        .select()
        .single()

      if (linkError) {
        result.errors.push(`Link "${link.url}": ${linkError.message}`)
        continue
      }

      result.imported.links++

      // Import link tags
      if (link.tags && link.tags.length > 0) {
        for (const tag of link.tags) {
          const newTagId = tagIdMap.get(tag.id)
          if (newTagId) {
            try {
              await client.from('link_tags').insert({
                link_id: newLink.id,
                tag_id: newTagId,
                user_id: userId || null,
              })
            } catch {
              // Ignore duplicate link-tag associations
            }
          }
        }
      }

      // Import link media
      if (link.media && link.media.length > 0) {
        for (const media of link.media) {
          try {
            await client.from('link_media').insert({
              link_id: newLink.id,
              media_url: media.media_url,
              media_type: media.media_type,
              position: media.position,
              user_id: userId || null,
            })
          } catch (error) {
            result.errors.push(`Media for "${link.url}": ${String(error)}`)
          }
        }
      }
    } catch (error) {
      result.errors.push(`Link "${link.url}": ${String(error)}`)
    }
  }

  return result
}
