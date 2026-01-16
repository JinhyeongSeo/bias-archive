---
created: 2026-01-16T00:00
title: heye 영상 첫 컨텐츠 썸네일 미표시 버그
area: api
files:
  - src/lib/parsers/heye.ts
  - src/app/api/search/heye/route.ts
---

## Problem

heye.kr에서 영상이 첫번째 컨텐츠일 경우 통합검색에서 썸네일이 표시되지 않는 버그가 있음.

heye 파서가 이미지와 영상 모두를 추출하지만, 첫번째 컨텐츠가 영상일 때 썸네일 이미지가 없어서 검색 결과에 썸네일이 나타나지 않는 것으로 보임.

## Solution

TBD - heye 파서에서 영상의 poster 이미지를 추출하거나, 영상이 첫 컨텐츠일 경우 다음 이미지를 썸네일로 사용하는 로직 검토 필요
