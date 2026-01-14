---
phase: 19-bias-ui-improvements
plan: 01
subsystem: ui
tags: [react, kpop, autocomplete, tailwind]

# Dependency graph
requires:
  - phase: 10-idol-group-autofill
    provides: kpop-data.ts, kpopnet.json integration
provides:
  - BiasManager 버튼 레이아웃 수정 (세로 배치, 줄바꿈 방지)
  - 멤버 검색 API (/api/kpop/members)
  - 개인 최애 추가 시 멤버 자동완성 기능
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 멤버 자동완성 패턴 (300ms 디바운스, 드롭다운 선택)

key-files:
  created:
    - src/app/api/kpop/members/route.ts
  modified:
    - src/components/BiasManager.tsx
    - src/lib/kpop-data.ts

key-decisions:
  - "버튼 세로 배치 (flex-col gap-1)로 줄바꿈 문제 해결"
  - "멤버 선택 시 한글 이름을 name과 nameKo에, 영어 이름을 nameEn에 자동 채움"
  - "그룹 정보도 함께 자동 채움"

patterns-established:
  - "멤버 자동완성 패턴: 이름 입력 → 300ms 디바운스 → API 검색 → 드롭다운 표시 → 선택 시 필드 자동 채움"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-14
---

# Phase 19 Plan 01: Bias UI Improvements Summary

**BiasManager UI 버튼 레이아웃 수정 및 개인 멤버 자동완성 기능 추가**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-14T06:15:56Z
- **Completed:** 2026-01-14T06:19:02Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- "최애 추가" / "그룹으로 추가" 버튼 세로 배치로 텍스트 줄바꿈 문제 해결
- kpopnet 데이터에서 아이돌 멤버 검색 API 추가
- 개인 최애 추가 시 이름 입력하면 자동완성 드롭다운으로 멤버 검색 가능
- 멤버 선택 시 영어 이름, 한글 이름, 그룹명 모두 자동 채움

## Task Commits

Each task was committed atomically:

1. **Task 1: 버튼 레이아웃 수정** - `3a7a4b7` (style)
2. **Task 2: kpopnet 멤버 검색 API 추가** - `43753d4` (feat)
3. **Task 3: 최애 추가 폼에 멤버 자동완성 추가** - `4120b06` (feat)

## Files Created/Modified

- `src/app/api/kpop/members/route.ts` - 멤버 검색 API 엔드포인트
- `src/lib/kpop-data.ts` - searchMembers 함수 및 KpopMemberWithGroup 타입 추가
- `src/components/BiasManager.tsx` - 버튼 레이아웃 수정, 멤버 자동완성 UI 추가

## Decisions Made

- 버튼 배치: `flex gap-2` (가로) → `flex flex-col gap-1` (세로)로 변경하여 좁은 사이드바에서도 텍스트 줄바꿈 없이 표시
- 멤버 자동완성: 기존 그룹 검색 드롭다운 패턴 재활용 (300ms 디바운스, 드롭다운, 클릭 외부 닫기)
- 필드 매핑: name=한글, nameEn=영어, nameKo=한글, groupName=그룹 한글명

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Phase 19 마지막 플랜 완료
- 전체 프로젝트 마일스톤 완료

---
*Phase: 19-bias-ui-improvements*
*Completed: 2026-01-14*
