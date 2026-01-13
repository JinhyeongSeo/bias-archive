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
  error?: {
    message: string
    code: number
  }
}

/**
 * Search YouTube videos using YouTube Data API v3
 * @param query - Search query string
 * @param maxResults - Maximum number of results (default: 10, max: 50)
 * @returns Array of YouTube search results
 */
export async function searchYouTube(
  query: string,
  maxResults: number = 10
): Promise<YouTubeSearchResult[]> {
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

    return data.items.map((item) => ({
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
  } finally {
    clearTimeout(timeoutId)
  }
}
