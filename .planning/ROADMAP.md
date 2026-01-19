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
- [x] **Phase 20: Authentication** - 사용자 로그인/회원가입 기능 ✓
- [x] **Phase 21: Design Overhaul** - 토스 스타일 애니메이션 및 트렌디한 디자인 전면 개편 ✓
- [x] **Phase 22: Selca K-pop Data** - selca.kastden.org에서 최신 아이돌 데이터 가져오기 (kpopnet.json 대체) ✓
- [x] **Phase 23: Unified Search UX Improvements** - 통합검색 아이돌 선택 UI 개선 및 실시간 갱신 ✓
- [x] **Phase 24: Group Deletion** - BiasManager에서 그룹 전체 삭제 기능 추가 ✓
- [x] **Phase 25: UI Fixes** - 태그 구분선 간격 수정, 내보내기 통계 0/0/0 버그 수정 ✓
- [x] **Phase 26: Bias List UX Fixes** - 그룹 순서 변경 시 통합검색 실시간 반영, 최애/그룹 추가 시 아래에 추가 ✓
- [x] **Phase 27: Selca External Search** - selca.kastden.org 외부 검색 기능 추가 (셀카/영상 콘텐츠) ✓
- [x] **Phase 29: Selca Refactoring** - selca 관련 코드 리팩토링 (타입 통합, 중복 제거) ✓
- [x] **Phase 30: Selca Infinite Scroll** - selca.kastden.org 무한 스크롤 페이지네이션 구현 ✓
- [x] **Phase 31: External Search Pagination** - heye, kgirls, kgirls-issue 외부 검색 페이지네이션 (캐시 20개 제한 해결) ✓
- [x] **Phase 33: Unified Search Category Selection** - 통합 검색에서 카테고리별 선택 기능 추가 ✓
- [x] **Phase 34: Internet Archive Backup** - 링크 백업 및 폴백 시스템 (archive.org 연동) ✓
- [x] **Phase 35: Instagram Search** - Instagram 카테고리 추가 및 검색 기능 ✓
- [ ] **Phase 36: Search & Parser Refactoring** - 검색/파서 코드 리팩토링 및 버그 수정

Plans:

- [x] 33-01: 플랫폼별 선택 함수 및 UI 추가 ✓

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

- [x] 20-01: Auth Infrastructure (user_id 컬럼, RLS 정책, @supabase/ssr 설정) ✓
- [x] 20-02: Auth UI (AuthProvider, 로그인/회원가입 페이지, UserMenu) ✓
- [x] 20-03: Protected Routes & API (미들웨어 세션 관리, API 인증 체크) ✓

### Phase 21: Design Overhaul

**Goal**: 토스 스타일 애니메이션과 트렌디한 디자인으로 UI 전면 개편
**Depends on**: Phase 20
**Research**: Likely (토스 디자인 시스템 분석, 애니메이션 라이브러리 선택)
**Plans**: TBD

**기능 설명:**

- 토스 스타일 마이크로 인터랙션 (부드러운 전환, 스프링 애니메이션)
- 모던한 컬러 팔레트 및 타이포그래피
- 카드 기반 UI 레이아웃 개선
- 스켈레톤 로딩 및 부드러운 페이지 전환
- 모바일 퍼스트 반응형 디자인 강화
- 모바일 사이드바 접근성 개선
- 이름 언어 토글 제거 (auto 모드 고정)
- 라이트 모드 색상 개선

Plans:
- [x] 21-01: Animation Foundation (framer-motion, primitives, CSS 변수) ✓
- [x] 21-02: Button & Card Animation (LinkCard hover, press, stagger) ✓
- [x] 21-03: Modal Animation (ViewerModal scale+fade) ✓
- [x] 21-04: Sidebar Animation (tag buttons, skeleton loading) ✓
- [x] 21-05: Final Polish (모바일 최적화, 이름 언어 auto 고정, 라이트 모드 수정) ✓

### Phase 22: Selca K-pop Data

**Goal**: selca.kastden.org에서 최신 K-pop 아이돌 데이터를 가져와 kpopnet.json 패키지 대체
**Depends on**: Phase 21
**Research**: Complete (DISCOVERY.md)
**Plans**: 2

**배경:**

- 현재 kpopnet.json 패키지 사용 중이나 2023년 11월 이후 업데이트 안됨
- selca.kastden.org는 kpopnet.json의 원본 소스이며 최신 데이터 보유
- 그룹 멤버의 한글/영어 이름, 그룹 정보 등 필요

