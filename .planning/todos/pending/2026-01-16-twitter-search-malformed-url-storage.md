---
created: 2026-01-16T00:00
title: 통합검색 Twitter 검색 결과에 HTML 태그 포함되는 버그
area: api
files:
  - src/app/api/search/twitter/route.ts
---

## Problem

통합검색에서 Twitter 검색 시 검색 결과 자체가 비정상적으로 표시됨.

예시 (검색 결과 URL에 HTML 태그가 포함됨):

```html
<h4 class="text-[11px] sm:text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">https://twitter.com/roraaface/status/2012017249390117314</h4>
```

증상:

- 검색 결과에서 썸네일 표시 안됨
- 제목이 저런 HTML 포함 주소로 표시됨
- 저장해도 동일하게 비정상 표시

원인 추정:

- Twitter 검색 API (Google CSE 또는 ScrapeBadger) 응답 파싱 시 HTML 태그가 포함된 채로 URL 반환
- 응답에서 URL 추출할 때 HTML 스트립 처리 누락

## Solution

TBD - Twitter 검색 API 응답 파싱 로직에서 HTML 태그 제거 필요
