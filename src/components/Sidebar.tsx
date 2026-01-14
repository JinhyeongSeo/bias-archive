'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import type { Bias, Tag, Group } from '@/types/database'
import { BiasManager } from './BiasManager'
import { ExportModal } from './ExportModal'
import { useRefresh } from '@/contexts/RefreshContext'
import { useNameLanguage } from '@/contexts/NameLanguageContext'
import { quickSpring, smoothSpring, easeOutExpo, pressScale } from '@/lib/animations'

const TAG_COLLAPSED_GROUPS_KEY = 'sidebar-tag-collapsed-groups'

interface GroupedTags {
  group: Group | null
  tags: Tag[]
  groupTag?: Tag  // Tag that matches the group name (for clickable header)
}

interface SidebarProps {
  refreshTrigger?: number
  selectedBiasId?: string | null
  onSelectBias?: (biasId: string | null) => void
  selectedTagId?: string | null
  onSelectTag?: (tagId: string | null) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  selectedPlatform?: string | null
  onSelectPlatform?: (platform: string | null) => void
  onOpenExternalSearch?: () => void
  // Mobile drawer
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  refreshTrigger,
  selectedTagId,
  onSelectTag,
  searchQuery = '',
  onSearchChange,
  selectedPlatform,
  onSelectPlatform,
  onOpenExternalSearch,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const t = useTranslations()
  const locale = useLocale()
  const { tagRefreshTrigger } = useRefresh()
  const { getTagDisplayName, nameLanguage } = useNameLanguage()
  const [biases, setBiases] = useState<Bias[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [isBiasesLoading, setIsBiasesLoading] = useState(true)
  const [isGroupsLoading, setIsGroupsLoading] = useState(true)
  const [isTagsLoading, setIsTagsLoading] = useState(true)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Collapsed state for tag groups
  const [tagCollapsedGroups, setTagCollapsedGroups] = useState<Set<string>>(new Set())

  const PLATFORMS = [
    { id: null, label: t('sidebar.platformAll') },
    { id: 'youtube', label: t('platform.youtube') },
    { id: 'twitter', label: t('platform.twitter') },
    { id: 'weverse', label: t('platform.weverse') },
    { id: 'heye', label: t('platform.heye') },
    { id: 'kgirls', label: t('platform.kgirls') },
  ]

  const fetchBiases = useCallback(async () => {
    try {
      const response = await fetch('/api/biases')
      if (response.ok) {
        const data = await response.json()
        setBiases(data)
      }
    } catch (error) {
      console.error('Error fetching biases:', error)
    } finally {
      setIsBiasesLoading(false)
    }
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsTagsLoading(false)
    }
  }, [])

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setIsGroupsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBiases()
    fetchTags()
    fetchGroups()
  }, [fetchBiases, fetchTags, fetchGroups, refreshTrigger, tagRefreshTrigger])

  async function handleBiasChange() {
    await fetchBiases()
    await fetchGroups()
  }

  function handleTagClick(tagId: string) {
    // Toggle selection: if already selected, deselect
    if (selectedTagId === tagId) {
      onSelectTag?.(null)
    } else {
      onSelectTag?.(tagId)
    }
  }

  // Load collapsed tag groups from localStorage (default: all collapsed)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TAG_COLLAPSED_GROUPS_KEY)
      if (stored) {
        const expandedGroups = new Set<string>(JSON.parse(stored))
        const allGroupIds = new Set(groups.map(g => g.id))
        allGroupIds.add('ungrouped')
        const collapsed = new Set<string>()
        for (const id of allGroupIds) {
          if (!expandedGroups.has(id)) {
            collapsed.add(id)
          }
        }
        setTagCollapsedGroups(collapsed)
      } else {
        // Default: all collapsed
        const allGroupIds = new Set(groups.map(g => g.id))
        allGroupIds.add('ungrouped')
        setTagCollapsedGroups(allGroupIds)
      }
    } catch (error) {
      console.error('Error loading tag collapsed groups:', error)
    }
  }, [groups])

  // Toggle tag group collapse
  const toggleTagGroupCollapse = useCallback((groupId: string) => {
    setTagCollapsedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      // Save expanded groups to localStorage
      try {
        const allGroupIds = new Set(groups.map(g => g.id))
        allGroupIds.add('ungrouped')
        const expandedGroups: string[] = []
        for (const id of allGroupIds) {
          if (!newSet.has(id)) {
            expandedGroups.push(id)
          }
        }
        localStorage.setItem(TAG_COLLAPSED_GROUPS_KEY, JSON.stringify(expandedGroups))
      } catch (error) {
        console.error('Error saving tag collapsed groups:', error)
      }
      return newSet
    })
  }, [groups])

  // Get display name for group based on language mode
  const getGroupDisplayName = useCallback((group: Group): string => {
    const effectiveLanguage: 'en' | 'ko' = nameLanguage === 'auto'
      ? (locale === 'ko' ? 'ko' : 'en')
      : nameLanguage

    if (effectiveLanguage === 'en') {
      return group.name_en || group.name
    } else {
      return group.name_ko || group.name
    }
  }, [nameLanguage, locale])

  // Group tags by bias's group
  const groupedTags = useMemo((): GroupedTags[] => {
    // Create bias name to bias mapping (check all name variants)
    const biasMap = new Map<string, Bias>()
    for (const bias of biases) {
      biasMap.set(bias.name.toLowerCase(), bias)
      if (bias.name_en) biasMap.set(bias.name_en.toLowerCase(), bias)
      if (bias.name_ko) biasMap.set(bias.name_ko.toLowerCase(), bias)
    }

    // Create group map
    const groupMap = new Map<string, Group>()
    for (const group of groups) {
      groupMap.set(group.id, group)
    }

    // Create group name -> group_id mapping for O(1) lookup
    const groupNameToId = new Map<string, string>()
    for (const group of groups) {
      groupNameToId.set(group.name.toLowerCase(), group.id)
      if (group.name_en) groupNameToId.set(group.name_en.toLowerCase(), group.id)
      if (group.name_ko) groupNameToId.set(group.name_ko.toLowerCase(), group.id)
    }

    // Create group_id -> tag mapping (for clicking group headers)
    const groupIdToTag = new Map<string, Tag>()
    for (const tag of tags) {
      const groupId = groupNameToId.get(tag.name.toLowerCase())
      if (groupId && !groupIdToTag.has(groupId)) {
        groupIdToTag.set(groupId, tag)
      }
    }

    // Create set of tag IDs that are group names (to hide from member list)
    const groupTagIds = new Set(Array.from(groupIdToTag.values()).map((t) => t.id))

    // Group tags by their bias's group_id
    const grouped = new Map<string | null, Tag[]>()

    for (const tag of tags) {
      // Skip tags that are group names (they become clickable headers instead)
      if (groupTagIds.has(tag.id)) {
        continue
      }

      const tagNameLower = tag.name.toLowerCase()
      const matchingBias = biasMap.get(tagNameLower)
      const groupId = matchingBias?.group_id || null

      if (!grouped.has(groupId)) {
        grouped.set(groupId, [])
      }
      grouped.get(groupId)!.push(tag)
    }

    // Convert to array with group info
    const result: GroupedTags[] = []

    // First add groups (sorted by groups sort_order)
    // Filter groups that have tags, then sort by sort_order
    const groupsWithTags = groups.filter((g) => grouped.has(g.id))

    for (const group of groupsWithTags) {
      result.push({
        group,
        tags: grouped.get(group.id)!,
        groupTag: groupIdToTag.get(group.id),
      })
    }

    // Add ungrouped tags at the end
    if (grouped.has(null) && grouped.get(null)!.length > 0) {
      result.push({
        group: null,
        tags: grouped.get(null)!,
      })
    }

    return result
  }, [tags, biases, groups])

  // Check if there are any grouped tags
  const hasGroupedTags = groupedTags.some((g) => g.group !== null)

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <>
      {/* Search Input */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          {t('sidebar.search')}
        </h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={t('sidebar.searchPlaceholder')}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
        />
      </section>

      {/* External Search Button */}
      <section className="mb-6">
        <motion.button
          onClick={() => {
            onOpenExternalSearch?.()
            onClose?.()
          }}
          className="w-full px-3 py-2 text-sm font-medium text-surface-foreground bg-muted hover:bg-accent rounded-lg transition-colors flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
          transition={quickSpring}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{t('sidebar.externalSearch')}</span>
        </motion.button>
      </section>

      {/* Platform Filter */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          {t('sidebar.platform')}
        </h2>
        <div className="flex flex-wrap gap-1">
          {PLATFORMS.map((platform) => (
            <motion.button
              key={platform.id ?? 'all'}
              onClick={() => onSelectPlatform?.(platform.id)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-smooth ${
                selectedPlatform === platform.id
                  ? 'bg-primary text-white font-medium shadow-sm'
                  : 'bg-muted text-surface-foreground hover:bg-accent'
              }`}
              whileTap={{ scale: 0.95 }}
              transition={quickSpring}
            >
              {platform.label}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Bias Manager */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          {t('sidebar.biasList')}
        </h2>
        {isBiasesLoading || isGroupsLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('sidebar.loading')}
          </p>
        ) : (
          <BiasManager
            biases={biases}
            groups={groups}
            onBiasAdded={handleBiasChange}
            onBiasDeleted={handleBiasChange}
          />
        )}
      </section>

      {/* Tags / Album Mode */}
      <section className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t('sidebar.tags')}
          </h2>
          {selectedTagId && (
            <motion.button
              onClick={() => onSelectTag?.(null)}
              className="text-xs text-primary hover:text-primary-dark transition-smooth"
              whileTap={{ scale: 0.95 }}
              transition={quickSpring}
            >
              {t('sidebar.viewAll')}
            </motion.button>
          )}
        </div>

        {/* Album mode header - show selected tag */}
        {selectedTagId && (
          <div className="mb-3 p-2.5 bg-primary/10 rounded-xl border border-primary/30">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm font-medium text-primary">
                {getTagDisplayName(tags.find((tag) => tag.id === selectedTagId)?.name || '') || t('sidebar.selectedTag')}
              </span>
            </div>
          </div>
        )}

        {isTagsLoading || isGroupsLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('sidebar.loading')}
          </p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('sidebar.noTags')}
          </p>
        ) : hasGroupedTags ? (
          // Group-based tag display with collapsible groups
          <div className="space-y-1">
            {groupedTags.map(({ group, tags: groupTags, groupTag }) => {
              const groupId = group?.id || 'ungrouped'
              const isCollapsed = tagCollapsedGroups.has(groupId)
              const groupDisplayName = group ? getGroupDisplayName(group) : t('sidebar.ungrouped') || '그룹 없음'

              return (
                <div key={groupId}>
                  {/* Group header with collapse toggle */}
                  <div className="flex items-center">
                    <motion.button
                      type="button"
                      onClick={() => toggleTagGroupCollapse(groupId)}
                      className="flex items-center gap-1 px-1 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-smooth rounded"
                      {...pressScale}
                    >
                      <motion.svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        animate={{ rotate: isCollapsed ? 0 : 90 }}
                        transition={quickSpring}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </motion.svg>
                      <span>{groupDisplayName}</span>
                      <span className="text-muted-foreground ml-0.5">
                        ({groupTags.length})
                      </span>
                    </motion.button>
                    {/* Clickable group tag link */}
                    {group && groupTag && (
                      <motion.button
                        onClick={() => handleTagClick(groupTag.id)}
                        className={`ml-1 text-xs transition-smooth ${
                          selectedTagId === groupTag.id
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-primary hover:underline'
                        }`}
                        whileTap={{ scale: 0.95 }}
                        transition={quickSpring}
                        title={`${groupDisplayName} 태그 선택`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </motion.button>
                    )}
                  </div>
                  {/* Tags in this group - collapsible */}
                  {!isCollapsed && (
                    <div className="flex flex-wrap gap-1 px-4 mt-0.5">
                      {groupTags.map((tag) => (
                        <motion.button
                          key={tag.id}
                          onClick={() => handleTagClick(tag.id)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-smooth ${
                            selectedTagId === tag.id
                              ? 'bg-primary text-white font-medium shadow-sm'
                              : 'bg-muted text-surface-foreground hover:bg-accent'
                          }`}
                          whileTap={{ scale: 0.95 }}
                          transition={quickSpring}
                        >
                          {getTagDisplayName(tag.name)}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          // Flat tag display (no groups)
          <ul className="space-y-1">
            {tags.map((tag) => (
              <li key={tag.id}>
                <motion.button
                  onClick={() => handleTagClick(tag.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-smooth ${
                    selectedTagId === tag.id
                      ? 'bg-primary text-white font-medium shadow-sm'
                      : 'text-surface-foreground hover:bg-accent'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  transition={quickSpring}
                >
                  {getTagDisplayName(tag.name)}
                </motion.button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Data Management */}
      <section className="pt-4 border-t border-border">
        <motion.button
          onClick={() => setIsExportModalOpen(true)}
          className="w-full px-3 py-2 text-sm font-medium text-surface-foreground bg-muted hover:bg-accent rounded-lg transition-colors flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
          transition={quickSpring}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>{t('sidebar.dataManagement')}</span>
        </motion.button>
      </section>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onImportComplete={() => {
          fetchBiases()
          fetchTags()
          fetchGroups()
        }}
      />
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 h-[calc(100vh-3.5rem)] border-r border-border bg-surface p-4 overflow-y-auto scrollbar-thin">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={easeOutExpo}
              onClick={onClose}
            />

            {/* Drawer Panel */}
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-surface shadow-2xl md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={smoothSpring}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between h-14 px-4 border-b border-border">
                <span className="text-lg font-bold">메뉴</span>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                  whileTap={{ scale: 0.9 }}
                  transition={quickSpring}
                  aria-label="메뉴 닫기"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {sidebarContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
