'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Link, Tag, LinkMedia } from '@/types/database'
import type { Platform } from '@/lib/metadata'
import { EmbedViewer, downloadMedia, getFilenameFromUrl } from './EmbedViewer'
import { useNameLanguage } from '@/contexts/NameLanguageContext'
import { modalOverlay, modalContent, smoothSpring, easeOutExpo } from '@/lib/animations'
import { getProxiedImageUrl, getProxiedVideoUrl } from '@/lib/proxy'

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
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })

  // Get downloadable media items
  const downloadableMedia = link.media?.filter(
    m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video'
  ) || []

  // Download all media with rate limiting
  const handleDownloadAll = async () => {
    if (downloadableMedia.length === 0 || isDownloading) return

    setIsDownloading(true)
    setDownloadProgress({ current: 0, total: downloadableMedia.length })

    for (let i = 0; i < downloadableMedia.length; i++) {
      const item = downloadableMedia[i]
      const url = item.media_type === 'video'
        ? getProxiedVideoUrl(item.media_url)
        : getProxiedImageUrl(item.media_url)
      const filename = getFilenameFromUrl(item.media_url, i, item.media_type)

      await downloadMedia(url, filename)
      setDownloadProgress({ current: i + 1, total: downloadableMedia.length })

      // Rate limiting: wait 500ms between downloads
      if (i < downloadableMedia.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setIsDownloading(false)
  }

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

  // Use portal to render modal at document body level
  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-1 sm:p-6 md:p-8"
          onClick={handleBackdropClick}
          variants={modalOverlay}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={easeOutExpo}
        >
          {/* Modal container */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[98vh] sm:max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl flex flex-col"
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smoothSpring}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 sm:p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                <h2 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm sm:text-lg line-clamp-1 sm:truncate">
                  {link.title || '제목 없음'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-zinc-500 dark:text-zinc-400">
                  {link.author_name && (
                    <span className="text-zinc-600 dark:text-zinc-300">{link.author_name}</span>
                  )}
                  <span>{formatDate(link.created_at)}</span>
                </div>
              </div>

              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                aria-label="닫기"
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Content - Embed viewer */}
            <div className="flex-1 overflow-auto p-1 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50">
              <EmbedViewer url={link.url} platform={platform} media={link.media} />
            </div>

            {/* Footer */}
            <div className="p-2 sm:p-4 border-t border-zinc-200 dark:border-zinc-700">
              {/* Tags */}
              {link.tags && link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-1.5 sm:mb-3">
                  {link.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {getTagDisplayName(tag.name)}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Download all button - only show if there are downloadable media */}
                {downloadableMedia.length > 0 && (
                  <motion.button
                    onClick={handleDownloadAll}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[11px] sm:text-sm"
                    whileTap={{ scale: isDownloading ? 1 : 0.95 }}
                  >
                    {isDownloading ? (
                      <>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{downloadProgress.current}/{downloadProgress.total}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>전체 다운로드 ({downloadableMedia.length})</span>
                      </>
                    )}
                  </motion.button>
                )}

                {/* Open original link button */}
                <motion.a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-[11px] sm:text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  원본 링크 열기
                </motion.a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
