---
phase: 09-kgirls-parser
plan: 09-FIX
type: fix
---

<objective>
Fix 4 UAT issues from kgirls.net implementation.

Source: User UAT feedback (kgirls 썸네일, 뷰어, 검색 문제)
Priority: 2 critical (뷰어/썸네일), 1 major (검색), 1 minor (issue 게시판)
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Files to fix:**
@src/components/EmbedViewer.tsx
@src/components/ExternalSearch.tsx
@src/lib/parsers/kgirls.ts
@src/app/api/search/kgirls/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix EmbedViewer for kgirls platform</name>
  <files>src/components/EmbedViewer.tsx</files>
  <action>
Add kgirls platform support to EmbedViewer.

Currently EmbedViewer handles: youtube, twitter, weverse, heye
But kgirls is missing, causing fallback to "이 플랫폼은 임베드를 지원하지 않습니다"

Add after heye section (line ~360):
```tsx
// kgirls.net - show media gallery (images, GIFs, videos)
if (platform === 'kgirls') {
  const hasMedia = media && media.some(m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video')
  if (hasMedia) {
    return <MediaGallery media={media!} />
  }
}
```

This is same pattern as heye platform handling.
  </action>
  <verify>TypeScript compiles without error. Build succeeds.</verify>
  <done>kgirls platform shows MediaGallery when media exists, not fallback</done>
</task>

<task type="auto">
  <name>Task 2: Fix kgirls parser thumbnail/media extraction</name>
  <files>src/lib/parsers/kgirls.ts</files>
  <action>
Review and fix kgirls parser to correctly extract images.

Current issues:
1. Pattern matching may not work with actual kgirls.net HTML structure
2. Thumbnails in search results (thumbnails path) vs full images in posts (attach path)

Need to verify actual HTML from kgirls.net and adjust patterns:
- Check if `.bd img` selector is correct for content area
- Check if `/files/` pattern correctly matches image URLs
- Ensure full-size images are extracted, not thumbnails

If actual HTML structure differs:
- Update cheerio selectors
- Update regex patterns for file URLs
- Ensure media array is properly populated for link_media table
  </action>
  <verify>Test with actual kgirls.net URL. Parser returns thumbnailUrl and media array with images.</verify>
  <done>Parser correctly extracts images/GIFs/videos from kgirls.net posts</done>
</task>

<task type="auto">
  <name>Task 3: Fix kgirls search API and add board selector</name>
  <files>src/app/api/search/kgirls/route.ts, src/components/ExternalSearch.tsx</files>
  <action>
Fix two issues:

**A. ExternalSearch.tsx - Add board selector for kgirls**

Currently hardcoded to `board=mgall` (line 248).
Add state for kgirls board selection and UI selector:

1. Add state: `const [kgirlsBoard, setKgirlsBoard] = useState<'mgall' | 'issue'>('mgall')`
2. Modify searchKgirls function to use: `&board=${kgirlsBoard}`
3. Add board selector UI when platform === 'kgirls':
```tsx
{platform === 'kgirls' && (
  <div className="flex items-center gap-2">
    <select
      value={kgirlsBoard}
      onChange={(e) => setKgirlsBoard(e.target.value as 'mgall' | 'issue')}
      className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 ..."
    >
      <option value="mgall">마이너갤</option>
      <option value="issue">볼거리</option>
    </select>
  </div>
)}
```

**B. kgirls search API - Review HTML parsing**

Check if search result parsing matches actual kgirls.net HTML:
- Verify `a[href^="/${board}/"]` selector works
- Verify thumbnail extraction from search results
- Ensure pagination is correctly parsed
  </action>
  <verify>Search works for both mgall and issue boards. Results show thumbnails.</verify>
  <done>Can search both 마이너갤 and 볼거리 게시판. Thumbnails appear in results.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Fixed kgirls.net viewer, parser, and search with board selector</what-built>
  <how-to-verify>
1. Run: npm run dev
2. kgirls 검색 테스트:
   - 외부 검색 모달 열기
   - kgirls 선택
   - 게시판 선택 UI 확인 (마이너갤/볼거리)
   - 검색어 입력하여 검색
   - 결과에 썸네일이 표시되는지 확인
3. kgirls 링크 저장 테스트:
   - 검색 결과에서 저장 클릭
   - 저장된 링크에 썸네일이 표시되는지 확인
4. kgirls 뷰어 테스트:
   - 저장된 kgirls 링크 클릭
   - 뷰어 모달이 열리고 이미지 갤러리가 표시되는지 확인
   - (원본 링크로 이동하지 않고 모달이 열려야 함)
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] kgirls links show viewer modal (not redirect)
- [ ] kgirls links display thumbnail in list
- [ ] kgirls search returns results with thumbnails
- [ ] Can search both mgall and issue boards
- [ ] No TypeScript errors
- [ ] Build succeeds
</verification>

<success_criteria>
- All 4 kgirls.net UAT issues fixed
- Tests pass
- Ready for production use
</success_criteria>

<output>
After completion, create `.planning/phases/09-kgirls-parser/09-FIX-SUMMARY.md`
</output>
