---
phase: 22-namuwiki-idol-data
plan: 22-FIX
type: fix
---

<objective>
Fix 3 UAT issues from Phase 22 Selca K-pop Data integration.

Source: 22-ISSUES.md
Priority: 0 critical, 1 major, 2 minor

**핵심 이슈:** selca.ts 파서가 한글명을 제대로 파싱하지 못해 '그룹으로 추가' 시 영어명만 저장됨
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/22-namuwiki-idol-data/22-ISSUES.md

**Original implementation:**
@src/lib/parsers/selca.ts

**API routes using selca parser:**
@src/app/api/kpop/groups/route.ts
@src/app/api/kpop/groups/[id]/members/route.ts
@src/app/api/kpop/members/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Analyze selca.kastden.org HTML structure</name>
  <files>N/A - research only</files>
  <action>
selca.kastden.org의 실제 HTML 구조를 분석하여 파싱 로직 수정에 필요한 정보 수집:

1. 그룹 목록 페이지 (/noona/group/) 분석:
   - 그룹 행에서 멤버 수가 어디에 있는지 확인
   - UAT-001 해결을 위한 정보

2. 그룹 상세 페이지 (/noona/group/{slug}/) 분석:
   - 멤버 테이블 구조 확인
   - Stage name과 Korean name이 어느 컬럼에 있는지 확인
   - 현재 코드가 Real Name 컬럼(td[1])에서 한글명을 찾는데, 실제 구조와 맞는지 확인
   - UAT-002 해결을 위한 정보

WebFetch로 실제 HTML을 가져와서 구조 파악 후 Task 2에서 수정.
  </action>
  <verify>HTML 구조 분석 완료, 수정 방향 결정됨</verify>
  <done>selca HTML 구조 파악 완료</done>
</task>

<task type="auto">
  <name>Task 2: Fix UAT-002 - 한글명 파싱 로직 수정</name>
  <files>src/lib/parsers/selca.ts</files>
  <action>
getGroupMembers() 함수 수정:

현재 문제:
- Real Name 컬럼에서 `(한글이름)` 패턴을 찾지만, selca 사이트 구조가 다를 수 있음
- Stage Name 컬럼에서 한글 Stage Name을 찾아야 할 수도 있음

Task 1 분석 결과에 따라 수정:
- 올바른 컬럼에서 한글명 추출
- name_original 필드에 한글명 저장
- 한글명이 없으면 영어명으로 fallback

테스트: IVE 그룹 멤버 조회 시 한글명이 포함되는지 확인
  </action>
  <verify>npm run build 성공, API 응답에 한글명 포함</verify>
  <done>getGroupMembers()가 한글명을 정상적으로 반환</done>
</task>

<task type="auto">
  <name>Task 3: Fix UAT-001 - 그룹 멤버 수 표시</name>
  <files>src/lib/parsers/selca.ts</files>
  <action>
현재 문제: memberCount가 항상 0으로 하드코딩됨 (137행)

두 가지 해결 방안 중 선택:

Option A (권장): 그룹 목록 페이지에서 멤버 수 파싱
- /noona/group/ 페이지의 테이블에 멤버 수 컬럼이 있으면 파싱
- fetchAllGroups()에서 memberCount 설정

Option B: 개별 요청 시 멤버 수 조회
- searchGroups() 호출 시 각 그룹의 멤버 수를 별도 조회 (느림)
- 캐시 활용으로 완화 가능

Task 1 분석 결과에 따라 구현.
  </action>
  <verify>npm run build 성공, 그룹 검색 시 멤버 수 표시</verify>
  <done>그룹 자동완성에서 실제 멤버 수가 표시됨</done>
</task>

<task type="auto">
  <name>Task 4: UAT-004 검토 - 검색 성능 분석</name>
  <files>src/lib/parsers/selca.ts</files>
  <action>
현재 구조 분석:
- fetchAllIdols()는 전체 아이돌 목록을 가져옴
- 5분 TTL 캐시 사용 중
- 첫 요청 시 느리고, 캐시 후에는 빠름

성능 개선 옵션:
1. 캐시 TTL 연장 (5분 → 30분): 간단하지만 데이터 신선도 감소
2. 프리페칭: 서버 시작 시 미리 로드 (복잡도 증가)
3. 현재 상태 유지: 이미 캐시가 작동 중이므로 심각한 문제 아님

**결정:** 캐시 TTL을 10분으로 연장. 더 복잡한 최적화는 불필요.
(첫 요청 느림은 외부 API 특성상 불가피)
  </action>
  <verify>npm run build 성공</verify>
  <done>캐시 TTL 연장 (5분 → 10분)</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>selca.ts 파서 수정 완료 - 한글명 파싱, 멤버 수 표시, 캐시 TTL 연장</what-built>
  <how-to-verify>
1. npm run dev 실행
2. BiasManager → '그룹으로 추가' 클릭
3. "IVE" 검색 → 자동완성에서 멤버 수가 6명(또는 실제 멤버 수)으로 표시되는지 확인
4. IVE 선택 → 멤버 목록에서 한글명이 표시되는지 확인 (예: "Wonyoung (장원영)" 또는 "장원영")
5. 멤버 선택 후 '모두 추가' → 저장된 최애에 한글명이 포함되는지 확인
  </how-to-verify>
  <resume-signal>"approved" 또는 문제 설명</resume-signal>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] npm run build 성공
- [ ] 그룹 검색 시 멤버 수 표시 (UAT-001)
- [ ] 멤버 조회 시 한글명 포함 (UAT-002)
- [ ] 캐시 TTL 연장 적용 (UAT-004)
- [ ] 사용자 검증 통과
</verification>

<success_criteria>
- 모든 UAT 이슈 해결
- 기존 기능 정상 작동
- 빌드 성공
</success_criteria>

<output>
After completion, create `.planning/phases/22-namuwiki-idol-data/22-FIX-SUMMARY.md`
</output>
