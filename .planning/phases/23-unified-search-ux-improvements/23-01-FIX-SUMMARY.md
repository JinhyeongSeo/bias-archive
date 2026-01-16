---
phase: 23-unified-search-ux-improvements
plan: 01-FIX
subsystem: ui
tags: [dropdown, locale, search, ux]

requires:
  - phase: 23
    provides: Custom idol dropdown with group collapse
provides:
  - Locale-aware group name display
  - Korean surname removal for better search
  - Default collapsed groups
  - Sorted group display
  - Enhanced member indentation
  - Fixed dropdown overflow

key-files:
  modified: [src/components/UnifiedSearch.tsx]

key-decisions:
  - "Use locale to determine group name language (ko/en)"
  - "Remove Korean surname (first character) for idol search queries"
  - "Initialize all groups as collapsed when dropdown opens"
  - "Add visual hierarchy with border-left and bullet markers"

issues-created: []

duration: 8min
completed: 2026-01-16
---

# Phase 23 Plan 01-FIX: Unified Search UAT Fixes Summary

**6개 UAT 이슈 수정 완료 - 언어별 그룹명 표시, 성 제거 검색, 그룹 접기 기본값, 순서 정렬, 들여쓰기 강화, overflow 처리**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-01-16T13:00:00Z
- **Completed:** 2026-01-16T13:08:00Z
- **Tasks:** 6
- **Files modified:** 1

## Accomplishments

- UAT-002 (Major): 그룹명이 언어 모드에 맞게 단일 언어로 표시 및 검색
- UAT-005 (Major): 한국 아이돌 검색 시 성 제거 (예: "장원영" → "원영")
- UAT-001 (Minor): 드롭다운 열면 그룹이 기본 접힌 상태로 시작
- UAT-003 (Minor): 그룹이 sort_order 순서대로 정렬
- UAT-004 (Cosmetic): 멤버 들여쓰기 강화 및 시각적 계층 구조 추가
- UAT-006 (Minor): 드롭다운 높이 축소로 모달 내 완전 표시

## Task Commits

1. **Task 1: Fix UAT-002** - `b800c6b` (fix) - 언어 모드에 따른 그룹명 표시
2. **Task 2: Fix UAT-005** - `56d2f3c` (fix) - 아이돌 검색 시 성 제거
3. **Task 3: Fix UAT-001** - `88a4e7d` (fix) - 그룹 기본 접힌 상태로 시작
4. **Task 4: Fix UAT-003** - `5dab2b8` (fix) - 그룹 순서 정렬
5. **Task 5: Fix UAT-004** - `465eed3` (fix) - 멤버 들여쓰기 강화
6. **Task 6: Fix UAT-006** - `485c2be` (fix) - 드롭다운 overflow 처리

## Files Created/Modified

- `src/components/UnifiedSearch.tsx` - 6개 UAT 이슈 수정

## Decisions Made

- `useLocale()`로 현재 언어 모드 가져와 그룹명 표시에 적용
- 한글 이름(2-4자)인 경우 첫 글자(성) 제거하여 검색 효율 향상
- 드롭다운 열릴 때 모든 그룹 ID를 collapsedDropdownGroups에 추가
- groups 배열을 sort_order로 정렬 후 Map에 순서대로 추가
- border-l-2와 bullet marker로 시각적 계층 구조 강화
- max-h-64 → max-h-48로 축소하여 모달 내 완전 표시

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Step

Ready for re-verification with /gsd:verify-work 23-01

---
*Phase: 23-unified-search-ux-improvements*
*Plan: 01-FIX*
*Completed: 2026-01-16*
