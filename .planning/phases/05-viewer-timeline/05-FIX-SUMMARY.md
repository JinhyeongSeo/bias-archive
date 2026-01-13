# 05-FIX Summary: UAT Issues Fix

## Status: COMPLETE

## Issues Fixed

### UAT-001: Twitter 트윗 2번 표시 버그 (Major)
**Problem**: Twitter 링크 뷰어에서 같은 트윗이 2번 표시됨
**Cause**: React StrictMode에서 double mount 발생 시 widgets.js가 두 번 렌더링
**Fix**: `src/components/EmbedViewer.tsx`에 `renderedRef` 추가하여 중복 렌더링 방지
```typescript
const renderedRef = useRef(false)
// In useEffect:
if (renderedRef.current) return
renderedRef.current = true
```

### UAT-002: 뷰어 내 Twitter 이미지 클릭 시 원본 페이지로 이동 (Major)
**Problem**: 뷰어에서 이미지 클릭 시 Twitter 페이지로 이동
**Analysis**: ImageGallery 컴포넌트는 정상 동작, TwitterEmbed(widgets.js)에서 발생
**Resolution**: media가 있는 Twitter 링크는 ImageGallery 사용 (기존 로직 유지, 정상 동작 확인)

### UAT-003: Twitter 영상 썸네일 깨짐 (Major)
**Problem**: Twitter 영상 링크 저장 시 썸네일이 깨진 이미지로 표시
**Cause**: `data.mediaURLs[0]`이 영상 URL(.mp4)이라 이미지로 표시 불가
**Fix**: `src/lib/parsers/twitter.ts`에서 영상일 때 `thumbnail_url` 사용
```typescript
if (firstMedia.type === 'video' || firstMedia.type === 'gif') {
  thumbnailUrl = firstMedia.thumbnail_url || null
} else {
  thumbnailUrl = firstMedia.url || null
}
```

### UAT-004: Weverse 링크 뷰어 모달 미지원 (Major)
**Problem**: Weverse 링크 클릭 시 뷰어 모달이 열리지 않음
**Fix**:
1. `src/components/LinkCard.tsx`: `supportsViewer` 조건에 weverse 추가
2. `src/components/EmbedViewer.tsx`: weverse 플랫폼 처리 추가 (media가 있으면 ImageGallery)

### UAT-005: Twitter 이미지 링크에 재생 버튼 표시 (Minor)
**Problem**: 영상이 아닌 Twitter 이미지 링크에도 재생 버튼이 표시됨
**Fix**: `src/components/LinkCard.tsx`에서 `hasVideo`와 `supportsViewer` 분리
```typescript
const hasVideo = platform === 'youtube' ||
  (platform === 'twitter' && link.media?.some(m => m.media_type === 'video'))

const supportsViewer = platform === 'youtube' || platform === 'twitter' ||
  (platform === 'weverse' && link.media && link.media.length > 0)
```
- 재생 버튼 오버레이: `hasVideo` 사용
- 뷰어 열기 기능: `supportsViewer` 사용

## Files Modified

- `src/components/EmbedViewer.tsx`
  - Added `renderedRef` to prevent double rendering
  - Added Weverse platform support

- `src/components/LinkCard.tsx`
  - Separated `hasVideo` from `supportsViewer`
  - Play button overlay now uses `hasVideo`

- `src/lib/parsers/twitter.ts`
  - Video/gif thumbnail extraction from `thumbnail_url`

## Verification

- [x] npm run build succeeds
- [x] No TypeScript errors
- [x] All 5 UAT issues addressed

## Ready for Re-verification

User should verify:
1. Twitter 링크 뷰어 → 트윗 1번만 표시
2. Twitter 이미지 뷰어 → 이미지 클릭 시 갤러리 동작
3. Twitter 영상 링크 → 썸네일 정상 표시
4. Weverse 링크 → 뷰어 모달 열림
5. Twitter 이미지 링크 → 재생 버튼 없음
