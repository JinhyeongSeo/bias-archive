---
phase: 05-viewer-timeline
plan: 05-FIX
type: fix
---

<objective>
Fix 5 UAT issues from Phase 5 viewer implementation.

Source: 05-ISSUES.md
Priority: 0 critical, 4 major, 1 minor
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/05-viewer-timeline/05-ISSUES.md

**Affected files:**
@src/components/EmbedViewer.tsx
@src/components/ViewerModal.tsx
@src/components/LinkCard.tsx
@src/lib/parsers/twitter.ts
</context>

<tasks>

<task type="auto">
  <name>Fix UAT-001: Twitter 트윗 2번 표시 버그</name>
  <files>src/components/EmbedViewer.tsx</files>
  <action>
EmbedViewer에서 Twitter 플랫폼일 때 media가 있으면 ImageGallery를 표시하고, 그 외에는 TwitterEmbed를 표시하는데, ViewerModal에서 EmbedViewer가 호출될 때 media 배열이 제대로 전달되면서 둘 다 렌더링되는 문제로 보임.

원인 분석: EmbedViewer의 Twitter 분기에서 media가 있으면 ImageGallery만 반환하고, 없으면 TwitterEmbed만 반환해야 하는데, 현재 로직이 정상. 문제는 다른 곳에 있을 수 있음.

ViewerModal에서 EmbedViewer를 두 번 호출하는지 확인 필요. 또는 React StrictMode에서 double render가 발생하는지 확인.

수정: TwitterEmbed 컴포넌트의 useEffect에서 containerRef.innerHTML = ''로 이전 내용을 지우고 있지만, StrictMode의 double mount 시 두 번 렌더링될 수 있음. mounted 플래그로 cleanup하고 있지만, widgets.js가 비동기라 race condition 발생 가능.

해결: TwitterEmbed에서 컨테이너에 고유 ID를 부여하고, 이미 렌더링된 트윗이 있는지 확인 후 중복 렌더링 방지. 또는 useRef로 렌더링 상태 추적.
  </action>
  <verify>Twitter 링크 뷰어 열었을 때 트윗이 1번만 표시됨</verify>
  <done>Twitter 임베드가 한 번만 렌더링됨</done>
</task>

<task type="auto">
  <name>Fix UAT-002 & UAT-005: Twitter 이미지 클릭 문제 및 재생 버튼 표시 수정</name>
  <files>src/components/EmbedViewer.tsx, src/components/LinkCard.tsx</files>
  <action>
UAT-002: 뷰어 내 Twitter 이미지 클릭 시 원본 페이지로 이동
- 현재 ImageGallery는 Image 컴포넌트를 사용하고 있어 클릭 시 이동 문제 없음
- 문제는 TwitterEmbed(widgets.js)에서 임베드된 트윗 내의 이미지 클릭 시 Twitter로 이동하는 것
- TwitterEmbed 대신 media가 있는 Twitter 링크는 항상 ImageGallery를 사용하도록 변경

UAT-005: Twitter 이미지 링크에도 재생 버튼이 표시됨
- LinkCard에서 supportsViewer = platform === 'youtube' || platform === 'twitter'로 되어 있어 모든 Twitter에 재생 버튼이 표시됨
- 재생 버튼은 영상(YouTube, Twitter 영상)에만 표시해야 함
- link.media 배열에서 video 타입이 있는지 확인하여 hasVideo 플래그 사용
- 또는 YouTube이거나 Twitter 영상일 때만 재생 버튼 표시

수정:
1. LinkCard: supportsViewer 조건을 수정하여 YouTube이거나 Twitter 영상일 때만 재생 버튼 표시
2. EmbedViewer: Twitter에서 media가 있으면 ImageGallery 사용, 없으면 TwitterEmbed 사용 (현재 로직 유지)
  </action>
  <verify>
1. Twitter 이미지 링크에 재생 버튼이 표시되지 않음
2. Twitter 이미지 뷰어에서 이미지 클릭 시 Twitter로 이동하지 않음
  </verify>
  <done>재생 버튼은 YouTube와 Twitter 영상에만 표시, ImageGallery 이미지 클릭 정상 동작</done>
</task>

<task type="auto">
  <name>Fix UAT-003: Twitter 영상 썸네일 깨짐</name>
  <files>src/lib/parsers/twitter.ts</files>
  <action>
Twitter 영상 링크 저장 시 썸네일이 깨지는 문제:
- vxtwitter API의 media_extended에서 video 타입일 때 thumbnail_url 필드가 있음
- 현재 thumbnailUrl = data.mediaURLs?.[0]로 첫 번째 미디어 URL을 사용
- 영상의 경우 mediaURLs[0]이 .mp4 URL이라 이미지로 표시 불가

수정:
1. media_extended에서 video 타입인 경우 thumbnail_url 필드 사용
2. 영상이 아닌 경우 기존처럼 mediaURLs[0] 사용
  </action>
  <verify>Twitter 영상 링크 저장 시 썸네일이 정상 표시됨</verify>
  <done>Twitter 영상의 썸네일이 video.thumbnail_url에서 추출됨</done>
</task>

<task type="auto">
  <name>Fix UAT-004: Weverse 링크 뷰어 모달 지원</name>
  <files>src/components/LinkCard.tsx, src/components/EmbedViewer.tsx</files>
  <action>
Weverse 링크 클릭 시 뷰어 모달이 안 열리는 문제:
- LinkCard에서 supportsViewer = platform === 'youtube' || platform === 'twitter'
- Weverse는 포함되어 있지 않아 뷰어가 지원되지 않음

Weverse는 공식 임베드 API가 없으므로 이미지 갤러리로만 표시 가능.
- Weverse 링크에 media(이미지)가 있으면 ImageGallery로 표시
- 없으면 FallbackEmbed로 원본 링크 열기 제공

수정:
1. LinkCard: supportsViewer 조건에 weverse 추가 (media가 있는 경우에만)
2. EmbedViewer: weverse 플랫폼 처리 추가 - media가 있으면 ImageGallery, 없으면 FallbackEmbed
  </action>
  <verify>Weverse 링크 클릭 시 뷰어 모달이 열리고 이미지 갤러리 표시</verify>
  <done>Weverse 링크가 이미지 갤러리로 뷰어에서 표시됨</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>5개 UAT 이슈 수정 완료</what-built>
  <how-to-verify>
    1. http://localhost:3000 에서 앱 확인
    2. UAT-001: Twitter 링크 뷰어 열기 → 트윗이 1번만 표시되는지 확인
    3. UAT-002: Twitter 이미지 뷰어에서 이미지 클릭 → 이동하지 않고 갤러리 동작
    4. UAT-003: Twitter 영상 링크 저장 → 썸네일 정상 표시 확인
    5. UAT-004: Weverse 링크 클릭 → 뷰어 모달 열리고 이미지 표시
    6. UAT-005: Twitter 이미지 링크 → 재생 버튼 없음 확인
  </how-to-verify>
  <resume-signal>Type "approved" or describe remaining issues</resume-signal>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] npm run build succeeds without errors
- [ ] All 5 UAT issues addressed
- [ ] No new TypeScript errors
</verification>

<success_criteria>
- All UAT issues from 05-ISSUES.md addressed
- Build passes
- Ready for re-verification
</success_criteria>

<output>
After completion, create `.planning/phases/05-viewer-timeline/05-FIX-SUMMARY.md`
</output>
