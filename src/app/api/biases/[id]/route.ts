import { NextRequest, NextResponse } from 'next/server'
import { getBias, updateBias, deleteBias } from '@/lib/biases'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/biases/[id]
 * Get a single bias by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const bias = await getBias(id)

    if (!bias) {
      return NextResponse.json(
        { error: '최애를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(bias)
  } catch (error) {
    console.error('Error fetching bias:', error)
    return NextResponse.json(
      { error: '최애를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/biases/[id]
 * Update a bias
 * Body: { name, groupName? }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, groupName } = body

    // Validate required field
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: '이름은 필수입니다' },
        { status: 400 }
      )
    }

    const bias = await updateBias(id, name.trim(), groupName?.trim() || null)
    return NextResponse.json(bias)
  } catch (error) {
    console.error('Error updating bias:', error)
    return NextResponse.json(
      { error: '최애를 수정하는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/biases/[id]
 * Delete a bias
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteBias(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bias:', error)
    return NextResponse.json(
      { error: '최애를 삭제하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
