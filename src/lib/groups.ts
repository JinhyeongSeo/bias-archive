import { supabase as browserClient } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Group, GroupInsert } from "@/types/database";

export type { Group, GroupInsert };

/**
 * Get all groups
 * Sorted by sort_order ascending (NULLS LAST), then name ascending as fallback
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getGroups(
  client: SupabaseClient<Database> = browserClient
): Promise<Group[]> {
  const { data, error } = await client
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Get a single group by ID
 * @param id - Group ID
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getGroup(
  id: string,
  client: SupabaseClient<Database> = browserClient
): Promise<Group | null> {
  const { data, error } = await client
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Get a group by name (matches name, name_en, or name_ko)
 * @param name - Group name
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getGroupByName(
  name: string,
  client: SupabaseClient<Database> = browserClient
): Promise<Group | null> {
  const nameLower = name.toLowerCase();

  const { data, error } = await client.from("groups").select("*");

  if (error) {
    throw error;
  }

  // Find group matching any of the name fields (case-insensitive)
  const group = (data ?? []).find(
    (g) =>
      g.name.toLowerCase() === nameLower ||
      g.name_en?.toLowerCase() === nameLower ||
      g.name_ko?.toLowerCase() === nameLower
  );

  return group ?? null;
}

/**
 * Create a new group
 * @param name - Group name
 * @param nameEn - Optional English name
 * @param nameKo - Optional Korean name
 * @param userId - Optional user ID for authenticated users
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function createGroup(
  name: string,
  nameEn?: string | null,
  nameKo?: string | null,
  userId?: string | null,
  client: SupabaseClient<Database> = browserClient
): Promise<Group> {
  const insertData: GroupInsert = {
    name,
    name_en: nameEn || null,
    name_ko: nameKo || null,
    user_id: userId || null,
  };

  const { data, error } = await client
    .from("groups")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get or create a group by name
 * Returns existing group if found by name/name_en/name_ko, otherwise creates new
 * @param name - Group name
 * @param nameEn - Optional English name
 * @param nameKo - Optional Korean name
 * @param userId - Optional user ID for authenticated users (used when creating)
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getOrCreateGroup(
  name: string,
  nameEn?: string | null,
  nameKo?: string | null,
  userId?: string | null,
  client: SupabaseClient<Database> = browserClient
): Promise<Group> {
  // Try to find existing group by any name field
  const existing = await getGroupByName(name, client);
  if (existing) {
    return existing;
  }

  // Also check by nameEn and nameKo if provided
  if (nameEn) {
    const byEn = await getGroupByName(nameEn, client);
    if (byEn) {
      return byEn;
    }
  }

  if (nameKo) {
    const byKo = await getGroupByName(nameKo, client);
    if (byKo) {
      return byKo;
    }
  }

  // Create new group
  return createGroup(name, nameEn, nameKo, userId, client);
}

/**
 * Reorder groups by updating their sort_order values
 * @param orderedIds - Array of group IDs in desired order
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function reorderGroups(
  orderedIds: string[],
  client: SupabaseClient<Database> = browserClient
): Promise<void> {
  // Update each group with its new sort_order (1-indexed)
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index + 1,
  }));

  // Use Promise.all for parallel updates
  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      client.from("groups").update({ sort_order }).eq("id", id)
    )
  );

  // Check for any errors
  const errors = results.filter((result) => result.error);
  if (errors.length > 0) {
    throw new Error(`Failed to update ${errors.length} group(s)`);
  }
}
