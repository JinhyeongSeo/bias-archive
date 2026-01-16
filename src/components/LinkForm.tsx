'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import type { LinkMetadata, Platform } from '@/lib/metadata'
import { getProxiedImageUrl, getProxiedVideoUrl, isVideoUrl } from '@/lib/proxy'
import { slideUp, fadeIn, basicSpring, quickSpring } from '@/lib/animations'

interface MetadataPreview extends LinkMetadata {
  url: string
}

interface LinkFormProps {
  onSave?: () => void
}

const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  twitter: 'Twitter',
  weverse: 'Weverse',
  heye: 'heye.kr',
  kgirls: 'kgirls.net',
  selca: 'selca.kastden.org',
  other: '웹사이트',
}

const platformColors: Record<Platform, string> = {
  youtube: 'bg-[--color-youtube]',
  twitter: 'bg-[--color-twitter]',
  weverse: 'bg-[--color-weverse]',
  heye: 'bg-[--color-heye]',
  kgirls: 'bg-[--color-kgirls]',
  selca: 'bg-[--color-selca]',
  other: 'bg-muted-foreground',
}

export function LinkForm({ onSave }: LinkFormProps) {
  const locale = useLocale()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<MetadataPreview | null>(null)
  const [imageError, setImageError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError('URL을 입력하세요')
      return
    }

    setLoading(true)
    setError(null)
    setPreview(null)
    setImageError(false)

    try {
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '메타데이터를 가져오는데 실패했습니다')
      }

      setPreview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setUrl('')
    setPreview(null)
    setError(null)
  }

  const handleSave = async () => {
    if (!preview) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: preview.url,
          title: preview.title,
          description: preview.description,
          thumbnailUrl: preview.thumbnailUrl,
          platform: preview.platform,
          originalDate: preview.originalDate,
          authorName: preview.authorName,
          media: preview.media,
        }),
      })

      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '링크를 저장하는데 실패했습니다')
      }

      // Success - clear form and trigger onSave callback
      handleClear()
      onSave?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube, Twitter, 또는 웹사이트 URL을 입력하세요"
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
            disabled={loading || saving}
          />
          <motion.button
            type="submit"
            disabled={loading || saving || !url.trim()}
            className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:bg-primary/40 text-white font-medium transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm hover:shadow-md"
            whileTap={{ scale: 0.97 }}
            transition={quickSpring}
          >
            {loading ? '로딩...' : '추가'}
          </motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={basicSpring}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {preview && (
          <motion.div
            className="mt-6 p-4 rounded-xl border border-border bg-surface shadow-sm"
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={basicSpring}
          >
            <div className="flex gap-4">
              {preview.thumbnailUrl && !imageError && (
                <div className="flex-shrink-0 relative w-32 h-24 rounded-md overflow-hidden bg-muted dark:bg-zinc-700">
                  {isVideoUrl(preview.thumbnailUrl) ? (
                    <video
                      src={getProxiedVideoUrl(preview.thumbnailUrl)}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <Image
                      src={getProxiedImageUrl(preview.thumbnailUrl)}
                      alt={preview.title || 'Thumbnail'}
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${platformColors[preview.platform]}`}>
                    {platformLabels[preview.platform]}
                  </span>
                </div>
                <h3 className="font-medium text-foreground truncate">
                  {preview.title || '제목 없음'}
                </h3>
                {preview.authorName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {preview.authorName}
                  </p>
                )}
                {preview.description && (
                  <p className="text-sm text-surface-foreground dark:text-zinc-300 mt-2 line-clamp-2">
                    {preview.description}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <motion.button
                onClick={handleClear}
                disabled={saving}
                className="px-4 py-2 rounded-md border border-border text-surface-foreground dark:text-zinc-300 hover:bg-muted dark:hover:bg-zinc-700 disabled:opacity-50 text-sm transition-colors"
                whileTap={{ scale: 0.97 }}
                transition={quickSpring}
              >
                취소
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-primary hover:bg-primary-dark disabled:bg-primary/40 text-white text-sm font-medium transition-smooth shadow-sm"
                whileTap={{ scale: 0.97 }}
                transition={quickSpring}
              >
                {saving ? '저장 중...' : '저장하기'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
