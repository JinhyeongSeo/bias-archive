/**
 * 검색 결과 캐싱 시스템 (하이브리드)
 * - 검색 결과: 서버(Supabase)에 전역 공유 캐시 (API 비용 절감)
 * - 본 상태(displayedIndex): 서버에 사용자별 저장 (기기 간 동기화)
 * - 24시간 TTL
 */

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls' | 'kgirls-issue' | 'selca' | 'instagram'

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

export interface CachedPlatformResult {
  results: EnrichedResult[]
  nextCursor?: string      // Twitter (ScrapeBadger)
  nextPageToken?: string   // YouTube
  nextMaxTimeId?: string   // selca (max_time_id based pagination)
  currentPage: number      // heye, kgirls
  currentOffset: number
  hasMore: boolean
  displayedIndex: number   // 현재까지 표시한 결과 인덱스 (다음에 표시할 시작점)
}

export interface SearchCacheEntry {
  query: string
  platforms: Partial<Record<Platform, CachedPlatformResult>>
  cachedAt: string  // ISO timestamp
}

interface ServerCacheEntry {
  id: string
  query: string
  platform: Platform
  results: EnrichedResult[]
  next_cursor: string | null
  next_page_token: string | null
  next_max_time_id: string | null  // selca pagination
  current_page: number
  current_offset: number
  has_more: boolean
  cached_at: string
}

interface ViewedState {
  displayedIndex: number
  viewedAt: string
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24시간

/**
 * 캐시가 만료되었는지 확인
 */
export function isExpired(cachedAt: string): boolean {
  const cachedTime = new Date(cachedAt).getTime()
  const now = Date.now()
  return now - cachedTime > CACHE_TTL_MS
}

/**
 * 서버에서 캐시된 검색 결과 가져오기 (전역 공유)
 */
export async function getServerCache(query: string): Promise<Partial<Record<Platform, ServerCacheEntry>> | null> {
  try {
    const normalizedQuery = encodeURIComponent(query.trim().toLowerCase())
    const res = await fetch(`/api/search/cache?query=${normalizedQuery}`)

    if (!res.ok) return null

    const data = await res.json()
    return Object.keys(data).length > 0 ? data : null
  } catch (error) {
    console.error('Error fetching server cache:', error)
    return null
  }
}

/**
 * 서버에 캐시 저장 (전역 공유)
 */
export async function saveServerCache(
  query: string,
  platform: Platform,
  results: EnrichedResult[],
  options: {
    nextCursor?: string
    nextPageToken?: string
    nextMaxTimeId?: string  // selca pagination
    currentPage?: number
    currentOffset?: number
    hasMore?: boolean
  } = {}
): Promise<void> {
  try {
    await fetch('/api/search/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim().toLowerCase(),
        platform,
        results,
        ...options,
      }),
    })
  } catch (error) {
    console.error('Error saving server cache:', error)
  }
}

/**
 * 서버에서 사용자의 "본 상태" 가져오기
 */
export async function getViewedState(query: string): Promise<Partial<Record<Platform, ViewedState>> | null> {
  try {
    const normalizedQuery = encodeURIComponent(query.trim().toLowerCase())
    const res = await fetch(`/api/search/viewed?query=${normalizedQuery}`)

    if (!res.ok) return null

    const data = await res.json()
    return Object.keys(data).length > 0 ? data : null
  } catch (error) {
    console.error('Error fetching viewed state:', error)
    return null
  }
}

/**
 * 서버에 사용자의 "본 상태" 저장
 */
export async function saveViewedState(
  query: string,
  platform: Platform,
  displayedIndex: number
): Promise<void> {
  try {
    await fetch('/api/search/viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim().toLowerCase(),
        platform,
        displayedIndex,
      }),
    })
  } catch (error) {
    console.error('Error saving viewed state:', error)
  }
}

/**
 * 서버 캐시 + viewed 상태를 합쳐서 CachedPlatformResult로 변환
 */
