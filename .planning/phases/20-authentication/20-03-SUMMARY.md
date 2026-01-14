---
phase: 20-authentication
plan: 03
subsystem: auth
tags: [supabase-auth, middleware, rls, api-protection]

# Dependency graph
requires:
  - phase: 20-02
    provides: Auth UI components (login/signup pages, AuthProvider)
provides:
  - Session refresh middleware
  - API route authentication
  - user_id auto-injection on data creation
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [middleware session refresh, authenticated API pattern]

key-files:
  created: []
  modified: [src/middleware.ts, src/app/api/*/route.ts, src/lib/supabase-server.ts]

key-decisions:
  - "GET 요청은 인증 없이 허용 (RLS가 필터링)"
  - "기존 데이터(user_id IS NULL)는 모든 사용자가 읽기 가능"
  - "next-intl middleware와 Supabase session refresh 통합"

patterns-established:
  - "API route auth pattern: createAuthenticatedClient → getUser → 401 if not authenticated"
  - "Middleware session refresh merged with next-intl locale handling"

issues-created: []

# Metrics
duration: ~15min
completed: 2026-01-14
---

# Phase 20 Plan 03: Protected Routes & API Summary

**인증 시스템 완성 - 미들웨어 세션 관리, API 보호, user_id 자동 할당으로 다중 사용자 지원**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-01-14T16:00:00Z
- **Completed:** 2026-01-14T16:18:00Z
- **Tasks:** 3
- **Files modified:** 10+

## Accomplishments

- Next.js 미들웨어로 세션 자동 새로고침 (next-intl과 통합)
- 모든 데이터 수정 API에 인증 요구 (401 Unauthorized)
- user_id 자동 할당 패턴 구현 (createAuthenticatedClient)
- 로그아웃 시 페이지 새로고침으로 캐시 데이터 클리어

## Task Commits

1. **Task 1: 미들웨어 세션 새로고침** - `d3d5252` (feat)
2. **Task 2: API 인증 보호** - `476f9df` (feat)
3. **Bug fixes:**
   - `35bfc70` - fix: use authenticated server client for bias/group creation
   - `8fffca2` - fix: refresh page after logout to clear cached data
   - `86a6e0e` - fix: use authenticated server client for links API
   - `c1c4aab` - fix: use authenticated server client in all API routes
   - `8034558` - fix: redirect to login page on 401 response

## Files Created/Modified

- `src/middleware.ts` - 세션 새로고침 + next-intl 통합
- `src/lib/supabase-server.ts` - createAuthenticatedClient 패턴 추가
- `src/app/api/biases/route.ts` - 인증 체크 추가
- `src/app/api/biases/[id]/route.ts` - 인증 체크 추가
- `src/app/api/biases/batch/route.ts` - 인증 체크 추가
- `src/app/api/links/route.ts` - 인증 체크 추가
- `src/app/api/links/[id]/route.ts` - 인증 체크 추가
- `src/app/api/groups/route.ts` - 인증 체크 추가
- `src/app/api/groups/[id]/route.ts` - 인증 체크 추가
- `src/app/api/tags/route.ts` - 인증 체크 추가
- `src/app/api/import/route.ts` - 인증 체크 추가

## Decisions Made

- **GET 요청 허용:** 읽기 작업은 인증 없이 허용, RLS가 user_id 기반 필터링 담당
- **기존 데이터 호환:** user_id IS NULL인 레거시 데이터는 모든 사용자가 읽기 가능
- **미들웨어 통합:** Supabase 세션 새로고침을 next-intl middleware와 쿠키 머지로 통합
- **401 리다이렉트:** 인증 필요 시 로그인 페이지로 자동 리다이렉트

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 인증 클라이언트 누락 수정**
- **Found during:** Task 2 (API 보호 구현)
- **Issue:** 일부 API가 일반 서버 클라이언트를 사용하여 인증 상태 확인 실패
- **Fix:** createAuthenticatedClient 패턴 적용하여 모든 API 일관성 확보
- **Committed in:** c1c4aab

**2. [Rule 1 - Bug] 로그아웃 후 캐시 데이터 문제**
- **Found during:** Checkpoint 검증
- **Issue:** 로그아웃 후에도 캐시된 데이터가 표시됨
- **Fix:** 로그아웃 시 window.location.reload()로 페이지 새로고침
- **Committed in:** 8fffca2

---

**Total deviations:** 2 auto-fixed bugs
**Impact on plan:** 필수 버그 수정으로 인증 시스템 안정성 확보

## Issues Encountered

- 미들웨어에서 Supabase와 next-intl 쿠키 충돌 → 쿠키 머지 패턴으로 해결
- 인증 실패 시 사용자 피드백 부족 → 401 응답 시 로그인 페이지 리다이렉트 추가

## Next Phase Readiness

**Phase 20 Authentication 완료!**

모든 인증 기능 구현됨:
- ✅ DB 스키마 (user_id, RLS 정책)
- ✅ Auth UI (로그인/회원가입 페이지)
- ✅ 세션 관리 (미들웨어, AuthProvider)
- ✅ API 보호 (인증 체크, user_id 자동 할당)

향후 확장 가능:
- 소셜 로그인 (Google, GitHub)
- 비밀번호 재설정

---
*Phase: 20-authentication*
*Completed: 2026-01-14*
