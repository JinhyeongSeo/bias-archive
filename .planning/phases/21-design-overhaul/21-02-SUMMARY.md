---
phase: 21-design-overhaul
plan: 02
subsystem: ui
tags: [framer-motion, animation, micro-interaction, layout]

# Dependency graph
requires: [21-01]
provides:
  - Animated Header with press/hover effects
  - Animated Sidebar buttons and tag chips
  - Animated LinkForm with preview slide-up
affects: [21-03, 21-04, 21-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [motion-component-wrapping, AnimatePresence-for-conditional, motion.create-for-nextjs-link]

key-files:
  created: []
  modified: [src/components/Header.tsx, src/components/Sidebar.tsx, src/components/LinkForm.tsx]

key-decisions:
  - "motion.create(Link) 패턴으로 Next.js Link에 애니메이션 적용"
  - "버튼별 scale 차등 적용: 큰 버튼 0.97, 작은 칩 0.95"
  - "AnimatePresence로 조건부 렌더링 요소에 enter/exit 애니메이션 지원"

patterns-established:
  - "MotionLink = motion.create(Link) 패턴으로 Next.js Link 래핑"
  - "AnimatePresence + variants로 조건부 UI 애니메이션"
  - "quickSpring으로 버튼, basicSpring으로 콘텐츠 전환"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-14
---

# Phase 21 Plan 02: Core Layout Animation Summary

**Header, Sidebar, LinkForm 핵심 레이아웃 컴포넌트에 토스 스타일 마이크로인터랙션 적용**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-14
- **Completed:** 2026-01-14
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Header 로고/네비게이션에 hover/press 스케일 애니메이션 적용
- Sidebar 모든 버튼(외부검색, 플랫폼필터, 태그칩, 데이터관리)에 press 효과 추가
- LinkForm 미리보기 카드에 slideUp 애니메이션, 에러 메시지에 fadeIn 추가
- 모든 버튼에 일관된 press 피드백 효과 적용

## Task Commits

Each task was committed atomically:

1. **Task 1: Animate Header navigation and toggles** - `1b82a12` (feat)
2. **Task 2: Animate Sidebar buttons and tag chips** - `9ac6878` (feat)
3. **Task 3: Animate LinkForm preview appearance** - `feb1721` (feat)

## Files Modified

- `src/components/Header.tsx` - motion.create(Link) 래핑, 로고 hover/press, GIF 링크 press 효과
- `src/components/Sidebar.tsx` - motion.button으로 교체, 외부검색/플랫폼필터/태그/데이터관리 버튼 press 효과
- `src/components/LinkForm.tsx` - AnimatePresence로 미리보기 slideUp, 에러 fadeIn, 버튼 press 효과

## Technical Details

### Header Animation
- 로고: whileHover scale 1.02, whileTap scale 0.98
- GIF 링크: whileTap scale 0.95 + 배경색 전환

### Sidebar Animation
- 외부 검색 버튼: whileTap scale 0.97
- 플랫폼 필터/태그 칩: whileTap scale 0.95
- 데이터 관리 버튼: whileTap scale 0.97

### LinkForm Animation
- 미리보기 컨테이너: slideUp variants + AnimatePresence
- 에러 메시지: fadeIn variants + AnimatePresence
- 모든 버튼: whileTap scale 0.97

## Decisions Made

- Next.js Link에는 motion.create(Link) 패턴 사용 (motion() deprecated)
- 큰 버튼(검색, 데이터관리, 저장)은 0.97, 작은 칩(태그, 플랫폼)은 0.95 스케일 적용
- AnimatePresence로 조건부 렌더링 요소 래핑하여 exit 애니메이션 지원

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Verification

- [x] Header 버튼 press 효과 동작
- [x] Sidebar 태그 버튼 press 효과 동작
- [x] LinkForm 미리보기 slideUp 애니메이션 동작
- [x] npm run build 성공

## Next Phase Readiness

- 레이아웃 컴포넌트 애니메이션 완료
- 다음 플랜(21-03)에서 LinkCard와 Modal 컴포넌트 애니메이션 적용 가능

---
*Phase: 21-design-overhaul*
*Completed: 2026-01-14*
