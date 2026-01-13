# 내 최애 아카이브

## What This Is

여러 플랫폼(YouTube, Twitter/X, Weverse 등)에 흩어진 직캠과 사진 링크를 태그별로 정리하고, GIF 생성 및 '과거의 오늘' 타임라인 기능을 제공하는 개인화된 미디어 큐레이션 웹앱. 여러 최애(아이돌/멤버)를 추적할 수 있으며, 다국어(한/영) 인터페이스를 지원한다.

## Core Value

**링크 정리가 핵심.** URL을 넣으면 메타데이터를 자동 추출하고 태그를 붙여 깔끔하게 저장되는 것. 다른 기능이 없어도 이것만큼은 완벽하게 작동해야 한다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 링크 저장: URL 입력 시 썸네일, 제목, 날짜 자동 추출
- [ ] 자동 태그: 제목/설명에서 멤버명, 활동명 자동 추출
- [ ] 여러 최애 지원: 여러 아이돌/그룹을 개별 추적
- [ ] 여러 플랫폼 지원: YouTube, Twitter/X, Weverse 등
- [ ] 통합 검색: 앱 내에서 YouTube/Twitter 등 검색 → 미리보기 → 선택 저장
- [ ] 아카이브 검색: 태그 필터링 + 텍스트 검색
- [ ] 뷰어: 임베드 플레이어 + 원본 링크 제공
- [ ] UI 레이아웃: 그리드/리스트 전환 가능
- [ ] GIF 생성기: 영상 구간을 GIF로 변환 (URL + 로컬 파일)
- [ ] 타임라인: '과거의 오늘' 1년 전 콘텐츠 표시 (수동 확인)
- [ ] 다국어: 한국어/영어 인터페이스 전환
- [ ] 내보내기: JSON 형식으로 데이터 백업

### Out of Scope

- 소셜 기능 — 공유, 댓글, 커뮤니티 기능 제외 (개인 아카이브 목적)
- 모바일 앱 — v1은 웹만, 네이티브 iOS/Android 제외
- 알림 기능 — 타임라인 알림은 v1 이후 고려
- 서버 GIF 처리 — v1은 브라우저 처리, 서버는 이후 고려

## Context

- 직캠 중심 아카이브 (사진보다 영상 우선)
- 자동 태그 추출은 텍스트 분석 기반 (제목/설명에서 멤버명 매칭)
- 원본 미디어는 저장하지 않음 (링크와 메타데이터만)
- Supabase 무료 티어로 충분한 용량 (500MB DB)

## Constraints

- **Tech Stack**: Next.js (React) + Supabase
- **Hosting**: Vercel 무료 티어 배포
- **GIF 처리**: v1은 브라우저 WebAssembly FFmpeg
- **Budget**: 무료 서비스만 사용

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for DB | 무료 티어 충분, Next.js와 잘 통합 | — Pending |
| 브라우저 GIF 처리 | 서버 비용 0, v1에 적합 | — Pending |
| 텍스트 기반 태그 추출 | 미리 등록 없이 자동 분석 | — Pending |
| 통합 검색 기능 | URL 직접 입력 없이도 콘텐츠 발견 가능 | — Pending |

---
*Last updated: 2026-01-13 after adding integrated search*
