'use client'

import { useState } from 'react'
import type { Bias } from '@/types/database'

interface BiasManagerProps {
  biases: Bias[]
  onBiasAdded: () => void
  onBiasDeleted: () => void
}

export function BiasManager({ biases, onBiasAdded, onBiasDeleted }: BiasManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/biases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          groupName: groupName.trim() || null,
        }),
      })

      if (response.ok) {
        setName('')
        setGroupName('')
        setIsFormOpen(false)
        onBiasAdded()
      } else {
        const error = await response.json()
        alert(error.error || '최애 추가에 실패했습니다')
      }
    } catch (error) {
      console.error('Error adding bias:', error)
      alert('최애 추가에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string, biasName: string) {
    if (!confirm(`"${biasName}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/biases/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onBiasDeleted()
      } else {
        const error = await response.json()
        alert(error.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Error deleting bias:', error)
      alert('삭제에 실패했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  function formatBiasName(bias: Bias): string {
    if (bias.group_name) {
      return `${bias.name} (${bias.group_name})`
    }
    return bias.name
  }

  return (
    <div className="space-y-2">
      {/* Bias list with delete buttons */}
      {biases.length > 0 && (
        <ul className="space-y-1">
          {biases.map((bias) => (
            <li
              key={bias.id}
              className="flex items-center justify-between group px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            >
              <span className="truncate">{formatBiasName(bias)}</span>
              <button
                onClick={() => handleDelete(bias.id, formatBiasName(bias))}
                disabled={deletingId === bias.id}
                className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-opacity disabled:opacity-50"
                title="삭제"
              >
                {deletingId === bias.id ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {biases.length === 0 && !isFormOpen && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 px-2">
          아직 최애가 없습니다
        </p>
      )}

      {/* Add form */}
      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 (필수)"
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            autoFocus
          />
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="그룹명 (선택)"
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 px-2 py-1.5 text-sm bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '추가 중...' : '추가'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false)
                setName('')
                setGroupName('')
              }}
              className="px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-zinc-500 hover:text-pink-500 dark:text-zinc-400 dark:hover:text-pink-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>최애 추가</span>
        </button>
      )}
    </div>
  )
}
