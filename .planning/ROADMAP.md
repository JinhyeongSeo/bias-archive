# Roadmap: 내 최애 아카이브

## Overview

여러 플랫폼에 흩어진 직캠과 사진 링크를 태그별로 정리하는 개인 미디어 큐레이션 웹앱. 프로젝트 셋업부터 시작해 핵심인 링크 저장 기능을 구축하고, 태그/검색/뷰어/GIF 기능을 순차적으로 추가한다.

## Domain Expertise

None

## Milestones

- ✅ **v1.0 MVP** - Phases 1-10 (shipped 2026-01-14)
- ✅ **v1.1 Multilingual Mode** - Phases 11-14 (shipped 2026-01-14)
- ✅ **v1.2 Group Organization** - Phase 15 (shipped 2026-01-14)
- ✅ **v1.3 External Media Proxy** - Phases 16-17 (shipped 2026-01-14)

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
- [x] **Phase 9: kgirls.net Parser** - kgirls.net 커뮤니티(issue, mgall)에서 이미지/GIF/MP4 추출 ✓
- [x] **Phase 10: Idol Group Member Auto-Fill** - 그룹 이름 입력 시 멤버들의 영어/한글 이름 자동 추가 ✓
- [x] **Phase 11: Bias Schema Extension** - biases 테이블에 name_en/name_ko 필드 추가 ✓
- [x] **Phase 12: Language Toggle UI** - 언어 모드 토글 및 표시 전환 ✓
- [x] **Phase 13: Enhanced Tag Matching** - 영어/한글 양방향 태그 인식 ✓
- [x] **Phase 14: Tag Multilingual Display** - 언어 모드에 따른 태그 표시 전환 ✓
- [x] **Phase 15: Group-Based Bias Organization** - 그룹 테이블 추가, 최애를 그룹별로 분류/표시 ✓
- [x] **Phase 16: Drag & Drop Reorder** - 태그/최애 순서를 드래그로 변경 ✓
- [x] **Phase 17: External Media Proxy** - 핫링크 보호 미디어 외부 프록시 전환 ✓
- [x] **Phase 18: Footer Contact** - 연락처 정보가 담긴 Footer 컴포넌트 추가 ✓
- [x] **Phase 19: Bias UI Improvements** - 버튼 레이아웃 수정 및 멤버 자동완성 ✓
- [ ] **Phase 20: Authentication** - 사용자 로그인/회원가입 기능

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
- [x] 09-01: kgirls.net 파서 모듈 및 플랫폼 통합 ✓
- [x] 09-02: kgirls.net 검색 기능 (외부 검색 모달에 추가) ✓

### Phase 10: Idol Group Member Auto-Fill

**Goal**: 아이돌 그룹 이름 입력 시 해당 그룹 멤버들의 영어/한글 이름을 자동으로 최애 목록에 추가
**Depends on**: Phase 9 (완료됨)
**Research**: Likely (아이돌 그룹/멤버 데이터 소스 필요)
**Plans**: TBD

**기능 설명:**
- 그룹 이름 입력 시 자동완성 제안 (예: "IVE", "아이브")
- 그룹 선택 시 모든 멤버의 한글명/영어명이 최애 목록에 일괄 추가
- 아이돌 그룹/멤버 데이터베이스 또는 API 연동 필요

Plans:
- [x] 10-01: K-pop 데이터 통합 (kpopnet.json 패키지, 그룹 검색 API) ✓
- [x] 10-02: 그룹 자동완성 UI (멤버 미리보기, 일괄 추가) ✓

### ✅ v1.1 Multilingual Mode (Complete)

**Milestone Goal:** 최애 이름을 영어/한글 둘 다 저장하고, 언어 모드에 따라 표시하며, 태그 매칭도 양방향으로 지원

#### Phase 11: Bias Schema Extension ✓

**Goal**: biases 테이블에 name_en/name_ko 필드 추가, 기존 데이터 마이그레이션
**Depends on**: Phase 10 (완료됨)
**Research**: Unlikely (Supabase migration 패턴 확립됨)
**Plans**: 1

