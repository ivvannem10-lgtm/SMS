import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StudentSidebar } from '@/components/layout/StudentSidebar'
import { Header } from '@/components/layout/Header'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as { role?: string }
  if (!['STUDENT', 'SUPER_ADMIN'].includes(user.role ?? '')) redirect('/login')
  return (
    <div className="flex min-h-screen">
      <StudentSidebar />
      <div className="flex flex-1 flex-col pl-[220px]">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
