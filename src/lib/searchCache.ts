/**
 * 검색 결과 캐싱 시스템
 * - localStorage에 24시간 동안 검색 결과 캐시
 * - 같은 검색어로 재검색 시 이전 결과는 "오늘 본 결과"로 표시
 * - 캐시된 cursor/pageToken으로 다음 페이지부터 검색
 */

type Platform = 'youtube' | 'twitter' | 'heye' | 'kgirls'

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

interface SearchCache {
  [query: string]: SearchCacheEntry
}

const CACHE_KEY = 'unified-search-cache'
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
 * 전체 캐시 가져오기
 */
function getAllCache(): SearchCache {
  if (typeof window === 'undefined') return {}

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return {}
    return JSON.parse(cached) as SearchCache
  } catch {
    return {}
  }
}

/**
 * 전체 캐시 저장
 */
function saveAllCache(cache: SearchCache): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    // localStorage가 가득 찼을 때 오래된 캐시 정리 후 재시도
    console.warn('localStorage full, clearing expired cache:', e)
    clearExpiredCache()
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch {
      // 그래도 실패하면 무시
    }
  }
}

/**
 * 특정 검색어의 캐시 가져오기
 */
export function getSearchCache(query: string): SearchCacheEntry | null {
  const normalizedQuery = query.trim().toLowerCase()
  const cache = getAllCache()
  const entry = cache[normalizedQuery]

  if (!entry) return null

  // 만료된 캐시는 반환하지 않음
  if (isExpired(entry.cachedAt)) {
    // 만료된 항목 삭제
    delete cache[normalizedQuery]
    saveAllCache(cache)
    return null
  }

  return entry
}

/**
 * 특정 검색어의 캐시 저장
 */
export function setSearchCache(query: string, entry: SearchCacheEntry): void {
  const normalizedQuery = query.trim().toLowerCase()
  const cache = getAllCache()

  cache[normalizedQuery] = {
    ...entry,
    query: normalizedQuery,
    cachedAt: new Date().toISOString(),
  }

  saveAllCache(cache)
}

/**
 * 특정 검색어의 플랫폼 결과 업데이트
 */
export function updatePlatformCache(
  query: string,
  platform: Platform,
  platformResult: CachedPlatformResult
): void {
  const normalizedQuery = query.trim().toLowerCase()
  const cache = getAllCache()

  const existingEntry = cache[normalizedQuery]

  if (existingEntry && !isExpired(existingEntry.cachedAt)) {
    // 기존 캐시에 플랫폼 결과 추가/업데이트
    existingEntry.platforms[platform] = platformResult
    saveAllCache(cache)
  } else {
    // 새 캐시 생성
    cache[normalizedQuery] = {
      query: normalizedQuery,
      platforms: { [platform]: platformResult },
      cachedAt: new Date().toISOString(),
    }
    saveAllCache(cache)
  }
}

/**
 * 만료된 캐시 정리
 */
export function clearExpiredCache(): void {
  const cache = getAllCache()
  let hasChanges = false

  for (const query of Object.keys(cache)) {
    if (isExpired(cache[query].cachedAt)) {
      delete cache[query]
      hasChanges = true
    }
  }

  if (hasChanges) {
    saveAllCache(cache)
  }
}

/**
 * 특정 검색어의 캐시 삭제
 */
export function deleteSearchCache(query: string): void {
  const normalizedQuery = query.trim().toLowerCase()
  const cache = getAllCache()

  if (cache[normalizedQuery]) {
    delete cache[normalizedQuery]
    saveAllCache(cache)
  }
}

/**
 * 전체 캐시 삭제
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_KEY)
}
