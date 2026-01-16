# UAT Issues: Phase 30 Plan 01

**Tested:** 2026-01-16
**Source:** .planning/phases/30-selca-infinite-scroll/30-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None - all issues resolved]

## Resolved Issues

### UAT-001: UnifiedSearch selca "더 보기" 클릭 시 처음부터 다시 로드

**Discovered:** 2026-01-16
**Resolved:** 2026-01-16 - Fixed in 30-01 hotfix
**Phase/Plan:** 30-01
**Severity:** Blocker
**Feature:** UnifiedSearch selca 페이지네이션

**Description:** "더 보기" 버튼 클릭 시 다음 페이지가 아닌 맨 처음 결과부터 다시 로드됨

**Root Cause:**

1. `searchCache.ts`에서 `nextMaxTimeId` 필드가 캐시에 저장/로드되지 않음
2. `loadMore`에서 캐시의 `displayedIndex`를 사용하지 않고 현재 세션의 결과만으로 "아직 보지 않은" 결과를 판단

**Fix:**

1. `ServerCacheEntry`에 `next_max_time_id` 필드 추가
2. `saveServerCache`, `mergeServerCacheWithViewed`, `updatePlatformCache`에 `nextMaxTimeId` 처리 추가
3. API route `/api/search/cache`에 `nextMaxTimeId` 필드 처리 추가
4. DB migration: `next_max_time_id` 컬럼 추가
5. `loadMore` selca 케이스: `cacheDisplayedIndex`를 사용해서 캐시에서 올바른 위치부터 결과 가져오기

---

*Phase: 30-selca-infinite-scroll*
*Plan: 01*
*Tested: 2026-01-16*
