# 통합검색 개선 계획

## 문제 1: heye 썸네일 오류 (영상 URL이 이미지 프록시로 전송됨)

### 원인

`UnifiedSearch.tsx` 라인 379, 425에서 모든 heye/kgirls 썸네일에 `getProxiedImageUrl()` 적용:

```typescript
thumbnailUrl: item.thumbnailUrl ? getProxiedImageUrl(item.thumbnailUrl) : null,
```

영상 URL(`.mp4`)도 wsrv.nl 이미지 프록시로 전송되어 로드 실패.

### 해결

ExternalSearch.tsx와 동일하게:

1. enrichment 단계에서 프록시 제거 (원본 URL 유지)
2. 렌더링 시점에 `isVideoUrl()` 체크 후 적절한 프록시 적용
3. 영상은 `<video>` 태그로, 이미지는 `<img>` 태그로 렌더링

### 수정 파일

- `src/components/UnifiedSearch.tsx`
  - 라인 379: heye 결과 - 원본 URL 유지
  - 라인 425: kgirls 결과 - 원본 URL 유지
  - 라인 1499-1509, 1582-1592: 썸네일 렌더링에 영상/이미지 분기 추가
  - import 추가: `getProxiedVideoUrl`, `isVideoUrl`

---

## 문제 2: 최애 목록 UI 개선 (드롭다운 → 팝업/드롭다운 클릭 선택)

### 현재 상태

- `<select>` 드롭다운으로 최애 목록 표시
- 최애가 많으면 스크롤해야 해서 불편

### 개선안

버튼 클릭 시 팝업으로 최애 목록을 보여주고, 클릭으로 선택하는 방식:

- 버튼 형태로 "내 최애 선택" 표시
- 클릭 시 드롭다운 팝업 열림
- 그룹별로 구분된 목록
- 검색 필터 (선택 사항)
- 클릭하면 선택되고 팝업 닫힘

### 수정 파일

- `src/components/UnifiedSearch.tsx`
  - `<select>` → 커스텀 드롭다운 컴포넌트로 변경
  - 상태 추가: `biasDropdownOpen`
  - 그룹별 정렬 및 표시
  - 외부 클릭 시 닫기

---

## 구현 순서

1. **heye 썸네일 수정** (먼저)
   - import 추가
   - enrichment에서 프록시 제거
   - 렌더링에서 영상/이미지 분기

2. **최애 목록 UI 개선**
   - 커스텀 드롭다운 구현
   - 그룹별 표시

## 검증

1. heye 검색 → 영상만 있는 게시물 썸네일 확인
2. kgirls 검색 → 썸네일 정상 표시 확인
3. 최애 목록 클릭 → 드롭다운 열림/닫힘 확인
4. 최애 선택 → 검색어 자동 입력 확인

---

*생성일: 2026-01-15*
