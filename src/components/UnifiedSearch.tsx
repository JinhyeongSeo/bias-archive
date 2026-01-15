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
import {
  getSearchCache,
  updatePlatformCache,
  clearExpiredCache,
  type CachedPlatformResult,
} from '@/lib/searchCache'

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls' | 'kgirls-issue'

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
  thumbnailUrl?: string
  authorName?: string
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
  nextCursor?: string // For Twitter (ScrapeBadger) pagination
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
  { id: 'kgirls-issue', label: 'kgirls issue', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/50', ringColor: 'ring-purple-500/20' },
]

const RESULTS_PER_PLATFORM = 6      // 화면에 표시할 개수
const API_FETCH_COUNT = 20          // API에서 가져올 개수 (캐시용)

export function UnifiedSearch({ isOpen, onClose, savedUrls, onSave, biases, groups }: UnifiedSearchProps) {
  const { getDisplayName } = useNameLanguage()

  const [query, setQuery] = useState('')
  const [selectedBiasId, setSelectedBiasId] = useState<string | null>(null)
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<Platform>>(new Set(['youtube', 'twitter', 'heye', 'kgirls', 'kgirls-issue']))

  const [platformResults, setPlatformResults] = useState<Map<Platform, PlatformResults>>(new Map())
  const [isSearching, setIsSearching] = useState(false)

  // Multi-select state
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [isBatchSaving, setIsBatchSaving] = useState(false)

  // Cache state - 이전에 본 결과
  const [cachedResults, setCachedResults] = useState<Map<Platform, CachedPlatformResult>>(new Map())
  const [showCached, setShowCached] = useState<Map<Platform, boolean>>(new Map())

  // Toggle cached results visibility
  const toggleShowCached = (platform: Platform) => {
    setShowCached(prev => {
      const next = new Map(prev)
      next.set(platform, !prev.get(platform))
      return next
    })
  }

  // 컴포넌트 마운트 시 만료된 캐시 정리
  useEffect(() => {
    clearExpiredCache()
  }, [])

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
      setCachedResults(new Map())
      setShowCached(new Map())
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
      max: String(API_FETCH_COUNT),
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

  const searchTwitter = async (searchQuery: string, cursor?: string): Promise<{ results: EnrichedResult[], hasMore: boolean, nextCursor?: string }> => {
    // Remove # prefix if present - Google CSE handles hashtags better without the # symbol
    // The site:twitter.com filter in the API will find relevant tweets
    const cleanQuery = searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery

    console.log('[searchTwitter] query:', cleanQuery, 'cursor:', cursor)

    const params = new URLSearchParams({
      q: cleanQuery,
      count: String(API_FETCH_COUNT),
    })

    // Add cursor for ScrapeBadger pagination
    if (cursor) {
      params.set('cursor', cursor)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    let data
    try {
      const response = await fetch(`/api/search/twitter?${params}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Twitter 검색 실패')
      }

      console.log('[Twitter Search] provider:', data.provider, 'results:', data.results?.length)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다')
      }
      throw error
    }

    const twitterResults = data.results as TwitterResult[]

    // ScrapeBadger already returns thumbnailUrl and authorName, so we can use them directly
    // Only fetch metadata for results without thumbnailUrl (likely from Google CSE fallback)
    const results: EnrichedResult[] = await Promise.all(
      twitterResults.map(async (item): Promise<EnrichedResult> => {
        const isSaved = checkIfSaved(item.link)

        // If we already have thumbnail from ScrapeBadger, use it directly
        if (item.thumbnailUrl) {
          return {
            url: item.link,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl,
            author: item.authorName || '',
            platform: 'twitter',
            isSaved,
            isSaving: false,
          }
        }

        // Fallback: fetch metadata for Google CSE results
        const metaController = new AbortController()
        const metaTimeoutId = setTimeout(() => metaController.abort(), 5000)

        try {
          const metaResponse = await fetch('/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.link }),
            signal: metaController.signal,
          })

          clearTimeout(metaTimeoutId)

          if (metaResponse.ok) {
            const metadata = await metaResponse.json()
            return {
              url: item.link,
              title: metadata.title || item.title,
              thumbnailUrl: metadata.thumbnailUrl || null,
              author: metadata.authorName || '',
              platform: 'twitter',
              isSaved,
              isSaving: false,
            }
          }
        } catch {
          clearTimeout(metaTimeoutId)
        }

        // Fallback result if metadata fetch fails
        return {
          url: item.link,
          title: item.title,
          thumbnailUrl: null,
          author: '',
          platform: 'twitter',
          isSaved,
          isSaving: false,
        }
      })
    )

    return {
      results,
      hasMore: data.hasMore ?? false,
      nextCursor: data.nextCursor,
    }
  }

  const searchHeye = async (searchQuery: string, page: number = 1, offset: number = 0): Promise<{ results: EnrichedResult[], hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      limit: String(API_FETCH_COUNT),
      offset: String(offset),
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(`/api/search/heye?${params}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
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
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다')
      }
      throw error
    }
  }

  const searchKgirls = async (searchQuery: string, page: number = 1, offset: number = 0): Promise<{ results: EnrichedResult[], hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      board: 'mgall',
      limit: String(API_FETCH_COUNT),
      offset: String(offset),
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(`/api/search/kgirls?${params}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
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
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다')
      }
      throw error
    }
  }

  const searchKgirlsIssue = async (searchQuery: string, page: number = 1, offset: number = 0): Promise<{ results: EnrichedResult[], hasMore: boolean }> => {
    const params = new URLSearchParams({
      q: searchQuery,
      page: String(page),
      board: 'issue',
      limit: String(API_FETCH_COUNT),
      offset: String(offset),
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(`/api/search/kgirls?${params}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'kgirls.net issue 검색 실패')
      }

      const results = (data.results as KgirlsResult[]).map(item => ({
        url: item.url,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl ? getProxiedImageUrl(item.thumbnailUrl) : null,
        author: item.author,
        platform: 'kgirls-issue' as Platform,
        isSaved: checkIfSaved(item.url),
        isSaving: false,
      }))

      return {
        results,
        hasMore: data.hasMore ?? false,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다')
      }
      throw error
    }
  }

  // 플랫폼별 검색 처리 헬퍼 함수
  const processPlatformSearch = async (
    platform: Platform,
    cachedData: CachedPlatformResult | undefined,
    searchFn: () => Promise<{ results: EnrichedResult[], hasMore: boolean, nextPageToken?: string, nextCursor?: string }>,
    newCachedResults: Map<Platform, CachedPlatformResult>
  ) => {
    const displayedIndex = cachedData?.displayedIndex ?? 0
    const cachedResultsList = cachedData?.results ?? []
    const remainingInCache = cachedResultsList.length - displayedIndex

    // 캐시에 충분한 미표시 결과가 있으면 API 호출 없이 캐시에서 표시
    if (remainingInCache >= RESULTS_PER_PLATFORM) {
      const toDisplay = cachedResultsList.slice(displayedIndex, displayedIndex + RESULTS_PER_PLATFORM)
      const alreadyDisplayed = cachedResultsList.slice(0, displayedIndex)
      const newDisplayedIndex = displayedIndex + RESULTS_PER_PLATFORM
      const hasMoreInCache = cachedResultsList.length > newDisplayedIndex || cachedData?.hasMore

      // "오늘 본 결과"에 이전에 표시했던 결과 저장
      if (alreadyDisplayed.length > 0) {
        newCachedResults.set(platform, {
          ...cachedData!,
          results: alreadyDisplayed,
        })
      }

      setPlatformResults(prev => {
        const next = new Map(prev)
        next.set(platform, {
          platform,
          results: toDisplay,
          hasMore: hasMoreInCache ?? false,
          isLoading: false,
          isLoadingMore: false,
          error: null,
          currentPage: cachedData?.currentPage ?? 1,
          currentOffset: cachedData?.currentOffset ?? 0,
          nextPageToken: cachedData?.nextPageToken,
          nextCursor: cachedData?.nextCursor,
        })
        return next
      })

      // 캐시의 displayedIndex 업데이트 (비동기, await 불필요)
      void updatePlatformCache(query, platform, {
        ...cachedData!,
        displayedIndex: newDisplayedIndex,
      })

      return
    }

    // 캐시가 부족하면 API 호출
    try {
      const { results: apiResults, hasMore, nextPageToken, nextCursor } = await searchFn()

      // 캐시에서 가져올 부분 (미표시 부분)
      const fromCache = cachedResultsList.slice(displayedIndex)
      // 이미 표시한 부분 (오늘 본 결과)
      const alreadyDisplayed = cachedResultsList.slice(0, displayedIndex)

      // API 결과에서 중복 제거
      const existingUrls = new Set(cachedResultsList.map(r => r.url))
      const newApiResults = apiResults.filter(r => !existingUrls.has(r.url))

      // 캐시 잔여 + 새 API 결과 합치기
      const combined = [...fromCache, ...newApiResults]
      const toDisplay = combined.slice(0, RESULTS_PER_PLATFORM)
      const toSaveInCache = combined.slice(RESULTS_PER_PLATFORM)

      // "오늘 본 결과"에 이전에 표시했던 결과 저장
      if (alreadyDisplayed.length > 0) {
        newCachedResults.set(platform, {
          results: alreadyDisplayed,
          displayedIndex: alreadyDisplayed.length,
          currentPage: cachedData?.currentPage ?? 1,
          currentOffset: cachedData?.currentOffset ?? 0,
          hasMore: false,
          nextPageToken: cachedData?.nextPageToken,
          nextCursor: cachedData?.nextCursor,
        })
      }

      setPlatformResults(prev => {
        const next = new Map(prev)
        next.set(platform, {
          platform,
          results: toDisplay,
          hasMore: hasMore || toSaveInCache.length > 0,
          isLoading: false,
          isLoadingMore: false,
          error: null,
          currentPage: 1,
          currentOffset: 0,
          nextPageToken,
          nextCursor,
        })
        return next
      })

      // 전체 캐시 업데이트 (표시한 것 + 남은 것) - 비동기, await 불필요
      const allCachedResults = [...alreadyDisplayed, ...toDisplay, ...toSaveInCache]
      void updatePlatformCache(query, platform, {
        results: allCachedResults,
        displayedIndex: alreadyDisplayed.length + toDisplay.length,
        nextPageToken,
        nextCursor,
        currentPage: 1,
        currentOffset: 0,
        hasMore,
      })
    } catch (error) {
      console.error(`[UnifiedSearch] ${platform} error:`, error)
      setPlatformResults(prev => {
        const next = new Map(prev)
        next.set(platform, {
          platform,
          results: [],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
          error: error instanceof Error ? error.message : `${platform} 검색 실패`,
          currentPage: 1,
          currentOffset: 0,
        })
        return next
      })
    }
  }

  // Unified search - search all enabled platforms in parallel
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSelectedUrls(new Set())

    // 캐시 확인 (서버에서 가져오기)
    const cached = await getSearchCache(query)
    const newCachedResults = new Map<Platform, CachedPlatformResult>()

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
      const cachedYoutube = cached?.platforms.youtube
      searchPromises.push(
        processPlatformSearch(
          'youtube',
          cachedYoutube,
          () => searchYouTube(query, cachedYoutube?.nextPageToken),
          newCachedResults
        )
      )
    }

    if (enabledPlatforms.has('twitter')) {
      const cachedTwitter = cached?.platforms.twitter
      searchPromises.push(
        processPlatformSearch(
          'twitter',
          cachedTwitter,
          () => searchTwitter(query, cachedTwitter?.nextCursor),
          newCachedResults
        )
      )
    }

    if (enabledPlatforms.has('heye')) {
      const cachedHeye = cached?.platforms.heye
      const startPage = cachedHeye?.currentPage ?? 1
      const startOffset = cachedHeye?.currentOffset ?? 0
      searchPromises.push(
        processPlatformSearch(
          'heye',
          cachedHeye,
          () => searchHeye(query, startPage, startOffset),
          newCachedResults
        )
      )
    }

    if (enabledPlatforms.has('kgirls')) {
      const cachedKgirls = cached?.platforms.kgirls
      const startPage = cachedKgirls?.currentPage ?? 1
      const startOffset = cachedKgirls?.currentOffset ?? 0
      searchPromises.push(
        processPlatformSearch(
          'kgirls',
          cachedKgirls,
          () => searchKgirls(query, startPage, startOffset),
          newCachedResults
        )
      )
    }

    if (enabledPlatforms.has('kgirls-issue')) {
      const cachedKgirlsIssue = cached?.platforms['kgirls-issue']
      const startPage = cachedKgirlsIssue?.currentPage ?? 1
      const startOffset = cachedKgirlsIssue?.currentOffset ?? 0
      searchPromises.push(
        processPlatformSearch(
          'kgirls-issue',
          cachedKgirlsIssue,
          () => searchKgirlsIssue(query, startPage, startOffset),
          newCachedResults
        )
      )
    }

    await Promise.allSettled(searchPromises)

    // 캐시된 결과 상태 설정
    setCachedResults(newCachedResults)
    // 캐시된 결과는 기본적으로 접힌 상태
    setShowCached(new Map())

    setIsSearching(false)
  }

  // Load more results for a specific platform
  const handleLoadMore = async (platform: Platform) => {
    const currentData = platformResults.get(platform)
    console.log('[handleLoadMore] platform:', platform, 'currentData:', currentData)
    if (!currentData || currentData.isLoadingMore || !currentData.hasMore) {
      console.log('[handleLoadMore] early return - currentData:', !!currentData, 'isLoadingMore:', currentData?.isLoadingMore, 'hasMore:', currentData?.hasMore)
      return
    }

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
      let searchResult: { results: EnrichedResult[], hasMore: boolean, nextPageToken?: string, nextCursor?: string }
      let newPage = currentData.currentPage
      let newOffset = currentData.currentOffset

      // 로컬 상태 기준 displayedIndex (서버 캐시 타이밍 이슈 방지)
      const localDisplayedCount = currentData.results.length

      switch (platform) {
        case 'youtube': {
          // Check cache first
          const ytCacheEntry = await getSearchCache(query)
          const ytCache = ytCacheEntry?.platforms.youtube
          const ytCachedResults = ytCache?.results ?? []
          const ytRemainingInCache = ytCachedResults.length - localDisplayedCount

          if (ytRemainingInCache >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = ytCachedResults.slice(localDisplayedCount, localDisplayedCount + RESULTS_PER_PLATFORM)
            searchResult = {
              results: toDisplay.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
              hasMore: ytCachedResults.length > localDisplayedCount + RESULTS_PER_PLATFORM || ytCache?.hasMore || false,
              nextPageToken: ytCache?.nextPageToken,
            }
            // Update cache displayedIndex
            void updatePlatformCache(query, 'youtube', {
              ...ytCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            })
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = ytCachedResults.slice(localDisplayedCount)
            const needed = RESULTS_PER_PLATFORM - fromCache.length
            const apiResult = await searchYouTube(query, ytCache?.nextPageToken || currentData.nextPageToken)
            const fromApi = apiResult.results.slice(0, needed)
            const leftoverApi = apiResult.results.slice(needed)

            searchResult = {
              results: [
                ...fromCache.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
              nextPageToken: apiResult.nextPageToken,
            }

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, 'youtube', {
                results: [...ytCachedResults, ...apiResult.results],
                displayedIndex: localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: 1,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
                nextPageToken: apiResult.nextPageToken,
              })
            }
          }
          break
        }
        case 'twitter': {
          // Check cache first
          const twCacheEntry = await getSearchCache(query)
          const twCache = twCacheEntry?.platforms.twitter
          const twCachedResults = twCache?.results ?? []

          // 현재 화면에 표시된 URL들
          const displayedUrls = new Set(currentData.results.map(r => r.url))
          // 캐시에서 아직 표시되지 않은 결과만 필터링
          const twUnshownInCache = twCachedResults.filter(r => !displayedUrls.has(r.url))

          console.log('[Twitter LoadMore] cache:', twCachedResults.length, 'displayed:', displayedUrls.size, 'unshown:', twUnshownInCache.length, 'nextCursor:', twCache?.nextCursor || currentData.nextCursor)

          if (twUnshownInCache.length >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = twUnshownInCache.slice(0, RESULTS_PER_PLATFORM)
            searchResult = {
              results: toDisplay.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
              hasMore: twUnshownInCache.length > RESULTS_PER_PLATFORM || twCache?.hasMore || false,
              nextCursor: twCache?.nextCursor,
            }
            // Update cache displayedIndex
            void updatePlatformCache(query, 'twitter', {
              ...twCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            })
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = twUnshownInCache
            const needed = RESULTS_PER_PLATFORM - fromCache.length
            const cursor = twCache?.nextCursor || currentData.nextCursor
            console.log('[Twitter LoadMore] fetching with cursor:', cursor)
            const apiResult = await searchTwitter(query, cursor)

            // API 결과에서도 이미 표시된 URL 제외
            const newApiResults = apiResult.results.filter(r => !displayedUrls.has(r.url))
            const fromApi = newApiResults.slice(0, needed)
            const leftoverApi = newApiResults.slice(needed)

            searchResult = {
              results: [
                ...fromCache.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
              nextCursor: apiResult.nextCursor,
            }

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, 'twitter', {
                results: [...twCachedResults, ...apiResult.results],
                displayedIndex: localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: 1,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
                nextCursor: apiResult.nextCursor,
              })
            }
          }
          break
        }
        case 'heye': {
          // Check cache first
          const heyeCacheEntry = await getSearchCache(query)
          const heyeCache = heyeCacheEntry?.platforms.heye
          const heyeCachedResults = heyeCache?.results ?? []
          const heyeRemainingInCache = heyeCachedResults.length - localDisplayedCount

          if (heyeRemainingInCache >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = heyeCachedResults.slice(localDisplayedCount, localDisplayedCount + RESULTS_PER_PLATFORM)
            searchResult = {
              results: toDisplay.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
              hasMore: heyeCachedResults.length > localDisplayedCount + RESULTS_PER_PLATFORM || heyeCache?.hasMore || false,
            }
            // Update cache displayedIndex
            void updatePlatformCache(query, 'heye', {
              ...heyeCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            })
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = heyeCachedResults.slice(localDisplayedCount)
            const needed = RESULTS_PER_PLATFORM - fromCache.length
            newPage = currentData.currentPage + 1
            const apiResult = await searchHeye(query, newPage, 0)
            const fromApi = apiResult.results.slice(0, needed)
            const leftoverApi = apiResult.results.slice(needed)

            searchResult = {
              results: [
                ...fromCache.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
            }

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, 'heye', {
                results: [...heyeCachedResults, ...apiResult.results],
                displayedIndex: localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: newPage,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
              })
            }
          }
          break
        }
        case 'kgirls': {
          // Check cache first
          const kgirlsCacheEntry = await getSearchCache(query)
          const kgirlsCache = kgirlsCacheEntry?.platforms.kgirls
          const kgirlsCachedResults = kgirlsCache?.results ?? []
          const kgirlsRemainingInCache = kgirlsCachedResults.length - localDisplayedCount

          if (kgirlsRemainingInCache >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = kgirlsCachedResults.slice(localDisplayedCount, localDisplayedCount + RESULTS_PER_PLATFORM)
            searchResult = {
              results: toDisplay.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
              hasMore: kgirlsCachedResults.length > localDisplayedCount + RESULTS_PER_PLATFORM || kgirlsCache?.hasMore || false,
            }
            // Update cache displayedIndex
            void updatePlatformCache(query, 'kgirls', {
              ...kgirlsCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            })
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = kgirlsCachedResults.slice(localDisplayedCount)
            const needed = RESULTS_PER_PLATFORM - fromCache.length
            newPage = currentData.currentPage + 1
            const apiResult = await searchKgirls(query, newPage, 0)
            const fromApi = apiResult.results.slice(0, needed)
            const leftoverApi = apiResult.results.slice(needed)

            searchResult = {
              results: [
                ...fromCache.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
            }

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, 'kgirls', {
                results: [...kgirlsCachedResults, ...apiResult.results],
                displayedIndex: localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: newPage,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
              })
            }
          }
          break
        }
        case 'kgirls-issue': {
          // Check cache first
          const kgirlsIssueCacheEntry = await getSearchCache(query)
          const kgirlsIssueCache = kgirlsIssueCacheEntry?.platforms['kgirls-issue']
          const kgirlsIssueCachedResults = kgirlsIssueCache?.results ?? []
          const kgirlsIssueRemainingInCache = kgirlsIssueCachedResults.length - localDisplayedCount

          if (kgirlsIssueRemainingInCache >= RESULTS_PER_PLATFORM) {
            // Use cached results only
            const toDisplay = kgirlsIssueCachedResults.slice(localDisplayedCount, localDisplayedCount + RESULTS_PER_PLATFORM)
            searchResult = {
              results: toDisplay.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
              hasMore: kgirlsIssueCachedResults.length > localDisplayedCount + RESULTS_PER_PLATFORM || kgirlsIssueCache?.hasMore || false,
            }
            // Update cache displayedIndex
            void updatePlatformCache(query, 'kgirls-issue', {
              ...kgirlsIssueCache!,
              displayedIndex: localDisplayedCount + RESULTS_PER_PLATFORM,
            })
          } else {
            // Combine remaining cache + fetch next page
            const fromCache = kgirlsIssueCachedResults.slice(localDisplayedCount)
            const needed = RESULTS_PER_PLATFORM - fromCache.length
            newPage = currentData.currentPage + 1
            const apiResult = await searchKgirlsIssue(query, newPage, 0)
            const fromApi = apiResult.results.slice(0, needed)
            const leftoverApi = apiResult.results.slice(needed)

            searchResult = {
              results: [
                ...fromCache.map(r => ({ ...r, isSaved: checkIfSaved(r.url), isSaving: false })),
                ...fromApi,
              ],
              hasMore: leftoverApi.length > 0 || apiResult.hasMore,
            }

            // Update cache with new API results
            if (leftoverApi.length > 0 || apiResult.hasMore) {
              void updatePlatformCache(query, 'kgirls-issue', {
                results: [...kgirlsIssueCachedResults, ...apiResult.results],
                displayedIndex: localDisplayedCount + fromCache.length + fromApi.length,
                currentPage: newPage,
                currentOffset: 0,
                hasMore: apiResult.hasMore,
              })
            }
          }
          break
        }
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
          console.log('[LoadMore setPlatformResults]', platform, 'searchResult.results:', searchResult.results.length, 'existingUrls:', existingUrls.size, 'newResults:', newResults.length, 'duplicates:', searchResult.results.filter(r => existingUrls.has(r.url)).map(r => r.url))

          next.set(platform, {
            ...data,
            results: [...data.results, ...newResults],
            hasMore: searchResult.hasMore,
            isLoadingMore: false,
            currentPage: newPage,
            currentOffset: newOffset,
            nextPageToken: searchResult.nextPageToken,
            nextCursor: searchResult.nextCursor,
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
  const handleSaveCachedResult = async (platform: Platform, result: EnrichedResult) => {
    if (result.isSaved || result.isSaving) return

    // Update isSaving state in cachedResults
    setCachedResults(prev => {
      const next = new Map(prev)
      const platformData = next.get(platform)
      if (platformData) {
        next.set(platform, {
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
        setCachedResults(prev => {
          const next = new Map(prev)
          const platformData = next.get(platform)
          if (platformData) {
            next.set(platform, {
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
      console.error('Save cached result error:', err)
      setCachedResults(prev => {
        const next = new Map(prev)
        const platformData = next.get(platform)
        if (platformData) {
          next.set(platform, {
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
            className="relative w-full max-w-4xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] bg-background rounded-xl shadow-2xl flex flex-col"
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smoothSpring}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
              {/* Search Row: Bias Dropdown + Search Input */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Bias Dropdown */}
                <div className="w-full sm:w-48 flex-shrink-0">
                  <select
                    value={selectedBiasId || ''}
                    onChange={(e) => setSelectedBiasId(e.target.value || null)}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <motion.button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim()}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                    {...pressScale}
                  >
                    {isSearching ? '검색 중...' : '검색'}
                  </motion.button>
                </div>
              </div>

              {/* Platform Filter */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mr-0.5 sm:mr-1">플랫폼:</span>
                {PLATFORMS.map((platform) => {
                  const isEnabled = enabledPlatforms.has(platform.id)
                  return (
                    <motion.button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
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
                <div className="space-y-3 sm:space-y-4">
                  {/* Results header with selection controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      {anyLoading ? '검색 중...' : `총 ${totalResults}개의 결과`}
                    </p>

                    {/* Selection controls */}
                    {selectableCount > 0 && (
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-xs sm:text-sm text-primary font-medium">
                            {selectedCount}개 선택
                          </span>
                        )}
                        <motion.button
                          onClick={selectedCount === selectableCount ? clearSelection : selectAll}
                          className="px-2 sm:px-3 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          {...pressScale}
                        >
                          {selectedCount === selectableCount ? '선택 해제' : '전체 선택'}
                        </motion.button>
                        {selectedCount > 0 && (
                          <motion.button
                            onClick={handleBatchSave}
                            disabled={isBatchSaving}
                            className="px-3 sm:px-4 py-1 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                            {...pressScale}
                          >
                            {isBatchSaving ? '저장 중...' : `${selectedCount}개 저장`}
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Results Grid - Grouped by Platform */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {PLATFORMS.filter(p => enabledPlatforms.has(p.id)).map((platformConfig) => {
                      const platformData = platformResults.get(platformConfig.id)
                      if (!platformData) return null

                      return (
                        <div key={platformConfig.id} className="space-y-2">
                          {/* Platform Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs sm:text-sm font-medium ${platformConfig.color}`}>
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

                          {/* Cached Results - 오늘 본 결과 */}
                          {cachedResults.get(platformConfig.id) && cachedResults.get(platformConfig.id)!.results.length > 0 && (
                            <div className="space-y-1.5">
                              <button
                                onClick={() => toggleShowCached(platformConfig.id)}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform ${showCached.get(platformConfig.id) ? 'rotate-90' : ''}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span>오늘 본 결과 ({cachedResults.get(platformConfig.id)!.results.length}개)</span>
                              </button>

                              {showCached.get(platformConfig.id) && (
                                <div className="space-y-1.5 sm:space-y-2 opacity-60">
                                  {cachedResults.get(platformConfig.id)!.results.map((result) => (
                                    <div
                                      key={`cached-${result.url}`}
                                      className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-zinc-100 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700"
                                    >
                                      {/* Thumbnail */}
                                      {result.thumbnailUrl ? (
                                        <img
                                          src={result.thumbnailUrl}
                                          alt=""
                                          className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-16 h-12 sm:w-20 sm:h-14 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center">
                                          <span className="text-[10px] sm:text-xs text-zinc-400">No img</span>
                                        </div>
                                      )}

                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2">
                                          {result.title}
                                        </h4>
                                        <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                          {result.author && (
                                            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[80px] sm:max-w-[120px]">
                                              {result.author}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status */}
                                      <div className="flex-shrink-0 flex items-center">
                                        {result.isSaved ? (
                                          <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">저장됨</span>
                                        ) : result.isSaving ? (
                                          <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                          </svg>
                                        ) : (
                                          <motion.button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleSaveCachedResult(platformConfig.id, result)
                                            }}
                                            className="p-1.5 sm:p-1 text-zinc-400 hover:text-primary transition-colors"
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
                            </div>
                          )}

                          {/* Platform Results */}
                          {platformData.results.length > 0 && (
                            <div className="space-y-1.5 sm:space-y-2">
                              {platformData.results.map((result) => (
                                <div
                                  key={result.url}
                                  className={`flex gap-2 sm:gap-3 p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border transition-colors cursor-pointer ${
                                    selectedUrls.has(result.url)
                                      ? 'border-primary ring-2 ring-primary/20'
                                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                  }`}
                                  onClick={() => !result.isSaved && toggleSelection(result.url)}
                                >
                                  {/* Checkbox */}
                                  <div className="flex-shrink-0 flex items-start pt-0.5 sm:pt-1">
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
                                      className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-16 h-12 sm:w-20 sm:h-14 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0 flex items-center justify-center">
                                      <span className="text-[10px] sm:text-xs text-zinc-400">No img</span>
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] sm:text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                      {result.title}
                                    </h4>
                                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                      {result.author && (
                                        <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[80px] sm:max-w-[120px]">
                                          {result.author}
                                        </span>
                                      )}
                                      {result.publishedAt && (
                                        <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                                          {formatDate(result.publishedAt)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status */}
                                  <div className="flex-shrink-0 flex items-center">
                                    {result.isSaved ? (
                                      <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">저장됨</span>
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
                                        className="p-1.5 sm:p-1 text-zinc-400 hover:text-primary transition-colors"
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
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('[LoadMore] clicked for platform:', platformConfig.id, 'hasMore:', platformData.hasMore)
                                handleLoadMore(platformConfig.id)
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('[LoadMore] touch for platform:', platformConfig.id)
                                if (!platformData.isLoadingMore) {
                                  handleLoadMore(platformConfig.id)
                                }
                              }}
                              disabled={platformData.isLoadingMore}
                              className="w-full py-3 sm:py-2 text-xs font-medium text-primary hover:text-primary-dark hover:bg-primary/5 active:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
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
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl">
              <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 text-center">
                ESC 키로 닫기 • 선택한 플랫폼에서 동시 검색
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
