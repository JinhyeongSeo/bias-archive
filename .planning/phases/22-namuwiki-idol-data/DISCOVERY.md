# Phase 22 Discovery: K-pop Idol Data Source

## Problem Statement

현재 `kpopnet.json` npm 패키지를 사용 중이나 2023년 11월 이후 업데이트되지 않음. 최신 아이돌 그룹/멤버 정보가 부재한 상태.

## Research Findings

### kpopnet.json 데이터 소스 분석

kpopnet.json 패키지는 **selca.kastden.org**에서 데이터를 스크래핑하여 생성됨:
- GitHub: https://github.com/kpopnet/kpopnet.json
- 라이선스: CC0-1.0 (퍼블릭 도메인)
- 마지막 업데이트: 2023년 11월

### selca.kastden.org/noona/ 분석

**사이트 개요:**
- K-pop/J-pop 아이돌 데이터베이스
- 최신 그룹 포함 (IVE, NMIXX, LE SSERAFIM 등 2022년 데뷔 그룹 확인)
- 현재 209개 그룹, 29개 서브유닛 등록

**URL 패턴:**
- 그룹 목록: `https://selca.kastden.org/noona/group/`
- 그룹 상세: `https://selca.kastden.org/noona/group/{group-slug}/`
- 아이돌 목록: `https://selca.kastden.org/noona/idol/`
- 아이돌 상세: `https://selca.kastden.org/noona/idol/{group}_{name}/`
- 검색: `https://selca.kastden.org/noona/search/?pt=kpop`

**데이터 구조 (그룹):**
- name (영어)
- name_original (한글)
- agency_name (소속사)
- debut_date (데뷔일)
- disband_date (해산일, nullable)
- fandom_name

**데이터 구조 (아이돌):**
- name (영어 - 무대명)
- name_original (한글 - 무대명)
- real_name (영어)
- real_name_original (한글)
- birth_date
- height, weight
- debut_date

**접근 방식:**
- robots.txt 준수 필요
- Rate limit: 1 요청/초 권장
- JavaScript 렌더링 필요 없음 (HTML 테이블 기반)

### 기존 코드 구조

**src/lib/kpop-data.ts:**
```typescript
import kpopData from 'kpopnet.json'

export interface KpopGroup {
  id: string
  name: string
  name_original: string
  memberCount: number
}

export interface KpopMember {
  id: string
  name: string
  name_original: string
}

// searchGroups(query): KpopGroup[]
// getGroupMembers(groupId): KpopMember[]
// searchMembers(query): KpopMemberWithGroup[]
```

**API 라우트:**
- `GET /api/kpop/groups?q={query}` - 그룹 검색
- `GET /api/kpop/groups/{id}/members` - 그룹 멤버 조회
- `GET /api/kpop/members?q={query}` - 멤버 검색

## Decision

**선택: selca.kastden.org에서 실시간 스크래핑**

이유:
1. kpopnet.json의 원본 소스이므로 데이터 구조 동일
2. 최신 데이터 접근 가능
3. 나무위키보다 접근이 쉬움 (Cloudflare 보안 없음)
4. 기존 API 인터페이스 유지 가능

### 구현 전략

1. **새 파서 모듈 생성**: `src/lib/parsers/selca.ts`
   - `searchGroups(query)`: 그룹 검색
   - `getGroupMembers(groupSlug)`: 멤버 목록 조회

2. **API 라우트 수정**:
   - selca.ts 파서 사용하도록 변경
   - 캐싱 적용 (동일 쿼리 반복 방지)

3. **kpopnet.json 의존성 제거**:
   - package.json에서 제거
   - 기존 kpop-data.ts 대체

## Risk Mitigation

- **Rate Limiting**: API 라우트에서 캐싱 적용
- **Site Down**: 에러 핸들링으로 graceful degradation
- **HTML 구조 변경**: 파서 모듈 분리로 유지보수 용이

## Sources

- [kpopnet.json GitHub](https://github.com/kpopnet/kpopnet.json)
- [Selca About](https://selca.kastden.org/about/)
- [Selca Noona Groups](https://selca.kastden.org/noona/group/)
