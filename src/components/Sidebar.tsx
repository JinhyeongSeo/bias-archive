'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Bias, Tag } from '@/types/database'
import { BiasManager } from './BiasManager'
import { useRefresh } from '@/contexts/RefreshContext'

const PLATFORMS = [
  { id: null, label: '전체' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'weverse', label: 'Weverse' },
]

interface SidebarProps {
  refreshTrigger?: number
  selectedBiasId?: string | null
  onSelectBias?: (biasId: string | null) => void
  selectedTagId?: string | null
  onSelectTag?: (tagId: string | null) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  selectedPlatform?: string | null
  onSelectPlatform?: (platform: string | null) => void
  onOpenExternalSearch?: () => void
}

export function Sidebar({
  refreshTrigger,
  selectedTagId,
  onSelectTag,
  searchQuery = '',
  onSearchChange,
  selectedPlatform,
  onSelectPlatform,
  onOpenExternalSearch,
}: SidebarProps) {
  const { tagRefreshTrigger } = useRefresh()
  const [biases, setBiases] = useState<Bias[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTagsLoading, setIsTagsLoading] = useState(true)

  const fetchBiases = useCallback(async () => {
    try {
      const response = await fetch('/api/biases')
      if (response.ok) {
        const data = await response.json()
        setBiases(data)
      }
    } catch (error) {
      console.error('Error fetching biases:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsTagsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBiases()
    fetchTags()
  }, [fetchBiases, fetchTags, refreshTrigger, tagRefreshTrigger])

  async function handleBiasChange() {
    await fetchBiases()
  }

  function handleTagClick(tagId: string) {
    // Toggle selection: if already selected, deselect
    if (selectedTagId === tagId) {
      onSelectTag?.(null)
    } else {
      onSelectTag?.(tagId)
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-60 h-[calc(100vh-3.5rem)] border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 overflow-y-auto">
      {/* Search Input */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          검색
        </h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="제목, 설명, 작성자 검색..."
          className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </section>

      {/* External Search Button */}
      <section className="mb-6">
        <button
          onClick={onOpenExternalSearch}
          className="w-full px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>외부 검색 (YouTube, Twitter)</span>
        </button>
      </section>

      {/* Platform Filter */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          플랫폼
        </h2>
        <div className="flex flex-wrap gap-1">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id ?? 'all'}
              onClick={() => onSelectPlatform?.(platform.id)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPlatform === platform.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {platform.label}
            </button>
          ))}
        </div>
      </section>

      {/* Bias Manager */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          최애 목록
        </h2>
        {isLoading ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            로딩 중...
          </p>
        ) : (
          <BiasManager
            biases={biases}
            onBiasAdded={handleBiasChange}
            onBiasDeleted={handleBiasChange}
          />
        )}
      </section>

      {/* Tags */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
          태그
        </h2>
        {isTagsLoading ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            로딩 중...
          </p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            태그가 없습니다
          </p>
        ) : (
          <ul className="space-y-1">
            {tags.map((tag) => (
              <li key={tag.id}>
                <button
                  onClick={() => handleTagClick(tag.id)}
                  className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                    selectedTagId === tag.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tag.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
