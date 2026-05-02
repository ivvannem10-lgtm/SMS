'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, BookOpen, LogOut, GraduationCap, CalendarDays, Users } from 'lucide-react'
import { cn, initials } from '@/lib/utils'

const NAV = [
  { href: '/teacher/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/teacher/subjects',  label: 'Courses',     icon: BookOpen },
  { href: '/teacher/schedule',  label: 'My Schedule', icon: CalendarDays },
  { href: '/teacher/calendar',  label: 'Calendar',    icon: CalendarDays },
  { href: '/teacher/team',      label: 'Team Hub',    icon: Users },
]

export function TeacherSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as { name?: string; schoolName?: string } | undefined

  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)

  async function confirmSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col bg-sidebar-bg">
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-brand-500">
          <GraduationCap className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-white leading-tight">{user?.schoolName ?? 'School'}</p>
          <p className="text-2xs text-sidebar-text leading-tight">Faculty Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1 px-2 text-2xs font-semibold uppercase tracking-widest text-sidebar-heading">Navigation</p>
        <div className="space-y-0.5 mt-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-100',
                  active ? 'bg-sidebar-active text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-slate-200',
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-orange-400' : 'text-sidebar-muted')} />
                <span className="truncate">{item.label}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-400" />}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-1">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-2xs font-bold text-white">
            {user?.name ? initials(user.name) : 'T'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-slate-200">{user?.name ?? 'Teacher'}</p>
            <p className="text-2xs text-sidebar-text">Faculty</p>
          </div>
        </div>
        <button onClick={() => setSignOutOpen(true)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-sidebar-text hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign Out
        </button>
      </div>

      {/* ── Sign-out confirmation ─────────────────────────────────────────── */}
      {signOutOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !signingOut && setSignOutOpen(false)} />
          <div className="relative z-10 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-l-[3px] border-red-500 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">Sign out?</p>
              <p className="mt-1 text-xs text-slate-500">You will be redirected to the login page.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => setSignOutOpen(false)}
                disabled={signingOut}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignOut}
                disabled={signingOut}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
