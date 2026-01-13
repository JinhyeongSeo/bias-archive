'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Link } from '@/types/database'
import type { Platform } from '@/lib/metadata'

interface LinkCardProps {
  link: Link
  onDelete?: (id: string) => void
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

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function LinkCard({ link, onDelete }: LinkCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const platform = (link.platform || 'other') as Platform

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '삭제에 실패했습니다')
      }

      onDelete?.(link.id)
    } catch (error) {
      console.error('Delete error:', error)
      setShowConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowConfirm(false)
  }

  return (
    <div className="group relative rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-700">
        {link.thumbnail_url ? (
          <Image
            src={link.thumbnail_url}
            alt={link.title || 'Thumbnail'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
        )}

        {/* Platform badge */}
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white ${platformColors[platform]}`}
        >
          {platformLabels[platform]}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 text-sm leading-snug">
          {link.title || '제목 없음'}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {formatDate(link.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Open link button */}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 hover:text-blue-500 dark:hover:text-blue-400 shadow-sm transition-colors"
          title="원본 링크 열기"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>

        {/* Delete button */}
        {showConfirm ? (
          <div className="flex gap-1">
            <button
              onClick={handleCancelDelete}
              disabled={deleting}
              className="p-1.5 rounded-md bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300 shadow-sm transition-colors"
              title="취소"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-md bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              title="삭제 확인"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 shadow-sm transition-colors"
            title="삭제"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
