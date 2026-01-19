---
phase: 34-internet-archive-backup
plan: 03
subsystem: ui
tags: [archive-status, fallback, wayback-machine, linkcard]

# Dependency graph
requires:
  - phase: 34-02
    provides: Archive API routes (POST/GET /api/links/[id]/archive)
provides:
  - ArchiveStatus component for visual status display
  - Manual archive trigger button in LinkCard
  - Image/video fallback to Wayback Machine
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [inline-svg-icons, onError-fallback, state-management]

key-files:
  created:
    - src/components/ArchiveStatus.tsx
  modified:
    - src/components/LinkCard.tsx
    - src/lib/proxy.ts
    - src/lib/archive.ts

key-decisions:
  - "Inline SVG icons instead of lucide-react to avoid import issues"
  - "Always show archive status icons when status exists (not just on hover)"
  - "Accept: application/json header required for archive.org SPN2 API"
  - "Handle 'same snapshot' message by checking wayback availability"

patterns-established:
  - "Fallback URL pattern with primary/fallback object"
  - "Archive status state management in LinkCard"

issues-created: []

# Metrics
duration: ~45min
completed: 2026-01-19
---

# Phase 34 Plan 03: Archive Status UI & Fallback Summary

**아카이브 상태 UI 표시 및 이미지/비디오 폴백 시스템 구현**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-01-19
- **Completed:** 2026-01-19
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- ArchiveStatus 컴포넌트 생성 (4가지 상태: null, pending, archived, failed)
- LinkCard에 아카이브 상태 표시 및 수동 아카이브 버튼 통합
- 이미지/비디오 폴백 유틸리티 함수 추가
- archive.org API 호환성 문제 해결

## Task Commits

Each task was committed atomically:

1. **Task 1: ArchiveStatus 컴포넌트 생성** - Inline SVG 아이콘으로 4가지 상태 표시
2. **Task 2: LinkCard에 ArchiveStatus 통합** - 아카이브 상태 관리 및 API 호출
3. **Task 3: 이미지/비디오 폴백 로직** - getWaybackFallbackUrl, getProxiedUrlWithFallback 함수
4. **Task 4: UI 검증** - 버그 수정 및 검증

## Files Created/Modified

- `src/components/ArchiveStatus.tsx` - 아카이브 상태 표시 컴포넌트
- `src/components/LinkCard.tsx` - 아카이브 상태 관리 및 UI 통합
- `src/lib/proxy.ts` - Wayback 폴백 유틸리티 함수
- `src/lib/archive.ts` - Accept 헤더 추가, same snapshot 처리

## Decisions Made

- lucide-react 대신 inline SVG 사용 (임포트 오류 방지)
- 아카이브 상태 있을 때 아이콘 항상 표시 (hover only가 아닌)
- Accept: application/json 헤더 필수 (API가 HTML 반환 방지)
- "same snapshot" 메시지 시 wayback availability 확인하여 success 반환

## Issues Encountered

1. **API 응답 필드 불일치**: `archive_status` → `status` 수정
2. **아이콘 사라짐**: opacity 클래스를 상태 기반으로 변경
3. **501 오류**: Vercel 환경 변수 미설정 → CLI로 추가
4. **환경 변수 개행**: `echo` → `printf '%s'`로 수정
5. **HTML 응답**: `Accept: application/json` 헤더 추가
6. **"same snapshot" 처리**: wayback availability 체크 로직 추가
7. **429 Rate Limit**: archive.org API 속도 제한 (15/min) - 코드 문제 아님

## API Rate Limits

archive.org SPN2 API:
- 15 requests/minute
- 100 requests/hour
- 100,000 requests/month

테스트 중 rate limit 발생하여 일부 검증은 제한됨.

## Next Phase Readiness

Phase 34 Internet Archive Backup 완료:
- 34-01: archive.ts 모듈 ✅
- 34-02: API 라우트 ✅
- 34-03: UI 및 폴백 ✅

---
*Phase: 34-internet-archive-backup*
*Completed: 2026-01-19*
