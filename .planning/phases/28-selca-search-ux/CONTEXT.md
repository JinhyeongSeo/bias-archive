# Phase 28: Selca Search UX Improvement

**Created:** 2026-01-16

## Problem

Selca 검색이 영문 이름으로만 작동합니다:
- ✅ "winter", "yujin" 등 영문 검색 → 정상 작동
- ❌ "윈터", "유진" 등 한글 검색 → 404 에러 ("매칭되는 아이돌을 찾을 수 없습니다")

**원인:**
- selca.kastden.org 데이터에 한글 stage name이 없거나 불완전함
- `fetchIdolKoreanStageName()`이 "Stage name (original)" 필드를 찾지만 데이터가 비어있음
- 예: Winter → 본명 "김민정"은 있지만 stage name "윈터"는 없음

## User Impact

- 한국 사용자는 자연스럽게 한글로 검색하려고 시도함
- "윈터", "카리나", "원영" 등 한글 검색 시 결과 없음
- 영문 이름을 알아야만 검색 가능 (UX 저하)

## Solution Approaches

### Option 1: Bias 드롭다운 사용 (권장)

**장점:**
- 이미 구현된 BiasManager의 데이터 활용
- 정확한 아이돌 매칭 (한글/영문 모두 지원)
- 다른 플랫폼과 일관된 검색 흐름
- 그룹별 정리로 찾기 쉬움

**단점:**
- Bias에 등록된 아이돌만 검색 가능
- 자유 검색 불가능

**구현:**
- UnifiedSearch에 이미 있는 Bias 드롭다운을 selca에서도 활용
- 선택한 Bias의 name (영문)을 검색어로 사용
- 사용자는 한글 이름을 보고 선택, 내부적으로는 영문 검색

### Option 2: 한영 매핑 테이블

**장점:**
- 자유 검색 가능
- 모든 아이돌 검색 가능 (Bias 등록 불필요)

**단점:**
- 매핑 데이터 관리 부담
- 업데이트 필요 (신인 아이돌)
- 동명이인 처리 복잡

**구현:**
- 한글 → 영문 매핑 테이블 생성
- "윈터" → "winter" 자동 변환
- 매핑 없으면 원래 검색어로 시도

### Option 3: selca.kastden.org 데이터 개선

**장점:**
- 근본적인 해결
- 다른 사용자도 혜택

**단점:**
- 외부 사이트 의존
- 우리가 컨트롤 불가능
- 시간 소요

## Recommended Solution

**Option 1 (Bias 드롭다운) + Option 2 (기본 매핑) 하이브리드:**

1. **Primary UX:** Bias 드롭다운 사용
   - UnifiedSearch의 드롭다운에서 아이돌 선택
   - 선택한 Bias의 `name` (영문)으로 검색
   - 사용자는 한글 이름 보면서 선택

2. **Fallback:** 텍스트 입력 시 기본 매핑
   - 주요 아이돌 한영 매핑 (20-30명 정도)
   - "윈터" 입력 → "winter"로 자동 변환 후 검색
   - 매핑 없으면 원래 검색어로 시도

3. **User Guidance:**
   - Selca 탭 선택 시 안내 메시지:
     "아이돌을 선택하거나 영문 이름으로 검색하세요"
   - 검색 실패 시 친절한 에러 메시지:
     "매칭되는 아이돌이 없습니다. 아이돌 드롭다운에서 선택해보세요."

## Implementation Scope

**Phase 28-01: Selca 검색 UX 개선**

1. UnifiedSearch에서 selca 플랫폼일 때 Bias 드롭다운 활성화
2. Bias 선택 시 자동으로 영문 이름으로 검색
3. 주요 아이돌 한영 매핑 추가 (상위 30명)
4. 검색어 자동 변환 로직 구현
5. 안내 메시지 및 에러 메시지 개선

## Out of Scope

- selca.kastden.org 데이터베이스 수정
- 전체 아이돌 매핑 (500+ 명)
- 다른 언어 지원 (일본어, 중국어)

## Success Criteria

- [x] "윈터" 검색 시 결과 표시됨
- [x] Bias 드롭다운에서 선택한 아이돌 검색 정상 작동
- [x] 영문 검색은 기존처럼 작동
- [x] 매핑되지 않은 검색어는 원래대로 시도 (fallback)

## Dependencies

- Phase 27 완료 (selca 탭 기본 기능)
- BiasManager 데이터 (이미 구현됨)

## Timeline

- Estimated: ~20-30 min
- Simple UX 개선 작업

---

## 28-01 실행 결과 (FAILED)

### 구현 내용
- `fetchAllIdols()`에서 500+ 아이돌의 Stage name (original) 병렬 수집
- `searchMembers()`에서 `name_stage_ko` 검색 추가
- 매핑 테이블 제거

### 문제점
- **15초 타임아웃 초과**: 500+ 아이돌 페이지 방문으로 검색 실패
- 에러: `요청 시간이 초과되었습니다`
- 성능: 10-30초 소요 (캐시 전)

### 교훈
- selca.kastden.org는 모든 아이돌 데이터를 한번에 가져오기에 너무 느림
- 사용자가 실제로 검색할 아이돌만 데이터 저장하는 방식 필요

---

## 28-02 새로운 접근 (권장)

### 핵심 아이디어
**Bias에 selca_slug 저장하고, 검색 시 Bias 매칭으로 즉시 검색**

### 장점
1. **즉시 검색**: Bias에 등록된 아이돌은 <1초에 검색
2. **타임아웃 없음**: 500+ 아이돌 데이터 불필요
3. **자동 관리**: Bias 추가 시 selca_slug 자동 저장
4. **점진적 개선**: 사용자가 추가하는 아이돌만 데이터 채워짐

### 구현 계획
1. `biases` 테이블에 `selca_slug` 컬럼 추가
2. BiasManager에서 Bias 추가 시 selca_slug 저장
3. UnifiedSearch에서 Bias 매칭 → selca_slug 사용
4. Bias에 없는 아이돌은 기존 방식 (fallback)

### 성능 비교
| 방식 | 검색 속도 | 타임아웃 | 데이터 범위 |
|------|----------|---------|-----------|
| 28-01 | 10-30초 | 발생 | 500+ 아이돌 |
| 28-02 | <1초 | 없음 | Bias만 |
