# UAT Issues: Phase 35 Plan 01

**Tested:** 2026-01-19
**Source:** .planning/phases/35-instagram-search/35-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

### UAT-001: Instagram URL 파서 메타데이터 추출 실패

**Discovered:** 2026-01-19
**Phase/Plan:** 35-01
**Severity:** Major
**Feature:** Instagram URL 저장
**Description:** Instagram 게시물 URL 입력 시 메타데이터(제목, 썸네일)가 추출되지 않고 링크만 저장됨. 뷰어에서도 링크로만 연결됨.
**Expected:** 제목과 썸네일이 자동 추출되어 LinkCard에 표시
**Actual:** 링크만 저장되고 메타데이터 없음
**Repro:**
1. 링크 추가 폼에 Instagram URL 입력 (예: https://www.instagram.com/p/xxx)
2. 제목/썸네일 추출 확인
3. 저장 후 LinkCard 확인

### UAT-002: Instagram 탭 기본 선택 상태 문제

**Discovered:** 2026-01-19
**Phase/Plan:** 35-01
**Severity:** Minor
**Feature:** UnifiedSearch Instagram 탭
**Description:** 통합검색 모달에서 Instagram 탭이 기본적으로 해제되어 있음. 다른 탭들처럼 기본 선택되어 있어야 함.
**Expected:** Instagram 탭이 기본적으로 선택(체크)되어 있음
**Actual:** 탭은 표시되지만 해제된 상태로 시작
**Repro:**
1. 통합검색 모달 열기
2. Instagram 탭 선택 상태 확인

### UAT-003: Instagram 검색 시 undefined map 에러

**Discovered:** 2026-01-19
**Phase/Plan:** 35-01
**Severity:** Blocker
**Feature:** Instagram 검색 기능
**Description:** Instagram 탭에서 검색 시 "Cannot read properties of undefined (reading 'map')" JavaScript 에러 발생
**Expected:** 검색 결과 표시 또는 "설정되지 않았습니다" 메시지
**Actual:** JavaScript 에러로 검색 불가
**Repro:**
1. 통합검색에서 Instagram 탭 선택
2. 검색어 입력 후 검색
3. 콘솔에서 에러 확인

## Resolved Issues

[None yet]

---

*Phase: 35-instagram-search*
*Plan: 01*
*Tested: 2026-01-19*
