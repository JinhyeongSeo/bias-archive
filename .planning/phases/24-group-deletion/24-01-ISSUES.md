# UAT Issues: Phase 24 Plan 01

**Tested:** 2026-01-16
**Source:** .planning/phases/24-group-deletion/24-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None - all issues resolved]

## Resolved Issues

### UAT-001: 그룹 삭제 버튼이 표시되지 않음

**Discovered:** 2026-01-16
**Phase/Plan:** 24-01
**Severity:** Blocker (originally)
**Feature:** 그룹 삭제 버튼 표시
**Description:** BiasManager에서 그룹 헤더에 마우스를 올려도 삭제 버튼(X 아이콘)이 나타나지 않음
**Resolved:** 2026-01-16 - 두 가지 문제 수정
1. `group-hover/header` → `group-hover`로 변경 (Tailwind CSS 4 호환성)
2. 모바일에서도 보이도록 `md:opacity-0 md:group-hover:opacity-100`으로 수정

### UAT-002: 그룹 삭제 시 멤버도 함께 삭제 요구

**Discovered:** 2026-01-16
**Phase/Plan:** 24-01
**Severity:** Change Request
**Feature:** 그룹 삭제 동작
**Description:** 원래 구현은 그룹 삭제 시 멤버를 "그룹 없음"으로 이동했으나, 사용자가 그룹+멤버 모두 삭제를 원함
**Resolved:** 2026-01-16
1. DELETE /api/groups/[id]에서 그룹 삭제 전 해당 그룹의 biases 먼저 삭제
2. 확인 메시지를 '그룹과 그 안의 모든 멤버를 삭제하시겠습니까?'로 변경

---

*Phase: 24-group-deletion*
*Plan: 01*
*Tested: 2026-01-16*
