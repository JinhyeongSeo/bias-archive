---
created: 2026-01-19T14:30
title: Twitter 검색 중 캐시된 결과 표시 차단 버그
area: ui
files:
  - src/components/UnifiedSearch.tsx
  - src/app/api/search/twitter/route.ts
---

## Problem

통합검색에서 Twitter 검색이 오래 걸릴 때, 검색 진행 중에 다른 플랫폼의 캐시된 결과가 표시되지 않는 문제.

현재 동작:
1. 검색 시작
2. Twitter 검색이 진행 중 (느림)
3. 다른 플랫폼(YouTube, heye, kgirls 등)의 캐시된 결과가 있어도 표시 안됨
4. Twitter 검색 완료 후에야 모든 결과가 한꺼번에 표시됨

기대 동작:
- 캐시된 결과는 즉시 표시
- 각 플랫폼 검색이 완료되는대로 개별적으로 결과 추가
- Twitter가 느려도 다른 플랫폼 결과는 바로 볼 수 있어야 함

## Solution

TBD - 아마도 검색 로직이 모든 플랫폼을 Promise.all로 기다린 후 한꺼번에 결과를 업데이트하는 구조로 보임. 각 플랫폼별 독립적인 상태 업데이트로 변경 필요.
