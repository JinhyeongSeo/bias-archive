import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { BiasInsert, GroupInsert } from '@/types/database'
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error'

/**
 * GET /api/biases
 * Get all biases
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('biases')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    return handleApiError(error)
  }
}

interface GroupInfo {
  name: string
  nameEn?: string
  nameKo?: string
}

/**
 * POST /api/biases
 * Create a new bias (requires authentication)
 * Body: { name, groupName?, nameEn?, nameKo?, group?: { name, nameEn?, nameKo? } }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const body = await request.json()
    const { name, groupName, nameEn, nameKo, selcaSlug, group } = body as {
      name: string
      groupName?: string
      nameEn?: string
      nameKo?: string
      selcaSlug?: string
      group?: GroupInfo
    }

    // Validate required field
    if (!name || typeof name !== 'string' || name.trim() === '') {
      badRequest('이름은 필수입니다')
    }

    // Get or create group if group info is provided
    let groupId: string | null = null
    if (group?.name) {
      // Try to find existing group by name
      const { data: existingGroups } = await supabase
        .from('groups')
        .select('*')

      const nameLower = group.name.toLowerCase()
      const existingGroup = (existingGroups ?? []).find(
        (g) =>
          g.name.toLowerCase() === nameLower ||
          g.name_en?.toLowerCase() === nameLower ||
          g.name_ko?.toLowerCase() === nameLower
      )

      if (existingGroup) {
        groupId = existingGroup.id
      } else {
        // Create new group with authenticated client
        const groupInsert: GroupInsert = {
          name: group.name,
          name_en: group.nameEn || null,
          name_ko: group.nameKo || null,
          user_id: user.id,
        }
        const { data: newGroup, error: groupError } = await supabase
          .from('groups')
          .insert([groupInsert])
          .select()
          .single()

        if (groupError) throw groupError
        groupId = newGroup.id
      }
    }

    // Get max sort_order for this user to append new bias at the end
    const { data: maxData } = await supabase
      .from('biases')
      .select('sort_order')
      .order('sort_order', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    const nextSortOrder = (maxData?.sort_order ?? 0) + 1

    // Create bias with authenticated client
    const biasInsert: BiasInsert = {
      name: name.trim(),
      group_name: groupName?.trim() || null,
      name_en: nameEn?.trim() || null,
      name_ko: nameKo?.trim() || null,
      selca_slug: selcaSlug?.trim() || null,
      group_id: groupId,
      sort_order: nextSortOrder,
      user_id: user.id,
    }

    const { data: bias, error: biasError } = await supabase
      .from('biases')
      .insert([biasInsert])
      .select()
      .single()

    if (biasError) throw biasError
    return NextResponse.json(bias, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
