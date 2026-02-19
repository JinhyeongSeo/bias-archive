import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createLogger } from '@/lib/logger'

const logger = createLogger('R2')

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL)
}

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!isR2Configured()) {
      throw new Error('R2 환경변수가 설정되지 않았습니다')
    }
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return s3Client
}

/**
 * R2에 파일 업로드
 */
export async function uploadToR2(key: string, buffer: Buffer | ArrayBuffer, contentType: string): Promise<string> {
  const client = getS3Client()
  const body = buffer instanceof Buffer ? buffer : Buffer.from(buffer)

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))

  logger.debug(`Uploaded to R2: ${key} (${body.length} bytes)`)
  return key
}

/**
 * R2 key로 퍼블릭 URL 생성
 */
export function getR2PublicUrl(key: string): string {
  // 끝에 슬래시 제거
  const baseUrl = R2_PUBLIC_URL!.replace(/\/$/, '')
  return `${baseUrl}/${key}`
}

/**
 * 미디어 URL에서 확장자 추출
 */
export function getExtensionFromUrl(url: string, mediaType: string): string {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.(\w{3,4})(?:\?|$)/)
    if (match) return match[1].toLowerCase()
  } catch {
    // URL 파싱 실패 시 기본값
  }

  // 미디어 타입별 기본 확장자
  switch (mediaType) {
    case 'video': return 'mp4'
    case 'gif': return 'gif'
    case 'image':
    default: return 'jpg'
  }
}

/**
 * R2 스토리지 key 생성
 * 형식: media/{linkId}/{position}.{ext}
 */
export function generateR2Key(linkId: string, position: number, url: string, mediaType: string): string {
  const ext = getExtensionFromUrl(url, mediaType)
  return `media/${linkId}/${position}.${ext}`
}

/**
 * 미디어 URL에서 파일 다운로드 (핫링크 보호 사이트 대응)
 */
export async function fetchMediaBuffer(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  // 핫링크 보호 사이트별 Referer 설정
  let referer = ''
  if (url.includes('kgirls.net')) {
    referer = 'https://www.kgirls.net/'
  } else if (url.includes('heye.kr')) {
    referer = 'https://heye.kr/'
  } else if (url.includes('selca.kastden.org')) {
    referer = 'https://selca.kastden.org/'
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,video/*,*/*;q=0.8',
      ...(referer ? { 'Referer': referer } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(`미디어 다운로드 실패: ${response.status} ${url}`)
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'application/octet-stream'

  return { buffer, contentType }
}
