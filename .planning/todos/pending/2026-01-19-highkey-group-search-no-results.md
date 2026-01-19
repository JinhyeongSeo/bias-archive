---
created: 2026-01-19T10:03
title: 하이키 그룹 검색 결과 없음 버그
area: api
files:
  - src/lib/namuwiki.ts
  - src/app/api/kpop/groups/route.ts
---

## Problem

BiasManager에서 그룹으로 검색 시 "하이키" (H1-KEY) 검색 결과가 여전히 나오지 않음.

Phase 32-01-FIX에서 나무위키 폴백 검색을 수정했다고 했으나, 하이키 그룹 검색 시 "검색결과 없음"으로 표시되는 문제가 지속됨.

가능한 원인:
1. 나무위키 문서 구조가 하이키 그룹에 대해 다를 수 있음
2. 그룹명 매칭 로직이 "하이키" / "H1-KEY" 변환을 제대로 처리하지 못할 수 있음
3. Googlebot UA 폴백이 하이키 문서에서 작동하지 않을 수 있음

## Solution

TBD - 디버깅 필요:
1. 나무위키에서 하이키 문서 직접 확인
2. API 응답 로그 확인
3. 그룹명 매칭 로직 점검
