'use client'

import { useState, useCallback } from 'react'

type Platform = 'youtube' | 'twitter'

interface YouTubeResult {
  videoId: string
  title: string
  thumbnailUrl: string
  channelTitle: string
  publishedAt: string
}

interface TwitterResult {
  link: string
  title: string
  snippet: string
}

interface EnrichedResult {
  url: string
  title: string
  thumbnailUrl: string | null
  author: string
  platform: Platform
  publishedAt?: string
  isSaved: boolean
  isSaving: boolean
}

interface ExternalSearchProps {
  savedUrls: string[]
  onSave?: () => void
}

export function ExternalSearch({ savedUrls, onSave }: ExternalSearchProps) {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [results, setResults] = useState<EnrichedResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)

  const checkIfSaved = useCallback((url: string): boolean => {
    // Normalize URL for comparison
    const normalizedUrl = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return savedUrls.some(savedUrl => {
      const normalizedSaved = savedUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
      return normalizedSaved === normalizedUrl
    })
  }, [savedUrls])

  const searchYouTube = async (searchQuery: string): Promise<EnrichedResult[]> => {
    const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}&max=10`)
    const data = await response.json()

    if (!response.ok) {
      if (data.notConfigured) {
        setNotConfigured(true)
        throw new Error('YouTube API가 설정되지 않았습니다')
      }
      throw new Error(data.error || 'YouTube 검색 실패')
    }

    return (data as YouTubeResult[]).map(item => ({
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      author: item.channelTitle,
      platform: 'youtube' as Platform,
      publishedAt: item.publishedAt,
      isSaved: checkIfSaved(`https://www.youtube.com/watch?v=${item.videoId}`),
      isSaving: false,
    }))
  }

  const searchTwitter = async (searchQuery: string): Promise<EnrichedResult[]> => {
    const response = await fetch(`/api/search/twitter?q=${encodeURIComponent(searchQuery)}`)
    const data = await response.json()

    if (!response.ok) {
      if (data.notConfigured) {
        setNotConfigured(true)
        throw new Error('Twitter 검색이 설정되지 않았습니다')
      }
      throw new Error(data.error || 'Twitter 검색 실패')
    }

    // For Twitter, we need to fetch metadata for each result
    const enrichedResults: EnrichedResult[] = []

    for (const item of data as TwitterResult[]) {
      // Check if already saved first
      const isSaved = checkIfSaved(item.link)

      try {
        // Fetch metadata using existing API
        const metaResponse = await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.link }),
        })

        if (metaResponse.ok) {
          const metadata = await metaResponse.json()
          enrichedResults.push({
            url: item.link,
            title: metadata.title || item.title,
            thumbnailUrl: metadata.thumbnailUrl || null,
            author: metadata.authorName || '',
            platform: 'twitter',
            isSaved,
            isSaving: false,
          })
        } else {
          // Fallback to basic info from search result
          enrichedResults.push({
            url: item.link,
            title: item.title,
            thumbnailUrl: null,
            author: '',
            platform: 'twitter',
            isSaved,
            isSaving: false,
          })
        }
      } catch {
        // Fallback to basic info
        enrichedResults.push({
          url: item.link,
          title: item.title,
          thumbnailUrl: null,
          author: '',
          platform: 'twitter',
          isSaved,
          isSaving: false,
        })
      }
    }

    return enrichedResults
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setNotConfigured(false)
    setResults([])

    try {
      const searchResults = platform === 'youtube'
        ? await searchYouTube(query)
        : await searchTwitter(query)
      setResults(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (index: number) => {
    const result = results[index]
    if (result.isSaved || result.isSaving) return

    // Mark as saving
    setResults(prev => prev.map((r, i) =>
      i === index ? { ...r, isSaving: true } : r
    ))

    try {
      // First, get full metadata
      const metaResponse = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url }),
      })

      let metadata = {
        title: result.title,
        thumbnailUrl: result.thumbnailUrl,
        platform: result.platform,
        authorName: result.author,
      }

      if (metaResponse.ok) {
        const fullMetadata = await metaResponse.json()
        metadata = {
          title: fullMetadata.title || result.title,
          thumbnailUrl: fullMetadata.thumbnailUrl || result.thumbnailUrl,
          platform: fullMetadata.platform || result.platform,
          authorName: fullMetadata.authorName || result.author,
        }
      }

      // Save the link
      const saveResponse = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.url,
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl,
          platform: metadata.platform,
          authorName: metadata.authorName,
        }),
      })

      if (saveResponse.ok) {
        // Mark as saved
        setResults(prev => prev.map((r, i) =>
          i === index ? { ...r, isSaved: true, isSaving: false } : r
        ))
        // Trigger refresh of main list
        onSave?.()
      } else {
        const errorData = await saveResponse.json()
        // If already saved (409), mark as saved
        if (saveResponse.status === 409) {
          setResults(prev => prev.map((r, i) =>
            i === index ? { ...r, isSaved: true, isSaving: false } : r
          ))
        } else {
          throw new Error(errorData.error || '저장 실패')
        }
      }
    } catch (err) {
      console.error('Save error:', err)
      // Reset saving state
      setResults(prev => prev.map((r, i) =>
        i === index ? { ...r, isSaving: false } : r
      ))
      alert(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Platform Selection */}
      <div className="flex gap-1">
        <button
          onClick={() => setPlatform('youtube')}
          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
            platform === 'youtube'
              ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          YouTube
        </button>
        <button
          onClick={() => setPlatform('twitter')}
          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
            platform === 'twitter'
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Twitter
        </button>
      </div>

      {/* Twitter Notice */}
      {platform === 'twitter' && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
          과거 인기 트윗 검색 (최신은 URL 직접 입력)
        </p>
      )}

      {/* Search Input */}
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="검색어 입력..."
          className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : '검색'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
          {notConfigured && (
            <span className="block mt-1 text-zinc-500 dark:text-zinc-400">
              API 키 설정이 필요합니다
            </span>
          )}
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={result.url}
              className="flex gap-2 p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
            >
              {/* Thumbnail */}
              {result.thumbnailUrl ? (
                <img
                  src={result.thumbnailUrl}
                  alt=""
                  className="w-20 h-12 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-12 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs text-zinc-400">No img</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                  {result.title}
                </h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] px-1 py-0.5 rounded ${
                    result.platform === 'youtube'
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                      : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  }`}>
                    {result.platform === 'youtube' ? 'YT' : 'TW'}
                  </span>
                  {result.author && (
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {result.author}
                    </span>
                  )}
                  {result.publishedAt && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {formatDate(result.publishedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex-shrink-0">
                {result.isSaved ? (
                  <span className="inline-flex items-center px-2 py-1 text-[10px] font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded">
                    저장됨
                  </span>
                ) : (
                  <button
                    onClick={() => handleSave(index)}
                    disabled={result.isSaving}
                    className="px-2 py-1 text-[10px] font-medium text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {result.isSaving ? '...' : '저장'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && results.length === 0 && query && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-2">
          검색 결과가 없습니다
        </p>
      )}
    </div>
  )
}
