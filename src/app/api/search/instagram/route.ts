/**
 * Instagram Search API
 *
 * Uses Apify Instagram Hashtag Scraper to get posts from a hashtag
 *
 * @remarks
 * - Requires APIFY_API_TOKEN environment variable
 * - Returns { notConfigured: true } if token not set
 * - Searches for posts with the given hashtag
 * - Returns posts from the hashtag
 * - Caching is handled client-side via Supabase (like other platforms)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApifyClient } from 'apify-client'
import { decodeHtmlEntities } from '@/lib/utils/decodeHtmlEntities'
import type { ParsedMedia } from '@/lib/parsers'

// Extend max duration for Apify actor execution (Vercel Hobby: max 60s)
export const maxDuration = 60

interface ApifyChildPost {
  id: string
  shortCode?: string
  type?: string  // 'Image', 'Video'
  displayUrl?: string
  videoUrl?: string
}

interface ApifyHashtagPost {
  id: string
  shortCode: string
  url: string
  caption?: string
  displayUrl?: string
  videoUrl?: string
  ownerUsername?: string
  ownerFullName?: string
  timestamp?: string
  likesCount?: number
  commentsCount?: number
  type?: string  // 'Image', 'Video', 'Sidecar'
  childPosts?: ApifyChildPost[]  // Carousel/Sidecar posts have child images
}

interface InstagramSearchResult {
  url: string
  title: string
  thumbnailUrl: string | null
  author: string
  media: ParsedMedia[]  // All images/videos for carousel support (empty array if none)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  // Check for API token
  const apiToken = process.env.APIFY_API_TOKEN
  if (!apiToken) {
    return NextResponse.json({ notConfigured: true, results: [], hasMore: false })
  }

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다' },
      { status: 400 }
    )
  }

  // Remove # if present
  const hashtag = query.replace(/^#/, '')

  try {
    console.log(`[Instagram Search] Calling Apify Hashtag Scraper for: #${hashtag}`)
    const client = new ApifyClient({ token: apiToken })

    // Run Instagram Hashtag Scraper actor
    // Actor ID: apify/instagram-hashtag-scraper
    const run = await client.actor('apify/instagram-hashtag-scraper').call(
      {
        hashtags: [hashtag],
        resultsLimit: limit,
        resultsType: 'posts', // 'posts', 'reels', or 'stories'
      },
      {
        timeout: 60, // 60 seconds timeout
      }
    )

    // Get results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    // Transform results to unified format
    const results: InstagramSearchResult[] = (items as unknown as ApifyHashtagPost[]).map((item) => {
      // Decode HTML entities and truncate caption for title (first 50 chars)
      const rawCaption = item.caption || ''
      const caption = decodeHtmlEntities(rawCaption)
      const title = caption.length > 50 ? caption.substring(0, 50) + '...' : caption || `#${hashtag} 게시물`

      // Build media array for viewer support
      const media: ParsedMedia[] = []

      // For Sidecar (carousel) posts, use childPosts if available
      if (item.type === 'Sidecar' && item.childPosts && item.childPosts.length > 0) {
        for (const child of item.childPosts) {
          if (child.videoUrl) {
            media.push({ type: 'video', url: decodeHtmlEntities(child.videoUrl) })
          } else if (child.displayUrl) {
            media.push({ type: 'image', url: decodeHtmlEntities(child.displayUrl) })
          }
        }
      }

      // Fallback to single displayUrl/videoUrl if no childPosts or not a Sidecar
      if (media.length === 0) {
        if (item.videoUrl) {
          media.push({ type: 'video', url: decodeHtmlEntities(item.videoUrl) })
        } else if (item.displayUrl) {
          media.push({ type: 'image', url: decodeHtmlEntities(item.displayUrl) })
        }
      }

      return {
        url: item.url || `https://www.instagram.com/p/${item.shortCode}/`,
        title,
        thumbnailUrl: item.displayUrl ? decodeHtmlEntities(item.displayUrl) : null,
        author: decodeHtmlEntities(item.ownerUsername || hashtag),
        media,  // Always return array (empty if no media)
      }
    })

    const hasMore = results.length >= limit

    return NextResponse.json({
      results,
      hasMore,
    })
  } catch (error) {
    console.error('[Instagram Search] Error:', error)

    if (error instanceof Error) {
      // Handle Apify-specific errors
      if (error.message.includes('timeout') || error.message.includes('aborted')) {
        return NextResponse.json(
          { error: 'Instagram 검색 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' },
          { status: 504 }
        )
      }

      if (error.message.includes('API_KEY') || error.message.includes('token')) {
        return NextResponse.json(
          { error: 'Instagram API 설정에 문제가 있습니다.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Instagram 검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
