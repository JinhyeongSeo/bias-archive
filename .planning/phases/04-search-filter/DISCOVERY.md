# Phase 4: Search & Filter - Discovery

## Discovery Level: 2 (Standard Research)

## Research Findings

### YouTube Data API v3

**Status: 무료 티어 사용 가능**

| 항목 | 값 |
|------|------|
| 일일 무료 할당량 | 10,000 units |
| search.list 비용 | 100 units/request |
| 일일 검색 가능 횟수 | ~100회 |
| API 키 필요 | Yes (Google Cloud Console) |

**엔드포인트:**
```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q={search_query}
  &type=video
  &key={API_KEY}
```

**응답 필드:**
- `items[].id.videoId` - 비디오 ID
- `items[].snippet.title` - 제목
- `items[].snippet.description` - 설명
- `items[].snippet.thumbnails` - 썸네일
- `items[].snippet.publishedAt` - 게시 날짜
- `items[].snippet.channelTitle` - 채널명

**제약사항:**
- 할당량 초과 시 429 에러
- 페이지당 최대 50개 결과
- 하루 100회 검색 제한 (개인 사용에 충분)

**Sources:**
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [YouTube Data API Overview](https://developers.google.com/youtube/v3/getting-started)

---

### Twitter/X API v2

**Status: 무료 티어 검색 불가**

| 항목 | Free Tier | Basic Tier |
|------|-----------|------------|
| 월 비용 | $0 | $100 |
| 검색 API | ❌ 불가 | ✅ 가능 |
| 읽기 제한 | 자기 정보만 | 10,000 tweets/month |
| 쓰기 제한 | 1,500 tweets/month | 50,000 tweets/month |

**결론:** 프로젝트 제약조건("무료 서비스만 사용")에 따라 Twitter 통합 검색 기능은 Phase 4에서 제외.

**Sources:**
- [X API Pricing 2025](https://twitterapi.io/blog/twitter-api-pricing-2025)
- [Free Tier Limitations](https://devcommunity.x.com/t/list-of-twitter-api-v2-access-endpoints-in-free-tier/198614)

---

## Phase 4 계획 수정

### 원래 계획 (ROADMAP.md)
- 04-01: 아카이브 검색 및 태그 필터링
- 04-02: YouTube 통합 검색
- 04-03: Twitter/X 통합 검색 ← **제외**

### 수정된 계획
- **04-01: 아카이브 검색 및 태그 필터링** (내부 기능)
  - 텍스트 검색 (title, description, author_name)
  - 태그 필터링 (다중 선택)
  - 플랫폼 필터링
  - 날짜 범위 필터링

- **04-02: YouTube 통합 검색** (외부 API)
  - YouTube Data API v3 연동
  - 검색 결과 미리보기
  - 선택한 영상 저장

### 대안 고려 (향후)
- Twitter 검색이 필요할 경우:
  1. 사용자가 직접 URL 입력 (현재 방식 유지)
  2. 향후 유료 API 도입 시 추가 가능
  3. 서드파티 API 서비스 검토 (twitterapi.io 등)

---

## 기술 스택 결정

### YouTube 통합 검색
- **라이브러리**: 직접 fetch 사용 (googleapis 패키지 불필요)
- **API 키 저장**: `.env.local`에 `YOUTUBE_API_KEY`
- **서버 사이드**: API 라우트에서 처리 (키 노출 방지)

### 아카이브 검색
- **Supabase 검색**: `.ilike()` 또는 `.or()` 조합
- **클라이언트 필터링**: 서버 쿼리 우선, 보조적 클라이언트 필터링
- **UI 패턴**: 기존 Sidebar 활용

---

*Last updated: 2026-01-13*
