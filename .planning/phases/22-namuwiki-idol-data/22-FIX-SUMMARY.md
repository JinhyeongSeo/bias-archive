# Phase 22 Fix Summary

**selca 파서 한글 활동명 파싱 및 검색 안정성 개선**

## Accomplishments

- selca.kastden.org 개별 아이돌 페이지에서 한글 활동명 파싱 (Stage name original)
- 그룹 검색 시 실제 멤버 수 표시
- 캐시 TTL 10분으로 연장
- BiasManager 검색 레이스 컨디션 해결 (AbortController 적용)

## Files Created/Modified

- `src/lib/parsers/selca.ts` - 한글 활동명 파싱, 멤버 수 조회, 캐시 연장
- `src/components/BiasManager.tsx` - AbortController로 검색 안정성 개선

## Issues Fixed

| ID | 설명 | 심각도 |
|----|------|--------|
| UAT-001 | 그룹 자동완성에서 멤버 수 0명 표시 | Minor |
| UAT-002 | selca 파서가 한글 활동명을 파싱하지 못함 | Major |
| UAT-004 | 개별 멤버 검색 속도 느림 | Minor |

## Decisions Made

1. **한글 활동명 개별 페이지 조회**: 그룹 멤버 테이블에는 본명만 있어서 각 멤버의 개별 페이지에서 "Stage name (original)" 필드를 파싱
2. **병렬 요청**: 멤버 수와 한글명 조회를 Promise.all로 병렬 처리하여 성능 최적화
3. **캐시 TTL 10분**: 외부 API 요청을 줄이고 성능 개선

## Verification Checklist

- [x] npm run build 성공
- [x] 그룹 검색 시 멤버 수 표시 (UAT-001)
- [x] 멤버 조회 시 한글 활동명 포함 (UAT-002)
- [x] 캐시 TTL 연장 적용 (UAT-004)
- [x] 검색 레이스 컨디션 해결 (추가 발견)
- [x] 사용자 검증 통과

## Commit

- `cd3df78` - fix(22): selca 파서 한글 활동명 파싱 및 검색 안정성 개선

---

*Phase: 22-namuwiki-idol-data*
*Fixed: 2026-01-16*
