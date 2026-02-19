# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

K-pop 아이돌 아카이브 웹앱. YouTube, Twitter/X, Weverse 등 여러 플랫폼의 직캠/사진 링크를 태그별로 정리하고 관리하는 개인 미디어 큐레이션 서비스.

## Commands

```bash
npm run dev      # 개발 서버 실행 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

테스트 프레임워크 없음. 변경 검증은 `npm run build`로 수행.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS 4
- **i18n:** next-intl (한국어/영어)
- **Video Processing:** FFmpeg.wasm (브라우저 GIF 생성)
- **K-pop Data:** selca.kastden.org HTML 파싱 (아이돌 그룹/멤버 데이터)
- **DnD:** @hello-pangea/dnd (드래그 앤 드롭)
- **Animation:** framer-motion

## Path Aliases

`@/*` → `./src/*` (tsconfig.json)

## Architecture

### 미들웨어 (`src/middleware.ts`)
Supabase 세션 갱신 + next-intl 로케일 라우팅을 결합. API 라우트(`/api/*`)는 미들웨어 제외.

### 라우팅 구조
- `src/app/[locale]/` - next-intl 기반 다국어 라우팅 (params는 Promise - Next.js 16+)
- `src/app/api/` - API Route Handlers
- `messages/ko.json`, `messages/en.json` - 번역 파일
- `src/i18n/routing.ts` - 로케일 설정

### 핵심 데이터 흐름
1. **Link 저장**: URL 입력 → `src/lib/metadata.ts`가 `detectPlatform()` → 플랫폼별 파서(`src/lib/parsers/`) → Supabase 저장
2. **자동 태그**: `src/lib/autoTag.ts`가 제목/설명에서 등록된 아이돌 이름 매칭 (name/name_en/name_ko 양방향)
3. **외부 검색**: `src/app/api/search/` 및 `src/app/api/youtube/search/`를 통해 8개 플랫폼 검색
4. **뷰어**: LinkCard 클릭 → ViewerModal → EmbedViewer가 플랫폼별 표시 (YouTube embed, MediaGallery 등)

### 플랫폼별 파서 (`src/lib/parsers/`)
| 파일 | 플랫폼 | 방식 |
|------|--------|------|
| youtube.ts | YouTube | oEmbed API |
| twitter.ts | Twitter/X | vxtwitter API |
| weverse.ts | Weverse | Open Graph |
| heye.ts | heye.kr | HTML 파싱 (cheerio) |
| kgirls.ts | kgirls.net | HTML 파싱 (XE CMS, cheerio) |
| selca-metadata.ts | selca.kastden.org | HTML 파싱 (node-html-parser) |
| instagram.ts | Instagram | HTML meta tag 파싱 |
| tiktok.ts | TikTok | HTML meta tag 파싱 |
| generic.ts | 기타 | Open Graph (open-graph-scraper) |

**참고:** `selca.ts`는 URL 메타데이터 파서가 아닌 K-pop 그룹/멤버 데이터 조회 모듈. `namuwiki.ts`는 selca에 없는 아이돌 폴백 검색.

새 파서 추가 시: 파서 파일 생성 → `index.ts`에 export → `metadata.ts`의 `getParser()`에 등록 → `EmbedViewer.tsx`에 뷰어 지원 추가 → `LinkCard.tsx`의 `supportsViewer`에 추가.

### 뷰어 시스템 (`EmbedViewer.tsx`)
`supportsViewer` 목록에 있는 플랫폼만 인앱 뷰어 지원. 파서가 `media` 배열(`ParsedMedia[]`)을 반환해야 MediaGallery 표시 가능. media가 없으면 FallbackEmbed(외부 링크).

### Supabase 구조
- 클라이언트: `src/lib/supabase.ts`
- 서버: `src/lib/supabase-server.ts`
- 미들웨어: `src/lib/supabase-middleware.ts`
- 마이그레이션: `supabase/migrations/`

### API 에러 처리 패턴
`src/lib/api-error.ts`의 `ApiError` + 헬퍼 함수 사용. 에러 메시지는 한글.
```typescript
import { handleApiError, badRequest, notFound, unauthorized } from '@/lib/api-error'
badRequest('검색어가 필요합니다')  // throws, never returns
return handleApiError(error)      // catch 블록에서 사용
```

### 주요 컴포넌트
- `BiasManager.tsx` - 아이돌 등록/관리 (selca.kastden.org 연동)
- `UnifiedSearch.tsx` - 통합 검색 (아카이브 + 외부)
- `ExternalSearch.tsx` - 외부 검색 모달 (8개 플랫폼)
- `LinkForm.tsx` - 링크 저장 폼
- `LinkList.tsx` / `LinkCard.tsx` - 링크 목록/카드 표시
- `BatchTagModal.tsx` / `SelectionToolbar.tsx` - 다중 선택 및 배치 태그 관리
- `ViewerModal.tsx` / `EmbedViewer.tsx` - 미디어 뷰어
- `ReelsViewer.tsx` - 릴스/스토리 형식 미디어 뷰어
- `GifMaker.tsx` - FFmpeg.wasm 기반 GIF 생성
- `Timeline.tsx` - "과거의 오늘" 타임라인

### API 라우트 (`src/app/api/`)
| 카테고리 | 엔드포인트 | 설명 |
|----------|-----------|------|
| Links | `/api/links`, `/api/links/[id]` | 링크 CRUD |
| Links | `/api/links/batch`, `/api/links/batch/tags` | 배치 작업 |
| Links | `/api/links/[id]/archive` | Internet Archive 백업 |
| Links | `/api/links/timeline` | 타임라인 데이터 |
| Biases | `/api/biases`, `/api/biases/[id]` | Bias CRUD |
| Biases | `/api/biases/batch`, `/api/biases/reorder` | 배치/순서 변경 |
| Groups | `/api/groups`, `/api/groups/[id]`, `/api/groups/reorder` | 그룹 관리 |
| Search | `/api/search/{twitter,heye,kgirls,selca,instagram,tiktok}` | 외부 검색 |
| Search | `/api/search/cache`, `/api/search/viewed` | 검색 캐시/조회 기록 |
| YouTube | `/api/youtube/search` | YouTube 검색 |
| K-pop | `/api/kpop/groups`, `/api/kpop/members` | 아이돌 데이터 |
| Util | `/api/metadata`, `/api/proxy/image` | 메타데이터/프록시 |
| Data | `/api/import`, `/api/export` | 데이터 임포트/내보내기 |

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
YOUTUBE_API_KEY=           # YouTube Data API
SCRAPEBADGER_API_KEY=      # ScrapeBadger (Twitter 실시간 검색, 권장)
GOOGLE_CSE_API_KEY=        # Google Custom Search (Twitter 검색 폴백용)
GOOGLE_CSE_ID=
```

### Twitter 검색 API 우선순위
1. **ScrapeBadger** (설정 시 우선 사용): 실시간 검색, $0.10/1,000 트윗
2. **Google CSE** (폴백): 인덱싱된 과거 트윗만 검색, 무료

## Development Notes

- `next.config.ts`에서 `ignoreBuildErrors: true` 설정 — Vercel 배포용
- 이미지 프록시: wsrv.nl (이미지) + Cloudflare Workers (비디오 hotlink 우회)
- selca.kastden.org는 응답이 느림 (timeout 30초). `searchMembers()`는 deprecated, slug 직접 사용 권장
