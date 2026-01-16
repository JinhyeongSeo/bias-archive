---
phase: 27-selca-external-search
plan: 01
subsystem: search
tags: [selca, external-search, node-html-parser, pagination]

requires:
  - phase: 22-namuwiki-idol-data
    provides: selca.kastden.org parser module
  - phase: 04-search-filter
    provides: ExternalSearch component pattern
provides:
  - selca.kastden.org keyword search in external search modal
  - Pagination support for selca search results
  - Idol-specific media content discovery
affects: []

tech-stack:
  added: []
  patterns: [idol-based media search, selca platform integration]

key-files:
  created: [src/app/api/search/selca/route.ts]
  modified: [src/lib/parsers/index.ts, src/components/ExternalSearch.tsx, src/components/LinkForm.tsx, src/components/Timeline.tsx]

key-decisions:
  - "아이돌 개인 페이지 기반 검색 (키워드로 아이돌 찾기 → 개인 페이지 미디어 파싱)"
  - "보라색 테마로 selca 플랫폼 구분"
  - "max_time_id 파라미터로 페이지네이션 구현 (hasNextPage 플래그 사용)"

patterns-established:
  - "아이돌 검색 → 개인 페이지 미디어 목록 파싱 패턴"

issues-created: []

duration: ~30 minutes
completed: 2026-01-16
---

# Phase 27 Plan 1: Selca External Search Summary

**selca.kastden.org 외부 검색 통합 - K-pop 전문 셀카/영상 콘텐츠 검색 기능**

## Performance

- **Duration:** ~30 minutes
- **Started:** 2026-01-16
- **Completed:** 2026-01-16
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- selca.kastden.org 검색 API 생성 (/api/search/selca)
- ExternalSearch에 selca 탭 추가 (보라색 테마)
- 아이돌별 미디어 검색 및 저장 기능
- 페이지네이션 UI 구현 (hasNextPage 기반)
- selca 플랫폼 색상 추가 (LinkForm, Timeline)
- Platform 타입에 'selca' 추가

## Task Commits

1. **Task 1: selca 검색 API 라우트 생성** - (commit hash) (feat)
2. **Task 2: ExternalSearch selca 탭 추가** - (commit hash) (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified

- `src/app/api/search/selca/route.ts` - selca.kastden.org 검색 API (node-html-parser)
- `src/lib/parsers/index.ts` - Platform 타입에 'selca' 추가
- `src/components/ExternalSearch.tsx` - selca 탭, 페이지네이션 상태/UI, 보라색 테마
- `src/components/LinkForm.tsx` - selca 플랫폼 색상 및 레이블 추가
- `src/components/Timeline.tsx` - selca 플랫폼 색상 추가

## Decisions Made

- **아이돌 개인 페이지 기반**: selca.kastden.org는 검색 엔드포인트가 없으므로, 키워드로 아이돌을 찾은 뒤 개인 페이지(/owner/[slug]/)에서 미디어 목록 파싱
- **보라색 테마**: selca 플랫폼 구분을 위해 보라색 배지 및 버튼 스타일 적용 (bg-purple-100/bg-purple-500)
- **hasNextPage 기반 페이지네이션**: "Next page" 링크 존재 여부로 다음 페이지 존재 판단 (max_time_id는 향후 개선 가능)

## Deviations from Plan

- **Simplified pagination**: 원래 계획에서는 max_time_id 파라미터를 직접 추출하여 사용하려 했으나, 현재는 간단한 hasNextPage 플래그만 사용. 실제 max_time_id 기반 페이지네이션은 향후 개선 가능.
- **Caption extraction simplified**: selca.kastden.org의 캡션 추출이 제한적이므로, 캡션이 없을 경우 "{아이돌이름} 미디어" 형식으로 폴백.

## Issues Encountered

- None - implementation went smoothly

## Next Phase Readiness

- Phase 27 complete - selca.kastden.org 외부 검색 기능 완성
- 전체 로드맵 완료 (27/27 phases)
- 모든 주요 외부 검색 플랫폼 통합 완료 (YouTube, Twitter, heye.kr, kgirls.net, selca.kastden.org)

---
*Phase: 27-selca-external-search*
*Completed: 2026-01-16*
