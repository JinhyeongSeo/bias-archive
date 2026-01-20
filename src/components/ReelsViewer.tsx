'use client'

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import type { Link, Tag, LinkMedia, Platform } from '@/types/index'
import { downloadMedia, getFilenameFromUrl } from './EmbedViewer'
import { useNameLanguage } from '@/contexts/NameLanguageContext'
import { easeOutExpo } from '@/lib/animations'
import { getProxiedImageUrl, getProxiedVideoUrl } from '@/lib/proxy'
import { ReelsMediaContent } from './viewer/ReelsMediaContent'

type LinkWithTags = Link & { tags: Tag[] }
type LinkWithMedia = Link & { media?: LinkMedia[] }
type FullLink = LinkWithTags & LinkWithMedia

interface ReelsViewerProps {
  links: FullLink[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onIndexChange?: (index: number) => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const SNAP_THRESHOLD = 0.3

export function ReelsViewer({ links, initialIndex, isOpen, onClose, onIndexChange }: ReelsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const { getTagDisplayName } = useNameLanguage()

  const dragY = useMotionValue(0)
  const dragX = useMotionValue(0)
  const containerHeight = useRef(0)
  const containerWidth = useRef(0)
  const dragAxis = useRef<'x' | 'y' | null>(null)

  const prevY = useTransform(dragY, (y) => {
    const height = containerHeight.current || (typeof window !== 'undefined' ? window.innerHeight : 800)
    return y - height
  })
  const nextY = useTransform(dragY, (y) => {
    const height = containerHeight.current || (typeof window !== 'undefined' ? window.innerHeight : 800)
    return y + height
  })

  const prevMediaX = useTransform(dragX, (x) => {
    const width = containerWidth.current || (typeof window !== 'undefined' ? window.innerWidth : 400)
    return x - width
  })
  const nextMediaX = useTransform(dragX, (x) => {
    const width = containerWidth.current || (typeof window !== 'undefined' ? window.innerWidth : 400)
    return x + width
  })

  const currentLink = links[currentIndex]
  const prevLink = currentIndex > 0 ? links[currentIndex - 1] : null
  const nextLink = currentIndex < links.length - 1 ? links[currentIndex + 1] : null

  const visibleLinks = useMemo(() => {
    const result: FullLink[] = []
    if (prevLink) result.push(prevLink)
    result.push(currentLink)
    if (nextLink) result.push(nextLink)
    return result
  }, [prevLink, currentLink, nextLink])

  const currentMediaItems = useMemo(() =>
    currentLink?.media?.filter(
      m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video'
    ) || []
  , [currentLink])
  const mediaCount = currentMediaItems.length
  const hasPrevMedia = mediaIndex > 0
  const hasNextMedia = mediaIndex < mediaCount - 1

  const downloadableMedia = currentLink?.media?.filter(
    m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video'
  ) || []

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIndex(initialIndex)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMediaIndex(0)
    dragY.set(0)
    dragX.set(0)
  }, [initialIndex, dragX, dragY])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMediaIndex(0)
  }, [currentIndex])

  useEffect(() => {
    if (containerRef.current) {
      containerHeight.current = containerRef.current.clientHeight
      containerWidth.current = containerRef.current.clientWidth
    }
  }, [isOpen])

  const isDragging = useRef(false)
  const wasDragged = useRef(false)
  const dragStartY = useRef(0)
  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)
  const AXIS_LOCK_THRESHOLD = 10

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    wasDragged.current = false
    dragStartY.current = e.clientY
    dragStartX.current = e.clientX
    dragStartTime.current = Date.now()
    dragAxis.current = null
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const [previewActiveIndex, setPreviewActiveIndex] = useState<number | null>(null)
  const [previewActiveMediaIndex, setPreviewActiveMediaIndex] = useState<number | null>(null)

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return

    const deltaY = e.clientY - dragStartY.current
    const deltaX = e.clientX - dragStartX.current
    const height = containerHeight.current || window.innerHeight

    if (dragAxis.current === null) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      if (absX > AXIS_LOCK_THRESHOLD || absY > AXIS_LOCK_THRESHOLD) {
        dragAxis.current = absX > absY ? 'x' : 'y'
        wasDragged.current = true
      }
    }

    if (dragAxis.current === 'y') {
      if (deltaY > 0 && !prevLink) {
        dragY.set(deltaY * 0.2)
      } else if (deltaY < 0 && !nextLink) {
        dragY.set(deltaY * 0.2)
      } else {
        dragY.set(deltaY)
      }
      dragX.set(0)

      const previewThreshold = height * 0.5
      if (deltaY < -previewThreshold && nextLink) {
        setPreviewActiveIndex(currentIndex + 1)
      } else if (deltaY > previewThreshold && prevLink) {
        setPreviewActiveIndex(currentIndex - 1)
      } else {
        setPreviewActiveIndex(null)
      }
    } else if (dragAxis.current === 'x') {
      const width = containerWidth.current || window.innerWidth
      if (deltaX > 0 && !hasPrevMedia) {
        dragX.set(deltaX * 0.2)
      } else if (deltaX < 0 && !hasNextMedia) {
        dragX.set(deltaX * 0.2)
      } else {
        dragX.set(deltaX)
      }
      dragY.set(0)

      const previewThreshold = width * 0.5
      if (deltaX < -previewThreshold && hasNextMedia) {
        setPreviewActiveMediaIndex(mediaIndex + 1)
      } else if (deltaX > previewThreshold && hasPrevMedia) {
        setPreviewActiveMediaIndex(mediaIndex - 1)
      } else {
        setPreviewActiveMediaIndex(null)
      }
    }
  }, [currentIndex, dragX, dragY, hasNextMedia, hasPrevMedia, mediaIndex, nextLink, prevLink])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    const currentAxis = dragAxis.current
    dragAxis.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    const height = containerHeight.current || window.innerHeight
    const width = containerWidth.current || window.innerWidth
    const deltaY = e.clientY - dragStartY.current
    const deltaX = e.clientX - dragStartX.current
    const deltaTime = Date.now() - dragStartTime.current
    const velocityThreshold = 500

    if (currentAxis === 'y') {
      const threshold = height * SNAP_THRESHOLD
      const velocity = deltaTime > 0 ? (deltaY / deltaTime) * 1000 : 0
      const shouldGoNext = (deltaY < -threshold || velocity < -velocityThreshold) && nextLink
      const shouldGoPrev = (deltaY > threshold || velocity > velocityThreshold) && prevLink

      if (shouldGoNext) {
        setPreviewActiveIndex(currentIndex + 1)
        animate(dragY, -height, {
          type: 'spring',
          stiffness: 400,
          damping: 40,
          restDelta: 0.5,
          restSpeed: 10,
          onComplete: () => {
            setCurrentIndex(prev => prev + 1)
            onIndexChange?.(currentIndex + 1)
            dragY.set(0)
            setPreviewActiveIndex(null)
          }
        })
      } else if (shouldGoPrev) {
        setPreviewActiveIndex(currentIndex - 1)
        animate(dragY, height, {
          type: 'spring',
          stiffness: 400,
          damping: 40,
          restDelta: 0.5,
          restSpeed: 10,
          onComplete: () => {
            setCurrentIndex(prev => prev - 1)
            onIndexChange?.(currentIndex - 1)
            dragY.set(0)
            setPreviewActiveIndex(null)
          }
        })
      } else {
        setPreviewActiveIndex(null)
        animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 40 })
      }
    } else if (currentAxis === 'x') {
      const threshold = width * SNAP_THRESHOLD
      const velocity = deltaTime > 0 ? (deltaX / deltaTime) * 1000 : 0
      const shouldGoNextMedia = (deltaX < -threshold || velocity < -velocityThreshold) && hasNextMedia
      const shouldGoPrevMedia = (deltaX > threshold || velocity > velocityThreshold) && hasPrevMedia

      if (shouldGoNextMedia) {
        setPreviewActiveMediaIndex(mediaIndex + 1)
        animate(dragX, -width, {
          type: 'spring',
          stiffness: 400,
          damping: 40,
          restDelta: 0.5,
          restSpeed: 10,
          onComplete: () => {
            setMediaIndex(prev => prev + 1)
            dragX.set(0)
            setPreviewActiveMediaIndex(null)
          }
        })
      } else if (shouldGoPrevMedia) {
        setPreviewActiveMediaIndex(mediaIndex - 1)
        animate(dragX, width, {
          type: 'spring',
          stiffness: 400,
          damping: 40,
          restDelta: 0.5,
          restSpeed: 10,
          onComplete: () => {
            setMediaIndex(prev => prev - 1)
            dragX.set(0)
            setPreviewActiveMediaIndex(null)
          }
        })
      } else {
        setPreviewActiveMediaIndex(null)
        animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 40 })
      }
    } else {
      setPreviewActiveIndex(null)
      setPreviewActiveMediaIndex(null)
      animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 40 })
      animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 40 })
    }
  }, [currentIndex, dragX, dragY, hasNextMedia, hasPrevMedia, mediaIndex, nextLink, onIndexChange, prevLink])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const height = containerHeight.current || window.innerHeight
      dragY.set(-height)
      setCurrentIndex(prev => prev - 1)
      onIndexChange?.(currentIndex - 1)
      animate(dragY, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }, [currentIndex, dragY, onIndexChange])

  const goToNext = useCallback(() => {
    if (currentIndex < links.length - 1) {
      const height = containerHeight.current || window.innerHeight
      dragY.set(height)
      setCurrentIndex(prev => prev + 1)
      onIndexChange?.(currentIndex + 1)
      animate(dragY, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }, [currentIndex, dragY, links.length, onIndexChange])

  const animateToMedia = useCallback((direction: 'prev' | 'next') => {
    const width = containerWidth.current || window.innerWidth
    if (direction === 'next' && hasNextMedia) {
      setPreviewActiveMediaIndex(mediaIndex + 1)
      animate(dragX, -width, {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        restDelta: 0.5,
        restSpeed: 10,
        onComplete: () => {
          setMediaIndex(prev => prev + 1)
          dragX.set(0)
          setPreviewActiveMediaIndex(null)
        }
      })
    } else if (direction === 'prev' && hasPrevMedia) {
      setPreviewActiveMediaIndex(mediaIndex - 1)
      animate(dragX, width, {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        restDelta: 0.5,
        restSpeed: 10,
        onComplete: () => {
          setMediaIndex(prev => prev - 1)
          dragX.set(0)
          setPreviewActiveMediaIndex(null)
        }
      })
    }
  }, [dragX, hasNextMedia, hasPrevMedia, mediaIndex])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'Escape':
          onClose()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToNext, goToPrevious, onClose])

  const wheelAccumulator = useRef(0)
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null)
  const isAnimating = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (isAnimating.current) return
      wheelAccumulator.current += e.deltaY
      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current)
      }
      wheelTimeout.current = setTimeout(() => {
        const threshold = 50
        if (wheelAccumulator.current > threshold && nextLink) {
          isAnimating.current = true
          goToNext()
          setTimeout(() => { isAnimating.current = false }, 400)
        } else if (wheelAccumulator.current < -threshold && prevLink) {
          isAnimating.current = true
          goToPrevious()
          setTimeout(() => { isAnimating.current = false }, 400)
        }
        wheelAccumulator.current = 0
      }, 150)
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current)
    }
  }, [isOpen, goToNext, goToPrevious, nextLink, prevLink])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const historyPushed = useRef(false)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      historyPushed.current = false
      return
    }
    if (!historyPushed.current) {
      window.history.pushState({ reelsViewerOpen: true }, '')
      historyPushed.current = true
    }
    const handlePopState = () => onCloseRef.current()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (historyPushed.current && window.history.state?.reelsViewerOpen) {
        window.history.back()
        historyPushed.current = false
      }
    }
  }, [])

  const handleDownloadAll = async () => {
    if (downloadableMedia.length === 0 || isDownloading) return
    setIsDownloading(true)
    setDownloadProgress({ current: 0, total: downloadableMedia.length })
    for (let i = 0; i < downloadableMedia.length; i++) {
      const item = downloadableMedia[i]
      const url = item.media_type === 'video' ? getProxiedVideoUrl(item.media_url) : getProxiedImageUrl(item.media_url)
      const filename = getFilenameFromUrl(item.media_url, i, item.media_type)
      await downloadMedia(url, filename)
      setDownloadProgress({ current: i + 1, total: downloadableMedia.length })
      if (i < downloadableMedia.length - 1) await new Promise(resolve => setTimeout(resolve, 500))
    }
    setIsDownloading(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (wasDragged.current) {
      wasDragged.current = false
      return
    }
    if (e.target === e.currentTarget) onClose()
  }

  if (typeof window === 'undefined' || !currentLink) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={easeOutExpo}
          onClick={handleBackdropClick}
        >
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="text-white/70 text-sm">
              {currentIndex + 1} / {links.length}
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              aria-label="닫기"
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          <div
            className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            {visibleLinks.map((link) => {
              const linkPlatform = (link.platform || 'other') as Platform
              const linkIndex = links.findIndex(l => l.id === link.id)
              const offset = linkIndex - currentIndex
              const yStyle = offset === -1 ? prevY : offset === 0 ? dragY : nextY
              const activeIndex = previewActiveIndex !== null ? previewActiveIndex : currentIndex
              const isActiveLink = linkIndex === activeIndex
              const linkMediaIndex = offset === 0 ? mediaIndex : 0

              return (
                <motion.div
                  key={link.id}
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{ y: yStyle }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReelsMediaContent
                    link={link}
                    platform={linkPlatform}
                    isActive={isActiveLink}
                    mediaIndex={linkMediaIndex}
                    previewActiveMediaIndex={offset === 0 ? previewActiveMediaIndex : undefined}
                    onMediaIndexChange={offset === 0 ? setMediaIndex : undefined}
                    onAnimateToMedia={offset === 0 ? animateToMedia : undefined}
                    dragX={offset === 0 ? dragX : undefined}
                    prevMediaX={offset === 0 ? prevMediaX : undefined}
                    nextMediaX={offset === 0 ? nextMediaX : undefined}
                  />
                </motion.div>
              )
            })}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 h-48 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />

          <div
            className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-8 pointer-events-none"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <h2 className="font-medium text-white text-base line-clamp-2 mb-1">
              {currentLink.title || '제목 없음'}
            </h2>

            <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
              {currentLink.author_name && <span className="text-white/90">@{currentLink.author_name}</span>}
              <span>{formatDate(currentLink.created_at)}</span>
            </div>

            {currentLink.tags && currentLink.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {currentLink.tags.map((tag) => (
                  <span key={tag.id} className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white/90">
                    #{getTagDisplayName(tag.name)}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pointer-events-auto">
              {downloadableMedia.length > 0 && (
                <motion.button
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  whileTap={{ scale: isDownloading ? 1 : 0.95 }}
                >
                  {isDownloading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{downloadProgress.current}/{downloadProgress.total}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>다운로드 ({downloadableMedia.length})</span>
                    </>
                  )}
                </motion.button>
              )}

              <motion.a
                href={currentLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors text-sm"
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                원본
              </motion.a>
            </div>
          </div>

          {links.length > 1 && currentIndex < links.length - 1 && (
            <motion.div
              className="absolute bottom-36 left-1/2 -translate-x-1/2 text-white/30 text-xs flex flex-col items-center gap-1 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span>스와이프</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