**기능 설명:**

- selca.kastden.org HTML 파싱으로 아이돌 그룹 정보 추출
- 그룹명 검색 시 selca에서 멤버 목록 가져오기
- kpopnet.json npm 의존성 완전 제거
- 기존 API 인터페이스 유지 (BiasManager 호환)

Plans:

- [x] 22-01: Selca 파서 모듈 생성 및 API 라우트 연동 ✓
- [x] 22-02: kpopnet.json 의존성 제거 및 최종 검증 ✓

### Phase 23: Unified Search UX Improvements

**Goal**: 통합검색 아이돌 선택 UI 개선 - 그룹별 접기/펼치기, 용어 변경, 실시간 갱신
**Depends on**: Phase 22
**Research**: Unlikely (UI 개선)
**Plans**: TBD

**기능 설명:**

- "내 최애" → "아이돌" 용어 변경
- 그룹별 접기/펼치기 UI (많은 그룹 관리 용이)
- 최애/그룹 추가 시 통합검색 드롭다운 실시간 갱신
- 그룹 헤더 클릭으로 전체 그룹 멤버 선택/해제

Plans:

- [x] 23-01: 커스텀 드롭다운 UI (용어 변경, 그룹별 접기/펼치기, 그룹/아이돌 선택) ✓

### Phase 24: Group Deletion

**Goal**: BiasManager에서 그룹 전체를 한 번에 삭제하는 기능 추가 (현재는 멤버 각각 삭제만 가능)
**Depends on**: Phase 23
**Research**: Unlikely (내부 UI/API 확장)
**Plans**: TBD

**기능 설명:**

- 그룹 헤더에 삭제 버튼 추가
- 그룹 삭제 시 해당 그룹의 모든 멤버(biases)도 함께 삭제
- 삭제 전 확인 다이얼로그 표시
- groups 테이블과 biases 테이블 cascade 또는 트랜잭션 삭제

Plans:

- [x] 24-01: Groups DELETE API + BiasManager 삭제 UI ✓

### Phase 25: UI Fixes (태그 구분선 간격 & 내보내기 통계)

**Goal**: Sidebar 태그 섹션과 구분선 간격 수정 + 데이터 관리 내보내기 통계 0/0/0 표시 버그 수정
**Depends on**: Phase 24
**Research**: Unlikely (UI 수정 및 API 버그 픽스)
**Plans**: TBD

**기능 설명:**

1. **태그 구분선 간격**:
   - Tags 섹션 끝과 border-t 구분선이 맞닿아 있음
   - Tags 섹션에 mb-6 추가하여 여백 확보

2. **내보내기 통계 0/0/0 버그**:
   - ExportModal에서 링크/태그/최애 수가 모두 0으로 표시됨
   - export API가 현재 로그인 사용자 데이터를 필터링하지 않음
   - user_id 기반 필터링 추가 필요

Plans:

- [x] 25-01: UI Fixes (태그 구분선 간격, 내보내기 통계 수정) ✓

### Phase 26: Bias List UX Fixes

**Goal**: 그룹 순서 변경 시 통합검색에 실시간 반영, 최애/그룹 추가 시 목록 아래에 추가
**Depends on**: Phase 25
**Research**: Unlikely (내부 UI/상태 관리)
**Plans**: TBD

**기능 설명:**

1. **그룹 순서 실시간 반영**: BiasManager에서 그룹 순서를 드래그로 변경하면 통합검색 드롭다운에도 즉시 반영
2. **최애/그룹 추가 위치**: 새로 추가된 최애나 그룹이 목록 맨 아래에 추가되도록 수정 (현재는 맨 위에 추가됨)

Plans:

- [x] 26-01: API sort_order 자동 설정 + Sidebar onBiasReordered 연결 ✓

### Phase 27: Selca External Search

**Goal**: selca.kastden.org 사이트를 외부 검색 플랫폼으로 추가하여 통합검색에서 셀카/영상 콘텐츠 검색 가능
**Depends on**: Phase 26
**Research**: Complete
**Plans**: 1/1 Complete

**기능 설명:**

- UnifiedSearch 모달에 selca 탭 추가 (YouTube, Twitter, heye, kgirls와 동일한 방식)
- selca.kastden.org 검색 기능 구현 (아이돌 이름 기반 셀카/영상 콘텐츠 검색)
- 검색 결과를 아카이브에 저장 가능 (이미지 및 영상 지원)
- LinkCard에서 selca 플랫폼 아이콘 표시 (보라색 테마)
- 페이지네이션 지원 (hasNextPage 기반)

