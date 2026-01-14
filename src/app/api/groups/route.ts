import { NextRequest, NextResponse } from 'next/server'
import { getGroups, createGroup } from '@/lib/groups'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/groups
 * Get all groups
 */
export async function GET() {
  try {
    const groups = await getGroups()
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error getting groups:', error)
    return NextResponse.json(
      { error: '그룹 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/groups
 * Create a new group (requires authentication)
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
    const { name, nameEn, nameKo } = body

    if (!name) {
      return NextResponse.json(
        { error: '그룹 이름은 필수입니다' },
        { status: 400 }
      )
    }

    const group = await createGroup(name, nameEn, nameKo, user.id)
    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: '그룹 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
