---
created: 2026-01-19T14:06
title: heye.kr 아카이브 저장 시 Cloudflare 차단 발생
area: api
files:
  - src/app/api/archive/route.ts
  - src/lib/parsers/heye.ts
---

## Problem

heye.kr (sblinker.com) 미디어를 Internet Archive에 저장하려 할 때 Cloudflare 보안 차단 발생.

증상:
- 미디어 URL: `https://img-heye.sblinker.com/video/idol/2026/01/17685616281076.mp4`
- "Sorry, you have been blocked" 메시지 표시
- Cloudflare 보안 서비스가 요청을 차단

원인 추정:
- Internet Archive의 save API가 URL을 fetch할 때 Cloudflare에서 봇으로 감지
- sblinker.com의 Cloudflare 설정이 외부 요청을 차단하는 것으로 보임
- User-Agent나 요청 패턴이 봇 탐지에 걸림

## Solution

TBD - 추가 조사 필요

가능한 해결책:
1. Internet Archive 저장 대신 직접 다운로드 후 업로드 방식 고려
2. heye.kr 미디어는 아카이브 대상에서 제외
3. 프록시를 통한 우회 시도 (Cloudflare Workers 등)
4. 실패 시 사용자에게 명확한 에러 메시지 표시
