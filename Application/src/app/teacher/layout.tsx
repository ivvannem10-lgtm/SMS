import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeacherSidebar } from '@/components/layout/TeacherSidebar'
import { Header } from '@/components/layout/Header'
import { SyncProvider } from '@/components/shared/SyncProvider'
import { ConfirmProvider } from '@/components/shared/ConfirmDialog'
import { AIAssistant } from '@/components/shared/AIAssistant'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as { role?: string; name?: string }
  if (!['TEACHER', 'SUPER_ADMIN'].includes(user.role ?? '')) redirect('/login')
  return (
    <ConfirmProvider>
      <div className="flex min-h-screen">
        <TeacherSidebar />
        <div className="flex flex-1 flex-col pl-[220px]">
          <Header />
          <SyncProvider />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
      <AIAssistant userRole={user.role ?? 'TEACHER'} userName={user.name ?? 'Teacher'} portal="teacher" />
    </ConfirmProvider>
  )
}
