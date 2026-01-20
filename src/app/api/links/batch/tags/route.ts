import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, unauthorized, badRequest } from '@/lib/api-error'

/**
 * PATCH /api/links/batch/tags
 * Add or remove tags from multiple links at once
 * Requires authentication
 * Body: { linkIds: string[], addTags?: string[], removeTags?: string[] }
 * addTags: tag names (will be created if not exist)
 * removeTags: tag IDs to remove
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const body = await request.json()
    const { linkIds, addTags, removeTags } = body

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      badRequest('링크 ID 목록이 필요합니다')
    }

    if ((!addTags || addTags.length === 0) && (!removeTags || removeTags.length === 0)) {
      badRequest('추가하거나 삭제할 태그가 필요합니다')
    }

    let addedCount = 0
    let removedCount = 0

    // Handle tag additions
    if (addTags && addTags.length > 0) {
      // Get or create tags
      const tagIds: string[] = []

      for (const tagName of addTags) {
        const trimmedName = tagName.trim()
        if (!trimmedName) continue

        // Check if tag exists
        const { data: existingTags } = await supabase
          .from('tags')
          .select('id, name')

        const existingTag = (existingTags ?? []).find(
          t => t.name.toLowerCase() === trimmedName.toLowerCase()
        )

        if (existingTag) {
          tagIds.push(existingTag.id)
        } else {
          // Create new tag
          const { data: newTag, error } = await supabase
            .from('tags')
            .insert([{ name: trimmedName, user_id: user.id }])
            .select()
            .single()

          if (!error && newTag) {
            tagIds.push(newTag.id)
          }
        }
      }

      // Add tags to all links (ignore duplicates)
      for (const linkId of linkIds) {
        for (const tagId of tagIds) {
          const { error } = await supabase
            .from('link_tags')
            .insert([{ link_id: linkId, tag_id: tagId, user_id: user.id }])

          if (!error) {
            addedCount++
          }
        }
      }
    }

    // Handle tag removals
    if (removeTags && removeTags.length > 0) {
      const { count } = await supabase
        .from('link_tags')
        .delete({ count: 'exact' })
        .in('link_id', linkIds)
        .in('tag_id', removeTags)

      removedCount = count ?? 0
    }

    return NextResponse.json({
      updated: linkIds.length,
      addedCount,
      removedCount
    })
  } catch (error) {
    return handleApiError(error)
  }
}
