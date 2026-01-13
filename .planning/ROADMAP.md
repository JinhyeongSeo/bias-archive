# Roadmap: 내 최애 아카이브

## Overview

여러 플랫폼에 흩어진 직캠과 사진 링크를 태그별로 정리하는 개인 미디어 큐레이션 웹앱. 프로젝트 셋업부터 시작해 핵심인 링크 저장 기능을 구축하고, 태그/검색/뷰어/GIF 기능을 순차적으로 추가한다.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Next.js + Supabase 프로젝트 셋업, DB 스키마, 기본 UI ✓
- [x] **Phase 2: Link Management** - URL 입력, 메타데이터 자동 추출, 저장 (핵심) ✓
- [x] **Phase 3: Tagging & Multi-Bias** - 자동 태그 추출, 여러 최애 지원 ✓
- [x] **Phase 4: Search & Filter** - 아카이브 검색, 태그 필터링, 통합 검색 ✓
- [x] **Phase 5: Viewer & Timeline** - 임베드 뷰어, 레이아웃 전환, 과거의 오늘 ✓
- [x] **Phase 6: GIF & Export** - 브라우저 GIF 생성, JSON 내보내기, 다국어 ✓
- [x] **Phase 7: Deploy & PWA** - Vercel 배포 + PWA(앱처럼 설치 가능) 지원 ✓
- [x] **Phase 8: heye.kr Parser** - heye.kr 커뮤니티 게시판에서 이미지/GIF 추출 ✓
- [ ] **Phase 9: kgirls.net Parser** - kgirls.net 커뮤니티(issue, mgall)에서 이미지/GIF/MP4 추출

## Phase Details

### Phase 1: Foundation
**Goal**: Next.js 프로젝트 초기화, Supabase 연동, DB 스키마 설계, 기본 UI 레이아웃
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established patterns)
**Plans**: TBD

Plans:
- [x] 01-01: Next.js 프로젝트 생성 및 기본 설정
- [x] 01-02: Supabase 연동 및 DB 스키마 생성
- [x] 01-03: 기본 UI 레이아웃 및 네비게이션

### Phase 2: Link Management
**Goal**: URL 입력 시 메타데이터 자동 추출 및 저장 — 앱의 핵심 기능
**Depends on**: Phase 1
**Research**: Complete (DISCOVERY.md)
**Research topics**: YouTube/Twitter oEmbed API, URL 메타데이터 추출 방법, Open Graph 파싱
**Plans**: 3

Plans:
- [x] 02-01: URL 입력 폼 및 메타데이터 추출 API
- [x] 02-02: 링크 저장 CRUD 및 목록 UI
- [x] 02-03: 플랫폼별 파서 모듈화 및 고도화

### Phase 3: Tagging & Multi-Bias
**Goal**: 제목/설명에서 멤버명 자동 추출, 여러 최애 관리, 태그 시스템
**Depends on**: Phase 2
**Research**: Unlikely (internal text processing)
**Plans**: TBD

Plans:
- [x] 03-01: 최애(bias) 관리 CRUD
- [x] 03-02: 자동 태그 추출 로직
- [x] 03-03: 수동 태그 편집 UI

### Phase 4: Search & Filter
**Goal**: 저장된 아카이브 검색/필터링 + YouTube 통합 검색
**Depends on**: Phase 3
**Research**: Complete (DISCOVERY.md)
**Research topics**: YouTube Data API 검색 (무료 가능), Twitter API v2 (무료 불가 → 제외)
**Plans**: 2

Plans:
- [x] 04-01: 아카이브 검색 및 태그 필터링
- [x] 04-02: YouTube 통합 검색

### Phase 5: Viewer & Timeline
**Goal**: 임베드 플레이어, 그리드/리스트 전환, '과거의 오늘' 타임라인, 태그별 앨범, YouTube 검색 필터
**Depends on**: Phase 4
**Research**: Unlikely (embed players, internal patterns)
**Plans**: 5

