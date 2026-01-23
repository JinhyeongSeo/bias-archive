# Phase 37 Plan 01: TikTok Search Summary

**TikTok 검색 및 링크 저장 기능 구현 완료**

## Accomplishments

- Platform 타입에 'tiktok' 추가
- TikTok URL 파서 생성 (og:* 메타태그 추출)
- RapidAPI TikTok Scraper 기반 검색 API 구현
- ExternalSearch에 TikTok 탭 추가 (검정색 테마)
- LinkCard/LinkForm/Timeline에 TikTok 플랫폼 아이콘 추가

## Files Created/Modified

**Created:**
- `src/lib/parsers/tiktok.ts` - TikTok URL 파서 (메타데이터 추출)
- `src/app/api/search/tiktok/route.ts` - TikTok 검색 API (RapidAPI 연동)

**Modified:**
- `src/types/platforms.ts` - Platform/SearchCachePlatform에 'tiktok' 추가, TikTokResult 인터페이스
- `src/lib/parsers/index.ts` - parseTikTok export 추가
- `src/lib/metadata.ts` - TikTok URL 감지 및 파서 라우팅
- `src/components/ExternalSearch.tsx` - TikTok 탭, searchTikTok 함수, 플랫폼 스타일
- `src/components/LinkCard.tsx` - TikTok 라벨/색상
- `src/components/LinkForm.tsx` - TikTok 라벨/색상
- `src/components/Timeline.tsx` - TikTok 색상
- `src/app/api/search/cache/route.ts` - tiktok 플랫폼 타입 캐스팅
- `src/app/api/search/viewed/route.ts` - tiktok 플랫폼 타입 캐스팅

## Decisions Made

- RapidAPI tiktok-scraper7 사용 (월 500회 무료)
- 환경 변수: RAPIDAPI_KEY
- 키워드 기반 검색 (해시태그가 아닌 일반 키워드)
- TikTok 플랫폼 색상: 검정 (bg-black)
- Supabase DB 스키마에 'tiktok' 추가 전까지 `as any` 타입 캐스팅 사용

## Issues Encountered

1. **Supabase DB 타입 불일치**: Platform 타입에 'tiktok' 추가 후 Supabase DB 스키마 타입과 불일치 발생
   - 해결: `platform as any` 타입 캐스팅으로 임시 해결 (search/cache, search/viewed)
   - TODO: Supabase 마이그레이션으로 DB 스키마에 'tiktok' 추가 필요

## Commits

1. `ae63c2e` - feat(37-01): add TikTok platform type and URL parser
2. `4c7ed98` - feat(37-01): create TikTok search API route
3. `27cdafb` - feat(37-01): add TikTok tab to ExternalSearch UI

## Next Step

Phase 37 complete - Update STATE.md and ROADMAP.md
