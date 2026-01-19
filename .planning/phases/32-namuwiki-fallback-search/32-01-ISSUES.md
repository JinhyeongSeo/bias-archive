# UAT Issues: Phase 32 Plan 01

**Tested:** 2026-01-19
**Source:** .planning/phases/32-namuwiki-fallback-search/32-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[All issues resolved]

## Resolved Issues

### UAT-001: selca 출처 배지가 표시되지 않음 ✓

**Discovered:** 2026-01-19
**Resolved:** 2026-01-19
**Phase/Plan:** 32-01
**Severity:** Minor
**Feature:** Selca 검색 출처 표시
**Description:** selca에 있는 그룹(IVE 등) 검색 시 보라색 'selca' 배지가 표시되지 않음
**Fix:** BiasManager 그룹 검색 드롭다운과 선택된 그룹 헤더에 selca 출처 배지(보라색) 추가
**Commit:** 6c9899b

### UAT-002: Namuwiki 폴백 검색이 작동하지 않음 ✓

**Discovered:** 2026-01-19
**Resolved:** 2026-01-19
**Phase/Plan:** 32-01
**Severity:** Major
**Feature:** Namuwiki 폴백 검색
**Description:** selca에 없는 그룹('하이키') 검색 시 namuwiki 폴백이 작동하지 않고 검색 결과가 없음
**Fix:** Googlebot UA로 SSR 콘텐츠 수신, 빈도 기반 멤버 필터링 (3+ 언급), 1-3글자 한글 이름 지원
**Commit:** 9f666f8
**Verification:** 하이키 → H1-KEY 그룹명 + 5명 멤버 (서이, 리이나, 휘서, 옐, 시탈라) 정상 반환

---

*Phase: 32-namuwiki-fallback-search*
*Plan: 01*
*Tested: 2026-01-19*
