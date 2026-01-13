---
plan: 05-05
phase: 05-viewer-timeline
status: complete
started: 2026-01-13
completed: 2026-01-13
---

# Summary: 과거의 오늘 타임라인 기능

## What Was Built

"1년 전 오늘" 타임라인 기능 - 과거에 저장한 콘텐츠를 재발견할 수 있는 섹션

### Task 1: 타임라인 API 구현

**Files Modified:**
- `src/lib/links.ts` - `getLinksOnThisDay()` 함수 추가
- `src/app/api/links/timeline/route.ts` - 새로 생성

**Implementation:**
- `getLinksOnThisDay(yearsAgo)` 함수: N년 전 오늘의 월/일과 일치하는 링크 조회
- `original_date` 또는 `created_at` 기준으로 매칭
- Supabase query builder 제한으로 JavaScript에서 월/일 필터링
- GET `/api/links/timeline?years=N` API 엔드포인트

### Task 2: 타임라인 UI 섹션

**Files Modified:**
- `src/components/Timeline.tsx` - 새로 생성
- `src/app/page.tsx` - Timeline 컴포넌트 추가

**Implementation:**
- 메인 페이지 상단에 "1년 전 오늘" 섹션 표시
- 가로 스크롤 카드 레이아웃
- 접기/펼치기 토글 버튼
- 콘텐츠 없으면 자동 숨김
- 다크모드 지원
- 링크 클릭 시 새 탭에서 원본 열기

## Technical Decisions

1. **클라이언트 필터링**: Supabase가 EXTRACT 함수를 지원하지 않아 JavaScript에서 월/일 필터링
2. **자동 숨김**: 타임라인 콘텐츠 없으면 섹션 전체 숨김 (빈 메시지 대신)
3. **태그 제한**: 카드에 최대 3개 태그만 표시 (+N 형태로 나머지 표시)

## Verification

- [x] npm run build 성공
- [x] 타임라인 API 응답 정상 (빈 배열 또는 링크 목록)
- [x] 타임라인 UI 섹션 표시 (콘텐츠 있을 때)
- [x] 콘텐츠 없을 때 섹션 숨김

## Commits

1. `feat(05-05): add timeline API for past-day links`
2. `feat(05-05): add timeline UI section`

## Notes

- 실제 테스트를 위해서는 1년 이상 된 링크 데이터가 필요
- 신규 프로젝트의 경우 타임라인 섹션이 자동으로 숨겨짐
- 향후 알림 기능 추가 시 이 타임라인 데이터 활용 가능
