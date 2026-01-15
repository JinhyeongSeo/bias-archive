/**
 * ScrapeBadger Twitter API client
 * https://scrapebadger.com/twitter-api
 *
 * Pricing: $0.10 per 1,000 items
 * Rate limits: No limits (1,000 req/s)
 * Response time: <100ms
 */

export interface ScrapeBadgerTweet {
  id: string
  text: string
  created_at: string
  author: {
    id: string
    username: string
    name: string
    profile_image_url?: string
  }
  media?: {
    type: 'photo' | 'video' | 'animated_gif'
    url: string
    preview_url?: string
  }[]
  metrics?: {
    likes: number
    retweets: number
    replies: number
    views: number
  }
}

export interface ScrapeBadgerSearchResponse {
  data: ScrapeBadgerTweet[]
  meta?: {
    next_cursor?: string
    result_count: number
  }
}

export interface TwitterSearchResult {
  link: string
  title: string
  snippet: string
  thumbnailUrl?: string
  authorName?: string
  authorUsername?: string
  createdAt?: string
}

export interface TwitterSearchResponse {
  results: TwitterSearchResult[]
  hasMore: boolean
  nextCursor?: string
  totalResults?: number
}

export type SearchType = 'top' | 'latest' | 'media'

export interface ScrapeBadgerSearchOptions {
  type?: SearchType
  cursor?: string
  count?: number
}

const BASE_URL = 'https://api.scrapebadger.com/v1/twitter'

/**
 * Search Twitter using ScrapeBadger API
 * Provides real-time search results (unlike Google CSE which only indexes past tweets)
 *
 * @param query - Search query string
 * @param options - Search options (type, cursor, count)
 * @returns Object with results array and pagination info
 */
export async function searchTwitterWithScrapeBadger(
  query: string,
  options: ScrapeBadgerSearchOptions = {}
): Promise<TwitterSearchResponse> {
  const { type = 'top', cursor, count = 20 } = options

  const apiKey = process.env.SCRAPEBADGER_API_KEY

  if (!apiKey) {
    throw new Error('ScrapeBadger API key is not configured')
  }

  const params = new URLSearchParams({
    query,
    type,
    count: String(count),
  })

  if (cursor) {
    params.set('cursor', cursor)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${BASE_URL}/search?${params}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ScrapeBadger API error: ${response.status} - ${errorText}`)
    }

    const data: ScrapeBadgerSearchResponse = await response.json()

    // Transform ScrapeBadger response to our format
    const results: TwitterSearchResult[] = (data.data || []).map((tweet) => ({
      link: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`,
      title: `${tweet.author.name} (@${tweet.author.username})`,
      snippet: tweet.text,
      thumbnailUrl: tweet.media?.[0]?.preview_url || tweet.media?.[0]?.url,
      authorName: tweet.author.name,
      authorUsername: tweet.author.username,
      createdAt: tweet.created_at,
    }))

    return {
      results,
      hasMore: !!data.meta?.next_cursor,
      nextCursor: data.meta?.next_cursor,
      totalResults: data.meta?.result_count,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Check if ScrapeBadger API is configured
 */
export function isScrapeBadgerConfigured(): boolean {
  return !!process.env.SCRAPEBADGER_API_KEY
}
