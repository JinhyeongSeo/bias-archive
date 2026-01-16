---
phase: 27-selca-external-search
plan: 27-01-FIX
subsystem: ui
tags: [external-search, selca, bug-fix]

# Dependency graph
requires:
  - phase: 27-01
    provides: selca API route and ExternalSearch component structure

provides:
  - UnifiedSearch에 selca 탭 추가 완료
  - selca 플랫폼 타입 및 검색 기능 완전 통합
  - 데이터베이스 platform enum에 selca 추가

affects: [28-selca-search-ux]

# Tech tracking
tech-stack:
  added: []
  patterns: [platform-enum-extension, database-constraint-migration]

key-files:
  created:
    - supabase/migrations/20260116000003_add_selca_platform.sql
  modified:
    - src/components/UnifiedSearch.tsx
    - src/lib/searchCache.ts
    - src/app/api/search/cache/route.ts
    - src/app/api/search/viewed/route.ts

key-decisions:
  - "UnifiedSearch가 실제 사용되는 컴포넌트 (ExternalSearch는 별도)"
  - "Platform 타입을 모든 관련 파일에 일관되게 추가"
  - "데이터베이스 check constraint 마이그레이션으로 타입 안정성 확보"

issues-created: []

# Metrics
duration: 14min
completed: 2026-01-16
---

# Phase 27 Plan 01-FIX: Selca Tab Display Fix Summary

**UnifiedSearch에 selca 탭 추가 및 플랫폼 통합 완료**

## Performance

- **Duration:** 14 min
- **Started:** 2026-01-16T05:09:57Z
- **Completed:** 2026-01-16T05:23:57Z
- **Tasks:** 2/2 (checkpoint 제외)
- **Files modified:** 5
- **Commits:** 2

## Accomplishments

- UnifiedSearch.tsx에 selca 플랫폼 완전 통합 (타입, 탭, 검색 함수)
- 모든 API 라우트 및 캐시 시스템에 selca 플랫폼 타입 추가
- 데이터베이스 platform constraint에 'selca' 추가 (마이그레이션)
- 영문 아이돌 이름 검색 정상 작동 확인

## Task Commits

1. **Task 1-2: UnifiedSearch에 selca 추가** - `1c8d422` (fix)
   - Platform 타입에 'selca' 추가
   - PLATFORMS 배열에 selca 설정 추가 (보라색 테마)
   - searchSelca 함수 구현
   - enabledPlatforms 초기값에 'selca' 추가
   - SelcaResult 인터페이스 추가
   - searchCache.ts Platform 타입 업데이트

2. **Task 1-2 (추가): API 및 DB 수정** - `eaaaa56` (fix)
   - /api/search/cache와 /api/search/viewed에 selca 타입 추가
   - 데이터베이스 마이그레이션 생성 및 적용
   - search_cache, user_search_viewed 테이블 constraint 업데이트

**Plan metadata:** (완료 후 생성 예정)

## Files Created/Modified

- `src/components/UnifiedSearch.tsx` - selca 플랫폼 완전 통합
- `src/lib/searchCache.ts` - Platform 타입에 'selca' 추가
- `src/app/api/search/cache/route.ts` - Platform 타입에 'selca' 추가
- `src/app/api/search/viewed/route.ts` - Platform 타입에 'selca' 추가
- `supabase/migrations/20260116000003_add_selca_platform.sql` - 데이터베이스 constraint 업데이트

## Decisions Made

**UnifiedSearch가 실제 컴포넌트:**
- 초기 조사 시 ExternalSearch를 수정했으나, 실제로는 UnifiedSearch가 사용됨
- UnifiedSearch는 통합검색 모달 (아카이브 + 외부 검색)
- ExternalSearch는 별도 컴포넌트 (사용되지 않음)

**일관된 Platform 타입 관리:**
- UnifiedSearch, searchCache, API 라우트 모두에서 Platform 타입 동일하게 관리
- 타입 불일치로 인한 런타임 에러 방지

**데이터베이스 마이그레이션:**
- check constraint 방식으로 platform 타입 제한
- 이전 패턴 (kgirls-issue 추가) 그대로 따라 일관성 유지

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] UnifiedSearch가 실제 컴포넌트임을 발견**
- **Found during:** Task 1 (초기 조사)
- **Issue:** ExternalSearch.tsx에는 코드가 있었지만 실제로 사용되는 것은 UnifiedSearch.tsx
- **Fix:** UnifiedSearch.tsx에 selca 플랫폼 추가
- **Files modified:** src/components/UnifiedSearch.tsx
- **Verification:** 브라우저에서 selca 탭 표시 확인
- **Commit:** 1c8d422

**2. [Rule 3 - Blocking] API 500 에러 발생**
- **Found during:** Task 3 (사용자 테스트 중)
- **Issue:** API 라우트 및 데이터베이스에 'selca' 플랫폼 타입 없음
- **Fix:**
  - API 라우트 Platform 타입 업데이트
  - 데이터베이스 마이그레이션 생성 및 적용
- **Files modified:**
  - src/app/api/search/cache/route.ts
  - src/app/api/search/viewed/route.ts
  - supabase/migrations/20260116000003_add_selca_platform.sql
- **Verification:** API 요청 성공, 캐시 저장 정상 작동
- **Commit:** eaaaa56

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** 모든 수정사항은 기능 완성을 위해 필수적이었음. 계획에 없었지만 발견 즉시 해결.

## Issues Encountered

**한글 검색 미지원:**
- "윈터" 검색 시 404 에러 (매칭되는 아이돌 없음)
- "winter" 영문 검색은 정상 작동 (20개 결과)
- 원인: selca.kastden.org 데이터에 한글 stage name 없음
- 해결책: Phase 28에서 한영 매핑 또는 Bias 드롭다운 활용 예정

## Next Phase Readiness

**완료됨:**
- ✅ Selca 탭이 UnifiedSearch 모달에 표시됨
- ✅ 영문 아이돌 이름으로 검색 가능
- ✅ 검색 결과 캐싱 정상 작동
- ✅ 데이터베이스 constraint 업데이트 완료

**다음 Phase 권장:**
- Phase 28: Selca Search UX Improvement
  - 한글 아이돌 이름 검색 지원 (한영 매핑)
  - 안내 메시지 및 에러 메시지 개선
  - Bias 드롭다운 활용

**Blockers:** None

---
*Phase: 27-selca-external-search*
*Completed: 2026-01-16*
