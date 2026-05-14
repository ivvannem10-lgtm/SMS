'use client'
import { useSession } from 'next-auth/react'
import { SupportCenter } from '@/components/shared/SupportCenter'
import type { SessionUser } from '@/types'

export default function TeacherSupportPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  if (!user) return null
  return (
    <SupportCenter
      portal="teacher"
      userId={user.id ?? ''}
      userName={user.name ?? 'Teacher'}
      userRole="TEACHER"
    />
  )
}
