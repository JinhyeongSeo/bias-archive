import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { searchMembers } from '@/lib/parsers/selca'
import { handleApiError, badRequest } from '@/lib/api-error'

/**
 * GET /api/kpop/members?q=검색어
 * Search for K-pop idols by name (English or Korean)
 * Returns members with their group info
 * Uses selca.kastden.org for real-time data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      badRequest('검색어가 필요합니다')
    }

    const members = await searchMembers(query.trim())
    return NextResponse.json({ members })
  } catch (error) {
    return handleApiError(error)
  }
}
