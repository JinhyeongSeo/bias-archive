# Phase 35: Instagram Search - Discovery

## 조사 결과 요약

### Instagram API 옵션

1. **Instagram oEmbed API (공식)**
   - Meta Developer App Review 필수
   - 2025년 10월부터 thumbnail_url, author_name 필드 제거됨
   - 검색 기능 없음 (URL 임베드만 지원)
   - 비공개/비활성 계정, 스토리 미지원

2. **Instagram Graph API (공식)**
   - 비즈니스/크리에이터 계정만 지원
   - 일반 사용자 데이터 접근 불가
   - 해시태그 검색은 제한적

3. **Third-Party Scraper API**
   - Apify: Pay-per-result 모델, 무료 티어 $5/월 크레딧
   - Instagram Search Scraper: $2.60/1,000건 → 월 ~1,900건 무료
   - 해시태그, 사용자, 장소 검색 지원

4. **Self-hosted Scraping**
   - Instagram 안티봇 메커니즘이 강력
   - IP 차단, 레이트 리밋, CAPTCHA
   - 프록시 로테이션 필수 → 비용 발생

### 선택: Apify Instagram Search Scraper

**이유:**
- 월 ~2,000건 무료 (개인 프로젝트에 충분)
- 해시태그/사용자 검색 지원
- Node.js 클라이언트 제공
- 안정적인 서비스 (프록시 관리 포함)

### Apify 사용법

```typescript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// 검색 실행
const run = await client.actor('apify/instagram-search-scraper').call({
  search: 'keyword',
  searchType: 'user' | 'hashtag' | 'place',
  resultsLimit: 10
});

// 결과 조회
const { items } = await client.dataset(run.defaultDatasetId).listItems();
```

### Instagram URL 파서 전략

Instagram URL 직접 입력 시 메타데이터 추출:
- URL 패턴: `instagram.com/p/{postId}`, `instagram.com/reel/{reelId}`
- oEmbed API 또는 HTML 메타태그 파싱
- 이미지/동영상 URL 추출

### 구현 범위

1. **Instagram URL 파서** (parsers/instagram.ts)
   - URL에서 포스트/릴스 메타데이터 추출
   - 플랫폼 감지 로직에 instagram 추가

2. **Instagram 검색 API** (api/search/instagram/route.ts)
   - Apify Instagram Search Scraper 연동
   - 해시태그/사용자 검색 지원

3. **ExternalSearch UI 업데이트**
   - Instagram 탭 추가
   - 검색 타입 선택 (해시태그/사용자)

4. **LinkCard 업데이트**
   - Instagram 플랫폼 아이콘 및 색상 추가

## 환경 변수

```env
APIFY_API_TOKEN=           # Apify API 토큰
```

## 참고 자료

- [Apify Instagram Search Scraper](https://apify.com/apify/instagram-search-scraper)
- [Apify Free Tier](https://use-apify.com/docs/what-is-apify/apify-free-plan)
- [Meta oEmbed Updates](https://web.swipeinsight.app/posts/oembed-updates-enhance-facebook-developer-experience-15949)
