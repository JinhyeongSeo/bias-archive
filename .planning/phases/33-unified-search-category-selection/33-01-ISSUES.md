# UAT Issues: Phase 33 Plan 01

**Tested:** 2026-01-19
**Source:** .planning/phases/33-unified-search-category-selection/33-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

### UAT-001: 플랫폼별 선택/해제 버튼이 표시되지 않음

**Discovered:** 2026-01-19
**Phase/Plan:** 33-01
**Severity:** Blocker
**Feature:** 플랫폼별 선택 UI
**Description:** 각 플랫폼 헤더(YouTube, Twitter, heye 등)에 '선택/해제' 토글 버튼이 아예 보이지 않음
**Expected:** 각 플랫폼 헤더에 선택/해제 버튼이 표시되어 해당 플랫폼의 모든 결과를 일괄 선택/해제할 수 있어야 함
**Actual:** 버튼이 표시되지 않음
**Repro:**
1. 통합 검색 모달 열기
2. 아이돌 선택 후 검색 실행
3. 검색 결과의 각 플랫폼 헤더 확인

### UAT-002: 플랫폼별 선택 개수가 표시되지 않음

**Discovered:** 2026-01-19
**Phase/Plan:** 33-01
**Severity:** Major
**Feature:** 플랫폼별 선택 개수 표시
**Description:** 플랫폼 헤더에 선택된 항목 수가 표시되지 않음 (예: "YouTube (2/5)" 형식)
**Expected:** 각 플랫폼 헤더에 "(선택수/전체수)" 형식으로 선택 상태 표시
**Actual:** 선택 개수 정보 없음
**Repro:**
1. 통합 검색 모달에서 검색 실행
2. 일부 항목 수동 선택
3. 플랫폼 헤더 영역 확인

### UAT-003: 전체 선택 헤더에 플랫폼 수 정보 없음

**Discovered:** 2026-01-19
**Phase/Plan:** 33-01
**Severity:** Minor
**Feature:** 전체 선택 플랫폼 정보
**Description:** 전체 선택 버튼 영역에 플랫폼 수 정보가 표시되지 않음
**Expected:** "전체 선택 (5개 플랫폼)" 같은 형식으로 플랫폼 수 정보 표시
**Actual:** 플랫폼 수 정보 없음
**Repro:**
1. 통합 검색 모달에서 검색 실행
2. 전체 선택 버튼 영역 확인

## Resolved Issues

[None yet]

---

*Phase: 33-unified-search-category-selection*
*Plan: 01*
*Tested: 2026-01-19*
