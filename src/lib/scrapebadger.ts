/**
 * ScrapeBadger Twitter API client
 * https://scrapebadger.com/twitter-api
 *
 * Pricing: $0.10 per 1,000 items
 * Rate limits: No limits (1,000 req/s)
 * Response time: <100ms
 */

// 실제 ScrapeBadger API 응답 형식
export interface ScrapeBadgerTweet {
  id: string
  text: string
  full_text: string
  created_at: string
  lang: string
  user_id: string
  username: string
  user_name: string
  favorite_count: number
  retweet_count: number
  reply_count: number
  quote_count: number
  view_count: string
  bookmark_count: number
  media?: {
    type: 'photo' | 'video' | 'animated_gif'
    url: string
    preview_image_url?: string
    width: number
    height: number
    duration_ms?: number
  }[]
}

export interface ScrapeBadgerSearchResponse {
  data: ScrapeBadgerTweet[]
  next_cursor?: string
}

export interface TwitterSearchResult {
  link: string
  title: string
  snippet: string
  thumbnailUrl?: string
  authorName?: string
  authorUsername?: string
  createdAt?: string
  metrics?: {
    likes: number
    retweets: number
    replies: number
    views: number
  }
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

const BASE_URL = 'https://scrapebadger.com/v1/twitter'

/**
 * Search Twitter using ScrapeBadger API
 * Provides real-time search results (unlike Google CSE which only indexes past tweets)
 *
 * @param query - Search query string
 * @param options - Search options (type, cursor)
 * @returns Object with results array and pagination info
 */
export async function searchTwitterWithScrapeBadger(
  query: string,
  options: ScrapeBadgerSearchOptions = {}
): Promise<TwitterSearchResponse> {
  const { type = 'top', cursor, count } = options

  const apiKey = process.env.SCRAPEBADGER_API_KEY

  if (!apiKey) {
    throw new Error('ScrapeBadger API key is not configured')
  }

  const params = new URLSearchParams({
    query,
  })

  // query_type: Top, Latest, Media
  if (type === 'latest') {
    params.set('query_type', 'Latest')
  } else if (type === 'media') {
    params.set('query_type', 'Media')
  } else {
    params.set('query_type', 'Top')
  }

  if (cursor) {
    params.set('cursor', cursor)
  }

  if (count && count > 0) {
    params.set('count', String(count))
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${BASE_URL}/tweets/advanced_search?${params}`, {
      headers: {
        'X-API-Key': apiKey,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ScrapeBadger API error: ${response.status} - ${errorText}`)
    }

    const data: ScrapeBadgerSearchResponse = await response.json()

    // Debug: log first tweet's media field
    if (data.data?.[0]) {
      console.log('[ScrapeBadger] First tweet media:', JSON.stringify(data.data[0].media))
    }

    // Transform ScrapeBadger response to our format
    const results: TwitterSearchResult[] = (data.data || []).map((tweet) => {
      // Get thumbnail URL from media, filtering out t.co short links
      let thumbnailUrl: string | undefined
      const mediaUrl = tweet.media?.[0]?.url
      if (mediaUrl && !mediaUrl.includes('t.co/')) {
        thumbnailUrl = mediaUrl
      } else if (tweet.media?.[0]?.preview_image_url) {
        thumbnailUrl = tweet.media[0].preview_image_url
      }

      return {
        link: `https://twitter.com/${tweet.username}/status/${tweet.id}`,
        title: `${tweet.user_name} (@${tweet.username})`,
        snippet: tweet.full_text || tweet.text,
        thumbnailUrl,
        authorName: tweet.user_name,
        authorUsername: tweet.username,
        createdAt: tweet.created_at,
        metrics: {
          likes: tweet.favorite_count,
          retweets: tweet.retweet_count,
          replies: tweet.reply_count,
          views: parseInt(tweet.view_count, 10) || 0,
        },
      }
    })

    return {
      results,
      hasMore: !!data.next_cursor,
      nextCursor: data.next_cursor,
      totalResults: results.length,
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
