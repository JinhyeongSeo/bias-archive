import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * PUT /api/biases/reorder
 * Update the sort order of biases (requires authentication)
 * Body: { orderedIds: string[] } - array of bias IDs in desired order
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderedIds } = body

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

    if (!orderedIds.every((id) => typeof id === 'string' && id.trim() !== '')) {
      return NextResponse.json(
        { error: 'All IDs must be non-empty strings' },
        { status: 400 }
      )
    }

    // Update each bias with its new sort_order
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from('biases')
          .update({ sort_order: index + 1 })
          .eq('id', id)
      )
    )

    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} bias(es)`)
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
