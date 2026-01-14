'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import type { Bias } from '@/types/database'

export type NameLanguage = 'en' | 'ko' | 'auto'

interface NameLanguageContextType {
  nameLanguage: NameLanguage
  setNameLanguage: (language: NameLanguage) => void
  getDisplayName: (bias: Bias) => string
  mounted: boolean
}

const NameLanguageContext = createContext<NameLanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'name-language'

export function NameLanguageProvider({ children }: { children: ReactNode }) {
  const [nameLanguage, setNameLanguageState] = useState<NameLanguage>('auto')
  const [mounted, setMounted] = useState(false)
  const locale = useLocale()

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (stored === 'en' || stored === 'ko' || stored === 'auto')) {
      setNameLanguageState(stored as NameLanguage)
    }
    setMounted(true)
  }, [])

  // Save to localStorage when changed
  const setNameLanguage = useCallback((language: NameLanguage) => {
    setNameLanguageState(language)
    localStorage.setItem(STORAGE_KEY, language)
  }, [])

  // Get display name based on current language setting
  const getDisplayName = useCallback((bias: Bias): string => {
    let effectiveLanguage: 'en' | 'ko' = nameLanguage === 'auto'
      ? (locale === 'ko' ? 'ko' : 'en')
      : nameLanguage

    if (effectiveLanguage === 'en') {
      return bias.name_en || bias.name
    } else {
      return bias.name_ko || bias.name
    }
  }, [nameLanguage, locale])

  return (
    <NameLanguageContext.Provider
      value={{
        nameLanguage,
        setNameLanguage,
        getDisplayName,
        mounted,
      }}
    >
      {children}
    </NameLanguageContext.Provider>
  )
}

export function useNameLanguage() {
  const context = useContext(NameLanguageContext)
  if (context === undefined) {
    throw new Error('useNameLanguage must be used within a NameLanguageProvider')
  }
  return context
}
