'use client'
import { useEffect } from 'react'
import { syncAll } from '@/lib/sync'

export function SyncProvider() {
  useEffect(() => {
    syncAll()
  }, [])
  return null
}
