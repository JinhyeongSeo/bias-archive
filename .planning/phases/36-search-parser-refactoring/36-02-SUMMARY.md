# 36-02 Plan Execution Summary

## Overview
**Plan ID:** 36-02
**Plan Name:** Instagram API Bug Fix
**Status:** COMPLETED
**Execution Date:** 2026-01-19

## Tasks Completed

### Task 1: Validate and fix Apify Actor API parameters
- **Commit:** `19ecd31`
- **Files Modified:** `src/app/api/search/instagram/route.ts`
- **Changes:**
  - Removed invalid `resultsType: 'posts'` parameter (not part of official Apify input schema)
  - Fixed timeout option: use `timeoutSecs` instead of `timeout` (Apify SDK convention)
  - Added empty results handling with proper JSON response
  - Added rate limit error handling (429 status)

### Task 2: Correct Instagram media data for ExternalSearch compatibility
- **Commit:** `cae80e8`
- **Files Modified:** `src/components/ExternalSearch.tsx`
- **Changes:**
  - Added `media` field to `EnrichedResult` interface for carousel support
  - Pass media array from Instagram search results to EnrichedResult
  - Skip metadata refetch for Instagram platform (like heye) to preserve carousel data
  - Prevents loss of multiple images/videos from Sidecar (carousel) posts
  - Critical fix: Previously, carousel media was being discarded during save flow

### Task 3: Verify Instagram tab functionality in ExternalSearch
- **Commit:** `f045e68`
- **Files Modified:** `src/components/ExternalSearch.tsx`
- **Changes:**
  - Added carousel media count indicator for posts with multiple images
  - Shows "N장" badge for Instagram carousel posts (Sidecar type)
  - Helps users identify multi-image posts before saving

## Verification Results

| Check | Status |
|-------|--------|
| `npm run build` | PASSED |
| Instagram API endpoint compiles | PASSED |
| Apify parameters corrected | PASSED |
| Media data preserved in save flow | PASSED |
| Carousel count indicator added | PASSED |

## Files Modified

1. `src/app/api/search/instagram/route.ts` (MODIFIED)
2. `src/components/ExternalSearch.tsx` (MODIFIED)

## Key Bug Fixes

### 1. Apify API Parameters
**Before:** Used `resultsType: 'posts'` and `timeout: 60`
**After:** Only uses `hashtags` and `resultsLimit`, uses `timeoutSecs: 60`

### 2. Carousel Media Loss
**Before:** Instagram search returned carousel media, but it was discarded when mapping to EnrichedResult. When saving, `/api/metadata` was called which only returns single image from og:image.
**After:** Media array is preserved from search results, and Instagram skips metadata refetch to use the pre-loaded carousel data.

### 3. UX Enhancement
**Before:** No indication of carousel posts in search results
**After:** Shows "N장" badge for posts with multiple media items

## Deviations from Plan

None. All tasks completed as specified.

## Testing Notes

- **APIFY_API_TOKEN required:** Instagram search will return `{ notConfigured: true }` without the token
- **Carousel support:** Sidecar posts with childPosts array now properly extract all media
- **Error handling:** Timeout, rate limit, and API errors are properly handled with user-friendly Korean messages

## Dependencies

- Depends on 36-01 completion (shared `decodeHtmlEntities` utility)
- Uses `apify-client` npm package (installed in 36-01)
