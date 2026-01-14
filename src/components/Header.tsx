'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NameLanguageToggle } from './NameLanguageToggle'
import { UserMenu } from './UserMenu'

export function Header() {
  const locale = useLocale()
  const t = useTranslations()

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="text-lg font-bold hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            {t('app.title')}
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link
              href={`/${locale}/gif`}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              {t('nav.gif')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <NameLanguageToggle />
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
