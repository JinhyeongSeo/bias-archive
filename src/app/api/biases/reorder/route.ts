import { NextRequest, NextResponse } from 'next/server'
import { reorderBiases } from '@/lib/biases'

/**
 * PUT /api/biases/reorder
 * Update the sort order of biases
 * Body: { orderedIds: string[] } - array of bias IDs in desired order
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = body

    // Validate request body
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds must be an array of bias IDs' },
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

    await reorderBiases(orderedIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering biases:', error)
    return NextResponse.json(
      { error: '순서 변경에 실패했습니다' },
      { status: 500 }
    )
  }
}
