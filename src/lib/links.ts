import { supabase } from './supabase'
import type { Link, LinkInsert, LinkUpdate, Tag, LinkMedia, LinkMediaInsert } from '@/types/database'

export type { Link, LinkInsert, LinkUpdate, LinkMedia }

/**
 * Create a new link
 */
export async function createLink(data: LinkInsert): Promise<Link> {
  const { data: link, error } = await supabase
    .from('links')
    .insert([data])
    .select()
    .single()

  if (error) {
    throw error
  }

  return link
}

/**
 * Get all links, optionally filtered by bias_id
 * Sorted by created_at descending (newest first)
 */
export async function getLinks(biasId?: string): Promise<Link[]> {
  let query = supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (biasId) {
    query = query.eq('bias_id', biasId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Get a single link by ID
 */
export async function getLinkById(id: string): Promise<Link | null> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw error
  }

  return data
}

/**
 * Delete a link by ID
 */
export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Check if a URL already exists in the database
 */
export async function checkDuplicateUrl(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('links')
    .select('id')
    .eq('url', url)
    .limit(1)

  if (error) {
    throw error
  }

  return (data?.length ?? 0) > 0
}

/**
 * Link with associated tags
 */
export type LinkWithTags = Link & { tags: Tag[] }

/**
 * Link with associated tags and media
 */
export type LinkWithTagsAndMedia = Link & { tags: Tag[]; media: LinkMedia[] }

/**
 * Search parameters for filtering links
 */
export interface SearchLinksParams {
  biasId?: string
  search?: string
  tagIds?: string[]
  platform?: string
}

/**
 * Media data for creating link media entries
 */
export interface MediaData {
  url: string
  type: 'image' | 'video' | 'gif'
}

/**
 * Create link media entries for a given link
 */
export async function createLinkMedia(linkId: string, mediaList: MediaData[]): Promise<LinkMedia[]> {
  if (mediaList.length === 0) return []

  const mediaInserts: LinkMediaInsert[] = mediaList.map((m, index) => ({
    link_id: linkId,
    media_url: m.url,
    media_type: m.type,
    position: index,
  }))

  const { data, error } = await supabase
    .from('link_media')
    .insert(mediaInserts)
    .select()

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Get all links with their associated tags and media
 * Sorted by created_at descending (newest first)
 */
export async function getLinksWithTags(biasId?: string): Promise<LinkWithTagsAndMedia[]> {
  let query = supabase
    .from('links')
    .select(`
      *,
      link_tags (
        tags (*)
      ),
      link_media (*)
    `)
    .order('created_at', { ascending: false })

  if (biasId) {
    query = query.eq('bias_id', biasId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  // Transform the nested link_tags into a flat tags array and include media
  return (data ?? []).map((link) => {
    const linkTags = (link.link_tags as Array<{ tags: Tag }>) ?? []
    const tags = linkTags
      .map((lt) => lt.tags)
      .filter((tag): tag is Tag => tag !== null)

    // Get media sorted by position
    const media = ((link.link_media as LinkMedia[]) ?? []).sort((a, b) => a.position - b.position)

    // Remove link_tags and link_media from the result and add tags/media arrays
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { link_tags: _lt, link_media: _lm, ...linkWithoutRelations } = link
    return {
      ...linkWithoutRelations,
      tags,
      media,
    } as LinkWithTagsAndMedia
  })
}

/**
 * Search and filter links with their associated tags and media
 * Supports text search, tag filtering, and platform filtering
 * Sorted by created_at descending (newest first)
 */
export async function searchLinksWithTags(params: SearchLinksParams): Promise<LinkWithTagsAndMedia[]> {
  const { biasId, search, tagIds, platform } = params

  // If filtering by tags, we need to get link IDs that have those tags first
  let linkIdsWithTags: string[] | null = null

  if (tagIds && tagIds.length > 0) {
    const { data: linkTagData, error: linkTagError } = await supabase
      .from('link_tags')
      .select('link_id')
      .in('tag_id', tagIds)

    if (linkTagError) {
      throw linkTagError
    }

    // Get unique link IDs
    linkIdsWithTags = [...new Set((linkTagData ?? []).map((lt) => lt.link_id))]

    // If no links have these tags, return empty array early
    if (linkIdsWithTags.length === 0) {
      return []
    }
  }

  let query = supabase
    .from('links')
    .select(`
      *,
      link_tags (
        tags (*)
      ),
      link_media (*)
    `)
    .order('created_at', { ascending: false })

  // Apply bias filter
  if (biasId) {
    query = query.eq('bias_id', biasId)
  }

  // Apply platform filter
  if (platform) {
    query = query.eq('platform', platform)
  }

  // Apply tag filter (using the link IDs we found earlier)
  if (linkIdsWithTags) {
    query = query.in('id', linkIdsWithTags)
  }

  // Apply text search
  if (search && search.trim()) {
    const searchTerm = search.trim()
    query = query.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,author_name.ilike.%${searchTerm}%`
    )
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  // Transform the nested link_tags into a flat tags array and include media
  return (data ?? []).map((link) => {
    const linkTags = (link.link_tags as Array<{ tags: Tag }>) ?? []
    const tags = linkTags
      .map((lt) => lt.tags)
      .filter((tag): tag is Tag => tag !== null)

    // Get media sorted by position
    const media = ((link.link_media as LinkMedia[]) ?? []).sort((a, b) => a.position - b.position)

    // Remove link_tags and link_media from the result and add tags/media arrays
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { link_tags: _lt, link_media: _lm, ...linkWithoutRelations } = link
    return {
      ...linkWithoutRelations,
      tags,
      media,
    } as LinkWithTagsAndMedia
  })
}
