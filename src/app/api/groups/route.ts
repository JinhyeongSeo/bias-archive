import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { GroupInsert } from '@/types/database'
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error'

/**
 * GET /api/groups
 * Get all groups
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/groups
 * Create a new group (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const body = await request.json()
    const { name, nameEn, nameKo } = body

    if (!name) {
      badRequest('그룹 이름은 필수입니다')
    }

    // Get max sort_order to append new group at the end
    const { data: maxData } = await supabase
      .from('groups')
      .select('sort_order')
      .order('sort_order', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    const nextSortOrder = (maxData?.sort_order ?? 0) + 1

    const groupInsert: GroupInsert = {
      name,
      name_en: nameEn || null,
      name_ko: nameKo || null,
      sort_order: nextSortOrder,
      user_id: user.id,
    }

    const { data: group, error } = await supabase
      .from('groups')
      .insert([groupInsert])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
