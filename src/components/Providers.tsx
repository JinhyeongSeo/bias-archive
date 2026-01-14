'use client'

import { ThemeProvider } from 'next-themes'
import { RefreshProvider } from '@/contexts/RefreshContext'
import { NameLanguageProvider } from '@/contexts/NameLanguageContext'
import { MobileMenuProvider } from '@/contexts/MobileMenuContext'
import { AuthProvider } from '@/components/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <RefreshProvider>
          <NameLanguageProvider>
            <MobileMenuProvider>
              {children}
            </MobileMenuProvider>
          </NameLanguageProvider>
        </RefreshProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
