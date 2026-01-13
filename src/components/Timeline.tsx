'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Link, Tag } from '@/types/database'
import type { Platform } from '@/lib/metadata'

type LinkWithTags = Link & { tags: Tag[] }

const platformColors: Record<Platform, string> = {
  youtube: 'bg-red-500 dark:bg-red-600',
  twitter: 'bg-blue-400 dark:bg-blue-500',
  weverse: 'bg-green-500 dark:bg-green-600',
  heye: 'bg-orange-500 dark:bg-orange-600',
  other: 'bg-zinc-500 dark:bg-zinc-600',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTodayDate(): string {
  const today = new Date()
  return today.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
}

interface TimelineProps {
  refreshTrigger?: number
}

export function Timeline({ refreshTrigger = 0 }: TimelineProps) {
  const [links, setLinks] = useState<LinkWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const fetchTimelineLinks = async () => {
      try {
        const response = await fetch('/api/links/timeline?years=1')
        if (!response.ok) {
          throw new Error('Failed to fetch timeline')
        }
        const data = await response.json()
        setLinks(data)
      } catch (error) {
        console.error('Error fetching timeline:', error)
        setLinks([])
      } finally {
        setLoading(false)
      }
    }

    fetchTimelineLinks()
  }, [refreshTrigger])

  // Don't show section if loading or no links
  if (loading) {
    return null
  }

  if (links.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-6xl mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-500 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              1년 전 오늘
            </h2>
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatTodayDate()}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          title={isCollapsed ? '펼치기' : '접기'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Horizontal scroll container */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
              {links.map((link) => (
                <TimelineCard key={link.id} link={link} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700" />
        </>
      )}
    </div>
  )
}

interface TimelineCardProps {
  link: LinkWithTags
}

function TimelineCard({ link }: TimelineCardProps) {
  const platform = (link.platform || 'other') as Platform

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-700">
        {link.thumbnail_url ? (
          <Image
            src={link.thumbnail_url}
            alt={link.title || 'Thumbnail'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
            <svg
              className="w-10 h-10"
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
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 text-sm leading-snug">
          {link.title || '제목 없음'}
        </h3>
        {link.author_name && (
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 truncate">
            {link.author_name}
          </p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {formatDate(link.original_date || link.created_at)}
        </p>

        {/* Tags */}
        {link.tags && link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {link.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
              >
                {tag.name}
              </span>
            ))}
            {link.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                +{link.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  )
}
