import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { Tag } from '@/types/database'
import { handleApiError, badRequest, notFound, unauthorized } from '@/lib/api-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/links/[id]/tags
 * Get all tags for a specific link
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!id) {
      badRequest('링크 ID가 필요합니다')
    }

    // Check if link exists
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()

    if (linkError || !link) {
      notFound('링크를 찾을 수 없습니다')
    }

    // Get tags for link
    const { data: linkTags, error: tagsError } = await supabase
      .from('link_tags')
      .select('tags(*)')
      .eq('link_id', id)

    if (tagsError) throw tagsError

    const tags = (linkTags ?? [])
      .map((lt) => (lt.tags as unknown) as Tag)
      .filter((t): t is Tag => t !== null)

    return NextResponse.json(tags)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/links/[id]/tags
 * Add a tag to a link (creates tag if it doesn't exist)
 * Requires authentication
 * Body: { name: string } or { tagId: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const { id } = await params
    const body = await request.json()
    const { name, tagId } = body

    if (!id) {
      badRequest('링크 ID가 필요합니다')
    }

    if (!name && !tagId) {
      badRequest('태그 이름 또는 ID가 필요합니다')
    }

    // Check if link exists
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()

    if (linkError || !link) {
      notFound('링크를 찾을 수 없습니다')
    }

    let finalTagId = tagId
    if (!tagId && name) {
      // Get or create tag
      const tagNameLower = name.trim().toLowerCase()
      const { data: existingTags } = await supabase.from('tags').select('*')
      const existingTag = (existingTags ?? []).find(
        (t) => t.name.toLowerCase() === tagNameLower
      )

      if (existingTag) {
        finalTagId = existingTag.id
      } else {
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert([{ name: name.trim(), user_id: user.id }])
          .select()
          .single()
        if (tagError) throw tagError
        finalTagId = newTag.id
      }
    }

    // Add tag to link (ignore duplicate error)
    await supabase.from('link_tags').insert([{ link_id: id, tag_id: finalTagId }])

    // Return updated tags list
    const { data: linkTags } = await supabase
      .from('link_tags')
      .select('tags(*)')
      .eq('link_id', id)

    const tags = (linkTags ?? [])
      .map((lt) => (lt.tags as unknown) as Tag)
      .filter((t): t is Tag => t !== null)

    return NextResponse.json(tags, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/links/[id]/tags
 * Remove a tag from a link
 * Requires authentication
 * Body: { tagId: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const { id } = await params
    const body = await request.json()
    const { tagId } = body

    if (!id) {
      badRequest('링크 ID가 필요합니다')
    }

    if (!tagId) {
      badRequest('태그 ID가 필요합니다')
    }

    // Check if link exists
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()

    if (linkError || !link) {
      notFound('링크를 찾을 수 없습니다')
    }

    // Remove tag from link
    await supabase
      .from('link_tags')
      .delete()
      .eq('link_id', id)
      .eq('tag_id', tagId)

    // Return updated tags list
    const { data: linkTags } = await supabase
      .from('link_tags')
      .select('tags(*)')
      .eq('link_id', id)

    const tags = (linkTags ?? [])
      .map((lt) => (lt.tags as unknown) as Tag)
      .filter((t): t is Tag => t !== null)

    return NextResponse.json(tags)
  } catch (error) {
    return handleApiError(error)
  }
}
