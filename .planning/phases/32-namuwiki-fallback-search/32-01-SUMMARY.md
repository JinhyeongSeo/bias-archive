---
phase: 32-namuwiki-fallback-search
plan: 01
subsystem: api
tags: [namuwiki, kpop, parser, fallback, html-parsing]

# Dependency graph
requires:
  - phase: 22-selca-kpop-data
    provides: K-pop data source infrastructure (selca.ts, selca-types.ts)
provides:
  - namuwiki parser module for fallback K-pop data
  - selca → namuwiki fallback in /api/kpop/groups
  - namuwiki: prefix handling in /api/kpop/groups/[id]/members
  - UI source indicator (selca/namuwiki badge)
affects: [BiasManager, kpop-data]

# Tech tracking
tech-stack:
  added: []
  patterns: [selca-fallback-namuwiki, source-indicator-ui]

key-files:
  created:
    - src/lib/parsers/namuwiki.ts
  modified:
    - src/app/api/kpop/groups/route.ts
    - src/app/api/kpop/groups/[id]/members/route.ts
    - src/components/BiasManager.tsx

key-decisions:
  - "namuwiki: prefix로 그룹 ID 식별 (selca slug와 구분)"
  - "나무위키 멤버는 hasSelcaOwner=false (selca 검색 불가)"
  - "초록색 배지로 나무위키 출처 표시, 노란색 안내 메시지로 제한 사항 안내"

patterns-established:
  - "selca 먼저 검색 → 결과 없으면 namuwiki 폴백"
  - "source 필드로 데이터 출처 추적 ('selca' | 'namuwiki')"

issues-created: []

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 32 Plan 01: Namuwiki Fallback Search Summary

**selca.kastden.org에 없는 아이돌 그룹을 나무위키에서 폴백 검색하여 멤버 목록 자동 추출**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T00:29:22Z
- **Completed:** 2026-01-19T00:33:42Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- 나무위키 파서 모듈 생성 (테이블/리스트 기반 멤버 추출)
- K-pop API에 selca → namuwiki 폴백 로직 통합
- BiasManager UI에 출처 배지 및 제한 안내 메시지 추가

## Task Commits

Each task was committed atomically:

1. **Task 1: 나무위키 파서 모듈 생성** - `d6b9cb4` (feat)
2. **Task 2: API 라우트에 나무위키 폴백 통합** - `089a97a` (feat)
3. **Task 3: BiasManager UI에 출처 표시 및 안내** - `edfeec7` (feat)

**Plan metadata:** (pending) (docs: complete plan)

## Files Created/Modified

- `src/lib/parsers/namuwiki.ts` - 나무위키 파서 모듈 (searchGroupFromNamuwiki, getGroupMembersFromNamuwiki)
- `src/app/api/kpop/groups/route.ts` - 그룹 검색 API에 namuwiki 폴백 추가
- `src/app/api/kpop/groups/[id]/members/route.ts` - namuwiki: 접두사 처리, source 필드 추가
- `src/components/BiasManager.tsx` - 출처 배지(초록/보라), 안내 메시지(노란색) UI

## Decisions Made

- **namuwiki: 접두사**: 그룹 ID에 `namuwiki:그룹명` 형식 사용하여 selca slug와 구분
- **hasSelcaOwner=false**: 나무위키 멤버는 selca 검색 불가하므로 false 설정
- **UI 출처 표시**: 초록색 배지로 나무위키 출처 명시, 노란색 안내로 제한 사항 고지
- **10분 캐시**: 인메모리 캐시로 나무위키 요청 최소화

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Phase 32 완료, 마일스톤 완료 가능
- 나무위키 폴백으로 신규/마이너 그룹도 그룹명 입력만으로 멤버 자동 추가 가능
- selca에 없는 그룹도 나무위키에서 멤버 정보 제공

---
*Phase: 32-namuwiki-fallback-search*
*Completed: 2026-01-19*
