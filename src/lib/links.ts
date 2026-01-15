import { supabase } from "./supabase";
import type {
  Link,
  LinkInsert,
  LinkUpdate,
  Tag,
  LinkMedia,
  LinkMediaInsert,
} from "@/types/database";

export type { Link, LinkInsert, LinkUpdate, LinkMedia, LinkMediaInsert };

/**
 * Create a new link
 * @param data - Link data to insert
 * @param userId - Optional user ID for authenticated users
 */
export async function createLink(
  data: LinkInsert,
  userId?: string | null
): Promise<Link> {
  const insertData = {
    ...data,
    user_id: userId || null,
  };

  const { data: link, error } = await supabase
    .from("links")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return link;
}

/**
 * Get all links, optionally filtered by bias_id
 * Sorted by created_at descending (newest first)
 */
export async function getLinks(biasId?: string): Promise<Link[]> {
  let query = supabase
    .from("links")
    .select("*")
    .order("created_at", { ascending: false });

  if (biasId) {
    query = query.eq("bias_id", biasId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Get a single link by ID
 */
export async function getLinkById(id: string): Promise<Link | null> {
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("id", id)
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
 * Delete a link by ID
 */
export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase.from("links").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Check if a URL already exists in the database
 */
export async function checkDuplicateUrl(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("links")
    .select("id")
    .eq("url", url)
    .limit(1);

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Link with associated tags
 */
export type LinkWithTags = Link & { tags: Tag[] };

/**
 * Link with associated tags and media
 */
export type LinkWithTagsAndMedia = Link & { tags: Tag[]; media: LinkMedia[] };

/**
 * Search parameters for filtering links
 */
export interface SearchLinksParams {
  biasId?: string;
  search?: string;
  tagIds?: string[];
  platform?: string;
}

/**
 * Media data for creating link media entries
 */
export interface MediaData {
  url: string;
  type: "image" | "video" | "gif";
}

/**
 * Create link media entries for a given link
 */
export async function createLinkMedia(
  linkId: string,
  mediaList: MediaData[]
): Promise<LinkMedia[]> {
  if (mediaList.length === 0) return [];

  const mediaInserts: LinkMediaInsert[] = mediaList.map((m, index) => ({
    link_id: linkId,
    media_url: m.url,
    media_type: m.type,
    position: index,
  }));

  const { data, error } = await supabase
    .from("link_media")
    .insert(mediaInserts)
    .select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Get all links with their associated tags and media
 * Sorted by created_at descending (newest first)
 */
export async function getLinksWithTags(
  biasId?: string,
  client = supabase
): Promise<LinkWithTagsAndMedia[]> {
  let query = client
    .from("links")
    .select(
      `
      *,
      link_tags (
        tags (*)
      ),
      link_media (*)
    `
    )
    .order("created_at", { ascending: false });

  if (biasId) {
    query = query.eq("bias_id", biasId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Transform the nested link_tags into a flat tags array and include media
  return (data ?? []).map((link) => {
    const linkTags = (link.link_tags as Array<{ tags: Tag }>) ?? [];
    const tags = linkTags
      .map((lt) => lt.tags)
      .filter((tag): tag is Tag => tag !== null);

    // Get media sorted by position
    const media = ((link.link_media as LinkMedia[]) ?? []).sort(
      (a, b) => a.position - b.position
    );

    // Remove link_tags and link_media from the result and add tags/media arrays
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { link_tags: _lt, link_media: _lm, ...linkWithoutRelations } = link;
    return {
      ...linkWithoutRelations,
      tags,
      media,
    } as LinkWithTagsAndMedia;
  });
}

/**
 * Search and filter links with their associated tags and media
 * Supports text search, tag filtering, and platform filtering
 * Sorted by created_at descending (newest first)
 */
export async function searchLinksWithTags(
  params: SearchLinksParams,
  client = supabase
): Promise<LinkWithTagsAndMedia[]> {
  const { biasId, search, tagIds, platform } = params;

  // If filtering by tags, we need to get link IDs that have those tags first
  let linkIdsWithTags: string[] | null = null;

  if (tagIds && tagIds.length > 0) {
    const { data: linkTagData, error: linkTagError } = await client
      .from("link_tags")
      .select("link_id")
      .in("tag_id", tagIds);

    if (linkTagError) {
      throw linkTagError;
    }

    // Get unique link IDs
    linkIdsWithTags = [...new Set((linkTagData ?? []).map((lt) => lt.link_id))];

    // If no links have these tags, return empty array early
    if (linkIdsWithTags.length === 0) {
      return [];
    }
  }

  let query = client
    .from("links")
    .select(
      `
      *,
      link_tags (
        tags (*)
      ),
      link_media (*)
    `
    );

  // Sort by starred first only when filtering by tags
  if (linkIdsWithTags) {
    query = query.order("starred", { ascending: false });
  }
  query = query.order("created_at", { ascending: false });

  // Apply bias filter
  if (biasId) {
    query = query.eq("bias_id", biasId);
  }

  // Apply platform filter
  if (platform) {
    query = query.eq("platform", platform);
  }

  // Apply tag filter (using the link IDs we found earlier)
  if (linkIdsWithTags) {
    query = query.in("id", linkIdsWithTags);
  }

  // Apply text search
  if (search && search.trim()) {
    const searchTerm = search.trim();
    query = query.or(
      `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,author_name.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Transform the nested link_tags into a flat tags array and include media
  return (data ?? []).map((link) => {
    const linkTags = (link.link_tags as Array<{ tags: Tag }>) ?? [];
    const tags = linkTags
      .map((lt) => lt.tags)
      .filter((tag): tag is Tag => tag !== null);

    // Get media sorted by position
    const media = ((link.link_media as LinkMedia[]) ?? []).sort(
      (a, b) => a.position - b.position
    );

    // Remove link_tags and link_media from the result and add tags/media arrays
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { link_tags: _lt, link_media: _lm, ...linkWithoutRelations } = link;
    return {
      ...linkWithoutRelations,
      tags,
      media,
    } as LinkWithTagsAndMedia;
  });
}

/**
 * Update a link's memo or starred status
 */
export async function updateLink(
  id: string,
  data: { memo?: string | null; starred?: boolean },
  client = supabase
): Promise<Link> {
  const { data: link, error } = await client
    .from("links")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return link;
}

/**
 * Toggle starred status for a link
 */
export async function toggleLinkStarred(
  id: string,
  client = supabase
): Promise<Link> {
  // First get current starred status
  const { data: currentLink, error: fetchError } = await client
    .from("links")
    .select("starred")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Toggle the status
  const newStarred = !currentLink.starred;
  return updateLink(id, { starred: newStarred }, client);
}

/**
 * Get starred links with tags and media
 */
export async function getStarredLinks(
  biasId?: string,
  client = supabase
): Promise<LinkWithTagsAndMedia[]> {
  let query = client
    .from("links")
    .select(
      `
      *,
      link_tags (
        tags (*)
      ),
      link_media (*)
    `
    )
    .eq("starred", true)
    .order("created_at", { ascending: false });

  if (biasId) {
    query = query.eq("bias_id", biasId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Transform the nested link_tags into a flat tags array and include media
  return (data ?? []).map((link) => {
    const linkTags = (link.link_tags as Array<{ tags: Tag }>) ?? [];
    const tags = linkTags
      .map((lt) => lt.tags)
      .filter((tag): tag is Tag => tag !== null);

    // Get media sorted by position
    const media = ((link.link_media as LinkMedia[]) ?? []).sort(
      (a, b) => a.position - b.position
    );

    // Remove link_tags and link_media from the result and add tags/media arrays
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { link_tags: _lt, link_media: _lm, ...linkWithoutRelations } = link;
    return {
      ...linkWithoutRelations,
      tags,
      media,
    } as LinkWithTagsAndMedia;
  });
}

/**
 * Get links saved on this day in past years ("On This Day" feature)
 * Matches month and day of original_date or created_at with today's date
 * @param yearsAgo - How many years back to look (default: 1)
 * @returns Links from this day in past years, with tags
 */
export async function getLinksOnThisDay(
  yearsAgo: number = 1,
  client = supabase
): Promise<LinkWithTagsAndMedia[]> {
  const today = new Date();
  const targetMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
  const targetDay = today.getDate();
  const targetYear = today.getFullYear() - yearsAgo;

  // Query links where either original_date or created_at matches month/day
  // We need to use raw SQL filter for date extraction
  const { data, error } = await client
    .from("links")
    .select(
      `
      *,
      link_tags (
        tags (*)
      ),
      link_media (*)
    `
    )
    .or(
      `original_date.gte.${targetYear}-01-01,created_at.gte.${targetYear}-01-01T00:00:00`
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  // Filter in JavaScript since Supabase doesn't support EXTRACT in query builder
  const filteredData = (data ?? []).filter((link) => {
    // Check original_date
    if (link.original_date) {
      const originalDate = new Date(link.original_date);
      const originalYear = originalDate.getFullYear();
      if (
        originalYear <= targetYear &&
        originalDate.getMonth() + 1 === targetMonth &&
        originalDate.getDate() === targetDay
      ) {
        return true;
      }
    }

    // Check created_at
    const createdAt = new Date(link.created_at);
    const createdYear = createdAt.getFullYear();
    if (
      createdYear <= targetYear &&
      createdAt.getMonth() + 1 === targetMonth &&
      createdAt.getDate() === targetDay
    ) {
      return true;
    }

    return false;
  });

  // Transform the nested link_tags into a flat tags array and include media
  return filteredData.map((link) => {
    const linkTags = (link.link_tags as Array<{ tags: Tag }>) ?? [];
    const tags = linkTags
      .map((lt) => lt.tags)
      .filter((tag): tag is Tag => tag !== null);

    // Get media sorted by position
    const media = ((link.link_media as LinkMedia[]) ?? []).sort(
      (a, b) => a.position - b.position
    );

    // Remove link_tags and link_media from the result and add tags/media arrays
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { link_tags: _lt, link_media: _lm, ...linkWithoutRelations } = link;
    return {
      ...linkWithoutRelations,
      tags,
      media,
    } as LinkWithTagsAndMedia;
  });
}
