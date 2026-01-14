# UAT Issues: Phase 13 Plan 01

**Tested:** 2026-01-14
**Source:** .planning/phases/13-enhanced-tag-matching/13-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

### UAT-002: 언어 전환 시 태그 표시도 해당 언어로 변경 필요

**Discovered:** 2026-01-14
**Phase/Plan:** 13-01
**Severity:** Major
**Feature:** 태그 다국어 표시
**Description:** 현재 태그는 항상 bias.name(표시 이름)으로 저장/표시됨. 언어 모드를 변경해도 태그는 그대로임. 사용자는 언어 전환 시 태그도 해당 언어(name_en/name_ko)로 표시되길 원함.
**Expected:** 영어 모드에서는 태그가 "Sullyoon", 한글 모드에서는 "설윤"으로 표시
**Actual:** 언어 모드와 상관없이 항상 bias.name으로 표시
**Note:** 이것은 Phase 13 범위(autoTag 양방향 매칭)를 넘어서는 새로운 요구사항. 별도 Phase 추가 검토 필요.

## Resolved Issues

### UAT-001: 그룹 이름 매칭 시 멤버 전체 태그 대신 그룹명 태그로 변경 ✓

**Resolved:** 2026-01-14
**Fix:** 13-01-FIX.md
**Description:** extractAutoTags에서 그룹 이름 매칭 시 bias.group_name을 태그로 추가하도록 변경
**Before:** matchedTags.add(bias.name) → 멤버 전체 태그
**After:** matchedTags.add(bias.group_name) → 그룹명만 태그

---

*Phase: 13-enhanced-tag-matching*
*Plan: 01*
*Tested: 2026-01-14*
