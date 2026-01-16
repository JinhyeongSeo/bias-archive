# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-13)

**Core value:** 링크 정리가 핵심. URL을 넣으면 메타데이터를 자동 추출하고 태그를 붙여 깔끔하게 저장되는 것.
**Current focus:** Phase 31-01 완료 - heye/kgirls/kgirls-issue 외부 검색 페이지네이션 수정
**Production URL:** https://bias-archive-flax.vercel.app

## Current Position

Phase: 31 of 31 (External Search Pagination)
Plan: 1 of 1 completed
Status: Complete
Last activity: 2026-01-16 — Completed 31-01-PLAN.md

Progress: ████████████████████████████ 100% (31/31 phases complete)

**Milestone Complete!**

## Performance Metrics

**Velocity:**

- Total plans completed: 47
- Average duration: ~8 min
- Total execution time: ~372 min

**By Phase:**

| Phase                             | Plans | Total   | Avg/Plan |
| --------------------------------- | ----- | ------- | -------- |
| 1. Foundation                     | 3     | 17 min  | 6 min    |
| 2. Link Management                | 3     | 67 min  | 22 min   |
| 3. Tagging & Multi-Bias           | 3     | ~15 min | 5 min    |
| 4. Search & Filter                | 2     | ~14 min | 7 min    |
| 5. Viewer & Timeline              | 5     | ~25 min | 5 min    |
| 6. GIF & Export                   | 3     | ~15 min | 5 min    |
| 7. Deploy & PWA                   | 2     | ~13 min | 7 min    |
| 8. heye.kr Parser                 | 2     | ~40 min | 20 min   |
| 9. kgirls.net Parser              | 2     | ~10 min | 5 min    |
| 10. Idol Group Auto-Fill          | 2     | ~25 min | 13 min   |
| 11. Bias Schema Extension         | 1     | 4 min   | 4 min    |
| 12. Language Toggle UI            | 1     | 3 min   | 3 min    |
| 13. Enhanced Tag Matching         | 1     | 1 min   | 1 min    |
| 14. Tag Multilingual Display      | 1     | 5 min   | 5 min    |
| 15. Group-Based Bias Organization | 2     | ~10 min | 5 min    |
| 16. Drag & Drop Reorder           | 2     | ~10 min | 5 min    |
| 17. External Media Proxy          | 2     | ~14 min | 7 min    |

| 18. Footer Contact | 1 | 4 min | 4 min |
| 19. Bias UI Improvements | 1 | 3 min | 3 min |
| 20. Authentication | 3 | ~45 min | 15 min |
| 21. Design Overhaul | 5 | ~45 min | 9 min |
| 22. Selca K-pop Data | 2 | ~10 min | 5 min |
| 23. Unified Search UX | 1 | ~8 min | 8 min |
| 24. Group Deletion | 1 | ~5 min | 5 min |
| 25. UI Fixes | 1 | ~1 min | 1 min |
| 26. Bias List UX Fixes | 1 | ~5 min | 5 min |
| 27. Selca External Search | 1 | ~30 min | 30 min |
| 28. Selca Search UX | 2 | ~11 min | 6 min |
| 29. Selca Refactoring | 1 | 9 min | 9 min |
| 30. Selca Infinite Scroll | 1 | 5 min | 5 min |
| 31. External Search Pagination | 1 | 2 min | 2 min |

**Recent Trend:**

