# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-13)

**Core value:** 링크 정리가 핵심. URL을 넣으면 메타데이터를 자동 추출하고 태그를 붙여 깔끔하게 저장되는 것.
**Current focus:** Milestone 1 Complete — 모든 9개 Phase 완료
**Production URL:** https://bias-archive-flax.vercel.app

## Current Position

Phase: 9 of 9 (kgirls.net Parser)
Plan: 2/2 complete
Status: Complete
Last activity: 2026-01-14 — Phase 9 완료

Progress: ██████████ 100% (9/9 phases complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 25
- Average duration: ~8 min
- Total execution time: ~216 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3 | 17 min | 6 min |
| 2. Link Management | 3 | 67 min | 22 min |
| 3. Tagging & Multi-Bias | 3 | ~15 min | 5 min |
| 4. Search & Filter | 2 | ~14 min | 7 min |
| 5. Viewer & Timeline | 5 | ~25 min | 5 min |
| 6. GIF & Export | 3 | ~15 min | 5 min |
| 7. Deploy & PWA | 2 | ~13 min | 7 min |
| 8. heye.kr Parser | 2 | ~40 min | 20 min |
| 9. kgirls.net Parser | 2 | ~10 min | 5 min |

**Recent Trend:**

- Last 5 plans: 07-02 (5m), 08-01 (28m), 08-02 (12m), 09-01 (5m), 09-02 (5m)
- Trend: kgirls.net은 heye.kr 패턴 재사용으로 빠르게 구현

## Accumulated Context

### Decisions

- npm 사용 (pnpm 미설치)
- Supabase CLI로 migration 관리 (`npx supabase db push`)
- next-themes로 다크모드 구현
- open-graph-scraper로 일반/Weverse 메타데이터 추출
- YouTube는 oEmbed API 사용 (Shorts URL 자동 변환)
- Twitter/X는 vxtwitter API 사용 (oEmbed 대신)
- Supabase 타입에 Relationships 등 추가 (호환성)
- refreshTrigger 패턴으로 목록 새로고침
- YouTube Data API로 실시간 검색 (외부 검색)
- Google CSE로 Twitter 과거 인기 트윗 검색 (API v2 무료 불가)
- 외부 검색을 Sidebar 대신 모달로 표시 (레이아웃 개선)
- 검색어를 태그 추출 힌트로 활용 (searchQuery param)
- FFmpeg.wasm 브라우저 GIF 생성 (로컬 비디오 변환)
- next-intl 기반 다국어 지원 (ko/en, [locale] 라우팅)
- Vercel Hobby Plan (무료) 배포
- 수동 PWA 설정 (next-pwa 없이, Next.js 16 호환)
- heye.kr 커스텀 파서 추가 (OG 메타데이터 없음, HTML 파싱)
- kgirls.net 파서 추가 (XE CMS 기반, /files/ 경로 미디어 추출)

### Roadmap Evolution

- Phase 9 added: kgirls.net Parser (issue, mgall 게시판 지원) ✓

### Deferred Issues

- ~~Twitter 다중 이미지 저장 → Phase 5 link_media 테이블에서 처리~~ ✓ (05-01에서 해결)

### Pending Todos

None - Milestone 1 완료

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-14
Stopped at: Milestone 1 완료 - 모든 핵심 기능 구현됨
Resume file: None
