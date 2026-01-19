# Phase 34: Internet Archive Backup - Discovery

## Research Summary

Internet Archive의 Save Page Now (SPN2) API를 조사하여 링크 백업 및 폴백 시스템 구현 방안을 정리함.

## Internet Archive SPN2 API

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `https://web.archive.org/save` | POST | URL 캡처 요청 |
| `https://web.archive.org/save/status/{job_id}` | GET | 캡처 상태 확인 |
| `http://web.archive.org/save/status/user` | GET | 사용자 상태 확인 |
| `http://archive.org/wayback/available?url={url}` | GET | URL 아카이브 여부 확인 |

### Authentication

**S3 API Keys 방식 (권장):**
1. https://archive.org/account/login 에서 계정 생성
2. https://archive.org/account/s3.php 에서 API 키 생성
3. HTTP Header: `Authorization: LOW {accesskey}:{secret}`

### Request Parameters

| Parameter | Description |
|-----------|-------------|
| `url` | 캡처할 URL (필수) |
| `capture_all=1` | HTTP 4xx/5xx 에러도 캡처 |
| `capture_outlinks=1` | 외부 링크도 함께 캡처 |
| `capture_screenshot=1` | PNG 스크린샷 생성 |
| `skip_first_archive=1` | 첫 캡처 체크 건너뛰기 (속도 향상) |
| `if_not_archived_within=<timedelta>` | 조건부 캡처 (예: "3d") |

### Response Format

**성공:**
```json
{
  "status": "success",
  "job_id": "uuid",
  "original_url": "captured URL",
  "timestamp": "YYYYMMDDHHmmss",
  "duration_sec": 6.203
}
```

**대기 중:**
```json
{
  "status": "pending",
  "job_id": "uuid"
}
```

**에러:**
```json
{
  "status": "error",
  "exception": "...",
  "status_ext": "error:code"
}
```

### Rate Limits

| Limit | Authenticated | Anonymous |
|-------|---------------|-----------|
| Concurrent captures | 12 | 6 |
| Daily captures | 100,000 | 4,000 |
| Same URL per day | 10 | 10 |
| Network timeout | 10s | 10s |
| Max capture duration | 2min | 2min |

### Wayback Availability API

URL이 이미 아카이브되었는지 확인:
```
GET http://archive.org/wayback/available?url=example.com
```

Response:
```json
{
  "archived_snapshots": {
    "closest": {
      "status": "200",
      "available": true,
      "url": "http://web.archive.org/web/20240101000000/example.com",
      "timestamp": "20240101000000"
    }
  }
}
```

## Implementation Strategy

### Option A: Background Queue (Recommended)

**장점:**
- 링크 저장 시 UX 영향 없음
- Rate limit 관리 용이
- 실패 시 재시도 가능

**구현:**
1. `links` 테이블에 `archive_status`, `archive_url`, `archive_job_id` 컬럼 추가
2. 링크 저장 시 `archive_status: 'pending'` 설정
3. Cron/Background job에서 pending 링크 처리
4. Vercel Cron Jobs 또는 수동 트리거 API

### Option B: On-Demand Archiving

**장점:**
- 서버리스 환경에 적합
- 필요한 링크만 아카이브

**구현:**
1. starred 링크에만 자동 아카이브
2. 수동 "백업" 버튼으로 개별 아카이브
3. 이미지/비디오 원본 깨짐 감지 시 폴백

### Decision: Auto-Archive All Links

1. **모든 링크 자동 아카이브**: 링크 저장 시 자동으로 백그라운드 아카이브
2. **수동 재시도 버튼**: 실패한 링크에 "Retry Archive" 버튼
3. **폴백 시스템**: 이미지/비디오 로드 실패 시 Wayback 폴백
4. **상태 표시**: 아카이브 상태 아이콘 (pending/archived/failed)

**Rate Limit 분석:**
- 일일 100,000개 캡처 가능 (인증 시)
- 개인 아카이브 용도로 충분함
- 모든 링크 자동 백업 가능

## Database Schema Changes

```sql
-- links 테이블에 컬럼 추가
ALTER TABLE links ADD COLUMN archive_status TEXT DEFAULT NULL;
-- NULL: 아카이브 안됨, 'pending': 진행 중, 'archived': 완료, 'failed': 실패

ALTER TABLE links ADD COLUMN archive_url TEXT DEFAULT NULL;
-- Wayback Machine 아카이브 URL

ALTER TABLE links ADD COLUMN archive_job_id TEXT DEFAULT NULL;
-- SPN2 job ID (상태 확인용)

ALTER TABLE links ADD COLUMN archived_at TIMESTAMP DEFAULT NULL;
-- 아카이브 완료 시간
```

## Environment Variables

```env
ARCHIVE_ORG_ACCESS_KEY=  # archive.org S3 access key
ARCHIVE_ORG_SECRET_KEY=  # archive.org S3 secret key
```

## Key Considerations

1. **Rate Limiting**: 하루 100,000개 제한, 동시 12개 제한
2. **비동기 처리**: SPN2는 비동기 (job_id로 상태 확인)
3. **에러 처리**: 블록된 URL, 타임아웃 등 다양한 에러 케이스
4. **선택적 백업**: 모든 링크가 아닌 starred 링크 위주
5. **폴백 우선순위**: 원본 → Wayback → 에러 표시

## References

- [Wayback Machine APIs](https://archive.org/help/wayback_api.php)
- [SPN2 API Documentation](https://archive.org/details/spn-2-public-api-page-docs)
- [Internet Archive Developer Portal](https://archive.org/developers/index-apis.html)
- [S3 API Keys](https://archive.org/account/s3.php)
