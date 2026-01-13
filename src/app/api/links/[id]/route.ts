import { NextRequest, NextResponse } from 'next/server'
import { getLinkById, deleteLink } from '@/lib/links'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/links/[id]
 * Get a single link by ID
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

    return NextResponse.json(link)
  } catch (error) {
    console.error('Error fetching link:', error)
    return NextResponse.json(
      { error: '링크를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/links/[id]
 * Delete a link by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // Check if link exists
    const link = await getLinkById(id)
    if (!link) {
      return NextResponse.json(
        { error: '링크를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    await deleteLink(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting link:', error)
    return NextResponse.json(
      { error: '링크를 삭제하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
