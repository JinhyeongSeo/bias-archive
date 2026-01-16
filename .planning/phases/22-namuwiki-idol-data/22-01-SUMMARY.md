# Phase 22 Plan 01: Selca Parser Integration Summary

**selca.kastden.org 파서 연동으로 최신 K-pop 데이터 접근 가능**

## Accomplishments

- selca.ts 파서 모듈 생성 (searchGroups, getGroupMembers, searchMembers)
- API 라우트 3개 수정하여 selca 파서 사용
- node-html-parser 패키지 설치 및 HTML 파싱 구현
- 5분 TTL 인메모리 캐싱으로 성능 최적화

## Files Created/Modified

- `src/lib/parsers/selca.ts` - 새 파서 모듈 (약 300줄)
  - `searchGroups(query)`: 그룹명으로 검색, 최대 10개 반환
  - `getGroupMembers(groupSlug)`: 그룹 멤버 목록 조회
  - `searchMembers(query)`: 아이돌 이름으로 검색, 그룹 정보 포함
- `src/app/api/kpop/groups/route.ts` - selca 파서 사용으로 변경
- `src/app/api/kpop/groups/[id]/members/route.ts` - selca 파서 사용으로 변경
- `src/app/api/kpop/members/route.ts` - selca 파서 사용으로 변경
- `package.json` - node-html-parser 의존성 추가

## Decisions Made

1. **node-html-parser 사용**: cheerio는 이미 open-graph-scraper의 의존성으로 존재했으나, 계획서의 지시에 따라 node-html-parser를 별도 설치하여 사용
2. **캐싱 전략**: 5분 TTL의 인메모리 캐시로 반복 요청 최소화
3. **그룹 ID 변경**: 기존 kpopnet.json의 UUID 형식에서 selca의 slug 형식으로 변경 (예: "ive", "nmixx")
4. **검색 API 사용 불가**: selca.kastden.org의 /noona/search/ 엔드포인트가 400 에러를 반환하여, 전체 목록을 캐싱 후 클라이언트 사이드 필터링 방식으로 구현

## Issues Encountered

1. **selca 검색 API 문제**: `/noona/search/?pt=kpop&n=query` 형식의 검색이 400 Bad Request 반환
   - 해결: 전체 그룹/아이돌 목록을 가져와 메모리에서 필터링하는 방식으로 대체
2. **HTML 파싱 복잡성**: 테이블 내 중첩된 span 요소에서 한글 이름 추출 필요
   - 해결: `(한글이름)` 패턴을 찾아 괄호 제거 후 추출

## Verification Checklist

- [x] `npm run build` 성공
- [ ] `npm run dev` 실행 후 BiasManager에서 그룹 검색 작동 확인 (수동 테스트 필요)
- [ ] 멤버 조회 작동 확인 (수동 테스트 필요)
- [ ] 개별 멤버 검색 작동 확인 (수동 테스트 필요)

## Next Step

Ready for 22-02-PLAN.md (kpopnet.json 의존성 제거)
