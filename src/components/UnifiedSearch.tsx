'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProxiedImageUrl } from '@/lib/proxy'
import {
  modalOverlay,
  modalContent,
  smoothSpring,
  easeOutExpo,
  pressScale,
  quickSpring,
} from '@/lib/animations'
import type { Bias, BiasWithGroup, Group } from '@/types/database'
import { useNameLanguage } from '@/contexts/NameLanguageContext'

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls'

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

interface PlatformResults {
  platform: Platform
  results: EnrichedResult[]
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  currentPage: number
  currentOffset: number // For heye/kgirls pagination within page
  nextPageToken?: string // For YouTube pagination
}

interface UnifiedSearchProps {
  isOpen: boolean
  onClose: () => void
  savedUrls: string[]
  onSave?: () => void
  biases: Bias[]
  groups: Group[]
}

// Platform configuration
const PLATFORMS: { id: Platform; label: string; color: string; bgColor: string; ringColor: string }[] = [
  { id: 'youtube', label: 'YouTube', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/50', ringColor: 'ring-red-500/20' },
  { id: 'twitter', label: 'Twitter', color: 'text-twitter', bgColor: 'bg-twitter/10', ringColor: 'ring-twitter/20' },
  { id: 'heye', label: 'heye.kr', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/50', ringColor: 'ring-orange-500/20' },
  { id: 'kgirls', label: 'kgirls', color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/50', ringColor: 'ring-pink-500/20' },
]

const RESULTS_PER_PLATFORM = 6

export function UnifiedSearch({ isOpen, onClose, savedUrls, onSave, biases, groups }: UnifiedSearchProps) {
  const { getDisplayName } = useNameLanguage()

  const [query, setQuery] = useState('')
  const [selectedBiasId, setSelectedBiasId] = useState<string | null>(null)
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<Platform>>(new Set(['youtube', 'twitter', 'heye', 'kgirls']))

  const [platformResults, setPlatformResults] = useState<Map<Platform, PlatformResults>>(new Map())
  const [isSearching, setIsSearching] = useState(false)

  // Multi-select state
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [isBatchSaving, setIsBatchSaving] = useState(false)

  // Group biases by group for dropdown
  const biasesWithGroups = useMemo((): BiasWithGroup[] => {
    const groupMap = new Map<string, Group>()
    for (const group of groups) {
      groupMap.set(group.id, group)
    }
    return biases.map((bias) => ({
      ...bias,
      group: bias.group_id ? groupMap.get(bias.group_id) ?? null : null,
    }))
  }, [biases, groups])

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
      setSelectedBiasId(null)
      setPlatformResults(new Map())
      setSelectedUrls(new Set())
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // When bias is selected, update query with bias name
  useEffect(() => {
    if (selectedBiasId) {
      const selectedBias = biases.find(b => b.id === selectedBiasId)
      if (selectedBias) {
        // Use Korean name if available for better search results
        setQuery(selectedBias.name_ko || selectedBias.name)
      }
    }
  }, [selectedBiasId, biases])

  const checkIfSaved = useCallback((url: string): boolean => {
    const normalizedUrl = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return savedUrls.some(savedUrl => {
      const normalizedSaved = savedUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
      return normalizedSaved === normalizedUrl
    })
  }, [savedUrls])

  // Toggle platform
  const togglePlatform = (platform: Platform) => {
    setEnabledPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(platform)) {
        // Don't allow disabling all platforms
        if (next.size > 1) {
          next.delete(platform)
        }
      } else {
        next.add(platform)
      }
      return next
    })
  }

  // Search functions for each platform
  const searchYouTube = async (searchQuery: string, pageToken?: string): Promise<{ results: EnrichedResult[], hasMore: boolean, nextPageToken?: string }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      max: String(RESULTS_PER_PLATFORM),
      order: 'relevance',
      period: 'month', // Default to this month for more recent results
    })
    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    const response = await fetch(`/api/youtube/search?${params}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'YouTube 검색 실패')
    }

    const results = (data.results as YouTubeResult[]).map(item => ({
      url: `https://www.youtube.com/watch?v=${item.videoId}`,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      author: item.channelTitle,
      platform: 'youtube' as Platform,
      publishedAt: item.publishedAt,
      isSaved: checkIfSaved(`https://www.youtube.com/watch?v=${item.videoId}`),
      isSaving: false,
    }))

    return {
      results,
      hasMore: data.hasMore ?? false,
      nextPageToken: data.nextPageToken,
    }
  }

  const searchTwitter = async (searchQuery: string, page: number = 1): Promise<{ results: EnrichedResult[], hasMore: boolean }> => {
    // Add # prefix for hashtag search on Twitter
    const hashtagQuery = searchQuery.startsWith('#') ? searchQuery : `#${searchQuery}`

    const params = new URLSearchParams({
      q: hashtagQuery,
      page: String(page),
      // Note: dateRestrict causes Google CSE to return non-tweet URLs for Twitter searches
      // so we skip it and rely on Google's default relevance ranking
    })

    const response = await fetch(`/api/search/twitter?${params}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Twitter 검색 실패')
    }

    const results: EnrichedResult[] = []
    const twitterResults = (data.results as TwitterResult[]).slice(0, RESULTS_PER_PLATFORM)

    for (const item of twitterResults) {
      const isSaved = checkIfSaved(item.link)
      try {
        const metaResponse = await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.link }),
        })

        if (metaResponse.ok) {
          const metadata = await metaResponse.json()
          results.push({
            url: item.link,
            title: metadata.title || item.title,
            thumbnailUrl: metadata.thumbnailUrl || null,
            author: metadata.authorName || '',
            platform: 'twitter',
            isSaved,
            isSaving: false,
          })
        } else {
          results.push({
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
        results.push({
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

    return { results, hasMore: data.hasMore ?? false }
  }

  const searchHeye = async (searchQuery: string, page: number = 1, offset: number = 0): Promise<{ results: EnrichedResult[], hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      limit: String(RESULTS_PER_PLATFORM),
      offset: String(offset),
    })
    const response = await fetch(`/api/search/heye?${params}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'heye.kr 검색 실패')
    }

    const results = (data.results as HeyeResult[]).map(item => ({
      url: item.url,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl ? getProxiedImageUrl(item.thumbnailUrl) : null,
      author: item.author,
      platform: 'heye' as Platform,
      isSaved: checkIfSaved(item.url),
      isSaving: false,
    }))

    return {
      results,
      hasMore: data.hasMore ?? false,
    }
  }

  const searchKgirls = async (searchQuery: string, page: number = 1, offset: number = 0): Promise<{ results: EnrichedResult[], hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      board: 'mgall',
      limit: String(RESULTS_PER_PLATFORM),
      offset: String(offset),
    })
    const response = await fetch(`/api/search/kgirls?${params}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'kgirls.net 검색 실패')
    }

    const results = (data.results as KgirlsResult[]).map(item => ({
      url: item.url,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl ? getProxiedImageUrl(item.thumbnailUrl) : null,
      author: item.author,
      platform: 'kgirls' as Platform,
      isSaved: checkIfSaved(item.url),
      isSaving: false,
    }))

    return {
      results,
      hasMore: data.hasMore ?? false,
    }
  }

  // Unified search - search all enabled platforms in parallel
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSelectedUrls(new Set())

    // Initialize results for each enabled platform
    const initialResults = new Map<Platform, PlatformResults>()
    for (const platform of enabledPlatforms) {
      initialResults.set(platform, {
        platform,
        results: [],
        hasMore: false,
        isLoading: true,
        isLoadingMore: false,
        error: null,
        currentPage: 1,
        currentOffset: 0,
      })
    }
    setPlatformResults(initialResults)

    // Search all platforms in parallel
    const searchPromises: Promise<void>[] = []

    if (enabledPlatforms.has('youtube')) {
      searchPromises.push(
        searchYouTube(query)
          .then(({ results, hasMore, nextPageToken }) => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('youtube', {
                platform: 'youtube',
                results,
                hasMore,
                isLoading: false,
                isLoadingMore: false,
                error: null,
                currentPage: 1,
                currentOffset: 0,
                nextPageToken,
              })
              return next
            })
          })
          .catch(error => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('youtube', {
                platform: 'youtube',
                results: [],
                hasMore: false,
                isLoading: false,
                isLoadingMore: false,
                error: error.message,
                currentPage: 1,
                currentOffset: 0,
              })
              return next
            })
          })
      )
    }

    if (enabledPlatforms.has('twitter')) {
      searchPromises.push(
        searchTwitter(query, 1)
          .then(({ results, hasMore }) => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('twitter', {
                platform: 'twitter',
                results,
                hasMore,
                isLoading: false,
                isLoadingMore: false,
                error: null,
                currentPage: 1,
                currentOffset: 0,
              })
              return next
            })
          })
          .catch(error => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('twitter', {
                platform: 'twitter',
                results: [],
                hasMore: false,
                isLoading: false,
                isLoadingMore: false,
                error: error.message,
                currentPage: 1,
                currentOffset: 0,
              })
              return next
            })
          })
      )
    }

    if (enabledPlatforms.has('heye')) {
      searchPromises.push(
        searchHeye(query, 1, 0)
          .then(({ results, hasMore }) => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('heye', {
                platform: 'heye',
                results,
                hasMore,
                isLoading: false,
                isLoadingMore: false,
                error: null,
                currentPage: 1,
                currentOffset: results.length,
              })
              return next
            })
          })
          .catch(error => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('heye', {
                platform: 'heye',
                results: [],
                hasMore: false,
                isLoading: false,
                isLoadingMore: false,
                error: error.message,
                currentPage: 1,
                currentOffset: 0,
              })
              return next
            })
          })
      )
    }

    if (enabledPlatforms.has('kgirls')) {
      searchPromises.push(
        searchKgirls(query, 1, 0)
          .then(({ results, hasMore }) => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('kgirls', {
                platform: 'kgirls',
                results,
                hasMore,
                isLoading: false,
                isLoadingMore: false,
                error: null,
                currentPage: 1,
                currentOffset: results.length,
              })
              return next
            })
          })
          .catch(error => {
            setPlatformResults(prev => {
              const next = new Map(prev)
              next.set('kgirls', {
                platform: 'kgirls',
                results: [],
                hasMore: false,
                isLoading: false,
                isLoadingMore: false,
                error: error.message,
                currentPage: 1,
                currentOffset: 0,
              })
              return next
            })
          })
      )
    }

    await Promise.allSettled(searchPromises)
    setIsSearching(false)
  }

  // Load more results for a specific platform
  const handleLoadMore = async (platform: Platform) => {
    const currentData = platformResults.get(platform)
    if (!currentData || currentData.isLoadingMore || !currentData.hasMore) return

    // Set loading more state
    setPlatformResults(prev => {
      const next = new Map(prev)
      const data = next.get(platform)
      if (data) {
        next.set(platform, { ...data, isLoadingMore: true })
      }
      return next
    })

    try {
      let searchResult: { results: EnrichedResult[], hasMore: boolean, nextPageToken?: string }
      let newPage = currentData.currentPage
      let newOffset = currentData.currentOffset

      switch (platform) {
        case 'youtube':
          // Use pageToken for YouTube pagination
          searchResult = await searchYouTube(query, currentData.nextPageToken)
          break
        case 'twitter':
          newPage = currentData.currentPage + 1
          searchResult = await searchTwitter(query, newPage)
          break
        case 'heye':
          // Use offset-based pagination within the same page first
          searchResult = await searchHeye(query, currentData.currentPage, currentData.currentOffset)
          newOffset = currentData.currentOffset + searchResult.results.length
          break
        case 'kgirls':
          // Use offset-based pagination within the same page first
          searchResult = await searchKgirls(query, currentData.currentPage, currentData.currentOffset)
          newOffset = currentData.currentOffset + searchResult.results.length
          break
        default:
          return
      }

      setPlatformResults(prev => {
        const next = new Map(prev)
        const data = next.get(platform)
        if (data) {
          // Filter out duplicates by URL
          const existingUrls = new Set(data.results.map(r => r.url))
          const newResults = searchResult.results.filter(r => !existingUrls.has(r.url))

          next.set(platform, {
            ...data,
            results: [...data.results, ...newResults],
            hasMore: searchResult.hasMore,
            isLoadingMore: false,
            currentPage: newPage,
            currentOffset: newOffset,
            nextPageToken: searchResult.nextPageToken,
          })
        }
        return next
      })
    } catch (error) {
      setPlatformResults(prev => {
        const next = new Map(prev)
        const data = next.get(platform)
        if (data) {
          next.set(platform, {
            ...data,
            isLoadingMore: false,
            error: error instanceof Error ? error.message : '더 보기 실패',
          })
        }
        return next
      })
    }
  }

  // Get all results combined
  const allResults = useMemo(() => {
    const results: EnrichedResult[] = []
    for (const [, data] of platformResults) {
      results.push(...data.results)
    }
    return results
  }, [platformResults])

  // Selection helpers
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

  const selectableResults = allResults.filter(r => !r.isSaved)
  const selectableCount = selectableResults.length
  const selectedCount = selectedUrls.size

  const selectAll = () => {
    setSelectedUrls(new Set(selectableResults.map(r => r.url)))
  }

  const clearSelection = () => {
    setSelectedUrls(new Set())
  }

  // Save functions
  const handleSave = async (result: EnrichedResult) => {
    if (result.isSaved || result.isSaving) return

    // Update isSaving state
    setPlatformResults(prev => {
      const next = new Map(prev)
      const platformData = next.get(result.platform)
      if (platformData) {
        next.set(result.platform, {
          ...platformData,
          results: platformData.results.map(r =>
            r.url === result.url ? { ...r, isSaving: true } : r
          ),
        })
      }
      return next
    })

    try {
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
        media: undefined as { type: string; url: string }[] | undefined,
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
          searchQuery: query,
          media: metadata.media,
        }),
      })

      if (saveResponse.ok || saveResponse.status === 409) {
        setPlatformResults(prev => {
          const next = new Map(prev)
          const platformData = next.get(result.platform)
          if (platformData) {
            next.set(result.platform, {
              ...platformData,
              results: platformData.results.map(r =>
                r.url === result.url ? { ...r, isSaved: true, isSaving: false } : r
              ),
            })
          }
          return next
        })
        onSave?.()
      } else {
        throw new Error('저장 실패')
      }
    } catch (err) {
      console.error('Save error:', err)
      setPlatformResults(prev => {
        const next = new Map(prev)
        const platformData = next.get(result.platform)
        if (platformData) {
          next.set(result.platform, {
            ...platformData,
            results: platformData.results.map(r =>
              r.url === result.url ? { ...r, isSaving: false } : r
            ),
          })
        }
        return next
      })
    }
  }

  const handleBatchSave = async () => {
    if (selectedUrls.size === 0 || isBatchSaving) return

    setIsBatchSaving(true)
    let savedCount = 0
    let errorCount = 0

    // Mark all selected as saving
    setPlatformResults(prev => {
      const next = new Map(prev)
      for (const [platform, data] of next) {
        next.set(platform, {
          ...data,
          results: data.results.map(r =>
            selectedUrls.has(r.url) ? { ...r, isSaving: true } : r
          ),
        })
      }
      return next
    })

    for (const url of selectedUrls) {
      const result = allResults.find(r => r.url === url)
      if (!result || result.isSaved) continue

      try {
        const metaResponse = await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        let metadata = {
          title: result.title,
          thumbnailUrl: result.thumbnailUrl,
          platform: result.platform,
          authorName: result.author,
          media: undefined as { type: string; url: string }[] | undefined,
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
          setPlatformResults(prev => {
            const next = new Map(prev)
            const platformData = next.get(result.platform)
            if (platformData) {
              next.set(result.platform, {
                ...platformData,
                results: platformData.results.map(r =>
                  r.url === url ? { ...r, isSaved: true, isSaving: false } : r
                ),
              })
            }
            return next
          })
          savedCount++
        } else {
          throw new Error('저장 실패')
        }
      } catch {
        setPlatformResults(prev => {
          const next = new Map(prev)
          const platformData = next.get(result.platform)
          if (platformData) {
            next.set(result.platform, {
              ...platformData,
              results: platformData.results.map(r =>
                r.url === url ? { ...r, isSaving: false } : r
              ),
            })
          }
          return next
        })
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

  const getPlatformConfig = (platform: Platform) => {
    return PLATFORMS.find(p => p.id === platform) || PLATFORMS[0]
  }

  // Check if any platform is still loading
  const anyLoading = Array.from(platformResults.values()).some(p => p.isLoading)

  // Total results count
  const totalResults = allResults.length

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
            className="relative w-full max-w-4xl mx-4 max-h-[90vh] bg-background rounded-xl shadow-2xl flex flex-col"
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
                통합 검색
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
              {/* Search Row: Bias Dropdown + Search Input */}
              <div className="flex gap-3">
                {/* Bias Dropdown */}
                <div className="w-48 flex-shrink-0">
                  <select
                    value={selectedBiasId || ''}
                    onChange={(e) => setSelectedBiasId(e.target.value || null)}
                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">내 최애 선택</option>
                    {biasesWithGroups.map((bias) => (
                      <option key={bias.id} value={bias.id}>
                        {getDisplayName(bias)}
                        {bias.group && ` (${bias.group.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Input */}
                <div className="flex-1 flex gap-2">
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
                    disabled={isSearching || !query.trim()}
                    className="px-6 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                    {...pressScale}
                  >
                    {isSearching ? '검색 중...' : '검색'}
                  </motion.button>
                </div>
              </div>

              {/* Platform Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-1">플랫폼:</span>
                {PLATFORMS.map((platform) => {
                  const isEnabled = enabledPlatforms.has(platform.id)
                  return (
                    <motion.button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        isEnabled
                          ? `${platform.bgColor} ${platform.color} ring-2 ${platform.ringColor}`
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                      }`}
                      {...pressScale}
                    >
                      {platform.label}
                    </motion.button>
                  )
                })}
              </div>

              {/* Results */}
              {platformResults.size > 0 && (
                <div className="space-y-4">
                  {/* Results header with selection controls */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {anyLoading ? '검색 중...' : `총 ${totalResults}개의 결과`}
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

                  {/* Results Grid - Grouped by Platform */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PLATFORMS.filter(p => enabledPlatforms.has(p.id)).map((platformConfig) => {
                      const platformData = platformResults.get(platformConfig.id)
                      if (!platformData) return null

                      return (
                        <div key={platformConfig.id} className="space-y-2">
                          {/* Platform Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${platformConfig.color}`}>
                                {platformConfig.label}
                              </span>
                              {platformData.isLoading && (
                                <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              )}
                              {!platformData.isLoading && (
                                <span className="text-xs text-zinc-400">
                                  ({platformData.results.length}개)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Platform Error */}
                          {platformData.error && (
                            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                              {platformData.error}
                            </p>
                          )}

                          {/* Platform Results */}
                          {platformData.results.length > 0 && (
                            <div className="space-y-2">
                              {platformData.results.map((result) => (
                                <div
                                  key={result.url}
                                  className={`flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border transition-colors cursor-pointer ${
                                    selectedUrls.has(result.url)
                                      ? 'border-primary ring-2 ring-primary/20'
                                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                  }`}
                                  onClick={() => !result.isSaved && toggleSelection(result.url)}
                                >
                                  {/* Checkbox */}
                                  <div className="flex-shrink-0 flex items-start pt-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedUrls.has(result.url)}
                                      onChange={() => toggleSelection(result.url)}
                                      disabled={result.isSaved}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    />
                                  </div>

                                  {/* Thumbnail */}
                                  {result.thumbnailUrl ? (
                                    <img
                                      src={result.thumbnailUrl}
                                      alt=""
                                      className="w-20 h-14 object-cover rounded flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-20 h-14 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center">
                                      <span className="text-xs text-zinc-400">No img</span>
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                      {result.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      {result.author && (
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">
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

                                  {/* Status */}
                                  <div className="flex-shrink-0 flex items-center">
                                    {result.isSaved ? (
                                      <span className="text-xs text-green-600 dark:text-green-400">저장됨</span>
                                    ) : result.isSaving ? (
                                      <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    ) : (
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSave(result)
                                        }}
                                        className="p-1 text-zinc-400 hover:text-primary transition-colors"
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </motion.button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Empty state for platform */}
                          {!platformData.isLoading && !platformData.error && platformData.results.length === 0 && (
                            <p className="text-xs text-zinc-400 text-center py-4">
                              검색 결과 없음
                            </p>
                          )}

                          {/* Load More Button */}
                          {platformData.hasMore && !platformData.isLoading && (
                            <button
                              onClick={() => handleLoadMore(platformConfig.id)}
                              disabled={platformData.isLoadingMore}
                              className="w-full py-2 text-xs font-medium text-primary hover:text-primary-dark hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {platformData.isLoadingMore ? (
                                <>
                                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span>불러오는 중...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  <span>더 보기</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Initial State */}
              {!isSearching && totalResults === 0 && !query && (
                <div className="text-center py-12">
                  <p className="text-zinc-500 dark:text-zinc-400 mb-2">
                    바이어스를 선택하거나 검색어를 입력하세요
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    모든 플랫폼에서 동시에 검색합니다
                  </p>
                </div>
              )}

              {/* Empty Results State */}
              {!isSearching && !anyLoading && totalResults === 0 && query && platformResults.size > 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                  검색 결과가 없습니다
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
                ESC 키로 닫기 • 선택한 플랫폼에서 동시 검색
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
