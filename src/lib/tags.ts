import { supabase as browserClient } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tag, TagInsert, LinkTag, LinkTagInsert } from "@/types/database";

export type { Tag, TagInsert, LinkTag, LinkTagInsert };

/**
 * Get all tags
 * Sorted by name ascending (alphabetical)
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getTags(
  client: SupabaseClient<Database> = browserClient
): Promise<Tag[]> {
  const { data, error } = await client
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Get a tag by name
 * @param name - Tag name
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getTagByName(
  name: string,
  client: SupabaseClient<Database> = browserClient
): Promise<Tag | null> {
  const { data, error } = await client
    .from("tags")
    .select("*")
    .eq("name", name)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create a new tag
 * If tag with same name exists, returns the existing tag
 * @param name - Tag name
 * @param userId - Optional user ID for authenticated users
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function createTag(
  name: string,
  userId?: string | null,
  client: SupabaseClient<Database> = browserClient
): Promise<Tag> {
  // Check if tag already exists
  const existingTag = await getTagByName(name, client);
  if (existingTag) {
    return existingTag;
  }

  const insertData: TagInsert = {
    name,
    user_id: userId || null,
  };

  const { data, error } = await client
    .from("tags")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get or create a tag by name
 * Returns existing tag if found, creates new one if not
 * @param name - Tag name
 * @param userId - Optional user ID for authenticated users (used when creating)
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getOrCreateTag(
  name: string,
  userId?: string | null,
  client: SupabaseClient<Database> = browserClient
): Promise<Tag> {
  return createTag(name, userId, client);
}

/**
 * Delete a tag by ID
 * @param id - Tag ID
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function deleteTag(
  id: string,
  client: SupabaseClient<Database> = browserClient
): Promise<void> {
  const { error } = await client.from("tags").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Add a tag to a link
 * Creates the link_tags association
 * @param linkId - Link ID
 * @param tagId - Tag ID
 * @param client - Optional Supabase client (defaults to browser client)
 * @param userId - Optional user ID for the link_tag association
 */
export async function addTagToLink(
  linkId: string,
  tagId: string,
  client: SupabaseClient<Database> = browserClient,
  userId?: string | null
): Promise<LinkTag> {
  const insertData: LinkTagInsert = {
    link_id: linkId,
    tag_id: tagId,
    user_id: userId || null,
  };

  const { data, error } = await client
    .from("link_tags")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    // Ignore duplicate key error (already linked)
    if (error.code === "23505") {
      return { link_id: linkId, tag_id: tagId, user_id: userId || null };
    }
    throw error;
  }

  return data;
}

/**
 * Remove a tag from a link
 * @param linkId - Link ID
 * @param tagId - Tag ID
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function removeTagFromLink(
  linkId: string,
  tagId: string,
  client: SupabaseClient<Database> = browserClient
): Promise<void> {
  const { error } = await client
    .from("link_tags")
    .delete()
    .eq("link_id", linkId)
    .eq("tag_id", tagId);

  if (error) {
    throw error;
  }
}

/**
 * Get all tags for a specific link
 * @param linkId - Link ID
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getTagsForLink(
  linkId: string,
  client: SupabaseClient<Database> = browserClient
): Promise<Tag[]> {
  const { data, error } = await client
    .from("link_tags")
    .select("tag_id, tags(*)")
    .eq("link_id", linkId);

  if (error) {
    throw error;
  }

  // Extract the tags from the joined query result
  return (data ?? [])
    .map((item) => item.tags as unknown as Tag)
    .filter(Boolean);
}

/**
 * Get all tags that are in use (linked to at least one link)
 * Sorted by name ascending (alphabetical)
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function getTagsInUse(
  client: SupabaseClient<Database> = browserClient
): Promise<Tag[]> {
  // Get distinct tag_ids from link_tags
  const { data: linkTags, error: linkTagsError } = await client
    .from("link_tags")
    .select("tag_id");

  if (linkTagsError) {
    throw linkTagsError;
  }

  if (!linkTags || linkTags.length === 0) {
    return [];
  }

  // Get unique tag IDs
  const tagIds = [...new Set(linkTags.map((lt) => lt.tag_id))];

  // Get the actual tags
  const { data: tags, error: tagsError } = await client
    .from("tags")
    .select("*")
    .in("id", tagIds)
    .order("name", { ascending: true });

  if (tagsError) {
    throw tagsError;
  }

  return tags ?? [];
}
