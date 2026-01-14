import { NextRequest, NextResponse } from 'next/server'
import { getBiases, createBias } from '@/lib/biases'
import { getOrCreateGroup } from '@/lib/groups'

/**
 * GET /api/biases
 * Get all biases
 */
export async function GET() {
  try {
    const biases = await getBiases()
    return NextResponse.json(biases)
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
 * Create a new bias
 * Body: { name, groupName?, nameEn?, nameKo?, group?: { name, nameEn?, nameKo? } }
 */
export async function POST(request: NextRequest) {
  try {
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
      const groupRecord = await getOrCreateGroup(
        group.name,
        group.nameEn,
        group.nameKo
      )
      groupId = groupRecord.id
    }

    const bias = await createBias(
      name.trim(),
      groupName?.trim() || null,
      nameEn?.trim() || null,
      nameKo?.trim() || null,
      groupId
    )
    return NextResponse.json(bias, { status: 201 })
  } catch (error) {
    console.error('Error creating bias:', error)
    return NextResponse.json(
      { error: '최애를 추가하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
