# 추천 기능 아이디어 목록

bias-archive 프로젝트에 추가하면 좋을 기능들을 정리한 문서입니다.

---

## 1. 일괄 작업 기능 ⭐ (우선순위 높음)
- 여러 링크를 선택해서 한번에 태그 추가/삭제
- 선택한 링크들 일괄 삭제
- **구현 계획**: `.claude/plans/` 참고

---

## 2. 통계 대시보드 ⭐ (우선순위 높음)
- 최애별 저장된 링크 수 차트
- 플랫폼별 분포 (YouTube, Twitter, Weverse 등)
- 월별/연도별 저장 활동 히트맵
- 가장 많이 저장한 최애 순위

**구현 아이디어:**
- `/api/stats` 엔드포인트로 집계 데이터 제공
- Chart.js 또는 Recharts로 시각화
- 새 페이지 `[locale]/stats/page.tsx`

---

## 3. 메모 & 북마크 기능 ⭐ (우선순위 높음)
- 각 링크에 개인 메모 추가
- 즐겨찾기/스타 표시로 중요 링크 강조
- 영상 타임스탬프 북마크 (특정 시간대 저장)

**DB 변경 필요:**
```sql
ALTER TABLE links ADD COLUMN memo TEXT;
ALTER TABLE links ADD COLUMN starred BOOLEAN DEFAULT FALSE;

CREATE TABLE link_timestamps (
  id UUID PRIMARY KEY,
  link_id UUID REFERENCES links(id),
  time_seconds INTEGER,
  label TEXT,
  user_id UUID
);
```

---

## 4. 고급 검색 & 필터 ⭐ (우선순위 높음)
- 날짜 범위 검색 (2024년 1월~3월 콘텐츠만)
- 복수 태그 AND/OR 조합 검색
- 자주 쓰는 검색 조건 저장 기능

**구현 아이디어:**
- Sidebar에 고급 필터 패널 추가
- saved_filters 테이블로 저장된 검색 관리

### 4.1 검색 품질 개선
- **퍼지 검색 (Fuzzy Search)**: 오타나 유사 단어도 매칭 (예: "아이유" → "IU"도 검색)
- **동의어/별명 매핑**: 아이돌 이름의 영문/한글/닉네임 통합 검색
- **검색어 자동완성**: 이전 검색 기록 및 등록된 아이돌 기반

### 4.2 검색 성능 개선
- **검색 결과 캐싱**: 동일 쿼리 재검색 시 빠른 응답
- **병렬 메타데이터 추출**: 현재 순차 처리를 병렬로 변경
- **점진적 로딩**: 빠른 플랫폼 결과부터 먼저 표시

### 4.3 새로운 검색 소스 추가
- **Instagram**: K-pop 팬캠이 많이 올라오는 플랫폼
- **Weverse 검색**: 현재 저장만 가능, 검색 API 추가 가능
- **TikTok**: 짧은 직캠 영상 검색

### 4.4 아카이브 내부 검색 강화
- **전문 검색(Full-text Search)**: PostgreSQL FTS 활용
- **태그 조합 검색**: AND/OR 조건 조합
- **유사 콘텐츠 추천**: 저장된 링크와 비슷한 콘텐츠 추천

### 4.5 검색 UX 개선
- **검색 히스토리**: 최근 검색어 저장 및 표시
- **저장된 검색**: 자주 쓰는 검색 조건 저장
- **중복 감지 강화**: 이미 저장된 영상 표시 개선

### 4.6 Twitter 검색 API 대안 (현재: Google CSE 사용)

**문제점**: Google CSE는 인덱싱 기반이라 실시간 검색 불가

**대안 API 비교:**

| 서비스 | 가격 | 특징 |
|--------|------|------|
| **TwitterAPI.io** | $0.15/1,000 트윗 | 실시간, 개발자 계정 불필요, 500ms 이하 응답 |
| **RapidAPI Twitter-X** | $9.99/월 (10,000 요청) | 검색/사진/동영상 필터, 분당 250 요청 |
| **Old Bird V2** | $179.99/월 (1M 트윗) | 대량 처리용, 스크래핑 기반 (불안정 가능) |

**추천**: TwitterAPI.io (종량제, 저렴, 실시간)

---

## 5. 컬렉션/폴더 기능
- 최애와 별개로 커스텀 폴더 생성
- 예: "2024 콘서트", "팬미팅", "예능"
- 링크를 여러 컬렉션에 중복 추가 가능
- 컬렉션 공유 링크 생성

**DB 구조:**
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_code TEXT UNIQUE,
  user_id UUID,
  created_at TIMESTAMPTZ
);

CREATE TABLE collection_links (
  collection_id UUID REFERENCES collections(id),
  link_id UUID REFERENCES links(id),
  PRIMARY KEY (collection_id, link_id)
);
```

---

## 6. 알림 & 모니터링
- 특정 최애의 새 직캠이 YouTube에 올라오면 알림
- 등록한 키워드에 대한 새 콘텐츠 알림
- RSS 피드 구독 기능

**구현 복잡도**: 높음 (백그라운드 작업, 푸시 알림 필요)

---

## 7. 키보드 단축키
- `j`/`k`로 링크 목록 탐색
- `s`로 빠른 저장
- `t`로 태그 편집
- `/`로 검색창 포커스
- `Esc`로 모달 닫기

**구현 아이디어:**
- `useHotkeys` 훅 또는 직접 구현
- 단축키 도움말 모달 (`?` 키)

---

## 8. 플레이리스트 가져오기
- YouTube 플레이리스트 URL로 일괄 가져오기
- Twitter 리스트/북마크 가져오기

**구현 아이디어:**
- YouTube Data API의 playlistItems.list 활용
- 진행 상황 표시 (10/50 완료)

---

## 9. 중복 콘텐츠 감지
- 같은 영상이 다른 URL로 저장됐는지 감지
- 유사한 썸네일 기반 중복 검출

**구현 복잡도**: 중간~높음 (이미지 해싱 필요)

---

## 10. PWA 오프라인 강화
- 즐겨찾기한 링크의 메타데이터 오프라인 캐싱
- 오프라인에서도 아카이브 브라우징 가능

**구현 아이디어:**
- IndexedDB로 로컬 캐싱
- Service Worker 확장

---

## 우선순위 정리

| 순위 | 기능 | 난이도 | 가치 |
|------|------|--------|------|
| 1 | 일괄 작업 | 중 | 높음 |
| 2 | 통계 대시보드 | 중 | 높음 |
| 3 | 메모 & 북마크 | 낮음 | 높음 |
| 4 | 키보드 단축키 | 낮음 | 중간 |
| 5 | 고급 검색 | 중 | 중간 |
| 6 | 컬렉션 | 중 | 중간 |
| 7 | 플레이리스트 가져오기 | 중 | 중간 |
| 8 | 중복 감지 | 높음 | 낮음 |
| 9 | 알림 | 높음 | 중간 |
| 10 | 오프라인 강화 | 높음 | 낮음 |

---

*마지막 업데이트: 2026-01-15*
