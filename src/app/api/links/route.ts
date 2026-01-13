import { NextRequest, NextResponse } from 'next/server'
import { createLink, getLinksWithTags, checkDuplicateUrl } from '@/lib/links'
import type { LinkInsert } from '@/lib/links'
import { getBiases } from '@/lib/biases'
import { getOrCreateTag, addTagToLink } from '@/lib/tags'
import { extractAutoTags, combineTextForTagExtraction } from '@/lib/autoTag'

/**
 * GET /api/links
 * Get all links with tags, optionally filtered by bias_id query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const biasId = searchParams.get('bias_id') || undefined

    const links = await getLinksWithTags(biasId)
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
 * Body: { url, title, description, thumbnailUrl, platform, originalDate, biasId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, title, description, thumbnailUrl, platform, originalDate, authorName, biasId } = body

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

    // Auto-extract tags from link metadata
    const combinedText = combineTextForTagExtraction(
      title || null,
      description || null,
      authorName || null
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

    // Return link with tags
    return NextResponse.json({ ...link, tags: linkedTags }, { status: 201 })
  } catch (error) {
    console.error('Error creating link:', error)
    return NextResponse.json(
      { error: '링크를 저장하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
