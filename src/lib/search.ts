/**
 * External search functions using Google Custom Search Engine
 * Used for searching Twitter/X content via Google indexing
 */

export interface TwitterSearchResult {
  link: string
  title: string
  snippet: string
}

interface GoogleCseItem {
  link: string
  title: string
  snippet: string
}

interface GoogleCseResponse {
  items?: GoogleCseItem[]
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
  error?: {
    message: string
    code: number
  }
}

export interface TwitterSearchResponse {
  results: TwitterSearchResult[]
  hasMore: boolean
  totalResults?: number
}

/**
 * Search Twitter/X using Google Custom Search Engine
 * This searches Google's indexed tweets, so results are from past popular tweets
 * (not real-time recent tweets)
 *
 * @param query - Search query string
 * @param page - Page number (1-based, each page has up to 10 results)
 * @returns Object with results array and hasMore flag
 */
export async function searchTwitter(query: string, page: number = 1): Promise<TwitterSearchResponse> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID

  if (!apiKey || !cseId) {
    throw new Error('Google CSE is not configured')
  }

  // Add site:twitter.com filter to search query
  const siteQuery = `site:twitter.com ${query}`

  // Google CSE uses 'start' parameter for pagination (1, 11, 21, etc.)
  // Each page returns up to 10 results
  const startIndex = (page - 1) * 10 + 1

  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: siteQuery,
    start: String(startIndex),
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: controller.signal }
    )

    const data: GoogleCseResponse = await response.json()

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message || `Google CSE error: ${response.status}`
      )
    }

    // Filter results to only include actual tweet URLs
    // Twitter tweet URLs match pattern: twitter.com/username/status/id
    const tweetUrlPattern = /twitter\.com\/[^/]+\/status\/\d+/

    const results = (data.items || [])
      .filter((item) => tweetUrlPattern.test(item.link))
      .map((item) => ({
        link: item.link,
        title: item.title,
        snippet: item.snippet,
      }))

    // Google CSE returns searchInformation.totalResults but limits to 100 results max
    // We check if there are more results by seeing if we got a full page
    const totalResults = data.searchInformation?.totalResults
      ? parseInt(data.searchInformation.totalResults, 10)
      : 0

    // Google CSE limits to max 100 results (10 pages), so check if more pages are available
    const hasMore = results.length > 0 && startIndex + results.length < Math.min(totalResults, 100)

    return {
      results,
      hasMore,
      totalResults,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