Plans:
- [x] 05-01: 다중 미디어 저장 (link_media 테이블, Twitter 여러 이미지) ✓
- [x] 05-02: YouTube 검색 필터 (기간/정렬) ✓
- [x] 05-03: 임베드 뷰어 (YouTube, Twitter) ✓
- [x] 05-04: 갤러리 & 레이아웃 (그리드/리스트 전환, 태그별 앨범) ✓
- [x] 05-05: '과거의 오늘' 타임라인 기능 ✓

### Phase 6: GIF & Export
**Goal**: 브라우저 GIF 생성기, JSON 내보내기, 한/영 다국어 지원
**Depends on**: Phase 5
**Research**: Likely (new library)
**Research topics**: FFmpeg.wasm 사용법, 브라우저 비디오 프로세싱, WebAssembly 성능
**Plans**: TBD

Plans:
- [x] 06-01: FFmpeg.wasm 기반 GIF 생성기 ✓
- [x] 06-02: JSON 내보내기/가져오기 ✓
- [x] 06-03: 다국어(i18n) 지원 ✓

### Phase 7: Deploy & PWA

**Goal**: Vercel 배포 + PWA(앱처럼 설치 가능) 지원
**Depends on**: Phase 6
**Research**: Unlikely (established patterns)
**Plans**: 2

Plans:

- [x] 07-01: Vercel 배포 및 환경 변수 설정 ✓
- [x] 07-02: PWA manifest, 아이콘, 서비스 워커 설정 ✓

### Phase 8: heye.kr Parser

**Goal**: heye.kr 커뮤니티 게시판에서 이미지/GIF 추출하여 아카이브에 저장
**Depends on**: Phase 7 (완료됨)
**Research**: Complete (분석 완료)
**Plans**: 2

**분석 결과:**
- 게시글 본문: `#div_content` selector
- 이미지 URL 패턴: `https://img1.heye.kr/image/idol/2026/01/[timestamp].jpeg`
- Open Graph 메타데이터: 없음 (커스텀 파싱 필요)
- 제목: `<title>` 태그에서 추출
- 날짜: "등록일: YY-MM-DD" 패턴
- 작성자: 레벨 아이콘 옆 텍스트
- 검색 파라미터: `sfl=wr_subject&stx=검색어`

Plans:
- [x] 08-01: heye.kr 파서 모듈 및 플랫폼 통합 ✓
- [x] 08-02: heye.kr 검색 기능 (외부 검색 모달에 추가) ✓

### Phase 9: kgirls.net Parser

**Goal**: kgirls.net 커뮤니티(issue, mgall 게시판)에서 이미지/GIF/MP4 추출하여 아카이브에 저장
**Depends on**: Phase 8 (완료됨)
**Research**: Complete (분석 완료)
**Plans**: TBD

**분석 결과:**
- 사이트: 윤아저장소 KGIRLS.NET (K-pop 아이돌 팬 갤러리)
- 게시판: `/issue` (볼거리), `/mgall` (마이너갤)
- 게시글 URL 패턴: `/mgall/{POST_ID}`, `/issue/{POST_ID}`
- 본문 영역: `.bd` selector
- 썸네일 URL: `/files/thumbnails/{num}/{num}/{dimensions}.fill.jpg?t={timestamp}`
- 첨부파일: `#files_{POST_ID}` selector (MP4, MOV 등)
- 제목: `<h2>` 태그
- 메타정보: 작성자, 날짜(YYYY.MM.DD HH:MM), 조회수, 추천수
- XE CMS 기반

Plans:
- [ ] 09-01: kgirls.net 파서 모듈 및 플랫폼 통합
- [ ] 09-02: kgirls.net 검색 기능 (외부 검색 모달에 추가)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-13 |
| 2. Link Management | 3/3 | Complete | 2026-01-13 |
| 3. Tagging & Multi-Bias | 3/3 | Complete | 2026-01-13 |
| 4. Search & Filter | 2/2 | Complete | 2026-01-13 |
| 5. Viewer & Timeline | 5/5 | Complete | 2026-01-13 |
| 6. GIF & Export | 3/3 | Complete | 2026-01-13 |
| 7. Deploy & PWA | 2/2 | Complete | 2026-01-13 |
| 8. heye.kr Parser | 2/2 | Complete | 2026-01-14 |
| 9. kgirls.net Parser | 0/2 | Not Started | - |
