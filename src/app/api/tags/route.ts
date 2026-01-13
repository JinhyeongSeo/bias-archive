import { NextRequest, NextResponse } from 'next/server'
import { getTags, createTag } from '@/lib/tags'

/**
 * GET /api/tags
 * Get all tags
 */
export async function GET() {
  try {
    const tags = await getTags()
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
 * Create a new tag
 * Body: { name }
 */
export async function POST(request: NextRequest) {
  try {
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

    const tag = await createTag(trimmedName)
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: '태그를 생성하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
