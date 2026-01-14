import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { BiasInsert, GroupInsert } from '@/types/database'

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
    console.error('Error fetching biases:', error)
    return NextResponse.json(
      { error: '최애 목록을 가져오는데 실패했습니다' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, groupName, nameEn, nameKo, group } = body as {
      name: string
      groupName?: string
      nameEn?: string
      nameKo?: string
      group?: GroupInfo
    }

    // Validate required field
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: '이름은 필수입니다' },
        { status: 400 }
      )
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

    // Create bias with authenticated client
    const biasInsert: BiasInsert = {
      name: name.trim(),
      group_name: groupName?.trim() || null,
      name_en: nameEn?.trim() || null,
      name_ko: nameKo?.trim() || null,
      group_id: groupId,
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
    console.error('Error creating bias:', error)
    return NextResponse.json(
      { error: '최애를 추가하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
