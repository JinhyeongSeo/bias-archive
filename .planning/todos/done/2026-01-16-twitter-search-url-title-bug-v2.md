---
created: 2026-01-16T00:00
title: Twitter 검색 결과 URL 제목 저장 버그 (미해결)
area: api
files:
  - src/components/UnifiedSearch.tsx
  - src/lib/scrapebadger.ts
  - src/lib/parsers/twitter.ts
---

## Problem

통합검색에서 Twitter 검색 시 검색 결과가 비정상적으로 표시됨.

증상:
- 검색 결과에서 썸네일 표시 안됨
- 제목이 URL로 표시됨 (예: `https://twitter.com/roraaface/status/2012017249390117314`)
- 저장해도 동일하게 비정상 표시

이전 시도 (0f34734):
- metadata API가 URL을 title로 반환할 때 원래 result.title 사용하도록 수정
- 하지만 문제 해결 안됨

## Solution

TBD - 추가 조사 필요

가능한 원인:
1. ScrapeBadger 응답 자체에서 user_name/username이 비어있는 경우
2. 검색 캐시에 이미 잘못된 데이터가 저장된 경우
3. 다른 곳에서 title이 덮어씌워지는 경우

디버깅 필요:
- ScrapeBadger API 실제 응답 로깅
- 검색 캐시 데이터 확인
- 저장 플로우 전체 추적
