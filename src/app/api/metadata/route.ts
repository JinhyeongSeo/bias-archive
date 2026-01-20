import { NextResponse } from 'next/server'
import { extractMetadata } from '@/lib/metadata'
import { handleApiError, badRequest } from '@/lib/api-error'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    // Validate URL presence
    if (!url || typeof url !== 'string') {
      badRequest('URL is required')
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      badRequest('Invalid URL format')
    }

    // Extract metadata
    const metadata = await extractMetadata(url)

    return NextResponse.json({
      url,
      ...metadata,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
