'use client'

import { useContext } from 'react'
import type { AuthContextType } from '@/components/AuthProvider';
import { AuthContext } from '@/components/AuthProvider'

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
