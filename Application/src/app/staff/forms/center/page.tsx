'use client'
import { useSession } from 'next-auth/react'
import { FormsCenter } from '@/components/shared/FormsCenter'

export default function StaffFormsCenterPage() {
  const { data: session } = useSession()
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined
  return (
    <FormsCenter
      portal="staff"
      userId={user?.id ?? 'u_staff'}
      userName={user?.name ?? 'Staff'}
      userRole={user?.role ?? 'SUPER_ADMIN'}
    />
  )
}
