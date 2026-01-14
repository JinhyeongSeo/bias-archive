import { NextRequest, NextResponse } from 'next/server'
import { reorderGroups } from '@/lib/groups'

/**
 * PUT /api/groups/reorder
 * Update the sort order of groups
 * Body: { orderedIds: string[] } - array of group IDs in desired order
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = body

    // Validate request body
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds must be an array of group IDs' },
        { status: 400 }
      )
    }

    if (orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds array cannot be empty' },
        { status: 400 }
      )
    }

    // Validate all IDs are strings
    if (!orderedIds.every((id) => typeof id === 'string' && id.trim() !== '')) {
      return NextResponse.json(
        { error: 'All IDs must be non-empty strings' },
        { status: 400 }
      )
    }

    await reorderGroups(orderedIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering groups:', error)
    return NextResponse.json(
      { error: '그룹 순서 변경에 실패했습니다' },
      { status: 500 }
    )
  }
}
