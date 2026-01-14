'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Link, Tag } from '@/types/database'
import { LinkCard } from './LinkCard'
import { SkeletonCard } from './Skeleton'
import { quickSpring, easeOutExpo } from '@/lib/animations'

type LinkWithTags = Link & { tags: Tag[] }
type LayoutType = 'grid' | 'list'

interface LinkListProps {
  refreshTrigger?: number
  searchQuery?: string
  tagId?: string | null
  platform?: string | null
  onLinksLoad?: (urls: string[]) => void
  layout?: LayoutType
}

export function LinkList({ refreshTrigger, searchQuery, tagId, platform, onLinksLoad, layout = 'grid' }: LinkListProps) {
  const [links, setLinks] = useState<LinkWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery?.trim()) {
        params.set('search', searchQuery.trim())
      }
      if (tagId) {
        params.set('tags', tagId)
      }
      if (platform) {
        params.set('platform', platform)
      }

      const queryString = params.toString()
      const url = queryString ? `/api/links?${queryString}` : '/api/links'

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '링크 목록을 가져오는데 실패했습니다')
      }

      setLinks(data)
      // Note: onLinksLoad is now called via useEffect when links state changes
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, tagId, platform])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks, refreshTrigger])

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
  }

  // Sync savedUrls with parent when links change (after delete)
  useEffect(() => {
    if (onLinksLoad && !loading) {
      onLinksLoad(links.map((link) => link.url))
    }
  }, [links, onLinksLoad, loading])

  if (loading) {
    return (
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'
        }
      >
        <SkeletonCard layout={layout} count={6} />
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

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: easeOutExpo,
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: quickSpring,
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: easeOutExpo,
    },
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="link-list"
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'
        }
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {links.map((link, index) => (
          <motion.div key={link.id} variants={itemVariants}>
            <LinkCard link={link} onDelete={handleDelete} layout={layout} priority={index < 6} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
