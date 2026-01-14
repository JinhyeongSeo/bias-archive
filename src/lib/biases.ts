import { supabase } from './supabase'
import type { Bias, BiasInsert, BiasUpdate, BiasWithGroup, Group } from '@/types/database'

export type { Bias, BiasInsert, BiasUpdate, BiasWithGroup }

/**
 * Get all biases
 * Sorted by sort_order ascending (NULLS LAST), then created_at descending as fallback
 */
export async function getBiases(): Promise<Bias[]> {
  const { data, error } = await supabase
    .from('biases')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Get a single bias by ID
 */
export async function getBias(id: string): Promise<Bias | null> {
  const { data, error } = await supabase
    .from('biases')
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
 * Create a new bias
 * @param userId - Optional user ID for authenticated users
 */
export async function createBias(
  name: string,
  groupName?: string | null,
  nameEn?: string | null,
  nameKo?: string | null,
  groupId?: string | null,
  userId?: string | null
): Promise<Bias> {
  const insertData: BiasInsert = {
    name,
    group_name: groupName || null,
    name_en: nameEn || null,
    name_ko: nameKo || null,
    group_id: groupId || null,
    user_id: userId || null,
  }

  const { data, error } = await supabase
    .from('biases')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Update an existing bias
 */
export async function updateBias(
  id: string,
  name: string,
  groupName?: string | null,
  nameEn?: string | null,
  nameKo?: string | null
): Promise<Bias> {
  const updateData: BiasUpdate = {
    name,
    group_name: groupName ?? null,
    name_en: nameEn ?? null,
    name_ko: nameKo ?? null,
  }

  const { data, error } = await supabase
    .from('biases')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Delete a bias by ID
 */
export async function deleteBias(id: string): Promise<void> {
  const { error } = await supabase
    .from('biases')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Get all biases with their group information
 * Sorted by sort_order ascending (NULLS LAST), then created_at descending
 */
export async function getBiasesWithGroups(): Promise<BiasWithGroup[]> {
  // First get all biases
  const { data: biases, error: biasError } = await supabase
    .from('biases')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (biasError) {
    throw biasError
  }

  // Get all groups
  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select('*')

  if (groupError) {
    throw groupError
  }

  // Create a map of group_id to group for quick lookup
  const groupMap = new Map<string, Group>()
  for (const group of groups ?? []) {
    groupMap.set(group.id, group)
  }

  // Join biases with their groups
  const biasesWithGroups: BiasWithGroup[] = (biases ?? []).map((bias) => ({
    ...bias,
    group: bias.group_id ? groupMap.get(bias.group_id) ?? null : null,
  }))

  return biasesWithGroups
}

/**
 * Reorder biases by updating their sort_order values
 * @param orderedIds - Array of bias IDs in desired order
 */
export async function reorderBiases(orderedIds: string[]): Promise<void> {
  // Update each bias with its new sort_order (1-indexed)
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index + 1,
  }))

  // Use Promise.all for parallel updates
  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from('biases')
        .update({ sort_order })
        .eq('id', id)
    )
  )

  // Check for any errors
  const errors = results.filter((result) => result.error)
  if (errors.length > 0) {
    console.error('Errors updating sort_order:', errors.map((e) => e.error))
    throw new Error(`Failed to update ${errors.length} bias(es)`)
  }
}
