'use client'

import { useState, useEffect } from 'react'
import type { Bias } from '@/types/database'

interface SidebarProps {
  refreshTrigger?: number
  selectedBiasId?: string | null
  onSelectBias?: (biasId: string | null) => void
}

export function Sidebar({ refreshTrigger, selectedBiasId, onSelectBias }: SidebarProps) {
  const [biases, setBiases] = useState<Bias[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBiases() {
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
    }

    fetchBiases()
  }, [refreshTrigger])

  function formatBiasName(bias: Bias): string {
    if (bias.group_name) {
      return `${bias.name} (${bias.group_name})`
    }
    return bias.name
  }

  function handleBiasClick(biasId: string) {
    if (onSelectBias) {
      onSelectBias(selectedBiasId === biasId ? null : biasId)
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
        ) : biases.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            아직 최애가 없습니다
          </p>
        ) : (
          <ul className="space-y-1">
            {biases.map((bias) => (
              <li key={bias.id}>
                <button
                  onClick={() => handleBiasClick(bias.id)}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                    selectedBiasId === bias.id
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {formatBiasName(bias)}
                </button>
              </li>
            ))}
          </ul>
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
