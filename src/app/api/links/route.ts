import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { searchLinksWithTags } from "@/lib/links";
import type { LinkInsert, MediaData, LinkMediaInsert } from "@/lib/links";
import { getBiases } from "@/lib/biases";
import { extractAutoTags, combineTextForTagExtraction } from "@/lib/autoTag";
import { createClient } from "@/lib/supabase-server";
import { createLogger } from "@/lib/logger";
import { handleApiError, badRequest, unauthorized, ApiError } from "@/lib/api-error";
import { extractMetadata } from "@/lib/metadata";

const logger = createLogger("Links API");

/**
 * GET /api/links
 * Get all links with tags, with optional filtering:
 * - bias_id: filter by bias ID
 * - search: text search in title, description, author_name
 * - tags: comma-separated tag IDs
 * - platform: filter by platform (youtube, twitter, weverse, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const biasId = searchParams.get("bias_id") || undefined;
    const search = searchParams.get("search") || undefined;
    const tagsParam = searchParams.get("tags") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const minimal = searchParams.get("minimal") === "true";

    // Parse tags parameter (comma-separated IDs)
    const tagIds = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;

    // Create server-side authenticated client
    const supabase = await createClient();

    if (minimal) {
      const { data, error } = await supabase
        .from("links")
        .select("url");
      if (error) throw error;
      return NextResponse.json(data);
    }

    const links = await searchLinksWithTags(
      {
        biasId,
        search,
        tagIds,
        platform,
      },
      supabase
    );
    return NextResponse.json(links);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/links
 * Create a new link (requires authentication)
 * Body: { url, title, description, thumbnailUrl, platform, originalDate, biasId, searchQuery, media }
 * searchQuery: optional hint for auto-tagging (e.g., from external search)
 * media: optional array of { url, type } for multi-image support (e.g., Twitter)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      unauthorized();
    }

    const body = await request.json();
    const {
      url,
      title,
      description,
      thumbnailUrl,
      platform,
      originalDate,
      authorName,
      biasId,
      searchQuery,
      media,
    } = body;

    // Validate required field
    if (!url || typeof url !== "string") {
      badRequest("URL은 필수입니다");
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      badRequest("유효하지 않은 URL입니다");
    }

    // Check for duplicate URL using authenticated client
    const { data: existingLinks } = await supabase
      .from("links")
      .select("id")
      .eq("url", url)
      .limit(1);

    if (existingLinks && existingLinks.length > 0) {
      throw new ApiError(409, "이미 저장된 URL입니다", "CONFLICT");
    }

    logger.debug(`Saving link: ${url}, initial platform: ${platform}`);

    // Always extract full metadata on the server to get all media items
    // especially for community platforms (kgirls, heye) where search results only give thumbnails
    let finalTitle = title;
    let finalDescription = description;
    let finalThumbnailUrl = thumbnailUrl;
    let finalPlatform = platform;
    let finalOriginalDate = originalDate;
    let finalAuthorName = authorName;
    let finalMedia = media;

    try {
      const extracted = await extractMetadata(url);
      logger.debug(`Extracted metadata for ${url}:`, { platform: extracted.platform, title: extracted.title });
      if (extracted) {
        finalTitle = extracted.title || finalTitle;
        finalDescription = extracted.description || finalDescription;
        finalThumbnailUrl = extracted.thumbnailUrl || finalThumbnailUrl;
        
        if (extracted.platform && extracted.platform !== "other" && extracted.platform !== "generic") {
          finalPlatform = extracted.platform;
        } else if (!finalPlatform) {
          finalPlatform = extracted.platform;
        }

        finalOriginalDate = extracted.originalDate || finalOriginalDate;
        finalAuthorName = extracted.authorName || finalAuthorName;
        
        // Use extracted media if provided media is empty or just a thumbnail
        if (!finalMedia || !Array.isArray(finalMedia) || finalMedia.length <= 1) {
          if (extracted.media && extracted.media.length > 0) {
            finalMedia = extracted.media;
          }
        }
      }
    } catch (error) {
      logger.error("Metadata extraction failed during save, falling back to provided data:", error);
    }

    // Create link with authenticated server client
    const linkInsert: LinkInsert = {
      url,
      title: finalTitle || null,
      description: finalDescription || null,
      thumbnail_url: finalThumbnailUrl || null,
      platform: finalPlatform || null,
      original_date: finalOriginalDate || null,
      author_name: finalAuthorName || null,
      bias_id: biasId || null,
      user_id: user.id,
    };

    const { data: link, error: linkError } = await supabase
      .from("links")
      .insert([linkInsert])
      .select()
      .single();

    if (linkError) throw linkError;

    // Save media if available
    let savedMedia: MediaData[] = [];
    if (finalMedia && Array.isArray(finalMedia) && finalMedia.length > 0) {
      try {
        const validMedia: MediaData[] = finalMedia.filter(
          (m: unknown) =>
            typeof m === "object" &&
            m !== null &&
            "url" in m &&
            "type" in m &&
            typeof (m as MediaData).url === "string" &&
            ["image", "video", "gif"].includes((m as MediaData).type)
        );
        if (validMedia.length > 0) {
          const mediaInserts: LinkMediaInsert[] = validMedia.map(
            (m, index) => ({
              link_id: link.id,
              media_url: m.url,
              media_type: m.type,
              position: index,
              user_id: user.id,
            })
          );
          await supabase.from("link_media").insert(mediaInserts);
          savedMedia = validMedia;
        }
      } catch (error) {
        // Log but don't fail the request if media save fails
        logger.error("Error saving link media:", error);
      }
    }

    // Auto-extract tags from link metadata + searchQuery hint
    const combinedText = combineTextForTagExtraction(
      finalTitle || null,
      finalDescription || null,
      finalAuthorName || null,
      searchQuery || null
    );

    // Get all biases for auto-tagging (passing server client)
    const biases = await getBiases(supabase);
    const extractedTagNames = extractAutoTags(combinedText, biases);

    // Create and link extracted tags using authenticated client
    const linkedTags = [];
    for (const tagName of extractedTagNames) {
      try {
        // Try to find existing tag
        const tagNameLower = tagName.toLowerCase();
        const { data: existingTags } = await supabase.from("tags").select("*");
        const existingTag = (existingTags ?? []).find(
          (t) => t.name.toLowerCase() === tagNameLower
        );

        let tag;
        if (existingTag) {
          tag = existingTag;
        } else {
          // Create new tag
          const { data: newTag, error: tagError } = await supabase
            .from("tags")
            .insert([{ name: tagName, user_id: user.id }])
            .select()
            .single();
          if (tagError) throw tagError;
          tag = newTag;
        }

        // Link tag to link
        await supabase
          .from("link_tags")
          .insert([{ link_id: link.id, tag_id: tag.id, user_id: user.id }]);
        linkedTags.push(tag);
      } catch (error) {
        // If it's a duplicate key error (23505), it means the link_tag already exists, so we can ignore it.
        // Otherwise, log the error.
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "23505"
        ) {
          // console.log(`Link tag already exists for link ${link.id} and tag ${tag?.id}. Skipping.`);
        } else {
          logger.error(`Error linking tag "${tagName}":`, error);
        }
      }
    }

    // Queue for auto-archive (if credentials configured)
    if (process.env.ARCHIVE_ORG_ACCESS_KEY && process.env.ARCHIVE_ORG_SECRET_KEY) {
      await supabase
        .from('links')
        .update({ archive_status: 'queued' })
        .eq('id', link.id);
    }

    // Return link with tags and media
    return NextResponse.json(
      { ...link, tags: linkedTags, media: savedMedia },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
