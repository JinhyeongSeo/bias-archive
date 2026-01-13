'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Bias } from '@/types/database'
import { BiasManager } from './BiasManager'

interface SidebarProps {
  refreshTrigger?: number
  selectedBiasId?: string | null
  onSelectBias?: (biasId: string | null) => void
}

export function Sidebar({ refreshTrigger, selectedBiasId, onSelectBias }: SidebarProps) {
  const [biases, setBiases] = useState<Bias[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  useEffect(() => {
    fetchBiases()
  }, [fetchBiases, refreshTrigger, internalRefresh])

  function handleBiasChange() {
    setInternalRefresh((prev) => prev + 1)
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
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          태그가 없습니다
        </p>
      </section>
    </aside>
  )
}
