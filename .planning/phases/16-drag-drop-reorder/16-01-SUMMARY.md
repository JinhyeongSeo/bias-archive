# Phase 16 Plan 01: Schema & API Summary

**biases 테이블에 sort_order 컬럼 추가 및 순서 변경 API 구현 완료**

## Accomplishments

- biases 테이블에 sort_order INTEGER 컬럼 추가 (기존 데이터는 created_at 순으로 자동 할당)
- TypeScript 타입(Row/Insert/Update)에 sort_order 필드 추가
- PUT /api/biases/reorder 엔드포인트 구현 - { orderedIds: string[] } 요청으로 순서 업데이트
- GET /api/biases 정렬 기준을 sort_order ASC (NULLS LAST) → created_at DESC로 변경

## Files Created/Modified

- `supabase/migrations/20260114000003_bias_sort_order.sql` - sort_order 컬럼 추가 마이그레이션
- `src/types/database.ts` - Bias 타입에 sort_order 필드 추가
- `src/app/api/biases/reorder/route.ts` - 순서 변경 API 엔드포인트 (신규)
- `src/lib/biases.ts` - getBiases/getBiasesWithGroups 정렬 변경, reorderBiases 함수 추가

## Decisions Made

- NOT NULL 제약 조건 미추가: 기존 데이터 호환성 및 새 레코드 기본값 처리 용이하도록 nullable로 유지
- 병렬 업데이트: reorderBiases에서 Promise.all로 모든 bias를 동시 업데이트하여 성능 최적화

## Issues Encountered

None

## Next Step

Ready for 16-02-PLAN.md (UI 드래그 앤 드롭 구현)
