---
phase: 02-link-management
plan: 03
status: complete
started: 2026-01-13
completed: 2026-01-13
duration: ~45 min
---

# 02-03 Summary: 플랫폼별 파서 모듈화 및 고도화

## What Was Built

플랫폼별 메타데이터 파서를 모듈화하고, 사용자 테스트를 통해 발견된 이슈들을 수정함.

### Task 1: 플랫폼별 파서 모듈 분리 ✓

**생성된 파일:**
- `src/lib/parsers/youtube.ts` - YouTube oEmbed + maxresdefault 썸네일
- `src/lib/parsers/twitter.ts` - vxtwitter API 사용 (완전 재작성)
- `src/lib/parsers/weverse.ts` - OG scraper + 멤버명 추출
- `src/lib/parsers/generic.ts` - 일반 URL용 OG scraper
- `src/lib/parsers/index.ts` - 통합 export 및 타입 정의

### Task 2: metadata.ts 리팩토링 ✓

- 파서 모듈 호출 방식으로 변경
- 에러 처리 개선 (MetadataError 클래스)
- 재시도 로직 구현

### Task 3: 체크포인트 검증 ✓

사용자 테스트 중 발견된 이슈들을 순차적으로 수정:

| 이슈 | 원인 | 해결 |
|------|------|------|
| YouTube Shorts 메타데이터 안됨 | oEmbed가 /shorts/ URL 미지원 | watch URL로 변환 |
| Twitter 트윗 텍스트 추출 실패 | `<a>` 태그로 정규식 실패 | HTML 태그 제거 로직 추가 |
| Twitter 썸네일 없음 | oEmbed가 이미지 미제공 | OG scraper fallback 추가 |
| Twitter oEmbed 429/실패 | Rate limit | vxtwitter API로 완전 교체 |
| 깨진 이미지 아이콘 표시 | 이미지 로드 실패 처리 없음 | onError 핸들러 추가 |
| Weverse 작성자 안나옴 | OG에 author 필드 없음 | URL에서 커뮤니티명 추출 |
| Weverse 멤버명 미추출 | description 패턴 미활용 | "content - MEMBER" 패턴 파싱 |
| author_name DB 미저장 | 컬럼 없음 | migration 추가 |

## Commits

```
537d5ff feat(02-03): extract member name from Weverse description
6b53de6 fix(02-03): extract artist name from Weverse URL
32f3a3a feat(02-03): add author_name storage and display
1a5cbb5 feat(02-03): switch Twitter parser to vxtwitter API
5296318 fix(02-03): hide broken thumbnail images on load error
2a2e06b fix(02-03): add OG scraper fallback when Twitter oEmbed fails
835fc99 feat(02-03): add Twitter thumbnail extraction via OG scraper
fb5354a fix(02-03): fix Twitter tweet text extraction from HTML
aa06a8a fix(02-03): convert YouTube Shorts URL to watch URL for oEmbed compatibility
df83753 refactor(02-03): improve metadata extraction with modular parsers
84be96e feat(02-03): create platform-specific parser modules
```

## Files Modified

- `src/lib/parsers/youtube.ts` (created, modified)
- `src/lib/parsers/twitter.ts` (created, fully rewritten)
- `src/lib/parsers/weverse.ts` (created, modified)
- `src/lib/parsers/generic.ts` (created)
- `src/lib/parsers/index.ts` (created)
- `src/lib/metadata.ts` (refactored)
- `src/components/LinkForm.tsx` (image error handling, authorName)
- `src/components/LinkCard.tsx` (author_name display)
- `src/app/api/links/route.ts` (authorName parameter)
- `src/types/database.ts` (author_name types)
- `supabase/migrations/20260113000002_add_author_name.sql` (created)

## Deviations from Plan

1. **Twitter: oEmbed → vxtwitter API**
   - 원래 계획: oEmbed API 사용
   - 변경 이유: oEmbed rate limit, 썸네일 미제공
   - 결과: vxtwitter API로 완전 교체하여 안정적인 메타데이터 + 이미지 URL 획득

2. **author_name 필드 추가**
   - 원래 계획: Phase 3에서 처리
   - 변경 이유: 사용자가 작성자 정보 표시 요청
   - 결과: DB migration 추가, API/UI 모두 수정

3. **그룹/멤버 분리 → Phase 3 연기**
   - 이슈: Weverse에서 그룹명(BABYMONSTER)과 멤버명(ASA) 모두 필요
   - 결정: Phase 3의 bias 시스템에서 처리하기로 연기

## Decisions Made

- **Supabase CLI 사용**: 대시보드 대신 `npx supabase db push`로 migration 적용
- **vxtwitter API 선택**: Twitter 공식 API 제한 우회, 안정적인 대안

## Known Issues

- Weverse: 그룹명과 멤버명 모두 저장하려면 bias 시스템 필요 (Phase 3)
- Twitter: 여러 이미지 중 첫 번째만 썸네일로 사용 (다중 미디어는 Phase 5)

## Verification

- [x] `npm run build` 에러 없음
- [x] YouTube URL: 고화질 썸네일 + 제목 추출
- [x] YouTube Shorts: 정상 동작
- [x] Twitter/X URL: 작성자명 + 제목 + 썸네일 추출
- [x] Weverse URL: 이미지 + 멤버명 추출
- [x] 일반 URL: OG 메타데이터 추출
- [x] author_name 저장 및 표시
- [x] 깨진 이미지 처리

## Phase 2 Complete

모든 플랜(02-01, 02-02, 02-03) 완료. Link Management 핵심 기능 구현 완료.
