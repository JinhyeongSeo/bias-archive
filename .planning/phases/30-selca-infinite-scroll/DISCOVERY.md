# Phase 30: Selca Infinite Scroll - Discovery

## 목표

selca.kastden.org의 무한 스크롤 페이지네이션 메커니즘을 분석하여 API 구현에 필요한 정보 파악

## 현재 구현 상태

### 기존 코드 분석

**src/app/api/search/selca/route.ts (현재):**
```typescript
// Step 4: Pagination (미구현)
// selca.kastden.org는 무한 스크롤 방식으로 max_time_id 파라미터 사용
// Phase 30에서 구현 예정
const hasNextPage = false
```

**ExternalSearch.tsx (현재):**
- `selcaPage`, `selcaHasNextPage` 상태 관리 존재
- `handleSelcaPageChange()` 함수 이미 구현됨
- 페이지네이션 UI는 이미 렌더링 중 (1081-1103 라인)

**현재 동작:**
1. `/owner/{idolSlug}/` URL에서 초기 미디어 목록 로드
2. `a[href^="/media/"]` 링크 파싱하여 결과 추출
3. 20개 결과로 제한 (`pageSize = 20`)
4. `hasNextPage = false` 고정

## Discovery Level

**Level 2 - Standard Research (15-30분)**

**이유:**
- 외부 API 통합 (selca.kastden.org의 페이지네이션 메커니즘 파악)
- 네트워크 요청 역공학 필요
- 중간 위험도 (잘못 구현 시 무한 루프 또는 타임아웃 가능)

## 조사 방법

### 1. 네트워크 요청 분석

selca.kastden.org 사이트에서 실제 무한 스크롤 동작 시 발생하는 네트워크 요청 확인 필요.

**예상 패턴 (코드 주석 기반):**
- URL 파라미터: `max_time_id` (코드 주석에서 언급)
- 무한 스크롤 방식으로 추가 데이터 로딩

**확인 필요 사항:**
1. 초기 페이지 로드 시 HTML 응답에 포함된 미디어 개수
2. 스크롤 트리거 시 AJAX/Fetch 요청 URL 형식
3. `max_time_id` 파라미터 값 결정 방법 (마지막 미디어 ID? 타임스탬프?)
4. 응답 형식 (HTML fragment? JSON? Full page?)
5. 마지막 페이지 감지 방법

### 2. HTML 구조 분석

**현재 파싱 로직:**
```typescript
const mediaLinks = root.querySelectorAll('a[href^="/media/"], a[href^="/original/"]')
```

**확인 필요:**
- `/media/` 또는 `/original/` URL에 포함된 ID 추출 방법
- `max_time_id`로 사용할 수 있는 미디어 식별자 위치
- 추가 로드된 컨텐츠의 HTML 구조 일관성

### 3. 페이지네이션 엔드포인트

**가능성 1: Query Parameter 방식**
```
https://selca.kastden.org/owner/{idolSlug}/?max_time_id={id}
```

**가능성 2: 별도 AJAX 엔드포인트**
```
https://selca.kastden.org/api/owner/{idolSlug}/more/?max_time_id={id}
```

**가능성 3: 페이지 번호 방식**
```
https://selca.kastden.org/owner/{idolSlug}/?page={n}
```

## 조사 결과 ✅

### 네트워크 요청 패턴 (확인 완료)

**예시 사이트:** https://selca.kastden.org/owner/aespa_winter/

1. **초기 로드:**
   - URL: `https://selca.kastden.org/owner/aespa_winter/`
   - 응답: HTML (미디어 목록 포함, 약 75개)
   - Method: GET

2. **다음 페이지 로드:**
   - URL: `https://selca.kastden.org/owner/aespa_winter/?max_time_id=6595830&o=BSOrcHa4OKi_MHPG`
   - Method: GET
   - 파라미터:
     - `max_time_id`: 마지막 미디어 ID (현재 페이지에서 가장 오래된 미디어)
     - `o`: 세션/정렬 토큰 (선택적, 없어도 동작할 가능성 높음)
   - 응답: HTML 전체 페이지 (다음 75개 미디어)

### HTML 구조 (확인 완료)

