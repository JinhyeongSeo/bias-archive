'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import type { Bias } from '@/types/database'
import { useRefresh } from '@/contexts/RefreshContext'

export type NameLanguage = 'en' | 'ko' | 'auto'

interface NameLanguageContextType {
  nameLanguage: NameLanguage
  setNameLanguage: (language: NameLanguage) => void
  getDisplayName: (bias: Bias) => string
  getTagDisplayName: (tagName: string) => string
  mounted: boolean
}

const NameLanguageContext = createContext<NameLanguageContextType | undefined>(undefined)

// Storage key removed - nameLanguage is always 'auto' now

export function NameLanguageProvider({ children }: { children: ReactNode }) {
  // nameLanguage is always 'auto' - follows UI locale
  const nameLanguage: NameLanguage = 'auto'
  const [mounted, setMounted] = useState(false)
  const [biases, setBiases] = useState<Bias[]>([])
  const locale = useLocale()
  const { tagRefreshTrigger } = useRefresh()

  // Fetch biases for tag display name lookup
  useEffect(() => {
    const fetchBiases = async () => {
      try {
        const response = await fetch('/api/biases')
        if (response.ok) {
          const data = await response.json()
          setBiases(data)
        }
      } catch (error) {
        console.error('Error fetching biases for tag display:', error)
      }
    }
    fetchBiases()
  }, [tagRefreshTrigger])

  // Mark as mounted - nameLanguage is always 'auto' now
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Set mounted flag on mount
    setMounted(true)
  }, [])

  // setNameLanguage is kept for API compatibility but effectively no-op
  // nameLanguage is always 'auto' now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- API compatibility
  const setNameLanguage = useCallback((_language: NameLanguage) => {
    // No-op: nameLanguage is fixed to 'auto'
  }, [])

  // Get display name based on current language setting
  const getDisplayName = useCallback((bias: Bias): string => {
    const effectiveLanguage: 'en' | 'ko' = nameLanguage === 'auto'
      ? (locale === 'ko' ? 'ko' : 'en')
      : nameLanguage

    if (effectiveLanguage === 'en') {
      return bias.name_en || bias.name
    } else {
      return bias.name_ko || bias.name
    }
  }, [nameLanguage, locale])

  // Get tag display name based on current language setting
  // Looks up the tag name in biases (matching name, name_en, or name_ko)
  // and returns the appropriate language version
  const getTagDisplayName = useCallback((tagName: string): string => {
    if (!mounted) return tagName

    // Find bias matching this tag name (check all three name fields)
    const matchingBias = biases.find(
      (bias) =>
        bias.name.toLowerCase() === tagName.toLowerCase() ||
        (bias.name_en && bias.name_en.toLowerCase() === tagName.toLowerCase()) ||
        (bias.name_ko && bias.name_ko.toLowerCase() === tagName.toLowerCase())
    )

    if (!matchingBias) return tagName

    const effectiveLanguage: 'en' | 'ko' = nameLanguage === 'auto'
      ? (locale === 'ko' ? 'ko' : 'en')
      : nameLanguage

    if (effectiveLanguage === 'en') {
      return matchingBias.name_en || matchingBias.name
    } else {
      return matchingBias.name_ko || matchingBias.name
    }
  }, [biases, mounted, nameLanguage, locale])

  return (
    <NameLanguageContext.Provider
      value={{
        nameLanguage,
        setNameLanguage,
        getDisplayName,
        getTagDisplayName,
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
