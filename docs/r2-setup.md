# Cloudflare R2 설정 가이드

미디어 파일(이미지/동영상)을 R2에 자동 백업하여 원본이 삭제되어도 영구 보존 + 스트리밍.

## 1. Cloudflare 계정 & R2 활성화

1. https://dash.cloudflare.com 로그인 (없으면 가입)
2. 좌측 메뉴 **R2 Object Storage** 클릭
3. 처음이면 결제 수단(카드) 등록 필요 — **10GB까지 무료**, 초과 시 GB당 $0.015/월

## 2. R2 버킷 생성

1. R2 대시보드에서 **Create bucket** 클릭
2. Bucket name: `bias-archive-media` (원하는 이름)
3. Location: **Automatic** (기본값)
4. 생성 완료

## 3. 퍼블릭 액세스 설정

미디어를 브라우저에서 직접 스트리밍하려면 퍼블릭 액세스가 필요합니다.

### 방법 A: r2.dev 서브도메인 (간단, 테스트용)
1. 버킷 → **Settings** → **Public access**
2. **R2.dev subdomain** 활성화
3. URL 형식: `https://<accountid>.r2.dev`
4. 주의: rate limit 있음, 프로덕션에는 비추

### 방법 B: 커스텀 도메인 (권장, 프로덕션용)
1. 버킷 → **Settings** → **Public access** → **Custom Domains**
2. **Connect Domain** 클릭
3. 도메인 입력 (예: `media.yourdomain.com`)
4. Cloudflare DNS에 자동 연결됨
5. URL 형식: `https://media.yourdomain.com`

## 4. API 토큰 발급

1. R2 대시보드 → **Manage R2 API Tokens** (우측 상단)
2. **Create API token** 클릭
3. 설정:
   - Token name: `bias-archive-upload`
   - Permissions: **Object Read & Write**
   - Specify bucket: 생성한 버킷 선택
   - TTL: 없음 (영구)
4. **Create API Token** 클릭
5. **Access Key ID**와 **Secret Access Key** 복사 (한 번만 표시됨!)

## 5. Account ID 확인

1. Cloudflare 대시보드 우측 하단 또는 URL 바에서 확인
2. 형식: `https://dash.cloudflare.com/<ACCOUNT_ID>/r2`

## 6. 환경변수 설정

`.env.local` (로컬) 또는 Vercel Dashboard (배포)에 추가:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=bias-archive-media
NEXT_PUBLIC_R2_PUBLIC_URL=https://media.yourdomain.com
```

- `NEXT_PUBLIC_R2_PUBLIC_URL`: 방법 A면 `https://<accountid>.r2.dev`, 방법 B면 커스텀 도메인 URL
- 끝에 슬래시(`/`) 붙이지 않기

## 7. Supabase 마이그레이션 실행

```bash
# Supabase CLI로 마이그레이션 적용
npx supabase db push

# 또는 Supabase 대시보드 SQL Editor에서 직접 실행:
ALTER TABLE link_media ADD COLUMN r2_key TEXT;
CREATE INDEX idx_link_media_r2_key ON link_media (r2_key) WHERE r2_key IS NOT NULL;
```

## 8. 동작 확인

1. `npm run dev` 실행
2. 링크 저장 → 서버 로그에 `Uploaded to R2: media/...` 확인
3. 뷰어에서 이미지/동영상이 R2 URL에서 로딩되는지 확인
4. LinkCard에 초록색 구름 아이콘 표시 확인

## 요금 참고

| 항목 | 무료 | 초과 시 |
|------|------|---------|
| 저장 | 10GB/월 | $0.015/GB |
| 쓰기(업로드) | 100만 건/월 | $4.50/100만 건 |
| 읽기(스트리밍) | 1,000만 건/월 | $0.36/100만 건 |
| 다운로드 트래픽 | **항상 무료** | **항상 무료** |

## 미설정 시

R2 환경변수가 없으면 기존과 100% 동일하게 동작합니다 (프록시 방식). R2는 완전히 선택 사항입니다.
