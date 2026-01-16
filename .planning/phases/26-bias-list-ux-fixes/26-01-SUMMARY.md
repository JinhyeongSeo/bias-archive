---
phase: 26-bias-list-ux-fixes
plan: 01
subsystem: ui
tags: [sort_order, bias, group, unified-search, ux]

# Dependency graph
requires:
  - phase: 16-drag-drop-reorder
    provides: sort_order 컬럼 및 드래그 앤 드롭 순서 변경 기능
  - phase: 23-unified-search-ux
    provides: onBiasChange 콜백을 통한 통합검색 실시간 갱신 메커니즘
provides:
  - 새 bias/group 추가 시 목록 맨 아래에 추가 (sort_order max+1 자동 설정)
  - 그룹 순서 변경 시 통합검색 드롭다운에 즉시 반영
affects: [bias-management, unified-search]

# Tech tracking
tech-stack:
  added: []
  patterns: [max sort_order 조회 패턴, onBiasReordered 콜백 연결]

key-files:
  created: []
  modified:
    - src/app/api/biases/route.ts
    - src/app/api/biases/batch/route.ts
    - src/app/api/groups/route.ts
    - src/components/Sidebar.tsx

key-decisions:
  - "새 항목 추가 시 max(sort_order) + 1 값으로 자동 설정하여 목록 맨 아래 표시"
  - "BiasManager의 onBiasReordered를 Sidebar의 handleBiasChange에 연결하여 통합검색 갱신"

patterns-established:
  - "sort_order 조회 패턴: order by sort_order DESC nullsFirst:false limit 1 maybeSingle()"
  - "배치 추가 시 순차적 sort_order 할당: nextSortOrder + index"

issues-created: []

# Metrics
duration: 1min
completed: 2026-01-16
---

# Phase 26 Plan 01: Bias List UX Fixes Summary

**새 bias/group은 목록 맨 아래에 추가, 그룹 순서 변경은 통합검색에 즉시 반영하는 UX 개선**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-16T08:06:38Z
- **Completed:** 2026-01-16T08:08:06Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- 새 bias/group 추가 시 sort_order를 max+1로 자동 설정하여 목록 맨 아래 추가
- BiasManager에서 그룹 순서 변경 시 통합검색 드롭다운에 실시간 반영
- 직관적인 UX: 새 항목은 아래에, 순서 변경은 즉시 동기화

## Task Commits

Each task was committed atomically:

1. **Task 1: API - 새 bias/group 추가 시 sort_order를 max+1로 설정** - `da0247f` (feat)
2. **Task 2: Sidebar - onBiasReordered를 onBiasChange에 연결** - `8a8a0db` (feat)

## Files Created/Modified

- `src/app/api/biases/route.ts` - POST 시 max sort_order 조회 후 +1 값 할당
- `src/app/api/biases/batch/route.ts` - 배치 추가 시 순차적으로 sort_order 할당 (nextSortOrder + index)
- `src/app/api/groups/route.ts` - POST 시 max sort_order 조회 후 +1 값 할당
- `src/components/Sidebar.tsx` - BiasManager의 onBiasReordered prop에 handleBiasChange 전달

## Decisions Made

1. **Max sort_order 패턴**: 새 항목 추가 시 `order by sort_order DESC nullsFirst:false limit 1 maybeSingle()`로 최대값 조회 후 +1 설정
2. **배치 추가 순서**: 배치로 여러 멤버 추가 시 `nextSortOrder + index`로 순차 할당하여 추가 순서 보장
3. **onBiasReordered 연결**: Sidebar에서 BiasManager의 onBiasReordered를 handleBiasChange에 연결하여 통합검색 갱신 자동화

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

Phase 26 complete. All plans finished.

---
*Phase: 26-bias-list-ux-fixes*
*Completed: 2026-01-16*
