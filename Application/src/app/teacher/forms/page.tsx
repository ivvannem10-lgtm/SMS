'use client'
import { useSession } from 'next-auth/react'
import { FormsCenter } from '@/components/shared/FormsCenter'

export default function TeacherFormsPage() {
  const { data: session } = useSession()
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined
  return (
    <FormsCenter
      portal="teacher"
      userId={user?.id ?? 'u_teacher'}
      userName={user?.name ?? 'Teacher'}
      userRole={user?.role ?? 'TEACHER'}
    />
  )
}
