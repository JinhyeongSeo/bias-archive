'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import type { Link, Tag, LinkMedia } from '@/types/database'
import type { Platform } from '@/lib/metadata'
import { TagEditor } from './TagEditor'
import { ViewerModal } from './ViewerModal'
import { useNameLanguage } from '@/contexts/NameLanguageContext'
import { getProxiedImageUrl, getProxiedVideoUrl, isVideoUrl } from '@/lib/proxy'
import { quickSpring } from '@/lib/animations'

type LinkWithTags = Link & { tags: Tag[] }
type LinkWithMedia = Link & { media?: LinkMedia[] }
type LayoutType = 'grid' | 'list'

interface LinkCardProps {
  link: LinkWithTags & LinkWithMedia
  onDelete?: (id: string) => void
  onTagsChange?: (linkId: string, tags: Tag[]) => void
  onMemoChange?: (linkId: string, memo: string | null) => void
  onStarredChange?: (linkId: string, starred: boolean) => void
  layout?: LayoutType
  priority?: boolean
  selectionMode?: boolean
  selected?: boolean
  onSelect?: (id: string, selected: boolean) => void
}

const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  twitter: 'Twitter',
  weverse: 'Weverse',
  heye: 'heye.kr',
  kgirls: 'kgirls.net',
  other: '웹사이트',
}

