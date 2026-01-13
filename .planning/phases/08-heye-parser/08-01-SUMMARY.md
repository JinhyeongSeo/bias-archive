---
phase: 08-heye-parser
plan: 01
subsystem: parsers
tags: [cheerio, html-parsing, community, heye.kr]

requires:
  - phase: 02-link-management
    provides: parser infrastructure and VideoMetadata type
provides:
  - heye.kr URL parsing support
  - Multiple image/GIF extraction from community posts
affects: [08-02, external-search]

tech-stack:
  added: []
  patterns: [regex-based image extraction, custom HTML parsing]

key-files:
  created: [src/lib/parsers/heye.ts]
  modified: [src/lib/parsers/index.ts, src/lib/metadata.ts]

key-decisions:
  - "cheerio 대신 regex로 이미지 추출 (JS 렌더링 컨텐츠)"
  - "heye.kr 호스팅 이미지만 추출 (광고 필터링)"
  - "비디오 추출 제외 (핫링크 보호)"

patterns-established:
  - "regex 기반 이미지 URL 추출 패턴"

issues-created: []

duration: 28min
completed: 2026-01-13
---

# Phase 8 Plan 1: heye.kr Parser Summary

**heye.kr 커뮤니티 파서 - regex 기반 이미지 추출, 핫링크 보호된 비디오 제외**

## Performance

- **Duration:** 28 min
- **Started:** 2026-01-13T00:00:00Z
- **Completed:** 2026-01-13T00:28:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- heye.kr 전용 파서 모듈 생성 (cheerio + regex 하이브리드)
- 플랫폼 감지 및 라우팅 통합 완료
- 다중 이미지/GIF 추출 지원
- 광고 이미지 필터링 (heye.kr 호스팅만 추출)

## Task Commits

1. **Task 1: heye.kr 파서 모듈 생성** - `98dfdb6` (feat)
2. **Task 2: 플랫폼 통합 및 라우팅** - `26367c3` (feat)

**추가 수정:**
- `0f0eb20` (fix): regex 기반 이미지 추출로 변경
- `8af8335` (feat): UI 컴포넌트 heye.kr 뷰어 지원
- `633dc64` (perf): 이미지 프리로딩 추가
- `2bb3114` (fix): 다중 이미지 소스 지원
- `74e8fab` (fix): 비디오 지원 및 광고 패턴 제거
- `fc7734a` (fix): 비디오 썸네일 및 미디어 순서
- `2099f34` (fix): 비디오 추출 제거 (핫링크 보호)

## Files Created/Modified

- `src/lib/parsers/heye.ts` - heye.kr 전용 파서 (regex 기반 이미지 추출)
- `src/lib/parsers/index.ts` - Platform 타입에 'heye' 추가, export
- `src/lib/metadata.ts` - detectPlatform에 heye.kr 감지, getParser에 heye 라우팅

## Decisions Made

- **cheerio → regex 하이브리드**: heye.kr 컨텐츠가 JavaScript로 로드되어 DOM 파싱이 불완전함. HTML 문자열에서 regex로 이미지 URL 직접 추출
- **heye.kr 이미지만 추출**: `img1.heye.kr/image/idol/` 패턴만 매칭하여 imgur, daum cdn 등 광고 이미지 제외
- **비디오 추출 제외**: heye.kr 비디오는 핫링크 보호되어 외부에서 재생 불가. 이미지만 지원

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] regex 기반 추출로 변경**
- **Found during:** Task 1 (파서 구현)
- **Issue:** cheerio로 DOM 파싱 시 JavaScript 렌더링 컨텐츠를 가져오지 못함
- **Fix:** HTML 문자열에서 regex로 이미지 URL 직접 추출
- **Files modified:** src/lib/parsers/heye.ts
- **Committed in:** 0f0eb20

**2. [Rule 1 - Bug] 광고 이미지 필터링**
- **Found during:** 테스트
- **Issue:** imgur, daum cdn 등 광고 이미지도 추출됨
- **Fix:** heye.kr 호스팅 이미지만 추출하도록 패턴 제한
- **Files modified:** src/lib/parsers/heye.ts
- **Committed in:** 74e8fab

**3. [Rule 1 - Bug] 비디오 핫링크 보호**
- **Found during:** 테스트
- **Issue:** heye.kr 비디오가 외부에서 재생 불가 (핫링크 보호)
- **Fix:** 비디오 추출 코드 제거, 이미지만 지원
- **Files modified:** src/lib/parsers/heye.ts
- **Committed in:** 2099f34

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** 모든 수정이 기능 정상화에 필수적. 비디오 지원 제외는 기술적 제약.

## Issues Encountered

- heye.kr 컨텐츠가 JavaScript로 로드되어 서버 사이드 DOM 파싱 불가 → regex 추출로 해결
- 비디오 핫링크 보호로 외부 재생 불가 → 이미지만 지원하기로 결정

## Next Phase Readiness

- heye.kr URL 입력 시 이미지/GIF 추출 완료
- 08-02 검색 기능 구현 준비됨

---
*Phase: 08-heye-parser*
*Completed: 2026-01-13*
