# UAT Issues: Phase 5

**Tested:** 2026-01-13
**Source:** .planning/phases/05-viewer-timeline/*.SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

### UAT-001: Twitter 트윗이 뷰어 모달에서 2번 표시됨

**Discovered:** 2026-01-13
**Phase/Plan:** 05-03
**Severity:** Major
**Feature:** Twitter 임베드 뷰어
**Description:** Twitter 링크의 뷰어 모달을 열면 같은 트윗이 2번 표시됨
**Expected:** 트윗이 1번만 표시되어야 함
**Actual:** 동일한 트윗이 모달 내에서 2개로 중복 렌더링됨
**Repro:**
1. 저장된 Twitter 링크 카드에서 썸네일 또는 재생 버튼 클릭
2. 뷰어 모달이 열림
3. 같은 트윗이 2번 표시됨

### UAT-002: 뷰어 내 Twitter 이미지 클릭 시 원본 페이지로 이동

**Discovered:** 2026-01-13
**Phase/Plan:** 05-03
**Severity:** Major
**Feature:** Twitter 임베드 뷰어 이미지 갤러리
**Description:** 뷰어 모달 내에서 Twitter 이미지를 클릭하면 이미지가 크게 보여야 하는데, 대신 Twitter 원본 페이지로 이동됨
**Expected:** 이미지 클릭 시 이미지가 확대되거나 갤러리 내비게이션이 동작해야 함
**Actual:** 이미지 클릭 시 Twitter 원본 페이지로 이동됨
**Repro:**
1. 저장된 Twitter 링크의 뷰어 모달 열기
2. 모달 내 이미지 클릭
3. Twitter 원본 페이지로 이동됨

### UAT-003: Twitter 영상 링크 썸네일이 깨짐

**Discovered:** 2026-01-13
**Phase/Plan:** 02-03 (파서) / 05-03 (표시)
**Severity:** Major
**Feature:** Twitter 영상 메타데이터 추출 및 썸네일 표시
**Description:** Twitter 영상 링크를 저장할 때 썸네일이 제대로 표시되지 않음
**Expected:** 영상 썸네일이 정상적으로 표시되어야 함
**Actual:**
- URL 추가 시 미리보기에서 썸네일이 표시되지 않음
- 저장 후 링크 카드에 깨진 이미지 아이콘 표시
**Repro:**
1. Twitter 영상 링크 URL 입력
2. 미리보기에서 썸네일 없음 확인
3. 저장 후 링크 카드에 깨진 이미지 아이콘 확인

### UAT-004: Weverse 링크 클릭 시 뷰어 모달이 안 열림

**Discovered:** 2026-01-13
**Phase/Plan:** 05-03
**Severity:** Major
**Feature:** Weverse 임베드 뷰어
**Description:** Weverse 링크는 저장되지만, 클릭해도 뷰어 모달이 열리지 않음
**Expected:** Weverse 링크도 클릭 시 뷰어 모달이 열려야 함
**Actual:** 클릭해도 아무 반응 없음 (모달이 안 뜸)
**Repro:**
1. Weverse 링크 저장
2. 저장된 Weverse 링크 카드의 썸네일 클릭
3. 모달이 열리지 않음

### UAT-005: Twitter 이미지 링크에도 재생 버튼이 표시됨

**Discovered:** 2026-01-13
**Phase/Plan:** 05-03
**Severity:** Minor
**Feature:** LinkCard 재생 버튼 표시
**Description:** Twitter 이미지 트윗(영상 아님)에도 재생 버튼이 표시됨
**Expected:** 재생 버튼은 영상 콘텐츠(YouTube, Twitter 영상)에만 표시되어야 함
**Actual:** 모든 Twitter 링크에 재생 버튼이 표시됨
**Repro:**
1. Twitter 이미지 트윗 저장
2. 링크 카드에 재생 버튼이 표시됨 (영상이 아닌데)

## Resolved Issues

[None yet]

---

*Phase: 05-viewer-timeline*
*Tested: 2026-01-13*
