# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

K-pop 최애(bias) 아카이브 웹앱. YouTube, Twitter/X, Weverse 등 여러 플랫폼의 직캠/사진 링크를 태그별로 정리하고 관리하는 개인 미디어 큐레이션 서비스.

## Commands

```bash
npm run dev      # 개발 서버 실행 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **i18n:** next-intl (한국어/영어)
- **Video Processing:** FFmpeg.wasm (브라우저 GIF 생성)
- **K-pop Data:** kpopnet.json (아이돌 그룹/멤버 데이터)

## Architecture

### 라우팅 구조
- `src/app/[locale]/` - next-intl 기반 다국어 라우팅
- `src/app/api/` - API Route Handlers
- `messages/ko.json`, `messages/en.json` - 번역 파일

### 핵심 데이터 흐름
1. **Link 저장**: URL 입력 → `src/lib/parsers/`에서 플랫폼별 메타데이터 추출 → Supabase 저장
2. **자동 태그**: `src/lib/autoTag.ts`가 제목/설명에서 등록된 최애 이름 매칭
3. **외부 검색**: `src/app/api/search/` 및 `src/app/api/youtube/search/`를 통해 YouTube, Twitter, heye, kgirls 검색

### 플랫폼별 파서 (`src/lib/parsers/`)
| 파일 | 플랫폼 | 방식 |
|------|--------|------|
| youtube.ts | YouTube | oEmbed API |
| twitter.ts | Twitter/X | vxtwitter API |
| weverse.ts | Weverse | Open Graph |
| heye.ts | heye.kr | HTML 파싱 |
| kgirls.ts | kgirls.net | HTML 파싱 (XE CMS) |
| generic.ts | 기타 | Open Graph |

### Supabase 구조
- 클라이언트: `src/lib/supabase.ts`
- 서버: `src/lib/supabase-server.ts`
- 미들웨어: `src/lib/supabase-middleware.ts`
- 마이그레이션: `supabase/migrations/`

### 주요 컴포넌트
- `BiasManager.tsx` - 최애 등록/관리 (kpopnet.json 연동)
- `UnifiedSearch.tsx` - 통합 검색 (아카이브 + 외부)
- `LinkForm.tsx` - 링크 저장 폼
- `GifMaker.tsx` - FFmpeg.wasm 기반 GIF 생성
- `ViewerModal.tsx` / `EmbedViewer.tsx` - 미디어 뷰어

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
YOUTUBE_API_KEY=           # YouTube Data API
GOOGLE_CSE_API_KEY=        # Google Custom Search (Twitter 검색용)
GOOGLE_CSE_ID=
```

## Path Aliases

`@/*` → `./src/*` (tsconfig.json)
