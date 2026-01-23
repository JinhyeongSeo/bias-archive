# Phase 37: TikTok Search - Discovery

## Research Summary

### TikTok API/Scraping Options

**Chosen: Apify TikTok Scraper**
- Actor: `apidojo/tiktok-scraper` (87K users, regularly updated)
- 기존 Instagram과 동일한 Apify 패턴 사용 가능
- Pricing: $0.03/actor start, $0.004/dataset item
- 이미 `APIFY_API_TOKEN` 환경 변수 설정되어 있음

**Apify TikTok Scraper 기능:**
- Hashtag 검색
- Profile 검색
- Video 검색
- 추출 데이터: author, video URL, description, likes, comments, play count, music metadata

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
3. **TikTok Search API**: `src/app/api/search/tiktok/route.ts` 생성
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
