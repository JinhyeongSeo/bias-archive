'use client'

type LayoutType = 'grid' | 'list'

interface SkeletonTextProps {
  className?: string
  width?: string
}

interface SkeletonImageProps {
  className?: string
  aspectRatio?: 'video' | 'square' | 'auto'
}

interface SkeletonCardProps {
  layout?: LayoutType
  count?: number
}

/**
 * SkeletonText - Text placeholder with animate-pulse
 */
export function SkeletonText({ className = '', width = 'w-full' }: SkeletonTextProps) {
  return (
    <div
      className={`h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse ${width} ${className}`}
    />
  )
}

/**
 * SkeletonImage - Image/video placeholder with animate-pulse
 */
export function SkeletonImage({ className = '', aspectRatio = 'video' }: SkeletonImageProps) {
  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'square'
        ? 'aspect-square'
        : ''

  return (
    <div
      className={`bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse ${aspectClass} ${className}`}
    />
  )
}

/**
 * SkeletonCard - LinkCard skeleton for loading state
 * Supports both grid and list layouts
 */
export function SkeletonCard({ layout = 'grid', count = 1 }: SkeletonCardProps) {
  const cards = Array.from({ length: count }, (_, i) => i)

  if (layout === 'list') {
    return (
      <>
        {cards.map((i) => (
          <div
            key={i}
            className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="relative w-40 sm:w-48 flex-shrink-0 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />

            {/* Content */}
            <div className="flex-1 p-3 min-w-0 space-y-2">
              {/* Title */}
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-1/2" />

              {/* Meta */}
              <div className="flex items-center gap-2 mt-1">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-20" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-16" />
              </div>

              {/* Tags */}
              <div className="flex gap-1 mt-2">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse w-14" />
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse w-16" />
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  // Grid layout (default)
  return (
    <>
      {cards.map((i) => (
        <div
          key={i}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden"
        >
          {/* Thumbnail */}
          <div className="aspect-video bg-zinc-200 dark:bg-zinc-700 animate-pulse" />

          {/* Content */}
          <div className="p-3 space-y-2">
            {/* Title */}
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-1/2" />

            {/* Author */}
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-1/3 mt-1" />

            {/* Date */}
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-1/4 mt-1" />

            {/* Tags */}
            <div className="flex gap-1 mt-2">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse w-14" />
              <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse w-16" />
              <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse w-12" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