Plans:
- [x] 11-01: DB 스키마 확장, API 업데이트, UI 다국어 이름 입력 ✓

#### Phase 12: Language Toggle UI ✓

**Goal**: 앱 전역 언어 모드 토글, 최애 목록/태그 표시를 현재 언어로 전환
**Depends on**: Phase 11
**Research**: Unlikely (next-themes 패턴 활용 가능)
**Plans**: 1

Plans:
- [x] 12-01: NameLanguageContext, NameLanguageToggle, BiasManager 언어별 표시 ✓

#### Phase 13: Enhanced Tag Matching

**Goal**: 영어 또는 한글 이름 어느 쪽으로 태그해도 매칭되도록 autoTag 로직 확장
**Depends on**: Phase 12
**Research**: Unlikely (내부 로직 확장)
**Plans**: 1

Plans:
- [x] 13-01: autoTag 양방향 매칭 (영어/한글 어느 쪽으로든 태그 인식) ✓

#### Phase 14: Tag Multilingual Display

**Goal**: 언어 모드에 따라 태그를 해당 언어(name_en/name_ko)로 표시
**Depends on**: Phase 13
**Research**: Unlikely (내부 로직 확장)
**Plans**: TBD

**기능 설명:**

- 영어 모드: 태그가 "Sullyoon"으로 표시
- 한글 모드: 태그가 "설윤"으로 표시
- 태그 저장은 기존대로 유지, 표시만 언어 모드에 따라 변환

Plans:
- [x] 14-01: getTagDisplayName 헬퍼 및 컴포넌트 적용 ✓

### Phase 15: Group-Based Bias Organization ✓

**Goal**: groups 테이블 추가, 최애를 그룹별로 분류하여 표시, 그룹 일괄 추가 시 그룹 정보도 저장
**Depends on**: Phase 14
**Research**: Unlikely (내부 스키마 확장)
**Plans**: 2

**기능 설명:**

- `groups` 테이블 생성: id, name, name_en, name_ko
- `biases` 테이블에 group_id FK 추가
- BiasManager에서 그룹별로 접어서/펼쳐서 표시
- 그룹 일괄 추가 시 그룹 레코드도 함께 생성
- 태그 필터에서 그룹별 분류 지원

Plans:
- [x] 15-01: Groups Schema & API (groups 테이블, group_id FK, CRUD API) ✓
- [x] 15-02: Group-Based UI (BiasManager 그룹별 분류, Sidebar 태그 그룹화) ✓

### Phase 16: Drag & Drop Reorder

**Goal**: 태그와 최애의 순서를 드래그 앤 드롭으로 변경할 수 있는 기능
**Depends on**: Phase 15
**Research**: Likely (드래그 앤 드롭 라이브러리 선택)
**Plans**: TBD

**기능 설명:**

- 최애 목록에서 순서 드래그로 변경
- 태그 필터에서 태그 순서 드래그로 변경
- 순서 정보 DB에 저장 (sort_order 컬럼)
- 모바일 터치 드래그 지원

Plans:
- [x] 16-01: Schema & API (sort_order 컬럼, reorder API) ✓
- [x] 16-02: Drag & Drop UI (BiasManager 드래그 앤 드롭) ✓

### Phase 17: External Media Proxy ✓

**Goal**: 핫링크 보호된 미디어(heye.kr, kgirls.net)를 외부 무료 프록시로 전환
**Depends on**: Phase 16
**Research**: Complete (조사 완료)
**Plans**: 2

**조사 결과:**

- wsrv.nl: 무료 이미지 캐시 & 리사이즈 서비스 (BSD 3-Clause)
  - Cloudflare 300+ 데이터센터 글로벌 캐싱
  - 사용법: `https://wsrv.nl/?url=이미지URL`
  - 시간당 600만 이미지 처리, 월 400TB 트래픽
- Cloudflare Workers: 무료 서버리스 함수
  - 하루 100,000 요청, 분당 1,000 요청
  - 비디오 프록시용으로 활용 (비영리 개인 프로젝트)

**기능 설명:**

