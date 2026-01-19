---
phase: 35-instagram-search
plan: 01
subsystem: search
tags: [instagram, apify, api, parser, unified-search]

# Dependency graph
requires:
  - phase: 34
    provides: External search infrastructure patterns
provides:
  - Instagram URL parser with HTML meta tag extraction
  - Instagram search API via Apify integration
  - UnifiedSearch Instagram tab
  - LinkCard Instagram platform display
affects: [external-search, link-saving]

# Tech tracking
tech-stack:
  added: [apify-client]
  patterns: [third-party-scraper-api]

key-files:
  created:
    - src/lib/parsers/instagram.ts
    - src/app/api/search/instagram/route.ts
  modified:
    - src/lib/parsers/index.ts
    - src/lib/metadata.ts
    - src/components/UnifiedSearch.tsx
    - src/components/LinkCard.tsx
    - package.json

key-decisions:
  - "Apify Instagram Search Scraper for search (pay-per-result, ~2000 free/month)"
  - "HTML meta tag parsing for URL metadata (og:title, og:image)"
  - "No pagination in MVP (Apify returns limited results per call)"

patterns-established:
  - "Third-party scraper API integration pattern with notConfigured handling"

issues-created: []

# Metrics
duration: 6min
completed: 2026-01-19
---

# Phase 35 Plan 01: Instagram Search Summary

**Instagram URL 파서 및 Apify 기반 검색 API 구현, UnifiedSearch Instagram 탭 추가**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-19T06:48:57Z
- **Completed:** 2026-01-19T06:54:43Z
- **Tasks:** 4 (3 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments

- Instagram URL 파서 생성 (og:title, og:image HTML 메타태그 파싱)
- Apify Instagram Search Scraper 연동 API 라우트 구현
- UnifiedSearch에 Instagram 탭 추가 (핑크/보라색 그라데이션 테마)
- LinkCard에 Instagram 플랫폼 레이블 및 색상 추가

## Task Commits

Each task was committed atomically:

1. **Task 1: Instagram URL parser and platform integration** - `36f496f` (feat)
2. **Task 2: Apify Instagram search API and LinkCard platform** - `04db1f4` (feat)
3. **Task 3: Instagram tab in UnifiedSearch** - `ae05075` (feat)

**Plan metadata:** TBD (this commit)

## Files Created/Modified

- `src/lib/parsers/instagram.ts` - Instagram URL metadata parser (og:title, og:image extraction)
- `src/lib/parsers/index.ts` - Platform 타입에 'instagram' 추가
- `src/lib/metadata.ts` - Instagram 호스트 감지 및 파서 연결
- `src/app/api/search/instagram/route.ts` - Apify Instagram Search Scraper 연동 API
- `src/components/UnifiedSearch.tsx` - Instagram 탭 및 searchInstagram 함수 추가
- `src/components/LinkCard.tsx` - Instagram 플랫폼 레이블/색상 추가
- `package.json` - apify-client 패키지 추가

## Decisions Made

1. **Apify Instagram Search Scraper 선택** - 월 ~2000건 무료, 안정적인 서비스, Node.js 클라이언트 제공
2. **HTML 메타태그 파싱** - Instagram oEmbed API 제한(2025년 10월부터 thumbnail_url 제거)으로 og:* 태그 직접 파싱
3. **MVP에서 페이지네이션 미지원** - Apify 호출당 결과 제한, 추후 필요시 구현

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Instagram 검색 및 저장 기능 완료
- APIFY_API_TOKEN 환경 변수 필요 (미설정 시 "Instagram 검색이 설정되지 않았습니다" 메시지)
- Phase 35 완료, 추가 기능 요청 대기

---
*Phase: 35-instagram-search*
*Completed: 2026-01-19*
