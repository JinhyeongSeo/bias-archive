'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import type { Bias, BiasWithGroup, Group } from '@/types/database'
import { useNameLanguage } from '@/contexts/NameLanguageContext'
import { useLocale } from 'next-intl'
import { quickSpring, pressScale } from '@/lib/animations'

interface KpopGroup {
  id: string
  name: string
  name_original: string
  memberCount: number
}

interface KpopMember {
  id: string
  name: string
  name_original: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Group mode state
  const [isGroupMode, setIsGroupMode] = useState(false)
  const [groupQuery, setGroupQuery] = useState('')
  const [groupResults, setGroupResults] = useState<KpopGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string; nameOriginal: string } | null>(null)
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
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<{ name: string; nameEn: string; nameKo: string } | null>(null)

  // Local bias order for optimistic updates during drag
  const [localBiases, setLocalBiases] = useState<Bias[]>(biases)
  const [localGroups, setLocalGroups] = useState<Group[]>(groups)
  const [isReordering, setIsReordering] = useState(false)

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

  // Load collapsed groups from localStorage
  // Default: all groups collapsed (stored value tracks which are EXPANDED)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_GROUPS_KEY)
      if (stored) {
        // stored contains expanded groups, so collapsed = all groups - expanded
        const expandedGroups = new Set<string>(JSON.parse(stored))
        const allGroupIds = new Set(localGroups.map(g => g.id))
        allGroupIds.add('ungrouped') // include ungrouped
        const collapsed = new Set<string>()
        for (const id of allGroupIds) {
          if (!expandedGroups.has(id)) {
            collapsed.add(id)
          }
        }
        setCollapsedGroups(collapsed)
      } else {
        // No stored preference: collapse all groups by default
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

    // Create BiasWithGroup objects (use localBiases for optimistic updates)
    const biasesWithGroups: BiasWithGroup[] = localBiases.map((bias) => ({
      ...bias,
      group: bias.group_id ? groupMap.get(bias.group_id) ?? null : null,
    }))

    // Group by group_id
    const grouped = new Map<string | null, BiasWithGroup[]>()

    for (const bias of biasesWithGroups) {
      const groupId = bias.group_id
      if (!grouped.has(groupId)) {
        grouped.set(groupId, [])
      }
      grouped.get(groupId)!.push(bias)
    }

    // Convert to array with group info
    const result: GroupedBiases[] = []

    // Add groups in localGroups order (respects sort_order from server)
    for (const group of localGroups) {
      if (grouped.has(group.id)) {
        result.push({
          group,
          biases: grouped.get(group.id)!,
        })
      }
    }

    // Add ungrouped biases at the end
    if (grouped.has(null)) {
      result.push({
        group: null,
        biases: grouped.get(null)!,
      })
    }

    return result
  }, [localBiases, localGroups])

  // Save expanded groups to localStorage (inverted logic for default-collapsed)
  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId) // expanding
      } else {
        newSet.add(groupId) // collapsing
      }
      // Save expanded groups (inverse of collapsed) to localStorage
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

  // Handle drag end for reordering biases or groups
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, type } = result

    // Dropped outside a valid droppable
    if (!destination) return

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    // Handle group reordering
    if (type === 'GROUP') {
      // Only reorder actual groups (not ungrouped)
      const groupsOnly = groupedBiases.filter(g => g.group !== null)
      if (source.index >= groupsOnly.length || destination.index >= groupsOnly.length) return

      const reorderedGroups = Array.from(localGroups)
      const [movedGroup] = reorderedGroups.splice(source.index, 1)
      reorderedGroups.splice(destination.index, 0, movedGroup)

      // Optimistic update
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
          console.error('Failed to save group reorder')
        } else {
          onBiasReordered?.()
        }
      } catch (error) {
        setLocalGroups(groups)
        console.error('Error saving group reorder:', error)
      } finally {
        setIsReordering(false)
      }
      return
    }

    // Handle bias reordering within a group
    // Dropped in a different group - not allowed
    if (source.droppableId !== destination.droppableId) return

    // Find the group's biases
    const groupBiases = groupedBiases.find(
      (g) => (g.group?.id || 'ungrouped') === source.droppableId
    )?.biases

    if (!groupBiases) return

    // Reorder within the group
    const reorderedGroupBiases = Array.from(groupBiases)
    const [movedItem] = reorderedGroupBiases.splice(source.index, 1)
    reorderedGroupBiases.splice(destination.index, 0, movedItem)

    // Build new full bias list maintaining other groups' order
    const newLocalBiases = localBiases.map((bias) => {
      // Find if this bias is in the reordered group
      const newIndex = reorderedGroupBiases.findIndex((b) => b.id === bias.id)
      if (newIndex !== -1) {
        return { ...bias, sort_order: newIndex }
      }
      return bias
    })

    // Sort by the new order within groups
    newLocalBiases.sort((a, b) => {
      // Same group? Sort by new sort_order
      if (a.group_id === b.group_id) {
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      }
      // Different groups - maintain original relative order
      return 0
    })

    // Optimistic update
    setLocalBiases(newLocalBiases)
    setIsReordering(true)

    try {
      // Get ordered IDs for ALL biases in the affected group
      const orderedIds = reorderedGroupBiases.map((b) => b.id)

      const response = await fetch('/api/biases/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      })

      if (!response.ok) {
        // Rollback on failure
        setLocalBiases(biases)
        console.error('Failed to save reorder')
      } else {
        // Notify parent to refresh data
        onBiasReordered?.()
      }
    } catch (error) {
      // Rollback on error
      setLocalBiases(biases)
      console.error('Error saving reorder:', error)
    } finally {
      setIsReordering(false)
    }
  }, [groupedBiases, localBiases, localGroups, biases, groups, onBiasReordered])

  // Debounced group search
  const searchGroups = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGroupResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/kpop/groups?q=${encodeURIComponent(query.trim())}`)
      if (response.ok) {
        const data = await response.json()
        setGroupResults(data.groups || [])
        setShowDropdown(true)
      }
    } catch (error) {
      console.error('Error searching groups:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle group query change with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (groupQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchGroups(groupQuery)
      }, 300)
    } else {
      setGroupResults([])
      setShowDropdown(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [groupQuery, searchGroups])

  // Close dropdown when clicking outside
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

  // Debounced member search for individual add form
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

  // Handle name input change with debounced member search
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

  // Handle member selection from autocomplete
  function handleMemberSelect(member: KpopMemberWithGroup) {
    setName(member.name_original) // Korean name as display name
    setNameEn(member.name) // English name
    setNameKo(member.name_original) // Korean name
    if (member.group) {
      setGroupName(member.group.name_original) // Korean group name
      setSelectedGroupInfo({
        name: member.group.name,
        nameEn: member.group.name,
        nameKo: member.group.name_original,
      })
    } else {
      setSelectedGroupInfo(null)
    }
    setShowMemberDropdown(false)
    setMemberSearchResults([])
  }

  // Fetch members when group is selected
  async function handleGroupSelect(group: KpopGroup) {
    setSelectedGroup({
      id: group.id,
      name: group.name,
      nameOriginal: group.name_original,
    })
    setGroupQuery('')
    setShowDropdown(false)
    setIsLoadingMembers(true)

    try {
      const response = await fetch(`/api/kpop/groups/${group.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setGroupMembers(data.members || [])
        // Select all members by default
        setSelectedMembers(new Set(data.members?.map((m: KpopMember) => m.id) || []))
      }
    } catch (error) {
      console.error('Error fetching group members:', error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // Toggle member selection
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

  // Select/deselect all members
  function toggleAllMembers() {
    if (selectedMembers.size === groupMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(groupMembers.map((m) => m.id)))
    }
  }

  // Batch add selected members
  async function handleBatchAdd() {
    if (selectedMembers.size === 0 || !selectedGroup) return

    setIsBatchAdding(true)
    try {
      const membersToAdd = groupMembers
        .filter((m) => selectedMembers.has(m.id))
        .map((m) => ({
          name: m.name_original, // display name (Korean for tag matching)
          groupName: selectedGroup.nameOriginal,
          nameEn: m.name, // English name from kpopnet
          nameKo: m.name_original, // Korean name from kpopnet
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
      console.error('Error batch adding members:', error)
      alert('일괄 추가에 실패했습니다')
    } finally {
      setIsBatchAdding(false)
    }
  }

  // Reset group mode
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
        setSelectedGroupInfo(null)
        setIsFormOpen(false)
        onBiasAdded()
      } else {
        const error = await response.json()
        alert(error.error || '최애 추가에 실패했습니다')
      }
    } catch (error) {
      console.error('Error adding bias:', error)
      alert('최애 추가에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string, biasName: string) {
    if (!confirm(`"${biasName}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/biases/${id}`, {
        method: 'DELETE',
      })

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
      console.error('Error deleting bias:', error)
      alert('삭제에 실패했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-2">
      {/* Grouped bias list with drag and drop */}
      {groupedBiases.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="groups-list" type="GROUP">
            {(groupsProvided) => (
              <div
                ref={groupsProvided.innerRef}
                {...groupsProvided.droppableProps}
                className="space-y-1"
              >
                {groupedBiases.map(({ group, biases: groupBiases }, groupIndex) => {
                  const groupId = group?.id || 'ungrouped'
                  const isCollapsed = collapsedGroups.has(groupId)
                  const groupDisplayName = group ? getGroupDisplayName(group) : '그룹 없음'
                  const isUngrouped = group === null

                  // Ungrouped items are not draggable as a group
                  if (isUngrouped) {
                    return (
                      <div key={groupId}>
                        {/* Ungrouped header - not draggable */}
                        <motion.button
                          type="button"
                          onClick={() => toggleGroupCollapse(groupId)}
                          className="w-full flex items-center gap-1 px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
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
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
                            ({groupBiases.length})
                          </span>
                        </motion.button>

                        {/* Ungrouped members - Droppable area */}
                        {!isCollapsed && (
                          <Droppable droppableId={groupId} type="BIAS">
                            {(provided, snapshot) => (
                              <ul
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`ml-4 space-y-0.5 min-h-[2rem] rounded-md transition-colors ${
                                  snapshot.isDraggingOver ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                                }`}
                              >
                                {groupBiases.map((bias, index) => (
                                  <Draggable key={bias.id} draggableId={bias.id} index={index}>
                                    {(provided, snapshot) => (
                                      <li
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`flex items-center justify-between group px-2 py-1 text-sm text-foreground rounded-md transition-all ${
                                          snapshot.isDragging
                                            ? 'bg-card shadow-lg ring-2 ring-primary/50'
                                            : 'hover:bg-accent'
                                        }`}
                                      >
                                        <div
                                          {...provided.dragHandleProps}
                                          className="flex items-center gap-1 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
                                        >
                                          <svg
                                            className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                          >
                                            <circle cx="9" cy="6" r="1.5" />
                                            <circle cx="15" cy="6" r="1.5" />
                                            <circle cx="9" cy="12" r="1.5" />
                                            <circle cx="15" cy="12" r="1.5" />
                                            <circle cx="9" cy="18" r="1.5" />
                                            <circle cx="15" cy="18" r="1.5" />
                                          </svg>
                                          <span className="truncate">{getDisplayName(bias)}</span>
                                        </div>
                                        <motion.button
                                          onClick={() => handleDelete(bias.id, getDisplayName(bias))}
                                          disabled={deletingId === bias.id}
                                          className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-opacity disabled:opacity-50 flex-shrink-0"
                                          title="삭제"
                                          whileTap={{ scale: 0.85 }}
                                          transition={quickSpring}
                                        >
                                          {deletingId === bias.id ? (
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          )}
                                        </motion.button>
                                      </li>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </ul>
                            )}
                          </Droppable>
                        )}
                      </div>
                    )
                  }

                  // Draggable group
                  return (
                    <Draggable key={groupId} draggableId={`group-${groupId}`} index={groupIndex}>
                      {(groupDragProvided, groupDragSnapshot) => (
                        <div
                          ref={groupDragProvided.innerRef}
                          {...groupDragProvided.draggableProps}
                          className={`rounded-md transition-all ${
                            groupDragSnapshot.isDragging ? 'bg-zinc-50 dark:bg-zinc-800/50 shadow-lg ring-2 ring-pink-500/30' : ''
                          }`}
                        >
                          {/* Group header with drag handle */}
                          <div className="flex items-center group/header">
                            <div
                              {...groupDragProvided.dragHandleProps}
                              className="p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover/header:opacity-100 transition-opacity"
                            >
                              <svg
                                className="w-4 h-4 text-zinc-400 dark:text-zinc-500"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <circle cx="9" cy="6" r="1.5" />
                                <circle cx="15" cy="6" r="1.5" />
                                <circle cx="9" cy="12" r="1.5" />
                                <circle cx="15" cy="12" r="1.5" />
                                <circle cx="9" cy="18" r="1.5" />
                                <circle cx="15" cy="18" r="1.5" />
                              </svg>
                            </div>
                            <motion.button
                              type="button"
                              onClick={() => toggleGroupCollapse(groupId)}
                              className="flex-1 flex items-center gap-1 px-1 py-1 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
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
                              <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
                                ({groupBiases.length})
                              </span>
                            </motion.button>
                          </div>

                          {/* Group members - Droppable area */}
                          {!isCollapsed && (
                            <Droppable droppableId={groupId} type="BIAS">
                              {(provided, snapshot) => (
                                <ul
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`ml-6 space-y-0.5 min-h-[2rem] rounded-md transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                                  }`}
                                >
                                  {groupBiases.map((bias, index) => (
                                    <Draggable key={bias.id} draggableId={bias.id} index={index}>
                                      {(provided, snapshot) => (
                                        <li
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`flex items-center justify-between group px-2 py-1 text-sm text-foreground rounded-md transition-all ${
                                            snapshot.isDragging
                                              ? 'bg-card shadow-lg ring-2 ring-primary/50'
                                              : 'hover:bg-accent'
                                          }`}
                                        >
                                          {/* Drag handle */}
                                          <div
                                            {...provided.dragHandleProps}
                                            className="flex items-center gap-1 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
                                          >
                                            <svg
                                              className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                              viewBox="0 0 24 24"
                                              fill="currentColor"
                                            >
                                              <circle cx="9" cy="6" r="1.5" />
                                              <circle cx="15" cy="6" r="1.5" />
                                              <circle cx="9" cy="12" r="1.5" />
                                              <circle cx="15" cy="12" r="1.5" />
                                              <circle cx="9" cy="18" r="1.5" />
                                              <circle cx="15" cy="18" r="1.5" />
                                            </svg>
                                            <span className="truncate">{getDisplayName(bias)}</span>
                                          </div>
                                          <motion.button
                                            onClick={() => handleDelete(bias.id, getDisplayName(bias))}
                                            disabled={deletingId === bias.id}
                                            className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-opacity disabled:opacity-50 flex-shrink-0"
                                            title="삭제"
                                            whileTap={{ scale: 0.85 }}
                                            transition={quickSpring}
                                          >
                                            {deletingId === bias.id ? (
                                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                              </svg>
                                            ) : (
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            )}
                                          </motion.button>
                                        </li>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </ul>
                              )}
                            </Droppable>
                          )}
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {groupsProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Empty state */}
      {biases.length === 0 && !isFormOpen && !isGroupMode && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 px-2">
          아직 최애가 없습니다
        </p>
      )}

      {/* Group mode UI */}
      {isGroupMode && (
        <div className="space-y-2 pt-2">
          {!selectedGroup ? (
            // Group search
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={groupQuery}
                onChange={(e) => setGroupQuery(e.target.value)}
                placeholder="그룹명 검색 (예: IVE, 아이브)"
                className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
              {/* Dropdown results */}
              {showDropdown && groupResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {groupResults.map((group) => (
                    <li key={group.id}>
                      <button
                        type="button"
                        onClick={() => handleGroupSelect(group)}
                        className="w-full px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                      >
                        <span className="font-medium">{group.name}</span>
                        {group.name_original !== group.name && (
                          <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                            ({group.name_original})
                          </span>
                        )}
                        <span className="text-zinc-400 dark:text-zinc-500 ml-1 text-xs">
                          {group.memberCount}명
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && groupResults.length === 0 && groupQuery.trim() && !isSearching && (
                <div className="absolute z-10 w-full mt-1 px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg text-sm text-zinc-500">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          ) : (
            // Member selection
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedGroup.name}
                  {selectedGroup.nameOriginal !== selectedGroup.name && (
                    <span className="text-zinc-500 dark:text-zinc-400 ml-1 font-normal">
                      ({selectedGroup.nameOriginal})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroup(null)
                    setGroupMembers([])
                    setSelectedMembers(new Set())
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  다른 그룹 선택
                </button>
              </div>

              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-4">
                  <svg className="w-5 h-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <>
                  {/* Select all toggle */}
                  <div className="flex items-center px-2 py-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={selectedMembers.size === groupMembers.length && groupMembers.length > 0}
                        onChange={toggleAllMembers}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-pink-500 focus:ring-pink-500"
                      />
                      전체 선택 ({selectedMembers.size}/{groupMembers.length})
                    </label>
                  </div>

                  {/* Member list */}
                  <ul className="space-y-0.5 max-h-48 overflow-y-auto">
                    {groupMembers.map((member) => (
                      <li key={member.id}>
                        <label className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-sm">
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(member.id)}
                            onChange={() => toggleMember(member.id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-pink-500 focus:ring-pink-500"
                          />
                          <span className="text-zinc-900 dark:text-zinc-100">{member.name}</span>
                          {member.name_original !== member.name && (
                            <span className="text-zinc-500 dark:text-zinc-400">
                              ({member.name_original})
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Group mode action buttons */}
          <div className="flex gap-2">
            {selectedGroup && (
              <motion.button
                type="button"
                onClick={handleBatchAdd}
                disabled={isBatchAdding || selectedMembers.size === 0}
                className="flex-1 px-2 py-1.5 text-sm bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                {...pressScale}
              >
                {isBatchAdding ? '추가 중...' : `${selectedMembers.size}명 추가`}
              </motion.button>
            )}
            <motion.button
              type="button"
              onClick={resetGroupMode}
              className="px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              {...pressScale}
            >
              취소
            </motion.button>
          </div>
        </div>
      )}

      {/* Add form */}
      {isFormOpen && !isGroupMode && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2">
          {/* Name input with member autocomplete */}
          <div className="relative" ref={memberDropdownRef}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 - 표시용 (필수)"
              className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              autoFocus
            />
            {isSearchingMembers && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
            {/* Member autocomplete dropdown */}
            {showMemberDropdown && memberSearchResults.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {memberSearchResults.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => handleMemberSelect(member)}
                      className="w-full px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                    >
                      <span className="font-medium">{member.name}</span>
                      {member.name_original !== member.name && (
                        <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                          ({member.name_original})
                        </span>
                      )}
                      {member.group && (
                        <span className="text-zinc-400 dark:text-zinc-500 ml-1 text-xs">
                          - {member.group.name_original}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="그룹명 (선택)"
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="영어 이름 (선택)"
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="text"
            value={nameKo}
            onChange={(e) => setNameKo(e.target.value)}
            placeholder="한글 이름 (선택)"
            className="w-full px-2 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex gap-2">
            <motion.button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 px-2 py-1.5 text-sm bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              {...pressScale}
            >
              {isLoading ? '추가 중...' : '추가'}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                setIsFormOpen(false)
                setName('')
                setGroupName('')
                setNameEn('')
                setNameKo('')
                setMemberSearchResults([])
                setShowMemberDropdown(false)
              }}
              className="px-2 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              {...pressScale}
            >
              취소
            </motion.button>
          </div>
        </form>
      )}

      {/* Action buttons when no form is open */}
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