Plans:

- [x] 27-01: selca 검색 API 라우트 + ExternalSearch selca 탭 추가 ✓

### Phase 28: Selca Search UX

**Goal**: Bias 기반 즉시 selca 검색 - selca_slug 저장 및 활용으로 타임아웃 제거
**Depends on**: Phase 27
**Research**: Complete
**Plans**: 2/2 Complete

**배경:**
- Phase 28-01 실패: fetchAllIdols() 방식은 500+ 아이돌 페이지 방문으로 15초 타임아웃 초과
- Phase 28-02 성공: Bias에 selca_slug 저장, 검색 시 Bias 매칭으로 즉시 검색

**기능 설명:**
- biases 테이블에 selca_slug 컬럼 추가 (selca.kastden.org 아이돌 slug 저장)
- BiasManager에서 최애 추가 시 selca_slug 자동 저장 (개별/일괄 모두)
- UnifiedSearch에서 Bias 매칭 후 slug 우선 사용 (즉시 검색, 타임아웃 없음)
- selca API에서 slug 직접 사용 시 searchMembers 호출 건너뛰기
- Option A (수동 백필): 사용자가 Bias를 다시 추가할 때 자동으로 채워짐

Plans:
- [ ] 28-01: fetchAllIdols 캐싱 방식 (실패 - 타임아웃)
- [x] 28-02: Bias 기반 selca_slug 저장 및 활용 ✓

### Phase 29: Selca Refactoring ✓

**Goal**: selca 관련 코드 리팩토링 - 꼬인 로직 정리 및 문제 있는 코드 수정
**Depends on**: Phase 28
**Research**: Unlikely (internal code review)
**Plans**: 1/1 Complete

**기능 설명:**

- selca 추가 작업 중 발생한 코드 품질 이슈 검토
- 중복되거나 비효율적인 로직 제거
- 아키텍처 및 데이터 흐름 개선
- 버그 및 엣지 케이스 수정

Plans:

- [x] 29-01: selca 코드 리팩토링 (타입 통합, 중복 제거, 플랫폼 타입 수정) ✓

### Phase 30: Selca Infinite Scroll

**Goal**: selca.kastden.org 무한 스크롤 페이지네이션 구현 - 스크롤 시 추가 콘텐츠 동적 로딩
**Depends on**: Phase 29
**Research**: Likely (selca 사이트 API 분석 필요)
**Plans**: TBD

**배경:**

- 현재 selca 검색은 초기 로드된 콘텐츠만 표시
- selca.kastden.org는 무한 스크롤 방식으로 추가 데이터를 동적 로딩
- 스크롤 끝에 도달 시 "loading" 표시와 함께 새 콘텐츠 fetch

**기능 설명:**

- selca 페이지네이션 API 엔드포인트 분석 (네트워크 요청 역공학)
- 스크롤 이벤트 감지 및 추가 콘텐츠 로딩
- Intersection Observer API 활용 (성능 최적화)
- 로딩 스피너 및 "더 이상 콘텐츠 없음" 메시지
- ExternalSearch selca 탭에 무한 스크롤 적용

Plans:

- [x] 30-01: selca max_time_id 기반 무한 스크롤 페이지네이션 구현 ✓

**Details:**
[To be added during planning]

### Phase 31: External Search Pagination

**Goal**: heye, kgirls, kgirls-issue 외부 검색에서 캐시 20개 이후에도 자연스럽게 추가 결과 로딩
**Depends on**: Phase 30
**Research**: Unlikely (기존 패턴 활용)
**Plans**: TBD

**배경:**

- 현재 외부 검색 결과는 캐시에 20개만 저장됨
- 20개 초과 시 "결과 0"으로 표시되고 "더보기" 버튼을 눌러야 다음 페이지 로드
- 사용자 경험 개선을 위해 페이지네이션 UI/UX 개선 필요

**기능 설명:**

- heye, kgirls, kgirls-issue 검색에 페이지네이션 버튼 추가
- 캐시 20개 제한 해결 또는 다음 페이지 자연스럽게 로딩
- 현재 페이지/전체 결과 수 표시
- "더보기" 또는 페이지 번호 네비게이션

Plans:

- [x] 31-01: heye/kgirls/kgirls-issue 외부 검색 페이지네이션 수정 ✓

**Details:**
Phase complete - currentPage 계산 수정 및 페이지 정보 UI 추가

