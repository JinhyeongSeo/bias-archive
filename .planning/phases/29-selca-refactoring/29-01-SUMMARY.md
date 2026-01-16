---
phase: 29-selca-refactoring
plan: 01
subsystem: api
tags: [selca, typescript, refactoring, types]

requires:
  - phase: 27-selca-external-search
    provides: selca 검색 API 기본 구현
  - phase: 28-selca-search-ux
    provides: selca_slug 기반 검색, Bias 매칭
provides:
  - 공통 selca 타입 파일 (src/lib/selca-types.ts)
  - fetchHtmlFromSelca 공유 함수
  - 중복 코드 제거 및 타입 통합
affects: [30-selca-infinite-scroll]

tech-stack:
  added: []
  patterns:
    - "Re-export types for backwards compatibility"
    - "Shared utility function export"

key-files:
  created:
    - src/lib/selca-types.ts
  modified:
    - src/lib/parsers/selca.ts
    - src/app/api/search/selca/route.ts
    - src/components/LinkCard.tsx
    - src/components/LinkForm.tsx
    - src/app/globals.css
    - src/types/database.ts
    - src/app/api/biases/batch/route.ts

key-decisions:
  - "타입 파일 분리: selca-types.ts로 공통 타입 통합"
  - "fetchHtmlFromSelca export: 검색 API에서 재사용"
  - "searchMembers @deprecated: 타임아웃 문제로 권장하지 않음"

patterns-established:
  - "공통 타입은 별도 파일로 분리하여 import 경로 명확화"

issues-created: []

duration: 9min
completed: 2026-01-16
---

# Phase 29 Plan 01: Selca Refactoring Summary

**selca 관련 코드 리팩토링 완료 - 공통 타입 통합, 중복 코드 제거, 누락된 플랫폼 타입 수정**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-16T06:40:10Z
- **Completed:** 2026-01-16T06:49:29Z
- **Tasks:** 5
- **Files modified:** 8

## Accomplishments

- 공통 타입 파일 생성 (src/lib/selca-types.ts) - KpopGroup, KpopMember, SelcaSearchResult 등
- selca.ts 리팩토링: 타입 import, fetchHtmlFromSelca export, 캐시 초기화 수정
- selca 검색 API 리팩토링: fetchHtml 재사용, SLUG_PATTERN 상수화
- selca 플랫폼 타입 누락 수정: LinkCard, LinkForm, database.ts, globals.css

## Task Commits

1. **Task 1: 공통 타입 파일 생성** - `4755570` (feat)
2. **Task 2: selca.ts 리팩토링** - `4d93197` (refactor)
3. **Task 3: selca 검색 API 리팩토링** - `981db3e` (refactor)
4. **Task 4: 타입 및 스타일 수정** - `3689e12` (fix)
5. **Task 5: ESLint 수정** - `44ab91a` (chore)

## Files Created/Modified

- `src/lib/selca-types.ts` - 신규: 공통 selca 타입 정의 (110 lines)
- `src/lib/parsers/selca.ts` - 리팩토링: 타입 import, fetchHtmlFromSelca export
- `src/app/api/search/selca/route.ts` - 리팩토링: fetchHtml 재사용, SLUG_PATTERN
- `src/components/LinkCard.tsx` - 수정: selca 플랫폼 추가
- `src/components/LinkForm.tsx` - 수정: CSS 변수 사용으로 통일
- `src/app/globals.css` - 수정: --selca, --color-selca 추가
- `src/types/database.ts` - 수정: selca, kgirls-issue 플랫폼 타입 추가
- `src/app/api/biases/batch/route.ts` - 수정: ESLint prefer-const

## Decisions Made

1. **타입 분리 방식**: selca-types.ts로 공통 타입 통합, selca.ts에서 re-export로 하위 호환성 유지
2. **searchMembers 유지**: @deprecated 태그 추가, BiasManager에서 개별 멤버 검색 시 사용 가능성 있어 제거하지 않음
3. **fetchHtmlFromSelca 공유**: selca.ts에서 export하여 검색 API에서 재사용
4. **idolsCache 제거**: fetchAllIdols와 함께 Phase 28-01 실패 후 미사용

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] selca 플랫폼 타입 누락 수정**
- **Found during:** Task 4 (타입 import 업데이트)
- **Issue:** Phase 27에서 selca 플랫폼 추가 시 LinkCard, database.ts 등에 타입 누락
- **Fix:** platformLabels, platformColors에 selca 추가, CSS 변수 추가, database.ts 타입 수정
- **Files modified:** LinkCard.tsx, LinkForm.tsx, globals.css, database.ts
- **Verification:** npm run build 성공, tsc --noEmit 통과
- **Committed in:** 3689e12

**2. [Rule 1 - Bug] kgirls-issue 플랫폼 타입 누락**
- **Found during:** Task 4
- **Issue:** database.ts에 kgirls-issue 플랫폼 타입 없음
- **Fix:** search_cache, user_search_viewed 테이블에 kgirls-issue 타입 추가
- **Files modified:** database.ts
- **Committed in:** 3689e12

**3. [Rule 3 - Blocking] ESLint prefer-const 에러**
- **Found during:** Task 5 (코드 검증)
- **Issue:** biases/batch/route.ts에서 let 사용 (재할당 없음)
- **Fix:** let → const 변경
- **Committed in:** 44ab91a

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** 모두 기존 코드 품질 이슈 수정. 리팩토링 범위 확장 없음.

## Issues Encountered

None - 리팩토링 과정에서 발견된 타입 이슈들은 모두 auto-fix로 해결

## Next Phase Readiness

- selca 코드 정리 완료
- 타입 시스템 일관성 확보
- Phase 30 (Selca Infinite Scroll) 준비 완료

---
*Phase: 29-selca-refactoring*
*Completed: 2026-01-16*
