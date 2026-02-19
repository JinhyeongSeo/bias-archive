'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { quickSpring } from '@/lib/animations'

interface SelectionToolbarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onAddTag: () => void
  onRemoveTag: () => void
  onDelete: () => void
  onRefresh: () => void
  onCancel: () => void
  deleting?: boolean
  refreshing?: boolean
}

export function SelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onAddTag,
  onRemoveTag,
  onDelete,
  onRefresh,
  onCancel,
  deleting = false,
  refreshing = false,
}: SelectionToolbarProps) {
  const t = useTranslations('batch')
  const allSelected = selectedCount === totalCount && totalCount > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={quickSpring}
      className="sticky top-14 z-20 flex flex-wrap items-center gap-2 p-3 mb-4 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/30"
    >
      {/* Selected count */}
      <span className="text-sm font-medium text-primary">
        {t('selected', { count: selectedCount })}
      </span>

      {/* Select all / Deselect all */}
      <button
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="px-2 py-1 text-xs rounded-md bg-card hover:bg-accent text-foreground transition-smooth"
      >
        {allSelected ? t('deselectAll') : t('selectAll')}
      </button>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Add tag */}
        <motion.button
          onClick={onAddTag}
          disabled={selectedCount === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-card hover:bg-accent text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-sm"
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('addTag')}
        </motion.button>

        {/* Remove tag */}
        <motion.button
          onClick={onRemoveTag}
          disabled={selectedCount === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-card hover:bg-accent text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-sm"
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          {t('removeTag')}
        </motion.button>

        {/* Refresh metadata */}
        <motion.button
          onClick={onRefresh}
          disabled={selectedCount === 0 || refreshing}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-card hover:bg-accent text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-sm"
          whileTap={{ scale: 0.95 }}
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? t('refreshing') : t('refresh')}
        </motion.button>

        {/* Delete */}
        <motion.button
          onClick={onDelete}
          disabled={selectedCount === 0 || deleting}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-sm"
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {deleting ? t('deleting') : t('delete')}
        </motion.button>

        {/* Cancel */}
        <motion.button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-foreground transition-smooth shadow-sm"
          whileTap={{ scale: 0.95 }}
        >
          {t('cancel')}
        </motion.button>
      </div>
    </motion.div>
  )
}
