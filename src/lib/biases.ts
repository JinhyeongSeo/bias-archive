import { supabase } from './supabase'
import type { Bias, BiasInsert, BiasUpdate } from '@/types/database'

export type { Bias, BiasInsert, BiasUpdate }

/**
 * Get all biases
 * Sorted by created_at descending (newest first)
 */
export async function getBiases(): Promise<Bias[]> {
  const { data, error } = await supabase
    .from('biases')
    .select('*')
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
 */
export async function createBias(name: string, groupName?: string | null): Promise<Bias> {
  const insertData: BiasInsert = {
    name,
    group_name: groupName || null,
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
export async function updateBias(id: string, name: string, groupName?: string | null): Promise<Bias> {
  const updateData: BiasUpdate = {
    name,
    group_name: groupName ?? null,
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
