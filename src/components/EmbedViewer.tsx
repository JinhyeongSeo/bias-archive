'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import type { Platform } from '@/lib/metadata'
import type { LinkMedia } from '@/types/database'
import { getProxiedImageUrl, getProxiedVideoUrl } from '@/lib/proxy'

// Download a single media file
export async function downloadMedia(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Download failed:', error)
    // Fallback: open in new tab
    window.open(url, '_blank')
  }
}

// Generate filename from URL
export function getFilenameFromUrl(url: string, index: number, mediaType: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const ext = pathname.split('.').pop()?.split('?')[0] || (mediaType === 'video' ? 'mp4' : 'jpg')
    return `media_${index + 1}.${ext}`
  } catch {
    return `media_${index + 1}.${mediaType === 'video' ? 'mp4' : 'jpg'}`
  }
}

interface EmbedViewerProps {
  url: string
  platform: Platform
  media?: LinkMedia[]
}

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/,
    /youtube\.com\/v\/([^&?/]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

// Extract Twitter/X tweet ID from URL
function extractTweetId(url: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

// YouTube embed component
function YouTubeEmbed({ videoId }: { videoId: string }) {
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

// Twitter embed component using Twitter widgets.js
function TwitterEmbed({ tweetId }: { tweetId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true

    // Prevent double rendering in StrictMode
    if (renderedRef.current) {
      // Already rendered, just hide loading
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync loading state with render status
      setLoading(false)
      return
    }

    const loadTwitterWidget = async () => {
      // Load Twitter widgets.js if not already loaded
      if (!window.twttr) {
        const script = document.createElement('script')
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        script.charset = 'utf-8'
        document.body.appendChild(script)

        await new Promise<void>((resolve) => {
          script.onload = () => resolve()
          script.onerror = () => {
            if (mounted) setError(true)
            resolve()
          }
        })
      }

      // Create the tweet embed
      if (window.twttr && containerRef.current && mounted) {
        try {
          // Check if already rendered
          if (containerRef.current.children.length > 0) {
            setLoading(false)
            return
          }
          renderedRef.current = true
          await window.twttr.widgets.createTweet(tweetId, containerRef.current, {
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            align: 'center',
            dnt: true,
          })
          if (mounted) setLoading(false)
        } catch {
          if (mounted) setError(true)
        }
      }
    }

    loadTwitterWidget()

    return () => {
      mounted = false
    }
  }, [tweetId])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
        <p className="mb-4">트윗을 불러올 수 없습니다</p>
        <a
          href={`https://twitter.com/i/status/${tweetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-smooth"
        >
          Twitter에서 보기
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center">
      {loading && (
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 absolute">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>트윗 로딩 중...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full sm:max-w-[550px]" />
    </div>
  )
}

// Media gallery component for images, GIFs, and videos
function MediaGallery({ media }: { media: LinkMedia[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isSwiping = useRef(false)
  // Include images, GIFs, and videos
  const items = media.filter(m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video')

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
  }, [items.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
  }, [items.length])

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = touchStartX.current - currentX
    const diffY = touchStartY.current - currentY

    // Determine if this is a horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwiping.current = true
      // Prevent vertical scrolling during horizontal swipe
      e.preventDefault()
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    const threshold = 50 // Minimum swipe distance

    if (isSwiping.current && Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left -> next
        goToNext()
      } else {
        // Swiped right -> previous
        goToPrevious()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
    isSwiping.current = false
  }, [goToNext, goToPrevious])

  // Preload adjacent images (skip videos) - runs on mount and when index changes
  useEffect(() => {
    const toPreload: number[] = []
    // Preload current, next 2 and previous 1 images
    for (let offset = -1; offset <= 2; offset++) {
      let idx = currentIndex + offset
      if (idx < 0) idx = items.length + idx
      if (idx >= items.length) idx = idx - items.length
      // Only preload images/gifs, not videos
      if (!loadedImages.has(idx) && items[idx] && items[idx].media_type !== 'video') {
        toPreload.push(idx)
      }
    }

    if (toPreload.length > 0) {
      toPreload.forEach(idx => {
        const img = new window.Image()
        // Use proxied URL for preloading - same URL that will be rendered
        img.src = getProxiedImageUrl(items[idx].media_url)
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Track preloaded images for optimization
      setLoadedImages(prev => new Set([...prev, ...toPreload]))
    }
  }, [currentIndex, items, loadedImages])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

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
      ref={containerRef}
      className="relative w-full touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main content - image or video */}
      <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: '3/4', maxHeight: 'min(90vh, 700px)' }}>
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

      {/* Navigation controls - only show if multiple items */}
      {items.length > 1 && (
        <>
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next button */}
          <button
            onClick={goToNext}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
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

          {/* Counter */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/50 text-white text-xs sm:text-sm">
            {currentIndex + 1} / {items.length}
            {isVideo && ' (영상)'}
          </div>
        </>
      )}

      {/* Download button for current item */}
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

// Fallback component for unsupported platforms
function FallbackEmbed({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-zinc-500 dark:text-zinc-400">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
      <p className="mb-4 text-center">이 플랫폼은 임베드를 지원하지 않습니다</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-smooth"
      >
        원본 링크 열기
      </a>
    </div>
  )
}

export function EmbedViewer({ url, platform, media }: EmbedViewerProps) {
  // YouTube
  if (platform === 'youtube') {
    const videoId = extractYouTubeVideoId(url)
    if (videoId) {
      return <YouTubeEmbed videoId={videoId} />
    }
  }

  // Twitter/X - show image gallery if we have images, otherwise embed tweet
  if (platform === 'twitter') {
    // Check if we have images in media
    const hasImages = media && media.some(m => m.media_type === 'image')

    if (hasImages) {
      return <MediaGallery media={media!} />
    }

    // For tweets without images (text-only or video), embed the tweet
    const tweetId = extractTweetId(url)
    if (tweetId) {
      return <TwitterEmbed tweetId={tweetId} />
    }
  }

  // Weverse - show image gallery if we have images
  if (platform === 'weverse') {
    const hasImages = media && media.some(m => m.media_type === 'image')
    if (hasImages) {
      return <MediaGallery media={media!} />
    }
  }

  // heye.kr - show media gallery (images, GIFs, videos)
  if (platform === 'heye') {
    const hasMedia = media && media.some(m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video')
    if (hasMedia) {
      return <MediaGallery media={media!} />
    }
  }

  // kgirls.net - show media gallery (images, GIFs, videos)
  if (platform === 'kgirls') {
    const hasMedia = media && media.some(m => m.media_type === 'image' || m.media_type === 'gif' || m.media_type === 'video')
    if (hasMedia) {
      return <MediaGallery media={media!} />
    }
  }

  // Instagram - show media gallery (images, videos)
  if (platform === 'instagram') {
    const hasMedia = media && media.some(m => m.media_type === 'image' || m.media_type === 'video')
    if (hasMedia) {
      return <MediaGallery media={media!} />
    }
  }

  // Fallback for unsupported platforms
  return <FallbackEmbed url={url} />
}

// Declare Twitter widget types for TypeScript
declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: {
            theme?: 'light' | 'dark'
            align?: 'left' | 'center' | 'right'
            dnt?: boolean
          }
        ) => Promise<HTMLElement>
      }
    }
  }
}
