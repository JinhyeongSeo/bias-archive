'use client'

import { useNameLanguage, NameLanguage } from '@/contexts/NameLanguageContext'
import { useTranslations } from 'next-intl'

export function NameLanguageToggle() {
  const { nameLanguage, setNameLanguage, mounted } = useNameLanguage()
  const t = useTranslations()

  // Show placeholder before hydration
  if (!mounted) {
    return <div className="w-24 h-9" />
  }

  const options: { value: NameLanguage; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'ko', label: 'KO' },
    { value: 'auto', label: t('header.nameLanguageAuto') },
  ]

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400 text-xs mr-1 hidden sm:inline">
        {t('header.nameLanguage')}
      </span>
      <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setNameLanguage(option.value)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              nameLanguage === option.value
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
