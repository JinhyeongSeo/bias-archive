'use client'

import { useState, useCallback, useEffect } from 'react'

type Platform = 'youtube' | 'twitter' | 'heye'
type YouTubeOrder = 'relevance' | 'date' | 'viewCount'
type YouTubePeriod = '' | 'today' | 'week' | 'month' | 'year'

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

interface HeyeResult {
  url: string
  title: string
  thumbnailUrl: string | null
  author: string
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
  isOpen: boolean
  onClose: () => void
  savedUrls: string[]
  onSave?: () => void
}

export function ExternalSearch({ isOpen, onClose, savedUrls, onSave }: ExternalSearchProps) {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [results, setResults] = useState<EnrichedResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [youtubeOrder, setYoutubeOrder] = useState<YouTubeOrder>('relevance')
  const [youtubePeriod, setYoutubePeriod] = useState<YouTubePeriod>('')

  // heye.kr pagination state
  const [heyePage, setHeyePage] = useState(1)
  const [heyeTotalPages, setHeyeTotalPages] = useState(0)

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open and reset state when closing
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      // Reset state when modal closes
      setQuery('')
      setResults([])
      setError(null)
      setNotConfigured(false)
      setYoutubeOrder('relevance')
      setYoutubePeriod('')
      setHeyePage(1)
      setHeyeTotalPages(0)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Clear results when switching platforms
  const handlePlatformChange = (newPlatform: Platform) => {
    if (newPlatform !== platform) {
      setPlatform(newPlatform)
      setResults([])
      setError(null)
      setHeyePage(1)
      setHeyeTotalPages(0)
    }
  }

  const checkIfSaved = useCallback((url: string): boolean => {
    const normalizedUrl = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return savedUrls.some(savedUrl => {
      const normalizedSaved = savedUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
      return normalizedSaved === normalizedUrl
    })
  }, [savedUrls])

  const searchYouTube = async (searchQuery: string): Promise<EnrichedResult[]> => {
    const params = new URLSearchParams({
      q: searchQuery,
      max: '10',
    })
    if (youtubeOrder !== 'relevance') {
      params.set('order', youtubeOrder)
    }
    if (youtubePeriod) {
      params.set('period', youtubePeriod)
    }
    const response = await fetch(`/api/youtube/search?${params}`)
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

    const enrichedResults: EnrichedResult[] = []

    for (const item of data as TwitterResult[]) {
      const isSaved = checkIfSaved(item.link)

      try {
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

  const searchHeye = async (searchQuery: string, page: number = 1): Promise<EnrichedResult[]> => {
    const response = await fetch(`/api/search/heye?q=${encodeURIComponent(searchQuery)}&page=${page}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'heye.kr 검색 실패')
    }

    // Update pagination state
    setHeyeTotalPages(data.totalPages || 0)
    setHeyePage(data.currentPage || 1)

    return (data.results as HeyeResult[]).map(item => ({
      url: item.url,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      author: item.author,
      platform: 'heye' as Platform,
      isSaved: checkIfSaved(item.url),
      isSaving: false,
    }))
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setNotConfigured(false)
    setResults([])

    try {
      let searchResults: EnrichedResult[]
      if (platform === 'youtube') {
        searchResults = await searchYouTube(query)
      } else if (platform === 'twitter') {
        searchResults = await searchTwitter(query)
      } else {
        searchResults = await searchHeye(query, 1)
      }
      setResults(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleHeyePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > heyeTotalPages || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const searchResults = await searchHeye(query, newPage)
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

    setResults(prev => prev.map((r, i) =>
      i === index ? { ...r, isSaving: true } : r
    ))

    try {
      const metaResponse = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url }),
      })

      let metadata: {
        title: string
        thumbnailUrl: string | null
        platform: Platform
        authorName: string
        media?: { type: string; url: string }[]
      } = {
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
          media: fullMetadata.media,
        }
      }

      const saveResponse = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.url,
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl,
          platform: metadata.platform,
          authorName: metadata.authorName,
          searchQuery: query, // Pass search query as hint for auto-tagging
          media: metadata.media,
        }),
      })

      if (saveResponse.ok) {
        setResults(prev => prev.map((r, i) =>
          i === index ? { ...r, isSaved: true, isSaving: false } : r
        ))
        onSave?.()
      } else {
        const errorData = await saveResponse.json()
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

  const getPlatformBadgeStyle = (p: Platform) => {
    switch (p) {
      case 'youtube':
        return 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
      case 'twitter':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
      case 'heye':
        return 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
      default:
        return 'bg-zinc-100 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400'
    }
  }

  const getPlatformLabel = (p: Platform) => {
    switch (p) {
      case 'youtube':
        return 'YouTube'
      case 'twitter':
        return 'Twitter'
      case 'heye':
        return 'heye.kr'
      default:
        return p
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            외부 검색
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Platform Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePlatformChange('youtube')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                platform === 'youtube'
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              YouTube
            </button>
            <button
              onClick={() => handlePlatformChange('twitter')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                platform === 'twitter'
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Twitter
            </button>
            <button
              onClick={() => handlePlatformChange('heye')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                platform === 'heye'
                  ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              heye.kr
            </button>
          </div>

          {/* Platform Notice */}
          {platform === 'twitter' && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
              과거 인기 트윗 검색 (최신은 URL 직접 입력)
            </p>
          )}
          {platform === 'heye' && (
            <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg">
              heye.kr 커뮤니티 게시판 검색
            </p>
          )}

          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="검색어 입력..."
              autoFocus
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="px-6 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '검색 중...' : '검색'}
            </button>
          </div>

          {/* YouTube Filters */}
          {platform === 'youtube' && (
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">정렬</label>
                <select
                  value={youtubeOrder}
                  onChange={(e) => setYoutubeOrder(e.target.value as YouTubeOrder)}
                  className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">관련성순</option>
                  <option value="viewCount">조회수순</option>
                  <option value="date">최신순</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">기간</label>
                <select
                  value={youtubePeriod}
                  onChange={(e) => setYoutubePeriod(e.target.value as YouTubePeriod)}
                  className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="today">오늘</option>
                  <option value="week">이번주</option>
                  <option value="month">이번달</option>
                  <option value="year">올해</option>
                </select>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
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
            <div className="space-y-3">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {results.length}개의 결과
                {platform === 'heye' && heyeTotalPages > 1 && (
                  <span className="ml-2">
                    (페이지 {heyePage}/{heyeTotalPages})
                  </span>
                )}
              </p>
              {results.map((result, index) => (
                <div
                  key={result.url}
                  className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  {/* Thumbnail - larger size */}
                  {result.thumbnailUrl ? (
                    <img
                      src={result.thumbnailUrl}
                      alt=""
                      className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <span className="text-sm text-zinc-400">No image</span>
                    </div>
                  )}

                  {/* Info - more space */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {result.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getPlatformBadgeStyle(result.platform)}`}>
                          {getPlatformLabel(result.platform)}
                        </span>
                        {result.author && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                            {result.author}
                          </span>
                        )}
                        {result.publishedAt && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {formatDate(result.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Save Button - larger */}
                  <div className="flex-shrink-0 flex items-center">
                    {result.isSaved ? (
                      <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        저장됨
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSave(index)}
                        disabled={result.isSaving}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        {result.isSaving ? '저장 중...' : '저장'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Heye Pagination */}
              {platform === 'heye' && heyeTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-2">
                  <button
                    onClick={() => handleHeyePageChange(heyePage - 1)}
                    disabled={heyePage <= 1 || isLoading}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    이전
                  </button>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 px-2">
                    {heyePage} / {heyeTotalPages}
                  </span>
                  <button
                    onClick={() => handleHeyePageChange(heyePage + 1)}
                    disabled={heyePage >= heyeTotalPages || isLoading}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && results.length === 0 && query && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
              검색 결과가 없습니다
            </p>
          )}

          {/* Initial State */}
          {!isLoading && !error && results.length === 0 && !query && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
              검색어를 입력하고 검색 버튼을 클릭하세요
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            ESC 키로 닫기
          </p>
        </div>
      </div>
    </div>
  )
}
