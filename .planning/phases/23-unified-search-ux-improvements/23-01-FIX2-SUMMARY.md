---
phase: 23-unified-search-ux-improvements
plan: 01-FIX2
subsystem: ui
tags: [dropdown, korean-name, search, ux]

requires:
  - phase: 23
    provides: Custom idol dropdown with group collapse
provides:
  - Expanded dropdown height for better UX
  - Smart Korean surname detection for search queries

key-files:
  modified: [src/components/UnifiedSearch.tsx]

key-decisions:
  - "Use Korean surname list + 3-char check for real name detection"
  - "Expand dropdown height from 192px to 320px"

issues-created: []

duration: 5min
completed: 2026-01-16
---

# Phase 23 Plan 01-FIX2: Unified Search UAT Fixes (Round 2) Summary

**드롭다운 높이 확장 및 한국 실명 성씨 판별 로직으로 검색 정확도 개선**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-01-16T14:00:00Z
- **Completed:** 2026-01-16T14:05:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- UAT-007 (Major): 드롭다운 높이 192px → 320px로 확장
- UAT-008 (Major): 한국 성씨 목록 기반 실명 판별 로직 구현

## Task Commits

1. **Task 1 & 2: UAT-007, UAT-008** - `2b2c635` (fix)

## Files Created/Modified

- `src/components/UnifiedSearch.tsx` - 드롭다운 높이 및 성 제거 로직 개선

## Decisions Made

- 드롭다운 max-height를 max-h-48 (192px) → max-h-80 (320px)로 확장
- 한국 상위 100개 성씨 목록을 Set으로 정의
- 성 제거 조건: 정확히 3글자 한글 + 첫 글자가 한국 성씨
- 예명(윈터, 카리나)은 전체 이름 유지, 실명(장원영, 안유진)만 성 제거

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Step

Ready for re-verification with /gsd:verify-work 23-01

---
*Phase: 23-unified-search-ux-improvements*
*Plan: 01-FIX2*
*Completed: 2026-01-16*
