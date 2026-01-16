# UAT Issues: Phase 22 (Selca K-pop Data)

**Tested:** 2026-01-16
**Source:** .planning/phases/22-namuwiki-idol-data/22-01-SUMMARY.md, 22-02-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None - all issues resolved]

## Resolved Issues

### UAT-001: 그룹 자동완성에서 멤버 수가 0명으로 표시됨

**Discovered:** 2026-01-16
**Resolved:** 2026-01-16 - Fixed in 22-FIX
**Commit:** cd3df78
**Phase/Plan:** 22-01
**Severity:** Minor
**Feature:** 그룹 검색 자동완성
**Description:** 그룹 검색 시 자동완성 드롭다운에서 멤버 수가 0명으로 표시됨.
**Fix:** searchGroups()에서 각 그룹의 getGroupMembers()를 병렬 호출하여 실제 멤버 수 반환

### UAT-002: selca 파서가 한글명을 파싱하지 못함

**Discovered:** 2026-01-16
**Resolved:** 2026-01-16 - Fixed in 22-FIX
**Commit:** cd3df78
**Phase/Plan:** 22-01
**Severity:** Major
**Feature:** 그룹 멤버 조회 / 일괄 추가
**Description:** '그룹으로 추가' 기능 사용 시 selca.ts 파서에서 가져온 멤버 데이터에 한글 활동명이 포함되지 않음.
**Root Cause:** 그룹 멤버 테이블에는 본명만 있고 한글 활동명은 개별 아이돌 페이지에만 있음
**Fix:** fetchIdolKoreanStageName() 함수 추가, 각 멤버의 개별 페이지에서 "Stage name (original)" 파싱

### UAT-004: 개별 멤버 검색 속도가 느림

**Discovered:** 2026-01-16
**Resolved:** 2026-01-16 - Fixed in 22-FIX
**Commit:** cd3df78
**Phase/Plan:** 22-01
**Severity:** Minor
**Feature:** 개별 멤버 검색
**Description:** '최애 추가'로 개별 멤버 이름 검색 시 자동완성 반응 속도가 느림
**Fix:** 캐시 TTL 5분 → 10분으로 연장. 추가로 검색 레이스 컨디션 해결 (AbortController)

---

*Phase: 22-namuwiki-idol-data*
*Tested: 2026-01-16*
*All issues resolved: 2026-01-16*
