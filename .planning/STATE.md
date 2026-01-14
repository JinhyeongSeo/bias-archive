# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-13)

**Core value:** 링크 정리가 핵심. URL을 넣으면 메타데이터를 자동 추출하고 태그를 붙여 깔끔하게 저장되는 것.
**Current focus:** v1.1 Multilingual Mode 완료!
**Production URL:** https://bias-archive-flax.vercel.app

## Current Position

Phase: 13 of 13 (Enhanced Tag Matching)
Plan: 1 of 1 in current phase
Status: Milestone complete
Last activity: 2026-01-14 — Completed 13-01-PLAN.md

Progress: █████████████ 100% (13/13 phases complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 28
- Average duration: ~8 min
- Total execution time: ~224 min

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
| 10. Idol Group Auto-Fill | 2 | ~25 min | 13 min |
| 11. Bias Schema Extension | 1 | 4 min | 4 min |
| 12. Language Toggle UI | 1 | 3 min | 3 min |
| 13. Enhanced Tag Matching | 1 | 1 min | 1 min |

**Recent Trend:**

- Last 5 plans: 10-01 (10m), 10-02 (15m), 11-01 (4m), 12-01 (3m), 13-01 (1m)
- Trend: v1.1 phases 매우 빠르게 완료 (스키마/UI 확장)

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
- kpopnet.json 패키지로 아이돌 그룹/멤버 데이터 연동
- 그룹 일괄 추가 시 한글 이름(name_original) 저장 (태그 매칭 용이)
- biases 테이블에 name_en/name_ko nullable 컬럼 추가 (다국어 지원)
- 기존 name 필드 유지 (표시용, 하위 호환성)
- NameLanguageContext로 이름 표시 언어 관리 (UI locale과 독립적)
- auto 모드는 UI locale에 따라 name_en/name_ko 선택
- autoTag 양방향 매칭: name, name_en, name_ko 세 필드 모두 검색

### Roadmap Evolution

- Phase 9 added: kgirls.net Parser (issue, mgall 게시판 지원) ✓
- Phase 10 added: Idol Group Member Auto-Fill (그룹명 입력 시 멤버 자동 추가) ✓
- Milestone v1.1 created: Multilingual Mode, 3 phases (Phase 11-13)

### Deferred Issues

- ~~Twitter 다중 이미지 저장 → Phase 5 link_media 테이블에서 처리~~ ✓ (05-01에서 해결)

### Pending Todos

None - v1.1 Multilingual Mode 완료!

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-14
Stopped at: Completed Phase 13 (Enhanced Tag Matching) - v1.1 Milestone complete!
Resume file: None
