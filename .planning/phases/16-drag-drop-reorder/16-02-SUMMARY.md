# Phase 16 Plan 02: Drag & Drop UI Summary

**BiasManager에 드래그 앤 드롭 기능 구현 완료 - 그룹 순서와 bias 순서 모두 변경 가능**

## Accomplishments

- @hello-pangea/dnd v18.0.1 설치 (React 19 호환)
- BiasManager에 중첩 드래그 앤 드롭 구현:
  - 그룹 헤더 드래그로 그룹 순서 변경
  - 그룹 내 bias 드래그로 멤버 순서 변경
- groups 테이블에 sort_order 컬럼 추가
- /api/groups/reorder API 엔드포인트 추가
- Optimistic UI 업데이트 + 실패 시 롤백

## Files Created/Modified

- `supabase/migrations/20260114000004_group_sort_order.sql` - groups 테이블 sort_order 컬럼 추가
- `src/types/database.ts` - Group 타입에 sort_order 필드 추가
- `src/lib/groups.ts` - getGroups() sort_order 정렬, reorderGroups() 함수 추가
- `src/app/api/groups/reorder/route.ts` - 그룹 순서 변경 API
- `src/components/BiasManager.tsx` - 중첩 드래그 앤 드롭 UI 구현

## Decisions Made

- 그룹 간 bias 이동은 지원하지 않음 (멤버 소속 변경 방지)
- "그룹 없음"은 항상 맨 아래 고정 (드래그 불가)
- 그룹 드래그 핸들은 hover 시에만 표시

## Issues Encountered

- 초기 구현에서 그룹 간 bias 이동을 구현했으나, 사용자 피드백으로 그룹 자체 순서 변경으로 변경

## Next Step

Phase 16 complete, ready for Phase 17 (heye.kr iframe Embed)
