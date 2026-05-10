import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StaffSidebar } from '@/components/layout/StaffSidebar'
import { Header } from '@/components/layout/Header'

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMISSION_OFFICER', 'REGISTRAR', 'TREASURER', 'ACADEMIC_ADMIN', 'ACCOUNTING', 'DEAN', 'HR_STAFF']

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as { role?: string }
  if (!STAFF_ROLES.includes(user.role ?? '')) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <StaffSidebar />
      <div className="flex flex-1 flex-col pl-[220px]">
        <Header />
        <main className="flex-1 p-6 bg-[#f3f6fb] dark:bg-slate-950 transition-colors">{children}</main>
      </div>
    </div>
  )
}
