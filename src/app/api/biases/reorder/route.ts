import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, unauthorized, badRequest } from '@/lib/api-error'

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
      unauthorized()
    }

    const body = await request.json()
    const { orderedIds } = body

    if (!orderedIds || !Array.isArray(orderedIds)) {
      badRequest('orderedIds must be an array of bias IDs')
    }

    if (orderedIds.length === 0) {
      badRequest('orderedIds array cannot be empty')
    }

    if (!orderedIds.every((id) => typeof id === 'string' && id.trim() !== '')) {
      badRequest('All IDs must be non-empty strings')
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
    return handleApiError(error)
  }
}
