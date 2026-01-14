import { NextRequest, NextResponse } from 'next/server'
import { getTags, createTag, getTagsInUse } from '@/lib/tags'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/tags
 * Get tags - by default returns only tags that are in use (linked to links)
 * Query params:
 *   - all=true: Return all tags including unused ones
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const tags = showAll ? await getTags() : await getTagsInUse()
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: '태그 목록을 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tags
 * Create a new tag (requires authentication)
 * Body: { name }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name } = body

    // Validate required field
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '태그 이름은 필수입니다' },
        { status: 400 }
      )
    }

    // Trim and validate name
    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: '태그 이름은 비어있을 수 없습니다' },
        { status: 400 }
      )
    }

    const tag = await createTag(trimmedName, user.id)
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: '태그를 생성하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
