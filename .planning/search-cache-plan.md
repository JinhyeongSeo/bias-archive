# 검색 결과 캐싱 시스템 구현 계획

## 목표

- 같은 검색어로 재검색 시 이전에 본 결과는 접힌 상태로 표시
- 자동으로 다음 페이지 결과를 가져와서 새로운 콘텐츠 표시
- localStorage에 24시간 캐싱

## 핵심 동작

```
1. "아이유" 검색 (첫 검색)
   → API 호출 → 결과 20개 받음 → 6개 표시
   → localStorage에 캐시 저장

2. "아이유" 다시 검색 (24시간 이내)
   → 캐시 발견
   → "오늘 본 결과 (6개)" 접힌 상태로 표시
   → 캐시된 cursor로 다음 페이지 API 호출
   → 새 결과 표시

3. 24시간 후 "아이유" 검색
   → 캐시 만료 → 새로 API 호출
```

## 구현 상세

### 1. 캐시 데이터 구조

```typescript
// src/lib/searchCache.ts (신규 파일)

interface CachedPlatformResult {
  results: EnrichedResult[]
  nextCursor?: string      // Twitter
  nextPageToken?: string   // YouTube
  currentPage: number      // heye, kgirls
  currentOffset: number
  hasMore: boolean
}

interface SearchCacheEntry {
  query: string
  platforms: Record<Platform, CachedPlatformResult>
  cachedAt: string  // ISO timestamp
}

interface SearchCache {
  [query: string]: SearchCacheEntry
}

const CACHE_KEY = 'unified-search-cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24시간
```

### 2. 캐시 유틸리티 함수

```typescript
// src/lib/searchCache.ts

export function getSearchCache(query: string): SearchCacheEntry | null
export function setSearchCache(query: string, entry: SearchCacheEntry): void
export function isExpired(cachedAt: string): boolean
export function clearExpiredCache(): void
```

### 3. UnifiedSearch 컴포넌트 수정

**새로운 상태:**

```typescript
const [cachedResults, setCachedResults] = useState<Map<Platform, EnrichedResult[]>>(new Map())
const [showCached, setShowCached] = useState<Map<Platform, boolean>>(new Map())
```

**검색 로직 변경:**

```typescript
const handleSearch = async () => {
  // 1. 캐시 확인
  const cached = getSearchCache(query)

  if (cached && !isExpired(cached.cachedAt)) {
    // 2. 캐시된 결과를 "오늘 본 결과"로 저장
    setCachedResults(cached.platforms)

    // 3. 캐시된 cursor/token으로 다음 페이지 요청
    // ... API 호출 (각 플랫폼별 nextCursor 사용)
  } else {
    // 4. 캐시 없음 - 일반 검색
    // ... 기존 로직
  }
}
```

### 4. UI 변경

```tsx
{/* 플랫폼별 결과 섹션 */}
<div>
  {/* 캐시된 결과 (접힌 상태) */}
  {cachedResults.get(platform)?.length > 0 && (
    <button onClick={() => toggleShowCached(platform)}>
      {showCached.get(platform) ? '▼' : '▶'}
      오늘 본 결과 ({cachedResults.get(platform).length}개)
    </button>

    {showCached.get(platform) && (
      <div className="opacity-60">
        {cachedResults.get(platform).map(result => ...)}
      </div>
    )}
  )}

  {/* 새 결과 */}
  {platformData.results.map(result => ...)}
</div>
```

## 수정할 파일

1. **`src/lib/searchCache.ts`** (신규)
   - 캐시 CRUD 유틸리티

2. **`src/components/UnifiedSearch.tsx`**
   - 캐시 로직 통합
   - UI에 "오늘 본 결과" 섹션 추가

## 설정

- **캐시 TTL**: 24시간

## 검증 방법

1. "아이유" 검색 → 결과 확인
2. 모달 닫기 → 다시 열기 → "아이유" 검색
3. "오늘 본 결과" 접힌 상태 + 새 결과 표시 확인
4. localStorage에 캐시 데이터 확인 (DevTools > Application)
5. 캐시 삭제 후 재검색 시 정상 동작 확인
