'use client'

import { motion } from 'framer-motion'
import { quickSpring } from '@/lib/animations'

export type ArchiveStatusType = 'queued' | 'pending' | 'archived' | 'failed' | null

interface ArchiveStatusProps {
  status: ArchiveStatusType
  archiveUrl?: string | null
  onArchive?: () => void
  isArchiving?: boolean
  size?: 'sm' | 'md'
}

// SVG Icon components
const ArchiveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

export function ArchiveStatus({
  status,
  archiveUrl,
  onArchive,
  isArchiving = false,
  size = 'sm'
}: ArchiveStatusProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5'

  // Loading state (archiving in progress)
  if (isArchiving) {
    return (
      <motion.button
        disabled
        className={`${buttonSize} rounded-md bg-card/90 dark:bg-zinc-800/90 text-yellow-500 shadow-sm cursor-not-allowed`}
        title="Archiving..."
        whileTap={{ scale: 0.9 }}
        transition={quickSpring}
      >
        <LoaderIcon className={`${iconSize} animate-spin`} />
      </motion.button>
    )
  }

  // No archive status - show archive button
  if (status === null) {
    return (
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          onArchive?.()
        }}
        className={`${buttonSize} rounded-md bg-card/90 dark:bg-zinc-800/90 text-surface-foreground dark:text-zinc-300 hover:text-blue-500 dark:hover:text-blue-400 shadow-sm transition-colors`}
        title="Archive to Wayback Machine"
        whileTap={{ scale: 0.9 }}
        transition={quickSpring}
      >
        <ArchiveIcon className={iconSize} />
      </motion.button>
    )
  }

  // Queued status - waiting to be processed
  if (status === 'queued') {
    return (
      <motion.button
        disabled
        className={`${buttonSize} rounded-md bg-card/90 dark:bg-zinc-800/90 text-yellow-500 shadow-sm cursor-not-allowed`}
        title="대기 중..."
        whileTap={{ scale: 0.9 }}
        transition={quickSpring}
      >
        <ClockIcon className={iconSize} />
      </motion.button>
    )
  }

  // Pending status - archiving in progress
  if (status === 'pending') {
    return (
      <motion.button
        disabled
        className={`${buttonSize} rounded-md bg-card/90 dark:bg-zinc-800/90 text-yellow-500 shadow-sm cursor-not-allowed`}
        title="아카이브 중..."
        whileTap={{ scale: 0.9 }}
        transition={quickSpring}
      >
        <ClockIcon className={`${iconSize} animate-spin`} />
      </motion.button>
    )
  }

  // Archived status - click to view
  if (status === 'archived') {
    return (
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          if (archiveUrl) {
            window.open(archiveUrl, '_blank', 'noopener,noreferrer')
          }
        }}
        className={`${buttonSize} rounded-md bg-card/90 dark:bg-zinc-800/90 text-green-500 hover:text-green-400 shadow-sm transition-colors`}
        title="View archived version"
        whileTap={{ scale: 0.9 }}
        transition={quickSpring}
      >
        <CheckCircleIcon className={iconSize} />
      </motion.button>
    )
  }

  // Failed status - click to retry
  if (status === 'failed') {
    return (
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          onArchive?.()
        }}
        className={`${buttonSize} rounded-md bg-card/90 dark:bg-zinc-800/90 text-red-500 hover:text-red-400 shadow-sm transition-colors`}
        title="Archive failed - Click to retry"
        whileTap={{ scale: 0.9 }}
        transition={quickSpring}
      >
        <XCircleIcon className={iconSize} />
      </motion.button>
    )
  }

  return null
}
