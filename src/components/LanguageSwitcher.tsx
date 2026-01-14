'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: string) => {
    // Replace the locale segment in the pathname
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPathname = segments.join('/')

    startTransition(() => {
      router.replace(newPathname)
    })
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          disabled={isPending}
          className={`px-2 py-1 text-xs font-medium rounded-lg transition-smooth ${
            locale === loc
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
