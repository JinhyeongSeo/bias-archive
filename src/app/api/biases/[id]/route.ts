import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/biases/[id]
 * Get a single bias by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: bias, error } = await supabase
      .from('biases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '최애를 찾을 수 없습니다' },
          { status: 404 }
        )
      }
      throw error
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
 * Update a bias (requires authentication)
 * Body: { name, groupName?, nameEn?, nameKo? }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json()
    const { name, groupName, nameEn, nameKo } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: '이름은 필수입니다' },
        { status: 400 }
      )
    }

    const { data: bias, error } = await supabase
      .from('biases')
      .update({
        name: name.trim(),
        group_name: groupName?.trim() ?? null,
        name_en: nameEn?.trim() ?? null,
        name_ko: nameKo?.trim() ?? null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
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
 * Delete a bias (requires authentication)
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
    const { error } = await supabase
      .from('biases')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bias:', error)
    return NextResponse.json(
      { error: '최애를 삭제하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
