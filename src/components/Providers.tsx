'use client'

import { ThemeProvider } from 'next-themes'
import { RefreshProvider } from '@/contexts/RefreshContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RefreshProvider>
        {children}
      </RefreshProvider>
    </ThemeProvider>
  )
}
