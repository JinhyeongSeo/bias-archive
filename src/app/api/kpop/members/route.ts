import { NextRequest, NextResponse } from 'next/server'
import { searchMembers } from '@/lib/kpop-data'

/**
 * GET /api/kpop/members?q=검색어
 * Search for K-pop idols by name (English or Korean)
 * Returns members with their group info
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

    const members = searchMembers(query.trim())
    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error searching K-pop members:', error)
    return NextResponse.json(
      { error: '멤버 검색에 실패했습니다' },
      { status: 500 }
    )
  }
}
