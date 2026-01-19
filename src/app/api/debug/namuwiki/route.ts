import { NextRequest, NextResponse } from 'next/server'

const USER_AGENT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

/**
 * GET /api/debug/namuwiki?q=검색어
 * Debug endpoint to test namuwiki fetch from Vercel
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || '하이키'

  const url = `https://namu.wiki/w/${encodeURIComponent(query)}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const text = await response.text()

    return NextResponse.json({
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500),
      titleMatch: text.match(/<title>([^<]*)<\/title>/)?.[1] || null,
    })
  } catch (error) {
    return NextResponse.json({
      url,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : 'Unknown',
    }, { status: 500 })
  }
}
