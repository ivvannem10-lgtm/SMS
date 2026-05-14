'use client'
import { useSession } from 'next-auth/react'
import { RequestCenter } from '@/components/shared/RequestCenter'
import type { SessionUser } from '@/types'

export default function TeacherRequestsPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  if (!user) return null
  return (
    <RequestCenter
      portal="teacher"
      userId={user.id ?? 'unknown'}
      userName={user.name ?? 'Teacher'}
      userRole={user.role ?? ''}
    />
  )
}
