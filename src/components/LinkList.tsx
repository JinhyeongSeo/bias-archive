'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Link } from '@/types/database'
import { LinkCard } from './LinkCard'

interface LinkListProps {
  refreshTrigger?: number
}

export function LinkList({ refreshTrigger }: LinkListProps) {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/links')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '링크 목록을 가져오는데 실패했습니다')
      }

      setLinks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks, refreshTrigger])

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
        {error}
        <button
          onClick={fetchLinks}
          className="ml-2 underline hover:no-underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
        <svg
          className="w-16 h-16 mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p className="text-lg font-medium">저장된 링크가 없습니다</p>
        <p className="text-sm mt-1">위에서 URL을 입력하여 링크를 추가해보세요</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} onDelete={handleDelete} />
      ))}
    </div>
  )
}