- 이미지: wsrv.nl 프록시로 전환
- 비디오(MP4, MOV 등): Cloudflare Workers 프록시 배포
- 기존 `/api/proxy/image` API 대체
- Vercel 서버리스 함수 부하 감소

Plans:
- [x] 17-01: wsrv.nl 이미지 프록시 적용 ✓
- [x] 17-02: Cloudflare Worker 비디오 프록시 배포 ✓

### Phase 18: Footer Contact

**Goal**: 연락처 정보(이메일, SNS 등)가 담긴 Footer 컴포넌트 추가
**Depends on**: Phase 17
**Research**: Unlikely (UI 컴포넌트)
**Plans**: TBD

**기능 설명:**

- 페이지 하단에 고정 Footer 표시
- 연락처 정보: 이메일, GitHub, Twitter/X 등
- 반응형 디자인 (모바일/데스크톱)
- 다크모드 지원

Plans:
- [x] 18-01: Footer 컴포넌트 및 연락처 정보 ✓

### Phase 19: Bias UI Improvements

**Goal**: BiasManager UI 개선 및 개인 멤버 자동완성 기능 추가
**Depends on**: Phase 18
**Research**: Unlikely (UI 개선)
**Plans**: 1

**기능 설명:**

- "최애 추가" / "그룹으로 추가" 버튼 텍스트 줄바꿈 수정
- 개인 멤버명 입력 시 kpopnet 데이터에서 그룹 정보 자동 연결
- 멤버 자동완성 드롭다운 UI

Plans:

- [x] 19-01: 버튼 레이아웃 수정 및 멤버 자동완성 기능 ✓

### Phase 20: Authentication

**Goal**: 사용자 로그인/회원가입 기능 추가
**Depends on**: Phase 19
**Research**: Likely (Supabase Auth 패턴)
**Plans**: TBD

**기능 설명:**

- Supabase Auth를 활용한 사용자 인증
- 이메일/비밀번호 로그인 및 회원가입
- 소셜 로그인 (Google, GitHub 등) 옵션
- 로그인 상태에 따른 UI 분기
- 사용자별 데이터 분리 (RLS 정책)

Plans:

- [ ] TBD (run /gsd:plan-phase 20 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → ... → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-01-13 |
| 2. Link Management | v1.0 | 3/3 | Complete | 2026-01-13 |
| 3. Tagging & Multi-Bias | v1.0 | 3/3 | Complete | 2026-01-13 |
| 4. Search & Filter | v1.0 | 2/2 | Complete | 2026-01-13 |
| 5. Viewer & Timeline | v1.0 | 5/5 | Complete | 2026-01-13 |
| 6. GIF & Export | v1.0 | 3/3 | Complete | 2026-01-13 |
| 7. Deploy & PWA | v1.0 | 2/2 | Complete | 2026-01-13 |
| 8. heye.kr Parser | v1.0 | 2/2 | Complete | 2026-01-14 |
| 9. kgirls.net Parser | v1.0 | 2/2 | Complete | 2026-01-14 |
| 10. Idol Group Auto-Fill | v1.0 | 2/2 | Complete | 2026-01-14 |
| 11. Bias Schema Extension | v1.1 | 1/1 | Complete | 2026-01-14 |
| 12. Language Toggle UI | v1.1 | 1/1 | Complete | 2026-01-14 |
| 13. Enhanced Tag Matching | v1.1 | 1/1 | Complete | 2026-01-14 |
| 14. Tag Multilingual Display | v1.1 | 1/1 | Complete | 2026-01-14 |
| 15. Group-Based Bias Organization | v1.2 | 2/2 | Complete | 2026-01-14 |
| 16. Drag & Drop Reorder | v1.3 | 2/2 | Complete | 2026-01-14 |
| 17. External Media Proxy | v1.3 | 2/2 | Complete | 2026-01-14 |
| 18. Footer Contact | - | 1/1 | Complete | 2026-01-14 |
| 19. Bias UI Improvements | - | 1/1 | Complete | 2026-01-14 |
| 20. Authentication | - | 0/0 | Not Started | - |
