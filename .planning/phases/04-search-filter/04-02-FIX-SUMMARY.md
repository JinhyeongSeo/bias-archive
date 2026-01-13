---
phase: 04-search-filter
plan: 02-FIX
subsystem: ui
tags: [react, modal, auto-tag, external-search]

# Dependency graph
requires:
  - phase: 04-02
    provides: ExternalSearch component, auto-tagging system
provides:
  - Modal-based external search with proper layout
  - Search query as tag extraction hint
affects: [05-viewer-timeline]

# Tech tracking
tech-stack:
  added: []
  patterns: [modal-state-management, prop-drilling-for-hints]

key-files:
  created: []
  modified:
    - src/components/ExternalSearch.tsx
    - src/components/Sidebar.tsx
    - src/app/page.tsx
    - src/lib/autoTag.ts
    - src/app/api/links/route.ts

key-decisions:
  - "External search as modal instead of inline sidebar component"
  - "Pass searchQuery to API as tag extraction hint"
  - "Reset modal state on close and platform switch"

patterns-established:
  - "Modal pattern: isOpen/onClose props with ESC key support"
  - "State reset on modal close for clean UX"

issues-created: []

# Metrics
duration: 5min
completed: 2026-01-13
---

# Phase 4 Plan 2 FIX: UAT Issues Summary

**외부 검색을 모달로 변경하고 검색어 기반 태그 힌트 추가**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-13T07:39:27Z
- **Completed:** 2026-01-13T07:44:34Z
- **Tasks:** 2 (+ 1 checkpoint)
- **Files modified:** 5

## Issues Fixed

### UAT-001: 외부 검색 결과 영역이 너무 좁아 레이아웃 깨짐 (Major)

**Solution:** ExternalSearch를 Sidebar 내부(240px)에서 화면 중앙 모달(max-w-2xl, 672px)로 변경

- 모달 배경 오버레이 및 닫기 버튼 추가
- ESC 키로 닫기 지원
- 썸네일 크기 확대 (w-32 h-20)
- 전체적인 여백 및 폰트 크기 개선

### UAT-002: Twitter 검색 결과 저장 시 자동 태그 미적용 (Minor)

**Solution:** 검색어를 태그 추출 힌트로 활용

- POST /api/links에 searchQuery 파라미터 추가
- combineTextForTagExtraction 함수에 searchQuery 포함
- 검색어에 멤버명이 있으면 자동 태그 매칭

### 추가 수정: 모달 상태 관리 개선

**Discovered during testing:** 검색 결과가 탭 전환/모달 닫기 시에도 유지되는 버그

- 모달 닫을 때 query, results, error 상태 초기화
- 플랫폼 전환 시 검색 결과 초기화

## Task Commits

Each task was committed atomically:

1. **Task 1: External search to modal** - `ebf0614` (fix)
2. **Task 3: Tag hint + state management** - `ed690ce` (fix)

**Plan metadata:** (this commit) (docs: complete FIX plan)

## Files Created/Modified

- `src/components/ExternalSearch.tsx` - Modal 형태로 전환, 상태 관리 개선
- `src/components/Sidebar.tsx` - ExternalSearch 제거, 버튼으로 변경
- `src/app/page.tsx` - ExternalSearch 모달 상태 관리 추가
- `src/lib/autoTag.ts` - combineTextForTagExtraction에 searchQuery 파라미터 추가
- `src/app/api/links/route.ts` - POST에서 searchQuery 파라미터 처리

## Decisions Made

- Modal max-width를 672px(max-w-2xl)로 설정 - 데스크톱에서 충분한 공간 확보
- 모달 닫을 때 검색 상태 완전 초기화 - 매번 깨끗한 상태로 시작
- 플랫폼 전환 시 결과 초기화 - 플랫폼별 검색 결과 혼동 방지

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 모달 상태 유지 버그 수정**

- **Found during:** Checkpoint 검증 중 사용자 피드백
- **Issue:** 탭 전환/모달 닫기 시에도 이전 검색 결과가 유지됨
- **Fix:** useEffect에서 isOpen=false 시 상태 초기화, handlePlatformChange 함수 추가
- **Files modified:** src/components/ExternalSearch.tsx
- **Verification:** 모달 닫기/탭 전환 시 결과 초기화 확인
- **Committed in:** ed690ce (Task 3과 함께)

---

**Total deviations:** 1 auto-fixed (bug)
**Impact on plan:** 사용자 테스트 중 발견된 UX 버그 즉시 수정. 계획 범위 내.

## Issues Encountered

None - plan executed smoothly with one additional bug fix discovered during checkpoint.

## Next Phase Readiness

- UAT-001, UAT-002 모두 해결됨
- Phase 4 (Search & Filter) 완전 완료
- Phase 5 (Viewer & Timeline) 진행 준비 완료

---
*Phase: 04-search-filter*
*Plan: 02-FIX*
*Completed: 2026-01-13*
