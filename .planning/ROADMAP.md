# Roadmap: 내 최애 아카이브

## Overview

여러 플랫폼에 흩어진 직캠과 사진 링크를 태그별로 정리하는 개인 미디어 큐레이션 웹앱. 프로젝트 셋업부터 시작해 핵심인 링크 저장 기능을 구축하고, 태그/검색/뷰어/GIF 기능을 순차적으로 추가한다.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation** - Next.js + Supabase 프로젝트 셋업, DB 스키마, 기본 UI
- [ ] **Phase 2: Link Management** - URL 입력, 메타데이터 자동 추출, 저장 (핵심)
- [ ] **Phase 3: Tagging & Multi-Bias** - 자동 태그 추출, 여러 최애 지원
- [ ] **Phase 4: Search & Filter** - 아카이브 검색, 태그 필터링, 통합 검색
- [ ] **Phase 5: Viewer & Timeline** - 임베드 뷰어, 레이아웃 전환, 과거의 오늘
- [ ] **Phase 6: GIF & Export** - 브라우저 GIF 생성, JSON 내보내기, 다국어

## Phase Details

### Phase 1: Foundation
**Goal**: Next.js 프로젝트 초기화, Supabase 연동, DB 스키마 설계, 기본 UI 레이아웃
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established patterns)
**Plans**: TBD

Plans:
- [ ] 01-01: Next.js 프로젝트 생성 및 기본 설정
- [ ] 01-02: Supabase 연동 및 DB 스키마 생성
- [ ] 01-03: 기본 UI 레이아웃 및 네비게이션

### Phase 2: Link Management
**Goal**: URL 입력 시 메타데이터 자동 추출 및 저장 — 앱의 핵심 기능
**Depends on**: Phase 1
**Research**: Likely (external APIs)
**Research topics**: YouTube/Twitter oEmbed API, URL 메타데이터 추출 방법, Open Graph 파싱
**Plans**: TBD

Plans:
- [ ] 02-01: URL 입력 폼 및 메타데이터 추출 서비스
- [ ] 02-02: 링크 저장 및 CRUD 기능
- [ ] 02-03: 플랫폼별 메타데이터 파서 (YouTube, Twitter, Weverse)

### Phase 3: Tagging & Multi-Bias
**Goal**: 제목/설명에서 멤버명 자동 추출, 여러 최애 관리, 태그 시스템
**Depends on**: Phase 2
**Research**: Unlikely (internal text processing)
**Plans**: TBD

Plans:
- [ ] 03-01: 최애(bias) 관리 CRUD
- [ ] 03-02: 자동 태그 추출 로직
- [ ] 03-03: 수동 태그 편집 UI

### Phase 4: Search & Filter
**Goal**: 저장된 아카이브 검색/필터링 + 외부 플랫폼 통합 검색
**Depends on**: Phase 3
**Research**: Likely (external APIs)
**Research topics**: YouTube Data API 검색, Twitter API v2 검색 엔드포인트, API 키 관리
**Plans**: TBD

Plans:
- [ ] 04-01: 아카이브 검색 및 태그 필터링
- [ ] 04-02: YouTube 통합 검색
- [ ] 04-03: Twitter/X 통합 검색

### Phase 5: Viewer & Timeline
**Goal**: 임베드 플레이어, 그리드/리스트 전환, '과거의 오늘' 타임라인
**Depends on**: Phase 4
**Research**: Unlikely (embed players, internal patterns)
**Plans**: TBD

Plans:
- [ ] 05-01: 임베드 뷰어 (YouTube, Twitter)
- [ ] 05-02: 그리드/리스트 레이아웃 전환
- [ ] 05-03: '과거의 오늘' 타임라인 기능

### Phase 6: GIF & Export
**Goal**: 브라우저 GIF 생성기, JSON 내보내기, 한/영 다국어 지원
**Depends on**: Phase 5
**Research**: Likely (new library)
**Research topics**: FFmpeg.wasm 사용법, 브라우저 비디오 프로세싱, WebAssembly 성능
**Plans**: TBD

Plans:
- [ ] 06-01: FFmpeg.wasm 기반 GIF 생성기
- [ ] 06-02: JSON 내보내기/가져오기
- [ ] 06-03: 다국어(i18n) 지원

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Link Management | 0/3 | Not started | - |
| 3. Tagging & Multi-Bias | 0/3 | Not started | - |
| 4. Search & Filter | 0/3 | Not started | - |
| 5. Viewer & Timeline | 0/3 | Not started | - |
| 6. GIF & Export | 0/3 | Not started | - |
