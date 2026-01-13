# Plan 05-01 Summary: Multi-Media Storage

## Overview

다중 미디어 저장 기능 구현 - link_media 테이블로 Twitter 여러 이미지 지원

## Tasks Completed

### Task 1: link_media 테이블 생성
- **Commit**: ab4314d
- **Changes**:
  - `supabase/migrations/20260113000003_link_media.sql` 생성
  - link_media 테이블: id, link_id (FK CASCADE), media_url, media_type, position, created_at
  - 인덱스: link_id, (link_id, position)
  - `src/types/database.ts` 업데이트: LinkMedia, LinkMediaInsert, LinkMediaUpdate 타입 추가
  - LinkWithMedia 복합 타입 추가

### Task 2: Twitter 파서 다중 이미지 지원
- **Commit**: c8463b6
- **Changes**:
  - `src/lib/parsers/index.ts`: ParsedMedia 타입, MediaType 타입 추가
  - `src/lib/parsers/twitter.ts`: vxtwitter media_extended 파싱, media 배열 반환
  - `src/lib/links.ts`:
    - createLinkMedia() 함수 추가
    - LinkWithTagsAndMedia 타입 추가
    - getLinksWithTags(), searchLinksWithTags()에 link_media JOIN 추가
  - `src/app/api/links/route.ts`:
    - POST: media 배열 받아서 link_media에 저장
    - GET: media 포함해서 반환
  - `src/lib/metadata.ts`: normalizeMetadata에서 media 필드 보존

## Files Modified

- `supabase/migrations/20260113000003_link_media.sql` (new)
- `src/types/database.ts`
- `src/lib/parsers/index.ts`
- `src/lib/parsers/twitter.ts`
- `src/lib/links.ts`
- `src/lib/metadata.ts`
- `src/app/api/links/route.ts`

## Verification

- [x] npm run build 성공
- [x] TypeScript 에러 없음
- [x] Twitter 파서가 media_extended에서 다중 이미지 파싱
- [x] POST /api/links에서 media 저장 지원
- [x] GET /api/links 응답에 media 배열 포함

## Deviations

None - all tasks completed as planned.

## Notes

- link_media 테이블은 ON DELETE CASCADE로 링크 삭제 시 자동 삭제
- media 배열은 position으로 정렬되어 반환됨
- 기존 thumbnail_url은 호환성을 위해 유지 (첫 번째 이미지)
