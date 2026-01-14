---
phase: 12-language-toggle-ui
plan: 01
subsystem: ui
tags: [next-intl, context, i18n, react]

# Dependency graph
requires:
  - phase: 11-bias-schema-extension
    provides: biases.name_en/name_ko nullable columns
provides:
  - NameLanguageContext for app-wide name language state
  - NameLanguageToggle UI component
  - getDisplayName helper for bias display
affects: [13-enhanced-tag-matching]

# Tech tracking
tech-stack:
  added: []
  patterns: [Context + localStorage persistence pattern for user preferences]

key-files:
  created:
    - src/contexts/NameLanguageContext.tsx
    - src/components/NameLanguageToggle.tsx
  modified:
    - src/components/Providers.tsx
    - src/components/Header.tsx
    - src/components/BiasManager.tsx
    - messages/ko.json
    - messages/en.json

key-decisions:
  - "UI locale (next-intl)과 이름 표시 언어를 독립적으로 관리"
  - "auto 모드는 UI locale을 따라감"

patterns-established:
  - "NameLanguageContext: Context + localStorage + useLocale 조합 패턴"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-14
---

# Phase 12 Plan 01: Language Toggle UI Summary

**NameLanguageContext로 앱 전역 이름 표시 언어(EN/KO/Auto) 토글 구현, BiasManager에서 언어별 최애 이름 표시**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-14T00:41:09Z
- **Completed:** 2026-01-14T00:43:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- NameLanguageContext 생성 (en/ko/auto 모드, localStorage 저장)
- NameLanguageToggle 컴포넌트 (segmented button UI)
- Header에 토글 추가, BiasManager에서 언어별 이름 표시

## Task Commits

Each task was committed atomically:

1. **Task 1: NameLanguageContext 및 NameLanguageToggle 생성** - `580583a` (feat)
2. **Task 2: Header에 NameLanguageToggle 추가 및 표시 적용** - `3025cad` (feat)

## Files Created/Modified

- `src/contexts/NameLanguageContext.tsx` - 이름 표시 언어 Context (en/ko/auto)
- `src/components/NameLanguageToggle.tsx` - 토글 UI 컴포넌트
- `src/components/Providers.tsx` - NameLanguageProvider 추가
- `src/components/Header.tsx` - 헤더에 토글 추가
- `src/components/BiasManager.tsx` - getDisplayName으로 언어별 이름 표시
- `messages/ko.json` - header.nameLanguage, header.nameLanguageAuto 키 추가
- `messages/en.json` - header.nameLanguage, header.nameLanguageAuto 키 추가

## Decisions Made

- UI locale (next-intl)과 이름 표시 언어를 독립적으로 관리하기로 결정
- auto 모드는 현재 UI locale (ko/en)에 따라 name_ko/name_en을 선택

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Phase 12 완료, Phase 13 (Enhanced Tag Matching) 준비 완료
- 태그 매칭 시 영어/한글 양방향 인식을 위한 autoTag 로직 확장 필요

---
*Phase: 12-language-toggle-ui*
*Completed: 2026-01-14*