const platformColors: Record<Platform, string> = {
  youtube: 'bg-[--color-youtube]',
  twitter: 'bg-[--color-twitter]',
  weverse: 'bg-[--color-weverse]',
  heye: 'bg-[--color-heye]',
  kgirls: 'bg-[--color-kgirls]',
  other: 'bg-muted-foreground',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function LinkCard({
  link,
  onDelete,
  onTagsChange,
  onMemoChange,
  onStarredChange,
  layout = 'grid',
  priority = false,
  selectionMode = false,
  selected = false,
  onSelect
}: LinkCardProps) {
  const locale = useLocale()
  const t = useTranslations('link')
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [editingMemo, setEditingMemo] = useState(false)
  const [tags, setTags] = useState<Tag[]>(link.tags || [])
  const [memo, setMemo] = useState<string>(link.memo || '')
  const [starred, setStarred] = useState<boolean>(link.starred || false)
  const [savingMemo, setSavingMemo] = useState(false)
  const [togglingStarred, setTogglingStarred] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const { getTagDisplayName } = useNameLanguage()

  const platform = (link.platform || 'other') as Platform

  // heye, kgirls는 전신 직캠이 많아서 상단(얼굴) 기준으로 크롭
  const useTopCrop = platform === 'heye' || platform === 'kgirls'

  const handleSaveMemo = useCallback(async () => {
    setSavingMemo(true)
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo: memo || null }),
      })

      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }

      if (!response.ok) {
        throw new Error('Failed to save memo')
      }

      onMemoChange?.(link.id, memo || null)
      setEditingMemo(false)
    } catch (error) {
      console.error('Save memo error:', error)
    } finally {
      setSavingMemo(false)
    }
  }, [link.id, memo, locale, onMemoChange])

  const handleToggleStarred = useCallback(async () => {
    setTogglingStarred(true)
    const newStarred = !starred
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: newStarred }),
      })

      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }

      if (!response.ok) {
        throw new Error('Failed to toggle starred')
      }

      setStarred(newStarred)
      onStarredChange?.(link.id, newStarred)
    } catch (error) {
      console.error('Toggle starred error:', error)
    } finally {
      setTogglingStarred(false)
    }
  }, [link.id, starred, locale, onStarredChange])

  const handleTagsChange = (newTags: Tag[]) => {
    setTags(newTags)
    onTagsChange?.(link.id, newTags)
  }

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

      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }

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

  // Check if link has video content (for play button display)
  const hasVideo = platform === 'youtube' ||
    (platform === 'twitter' && link.media?.some(m => m.media_type === 'video'))

  // Check if platform supports in-app viewing (YouTube, Twitter, heye.kr, kgirls.net have viewers)
  const supportsViewer = platform === 'youtube' || platform === 'twitter' || platform === 'heye' || platform === 'kgirls'

  // Handle thumbnail click to open viewer or navigate to link
  const handleThumbnailClick = () => {
    if (selectionMode) {
      onSelect?.(link.id, !selected)
      return
    }
    if (supportsViewer) {
      setViewerOpen(true)
    } else {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    }
  }

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect?.(link.id, e.target.checked)
  }

  // List layout - horizontal card with thumbnail on left
  if (layout === 'list') {
    return (
      <motion.div
        className={`group relative flex rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-smooth card-hover ${
          selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
        }`}
        whileHover={selectionMode ? {} : { y: -2, scale: 1.01 }}
        whileTap={selectionMode ? {} : { scale: 0.99 }}
        transition={quickSpring}
        onClick={selectionMode ? () => onSelect?.(link.id, !selected) : undefined}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={handleCheckboxChange}
              onClick={e => e.stopPropagation()}
              className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-primary/50 cursor-pointer"
            />
          </div>
        )}
        {/* Thumbnail */}
        <div
          className={`relative w-40 sm:w-48 flex-shrink-0 bg-muted dark:bg-zinc-700 ${supportsViewer ? 'cursor-pointer' : ''}`}
          onClick={handleThumbnailClick}
        >
          {link.thumbnail_url ? (
            isVideoUrl(link.thumbnail_url) ? (
              <video
                src={getProxiedVideoUrl(link.thumbnail_url!)}
                className={`absolute inset-0 w-full h-full object-cover ${useTopCrop ? 'object-top' : ''}`}
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <Image
                src={getProxiedImageUrl(link.thumbnail_url)}
                alt={link.title || 'Thumbnail'}
                fill
                className={`object-cover ${useTopCrop ? 'object-top' : ''}`}
              />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
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

          {/* Play button overlay for video content */}
          {(hasVideo || (link.thumbnail_url && isVideoUrl(link.thumbnail_url))) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white opacity-80 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
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
        <div className="flex-1 p-3 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-2 text-sm leading-snug">
            {link.title || '제목 없음'}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {link.author_name && (
              <span className="text-surface-foreground dark:text-zinc-300">{link.author_name}</span>
            )}
            <span>{formatDate(link.created_at)}</span>
          </div>

          {/* Tags */}
          {!editingTags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {getTagDisplayName(tag.name)}
              </span>
              ))}
            </div>
          )}

          {/* Memo display */}
          {!editingMemo && memo && (
            <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
              {memo}
            </p>
          )}

          {/* Tag Editor */}
          {editingTags && (
            <TagEditor
              linkId={link.id}
              currentTags={tags}
              onTagsChange={handleTagsChange}
              onClose={() => setEditingTags(false)}
            />
          )}

          {/* Memo Editor */}
          <AnimatePresence>
            {editingMemo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder={t('memoPlaceholder')}
                  className="w-full px-2 py-1 text-xs rounded border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={2}
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={handleSaveMemo}
                    disabled={savingMemo}
                    className="px-2 py-0.5 text-xs rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingMemo ? '...' : t('saveMemo')}
                  </button>
                  <button
                    onClick={() => {
                      setMemo(link.memo || '')
                      setEditingMemo(false)
                    }}
                    className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Starred indicator */}
        {starred && (
          <div className="absolute top-2 right-2 pointer-events-none">
            <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        )}

        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Starred button */}
          <motion.button
            onClick={handleToggleStarred}
            disabled={togglingStarred}
            className={`p-1.5 rounded-md shadow-sm transition-colors ${
              starred
                ? 'bg-yellow-500 text-white'
                : 'bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-yellow-500'
            }`}
            title={starred ? t('removeFromFavorites') : t('addToFavorites')}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill={starred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </motion.button>

          {/* Memo button */}
          <motion.button
            onClick={() => setEditingMemo(!editingMemo)}
            className={`p-1.5 rounded-md shadow-sm transition-colors ${
              editingMemo
                ? 'bg-primary text-white'
                : memo
                  ? 'bg-card/90 dark:bg-zinc-800/90 text-primary'
                  : 'bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-primary'
            }`}
            title={t('editMemo')}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </motion.button>

          {/* Play/View button for supported platforms */}
          {supportsViewer && (
            <motion.button
              onClick={() => setViewerOpen(true)}
              className="p-1.5 rounded-md bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-green-500 dark:hover:text-green-400 shadow-sm transition-colors"
              title={t('playViewer')}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.button>
          )}

          {/* Open link button */}
          <motion.a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-primary shadow-sm transition-smooth"
            title={t('openLink')}
            whileTap={{ scale: 0.9 }}
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
          </motion.a>

          {/* Edit tags button */}
          <motion.button
              onClick={() => setEditingTags(!editingTags)}
              className={`p-1.5 rounded-md shadow-sm transition-smooth ${
                editingTags
                  ? 'bg-primary text-white'
                  : 'bg-card/90 text-surface-foreground hover:text-primary'
              }`}
            title={t('editTags')}
            whileTap={{ scale: 0.9 }}
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </motion.button>

          {/* Delete button */}
          {showConfirm ? (
            <div className="flex gap-1">
              <motion.button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="p-1.5 rounded-md bg-zinc-200 dark:bg-zinc-600 text-surface-foreground dark:text-zinc-300 shadow-sm transition-colors"
                title="취소"
                whileTap={{ scale: 0.9 }}
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
              </motion.button>
              <motion.button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-md bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                title="삭제 확인"
                whileTap={{ scale: 0.9 }}
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
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={handleDelete}
              className="p-1.5 rounded-md bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 shadow-sm transition-colors"
              title="삭제"
              whileTap={{ scale: 0.9 }}
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
            </motion.button>
          )}
        </div>

        {/* Viewer Modal */}
        <ViewerModal
          link={{ ...link, tags }}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      </motion.div>
    )
  }

  // Grid layout - vertical card (default)
    return (
      <motion.div
        className={`group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-smooth card-hover ${
          selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
        }`}
        whileHover={selectionMode ? {} : { y: -2, scale: 1.01 }}
        whileTap={selectionMode ? {} : { scale: 0.99 }}
        transition={quickSpring}
        onClick={selectionMode ? () => onSelect?.(link.id, !selected) : undefined}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={handleCheckboxChange}
              onClick={e => e.stopPropagation()}
              className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-primary/50 cursor-pointer"
            />
          </div>
        )}
      {/* Thumbnail */}
      <div
        className={`relative aspect-video bg-muted dark:bg-zinc-700 ${supportsViewer ? 'cursor-pointer' : ''}`}
        onClick={handleThumbnailClick}
      >
        {link.thumbnail_url ? (
          isVideoUrl(link.thumbnail_url) ? (
            <video
              src={getProxiedVideoUrl(link.thumbnail_url)}
              className={`absolute inset-0 w-full h-full object-cover ${useTopCrop ? 'object-top' : ''}`}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={getProxiedImageUrl(link.thumbnail_url)}
              alt={link.title || 'Thumbnail'}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover ${useTopCrop ? 'object-top' : ''}`}
              priority={priority}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
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

        {/* Play button overlay for video content */}
        {(hasVideo || (link.thumbnail_url && isVideoUrl(link.thumbnail_url))) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/60 text-white opacity-80 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
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
        <h3 className="font-medium text-foreground line-clamp-2 text-sm leading-snug">
          {link.title || '제목 없음'}
        </h3>
        {link.author_name && (
          <p className="text-xs text-surface-foreground dark:text-zinc-300 mt-1">
            {link.author_name}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(link.created_at)}
        </p>

        {/* Tags */}
        {!editingTags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {getTagDisplayName(tag.name)}
              </span>
            ))}
          </div>
        )}

        {/* Memo display */}
        {!editingMemo && memo && (
          <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
            {memo}
          </p>
        )}

        {/* Tag Editor */}
        {editingTags && (
          <TagEditor
            linkId={link.id}
            currentTags={tags}
            onTagsChange={handleTagsChange}
            onClose={() => setEditingTags(false)}
          />
        )}

        {/* Memo Editor */}
        <AnimatePresence>
          {editingMemo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder={t('memoPlaceholder')}
                className="w-full px-2 py-1 text-xs rounded border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={handleSaveMemo}
                  disabled={savingMemo}
                  className="px-2 py-0.5 text-xs rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingMemo ? '...' : t('saveMemo')}
                </button>
                <button
                  onClick={() => {
                    setMemo(link.memo || '')
                    setEditingMemo(false)
                  }}
                  className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Starred indicator */}
      {starred && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Starred button */}
        <motion.button
          onClick={handleToggleStarred}
          disabled={togglingStarred}
          className={`p-1.5 rounded-md shadow-sm transition-colors ${
            starred
              ? 'bg-yellow-500 text-white'
              : 'bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-yellow-500'
          }`}
          title={starred ? t('removeFromFavorites') : t('addToFavorites')}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-4 h-4" fill={starred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </motion.button>

        {/* Memo button */}
        <motion.button
          onClick={() => setEditingMemo(!editingMemo)}
          className={`p-1.5 rounded-md shadow-sm transition-colors ${
            editingMemo
              ? 'bg-primary text-white'
              : memo
                ? 'bg-card/90 dark:bg-zinc-800/90 text-primary'
                : 'bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-primary'
          }`}
          title={t('editMemo')}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </motion.button>

        {/* Play/View button for supported platforms */}
        {supportsViewer && (
          <motion.button
            onClick={() => setViewerOpen(true)}
            className="p-1.5 rounded-md bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-green-500 dark:hover:text-green-400 shadow-sm transition-colors"
            title={t('playViewer')}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.button>
        )}

        {/* Open link button */}
        <motion.a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-primary shadow-sm transition-smooth"
          title={t('openLink')}
          whileTap={{ scale: 0.9 }}
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
        </motion.a>

        {/* Edit tags button */}
        <motion.button
            onClick={() => setEditingTags(!editingTags)}
            className={`p-1.5 rounded-md shadow-sm transition-smooth ${
              editingTags
                ? 'bg-primary text-white'
                : 'bg-card/90 text-surface-foreground hover:text-primary'
            }`}
          title={t('editTags')}
          whileTap={{ scale: 0.9 }}
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
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        </motion.button>

        {/* Delete button */}
        {showConfirm ? (
          <div className="flex gap-1">
            <motion.button
              onClick={handleCancelDelete}
              disabled={deleting}
              className="p-1.5 rounded-md bg-zinc-200 dark:bg-zinc-600 text-surface-foreground dark:text-zinc-300 shadow-sm transition-colors"
              title="취소"
              whileTap={{ scale: 0.9 }}
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
            </motion.button>
            <motion.button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-md bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              title="삭제 확인"
              whileTap={{ scale: 0.9 }}
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
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={handleDelete}
            className="p-1.5 rounded-md bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 shadow-sm transition-colors"
            title="삭제"
            whileTap={{ scale: 0.9 }}
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
          </motion.button>
        )}
      </div>

      {/* Viewer Modal */}
      <ViewerModal
        link={{ ...link, tags }}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </motion.div>
  )
}
