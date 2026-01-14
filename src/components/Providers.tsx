'use client'

import { ThemeProvider } from 'next-themes'
import { RefreshProvider } from '@/contexts/RefreshContext'
import { NameLanguageProvider } from '@/contexts/NameLanguageContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RefreshProvider>
        <NameLanguageProvider>
          {children}
        </NameLanguageProvider>
      </RefreshProvider>
    </ThemeProvider>
  )
}
