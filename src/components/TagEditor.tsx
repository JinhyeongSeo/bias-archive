'use client'

import { useState, useEffect, useRef } from 'react'
import type { Tag } from '@/types/database'
import { useRefresh } from '@/contexts/RefreshContext'

interface TagEditorProps {
  linkId: string
  currentTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  onClose?: () => void
}

export function TagEditor({ linkId, currentTags, onTagsChange, onClose }: TagEditorProps) {
  const { refreshTags } = useRefresh()
  const [inputValue, setInputValue] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch all tags for autocomplete
  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const tags = await response.json()
          setAllTags(tags)
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
  }, [])

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const currentTagIds = new Set(currentTags.map((t) => t.id))
      const filtered = allTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !currentTagIds.has(tag.id)
      )
      setFilteredTags(filtered)
      setShowSuggestions(true)
    } else {
      setFilteredTags([])
      setShowSuggestions(false)
    }
  }, [inputValue, allTags, currentTags])

  const addTag = async (tagName: string) => {
    const trimmedName = tagName.trim()
    if (!trimmedName) return

    // Check for duplicate
    if (currentTags.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      setInputValue('')
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/links/${linkId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      })

      if (response.ok) {
        const updatedTags = await response.json()
        onTagsChange(updatedTags)
        setInputValue('')
        setShowSuggestions(false)
        // Refresh sidebar tag list
        refreshTags()
      }
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeTag = async (tagId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/links/${linkId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })

      if (response.ok) {
        const updatedTags = await response.json()
        onTagsChange(updatedTags)
        // Refresh sidebar tag list (tag might no longer be in use)
        refreshTags()
      }
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      onClose?.()
    }
  }

  const handleSuggestionClick = (tag: Tag) => {
    addTag(tag.name)
  }

  return (
    <div className="mt-2 p-2 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
      {/* Current tags with remove button */}
      <div className="flex flex-wrap gap-1 mb-2">
        {currentTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              disabled={loading}
              className="hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
              title="태그 제거"
            >
              <svg
                className="w-3 h-3"
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
            </button>
          </span>
        ))}
      </div>

      {/* Tag input */}
      <div className="relative">
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="태그 입력..."
            disabled={loading}
            className="flex-1 px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => addTag(inputValue)}
            disabled={loading || !inputValue.trim()}
            className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="태그 추가"
          >
            +
          </button>
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && filteredTags.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded shadow-lg max-h-32 overflow-y-auto">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                onMouseDown={() => handleSuggestionClick(tag)}
                className="w-full px-2 py-1 text-xs text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="mt-2 w-full px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          닫기
        </button>
      )}
    </div>
  )
}
