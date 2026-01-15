'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import type { Tag } from '@/types/database'
import { useRefresh } from '@/contexts/RefreshContext'
import { quickSpring, modalOverlay, modalContent } from '@/lib/animations'

type ModalMode = 'add' | 'remove'

interface BatchTagModalProps {
  isOpen: boolean
  mode: ModalMode
  selectedLinkIds: string[]
  onClose: () => void
  onComplete: () => void
}

export function BatchTagModal({
  isOpen,
  mode,
  selectedLinkIds,
  onClose,
  onComplete
}: BatchTagModalProps) {
  const t = useTranslations('batch')
  const locale = useLocale()
  const { refreshTags } = useRefresh()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [inputValue, setInputValue] = useState('')
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch all tags
  useEffect(() => {
    if (!isOpen) return

    async function fetchTags() {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const tags = await response.json()
          setAllTags(tags)
        }
      } catch (err) {
        console.error('Error fetching tags:', err)
      }
    }
    fetchTags()
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTags(new Set())
      setInputValue('')
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = allTags.filter(
        tag =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedTags.has(tag.id)
      )
      setFilteredTags(filtered)
      setShowSuggestions(true)
    } else {
      setFilteredTags([])
      setShowSuggestions(false)
    }
  }, [inputValue, allTags, selectedTags])

  const handleSelectTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(tag.id)) {
        next.delete(tag.id)
      } else {
        next.add(tag.id)
      }
      return next
    })
  }

  const handleAddNewTag = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    // Check if tag already exists
    const existing = allTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      setSelectedTags(prev => new Set([...prev, existing.id]))
    } else {
      // Add as new tag name (will be created on submit)
      setSelectedTags(prev => new Set([...prev, `new:${trimmed}`]))
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (mode === 'add') {
        handleAddNewTag()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (selectedTags.size === 0) {
      setError(t('selectTagError'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (mode === 'add') {
        // Separate new tags and existing tag IDs
        const addTags: string[] = []
        selectedTags.forEach(id => {
          if (id.startsWith('new:')) {
            addTags.push(id.replace('new:', ''))
          } else {
            const tag = allTags.find(t => t.id === id)
            if (tag) addTags.push(tag.name)
          }
        })

        const response = await fetch('/api/links/batch/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkIds: selectedLinkIds,
            addTags
          })
        })

        if (response.status === 401) {
          window.location.href = `/${locale}/login`
          return
        }

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t('error'))
        }
      } else {
        // Remove mode - use tag IDs directly
        const removeTags = Array.from(selectedTags).filter(id => !id.startsWith('new:'))

        const response = await fetch('/api/links/batch/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkIds: selectedLinkIds,
            removeTags
          })
        })

        if (response.status === 401) {
          window.location.href = `/${locale}/login`
          return
        }

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t('error'))
        }
      }

      refreshTags()
      onComplete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            variants={modalOverlay}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-card rounded-xl shadow-xl border border-border overflow-hidden"
            variants={modalContent}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {mode === 'add' ? t('addTagTitle') : t('removeTagTitle')}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-accent transition-smooth"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                {mode === 'add'
                  ? t('addTagDescription', { count: selectedLinkIds.length })
                  : t('removeTagDescription', { count: selectedLinkIds.length })}
              </p>

              {/* Tag input (add mode only) */}
              {mode === 'add' && (
                <div className="relative mb-4">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => inputValue.trim() && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder={t('tagInputPlaceholder')}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                    />
                    <button
                      onClick={handleAddNewTag}
                      disabled={!inputValue.trim()}
                      className="px-3 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                    >
                      {t('add')}
                    </button>
                  </div>

                  {/* Autocomplete suggestions */}
                  {showSuggestions && filteredTags.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredTags.map(tag => (
                        <button
                          key={tag.id}
                          onMouseDown={() => {
                            handleSelectTag(tag)
                            setInputValue('')
                          }}
                          className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-accent transition-smooth"
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected tags */}
              {selectedTags.size > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.from(selectedTags).map(id => {
                    const isNew = id.startsWith('new:')
                    const name = isNew ? id.replace('new:', '') : allTags.find(t => t.id === id)?.name
                    return (
                      <motion.span
                        key={id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={quickSpring}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {name}
                        {isNew && <span className="text-[10px] opacity-70">({t('new')})</span>}
                        <button
                          onClick={() => setSelectedTags(prev => {
                            const next = new Set(prev)
                            next.delete(id)
                            return next
                          })}
                          className="ml-1 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.span>
                    )
                  })}
                </div>
              )}

              {/* Existing tags list (for remove mode or quick select in add mode) */}
              <div className="max-h-48 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">
                  {mode === 'add' ? t('existingTags') : t('selectTagsToRemove')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => {
                    const isSelected = selectedTags.has(tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleSelectTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full border transition-smooth ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                  {allTags.length === 0 && (
                    <span className="text-xs text-muted-foreground">{t('noTags')}</span>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="mt-4 text-sm text-red-500">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-border bg-surface">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-foreground transition-smooth"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedTags.size === 0}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
              >
                {loading ? t('processing') : (mode === 'add' ? t('addTag') : t('removeTag'))}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
