'use client'
import { useSession } from 'next-auth/react'
import { FormsCenter } from '@/components/shared/FormsCenter'

export default function StudentFormsPage() {
  const { data: session } = useSession()
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined
  return (
    <FormsCenter
      portal="student"
      userId={user?.id ?? 'u_student'}
      userName={user?.name ?? 'Student'}
      userRole={user?.role ?? 'STUDENT'}
    />
  )
}
