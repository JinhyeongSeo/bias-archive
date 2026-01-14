/**
 * YouTube Data API v3 search functions
 * Used for searching YouTube videos directly from the app
 */

export interface YouTubeSearchResult {
  videoId: string
  title: string
  thumbnailUrl: string
  channelTitle: string
  publishedAt: string
}

interface YouTubeApiSearchItem {
  id: {
    videoId: string
  }
  snippet: {
    title: string
    channelTitle: string
    publishedAt: string
    thumbnails: {
      high?: {
        url: string
      }
      medium?: {
        url: string
      }
      default?: {
        url: string
      }
    }
  }
}

interface YouTubeApiResponse {
  items: YouTubeApiSearchItem[]
  nextPageToken?: string
  pageInfo?: {
    totalResults: number
    resultsPerPage: number
  }
  error?: {
    message: string
    code: number
  }
}

export interface YouTubeSearchOptions {
  order?: 'relevance' | 'date' | 'viewCount' | 'rating'
  publishedAfter?: string // ISO 8601 format
  pageToken?: string // For pagination
}

export interface YouTubeSearchResponse {
  results: YouTubeSearchResult[]
  nextPageToken?: string
  hasMore: boolean
}

/**
 * Search YouTube videos using YouTube Data API v3
 * @param query - Search query string
 * @param maxResults - Maximum number of results (default: 10, max: 50)
 * @param options - Optional search options (order, publishedAfter, pageToken)
 * @returns YouTube search response with results, nextPageToken, and hasMore flag
 */
export async function searchYouTube(
  query: string,
  maxResults: number = 10,
  options: YouTubeSearchOptions = {}
): Promise<YouTubeSearchResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured')
  }

  // Clamp maxResults between 1 and 50
  const clampedMax = Math.min(Math.max(1, maxResults), 50)

  // Append '직캠' to search query for better fancam results
  const enhancedQuery = `${query} 직캠`

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: enhancedQuery,
    key: apiKey,
    maxResults: clampedMax.toString(),
  })

  // Add optional filter parameters
  if (options.order) {
    params.set('order', options.order)
  }
  if (options.publishedAfter) {
    params.set('publishedAfter', options.publishedAfter)
  }
  if (options.pageToken) {
    params.set('pageToken', options.pageToken)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { signal: controller.signal }
    )

    const data: YouTubeApiResponse = await response.json()

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message || `YouTube API error: ${response.status}`
      )
    }

    const results = data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url ||
        `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }))

    return {
      results,
      nextPageToken: data.nextPageToken,
      hasMore: !!data.nextPageToken,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
