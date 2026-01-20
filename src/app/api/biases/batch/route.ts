import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { BiasInsert, GroupInsert } from '@/types/database'
import { handleApiError, unauthorized, badRequest } from '@/lib/api-error'

interface GroupInfo {
  name: string
  nameEn?: string
  nameKo?: string
  selcaSlug?: string | null
}

interface BatchMember {
  name: string
  groupName: string
  nameEn?: string
  nameKo?: string
  selcaSlug?: string
}

interface BatchRequest {
  members: BatchMember[]
  group?: GroupInfo
}

/**
 * POST /api/biases/batch
 * Create multiple biases at once (for adding all members of a group)
 * Requires authentication
 * Skips members that already exist (by name)
 * Creates or reuses group record and links via group_id FK
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const body: BatchRequest = await request.json()
    const { members, group } = body

    if (!members || !Array.isArray(members) || members.length === 0) {
      badRequest('추가할 멤버가 없습니다')
    }

    // Get or create the group record if group info is provided
    let groupId: string | null = null
    if (group?.name) {
      // Try to find existing group by name
      const { data: existingGroups } = await supabase.from('groups').select('*')
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
        // Create new group
        const groupInsert: GroupInsert = {
          name: group.name,
          name_en: group.nameEn || null,
          name_ko: group.nameKo || null,
          selca_slug: group.selcaSlug || null,
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

    // Get existing biases to check for duplicates
    const { data: existingBiases, error: fetchError } = await supabase
      .from('biases')
      .select('name')

    if (fetchError) throw fetchError

    // Create a set of existing names for quick lookup
    const existingNames = new Set(
      (existingBiases ?? []).map((b) => b.name.toLowerCase())
    )

    // Filter out members that already exist
    const newMembers = members.filter(
      (member) => !existingNames.has(member.name.toLowerCase())
    )

    const skipped = members.length - newMembers.length

    if (newMembers.length === 0) {
      return NextResponse.json({
        added: 0,
        skipped,
        message: '모든 멤버가 이미 존재합니다',
      })
    }

    // Get max sort_order to append new members at the end
    const { data: maxData } = await supabase
      .from('biases')
      .select('sort_order')
      .order('sort_order', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    const nextSortOrder = (maxData?.sort_order ?? 0) + 1

    // Prepare insert data with group_id and user_id
    const insertData: BiasInsert[] = newMembers.map((member, index) => ({
      name: member.name,
      group_name: member.groupName || null,
      group_id: groupId,
      name_en: member.nameEn || null,
      name_ko: member.nameKo || null,
      selca_slug: member.selcaSlug || null,
      sort_order: nextSortOrder + index,
      user_id: user.id,
    }))

    // Batch insert
    const { error: insertError } = await supabase
      .from('biases')
      .insert(insertData)

    if (insertError) throw insertError

    return NextResponse.json({
      added: newMembers.length,
      skipped,
      groupId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
