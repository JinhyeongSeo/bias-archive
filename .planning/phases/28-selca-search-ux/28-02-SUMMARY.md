---
phase: 28-selca-search-ux
plan: 02
subsystem: search
tags: [selca, bias, search, performance]

# Dependency graph
requires:
  - phase: 27-selca-external-search
    provides: selca 검색 기본 기능
provides:
  - Bias 기반 즉시 selca 검색 (타임아웃 없음)
  - selca_slug 저장 및 활용
affects: [unified-search, bias-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [bias-based-search-optimization]

key-files:
  created:
    - supabase/migrations/20260116000004_add_selca_slug_to_biases.sql
  modified:
    - src/types/database.ts
    - src/components/BiasManager.tsx
    - src/app/api/biases/route.ts
    - src/app/api/biases/batch/route.ts
    - src/components/UnifiedSearch.tsx
    - src/app/api/search/selca/route.ts

key-decisions:
  - "selca_slug를 biases 테이블에 저장 (500+ 아이돌 데이터 불필요)"
  - "Option A: 수동 백필 전략 선택 (점진적 데이터 채움)"
  - "페이지네이션 비활성화 (max_time_id 추적 미구현)"

patterns-established:
  - "Bias 매칭 우선, 없으면 fallback 패턴"
  - "slug 직접 사용으로 API 호출 최소화"

issues-created: []

# Metrics
duration: 11min
completed: 2026-01-16
---

# Phase 28 Plan 02: Selca Search UX Summary

**Bias 기반 즉시 selca 검색 - selca_slug 저장 및 활용으로 타임아웃 제거**

## Performance

- **Duration:** 11 min
- **Started:** 2026-01-16T06:14:53Z
- **Completed:** 2026-01-16T06:26:22Z
- **Tasks:** 6/6 (5 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments

- biases 테이블에 selca_slug 컬럼 추가 및 인덱스 생성
- BiasManager에서 최애 추가 시 selca_slug 자동 저장 (개별/일괄 모두)
- UnifiedSearch에서 Bias 매칭 후 slug 우선 사용 (즉시 검색)
- selca API에서 slug 직접 사용 시 searchMembers 호출 건너뛰기 (타임아웃 제거)
- 구현되지 않은 페이지네이션 비활성화 (무한 로딩 방지)

## Task Commits

1. **Task 1: Add selca_slug column to biases table** - `64e6187` (feat)
2. **Task 2: Add selca_slug to Bias type** - `8ca4e3a` (feat)
3. **Task 3: Save selca_slug in BiasManager** - `04c664e` (feat)
4. **Task 4: Implement Bias matching in UnifiedSearch** - `3ad4f0e` (feat)
5. **Task 5: Decide on backfill strategy** - (no commit, Option A selected)
6. **Task 6: Checkpoint - human verify** - approved

**Bug fixes during execution:**
- `c857f8d` (fix): skip searchMembers when query is already a slug
- `743d72d` (fix): disable unimplemented selca pagination

**Plan metadata:** (pending)

## Files Created/Modified

- `supabase/migrations/20260116000004_add_selca_slug_to_biases.sql` - selca_slug 컬럼 추가 마이그레이션
- `src/types/database.ts` - Bias 타입에 selca_slug 필드 추가 (Row/Insert/Update)
- `src/components/BiasManager.tsx` - selca_slug state 추가, 멤버 선택 시 저장, API 전송
- `src/app/api/biases/route.ts` - 개별 Bias 추가 시 selca_slug 저장
- `src/app/api/biases/batch/route.ts` - 일괄 Bias 추가 시 selca_slug 저장
- `src/components/UnifiedSearch.tsx` - Bias 매칭 로직 추가, slug 우선 사용
- `src/app/api/search/selca/route.ts` - slug 형식 감지, searchMembers 건너뛰기, 페이지네이션 비활성화

## Decisions Made

**1. selca_slug를 biases 테이블에 저장**
- **Rationale:** 28-01의 fetchAllIdols() 방식은 500+ 아이돌 페이지 방문으로 15초 타임아웃 초과. Bias에 slug 저장하면 사용자가 실제 검색할 아이돌만 데이터 보유, 즉시 검색 가능.

**2. Option A: 수동 백필 전략 선택**
- **Rationale:** 추가 코드 불필요, 사용자가 실제로 사용하는 Bias만 업데이트, 점진적 데이터 채움. Option B (백필 스크립트)나 Option C (UI 버튼)보다 간단하고 유지보수 쉬움.

**3. 페이지네이션 비활성화**
- **Rationale:** max_time_id 추적이 구현되지 않아 "더보기" 클릭 시 무한 로딩 발생. 첫 페이지 20개 결과로 충분하며, 향후 필요 시 구현 가능.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] slug 형식 쿼리 감지 및 searchMembers 건너뛰기**
- **Found during:** Task 6 (Checkpoint 검증 중)
- **Issue:** UnifiedSearch에서 selca_slug를 전달해도 API가 다시 searchMembers()를 호출해서 타임아웃 발생
- **Fix:** query가 slug 형식(`/^[a-z0-9_]+$/`)이면 searchMembers 호출 건너뛰고 바로 사용
- **Files modified:** src/app/api/search/selca/route.ts
- **Verification:** "윈터" 검색 시 즉시 결과 표시, 타임아웃 없음
- **Committed in:** c857f8d

**2. [Rule 1 - Bug] 페이지네이션 비활성화**
- **Found during:** Task 6 (Checkpoint 검증 중)
- **Issue:** selca "더보기" 버튼 클릭 시 무한 로딩 (max_time_id 추적 미구현)
- **Fix:** hasNextPage를 false로 설정, 첫 페이지만 표시
- **Files modified:** src/app/api/search/selca/route.ts
- **Verification:** "더보기" 버튼 표시 안 됨, 무한 로딩 없음
- **Committed in:** 743d72d

---

**Total deviations:** 2 auto-fixed (both bugs)
**Impact on plan:** 두 버그 모두 기능 정상 작동에 필수적. 타임아웃과 무한 로딩 없이 검색 가능.

## Issues Encountered

None - 계획대로 순조롭게 진행

## Next Phase Readiness

- Bias 기반 selca 검색 완료
- 타임아웃 문제 완전 해결
- 페이지네이션은 향후 필요 시 구현 가능 (첫 페이지 20개로 충분)
- Phase 28 완료

---
*Phase: 28-selca-search-ux*
*Completed: 2026-01-16*
