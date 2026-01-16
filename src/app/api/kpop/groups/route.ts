import { NextRequest, NextResponse } from 'next/server'
import { searchGroups } from '@/lib/parsers/selca'

/**
 * GET /api/kpop/groups?q=검색어
 * Search for K-pop groups by name (English or Korean)
 * Uses selca.kastden.org for real-time data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '검색어가 필요합니다' },
        { status: 400 }
      )
    }

    const groups = await searchGroups(query.trim())
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error searching K-pop groups:', error)
    return NextResponse.json(
      { error: '그룹 검색에 실패했습니다' },
      { status: 500 }
    )
  }
}
