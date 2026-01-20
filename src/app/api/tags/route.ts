import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, unauthorized, badRequest } from '@/lib/api-error'

/**
 * GET /api/tags
 * Get tags - by default returns only tags that are in use (linked to links)
 * Query params:
 *   - all=true: Return all tags including unused ones
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    if (showAll) {
      // Return all tags
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return NextResponse.json(data ?? [])
    } else {
      // Return only tags that are in use
      const { data: linkTags, error } = await supabase
        .from('link_tags')
        .select('tag_id, tags(*)')

      if (error) throw error

      // Get unique tags
      const uniqueTags = new Map()
      for (const lt of linkTags ?? []) {
        if (lt.tags && !uniqueTags.has(lt.tag_id)) {
          uniqueTags.set(lt.tag_id, lt.tags)
        }
      }

      const tags = Array.from(uniqueTags.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      return NextResponse.json(tags)
    }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/tags
 * Create a new tag (requires authentication)
 * Body: { name }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      badRequest('태그 이름은 필수입니다')
    }

    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      badRequest('태그 이름은 비어있을 수 없습니다')
    }

    const { data: tag, error } = await supabase
      .from('tags')
      .insert([{ name: trimmedName, user_id: user.id }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
