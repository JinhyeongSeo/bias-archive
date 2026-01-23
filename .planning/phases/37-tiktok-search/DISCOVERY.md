# Phase 37: TikTok Search - Discovery

## Research Summary

### TikTok API/Scraping Options

**Chosen: RapidAPI TikTok Scraper**
- Endpoint: `tiktok-scraper7.p.rapidapi.com`
- Basic Plan (무료): 월 300회 요청
- Rate Limit: 분당 120회
- 환경 변수: `RAPIDAPI_KEY`

**응답 구조 (feed/search):**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "videos": [{
      "video_id": "7332487397235494149",
      "title": "#karina #karinaaespa #aespa",
      "cover": "https://p16-sign-va.tiktokcdn.com/...",
      "play": "https://v77.tiktokcdn.com/...",
      "author": {
        "unique_id": "_loitora",
        "nickname": "loitora",
        "avatar": "https://..."
      },
      "play_count": 28449406,
      "digg_count": 3590717,
      "create_time": 1707227761
    }],
    "cursor": 10,
    "hasMore": true
  }
}
```

**API 호출 예시:**
```bash
curl --request GET \
  --url 'https://tiktok-scraper7.p.rapidapi.com/feed/search?keywords=카리나&region=kr&count=10' \
  --header 'x-rapidapi-host: tiktok-scraper7.p.rapidapi.com' \
  --header 'x-rapidapi-key: YOUR_KEY'
```

### TikTok URL 패턴

```
- Video: https://www.tiktok.com/@username/video/1234567890
- Short link: https://vm.tiktok.com/XXXXX/
- Video (alternate): https://www.tiktok.com/@username/video/1234567890?is_from_webapp=1
```

### 기존 Instagram 구현 참고

- API: `src/app/api/search/instagram/route.ts`
  - ApifyClient 사용
  - `apify/instagram-hashtag-scraper` Actor 호출
  - 55초 타임아웃 (Vercel 60s 제한)
  - 결과를 통일된 형식으로 변환

- Parser: `src/lib/parsers/instagram.ts`
  - HTML meta tag 파싱 (og:title, og:image, og:description)
  - URL 파싱으로 타입/ID 추출
  - 폴백 처리

### 구현 계획

1. **Platform 타입 추가**: `src/types/platforms.ts`에 `'tiktok'` 추가
2. **TikTok Parser**: `src/lib/parsers/tiktok.ts` 생성
3. **TikTok Search API**: `src/app/api/search/tiktok/route.ts` 생성 (RapidAPI)
4. **ExternalSearch UI**: TikTok 탭 추가

### 번역 키 (messages/*.json)

```json
{
  "platform": {
    "tiktok": "TikTok"
  },
  "search": {
    "tiktokNotConfigured": "TikTok 검색이 설정되지 않았습니다"
  }
}
```
