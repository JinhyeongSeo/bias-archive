'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import type { EnrichedResult, ParsedMedia } from '@/types/index'
import type { LinkMedia } from '@/types/database'
import { modalOverlay, modalContent, smoothSpring, easeOutExpo } from '@/lib/animations'
import { getProxiedImageUrl, getProxiedVideoUrl, isVideoUrl } from '@/lib/proxy'
import { useMediaViewer } from '@/hooks/useMediaViewer'
import { downloadMedia, getFilenameFromUrl } from '../EmbedViewer'

interface SearchPreviewModalProps {
  result: EnrichedResult | null
  isOpen: boolean
  onClose: () => void
  onSave: (result: EnrichedResult) => void
}

/**
 * Convert ParsedMedia[] to LinkMedia[] for MediaGallery compatibility
 */
function toLinkMedia(media: ParsedMedia[]): LinkMedia[] {
  return media.map((m, index) => ({
    id: `preview-${index}`,
    link_id: '',
    media_url: m.url,
    media_type: m.type,
    position: index,
    user_id: null,
    created_at: new Date().toISOString(),
  }))
}

function PreviewMediaGallery({ media }: { media: LinkMedia[] }) {
  const items = useMemo(
    () => media.filter(m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video'),
    [media]
  )

  const {
    currentIndex,
    setCurrentIndex,
    goToPrevious,
    goToNext,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useMediaViewer({ items })

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
        미디어를 찾을 수 없습니다
      </div>
    )
  }

  const currentItem = items[currentIndex]
  const isVideo = currentItem.media_type === 'video'

  return (
    <div
      className="relative w-full touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: '3/4', maxHeight: 'min(75vh, 600px)' }}>
        {isVideo ? (
          <video
            key={currentItem.media_url}
            src={getProxiedVideoUrl(currentItem.media_url)}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-full rounded sm:rounded-lg object-contain"
          />
        ) : (
          <Image
            src={getProxiedImageUrl(currentItem.media_url)}
            alt={`Media ${currentIndex + 1} of ${items.length}`}
            fill
            className="object-contain rounded sm:rounded-lg"
            priority
            unoptimized
          />
        )}
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-white'
                    : 'bg-white/50 hover:bg-white/75'
                } ${item.media_type === 'video' ? 'ring-1 ring-white/50' : ''}`}
                aria-label={`Go to ${item.media_type === 'video' ? 'video' : 'image'} ${index + 1}`}
              />
            ))}
          </div>

          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/50 text-white text-xs sm:text-sm">
            {currentIndex + 1} / {items.length}
            {isVideo && ' (영상)'}
          </div>
        </>
      )}

      {/* Download button */}
      <button
        onClick={() => {
          const item = items[currentIndex]
          const url = item.media_type === 'video'
            ? getProxiedVideoUrl(item.media_url)
            : getProxiedImageUrl(item.media_url)
          const filename = getFilenameFromUrl(item.media_url, currentIndex, item.media_type)
          downloadMedia(url, filename)
        }}
        className="absolute top-2 sm:top-4 left-2 sm:left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="다운로드"
        title="현재 미디어 다운로드"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  )
}

function PreviewThumbnail({ result }: { result: EnrichedResult }) {
  if (!result.thumbnailUrl) {
    return (
      <div className="flex items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>미리보기를 사용할 수 없습니다</p>
        </div>
      </div>
    )
  }

  if (isVideoUrl(result.thumbnailUrl)) {
    return (
      <div className="relative w-full flex items-center justify-center" style={{ maxHeight: 'min(75vh, 600px)' }}>
        <video
          src={result.thumbnailUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          className="max-w-full max-h-[600px] rounded sm:rounded-lg object-contain"
        />
      </div>
    )
  }

  return (
    <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: '16/9', maxHeight: 'min(75vh, 600px)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={result.thumbnailUrl}
        alt={result.title}
        className="max-w-full max-h-full rounded sm:rounded-lg object-contain"
      />
    </div>
  )
}

// YouTube embed for preview
function YouTubePreviewEmbed({ url }: { url: string }) {
  const videoId = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/
  )?.[1]

  if (!videoId) return null

  return (
    <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-lg"
      />
    </div>
  )
}

export function SearchPreviewModal({ result, isOpen, onClose, onSave }: SearchPreviewModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (typeof window === 'undefined' || !result) return null

  const hasMedia = result.media && result.media.length > 0
  const linkMedia = hasMedia ? toLinkMedia(result.media!) : []

  const renderContent = () => {
    // YouTube: embed player
    if (result.platform === 'youtube') {
      return <YouTubePreviewEmbed url={result.url} />
    }

    // Platforms with media: show gallery
    if (hasMedia) {
      return <PreviewMediaGallery media={linkMedia} />
    }

    // Fallback: show thumbnail
    return <PreviewThumbnail result={result} />
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-1 sm:p-6 md:p-8"
          onClick={handleBackdropClick}
          variants={modalOverlay}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={easeOutExpo}
        >
          <motion.div
            className="relative w-full max-w-3xl max-h-[98vh] sm:max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl flex flex-col"
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
                  {result.title || '제목 없음'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-zinc-500 dark:text-zinc-400">
                  {result.author && (
                    <span className="text-zinc-600 dark:text-zinc-300">{result.author}</span>
                  )}
                  {result.publishedAt && (
                    <span>
                      {new Date(result.publishedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>

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

            {/* Content */}
            <div className="flex-1 overflow-auto p-1 sm:p-4 bg-zinc-50 dark:bg-zinc-800/50">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="p-2 sm:p-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                {/* Save button */}
                {!result.isSaved && (
                  <motion.button
                    onClick={() => {
                      onSave(result)
                      onClose()
                    }}
                    disabled={result.isSaving}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[11px] sm:text-sm"
                    whileTap={{ scale: result.isSaving ? 1 : 0.95 }}
                  >
                    {result.isSaving ? (
                      <>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>저장 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>저장</span>
                      </>
                    )}
                  </motion.button>
                )}

                {result.isSaved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-sm text-green-600 dark:text-green-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    저장됨
                  </span>
                )}

                {/* Open original link */}
                <motion.a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-[11px] sm:text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  원본 링크
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
