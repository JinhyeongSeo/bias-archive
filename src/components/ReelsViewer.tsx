'use client'

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import Image from 'next/image'
import type { Link, Tag, LinkMedia } from '@/types/database'
import type { Platform } from '@/lib/metadata'
import { downloadMedia, getFilenameFromUrl } from './EmbedViewer'
import { useNameLanguage } from '@/contexts/NameLanguageContext'
import { easeOutExpo } from '@/lib/animations'
import { getProxiedImageUrl, getProxiedVideoUrl } from '@/lib/proxy'

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

// Snap threshold - when dragged past this percentage, snap to next/prev
const SNAP_THRESHOLD = 0.3 // 30% of screen height

// Extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/,
    /youtube\.com\/v\/([^&?/]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

// YouTube embed component - maximizes video size to fit screen
// Controls are locked by default to allow drag/scroll navigation
// User can unlock controls via toggle button to interact with YouTube player
function YouTubeEmbed({ videoId, title, isActive }: { videoId: string; title: string | null; isActive: boolean }) {
  const [controlsEnabled, setControlsEnabled] = useState(false)

  // Reset controlsEnabled when video becomes inactive (user navigated away)
  useEffect(() => {
    if (!isActive) {
      setControlsEnabled(false)
    }
  }, [isActive])

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Maximize to fill available space while maintaining 16:9 aspect ratio */}
      <div className="w-full h-full max-h-[calc(100vh-180px)] flex items-center justify-center">
        <div className="relative w-full aspect-video max-h-full" style={{ maxWidth: 'calc((100vh - 180px) * 16 / 9)' }}>
          {isActive ? (
            <>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full rounded-lg"
                style={{ pointerEvents: controlsEnabled ? 'auto' : 'none' }}
              />
              {/* Toggle button for controls - always clickable */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setControlsEnabled(prev => !prev)
                }}
                className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all pointer-events-auto ${
                  controlsEnabled
                    ? 'bg-white/90 text-black hover:bg-white'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
              >
                {controlsEnabled ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>컨트롤</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>잠금</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="relative w-full h-full bg-black/50 rounded-lg">
              <Image
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={title || 'YouTube thumbnail'}
                fill
                className="object-cover rounded-lg select-none pointer-events-none"
                unoptimized
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Video component with fallback handling
// isActive: whether this is the currently visible video
function VideoWithFallback({ url, className, style, originalUrl, isActive = true }: { url: string; className?: string; style?: React.CSSProperties; originalUrl?: string; isActive?: boolean }) {
  const [status, setStatus] = useState<'loading' | 'playing' | 'failed'>('loading')
  const [tryCount, setTryCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const proxiedUrl = getProxiedVideoUrl(url)

  // Try order: proxied URL first, then direct URL
  const urls = proxiedUrl !== url ? [proxiedUrl, url] : [url]
  const currentUrl = urls[Math.min(tryCount, urls.length - 1)]
  const hasMoreFallbacks = tryCount < urls.length - 1

  const handleError = useCallback(() => {
    if (hasMoreFallbacks) {
      console.log(`Video load failed for ${currentUrl}, trying fallback...`)
      setTryCount(prev => prev + 1)
    } else {
      console.log(`All video sources failed for ${url}`)
      setStatus('failed')
    }
  }, [currentUrl, hasMoreFallbacks, url])

  // Reset state when URL changes
  useEffect(() => {
    setTryCount(0)
    setStatus('loading')
  }, [url])

  // Control play/pause based on isActive
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isActive])

  // When video becomes ready, update status and play if active
  const handleCanPlayInternal = useCallback(() => {
    setStatus('playing')
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [isActive])

  // Show error state with link to original
  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-white/70 p-8">
        <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-center text-sm">비디오를 불러올 수 없습니다</p>
        <p className="text-center text-xs text-white/50">핫링크 보호로 인해 직접 재생이 제한됩니다</p>
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            원본 사이트에서 보기
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <video
        ref={videoRef}
        key={`${url}-${tryCount}`}
        src={currentUrl}
        controls
        autoPlay={isActive}
        loop
        playsInline
        muted
        preload="auto"
        className={`${className} transition-opacity duration-200`}
        style={{ ...style, opacity: status === 'playing' ? 1 : 0.3 }}
        onError={handleError}
        onCanPlay={handleCanPlayInternal}
      />
    </div>
  )
}

// Full screen media content component
function ReelsMediaContent({ link, platform, isActive = true }: { link: FullLink; platform: Platform; isActive?: boolean }) {
  const [mediaIndex, setMediaIndex] = useState(0)

  // Get displayable media
  const mediaItems = link.media?.filter(
    m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video'
  ) || []

  // Reset media index when link changes
  useEffect(() => {
    setMediaIndex(0)
  }, [link.id])

  // YouTube: show embed (only when active to prevent multiple videos playing)
  if (platform === 'youtube') {
    const videoId = extractYouTubeVideoId(link.url)
    if (videoId) {
      return (
        <YouTubeEmbed
          videoId={videoId}
          title={link.title}
          isActive={isActive}
        />
      )
    }
  }

  // Has media items (images/videos from Twitter, heye, kgirls, etc.)
  if (mediaItems.length > 0) {
    const currentMedia = mediaItems[mediaIndex]
    const isVideo = currentMedia.media_type === 'video'

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {isVideo ? (
          <VideoWithFallback
            key={`${currentMedia.media_url}-${mediaIndex}`}
            url={currentMedia.media_url}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
            originalUrl={link.url}
            isActive={isActive}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              key={currentMedia.media_url}
              src={getProxiedImageUrl(currentMedia.media_url)}
              alt={link.title || 'Media'}
              fill
              className="object-contain select-none pointer-events-none"
              priority
              unoptimized
              draggable={false}
            />
          </div>
        )}

        {/* Media navigation for multiple items */}
        {mediaItems.length > 1 && (
          <>
            {/* Prev button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMediaIndex(prev => prev === 0 ? mediaItems.length - 1 : prev - 1)
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMediaIndex(prev => prev === mediaItems.length - 1 ? 0 : prev + 1)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {mediaItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMediaIndex(idx)
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === mediaIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm z-10">
              {mediaIndex + 1} / {mediaItems.length}
            </div>
          </>
        )}
      </div>
    )
  }

  // Fallback: show thumbnail or placeholder
  return (
    <div className="w-full h-full flex items-center justify-center">
      {link.thumbnail_url ? (
        <div className="relative w-full h-full max-w-2xl">
          <Image
            src={getProxiedImageUrl(link.thumbnail_url)}
            alt={link.title || 'Thumbnail'}
            fill
            className="object-contain select-none pointer-events-none"
            priority
            unoptimized
            draggable={false}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-white/50">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-sm">미디어를 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  )
}

export function ReelsViewer({ links, initialIndex, isOpen, onClose, onIndexChange }: ReelsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const { getTagDisplayName } = useNameLanguage()

  // Motion value for drag position
  const dragY = useMotionValue(0)
  const containerHeight = useRef(0)

  // Transform for prev/next content positions - must be at top level, not inside conditional JSX
  // Using window.innerHeight as fallback since containerHeight.current may be 0 initially
  const prevY = useTransform(dragY, (y) => {
    const height = containerHeight.current || (typeof window !== 'undefined' ? window.innerHeight : 800)
    return y - height
  })
  const nextY = useTransform(dragY, (y) => {
    const height = containerHeight.current || (typeof window !== 'undefined' ? window.innerHeight : 800)
    return y + height
  })

  const currentLink = links[currentIndex]
  const prevLink = currentIndex > 0 ? links[currentIndex - 1] : null
  const nextLink = currentIndex < links.length - 1 ? links[currentIndex + 1] : null

  // Visible links array for stable key-based rendering (prevents remounting on index change)
  const visibleLinks = useMemo(() => {
    const result: FullLink[] = []
    if (prevLink) result.push(prevLink)
    result.push(currentLink)
    if (nextLink) result.push(nextLink)
    return result
  }, [prevLink, currentLink, nextLink])

  const platform = (currentLink?.platform || 'other') as Platform

  // Get downloadable media items
  const downloadableMedia = currentLink?.media?.filter(
    m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video'
  ) || []

  // Reset index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
    dragY.set(0)
  }, [initialIndex, dragY])

  // Update container height
  useEffect(() => {
    if (containerRef.current) {
      containerHeight.current = containerRef.current.clientHeight
    }
  }, [isOpen])

  // Pointer-based drag handling (instead of framer-motion drag which has issues)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartTime = useRef(0)
  const lastY = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartTime.current = Date.now()
    lastY.current = e.clientY
    // Capture pointer to track movements outside element
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  // Track which link should be "active" (playing) during drag
  // When dragged past 50%, the next/prev link becomes active even before finger is lifted
  const [previewActiveIndex, setPreviewActiveIndex] = useState<number | null>(null)

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return

    const deltaY = e.clientY - dragStartY.current
    lastY.current = e.clientY
    const height = containerHeight.current || window.innerHeight

    // Apply resistance at boundaries
    if (deltaY > 0 && !prevLink) {
      dragY.set(deltaY * 0.2)
    } else if (deltaY < 0 && !nextLink) {
      dragY.set(deltaY * 0.2)
    } else {
      dragY.set(deltaY)
    }

    // When dragged past 50%, start playing the next/prev video (but don't transition yet)
    const previewThreshold = height * 0.5
    if (deltaY < -previewThreshold && nextLink) {
      // Dragged up past 50% - preview next (start playing)
      setPreviewActiveIndex(currentIndex + 1)
    } else if (deltaY > previewThreshold && prevLink) {
      // Dragged down past 50% - preview previous (start playing)
      setPreviewActiveIndex(currentIndex - 1)
    } else {
      // Not past threshold - current is active
      setPreviewActiveIndex(null)
    }
  }, [currentIndex, dragY, nextLink, prevLink])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    // Don't reset previewActiveIndex here - it will be handled below based on navigation decision
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    const height = containerHeight.current || window.innerHeight
    const threshold = height * SNAP_THRESHOLD
    const deltaY = e.clientY - dragStartY.current
    const deltaTime = Date.now() - dragStartTime.current
    const velocity = deltaTime > 0 ? (deltaY / deltaTime) * 1000 : 0
    const velocityThreshold = 500

    // Determine if we should snap to next/prev
    const shouldGoNext = (deltaY < -threshold || velocity < -velocityThreshold) && nextLink
    const shouldGoPrev = (deltaY > threshold || velocity > velocityThreshold) && prevLink

    if (shouldGoNext) {
      // Keep next video playing during animation (don't reset previewActiveIndex yet)
      setPreviewActiveIndex(currentIndex + 1)
      // Animate to next position, then change index
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
      // Keep prev video playing during animation (don't reset previewActiveIndex yet)
      setPreviewActiveIndex(currentIndex - 1)
      // Animate to prev position, then change index
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
      // Snap back to center - reset preview state
      setPreviewActiveIndex(null)
      animate(dragY, 0, {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      })
    }
  }, [currentIndex, dragY, nextLink, onIndexChange, prevLink])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const height = containerHeight.current || window.innerHeight
      // Start from off-screen position, change index immediately, animate to center
      dragY.set(-height)
      setCurrentIndex(prev => prev - 1)
      onIndexChange?.(currentIndex - 1)
      animate(dragY, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
    }
  }, [currentIndex, dragY, onIndexChange])

  const goToNext = useCallback(() => {
    if (currentIndex < links.length - 1) {
      const height = containerHeight.current || window.innerHeight
      // Start from off-screen position, change index immediately, animate to center
      dragY.set(height)
      setCurrentIndex(prev => prev + 1)
      onIndexChange?.(currentIndex + 1)
      animate(dragY, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
    }
  }, [currentIndex, dragY, links.length, onIndexChange])

  // Handle keyboard navigation
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

  // Handle mouse wheel navigation - accumulate scroll and navigate when stopped
  const wheelAccumulator = useRef(0)
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null)
  const isAnimating = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Don't accumulate while animating
      if (isAnimating.current) return

      // Accumulate scroll delta
      wheelAccumulator.current += e.deltaY

      // Clear previous timeout
      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current)
      }

      // Set new timeout - navigate when scrolling stops
      wheelTimeout.current = setTimeout(() => {
        const threshold = 50 // Minimum accumulated scroll to trigger navigation

        if (wheelAccumulator.current > threshold && nextLink) {
          isAnimating.current = true
          goToNext()
          setTimeout(() => { isAnimating.current = false }, 400)
        } else if (wheelAccumulator.current < -threshold && prevLink) {
          isAnimating.current = true
          goToPrevious()
          setTimeout(() => { isAnimating.current = false }, 400)
        }

        // Reset accumulator
        wheelAccumulator.current = 0
      }, 150) // Wait 150ms after last scroll event
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current)
      }
    }
  }, [isOpen, goToNext, goToPrevious, nextLink, prevLink])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

      if (i < downloadableMedia.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setIsDownloading(false)
  }

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
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
          {/* Close button - top right */}
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

          {/* Main content area - Instagram Reels style swipeable */}
          <div
            className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            {/* Render visible links with stable keys to prevent remounting */}
            {visibleLinks.map((link) => {
              const linkPlatform = (link.platform || 'other') as Platform
              const linkIndex = links.findIndex(l => l.id === link.id)
              const offset = linkIndex - currentIndex
              // offset: -1=prev, 0=current, 1=next
              const yStyle = offset === -1 ? prevY : offset === 0 ? dragY : nextY
              // If dragged past 50%, the preview link becomes active (starts playing)
              // Otherwise, the current link is active
              const activeIndex = previewActiveIndex !== null ? previewActiveIndex : currentIndex
              const isActiveLink = linkIndex === activeIndex

              return (
                <motion.div
                  key={link.id}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ y: yStyle }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReelsMediaContent link={link} platform={linkPlatform} isActive={isActiveLink} />
                </motion.div>
              )
            })}
          </div>

          {/* Bottom overlay - gradient background (pointer-events-none for drag-through) */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 h-48 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none"
          />

          {/* Bottom overlay - content section */}
          {/* pointer-events-none so drag passes through, buttons have pointer-events-auto */}
          <div
            className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-8 pointer-events-none"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            {/* Title - no animation for instant response */}
            <h2 className="font-medium text-white text-base line-clamp-2 mb-1">
              {currentLink.title || '제목 없음'}
            </h2>

            {/* Author & Date */}
            <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
              {currentLink.author_name && (
                <span className="text-white/90">@{currentLink.author_name}</span>
              )}
              <span>{formatDate(currentLink.created_at)}</span>
            </div>

            {/* Tags */}
            {currentLink.tags && currentLink.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {currentLink.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white/90"
                  >
                    #{getTagDisplayName(tag.name)}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons - pointer-events-auto so buttons are clickable */}
            <div className="flex items-center gap-3 pointer-events-auto">
              {/* Download all button */}
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

              {/* Open original link button */}
              <motion.a
                href={currentLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors text-sm"
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                원본
              </motion.a>
            </div>
          </div>

          {/* Navigation hint - swipe up for next */}
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
