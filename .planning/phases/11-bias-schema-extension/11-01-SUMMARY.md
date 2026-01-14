---
phase: 11-bias-schema-extension
plan: 01
subsystem: database
tags: [supabase, migration, multilingual, typescript]

# Dependency graph
requires:
  - phase: 10
    provides: kpopnet.json 패키지로 영어/한글 이름 데이터 제공
provides:
  - biases 테이블에 name_en/name_ko 컬럼
  - 다국어 이름 저장을 위한 API
  - 영어/한글 이름 입력 UI
affects: [phase-12-language-toggle, phase-13-tag-matching]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 다국어 필드 확장 패턴 (기존 테이블에 nullable 컬럼 추가)
    - 하위 호환성 유지 (기존 API 파라미터 optional)

key-files:
  created:
    - supabase/migrations/20260114000001_bias_multilingual.sql
  modified:
    - src/types/database.ts
    - src/lib/biases.ts
    - src/app/api/biases/route.ts
    - src/app/api/biases/[id]/route.ts
    - src/app/api/biases/batch/route.ts
    - src/components/BiasManager.tsx

key-decisions:
  - "name_en/name_ko는 nullable로 추가하여 기존 데이터 호환"
  - "기존 name 필드는 유지 (display name으로 활용, 태그 매칭용)"
  - "그룹 일괄 추가 시 kpopnet name → nameEn, name_original → nameKo 매핑"

patterns-established:
  - "다국어 필드는 원본 필드 유지 + 언어별 필드 추가 패턴"

issues-created: []

# Metrics
duration: 4min
completed: 2026-01-14
---

# Phase 11 Plan 01: Bias Schema Extension Summary

**biases 테이블에 name_en/name_ko 컬럼 추가, API/UI 다국어 이름 저장 지원**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-14T00:20:48Z
- **Completed:** 2026-01-14T00:24:44Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- biases 테이블에 name_en, name_ko nullable 컬럼 추가
- 기존 데이터 마이그레이션 (name → name_ko 복사)
- API (개별/일괄 추가, 수정)에서 다국어 이름 저장 지원
- BiasManager UI에서 영어/한글 이름 입력 폼 추가
- 그룹 일괄 추가 시 kpopnet 데이터에서 자동으로 영어/한글 이름 저장

## Task Commits

각 태스크는 개별 커밋으로 기록됨:

1. **Task 1: DB 스키마 확장 및 TypeScript 타입 업데이트** - `f8e8710` (feat)
2. **Task 2: API 및 CRUD 함수 업데이트** - `8c1a70c` (feat)
3. **Task 3: BiasManager UI 업데이트** - `4d0fc82` (feat)

## Files Created/Modified

- `supabase/migrations/20260114000001_bias_multilingual.sql` - name_en, name_ko 컬럼 추가 및 데이터 마이그레이션
- `src/types/database.ts` - biases Row/Insert/Update 타입에 name_en, name_ko 추가
- `src/lib/biases.ts` - createBias/updateBias 시그니처 확장
- `src/app/api/biases/route.ts` - POST에서 nameEn, nameKo 파라미터 처리
- `src/app/api/biases/[id]/route.ts` - PUT에서 nameEn, nameKo 파라미터 처리
- `src/app/api/biases/batch/route.ts` - 일괄 추가 시 name_en, name_ko 저장
- `src/components/BiasManager.tsx` - 영어/한글 이름 입력 필드 및 그룹 일괄 추가 매핑

## Decisions Made

- name_en/name_ko는 nullable로 추가하여 기존 데이터와 호환성 유지
- 기존 `name` 필드는 삭제하지 않고 유지 (표시용 이름 + 태그 매칭에 계속 사용)
- 그룹 일괄 추가 시 kpopnet 데이터 매핑: name(영어) → nameEn, name_original(한글) → nameKo

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm install 누락된 next-intl 패키지 설치**
- **Found during:** Task 1 (빌드 검증)
- **Issue:** next-intl 패키지가 package.json에는 있으나 node_modules에 설치되지 않음
- **Fix:** `npm install` 실행하여 누락 패키지 설치
- **Verification:** npm run build 성공

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 빌드 차단 해결, 플랜에 영향 없음

## Issues Encountered

None - 플랜대로 실행됨

## Next Phase Readiness

- Phase 11 완료, Phase 12 (Language Toggle UI) 진행 가능
- biases 테이블에 name_en, name_ko 데이터 저장 가능
- 그룹 일괄 추가 시 자동으로 영어/한글 이름 저장됨

---
*Phase: 11-bias-schema-extension*
*Completed: 2026-01-14*
