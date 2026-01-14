import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getOrCreateGroup } from '@/lib/groups'
import { createClient } from '@/lib/supabase-server'
import type { BiasInsert } from '@/types/database'

interface GroupInfo {
  name: string
  nameEn?: string
  nameKo?: string
}

interface BatchMember {
  name: string
  groupName: string
  nameEn?: string
  nameKo?: string
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
    // Check authentication
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body: BatchRequest = await request.json()
    const { members, group } = body

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: '추가할 멤버가 없습니다' },
        { status: 400 }
      )
    }

    // Get or create the group record if group info is provided
    let groupId: string | null = null
    if (group?.name) {
      const groupRecord = await getOrCreateGroup(
        group.name,
        group.nameEn,
        group.nameKo,
        user.id
      )
      groupId = groupRecord.id
    }

    // Get existing biases to check for duplicates
    const { data: existingBiases, error: fetchError } = await supabase
      .from('biases')
      .select('name')

    if (fetchError) {
      throw fetchError
    }

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

    // Prepare insert data with group_id and user_id
    const insertData: BiasInsert[] = newMembers.map((member) => ({
      name: member.name,
      group_name: member.groupName || null,
      group_id: groupId,
      name_en: member.nameEn || null,
      name_ko: member.nameKo || null,
      user_id: user.id,
    }))

    // Batch insert
    const { error: insertError } = await supabase
      .from('biases')
      .insert(insertData)

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      added: newMembers.length,
      skipped,
      groupId,
    })
  } catch (error) {
    console.error('Error batch creating biases:', error)
    return NextResponse.json(
      { error: '최애 일괄 추가에 실패했습니다' },
      { status: 500 }
    )
  }
}
