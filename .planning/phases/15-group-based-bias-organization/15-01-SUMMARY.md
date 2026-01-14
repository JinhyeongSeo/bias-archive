---
phase: 15-group-based-bias-organization
plan: 01
subsystem: database
tags: [supabase, groups, foreign-key, api]

# Dependency graph
requires:
  - phase: 11
    provides: biases table with name_en/name_ko fields
provides:
  - groups table for organizing biases
  - biases.group_id FK for group association
  - Groups CRUD API (/api/groups)
  - getOrCreateGroup helper for automatic group creation
  - getBiasesWithGroups for group-joined queries
affects: [15-02, ui-components, sidebar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - getOrCreateGroup pattern for automatic record creation
    - BiasWithGroup composite type for joined queries

key-files:
  created:
    - supabase/migrations/20260114000002_groups_table.sql
    - src/lib/groups.ts
    - src/app/api/groups/route.ts
  modified:
    - src/types/database.ts
    - src/lib/biases.ts
    - src/app/api/biases/batch/route.ts
    - src/components/BiasManager.tsx

key-decisions:
  - "nullable group_id FK for backward compatibility"
  - "getOrCreateGroup pattern: create group if not exists, reuse if found"
  - "keep group_name text field alongside group_id for backward compatibility"

patterns-established:
  - "Group lookup by any name field (name, name_en, name_ko)"
  - "BiasWithGroup type for UI components needing group info"

issues-created: []

# Metrics
duration: 8min
completed: 2026-01-14
---

# Phase 15 Plan 01: Groups Schema & API Summary

**groups 테이블 생성, biases.group_id FK 연결, Groups CRUD API 및 batch 연동으로 최애를 그룹별로 분류하는 데이터 기반 구축**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-14T10:00:00Z
- **Completed:** 2026-01-14T10:08:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- groups 테이블 생성 (id, name, name_en, name_ko, timestamps)
- biases.group_id nullable FK 추가 (ON DELETE SET NULL)
- Groups CRUD API 구현 (/api/groups GET, POST)
- 그룹 일괄 추가 시 자동으로 group 레코드 생성 및 연결
- BiasWithGroup 타입 및 getBiasesWithGroups 함수 추가

## Task Commits

1. **Task 1: groups schema & types** - `97d3a07` (feat)
2. **Task 2: groups CRUD & batch integration** - `9f2c1fe` (feat)

## Files Created/Modified

- `supabase/migrations/20260114000002_groups_table.sql` - groups 테이블 및 FK 정의
- `src/types/database.ts` - Group 타입, BiasWithGroup 복합 타입 추가
- `src/lib/groups.ts` - getOrCreateGroup 등 그룹 관련 함수
- `src/app/api/groups/route.ts` - Groups API 엔드포인트
- `src/app/api/biases/batch/route.ts` - 그룹 자동 생성 및 group_id 연결
- `src/lib/biases.ts` - createBias에 groupId 파라미터, getBiasesWithGroups 추가
- `src/components/BiasManager.tsx` - batch 요청 시 group 정보 전송

## Decisions Made

- group_id는 nullable로 추가하여 기존 데이터와 하위 호환성 유지
- 기존 group_name 텍스트 필드도 유지 (마이그레이션 없이 공존)
- getOrCreateGroup 패턴으로 그룹 일괄 추가 시 중복 방지

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- update_updated_at_column() 함수명이 update_updated_at()로 다름 → migration 파일 수정하여 해결

## Next Step

Ready for 15-02-PLAN.md (UI update)
