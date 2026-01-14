import { supabase } from './supabase'
import type { Tag, TagInsert, LinkTag, LinkTagInsert } from '@/types/database'

export type { Tag, TagInsert, LinkTag, LinkTagInsert }

/**
 * Get all tags
 * Sorted by name ascending (alphabetical)
 */
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Get a tag by name
 */
export async function getTagByName(name: string): Promise<Tag | null> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('name', name)
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
 * Create a new tag
 * If tag with same name exists, returns the existing tag
 * @param userId - Optional user ID for authenticated users
 */
export async function createTag(name: string, userId?: string | null): Promise<Tag> {
  // Check if tag already exists
  const existingTag = await getTagByName(name)
  if (existingTag) {
    return existingTag
  }

  const insertData: TagInsert = {
    name,
    user_id: userId || null,
  }

  const { data, error } = await supabase
    .from('tags')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Get or create a tag by name
 * Returns existing tag if found, creates new one if not
 * @param userId - Optional user ID for authenticated users (used when creating)
 */
export async function getOrCreateTag(name: string, userId?: string | null): Promise<Tag> {
  return createTag(name, userId)
}

/**
 * Delete a tag by ID
 */
export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Add a tag to a link
 * Creates the link_tags association
 */
export async function addTagToLink(linkId: string, tagId: string): Promise<LinkTag> {
  const insertData: LinkTagInsert = {
    link_id: linkId,
    tag_id: tagId,
  }

  const { data, error } = await supabase
    .from('link_tags')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    // Ignore duplicate key error (already linked)
    if (error.code === '23505') {
      return { link_id: linkId, tag_id: tagId }
    }
    throw error
  }

  return data
}

/**
 * Remove a tag from a link
 */
export async function removeTagFromLink(linkId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('link_tags')
    .delete()
    .eq('link_id', linkId)
    .eq('tag_id', tagId)

  if (error) {
    throw error
  }
}

/**
 * Get all tags for a specific link
 */
export async function getTagsForLink(linkId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('link_tags')
    .select('tag_id, tags(*)')
    .eq('link_id', linkId)

  if (error) {
    throw error
  }

  // Extract the tags from the joined query result
  return (data ?? []).map((item) => (item.tags as unknown) as Tag).filter(Boolean)
}

/**
 * Get all tags that are in use (linked to at least one link)
 * Sorted by name ascending (alphabetical)
 */
export async function getTagsInUse(): Promise<Tag[]> {
  // Get distinct tag_ids from link_tags
  const { data: linkTags, error: linkTagsError } = await supabase
    .from('link_tags')
    .select('tag_id')

  if (linkTagsError) {
    throw linkTagsError
  }

  if (!linkTags || linkTags.length === 0) {
    return []
  }

  // Get unique tag IDs
  const tagIds = [...new Set(linkTags.map((lt) => lt.tag_id))]

  // Get the actual tags
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds)
    .order('name', { ascending: true })

  if (tagsError) {
    throw tagsError
  }

  return tags ?? []
}
