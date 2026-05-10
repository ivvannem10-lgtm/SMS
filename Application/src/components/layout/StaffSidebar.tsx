'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, UserCheck, BookMarked, Banknote, Users,
  Shield, LogOut, BookOpen, ClipboardList,
  Building2, GraduationCap, School, Layers, FileText, Wallet, CalendarDays, LayoutGrid, FileCheck2,
  Briefcase, UserRound, ClipboardCheck, CalendarClock, Kanban,
} from 'lucide-react'
import { cn, initials, ROLE_LABELS } from '@/lib/utils'
import type { Role } from '@/types'

type NavItem = { href: string; label: string; icon: React.ElementType; roles?: Role[] }

const STAFF_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [
      { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard,
        roles: ['SUPER_ADMIN','ADMISSION_OFFICER','REGISTRAR','TREASURER','ACADEMIC_ADMIN'] as Role[] },
      { href: '/staff/audit',  label: 'Audit Logs',      icon: Shield, roles: ['SUPER_ADMIN'] as Role[] },
      { href: '/staff/users',  label: 'User Management', icon: Users,  roles: ['SUPER_ADMIN'] as Role[] },
    ],
  },
  {
    group: 'Admissions',
    items: [
      { href: '/staff/admissions',     label: 'Applicants', icon: UserCheck,   roles: ['SUPER_ADMIN','ADMISSION_OFFICER'] as Role[] },
      { href: '/staff/admissions/crm', label: 'CRM',        icon: LayoutGrid,  roles: ['SUPER_ADMIN','ADMISSION_OFFICER'] as Role[] },
    ],
  },
  {
    group: 'Records',
    items: [
      { href: '/staff/registrar',           label: 'Student Records',    icon: BookMarked,
        roles: ['SUPER_ADMIN','REGISTRAR'] as Role[] },
      { href: '/staff/registrar/documents', label: 'Doc Generator',      icon: FileText,
        roles: ['SUPER_ADMIN','REGISTRAR'] as Role[] },
      { href: '/staff/grades',              label: 'Grade Finalization',  icon: FileCheck2,
        roles: ['SUPER_ADMIN','REGISTRAR','ACADEMIC_ADMIN'] as Role[] },
    ],
  },
  {
    group: 'Finance',
    items: [
      { href: '/staff/treasury',          label: 'Cashier',          icon: Banknote,   roles: ['SUPER_ADMIN','TREASURER'] as Role[] },
      { href: '/staff/treasury/accounts', label: 'Student Accounts', icon: Wallet,     roles: ['SUPER_ADMIN','TREASURER'] as Role[] },
      { href: '/staff/treasury/logs',     label: 'Transaction Logs', icon: FileText,   roles: ['SUPER_ADMIN','TREASURER'] as Role[] },
      { href: '/staff/treasury/budget',   label: 'Budget Mgmt',      icon: LayoutGrid, roles: ['SUPER_ADMIN','ACCOUNTING'] as Role[] },
    ],
  },
  {
    group: 'Academic',
    items: [
      { href: '/staff/academic/departments', label: 'Departments', icon: Building2,    roles: ['SUPER_ADMIN','ACADEMIC_ADMIN'] as Role[] },
      { href: '/staff/academic',            label: 'Subjects',    icon: BookOpen,      roles: ['SUPER_ADMIN','ACADEMIC_ADMIN'] as Role[] },
      { href: '/staff/academic/rooms',      label: 'Rooms',       icon: ClipboardList, roles: ['SUPER_ADMIN','ACADEMIC_ADMIN'] as Role[] },
      { href: '/staff/academic/offerings',  label: 'Offerings',   icon: ClipboardList, roles: ['SUPER_ADMIN','ACADEMIC_ADMIN'] as Role[] },
    ],
  },
  {
    group: 'Human Resources',
    items: [
      { href: '/staff/hr',             label: 'HR Dashboard',   icon: LayoutDashboard, roles: ['SUPER_ADMIN','HR_STAFF'] as Role[] },
      { href: '/staff/hr/jobs',        label: 'Job Postings',   icon: Briefcase,       roles: ['SUPER_ADMIN','HR_STAFF'] as Role[] },
      { href: '/staff/hr/recruitment', label: 'Recruitment',    icon: Kanban,          roles: ['SUPER_ADMIN','HR_STAFF'] as Role[] },
      { href: '/staff/hr/employees',   label: 'Employees',      icon: UserRound,       roles: ['SUPER_ADMIN','HR_STAFF'] as Role[] },
      { href: '/staff/hr/onboarding',  label: 'Onboarding',     icon: ClipboardCheck,  roles: ['SUPER_ADMIN','HR_STAFF'] as Role[] },
      { href: '/staff/hr/leaves',      label: 'Leave Requests', icon: CalendarClock,   roles: ['SUPER_ADMIN','HR_STAFF'] as Role[] },
    ],
  },
  {
    group: 'People',
    items: [
      { href: '/staff/team',     label: 'Team Hub',    icon: Users },
      { href: '/staff/calendar', label: 'Calendar',    icon: CalendarDays },
    ],
  },
]

