import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error'
import { createLogger } from '@/lib/logger'
import { isR2Configured, uploadToR2, fetchMediaBuffer, generateR2Key, getR2PublicUrl } from '@/lib/r2'

const logger = createLogger('R2 Upload')

export const maxDuration = 60

interface MediaItem {
  id: string
  media_url: string
  media_type: 'image' | 'video' | 'gif'
  position: number
}

/**
 * POST /api/r2/upload
 * 링크의 미디어 파일들을 R2에 업로드
 * Body: { linkId: string }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'R2 미설정' }, { status: 501 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      unauthorized()
    }

    const { linkId } = await request.json()
    if (!linkId) {
      badRequest('linkId가 필요합니다')
    }

    // 해당 링크의 미디어 조회 (r2_key가 아직 없는 것만)
    const { data: mediaItems, error: fetchError } = await supabase
      .from('link_media')
      .select('id, media_url, media_type, position')
      .eq('link_id', linkId)
      .is('r2_key', null)

    if (fetchError) throw fetchError
    if (!mediaItems || mediaItems.length === 0) {
      return NextResponse.json({ uploaded: 0, message: '업로드할 미디어 없음' })
    }

    let uploaded = 0
    let failed = 0

    for (const item of mediaItems as MediaItem[]) {
      try {
        // YouTube는 R2 업로드 스킵 (embed로 재생)
        if (item.media_url.includes('youtube.com') || item.media_url.includes('youtu.be') || item.media_url.includes('ytimg.com')) {
          continue
        }

        const r2Key = generateR2Key(linkId, item.position, item.media_url, item.media_type)

        // 미디어 다운로드
        const { buffer, contentType } = await fetchMediaBuffer(item.media_url)

        // R2 업로드
        await uploadToR2(r2Key, buffer, contentType)

        // DB 업데이트
        await supabase
          .from('link_media')
          .update({ r2_key: r2Key })
          .eq('id', item.id)

        uploaded++
        logger.debug(`Uploaded media ${item.id}: ${r2Key}`)
      } catch (error) {
        failed++
        logger.error(`Failed to upload media ${item.id} (${item.media_url}):`, error)
      }
    }

    return NextResponse.json({ uploaded, failed, total: mediaItems.length })
  } catch (error) {
    return handleApiError(error)
  }
}