**실제 구조:**
```html
<!-- 썸네일 링크 -->
<a href="/thumb/6753580.jpg">
  <img src="/thumb/6753580.jpg" />
</a>

<!-- 원본 링크 -->
<a href="/original/6753580/609561368_17972030372989784_775230776691192814_n.jpg">
  <img src="/thumb/6753580.jpg" />
</a>
```

**미디어 ID 추출:**
- `/original/{미디어ID}/...` 또는 `/thumb/{미디어ID}.jpg` 패턴
- 미디어 ID는 6자리 숫자 (예: 6753580, 6595830)
- ID는 내림차순으로 정렬됨 (최신이 큰 숫자)

**초기 로드 미디어 개수:** 약 75개

### max_time_id 메커니즘 (확인 완료)

**동작 방식:**
1. 초기 로드: `GET /owner/{idolSlug}/` → 최신 75개 미디어 반환
2. 현재 페이지에서 **가장 작은(오래된) 미디어 ID** 추출
3. 다음 페이지 요청: `GET /owner/{idolSlug}/?max_time_id={마지막ID}`
4. 서버는 해당 ID보다 **오래된(작은) 미디어**를 다음 75개 반환

**예시 (aespa_winter):**
- 페이지 1: ID 6753580 (최신) ~ 6595830 (최오래)
- 페이지 2 요청: `?max_time_id=6595830`
- 페이지 2 응답: ID 6595829 (이전 페이지 직후) ~ 6XXXXXX (더 오래된)

**마지막 페이지 감지:**
- 응답에서 파싱된 미디어 개수가 0이면 더 이상 데이터 없음
- `hasNextPage = results.length > 0`

## 구현 시나리오

### 시나리오 A: HTML 페이지네이션 (예상)

```typescript
// GET /api/search/selca?query={slug}&page=2
async function fetchSelcaPage(idolSlug: string, maxTimeId?: string) {
  const url = maxTimeId
    ? `${BASE_URL}/owner/${idolSlug}/?max_time_id=${maxTimeId}`
    : `${BASE_URL}/owner/${idolSlug}/`

  const html = await fetchHtmlFromSelca(url)
  const root = parse(html)
  const mediaLinks = root.querySelectorAll('a[href^="/media/"]')

  // Parse results...
  const results = []
  let lastMediaId = null

  for (const link of mediaLinks) {
    const href = link.getAttribute('href')
    const mediaId = extractMediaId(href) // "/media/12345/" -> "12345"
    lastMediaId = mediaId
    results.push(...)
  }

  return {
    results,
    nextMaxTimeId: lastMediaId, // 다음 요청에 사용
    hasNextPage: results.length > 0
  }
}
```

### 시나리오 B: AJAX 엔드포인트 (가능성 낮음)

selca.kastden.org가 별도 API를 제공하는 경우.

## 예상 구현 복잡도

**Low-Medium:**
- 기존 HTML 파싱 로직 재사용 가능
- `max_time_id` 추출 및 전달 로직 추가
- 클라이언트 페이지네이션 UI 이미 구현됨

**잠재적 이슈:**
1. `max_time_id` 메커니즘 오해 시 중복/누락 데이터
2. 무한 루프 (hasNextPage 잘못 감지)
3. 타임아웃 (너무 많은 페이지 요청)

## 다음 단계

1. ✅ Discovery 문서 작성
2. ⬜ 실제 selca.kastden.org 사이트 네트워크 요청 분석 (브라우저 DevTools)
3. ⬜ `max_time_id` 메커니즘 확인
4. ⬜ Discovery 문서 업데이트 (실제 조사 결과 반영)
5. ⬜ PLAN.md 작성 (구현 태스크 정의)

## 참고

**관련 파일:**
- `src/app/api/search/selca/route.ts` - 검색 API (페이지네이션 추가 필요)
- `src/components/ExternalSearch.tsx` - 클라이언트 UI (이미 준비됨)
- `src/lib/parsers/selca.ts` - HTML 파싱 유틸 (fetchHtmlFromSelca 재사용)

**관련 Phase:**
- Phase 27: selca 검색 기능 추가
- Phase 28: Bias 기반 즉시 검색 (selca_slug)
- Phase 29: selca 코드 리팩토링 ✅
