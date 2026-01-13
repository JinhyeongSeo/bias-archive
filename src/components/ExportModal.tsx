'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ExportData, ImportResult } from '@/lib/export'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: () => void
}

type TabType = 'export' | 'import'

export function ExportModal({ isOpen, onClose, onImportComplete }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('export')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportStats, setExportStats] = useState<{ links: number; tags: number; biases: number } | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ExportData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch export stats when modal opens
  useEffect(() => {
    if (isOpen && !exportStats) {
      fetchExportStats()
    }
  }, [isOpen, exportStats])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImportFile(null)
      setImportPreview(null)
      setImportResult(null)
      setError(null)
    }
  }, [isOpen])

  // Handle ESC key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  async function fetchExportStats() {
    try {
      const response = await fetch('/api/export')
      if (response.ok) {
        const data: ExportData = await response.json()
        setExportStats({
          links: data.links.length,
          tags: data.tags.length,
          biases: data.biases.length,
        })
      }
    } catch (err) {
      console.error('Failed to fetch export stats:', err)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/export')
      if (!response.ok) {
        throw new Error('내보내기에 실패했습니다')
      }

      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const filename = `bias-archive-backup-${date}.json`

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setIsExporting(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setImportPreview(null)
    setImportResult(null)
    setError(null)

    // Read and preview file
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content) as ExportData

        // Basic validation
        if (!data.version || !data.links || !data.tags || !data.biases) {
          throw new Error('유효하지 않은 백업 파일입니다')
        }

        setImportPreview(data)
      } catch {
        setError('파일을 읽을 수 없습니다. 유효한 백업 파일인지 확인해주세요.')
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!importPreview) return

    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPreview),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '가져오기에 실패했습니다')
      }

      const result = await response.json()
      setImportResult(result.result)
      onImportComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
            데이터 관리
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            내보내기
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            가져오기
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                모든 아카이브 데이터를 JSON 파일로 백업합니다.
              </p>

              {/* Stats */}
              {exportStats && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    <p>링크: <span className="font-medium">{exportStats.links}개</span></p>
                    <p>태그: <span className="font-medium">{exportStats.tags}개</span></p>
                    <p>최애: <span className="font-medium">{exportStats.biases}개</span></p>
                  </div>
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isExporting ? '내보내는 중...' : 'JSON 다운로드'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                백업 파일을 업로드하여 데이터를 복원합니다. 기존 데이터는 유지됩니다.
              </p>

              {/* File upload */}
              <label className="block">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="text-center">
                    <svg className="mx-auto w-8 h-8 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {importFile ? importFile.name : '클릭하여 파일 선택'}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Preview */}
              {importPreview && !importResult && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">가져올 데이터:</p>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <p>링크: <span className="font-medium">{importPreview.links.length}개</span></p>
                    <p>태그: <span className="font-medium">{importPreview.tags.length}개</span></p>
                    <p>최애: <span className="font-medium">{importPreview.biases.length}개</span></p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      백업 날짜: {new Date(importPreview.exportedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">가져오기 완료!</p>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    <p>추가됨: 링크 {importResult.imported.links}개, 태그 {importResult.imported.tags}개, 최애 {importResult.imported.biases}개</p>
                    <p>스킵됨: 링크 {importResult.skipped.links}개, 태그 {importResult.skipped.tags}개, 최애 {importResult.skipped.biases}개</p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 text-red-600 dark:text-red-400">
                        <p className="font-medium">오류:</p>
                        <ul className="list-disc list-inside text-xs">
                          {importResult.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>...외 {importResult.errors.length - 5}개</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!importPreview || isImporting || !!importResult}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {isImporting ? '가져오는 중...' : importResult ? '완료' : '가져오기'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}
