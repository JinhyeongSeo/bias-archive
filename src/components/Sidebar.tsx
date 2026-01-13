'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Bias, Tag } from '@/types/database'
import { BiasManager } from './BiasManager'

interface SidebarProps {
  refreshTrigger?: number
  selectedBiasId?: string | null
  onSelectBias?: (biasId: string | null) => void
  selectedTagId?: string | null
  onSelectTag?: (tagId: string | null) => void
}

export function Sidebar({
  refreshTrigger,
  selectedBiasId,
  onSelectBias,
  selectedTagId,
  onSelectTag,
}: SidebarProps) {
  const [biases, setBiases] = useState<Bias[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTagsLoading, setIsTagsLoading] = useState(true)
  const [internalRefresh, setInternalRefresh] = useState(0)

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
  }, [fetchBiases, fetchTags, refreshTrigger, internalRefresh])

  function handleBiasChange() {
    setInternalRefresh((prev) => prev + 1)
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
    <aside className="hidden md:flex flex-col w-60 h-[calc(100vh-3.5rem)] border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
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