export function mergeServerCacheWithViewed(
  serverCache: ServerCacheEntry,
  viewedState: ViewedState | undefined
): CachedPlatformResult {
  return {
    results: serverCache.results,
    nextCursor: serverCache.next_cursor || undefined,
    nextPageToken: serverCache.next_page_token || undefined,
    nextMaxTimeId: serverCache.next_max_time_id || undefined,  // selca pagination
    currentPage: serverCache.current_page,
    currentOffset: serverCache.current_offset,
    hasMore: serverCache.has_more,
    displayedIndex: viewedState?.displayedIndex ?? 0,
  }
}

/**
 * 전체 검색 캐시 가져오기 (서버 + viewed 상태 합침)
 */
export async function getSearchCache(query: string): Promise<SearchCacheEntry | null> {
  const [serverCache, viewedState] = await Promise.all([
    getServerCache(query),
    getViewedState(query),
  ])

  if (!serverCache) return null

  const platforms: Partial<Record<Platform, CachedPlatformResult>> = {}
  let cachedAt = ''

  for (const platform of Object.keys(serverCache) as Platform[]) {
    const cacheEntry = serverCache[platform]
    if (cacheEntry && !isExpired(cacheEntry.cached_at)) {
      platforms[platform] = mergeServerCacheWithViewed(
        cacheEntry,
        viewedState?.[platform]
      )
      if (!cachedAt || cacheEntry.cached_at > cachedAt) {
        cachedAt = cacheEntry.cached_at
      }
    }
  }

  if (Object.keys(platforms).length === 0) return null

  return {
    query: query.trim().toLowerCase(),
    platforms,
    cachedAt,
  }
}

/**
 * 특정 플랫폼의 캐시 업데이트 (결과 + viewed 상태)
 */
export async function updatePlatformCache(
  query: string,
  platform: Platform,
  platformResult: CachedPlatformResult
): Promise<void> {
  // 결과 저장 (전역 공유)
  await saveServerCache(query, platform, platformResult.results, {
    nextCursor: platformResult.nextCursor,
    nextPageToken: platformResult.nextPageToken,
    nextMaxTimeId: platformResult.nextMaxTimeId,  // selca pagination
    currentPage: platformResult.currentPage,
    currentOffset: platformResult.currentOffset,
    hasMore: platformResult.hasMore,
  })

  // viewed 상태 저장 (사용자별)
  await saveViewedState(query, platform, platformResult.displayedIndex)
}

/**
 * 특정 검색어의 캐시 저장 (하위 호환성)
 */
export async function setSearchCache(query: string, entry: SearchCacheEntry): Promise<void> {
  const platforms = Object.entries(entry.platforms) as [Platform, CachedPlatformResult][]

  await Promise.all(
    platforms.map(([platform, result]) => updatePlatformCache(query, platform, result))
  )
}

// ==============================
// 로컬 캐시 (폴백 및 하위 호환성)
// ==============================

const LOCAL_CACHE_KEY = 'unified-search-cache'

interface LocalSearchCache {
  [query: string]: SearchCacheEntry
}

/**
 * 로컬 캐시 가져오기 (서버 장애 시 폴백용)
 */
export function getLocalCache(): LocalSearchCache {
  if (typeof window === 'undefined') return {}

  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!cached) return {}
    return JSON.parse(cached) as LocalSearchCache
  } catch {
    return {}
  }
}

/**
 * 로컬 캐시 저장
 */
export function saveLocalCache(cache: LocalSearchCache): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.warn('localStorage full:', e)
    clearExpiredLocalCache()
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache))
    } catch {
      // 실패 무시
    }
  }
}

/**
 * 만료된 로컬 캐시 정리
 */
export function clearExpiredLocalCache(): void {
  const cache = getLocalCache()
  let hasChanges = false

  for (const query of Object.keys(cache)) {
    if (isExpired(cache[query].cachedAt)) {
      delete cache[query]
      hasChanges = true
    }
  }

  if (hasChanges) {
    saveLocalCache(cache)
  }
}

/**
 * 전체 로컬 캐시 삭제
 */
export function clearAllLocalCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_CACHE_KEY)
}

// 하위 호환성을 위한 alias
export const clearExpiredCache = clearExpiredLocalCache
export const clearAllCache = clearAllLocalCache
export function deleteSearchCache(query: string): void {
  const cache = getLocalCache()
  const normalizedQuery = query.trim().toLowerCase()
  if (cache[normalizedQuery]) {
    delete cache[normalizedQuery]
    saveLocalCache(cache)
  }
}
