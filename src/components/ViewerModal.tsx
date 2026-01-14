'use client'

import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Link, Tag, LinkMedia } from '@/types/database'
import type { Platform } from '@/lib/metadata'
import { EmbedViewer } from './EmbedViewer'
import { useNameLanguage } from '@/contexts/NameLanguageContext'

type LinkWithTags = Link & { tags: Tag[] }
type LinkWithMedia = Link & { media?: LinkMedia[] }

interface ViewerModalProps {
  link: LinkWithTags & LinkWithMedia
  isOpen: boolean
  onClose: () => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ViewerModal({ link, isOpen, onClose }: ViewerModalProps) {
  const platform = (link.platform || 'other') as Platform
  const { getTagDisplayName } = useNameLanguage()

  // Handle ESC key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-8"
      onClick={handleBackdropClick}
    >
      {/* Modal container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-100 text-lg truncate">
              {link.title || '제목 없음'}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {link.author_name && (
                <span className="text-zinc-600 dark:text-zinc-300">{link.author_name}</span>
              )}
              <span>{formatDate(link.created_at)}</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Embed viewer */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-50 dark:bg-zinc-800/50">
          <EmbedViewer url={link.url} platform={platform} media={link.media} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          {/* Tags */}
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {link.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {getTagDisplayName(tag.name)}
                </span>
              ))}
            </div>
          )}

          {/* Open original link button */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            원본 링크 열기
          </a>
        </div>
      </div>
    </div>
  )

  // Use portal to render modal at document body level
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}
