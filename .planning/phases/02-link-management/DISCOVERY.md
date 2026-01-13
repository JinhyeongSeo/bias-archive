# Phase 2 Discovery: 메타데이터 추출 방법

## Discovery Level: 2 (Standard Research)

**주제:** URL에서 메타데이터(제목, 썸네일, 플랫폼) 자동 추출 방법

## 조사 결과

### 1. YouTube 메타데이터 추출

**접근법:** oEmbed API (API 키 불필요)

**엔드포인트:**
```
https://www.youtube.com/oembed?url=${videoUrl}&format=json
```

**반환 데이터:**
- `title`: 영상 제목
- `author_name`: 채널명
- `author_url`: 채널 URL
- `thumbnail_url`: 썸네일 (hqdefault 품질)
- `html`: iframe 임베드 코드

**제한사항:**
- `description` 미반환 (YouTube Data API 필요)
- `duration` 미반환
- 업로드 날짜 미반환

**썸네일 고화질 변환:**
```
https://img.youtube.com/vi/{videoId}/maxresdefault.jpg
https://img.youtube.com/vi/{videoId}/hqdefault.jpg (fallback)
```

**URL 패턴:**
- `youtube.com/watch?v=`
- `youtu.be/`
- `youtube.com/shorts/`

### 2. Twitter/X 메타데이터 추출

**접근법:** oEmbed API (API 키 불필요)

**엔드포인트:**
```
https://publish.twitter.com/oembed?url=${tweetUrl}
```

**반환 데이터:**
- `author_name`: 작성자 닉네임
- `author_url`: 프로필 URL
- `html`: 트윗 임베드 HTML

**제한사항:**
- 미디어(이미지/비디오) 썸네일 직접 미반환
- 트윗 텍스트는 `html`에서 파싱 필요
- Full API (v2)는 유료화됨 (2023년~)

**URL 패턴:**
- `twitter.com/username/status/`
- `x.com/username/status/`

### 3. 일반 URL (Open Graph)

**접근법:** `open-graph-scraper` npm 패키지

**설치:**
```bash
npm install open-graph-scraper
```

**사용법:**
```typescript
import ogs from 'open-graph-scraper';

const { result } = await ogs({ url });
// result.ogTitle, result.ogImage, result.ogDescription
```

**반환 데이터:**
- `ogTitle`: 제목
- `ogImage`: 이미지 URL (배열일 수 있음)
- `ogDescription`: 설명
- `twitterCard`, `twitterTitle`, `twitterImage`: Twitter Card 메타데이터

**제한사항:**
- 서버 사이드 전용 (브라우저 미지원)
- 일부 사이트 User-Agent 차단 가능

### 4. Weverse 메타데이터

**접근법:** Open Graph (open-graph-scraper)

**URL 패턴:**
- `weverse.io/{artist}/media/`
- `weverse.io/{artist}/moments/`

**참고사항:**
- OG 메타데이터 잘 설정되어 있음
- 아티스트명은 URL에서 추출 가능

## 결정 사항

| 플랫폼 | 추출 방법 | API 키 |
|--------|-----------|--------|
| YouTube | oEmbed API | 불필요 |
| Twitter/X | oEmbed API | 불필요 |
| Weverse | open-graph-scraper | 불필요 |
| 기타 | open-graph-scraper | 불필요 |

**아키텍처:**
- 서버 사이드 API 라우트에서 메타데이터 추출 (CORS 우회)
- 플랫폼별 파서 모듈 분리
- 에러 시 기본값 반환 (title: URL, thumbnail: null)

## 참고 자료

- [YouTube oEmbed](https://abdus.dev/posts/youtube-oembed/)
- [Twitter oEmbed API](https://developer.x.com/en/docs/x-for-websites/timelines/guides/oembed-api)
- [open-graph-scraper](https://github.com/jshemas/openGraphScraper)
- [YouTube Thumbnail Patterns](https://yt-thumbnail.com/blog/youtube-thumbnail-extraction-api-guide)

---
*Discovery completed: 2026-01-13*
