# Bias Archive

K-pop 최애 아카이브 - 여러 플랫폼에 흩어진 직캠과 사진 링크를 태그별로 정리하는 개인 미디어 큐레이션 웹앱

## Features

### Link Management
- URL 입력 시 메타데이터 자동 추출 (제목, 썸네일, 설명)
- 플랫폼별 최적화 파싱: YouTube, Twitter/X, Weverse, heye.kr, kgirls.net
- 다중 미디어 저장 지원 (Twitter 여러 이미지 등)

### Bias (최애) Management
- 여러 최애 등록 및 관리
- 그룹명으로 검색하여 멤버 일괄 추가 (kpopnet.json 데이터 연동)
- 제목/설명에서 최애 이름 자동 태그 추출

### Search & Filter
- 아카이브 내 검색 및 태그 필터링
- 외부 검색 통합:
  - YouTube Data API (실시간 검색, 기간/정렬 필터)
  - Google CSE (Twitter 과거 트윗)
  - heye.kr, kgirls.net 커뮤니티 검색

### Viewer & Gallery
- YouTube, Twitter 임베드 뷰어
- 그리드/리스트 레이아웃 전환
- 태그별 앨범 보기
- "과거의 오늘" 타임라인

### Tools
- FFmpeg.wasm 기반 브라우저 GIF 생성
- JSON 내보내기/가져오기
- 다국어 지원 (한국어/영어)

### PWA
- 앱처럼 설치 가능
- 오프라인 지원

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **i18n:** next-intl
- **Video:** FFmpeg.wasm
- **K-pop Data:** kpopnet.json

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- (Optional) YouTube Data API key
- (Optional) Google Custom Search API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/bias-archive.git
cd bias-archive

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and API keys

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
YOUTUBE_API_KEY=your-youtube-api-key
GOOGLE_CSE_API_KEY=your-google-cse-api-key
GOOGLE_CSE_ID=your-google-cse-id
```

## Database Schema

```sql
-- biases: 최애 목록
biases (id, name, group_name, created_at, updated_at)

-- links: 저장된 링크
links (id, url, title, description, thumbnail_url, platform,
       original_date, author_name, bias_id, created_at, updated_at)

-- tags: 태그
tags (id, name, created_at)

-- link_tags: 링크-태그 연결
link_tags (link_id, tag_id)

-- link_media: 다중 미디어
link_media (id, link_id, media_url, media_type, position, created_at)
```

## Supported Platforms

| Platform | Metadata | Search | Notes |
|----------|----------|--------|-------|
| YouTube | oEmbed API | Data API | Shorts URL 자동 변환 |
| Twitter/X | vxtwitter API | Google CSE | 다중 이미지 지원 |
| Weverse | Open Graph | - | |
| heye.kr | Custom parser | Site search | HTML 파싱 |
| kgirls.net | Custom parser | Site search | XE CMS 기반 |
| Others | Open Graph | - | |

## License

MIT
