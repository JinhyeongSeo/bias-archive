'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UserMenu } from './UserMenu'
import { useMobileMenu } from '@/contexts/MobileMenuContext'
import { quickSpring } from '@/lib/animations'

const MotionLink = motion.create(Link)

export function Header() {
  const locale = useLocale()
  const t = useTranslations()
  const { open: openMobileMenu } = useMobileMenu()

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile menu button */}
          <motion.button
            onClick={openMobileMenu}
            className="md:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            whileTap={{ scale: 0.9 }}
            transition={quickSpring}
            aria-label="메뉴 열기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>

          <MotionLink
            href={`/${locale}`}
            className="text-lg font-bold hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={quickSpring}
          >
            {t('app.title')}
          </MotionLink>
          <nav className="hidden sm:flex items-center gap-4">
            <MotionLink
              href={`/${locale}/gif`}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
              whileTap={{ scale: 0.95 }}
              transition={quickSpring}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              {t('nav.gif')}
            </MotionLink>
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
