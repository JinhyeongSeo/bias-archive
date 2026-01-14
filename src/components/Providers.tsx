'use client'

import { ThemeProvider } from 'next-themes'
import { RefreshProvider } from '@/contexts/RefreshContext'
import { NameLanguageProvider } from '@/contexts/NameLanguageContext'
import { AuthProvider } from '@/components/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <RefreshProvider>
          <NameLanguageProvider>
            {children}
          </NameLanguageProvider>
        </RefreshProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
