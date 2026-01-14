import { NextRequest, NextResponse } from 'next/server'
import { reorderBiases, moveBiasToGroup } from '@/lib/biases'

/**
 * PUT /api/biases/reorder
 * Update the sort order of biases, optionally moving to a different group
 * Body: { orderedIds: string[] } - array of bias IDs in desired order
 * Body (for group move): { biasId: string, targetGroupId: string | null, orderedIds: string[] }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds, biasId, targetGroupId } = body

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

    // If biasId is provided, this is a group move operation
    if (biasId) {
      if (typeof biasId !== 'string' || biasId.trim() === '') {
        return NextResponse.json(
          { error: 'biasId must be a non-empty string' },
          { status: 400 }
        )
      }
      // targetGroupId can be null (for ungrouped) or a string
      if (targetGroupId !== null && (typeof targetGroupId !== 'string' || targetGroupId.trim() === '')) {
        return NextResponse.json(
          { error: 'targetGroupId must be null or a non-empty string' },
          { status: 400 }
        )
      }
      await moveBiasToGroup(biasId, targetGroupId, orderedIds)
    } else {
      await reorderBiases(orderedIds)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering biases:', error)
    return NextResponse.json(
      { error: '순서 변경에 실패했습니다' },
      { status: 500 }
    )
  }
}
