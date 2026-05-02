import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, getPortal } from '@/lib/auth'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    const user = session.user as { role?: string }
    redirect(getPortal(user.role ?? ''))
  }
  return <LandingPage />
}
