import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeacherSidebar } from '@/components/layout/TeacherSidebar'
import { Header } from '@/components/layout/Header'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as { role?: string }
  if (!['TEACHER', 'SUPER_ADMIN'].includes(user.role ?? '')) redirect('/login')
  return (
    <div className="flex min-h-screen">
      <TeacherSidebar />
      <div className="flex flex-1 flex-col pl-[220px]">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
