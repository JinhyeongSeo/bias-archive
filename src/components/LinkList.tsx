'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import type { Link, Tag } from '@/types/database'
import { LinkCard } from './LinkCard'
import { SkeletonCard } from './Skeleton'
import { SelectionToolbar } from './SelectionToolbar'
import { BatchTagModal } from './BatchTagModal'
import { ReelsViewer } from './ReelsViewer'
import { useRefresh } from '@/contexts/RefreshContext'
import { quickSpring, easeOutExpo } from '@/lib/animations'
import { useLinkSelection } from '@/hooks/useLinkSelection'

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
  const locale = useLocale()
  const t = useTranslations('batch')
  const { refreshAll } = useRefresh()
  const [links, setLinks] = useState<LinkWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection hook
  const linkIds = useMemo(() => links.map(l => l.id), [links])
  const {
    selectionMode,
    setSelectionMode,
    selectedIds,
    setSelectedIds,
    handleSelect,
    handleSelectAll,
    handleDeselectAll,
    clearSelection
  } = useLinkSelection({ itemIds: linkIds })

  const [batchModalMode, setBatchModalMode] = useState<'add' | 'remove' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reels viewer state
  const [reelsViewerOpen, setReelsViewerOpen] = useState(false)
  const [reelsInitialIndex, setReelsInitialIndex] = useState(0)

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

  const handleCancelSelection = () => {
    clearSelection()
    setShowDeleteConfirm(false)
  }

  const handleBatchDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setDeleting(true)
    try {
      const response = await fetch('/api/links/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds: Array.from(selectedIds) })
      })

      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }

      if (response.ok) {
        // Remove deleted links from local state
        setLinks(prev => prev.filter(link => !selectedIds.has(link.id)))
        clearSelection()
        refreshAll()
      }
    } catch (err) {
      console.error('Batch delete error:', err)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleBatchTagComplete = () => {
    // Refresh links to show updated tags
    fetchLinks()
    clearSelection()
  }

  // Handle opening the reels viewer
  const handleOpenViewer = useCallback((linkId: string) => {
    const index = links.findIndex(link => link.id === linkId)
    if (index !== -1) {
      setReelsInitialIndex(index)
      setReelsViewerOpen(true)
    }
  }, [links])

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

  // Delete confirmation modal
  const DeleteConfirmModal = () => (
    <AnimatePresence>
      {showDeleteConfirm && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <motion.div
            className="relative bg-card rounded-xl shadow-xl border border-border p-6 max-w-sm w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('confirmDeleteTitle')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('confirmDeleteDescription', { count: selectedIds.size })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-foreground transition-smooth"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-smooth"
              >
                {deleting ? t('deleting') : t('delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

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
    <>
      {/* Selection mode toggle button */}
      {!selectionMode && links.length > 0 && (
        <div className="flex justify-end mb-4">
          <motion.button
            onClick={() => setSelectionMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-smooth"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {t('selectMode')}
          </motion.button>
        </div>
      )}

      {/* Selection toolbar */}
      <AnimatePresence>
        {selectionMode && (
          <SelectionToolbar
            selectedCount={selectedIds.size}
            totalCount={links.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onAddTag={() => setBatchModalMode('add')}
            onRemoveTag={() => setBatchModalMode('remove')}
            onDelete={() => setShowDeleteConfirm(true)}
            onCancel={handleCancelSelection}
            deleting={deleting}
          />
        )}
      </AnimatePresence>

      {/* Link grid/list */}
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
              <LinkCard
                link={link}
                onDelete={handleDelete}
                layout={layout}
                priority={index < 6}
                selectionMode={selectionMode}
                selected={selectedIds.has(link.id)}
                onSelect={handleSelect}
                onOpenViewer={handleOpenViewer}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Batch tag modal */}
      <BatchTagModal
        isOpen={batchModalMode !== null}
        mode={batchModalMode ?? 'add'}
        selectedLinkIds={Array.from(selectedIds)}
        onClose={() => setBatchModalMode(null)}
        onComplete={handleBatchTagComplete}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal />

      {/* Reels-style viewer */}
      <ReelsViewer
        links={links}
        initialIndex={reelsInitialIndex}
        isOpen={reelsViewerOpen}
        onClose={() => setReelsViewerOpen(false)}
        onIndexChange={setReelsInitialIndex}
      />
    </>
  )
}
