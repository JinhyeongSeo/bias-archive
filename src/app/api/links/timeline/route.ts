import { NextRequest, NextResponse } from 'next/server'
import { getLinksOnThisDay } from '@/lib/links'

/**
 * GET /api/links/timeline
 * Get links saved on this day in past years ("On This Day" feature)
 * Query params:
 * - years: how many years back to look (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const yearsParam = searchParams.get('years')
    const years = yearsParam ? parseInt(yearsParam, 10) : 1

    // Validate years parameter
    if (isNaN(years) || years < 1 || years > 10) {
      return NextResponse.json(
        { error: 'years 파라미터는 1-10 사이의 숫자여야 합니다' },
        { status: 400 }
      )
    }

    const links = await getLinksOnThisDay(years)

    // Return empty array if no content found (client can decide how to handle)
    return NextResponse.json(links)
  } catch (error) {
    console.error('Error fetching timeline links:', error)
    return NextResponse.json(
      { error: '타임라인 데이터를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}