### Phase 32: Namuwiki Fallback Search

**Goal**: selca.kastden.org에 없는 아이돌 그룹/멤버를 나무위키에서 폴백 검색하여 자동 추가
**Depends on**: Phase 31
**Research**: Complete (나무위키 이용약관/robots.txt 조사 완료)
**Plans**: 1

**배경:**

- selca.kastden.org에 등록되지 않은 아이돌이 존재
- 수동 입력 시 그룹 정보까지 다 입력해야 해서 번거로움
- 나무위키에서 그룹 페이지 파싱 시 멤버 목록 자동 추출 가능

**조사 결과:**

- robots.txt: `/w/` 경로 Allow (문서 페이지 크롤링 허용)
- 라이선스: CC BY-NC-SA 2.0 KR (비영리, 출처 표시 시 사용 가능)
- 명시적 금지 조항: 이용약관에서 크롤링 명시적 금지 없음
- 주의: 서버 부담 최소화 필요, 캐시 활용 권장

**기능 설명:**

1. selca.kastden.org에서 먼저 검색
2. 결과 없으면 나무위키에서 그룹 페이지 파싱 시도
   - 그룹 페이지 URL: `https://namu.wiki/w/{그룹명}`
   - 멤버 테이블에서 한글/영어 이름 추출
3. 그래도 없으면 수동 입력 폼 제공 (최후 수단)
4. 출처 표시: 나무위키 데이터 사용 시 출처 명시

Plans:

- [x] 32-01: 나무위키 파서 모듈 + API 폴백 + UI 출처 표시 ✓

**Details:**
selca → namuwiki 폴백 검색 구현, 출처 배지 UI 추가

### Phase 33: Unified Search Category Selection

**Goal**: 통합 검색에서 전체 선택 외에도 카테고리(플랫폼)별 선택 기능 추가
**Depends on**: Phase 32
**Research**: Unlikely (UI 개선)
**Plans**: TBD

**기능 설명:**

- 현재는 "전체 선택/해제"만 가능
- 카테고리(YouTube, Twitter, heye, kgirls, selca 등)별로 일괄 선택/해제 버튼 추가
- 플랫폼별로 검색 결과를 그룹화하여 선택 관리 용이하게

Plans:

- [ ] TBD (run /gsd:plan-phase 33 to break down)

**Details:**
[To be added during planning]

### Phase 34: Internet Archive Backup

**Goal**: 링크 저장 시 이미지/영상을 Internet Archive(archive.org)에 백업하고, 원본 링크가 깨지면 백업에서 불러오는 폴백 시스템 구현
**Depends on**: Phase 33
**Research**: Likely (archive.org API 조사 필요)
**Plans**: TBD

**배경:**

- 현재는 외부 링크의 이미지/썸네일 URL을 그대로 참조
- 원본 삭제 시 콘텐츠를 볼 수 없음
- 무료 + 무제한 + 영구 보관이 가능한 Internet Archive 활용

**기능 설명:**

1. **백업 저장**:
   - 링크 저장 시 이미지/영상을 archive.org에 업로드
   - DB에 archive_url 컬럼 추가
   - 백그라운드 작업으로 비동기 처리

2. **폴백 로딩**:
   - 이미지/영상 표시 시 원본 URL 먼저 시도
   - 원본 실패(404, 타임아웃 등) 시 archive.org URL로 폴백
   - onError 핸들러로 자동 전환

3. **아카이빙 상태 표시**:
   - archive_status: 'pending', 'archived', 'failed'
   - UI에 아카이빙 상태 아이콘 표시

4. **선택적 백업**:
   - 즐겨찾기(starred) 링크 자동 백업
   - 수동 "백업" 버튼으로 개별 링크 아카이빙

Plans:

- [x] 34-01: DB 스키마 및 archive.org API 모듈 ✓
- [x] 34-02: 아카이브 API 라우트 및 자동 백업 ✓
- [x] 34-03: UI 표시 및 폴백 시스템 ✓
- [x] 34-04-FIX: 아카이브 시스템 단순화 (원본 페이지 URL만 저장) ✓

**Details:**
Phase 34 완료 - Internet Archive 백업 시스템 구현 완료 (2026-01-19)
34-04-FIX: heye.kr Cloudflare 차단 문제 해결 - 미디어 URL 대신 원본 페이지 URL 아카이빙으로 단순화

### Phase 35: Instagram Search

**Goal**: Instagram 카테고리 추가 및 검색 기능 구현
**Depends on**: Phase 34
**Research**: Likely (Instagram API 또는 스크래핑 방법 조사 필요)
**Plans**: TBD

