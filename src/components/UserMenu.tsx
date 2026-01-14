'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth')
  const { user, loading, signOut } = useAuth()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
    // Refresh the page to clear cached data
    router.refresh()
  }

  // Loading state: show skeleton
  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  // Not logged in: show login button
  if (!user) {
    return (
      <Link
        href={`/${locale}/login`}
        className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-smooth"
      >
        {t('login')}
      </Link>
    )
  }

  // Logged in: show user menu
  const userInitial = user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium hover:bg-primary-dark transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
        aria-label="User menu"
      >
        {userInitial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-card border border-border shadow-lg z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {user.email}
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-surface-foreground hover:bg-accent transition-smooth"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
