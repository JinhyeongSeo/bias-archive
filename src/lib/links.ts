import { supabase } from './supabase'
import type { Link, LinkInsert, LinkUpdate } from '@/types/database'

export type { Link, LinkInsert, LinkUpdate }

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
