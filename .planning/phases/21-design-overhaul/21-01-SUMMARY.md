---
phase: 21-design-overhaul
plan: 01
subsystem: ui
tags: [framer-motion, animation, css, design-system]

# Dependency graph
requires: []
provides:
  - framer-motion animation library
  - Toss-style animation primitives (transitions, variants)
  - Toss-style color CSS variables
affects: [21-02, 21-03, 21-04, 21-05]

# Tech tracking
tech-stack:
  added: [framer-motion@12.26.2]
  patterns: [animation-variants, spring-transitions, css-variables-for-tailwind]

key-files:
  created: [src/lib/animations.ts]
  modified: [src/app/globals.css, package.json]

key-decisions:
  - "Spring 기반 트랜지션 우선 (토스 스타일의 자연스러운 물리 기반 모션)"
  - "3단계 스프링: quick(버튼), basic(카드), smooth(모달)"
  - "기존 zinc 팔레트 유지하면서 toss-blue 액센트만 추가"

patterns-established:
  - "animation variants import: import { fadeIn, quickSpring } from '@/lib/animations'"
  - "Tailwind에서 토스 컬러: bg-toss-blue, text-toss-blue-dark"

issues-created: []

# Metrics
duration: 2min
completed: 2026-01-14
---

# Phase 21 Plan 01: Animation Foundation Summary

**framer-motion 설치 및 토스 스타일 애니메이션 primitives 라이브러리 구축, CSS 컬러 변수 추가**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-14T08:02:22Z
- **Completed:** 2026-01-14T08:04:08Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- framer-motion v12.26.2 설치 완료
- 재사용 가능한 애니메이션 primitives 라이브러리 생성 (transitions, variants, stagger, modal animations)
- 토스 스타일 블루 컬러 CSS 변수 추가 (라이트/다크 모드 대응)
- Tailwind에서 사용 가능하도록 @theme inline에 컬러 등록

## Task Commits

Each task was committed atomically:

1. **Task 1: Install framer-motion** - `09972f9` (chore)
2. **Task 2: Create animation primitives library** - `e00cdf1` (feat)
3. **Task 3: Update globals.css with Toss-style colors** - `40585fb` (style)

## Files Created/Modified

- `src/lib/animations.ts` - 토스 스타일 애니메이션 상수/variants (transitions, fadeIn, scaleIn, slideUp, stagger, modal, press/hover effects)
- `src/app/globals.css` - 토스 블루 CSS 변수 추가 (--toss-blue, --toss-blue-light, --toss-blue-dark)
- `package.json` - framer-motion 의존성 추가

## Decisions Made

- Spring 기반 트랜지션을 기본으로 채택 (duration 대신 물리 기반 모션)
- 3단계 스프링 설정: quickSpring(버튼), basicSpring(카드), smoothSpring(모달)
- 기존 zinc 팔레트는 유지하고 토스 블루 액센트만 추가

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- 애니메이션 primitives 준비 완료, 다음 플랜에서 버튼/카드 컴포넌트에 적용 가능
- CSS 컬러 변수 준비 완료, Tailwind 클래스로 바로 사용 가능

---
*Phase: 21-design-overhaul*
*Completed: 2026-01-14*