**기능 설명:**

- 통합검색에 Instagram 탭 추가 (YouTube, Twitter, heye, kgirls, selca와 동일한 방식)
- Instagram 게시물/릴스 검색 기능
- 검색 결과를 아카이브에 저장 (이미지, 동영상 지원)
- LinkCard에서 Instagram 플랫폼 아이콘 표시
- Instagram URL 파서 추가 (메타데이터 추출)

Plans:

- [x] 35-01: Instagram URL 파서 및 Apify 검색 API ✓

**Details:**
Phase 35 완료 - Instagram URL 파서 및 Apify 기반 검색 기능 구현 완료 (2026-01-19)

### Phase 36: Search & Parser Refactoring

**Goal**: Instagram 추가 후 꼬인 코드 리팩토링 - 중복 제거, 타입 통일, 성능 최적화, 검색 API 버그 수정
**Depends on**: Phase 35
**Research**: Unlikely (내부 코드 정리)
**Plans**: TBD

**발견된 문제점:**

1. **중복 코드**:
   - `decodeHtmlEntities` 함수가 instagram.ts와 instagram/route.ts에 중복
   - 각 버전의 기능이 다름 (검색 API 버전이 더 포괄적)

2. **미디어 타입 불일치**:
   - 파서: `media?: { type: 'image' | 'video'; url: string }[]`
   - 검색 API: 다른 구조 사용
   - undefined vs 빈 배열 반환 불일치

3. **성능 문제**:
   - heye/kgirls N+1 썸네일 로딩 (결과당 추가 HTTP 요청)
   - Selca `searchMembers` deprecated 표시만 되어있고 실제 사용됨

4. **타임아웃 불일치**:
   - Instagram 파서: 8초
   - YouTube/Twitter 파서: 5초
   - Selca 파서: 30초
   - 검색 API: 시간 제한 없음

5. **에러 처리 불일치**:
   - 검색 API별로 다른 에러 응답 형식

6. **Instagram 검색 API 버그**:
   - Apify Actor API 파라미터 검증 필요
   - 페이지네이션 미지원 (무한 스크롤 없음)
   - ReelsViewer와의 데이터 연동 문제

**기능 설명:**

- 공유 유틸리티 생성 (`src/lib/utils/decodeHtmlEntities.ts`)
- 미디어 타입 표준화 (`ParsedMedia[]` 통일)
- 타임아웃 설정 중앙화
- N+1 썸네일 로딩 최적화
- deprecated 코드 정리 또는 완전 제거
- 에러 처리 표준화
- Instagram 검색 API 문서 확인 및 수정
- ReelsViewer 데이터 연동 버그 수정

Plans:

- [ ] 36-01: 중복 코드 제거 및 타입 통일 (decodeHtmlEntities, ParsedMedia)
- [ ] 36-02: Instagram 검색 API 버그 수정 및 검증

**Details:**
[To be added after execution]

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
| 20. Authentication | - | 3/3 | Complete | 2026-01-14 |
| 21. Design Overhaul | - | 5/5 | Complete | 2026-01-14 |
| 22. Selca K-pop Data | - | 2/2 | Complete | 2026-01-16 |
| 23. Unified Search UX | - | 1/1 | Complete | 2026-01-16 |
| 24. Group Deletion | - | 1/1 | Complete | 2026-01-16 |
| 25. UI Fixes | - | 1/1 | Complete | 2026-01-16 |
| 26. Bias List UX Fixes | - | 1/1 | Complete | 2026-01-16 |
| 27. Selca External Search | - | 1/1 | Complete | 2026-01-16 |
| 28. Selca Search UX | - | 2/2 | Complete | 2026-01-16 |
| 29. Selca Refactoring | - | 1/1 | Complete | 2026-01-16 |
| 30. Selca Infinite Scroll | - | 1/1 | Complete | 2026-01-16 |
| 31. External Search Pagination | - | 1/1 | Complete | 2026-01-16 |
| 32. Namuwiki Fallback Search | - | 1/1 | Complete | 2026-01-19 |
| 33. Unified Search Category Selection | - | 1/1 | Complete | 2026-01-19 |
| 34. Internet Archive Backup | - | 3/3 | Complete | 2026-01-19 |
| 35. Instagram Search | - | 1/1 | Complete | 2026-01-19 |
| 36. Search & Parser Refactoring | - | 0/2 | Planned | - |
