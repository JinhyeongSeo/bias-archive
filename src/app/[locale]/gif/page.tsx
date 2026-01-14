'use client'

import { useTranslations } from 'next-intl'
import { GifMaker } from '@/components/GifMaker'

export default function GifPage() {
  const t = useTranslations('gif')

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center justify-center gap-3">
            <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            {t('title')}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('subtitle')}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            {t('privacy')}
          </p>
        </div>

        {/* GIF Maker Component */}
        <GifMaker />

        {/* Instructions */}
        <div className="mt-12 p-6 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {t('howToUse')}
          </h2>
          <ol className="space-y-3 text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">1</span>
              <span>{t('step1')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">2</span>
              <span>{t('step2')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">3</span>
              <span>{t('step3')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">4</span>
              <span>{t('step4')}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">5</span>
              <span>{t('step5')}</span>
            </li>
          </ol>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('tips')}
          </h3>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>{t('tip1')}</li>
            <li>{t('tip2')}</li>
            <li>{t('tip3')}</li>
            <li>{t('tip4')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
