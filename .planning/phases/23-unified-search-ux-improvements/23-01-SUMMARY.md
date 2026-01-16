---
phase: 23-unified-search-ux-improvements
plan: 01
subsystem: ui
tags: [dropdown, framer-motion, i18n, next-intl]

# Dependency graph
requires:
  - phase: 22-selca-kpop-data
    provides: K-pop idol data integration
provides:
  - Custom idol dropdown with group collapse
  - Group selection for search
  - i18n translations for unified search
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Custom dropdown with outside click detection
    - Group collapse/expand pattern for idol selection

key-files:
  created: []
  modified:
    - src/components/UnifiedSearch.tsx
    - src/components/Sidebar.tsx
    - src/app/[locale]/page.tsx
    - messages/ko.json
    - messages/en.json

key-decisions:
  - "Group selection searches with both Korean and English names"
  - "Individual idol selection uses Korean name for better results"

patterns-established:
  - "Custom dropdown with useRef + outside click detection"
  - "Group collapse state in dropdown (not persisted)"

issues-created: []

# Metrics
duration: 8min
completed: 2026-01-16
---

# Phase 23 Plan 01: Unified Search UX Improvements Summary

**커스텀 아이돌/그룹 선택 드롭다운 - 그룹별 접기/펼치기, 그룹 선택으로 검색 지원**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-16T01:00:00Z
- **Completed:** 2026-01-16T01:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- "내 최애 선택" 용어를 "아이돌 선택"으로 변경
- 네이티브 select를 커스텀 드롭다운으로 교체
- 그룹별 접기/펼치기 기능 구현
- 그룹 선택 시 "그룹한글명 그룹영어명" 형식으로 검색
- 번역 키 추가 (ko.json, en.json)

## Task Commits

Each task was committed atomically:

1. **Task 1: 용어 변경 및 번역 파일 업데이트** - `7fdedb1` (feat)
2. **Task 2: 커스텀 아이돌/그룹 선택 드롭다운 구현** - `0394fde` (feat)
3. **Fix: 실시간 드롭다운 갱신 콜백 추가** - `c34e3cd` (fix)

## Files Created/Modified

- `src/components/UnifiedSearch.tsx` - 커스텀 드롭다운 UI 구현
- `src/components/Sidebar.tsx` - onBiasChange 콜백 추가
- `src/app/[locale]/page.tsx` - onBiasChange 연결
- `messages/ko.json` - unifiedSearch 섹션 추가
- `messages/en.json` - unifiedSearch 섹션 추가

## Decisions Made

- 그룹 선택 시 `name_ko + name_en` 형식으로 검색어 설정 (더 나은 검색 결과)
- 드롭다운 접기 상태는 모달 닫힐 때 리셋 (localStorage 저장 불필요)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Step

Phase 23 complete! Ready for milestone completion.

---
*Phase: 23-unified-search-ux-improvements*
*Completed: 2026-01-16*
