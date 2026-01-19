---
created: 2026-01-19T15:30
title: Add expired search cache cleanup job
area: database
files:
  - src/lib/searchCache.ts:57-66
  - src/app/api/search/cache/route.ts:32
---

## Problem

DB의 `search_cache` 테이블에 1월 15일 등 오래된 캐시 데이터가 계속 남아있음.

현재 구현:
- GET 요청 시 24시간 TTL 필터로 오래된 캐시는 **조회되지 않음** (line 32: `.gte('cached_at', ...)`)
- 하지만 DB에서 실제로 **삭제하는 로직이 없음**

결과:
- 조회 시에는 정상 작동 (오래된 캐시 무시)
- DB에는 만료된 캐시가 무한히 쌓임 (스토리지 낭비)

## Solution

옵션 1: Supabase Edge Function으로 cron job 생성 (매일 1회 만료 캐시 삭제)
옵션 2: Supabase Database Function + pg_cron 확장 사용
옵션 3: API 요청 시 확률적으로 정리 (e.g., 1% 확률로 DELETE 실행)

현재 긴급하지 않음 - 조회는 정상 작동하고 있으며 스토리지 비용만 영향.
