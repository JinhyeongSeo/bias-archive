import { NextRequest, NextResponse } from 'next/server'
import { getLinkById } from '@/lib/links'
import { getOrCreateTag, addTagToLink, removeTagFromLink, getTagsForLink } from '@/lib/tags'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/links/[id]/tags
 * Get all tags for a specific link
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const link = await getLinkById(id)
    if (!link) {
      return NextResponse.json(
        { error: '링크를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const tags = await getTagsForLink(id)
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching link tags:', error)
    return NextResponse.json(
      { error: '태그를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/links/[id]/tags
 * Add a tag to a link (creates tag if it doesn't exist)
 * Body: { name: string } or { tagId: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, tagId } = body

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      )
    }

    if (!name && !tagId) {
      return NextResponse.json(
        { error: '태그 이름 또는 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const link = await getLinkById(id)
    if (!link) {
      return NextResponse.json(
        { error: '링크를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Get or create tag
    let tag
    if (tagId) {
      // If tagId provided, just link it
      await addTagToLink(id, tagId)
      const tags = await getTagsForLink(id)
      return NextResponse.json(tags)
    } else {
      // Create tag if needed and link it
      tag = await getOrCreateTag(name.trim())
      await addTagToLink(id, tag.id)
    }

    // Return updated tags list
    const tags = await getTagsForLink(id)
    return NextResponse.json(tags, { status: 201 })
  } catch (error) {
    console.error('Error adding tag to link:', error)
    return NextResponse.json(
      { error: '태그를 추가하는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/links/[id]/tags
 * Remove a tag from a link
 * Body: { tagId: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { tagId } = body

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      )
    }

    if (!tagId) {
      return NextResponse.json(
        { error: '태그 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const link = await getLinkById(id)
    if (!link) {
      return NextResponse.json(
        { error: '링크를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    await removeTagFromLink(id, tagId)

    // Return updated tags list
    const tags = await getTagsForLink(id)
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error removing tag from link:', error)
    return NextResponse.json(
      { error: '태그를 제거하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
