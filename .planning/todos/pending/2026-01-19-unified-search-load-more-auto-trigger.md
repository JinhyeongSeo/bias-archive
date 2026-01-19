---
created: 2026-01-19T14:03
title: 통합검색 더보기 버튼 자동 트리거 버그
area: ui
files:
  - src/components/UnifiedSearch.tsx
---

## Problem

통합검색에서 검색 후 "더보기" 버튼이 비정상적으로 동작함.

증상:
- 이미 6개 결과가 표시되고 있는 상태에서 더보기가 자동으로 눌림
- 사용자가 클릭하지 않았는데 자동으로 더 많은 결과 로드
- 결과 표시가 "다 이상해짐"

추정 원인:
- Intersection Observer 또는 무한 스크롤 로직이 잘못 트리거되는 것으로 보임
- 초기 로드 시점에 더보기 버튼이 뷰포트 내에 있어서 자동 트리거될 가능성
- 또는 로딩 상태 관리 문제

## Solution

TBD - 추가 조사 필요

디버깅 필요:
- UnifiedSearch의 더보기/페이지네이션 로직 확인
- Intersection Observer 트리거 조건 확인
- 초기 로드 vs 추가 로드 상태 구분 확인
