'use client'
import { useSession } from 'next-auth/react'
import { SupportCenter } from '@/components/shared/SupportCenter'
import type { SessionUser, TicketDepartment } from '@/types'

const DEPT_MAP: Record<string, TicketDepartment> = {
  REGISTRAR: 'REGISTRAR',
  ACADEMIC_ADMIN: 'ACADEMIC',
  TREASURER: 'TREASURY',
  HR_STAFF: 'HR',
  AMO: 'AMO',
  PURCHASING_OFFICER: 'PURCHASING',
  SUPER_ADMIN: 'IT_SUPPORT',
  ACCOUNTING: 'GENERAL',
}

export default function StaffSupportPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  if (!user) return null
  return (
    <SupportCenter
      portal="staff"
      userId={user.id ?? ''}
      userName={user.name ?? 'Staff'}
      userRole={user.role ?? ''}
      agentDept={DEPT_MAP[user.role ?? '']}
    />
  )
}