- Last 5 plans: 28-02 (~11m), 29-01 (9m), 30-01 (5m), 31-01 (2m)
- Trend: Phase 31-01 완료! heye/kgirls/kgirls-issue 외부 검색 페이지네이션 수정.

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
- groups 테이블로 최애 그룹 관리, biases.group_id FK로 연결
- getOrCreateGroup 패턴으로 중복 없이 그룹 자동 생성
- wsrv.nl로 이미지 프록시 (heye.kr, kgirls.net 핫링크 우회)
- Cloudflare Workers로 비디오 프록시 (video-proxy.jh4clover.workers.dev)
- Supabase Auth + @supabase/ssr로 SSR 호환 인증 구현
- RLS 정책으로 사용자별 데이터 분리
- 미들웨어에서 세션 자동 새로고침 (next-intl과 통합)
- API 라우트에서 인증 체크 및 user_id 자동 할당
- selca.kastden.org HTML 파싱으로 K-pop 데이터 실시간 조회 (kpopnet.json 대체)
- selca 검색 API 미작동으로 전체 목록 캐싱 후 필터링 방식 사용
- node-html-parser로 HTML 파싱 (서버사이드)
- 통합검색 커스텀 드롭다운 (그룹별 접기/펼치기, 그룹 선택 지원)
- onBiasChange 콜백으로 BiasManager 변경 시 통합검색 드롭다운 실시간 갱신
- DB FK의 ON DELETE SET NULL 활용으로 그룹 삭제 시 최애는 유지 (group_id만 NULL)
- 새 bias/group 추가 시 sort_order를 max+1로 자동 설정 (목록 맨 아래에 추가)
- onBiasReordered를 handleBiasChange에 연결하여 그룹 순서 변경 시 통합검색 실시간 반영
- biases 테이블에 selca_slug 저장 (selca.kastden.org 아이돌 slug)
- Bias 매칭 우선, selca_slug 사용으로 즉시 검색 (타임아웃 없음)
- selca API에서 slug 형식 감지, searchMembers 호출 건너뛰기
- selca 공통 타입 파일 분리 (src/lib/selca-types.ts)
- fetchHtmlFromSelca 함수 공유 (selca.ts에서 export)
- searchMembers @deprecated (타임아웃 문제, Bias.selca_slug 사용 권장)
- selca max_time_id 기반 페이지네이션 (단방향, 다음 페이지만 가능)
- extractMediaId로 미디어 ID 추출 (/original/, /thumb/ 패턴)
- heye/kgirls/kgirls-issue 외부 검색: 캐시의 currentPage를 우선 사용하여 다음 페이지 계산

### Roadmap Evolution

- Phase 9 added: kgirls.net Parser (issue, mgall 게시판 지원) ✓
- Phase 10 added: Idol Group Member Auto-Fill (그룹명 입력 시 멤버 자동 추가) ✓
- Milestone v1.1 created: Multilingual Mode, 3 phases (Phase 11-13)
- Phase 14 added: Tag Multilingual Display (UAT-002 해결)
- Milestone v1.2 created: Group Organization (Phase 15)
- Phase 15 added: Group-Based Bias Organization (그룹별 최애 분류)
- Phase 16 added: Drag & Drop Reorder (태그/최애 순서 드래그 변경)
- Phase 17 (old) removed: heye.kr iframe Embed (기술적 제약으로 스킵)
- Phase 17 added: External Media Proxy (이미지는 wsrv.nl, 비디오는 Cloudflare Workers)
- Phase 18 added: Footer Contact (연락처 정보 Footer 추가)
- Phase 20 added: Authentication (사용자 로그인/회원가입 기능)
- Phase 21 added: Design Overhaul (토스 스타일 애니메이션, 트렌디한 디자인 전면 개편)
- Phase 21-05 확장: 모바일 최적화, 이름 언어 auto 고정, 라이트 모드 색상 수정 추가
- Phase 22 added: Selca K-pop Data (selca.kastden.org에서 최신 아이돌 데이터 가져오기) ✓
- Phase 23 added: Unified Search UX Improvements (통합검색 아이돌 선택 UI 개선) ✓
- Phase 24 added: Group Deletion (BiasManager에서 그룹 전체 삭제 기능) ✓
- Phase 25 added: UI Fixes (태그 구분선 간격 & 내보내기 통계 0/0/0 버그) ✓
- Phase 26 added: Bias List UX Fixes (그룹 순서 실시간 반영 & 추가 위치 수정) ✓
- Phase 27 added: Selca External Search (selca.kastden.org 외부 검색 플랫폼 추가) ✓
- Phase 28 added: Selca Search UX (Bias 기반 즉시 검색, selca_slug 저장) ✓
- Phase 29 added: Selca Refactoring (selca 관련 코드 리팩토링, 꼬인 로직 정리) ✓
- Phase 30 added: Selca Infinite Scroll (selca.kastden.org 무한 스크롤 페이지네이션 구현) ✓
- Phase 31 added: External Search Pagination (heye, kgirls, kgirls-issue 외부 검색 페이지네이션) ✓

### Deferred Issues

- ~~Twitter 다중 이미지 저장 → Phase 5 link_media 테이블에서 처리~~ ✓ (05-01에서 해결)

### Pending Todos

None.

### In Progress

- [통합검색 Twitter 검색 결과에 HTML 태그 포함되는 버그](.planning/todos/done/2026-01-16-twitter-search-malformed-url-storage.md) (Area: api)

### Completed (Recently)

- [Fix database loading issue for links and groups](.planning/todos/done/2026-01-14-fix-db-loading-issue.md) (Area: database)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-16
Stopped at: Phase 31-01 completed (heye/kgirls/kgirls-issue 외부 검색 페이지네이션)
Resume file: None

**Next recommended action:** 마일스톤 완료 또는 새 기능 추가
