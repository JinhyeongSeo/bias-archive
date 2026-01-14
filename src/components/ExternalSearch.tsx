'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProxiedImageUrl } from '@/lib/proxy'
import {
  modalOverlay,
  modalContent,
  smoothSpring,
  easeOutExpo,
  pressScale,
  listItem,
  staggerContainer,
  quickSpring,
} from '@/lib/animations'

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls'
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

interface KgirlsResult {
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

  // Multi-select state
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [isBatchSaving, setIsBatchSaving] = useState(false)

  // heye.kr pagination state
  const [heyePage, setHeyePage] = useState(1)
  const [heyeTotalPages, setHeyeTotalPages] = useState(0)

  // kgirls.net pagination state
  const [kgirlsPage, setKgirlsPage] = useState(1)
  const [kgirlsTotalPages, setKgirlsTotalPages] = useState(0)
  const [kgirlsBoard, setKgirlsBoard] = useState<'mgall' | 'issue'>('mgall')

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
      setKgirlsPage(1)
      setKgirlsTotalPages(0)
      setKgirlsBoard('mgall')
      setSelectedUrls(new Set())
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
      setKgirlsPage(1)
      setKgirlsTotalPages(0)
      setSelectedUrls(new Set())
    }
  }

  // Toggle selection
  const toggleSelection = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        next.add(url)
      }
      return next
    })
  }

  // Select all unsaved results
  const selectAll = () => {
    const unsavedUrls = results
      .filter(r => !r.isSaved)
      .map(r => r.url)
    setSelectedUrls(new Set(unsavedUrls))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedUrls(new Set())
  }

  // Get selectable (unsaved) count
  const selectableCount = results.filter(r => !r.isSaved).length
  const selectedCount = selectedUrls.size

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
      // Use wsrv.nl proxy for heye thumbnails to bypass hotlink protection
      thumbnailUrl: item.thumbnailUrl ? getProxiedImageUrl(item.thumbnailUrl) : null,
      author: item.author,
      platform: 'heye' as Platform,
      isSaved: checkIfSaved(item.url),
      isSaving: false,
    }))
  }

  const searchKgirls = async (searchQuery: string, page: number = 1, board: 'mgall' | 'issue' = kgirlsBoard): Promise<EnrichedResult[]> => {
    const response = await fetch(`/api/search/kgirls?q=${encodeURIComponent(searchQuery)}&page=${page}&board=${board}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'kgirls.net 검색 실패')
    }

    // Update pagination state
    setKgirlsTotalPages(data.totalPages || 0)
    setKgirlsPage(data.currentPage || 1)

    return (data.results as KgirlsResult[]).map(item => ({
      url: item.url,
      title: item.title,
      // Use wsrv.nl proxy for kgirls thumbnails to bypass hotlink protection (403 Forbidden)
      thumbnailUrl: item.thumbnailUrl ? getProxiedImageUrl(item.thumbnailUrl) : null,
      author: item.author,
      platform: 'kgirls' as Platform,
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
      } else if (platform === 'heye') {
        searchResults = await searchHeye(query, 1)
      } else {
        searchResults = await searchKgirls(query, 1)
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

  const handleKgirlsPageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > kgirlsTotalPages || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const searchResults = await searchKgirls(query, newPage)
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

  // Batch save selected items
  const handleBatchSave = async () => {
    if (selectedUrls.size === 0 || isBatchSaving) return

    setIsBatchSaving(true)
    const urlsToSave = Array.from(selectedUrls)
    let savedCount = 0
    let errorCount = 0

    // Mark all selected as saving
    setResults(prev => prev.map(r =>
      selectedUrls.has(r.url) ? { ...r, isSaving: true } : r
    ))

    for (const url of urlsToSave) {
      const result = results.find(r => r.url === url)
      if (!result || result.isSaved) continue

      try {
        const metaResponse = await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
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
            url,
            title: metadata.title,
            thumbnailUrl: metadata.thumbnailUrl,
            platform: metadata.platform,
            authorName: metadata.authorName,
            searchQuery: query,
            media: metadata.media,
          }),
        })

        if (saveResponse.ok || saveResponse.status === 409) {
          setResults(prev => prev.map(r =>
            r.url === url ? { ...r, isSaved: true, isSaving: false } : r
          ))
          savedCount++
        } else {
          setResults(prev => prev.map(r =>
            r.url === url ? { ...r, isSaving: false } : r
          ))
          errorCount++
        }
      } catch {
        setResults(prev => prev.map(r =>
          r.url === url ? { ...r, isSaving: false } : r
        ))
        errorCount++
      }
    }

    setSelectedUrls(new Set())
    setIsBatchSaving(false)

    if (savedCount > 0) {
      onSave?.()
    }

    if (errorCount > 0) {
      alert(`${savedCount}개 저장 완료, ${errorCount}개 실패`)
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
        return 'bg-twitter/10 text-twitter'
      case 'heye':
        return 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
      case 'kgirls':
        return 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400'
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
      case 'kgirls':
        return 'kgirls.net'
      default:
        return p
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={modalOverlay}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={easeOutExpo}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl mx-4 max-h-[85vh] bg-background rounded-xl shadow-2xl flex flex-col"
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smoothSpring}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                외부 검색
              </h2>
              <motion.button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                whileTap={{ scale: 0.9 }}
                transition={quickSpring}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Platform Selection */}
              <div className="flex gap-2">
                <motion.button
                  onClick={() => handlePlatformChange('youtube')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    platform === 'youtube'
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  {...pressScale}
                >
                  YouTube
                </motion.button>
                <motion.button
                  onClick={() => handlePlatformChange('twitter')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    platform === 'twitter'
                      ? 'bg-twitter/10 text-twitter ring-2 ring-twitter/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  {...pressScale}
                >
                  Twitter
                </motion.button>
                <motion.button
                  onClick={() => handlePlatformChange('heye')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    platform === 'heye'
                      ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  {...pressScale}
                >
                  heye.kr
                </motion.button>
                <motion.button
                  onClick={() => handlePlatformChange('kgirls')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    platform === 'kgirls'
                      ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 ring-2 ring-pink-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  {...pressScale}
                >
                  kgirls
                </motion.button>
              </div>

          {/* Platform Notice - fixed height container, hidden for youtube */}
              {platform !== 'youtube' && (
              <div className="h-9">
                {platform === 'twitter' && (
                  <p className="h-full flex items-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 rounded-lg">
                    과거 인기 트윗 검색 (최신은 URL 직접 입력)
                  </p>
                )}
                {platform === 'heye' && (
                  <p className="h-full flex items-center text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-4 rounded-lg">
                    heye.kr 커뮤니티 게시판 검색
                  </p>
                )}
                {platform === 'kgirls' && (
                  <div className="h-full flex items-center gap-3 bg-pink-50 dark:bg-pink-900/20 px-4 rounded-lg">
                    <p className="text-sm text-pink-600 dark:text-pink-400">
                      kgirls.net
                    </p>
                    <select
                      value={kgirlsBoard}
                      onChange={(e) => {
                        setKgirlsBoard(e.target.value as 'mgall' | 'issue')
                        setResults([])
                        setKgirlsPage(1)
                        setKgirlsTotalPages(0)
                      }}
                      className="px-3 py-1 text-sm border border-pink-200 dark:border-pink-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="mgall">마이너갤</option>
                      <option value="issue">볼거리</option>
                    </select>
                  </div>
                )}
              </div>
              )}

              {/* YouTube Filters */}
              {platform === 'youtube' && (
                <div className="h-9 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">정렬</label>
                    <select
                      value={youtubeOrder}
                      onChange={(e) => setYoutubeOrder(e.target.value as YouTubeOrder)}
                      className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                      className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
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

              {/* Search Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="검색어 입력..."
                  autoFocus
                  className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  onClick={handleSearch}
                  disabled={isLoading || !query.trim()}
                  className="px-6 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                  {...pressScale}
                >
                  {isLoading ? '검색 중...' : '검색'}
                </motion.button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={quickSpring}
                  >
                    {error}
                    {notConfigured && (
                      <span className="block mt-1 text-zinc-500 dark:text-zinc-400">
                        API 키 설정이 필요합니다
                      </span>
                    )}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Results */}
              {results.length > 0 && (
                <motion.div
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {/* Results header with selection controls */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {results.length}개의 결과
                      {platform === 'heye' && heyeTotalPages > 1 && (
                        <span className="ml-2">
                          (페이지 {heyePage}/{heyeTotalPages})
                        </span>
                      )}
                      {platform === 'kgirls' && kgirlsTotalPages > 1 && (
                        <span className="ml-2">
                          (페이지 {kgirlsPage}/{kgirlsTotalPages})
                        </span>
                      )}
                    </p>

                    {/* Selection controls */}
                    {selectableCount > 0 && (
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-sm text-primary font-medium">
                            {selectedCount}개 선택
                          </span>
                        )}
                        <motion.button
                          onClick={selectedCount === selectableCount ? clearSelection : selectAll}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          {...pressScale}
                        >
                          {selectedCount === selectableCount ? '선택 해제' : '전체 선택'}
                        </motion.button>
                        {selectedCount > 0 && (
                          <motion.button
                            onClick={handleBatchSave}
                            disabled={isBatchSaving}
                            className="px-4 py-1 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                            {...pressScale}
                          >
                            {isBatchSaving ? '저장 중...' : `${selectedCount}개 저장`}
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>

                  {results.map((result, index) => (
                    <motion.div
                      key={result.url}
                      className={`flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border transition-colors cursor-pointer ${
                        selectedUrls.has(result.url)
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                      variants={listItem}
                      transition={quickSpring}
                      onClick={() => !result.isSaved && toggleSelection(result.url)}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUrls.has(result.url)}
                          onChange={() => toggleSelection(result.url)}
                          disabled={result.isSaved}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        />
                      </div>

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

                      {/* Status indicator */}
                      <div className="flex-shrink-0 flex items-center">
                        {result.isSaved ? (
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            저장됨
                          </span>
                        ) : result.isSaving ? (
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            저장 중...
                          </span>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}

                  {/* Heye Pagination */}
                  {platform === 'heye' && heyeTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-2">
                      <motion.button
                        onClick={() => handleHeyePageChange(heyePage - 1)}
                        disabled={heyePage <= 1 || isLoading}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        {...pressScale}
                      >
                        이전
                      </motion.button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 px-2">
                        {heyePage} / {heyeTotalPages}
                      </span>
                      <motion.button
                        onClick={() => handleHeyePageChange(heyePage + 1)}
                        disabled={heyePage >= heyeTotalPages || isLoading}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        {...pressScale}
                      >
                        다음
                      </motion.button>
                    </div>
                  )}

                  {/* Kgirls Pagination */}
                  {platform === 'kgirls' && kgirlsTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-2">
                      <motion.button
                        onClick={() => handleKgirlsPageChange(kgirlsPage - 1)}
                        disabled={kgirlsPage <= 1 || isLoading}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        {...pressScale}
                      >
                        이전
                      </motion.button>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 px-2">
                        {kgirlsPage} / {kgirlsTotalPages}
                      </span>
                      <motion.button
                        onClick={() => handleKgirlsPageChange(kgirlsPage + 1)}
                        disabled={kgirlsPage >= kgirlsTotalPages || isLoading}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        {...pressScale}
                      >
                        다음
                      </motion.button>
                    </div>
                  )}
                </motion.div>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
