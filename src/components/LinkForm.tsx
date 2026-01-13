'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { LinkMetadata, Platform } from '@/lib/metadata'

interface MetadataPreview extends LinkMetadata {
  url: string
}

const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  twitter: 'Twitter',
  weverse: 'Weverse',
  other: '웹사이트',
}

const platformColors: Record<Platform, string> = {
  youtube: 'bg-red-500 dark:bg-red-600',
  twitter: 'bg-blue-400 dark:bg-blue-500',
  weverse: 'bg-green-500 dark:bg-green-600',
  other: 'bg-zinc-500 dark:bg-zinc-600',
}

export function LinkForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<MetadataPreview | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError('URL을 입력하세요')
      return
    }

    setLoading(true)
    setError(null)
    setPreview(null)

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

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube, Twitter, 또는 웹사이트 URL을 입력하세요"
            className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            {loading ? '로딩...' : '추가'}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>

      {preview && (
        <div className="mt-6 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex gap-4">
            {preview.thumbnailUrl && (
              <div className="flex-shrink-0 relative w-32 h-24 rounded-md overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                <Image
                  src={preview.thumbnailUrl}
                  alt={preview.title || 'Thumbnail'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${platformColors[preview.platform]}`}>
                  {platformLabels[preview.platform]}
                </span>
              </div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {preview.title || '제목 없음'}
              </h3>
              {preview.authorName && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {preview.authorName}
                </p>
              )}
              {preview.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 line-clamp-2">
                  {preview.description}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm transition-colors"
            >
              취소
            </button>
            <button
              className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
              onClick={() => {
                // TODO: Save link (02-02에서 구현)
                alert('저장 기능은 02-02에서 구현 예정입니다')
              }}
            >
              저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
