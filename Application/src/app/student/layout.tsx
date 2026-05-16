import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StudentSidebar } from '@/components/layout/StudentSidebar'
import { Header } from '@/components/layout/Header'
import { SyncProvider } from '@/components/shared/SyncProvider'
import { ConfirmProvider } from '@/components/shared/ConfirmDialog'
import { AIAssistant } from '@/components/shared/AIAssistant'
import { AgentChatWidget } from '@/components/shared/AgentChatWidget'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as { role?: string; name?: string; id?: string }
  if (!['STUDENT', 'SUPER_ADMIN'].includes(user.role ?? '')) redirect('/login')
  return (
    <ConfirmProvider>
      <div className="flex min-h-screen">
        <StudentSidebar />
        <div className="flex flex-1 flex-col pl-[220px]">
          <Header />
          <SyncProvider />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
      <AIAssistant userRole={user.role ?? 'STUDENT'} userName={user.name ?? 'Student'} portal="student" />
      <AgentChatWidget userId={user.id ?? 'st_demo'} userName={user.name ?? 'Student'} userRole={user.role ?? 'STUDENT'} portal="student" />
    </ConfirmProvider>
  )
}
