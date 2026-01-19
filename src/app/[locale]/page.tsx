'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LinkForm } from '@/components/LinkForm'
import { LinkList } from '@/components/LinkList'
import { Sidebar } from '@/components/Sidebar'
import { ExternalSearch } from '@/components/ExternalSearch'
import { UnifiedSearch } from '@/components/UnifiedSearch'
import { LayoutToggle } from '@/components/LayoutToggle'
import { Timeline } from '@/components/Timeline'
import { useMobileMenu } from '@/contexts/MobileMenuContext'
import { useArchiveQueue } from '@/hooks/useArchiveQueue'
import type { Bias, Group } from '@/types/database'

type LayoutType = 'grid' | 'list'

const LAYOUT_STORAGE_KEY = 'bias-archive-layout'

// Inner component that uses useSearchParams
function HomeContent() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [savedUrls, setSavedUrls] = useState<string[]>([])
  const [isExternalSearchOpen, setIsExternalSearchOpen] = useState(false)
  const [isUnifiedSearchOpen, setIsUnifiedSearchOpen] = useState(false)
  const [layout, setLayout] = useState<LayoutType>('grid')
  const { isOpen: isMobileMenuOpen, close: closeMobileMenu } = useMobileMenu()

  // Background archive queue processing (runs every 1 minute)
  useArchiveQueue()

  // Biases and groups for UnifiedSearch
  const [biases, setBiases] = useState<Bias[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  // Fetch biases and groups
  const fetchBiasesAndGroups = useCallback(async () => {
    try {
      const [biasesRes, groupsRes] = await Promise.all([
        fetch('/api/biases'),
        fetch('/api/groups'),
      ])
      if (biasesRes.ok) {
        setBiases(await biasesRes.json())
      }
      if (groupsRes.ok) {
        setGroups(await groupsRes.json())
      }
    } catch (error) {
      console.error('Error fetching biases/groups:', error)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data fetch on mount
    fetchBiasesAndGroups()
  }, [fetchBiasesAndGroups, refreshTrigger])

  // Load tag from URL parameter on mount
  useEffect(() => {
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      // Support single tag for now (first tag if comma-separated)
      const tagId = tagsParam.split(',')[0]
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync state from URL params
      setSelectedTagId(tagId || null)
    }
  }, [searchParams])

  // Load layout preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (saved === 'grid' || saved === 'list') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync state from localStorage
      setLayout(saved)
    }
  }, [])

  // Save layout preference to localStorage
  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    setLayout(newLayout)
    localStorage.setItem(LAYOUT_STORAGE_KEY, newLayout)
  }, [])

  // Update URL when tag is selected
  const handleTagSelect = useCallback((tagId: string | null) => {
    setSelectedTagId(tagId)

    // Update URL parameter
    const params = new URLSearchParams(searchParams.toString())
    if (tagId) {
      params.set('tags', tagId)
    } else {
      params.delete('tags')
    }

    const newUrl = params.toString() ? `?${params.toString()}` : './'
    router.push(newUrl, { scroll: false })
  }, [router, searchParams])

  const handleSave = () => {
    // Increment to trigger LinkList refresh
    setRefreshTrigger((prev) => prev + 1)
    // Archive queue will be processed automatically every 1 minute
  }

  const handleLinksLoad = useCallback((urls: string[]) => {
    setSavedUrls(urls)
  }, [])

  return (
    <div className="flex">
      <Sidebar
        refreshTrigger={refreshTrigger}
        selectedTagId={selectedTagId}
        onSelectTag={handleTagSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        onOpenExternalSearch={() => setIsExternalSearchOpen(true)}
        onOpenUnifiedSearch={() => setIsUnifiedSearchOpen(true)}
        onBiasChange={() => {
          fetchBiasesAndGroups()
          setRefreshTrigger((prev) => prev + 1)  // Also refresh link list
        }}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      <main className="flex-1 flex flex-col items-center pt-12 px-4 sm:px-8">
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            {t('link.add')}
          </h2>
          <LinkForm onSave={handleSave} />
        </div>

        {/* Timeline - On This Day */}
        <div className="w-full max-w-6xl mt-12">
          <Timeline refreshTrigger={refreshTrigger} />
        </div>

        <div className="w-full max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {t('link.savedLinks')}
            </h2>
            <LayoutToggle layout={layout} onChange={handleLayoutChange} />
          </div>
          <LinkList
            refreshTrigger={refreshTrigger}
            searchQuery={searchQuery}
            tagId={selectedTagId}
            platform={selectedPlatform}
            onLinksLoad={handleLinksLoad}
            layout={layout}
          />
        </div>
      </main>

      {/* External Search Modal */}
      <ExternalSearch
        isOpen={isExternalSearchOpen}
        onClose={() => setIsExternalSearchOpen(false)}
        savedUrls={savedUrls}
        onSave={handleSave}
      />

      {/* Unified Search Modal */}
      <UnifiedSearch
        isOpen={isUnifiedSearchOpen}
        onClose={() => setIsUnifiedSearchOpen(false)}
        savedUrls={savedUrls}
        onSave={handleSave}
        biases={biases}
        groups={groups}
      />
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
