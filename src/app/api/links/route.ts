import { NextRequest, NextResponse } from 'next/server'
import { createLink, searchLinksWithTags, checkDuplicateUrl, createLinkMedia } from '@/lib/links'
import type { LinkInsert, MediaData } from '@/lib/links'
import { getBiases } from '@/lib/biases'
import { getOrCreateTag, addTagToLink } from '@/lib/tags'
import { extractAutoTags, combineTextForTagExtraction } from '@/lib/autoTag'

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
    const { searchParams } = new URL(request.url)
    const biasId = searchParams.get('bias_id') || undefined
    const search = searchParams.get('search') || undefined
    const tagsParam = searchParams.get('tags') || undefined
    const platform = searchParams.get('platform') || undefined

    // Parse tags parameter (comma-separated IDs)
    const tagIds = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined

    const links = await searchLinksWithTags({
      biasId,
      search,
      tagIds,
      platform,
    })
    return NextResponse.json(links)
  } catch (error) {
    console.error('Error fetching links:', error)
    return NextResponse.json(
      { error: '링크 목록을 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/links
 * Create a new link
 * Body: { url, title, description, thumbnailUrl, platform, originalDate, biasId, searchQuery, media }
 * searchQuery: optional hint for auto-tagging (e.g., from external search)
 * media: optional array of { url, type } for multi-image support (e.g., Twitter)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, title, description, thumbnailUrl, platform, originalDate, authorName, biasId, searchQuery, media } = body

    // Validate required field
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL은 필수입니다' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 URL입니다' },
        { status: 400 }
      )
    }

    // Check for duplicate URL
    const isDuplicate = await checkDuplicateUrl(url)
    if (isDuplicate) {
      return NextResponse.json(
        { error: '이미 저장된 URL입니다' },
        { status: 409 }
      )
    }

    // Prepare link data
    const linkData: LinkInsert = {
      url,
      title: title || null,
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      platform: platform || null,
      original_date: originalDate || null,
      author_name: authorName || null,
      bias_id: biasId || null,
    }

    const link = await createLink(linkData)

    // Save media if provided (e.g., Twitter multi-image)
    let savedMedia: MediaData[] = []
    if (media && Array.isArray(media) && media.length > 0) {
      try {
        const validMedia: MediaData[] = media.filter(
          (m: unknown) =>
            typeof m === 'object' &&
            m !== null &&
            'url' in m &&
            'type' in m &&
            typeof (m as MediaData).url === 'string' &&
            ['image', 'video', 'gif'].includes((m as MediaData).type)
        )
        if (validMedia.length > 0) {
          await createLinkMedia(link.id, validMedia)
          savedMedia = validMedia
        }
      } catch (error) {
        // Log but don't fail the request if media save fails
        console.error('Error saving link media:', error)
      }
    }

    // Auto-extract tags from link metadata + searchQuery hint
    const combinedText = combineTextForTagExtraction(
      title || null,
      description || null,
      authorName || null,
      searchQuery || null
    )

    const biases = await getBiases()
    const extractedTagNames = extractAutoTags(combinedText, biases)

    // Create and link extracted tags
    const linkedTags = []
    for (const tagName of extractedTagNames) {
      try {
        const tag = await getOrCreateTag(tagName)
        await addTagToLink(link.id, tag.id)
        linkedTags.push(tag)
      } catch (error) {
        // Log but don't fail the request if tagging fails
        console.error(`Error linking tag "${tagName}":`, error)
      }
    }

    // Return link with tags and media
    return NextResponse.json({ ...link, tags: linkedTags, media: savedMedia }, { status: 201 })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json(
      { error: '링크를 저장하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