const DEAN_NAV: { group: string; items: { href: string; label: string; icon: React.ElementType }[] }[] = [
  {
    group: 'Department',
    items: [
      { href: '/staff/dean',             label: 'Dean Dashboard',     icon: LayoutDashboard },
      { href: '/staff/dean/programs',    label: 'Programs',           icon: Layers },
      { href: '/staff/dean/students',    label: 'Student List',       icon: BookMarked },
      { href: '/staff/dean/assignments', label: 'Teacher Assignment', icon: Users },
      { href: '/staff/dean/budget',      label: 'Department Budget',  icon: Wallet },
    ],
  },
  {
    group: 'People',
    items: [
      { href: '/staff/team',     label: 'Team Hub',    icon: Users },
      { href: '/staff/calendar', label: 'Calendar',    icon: CalendarDays },
    ],
  },
]

export function StaffSidebar() {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const user = session?.user as { name?: string; role?: string; schoolName?: string; deanDepartment?: string } | undefined
  const role   = user?.role as Role
  const isDean = role === 'DEAN'
  const isHR   = role === 'HR_STAFF'

  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)

  async function confirmSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  const navGroups = isDean
    ? DEAN_NAV
    : STAFF_NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) })).filter((g) => g.items.length > 0)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col bg-sidebar-bg">

      {/* ── Brand header ──────────────────────────────────────────────────── */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
          isDean ? 'bg-brand-400' : 'bg-brand-500',
        )}>
          {isDean
            ? <Building2 className="h-3.5 w-3.5 text-white" />
            : <School className="h-3.5 w-3.5 text-white" />
          }
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-white leading-tight tracking-tight">
            {user?.schoolName ?? 'School'}
          </p>
          <p className="text-2xs text-sidebar-text leading-tight truncate">
            {isDean ? (user?.deanDepartment ?? 'Dean Portal') : 'Management System'}
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.group}>
            <p className="mb-1 px-2 text-2xs font-bold uppercase tracking-[0.1em] text-sidebar-heading">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const allHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href))
                const active = pathname === item.href ||
                  (pathname.startsWith(item.href + '/') &&
                   !allHrefs.some((h) => h !== item.href && h.startsWith(item.href + '/') && pathname.startsWith(h)))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-100',
                      active
                        ? 'bg-sidebar-active text-white'
                        : 'text-sidebar-text hover:bg-sidebar-hover hover:text-slate-200',
                    )}
                  >
                    <item.icon className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-brand-300' : 'text-sidebar-muted',
                    )} />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-300" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Department badge for Dean ─────────────────────────────────────── */}
      {isDean && (
        <div className="mx-3 mb-2 rounded-lg bg-brand-900/40 border border-brand-800/40 px-3 py-2">
          <p className="text-2xs font-bold text-brand-300 uppercase tracking-wide">Department</p>
          <p className="text-xs text-brand-200 truncate mt-0.5">{user?.deanDepartment ?? '—'}</p>
        </div>
      )}

      {/* ── User footer ──────────────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-bold text-white',
            isDean ? 'bg-brand-400' : 'bg-brand-500',
          )}>
            {user?.name ? initials(user.name) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-slate-200">{user?.name ?? 'Staff'}</p>
            <p className="text-2xs text-sidebar-text">{role ? ROLE_LABELS[role] : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setSignOutOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-sidebar-text hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign Out
        </button>
      </div>

      {/* ── Sign-out confirmation ──────────────────────────────────────────── */}
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
