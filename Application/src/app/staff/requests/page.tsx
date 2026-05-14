'use client'
import { useSession } from 'next-auth/react'
import { RequestCenter } from '@/components/shared/RequestCenter'
import type { SessionUser, ChampionDept } from '@/types'

const CHAMPION_MAP: Record<string, ChampionDept> = {
  HR_STAFF: 'HR',
  PURCHASING_OFFICER: 'PURCHASING',
  AMO: 'AMO',
  SUPER_ADMIN: 'ADMIN',
}

export default function StaffRequestsPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  if (!user) return null
  return (
    <RequestCenter
      portal="staff"
      userId={user.id ?? 'unknown'}
      userName={user.name ?? 'Staff'}
      userRole={user.role ?? ''}
      championDept={CHAMPION_MAP[user.role ?? '']}
    />
  )
}
