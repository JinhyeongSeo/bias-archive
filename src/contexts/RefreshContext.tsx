'use client'

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react'

interface RefreshContextType {
  // Triggers for different data types
  tagRefreshTrigger: number
  biasRefreshTrigger: number
  // Functions to trigger refresh
  refreshTags: () => void
  refreshBiases: () => void
  refreshAll: () => void
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [tagRefreshTrigger, setTagRefreshTrigger] = useState(0)
  const [biasRefreshTrigger, setBiasRefreshTrigger] = useState(0)

  const refreshTags = useCallback(() => {
    setTagRefreshTrigger((prev) => prev + 1)
  }, [])

  const refreshBiases = useCallback(() => {
    setBiasRefreshTrigger((prev) => prev + 1)
  }, [])

  const refreshAll = useCallback(() => {
    setTagRefreshTrigger((prev) => prev + 1)
    setBiasRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <RefreshContext.Provider
      value={{
        tagRefreshTrigger,
        biasRefreshTrigger,
        refreshTags,
        refreshBiases,
        refreshAll,
      }}
    >
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider')
  }
  return context
}
