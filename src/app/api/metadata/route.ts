import { NextResponse } from 'next/server'
import { extractMetadata } from '@/lib/metadata'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    // Validate URL presence
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Extract metadata
    const metadata = await extractMetadata(url)

    return NextResponse.json({
      url,
      ...metadata,
    })
  } catch (error) {
    console.error('Metadata extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract metadata' },
      { status: 500 }
    )
  }
}
