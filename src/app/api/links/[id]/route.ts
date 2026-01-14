import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/links/[id]
 * Get a single link by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      )
    }

    const { data: link, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '링크를 찾을 수 없습니다' },
          { status: 404 }
        )
      }
      throw error
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
 * Delete a link by ID (requires authentication)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: '링크 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // Check if link exists
    const { data: link, error: fetchError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !link) {
      return NextResponse.json(
        { error: '링크를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting link:', error)
    return NextResponse.json(
      { error: '링크를 삭제하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
