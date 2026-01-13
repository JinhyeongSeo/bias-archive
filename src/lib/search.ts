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
  error?: {
    message: string
    code: number
  }
}

/**
 * Search Twitter/X using Google Custom Search Engine
 * This searches Google's indexed tweets, so results are from past popular tweets
 * (not real-time recent tweets)
 *
 * @param query - Search query string
 * @returns Array of Twitter search results
 */
export async function searchTwitter(query: string): Promise<TwitterSearchResult[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID

  if (!apiKey || !cseId) {
    throw new Error('Google CSE is not configured')
  }

  // Add site:twitter.com filter to search query
  const siteQuery = `site:twitter.com ${query}`

  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: siteQuery,
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

    return (data.items || [])
      .filter((item) => tweetUrlPattern.test(item.link))
      .map((item) => ({
        link: item.link,
        title: item.title,
        snippet: item.snippet,
      }))
  } finally {
    clearTimeout(timeoutId)
  }
}
