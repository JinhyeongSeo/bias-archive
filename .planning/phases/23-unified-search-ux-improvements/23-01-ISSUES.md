# UAT Issues: Phase 23 Plan 01

**Tested:** 2026-01-16
**Source:** .planning/phases/23-unified-search-ux-improvements/23-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None - all issues resolved in 23-01-FIX2]

## Resolved Issues

### UAT-007: 드롭다운 높이가 검색어 선택 후 답답함

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Major
**Feature:** 커스텀 아이돌 선택 드롭다운
**Resolution:** Fixed in 23-01-FIX2 (commit `2b2c635`)

- max-h-48 (192px) → max-h-80 (320px)로 드롭다운 높이 확장
- 더 많은 아이돌/그룹을 스크롤 없이 표시 가능

### UAT-008: 성 제거 로직이 예명에도 적용되는 버그

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Major
**Feature:** 아이돌 선택 시 검색어 설정
**Resolution:** Fixed in 23-01-FIX2 (commit `2b2c635`)

- 한국 상위 100개 성씨 목록 추가
- 성 제거 조건: 정확히 3글자 한글 + 첫 글자가 한국 성씨
- "장원영" → "원영" (3글자, "장"은 성씨) ✓
- "윈터" → "윈터" (2글자) ✓
- "카리나" → "카리나" (3글자, "카"는 성씨 아님) ✓

### UAT-001: 그룹이 처음부터 펼쳐진 상태로 열림

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Minor
**Feature:** 그룹 접기/펼치기
**Resolution:** Fixed in 23-01-FIX (commit `88a4e7d`)
- 드롭다운 열릴 때 모든 그룹을 collapsedDropdownGroups에 추가하여 기본 접힌 상태로 시작

### UAT-002: 그룹 이름이 언어 모드에 관계없이 "한글명 영어명" 형식으로 표시/입력됨

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Major
**Feature:** 그룹 선택으로 검색
**Resolution:** Fixed in 23-01-FIX (commit `b800c6b`)
- useLocale()로 현재 언어 모드 확인
- getGroupDisplayName 헬퍼 추가: ko 모드면 name_ko, en 모드면 name_en 사용
- 드롭다운 표시, 선택 표시, 검색어 설정 모두 언어 모드 적용

### UAT-003: 아이돌 그룹이 순서대로 표시되지 않음

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Minor
**Feature:** 아이돌 드롭다운 목록
**Resolution:** Fixed in 23-01-FIX (commit `5dab2b8`)
- groupedBiases Map 생성 시 groups 배열을 sort_order로 정렬 후 순서대로 추가

### UAT-004: 그룹 멤버 이름 들여쓰기 부족

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Cosmetic
**Feature:** 그룹 접기/펼치기
**Resolution:** Fixed in 23-01-FIX (commit `465eed3`)
- pl-4 → pl-6 + ml-4로 들여쓰기 증가
- border-l-2로 시각적 연결선 추가
- bullet marker (•) 추가로 계층 구조 명확화

### UAT-005: 아이돌 검색 시 성 포함 전체 이름 사용

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Major
**Feature:** 개별 아이돌 선택으로 검색
**Resolution:** Fixed in 23-01-FIX (commit `56d2f3c`)
- removeKoreanSurname 헬퍼 함수 추가
- 한글 2-4자 이름인 경우 첫 글자(성) 제거
- 예: "장원영" → "원영"으로 검색

### UAT-006: 드롭다운이 모달 밖으로 나가지 못함

**Discovered:** 2026-01-16
**Phase/Plan:** 23-01
**Severity:** Minor
**Feature:** 커스텀 드롭다운 UI
**Resolution:** Fixed in 23-01-FIX (commit `485c2be`)
- max-h-64 → max-h-48로 축소 (256px → 192px)
- 드롭다운이 모달 경계 내에서 완전히 표시됨

---

*Phase: 23-unified-search-ux-improvements*
*Plan: 01*
*Tested: 2026-01-16*
*All issues resolved: 2026-01-16*
