# Phase 4: Search & Filter - Discovery

## Discovery Level: 2 (Standard Research)

## Research Findings

### Google Custom Search API (선택됨)

**Status: 무료 티어 사용 가능 - YouTube + Twitter 통합 검색**

| 항목 | 값 |
|------|------|
| 일일 무료 할당량 | 100 queries |
| 추가 비용 | $5 / 1,000 queries |
| site: 연산자 | ✅ 지원 |
| API 키 필요 | Yes (Google Cloud Console + Programmable Search Engine) |

**장점:**
- 하나의 API로 YouTube + Twitter 모두 검색
- `site:youtube.com`, `site:twitter.com` 필터링 가능
- 검색 결과 링크 → 기존 메타데이터 API로 썸네일/제목 추출

**검색 → 메타데이터 파이프라인:**
```
1. Google CSE: "site:twitter.com 카리나" → twitter.com/xxx/status/123 링크들
2. 각 링크 → 기존 /api/metadata 호출 → vxtwitter로 썸네일, 제목 추출
3. 미리보기 표시 → 저장 버튼
```

**테스트 결과:**
- `site:twitter.com 카리나 fancam` → Twitter 결과 정상 반환
- `site:x.com` 보다 `site:twitter.com` 사용 권장 (인덱싱 안정성)
- 검색어 팁: "카리나 직캠" 보다 "카리나"가 더 많은 결과

**Sources:**
- [Custom Search JSON API](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine](https://programmablesearchengine.google.com/)

---

### YouTube Data API v3 (대안)

**Status: 무료 가능하나 Google CSE로 대체**

| 항목 | 값 |
|------|------|
| 일일 무료 할당량 | 10,000 units |
| search.list 비용 | 100 units/request |
| 일일 검색 가능 횟수 | ~100회 |

YouTube 전용 API는 더 풍부한 메타데이터를 제공하지만, Google CSE로 YouTube + Twitter를 통합 처리하는 것이 더 효율적.

---

### Twitter/X API v2

**Status: 무료 티어 검색 불가 → Google CSE로 우회**

| 항목 | Free Tier | Basic Tier |
|------|-----------|------------|
| 월 비용 | $0 | $100 |
| 검색 API | ❌ 불가 | ✅ 가능 |

**해결책:** Google CSE `site:twitter.com` + 기존 vxtwitter API 조합으로 무료 검색 구현

---

## 최종 계획

### 04-01: 아카이브 검색 및 태그 필터링 (내부 기능)
- 텍스트 검색 (title, description, author_name)
- 태그 필터링 (다중 선택)
- 플랫폼 필터링
- 날짜 범위 필터링

### 04-02: 통합 외부 검색 (YouTube API + Google CSE)
- YouTube: YouTube Data API v3 (site: 필터 불안정)
- Twitter: Google CSE site:twitter.com + vxtwitter 메타데이터
- 이미 저장된 링크는 "저장됨" 표시 (중복 방지)

---

## 기술 스택 결정

### 통합 외부 검색
- **API**: Google Custom Search API
- **환경변수**: `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`
- **메타데이터 추출**: 기존 `/api/metadata` 재사용
  - YouTube: oEmbed API
  - Twitter: vxtwitter API

### 아카이브 검색
- **Supabase 검색**: `.ilike()` 또는 `.or()` 조합
- **UI 패턴**: 기존 Sidebar 활용

---

*Last updated: 2026-01-13*
