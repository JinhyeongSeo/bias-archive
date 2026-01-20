'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { DropResult } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import type { Bias, BiasWithGroup, Group } from '@/types/index'
import { useNameLanguage } from '@/contexts/NameLanguageContext'
import { useLocale } from 'next-intl'
import { pressScale } from '@/lib/animations'
import { BiasList } from './bias/BiasList'
import { MemberSelector } from './bias/MemberSelector'
import { BiasForm } from './bias/BiasForm'

interface KpopGroup {
  id: string
  name: string
  name_original: string
  memberCount: number
  source?: 'selca' | 'namuwiki'
}

interface KpopMember {
  id: string
  name: string
  name_original: string
  hasSelcaOwner?: boolean
}

interface KpopMemberWithGroup {
  id: string
  name: string
  name_original: string
  group: {
    id: string
    name: string
    name_original: string
  } | null
}

interface GroupedBiases {
  group: Group | null
  biases: BiasWithGroup[]
}

interface BiasManagerProps {
  biases: Bias[]
  groups: Group[]
  onBiasAdded: () => void
  onBiasDeleted: () => void
  onBiasReordered?: () => void
}

const COLLAPSED_GROUPS_KEY = 'bias-manager-collapsed-groups'

export function BiasManager({ biases, groups, onBiasAdded, onBiasDeleted, onBiasReordered }: BiasManagerProps) {
  const { getDisplayName, nameLanguage } = useNameLanguage()
  const locale = useLocale()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameKo, setNameKo] = useState('')
  const [selcaSlug, setSelcaSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Group mode state
  const [isGroupMode, setIsGroupMode] = useState(false)
  const [groupQuery, setGroupQuery] = useState('')
  const [groupResults, setGroupResults] = useState<KpopGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; nameOriginal: string; hasSelcaGroup?: boolean; selcaGroupSlug?: string; source?: 'selca' | 'namuwiki' } | null>(null)
  const [groupMembers, setGroupMembers] = useState<KpopMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isBatchAdding, setIsBatchAdding] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Individual member autocomplete state
  const [memberSearchResults, setMemberSearchResults] = useState<KpopMemberWithGroup[]>([])
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<{ name: string; nameEn: string; nameKo: string; selcaSlug?: string } | null>(null)

  // Local bias order for optimistic updates during drag
  const [localBiases, setLocalBiases] = useState<Bias[]>(biases)
  const [localGroups, setLocalGroups] = useState<Group[]>(groups)
  const [, setIsReordering] = useState(false)

  // Sync localBiases when biases prop changes (from server)
  useEffect(() => {
    setLocalBiases(biases)
  }, [biases])

  // Sync localGroups when groups prop changes (from server)
  useEffect(() => {
    setLocalGroups(groups)
  }, [groups])

  const dropdownRef = useRef<HTMLDivElement>(null)
  const memberDropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const memberSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  // Load collapsed groups from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_GROUPS_KEY)
      if (stored) {
        const expandedGroups = new Set<string>(JSON.parse(stored))
        const allGroupIds = new Set(localGroups.map(g => g.id))
        allGroupIds.add('ungrouped')
        const collapsed = new Set<string>()
        for (const id of allGroupIds) {
          if (!expandedGroups.has(id)) {
            collapsed.add(id)
          }
        }
        setCollapsedGroups(collapsed)
      } else {
        const allGroupIds = new Set(localGroups.map(g => g.id))
        allGroupIds.add('ungrouped')
        setCollapsedGroups(allGroupIds)
      }
    } catch (error) {
      console.error('Error loading collapsed groups:', error)
    }
  }, [localGroups])

  // Group biases by their group_id
  const groupedBiases = useMemo((): GroupedBiases[] => {
    const groupMap = new Map<string, Group>()
    for (const group of localGroups) {
      groupMap.set(group.id, group)
    }

    const biasesWithGroups: BiasWithGroup[] = localBiases.map((bias) => ({
      ...bias,
      group: bias.group_id ? groupMap.get(bias.group_id) ?? null : null,
    }))

    const grouped = new Map<string | null, BiasWithGroup[]>()

    for (const bias of biasesWithGroups) {
      const groupId = bias.group_id
      if (!grouped.has(groupId)) {
        grouped.set(groupId, [])
      }
      grouped.get(groupId)!.push(bias)
    }

    const result: GroupedBiases[] = []

    for (const group of localGroups) {
      if (grouped.has(group.id)) {
        result.push({
          group,
          biases: grouped.get(group.id)!,
        })
      }
    }

    if (grouped.has(null)) {
      result.push({
        group: null,
        biases: grouped.get(null)!,
      })
    }

    return result
  }, [localBiases, localGroups])

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      try {
        const allGroupIds = new Set(localGroups.map(g => g.id))
        allGroupIds.add('ungrouped')
        const expandedGroups: string[] = []
        for (const id of allGroupIds) {
          if (!newSet.has(id)) {
            expandedGroups.push(id)
          }
        }
        localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(expandedGroups))
      } catch (error) {
        console.error('Error saving collapsed groups:', error)
      }
      return newSet
    })
  }, [localGroups])

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

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, type } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    if (type === 'GROUP') {
      const groupsOnly = groupedBiases.filter(g => g.group !== null)
      if (source.index >= groupsOnly.length || destination.index >= groupsOnly.length) return

      const reorderedGroups = Array.from(localGroups)
      const [movedGroup] = reorderedGroups.splice(source.index, 1)
      reorderedGroups.splice(destination.index, 0, movedGroup)

      setLocalGroups(reorderedGroups)
      setIsReordering(true)

      try {
        const orderedIds = reorderedGroups.map(g => g.id)
        const response = await fetch('/api/groups/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        })

        if (!response.ok) {
          setLocalGroups(groups)
        } else {
          onBiasReordered?.()
        }
      } catch (error) {
        setLocalGroups(groups)
      } finally {
        setIsReordering(false)
      }
      return
    }

    if (source.droppableId !== destination.droppableId) return

    const groupBiasesResult = groupedBiases.find(
      (g) => (g.group?.id || 'ungrouped') === source.droppableId
    )?.biases

    if (!groupBiasesResult) return

    const reorderedGroupBiases = Array.from(groupBiasesResult)
    const [movedItem] = reorderedGroupBiases.splice(source.index, 1)
    reorderedGroupBiases.splice(destination.index, 0, movedItem)

    const newLocalBiases = localBiases.map((bias) => {
      const newIndex = reorderedGroupBiases.findIndex((b) => b.id === bias.id)
      if (newIndex !== -1) {
        return { ...bias, sort_order: newIndex }
      }
      return bias
    })

    newLocalBiases.sort((a, b) => {
      if (a.group_id === b.group_id) {
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      }
      return 0
    })

    setLocalBiases(newLocalBiases)
    setIsReordering(true)

    try {
      const orderedIds = reorderedGroupBiases.map((b) => b.id)
      const response = await fetch('/api/biases/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })

      if (!response.ok) {
        setLocalBiases(biases)
      } else {
        onBiasReordered?.()
      }
    } catch (error) {
      setLocalBiases(biases)
    } finally {
      setIsReordering(false)
    }
  }, [groupedBiases, localBiases, localGroups, biases, groups, onBiasReordered])

  const searchGroupsFunc = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGroupResults([])
      setShowDropdown(false)
      return
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
    }

    const abortController = new AbortController()
    searchAbortRef.current = abortController

    setIsSearching(true)
    try {
      const response = await fetch(`/api/kpop/groups?q=${encodeURIComponent(query.trim())}`, {
        signal: abortController.signal,
      })
      if (response.ok) {
        const data = await response.json()
        if (!abortController.signal.aborted) {
          setGroupResults(data.groups || [])
          setShowDropdown(true)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearching(false)
      }
    }
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
      searchAbortRef.current = null
    }

    if (groupQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchGroupsFunc(groupQuery)
      }, 300)
    } else {
      setGroupResults([])
      setShowDropdown(false)
      setIsSearching(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort()
      }
    }
  }, [groupQuery, searchGroupsFunc])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchMembersFunc = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMemberSearchResults([])
      setShowMemberDropdown(false)
      return
    }

    setIsSearchingMembers(true)
    try {
      const response = await fetch(`/api/kpop/members?q=${encodeURIComponent(query.trim())}`)
      if (response.ok) {
        const data = await response.json()
        setMemberSearchResults(data.members || [])
        setShowMemberDropdown(true)
      }
    } catch (error) {
      console.error('Error searching members:', error)
    } finally {
      setIsSearchingMembers(false)
    }
  }, [])

  useEffect(() => {
    if (memberSearchTimeoutRef.current) {
      clearTimeout(memberSearchTimeoutRef.current)
    }

    if (name.trim() && isFormOpen) {
      memberSearchTimeoutRef.current = setTimeout(() => {
        searchMembersFunc(name)
      }, 300)
    } else {
      setMemberSearchResults([])
      setShowMemberDropdown(false)
    }

    return () => {
      if (memberSearchTimeoutRef.current) {
        clearTimeout(memberSearchTimeoutRef.current)
      }
    }
  }, [name, isFormOpen, searchMembersFunc])

  function handleMemberSelect(member: KpopMemberWithGroup) {
    setName(member.name_original)
    setNameEn(member.name)
    setNameKo(member.name_original)
    setSelcaSlug(member.id)
    if (member.group) {
      setGroupName(member.group.name_original)
      setSelectedGroupInfo({
        name: member.group.name,
        nameEn: member.group.name,
        nameKo: member.group.name_original,
        selcaSlug: member.group.id, // noona group slug
      })
    } else {
      setSelectedGroupInfo(null)
    }
    setShowMemberDropdown(false)
    setMemberSearchResults([])
  }

  async function handleGroupSelect(group: KpopGroup) {
    setGroupQuery('')
    setShowDropdown(false)
    setIsLoadingMembers(true)

    try {
      const response = await fetch(`/api/kpop/groups/${encodeURIComponent(group.id)}/members`)
      if (response.ok) {
        const data = await response.json()
        setGroupMembers(data.members || [])
        setSelectedMembers(new Set(data.members?.map((m: KpopMember) => m.id) || []))
        setSelectedGroup({
          id: group.id,
          name: group.name,
          nameOriginal: group.name_original,
          hasSelcaGroup: data.hasSelcaGroup,
          selcaGroupSlug: data.selcaGroupSlug,
          source: data.source || group.source,
        })
      } else {
        setSelectedGroup({
          id: group.id,
          name: group.name,
          nameOriginal: group.name_original,
          source: group.source,
        })
      }
    } catch (error) {
      setSelectedGroup({
        id: group.id,
        name: group.name,
        nameOriginal: group.name_original,
        source: group.source,
      })
    } finally {
      setIsLoadingMembers(false)
    }
  }

  function toggleMember(memberId: string) {
    setSelectedMembers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(memberId)) {
        newSet.delete(memberId)
      } else {
        newSet.add(memberId)
      }
      return newSet
    })
  }

  function toggleAllMembers() {
    if (selectedMembers.size === groupMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(groupMembers.map((m) => m.id)))
    }
  }

  async function handleBatchAdd() {
    if (selectedMembers.size === 0 || !selectedGroup) return

    setIsBatchAdding(true)
    try {
      const membersToAdd = groupMembers
        .filter((m) => selectedMembers.has(m.id))
        .map((m) => ({
          name: m.name_original,
          groupName: selectedGroup.nameOriginal,
          nameEn: m.name,
          nameKo: m.name_original,
          selcaSlug: m.hasSelcaOwner ? m.id : null,
        }))

      const response = await fetch('/api/biases/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: membersToAdd,
          group: {
            name: selectedGroup.name,
            nameEn: selectedGroup.name,
            nameKo: selectedGroup.nameOriginal,
            selcaSlug: selectedGroup.hasSelcaGroup ? selectedGroup.selcaGroupSlug : null,
          },
        }),
      })

      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }

      if (response.ok) {
        const result = await response.json()
        const message = result.skipped > 0
          ? `${result.added}명 추가됨, ${result.skipped}명 이미 존재`
          : `${result.added}명 추가됨`
        alert(message)
        resetGroupMode()
        onBiasAdded()
      } else {
        const error = await response.json()
        alert(error.error || '일괄 추가에 실패했습니다')
      }
    } catch (error) {
      alert('일괄 추가에 실패했습니다')
    } finally {
      setIsBatchAdding(false)
    }
  }

  function resetGroupMode() {
    setIsGroupMode(false)
    setGroupQuery('')
    setGroupResults([])
    setSelectedGroup(null)
    setGroupMembers([])
    setSelectedMembers(new Set())
    setShowDropdown(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/biases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          groupName: groupName.trim() || null,
          nameEn: nameEn.trim() || null,
          nameKo: nameKo.trim() || null,
          selcaSlug: selcaSlug || null,
          group: selectedGroupInfo,
        }),
      })

      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }

      if (response.ok) {
        setName('')
        setGroupName('')
        setNameEn('')
        setNameKo('')
        setSelcaSlug(null)
        setSelectedGroupInfo(null)
        setIsFormOpen(false)
        onBiasAdded()
      } else {
        const error = await response.json()
        alert(error.error || '최애 추가에 실패했습니다')
      }
    } catch (error) {
      alert('최애 추가에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string, biasName: string) {
    if (!confirm(`"${biasName}"을(를) 삭제하시겠습니까?`)) return
    setDeletingId(id)
    try {
      const response = await fetch(`/api/biases/${id}`, { method: 'DELETE' })
      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }
      if (response.ok) {
        onBiasDeleted()
      } else {
        const error = await response.json()
        alert(error.error || '삭제에 실패했습니다')
      }
    } catch (error) {
      alert('삭제에 실패했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteGroup(groupId: string, groupName: string) {
    if (!confirm(`"${groupName}" 그룹과 그 안의 모든 멤버를 삭제하시겠습니까?`)) return
    const deleteLinks = confirm('관련 링크도 함께 삭제하시겠습니까?\n\n"확인" - 이 그룹/멤버로 태그된 링크도 삭제\n"취소" - 그룹/멤버만 삭제 (링크는 유지)')
    setDeletingGroupId(groupId)
    try {
      const url = deleteLinks ? `/api/groups/${groupId}?deleteLinks=true` : `/api/groups/${groupId}`
      const response = await fetch(url, { method: 'DELETE' })
      if (response.status === 401) {
        window.location.href = `/${locale}/login`
        return
      }
      if (response.ok) {
        onBiasDeleted()
      } else {
        const error = await response.json()
        alert(error.error || '그룹 삭제에 실패했습니다')
      }
    } catch (error) {
      alert('그룹 삭제에 실패했습니다')
    } finally {
      setDeletingGroupId(null)
    }
  }

  return (
    <div className="space-y-2">
      {groupedBiases.length > 0 && (
        <BiasList
          groupedBiases={groupedBiases}
          collapsedGroups={collapsedGroups}
          toggleGroupCollapse={toggleGroupCollapse}
          getGroupDisplayName={getGroupDisplayName}
          getDisplayName={getDisplayName}
          handleDelete={handleDelete}
          handleDeleteGroup={handleDeleteGroup}
          handleDragEnd={handleDragEnd}
          deletingId={deletingId}
          deletingGroupId={deletingGroupId}
        />
      )}

      {biases.length === 0 && !isFormOpen && !isGroupMode && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 px-2">
          아직 최애가 없습니다
        </p>
      )}

      {isGroupMode && (
        <MemberSelector
          isSearching={isSearching}
          groupQuery={groupQuery}
          setGroupQuery={setGroupQuery}
          showDropdown={showDropdown}
          groupResults={groupResults}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          handleGroupSelect={handleGroupSelect}
          isLoadingMembers={isLoadingMembers}
          groupMembers={groupMembers}
          selectedMembers={selectedMembers}
          toggleMember={toggleMember}
          toggleAllMembers={toggleAllMembers}
          handleBatchAdd={handleBatchAdd}
          isBatchAdding={isBatchAdding}
          resetGroupMode={resetGroupMode}
          dropdownRef={dropdownRef}
        />
      )}

      {isFormOpen && !isGroupMode && (
        <BiasForm
          name={name}
          setName={setName}
          groupName={groupName}
          setGroupName={setGroupName}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          setIsFormOpen={setIsFormOpen}
          isSearchingMembers={isSearchingMembers}
          showMemberDropdown={showMemberDropdown}
          memberSearchResults={memberSearchResults}
          handleMemberSelect={handleMemberSelect}
          memberDropdownRef={memberDropdownRef}
        />
      )}

      {!isFormOpen && !isGroupMode && (
        <div className="flex flex-col gap-1">
          <motion.button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-zinc-500 hover:text-pink-500 dark:text-zinc-400 dark:hover:text-pink-400 transition-colors whitespace-nowrap"
            {...pressScale}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>최애 추가</span>
          </motion.button>
          <motion.button
            onClick={() => setIsGroupMode(true)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-zinc-500 hover:text-pink-500 dark:text-zinc-400 dark:hover:text-pink-400 transition-colors whitespace-nowrap"
            {...pressScale}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>그룹으로 추가</span>
          </motion.button>
        </div>
      )}
    </div>
  )
}
