/**
 * Image proxy API for sites with hotlink protection
 * Fetches images server-side with proper Referer headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, badRequest } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    badRequest('URL is required')
  }

  try {
    // Determine referer based on URL
    let referer = ''
    if (url.includes('kgirls.net')) {
      referer = 'https://www.kgirls.net/'
    } else if (url.includes('heye.kr')) {
      referer = 'https://heye.kr/'
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': referer,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
