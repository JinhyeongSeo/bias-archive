import { NextRequest, NextResponse } from 'next/server'
import { getBiases, createBias } from '@/lib/biases'

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

/**
 * POST /api/biases
 * Create a new bias
 * Body: { name, groupName? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, groupName } = body

    // Validate required field
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: '이름은 필수입니다' },
        { status: 400 }
      )
    }

    const bias = await createBias(name.trim(), groupName?.trim() || null)
    return NextResponse.json(bias, { status: 201 })
  } catch (error) {
    console.error('Error creating bias:', error)
    return NextResponse.json(
      { error: '최애를 추가하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
