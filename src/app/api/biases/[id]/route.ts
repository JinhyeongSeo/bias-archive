import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, badRequest, unauthorized, notFound } from '@/lib/api-error'

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
        notFound('최애를 찾을 수 없습니다')
      }
      throw error
    }

    return NextResponse.json(bias)
  } catch (error) {
    return handleApiError(error)
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
      unauthorized()
    }

    const { id } = await params
    const body = await request.json()
    const { name, groupName, nameEn, nameKo } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      badRequest('이름은 필수입니다')
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
    return handleApiError(error)
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
      unauthorized()
    }

    const { id } = await params
    const { error } = await supabase
      .from('biases')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
