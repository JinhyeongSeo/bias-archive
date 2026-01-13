'use client'

import { useState } from 'react'
import { LinkForm } from '@/components/LinkForm'
import { LinkList } from '@/components/LinkList'

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSave = () => {
    // Increment to trigger LinkList refresh
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col items-center pt-12 px-4 sm:px-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-6 text-center">
          링크 추가
        </h2>
        <LinkForm onSave={handleSave} />
      </div>

      <div className="w-full max-w-6xl mt-12">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-6">
          저장된 링크
        </h2>
        <LinkList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
