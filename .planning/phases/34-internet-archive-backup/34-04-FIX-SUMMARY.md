# 34-04-FIX Summary: Archive System Simplification

## Overview

**Problem:** Internet Archive cannot fetch heye.kr media URLs due to Cloudflare blocking.

**Solution:** Archive the original page URL instead of individual media files. Archive.org automatically captures all resources (images, videos) on the archived page.

## Changes Made

### Task 1: archive.ts
- Kept as-is (already simple, handles single URL archiving)

### Task 2: API Routes Simplified
- **src/app/api/links/[id]/archive/route.ts**
  - Removed `archiveMediaUrl` helper function
  - Changed from archiving `thumbnail_url` to archiving `link.url` (original page)
  - Removed delay logic (1 API call per link now)
  - Returns `archived_url` instead of `archived_thumbnail_url`

- **src/app/api/archive/process/route.ts**
  - Changed `ITEMS_PER_BATCH` from 3 to 10
  - Removed link_media query join
  - Added `archivePageUrl` helper function
  - Simplified batch processing

### Task 3: DB Migration
- Created `supabase/migrations/20260119141650_simplify_archive_columns.sql`
  - Dropped `links.archived_thumbnail_url` column
  - Dropped `link_media.archived_url` column

### Task 4: UI Fallback Logic
- **src/components/LinkCard.tsx**
  - Changed `archivedThumbnailUrl` state to `archivedUrl`
  - Removed `useFallbackImage` state and fallback image logic
  - Simplified `getThumbnailSrc` and `handleImageError` callbacks
  - Updated polling to use `data.archived_url`

### Task 5: TypeScript Types
- **src/types/database.ts**
  - Removed `archived_thumbnail_url` from links Row/Insert/Update
  - Removed `archived_url` from link_media Row/Insert/Update

## Commits

1. `d359a2a` - fix(34-04): simplify archive API to save page URL only
2. `a1ebf80` - chore(34-04): add migration to remove unused archive columns
3. `baf7b5c` - fix(34-04): update UI to use archived_url instead of archived_thumbnail_url
4. `b578a16` - fix(34-04): update TypeScript types to match simplified schema

## Benefits

- **Cloudflare bypass**: Pages are less likely to be blocked than direct media file requests
- **Simplified API**: N API calls per link → 1 API call per link
- **Automatic resource capture**: Archive.org captures all media on the page
- **Reduced rate limiting**: Fewer API calls means fewer rate limit issues

## Verification

- [x] TypeScript compilation successful
- [x] Archive request saves original page URL
- [x] API calls simplified to 1 per link
- [x] Unused columns removed from schema

## Related

- Source: `.planning/todos/pending/2026-01-19-heye-cloudflare-block-archive.md`
- Phase: 34-internet-archive-backup
