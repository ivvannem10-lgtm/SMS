'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell, X, ChevronRight, User, Palette, Settings, HelpCircle, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useSession, signOut } from 'next-auth/react'
import { MOCK_STUDENTS, MOCK_FACULTY, MOCK_COURSES, MOCK_NOTIFICATIONS, CRM_FOLLOWUPS } from '@/lib/mock-data'
import { fullName } from '@/lib/utils'
import { loadProfile } from '@/app/providers'

const PAGE_TITLES: Record<string, string> = {
  '/staff/dashboard':                'Dashboard',
  '/staff/admissions':               'Admissions',
  '/staff/admissions/crm':           'Admissions CRM',
  '/staff/registrar':                'Student Records',
  '/staff/treasury':                 'Treasury — Cashier',
  '/staff/treasury/accounts':        'Student Accounts',
  '/staff/treasury/logs':            'Transaction Logs',
  '/staff/academic':                 'Subject Master List',
  '/staff/academic/rooms':           'Rooms',
  '/staff/academic/offerings':       'Subject Offerings',
  '/staff/academic/departments':     'Departments',
  '/staff/dean':                     'Dean Dashboard',
  '/staff/dean/programs':            'Programs',
  '/staff/dean/students':            'Student List',
  '/staff/dean/assignments':         'Teacher Assignment',
  '/staff/team':                     'Team Hub',
  '/staff/calendar':                 'School Year Calendar',
  '/staff/audit':                    'Audit Logs',
  '/staff/profile':                  'My Profile',
  '/staff/personalization':          'Personalization',
  '/staff/settings':                 'Settings',
  '/staff/help':                     'Help',
  '/student/dashboard':              'Dashboard',
  '/student/enrollment':             'Enrollment',
  '/student/subjects':               'My Subjects',
  '/student/soa':                    'Statement of Account',
  '/student/notifications':          'Notifications',
  '/student/profile':                'My Profile',
  '/teacher/dashboard':              'Dashboard',
  '/teacher/subjects':               'My Courses',
  '/teacher/schedule':               'My Schedule',
  '/teacher/team':                   'Team Hub',
  '/teacher/calendar':               'School Year Calendar',
}

const PROFILE_MENU = [
  { label: 'Personalization', href: '/staff/personalization', icon: Palette,    desc: 'Theme & appearance' },
  { label: 'Profile',         href: '/staff/profile',         icon: User,        desc: 'Edit your info' },
  { label: 'Settings',        href: '/staff/settings',        icon: Settings,    desc: 'Account & security' },
  { label: 'Help',            href: '/staff/help',            icon: HelpCircle,  desc: 'Guides & FAQ' },
]

type SearchResult = { type: string; id: string; label: string; sub?: string; href: string }

function search(q: string): SearchResult[] {
  if (q.length < 2) return []
  const lq = q.toLowerCase()
  const results: SearchResult[] = []
  MOCK_STUDENTS.forEach((s) => {
    const name = fullName(s)
    if (name.toLowerCase().includes(lq) || s.studentId.toLowerCase().includes(lq))
      results.push({ type: 'Student', id: s.id, label: name, sub: s.studentId, href: `/staff/registrar/${s.id}` })
  })
  MOCK_FACULTY.forEach((f) => {
    if (fullName(f).toLowerCase().includes(lq))
      results.push({ type: 'Faculty', id: f.id, label: fullName(f), sub: f.department ?? '', href: `/staff/dean` })
  })
  MOCK_COURSES?.forEach?.((c: { id: string; name: string; code: string }) => {
    if (c.name.toLowerCase().includes(lq) || c.code.toLowerCase().includes(lq))
      results.push({ type: 'Subject', id: c.id, label: c.name, sub: c.code, href: `/staff/academic` })
  })
  return results.slice(0, 5)
}

export function Header() {
  const { data: session } = useSession()
  const user     = session?.user as { name?: string; id?: string } | undefined
  const userId   = (session?.user as { id?: string })?.id ?? 'default'
  const router   = useRouter()
  const pathname = usePathname()

  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState<SearchResult[]>([])
  const [open,        setOpen]        = useState(false)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [photoUrl,    setPhotoUrl]    = useState<string>('')

  const searchRef  = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Load saved photo on mount
  useEffect(() => {
    const p = loadProfile(userId)
    if (p.photoDataUrl) setPhotoUrl(p.photoDataUrl)
  }, [userId])

  const today      = new Date().toISOString().slice(0, 10)
  const dueFuToday = CRM_FOLLOWUPS.filter((f) => !f.done && f.dueDate === today)
  const unread     = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length + dueFuToday.length

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] ?? ''

  useEffect(() => {
    const res = search(query)
    setResults(res)
    setOpen(res.length > 0)
  }, [query])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setOpen(false)
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const displayName = user?.name ?? 'User'

  return (
    <header className="sticky top-0 z-[35] flex h-14 items-center gap-4 border-b border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 px-6">
      {/* Page title */}
      {title && <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0 hidden sm:block">{title}</h2>}
      {title && <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />}

      {/* Global search */}
      <div className="relative flex-1 max-w-xs" ref={searchRef}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-7 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {query && (
            <button onClick={() => { setQuery(''); setOpen(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        {open && (
          <div className="absolute top-full mt-1.5 w-72 rounded-xl border border-slate-100 bg-white shadow-card-md overflow-hidden z-50 animate-slide-up">
            {results.map((r) => (
              <button key={r.id} onClick={() => { router.push(r.href); setQuery(''); setOpen(false) }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors group"
              >
                <span className="shrink-0 rounded-md bg-brand-50 px-1.5 py-0.5 text-2xs font-semibold text-brand-600 uppercase">{r.type}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{r.label}</p>
                  {r.sub && <p className="text-xs text-slate-400">{r.sub}</p>}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => setShowNotifs((v) => !v)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-2xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {showNotifs && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-100 bg-white shadow-card-lg z-50 overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {unread > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-semibold text-brand-600">{unread} new</span>}
            </div>
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {dueFuToday.length > 0 && (
                <a href="/staff/admissions/crm" className="block hover:bg-amber-50/60 transition-colors">
                  <div className="flex gap-3 px-4 py-3 bg-amber-50/40">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-800">{dueFuToday.length} follow-up{dueFuToday.length !== 1 ? 's' : ''} due today</p>
                      <p className="text-xs text-amber-600 mt-0.5 truncate">{dueFuToday.map((f) => f.leadName).join(', ')}</p>
                    </div>
                  </div>
                </a>
              )}
              {MOCK_NOTIFICATIONS.slice(0, 5).map((n) => (
                <div key={n.id} className={`flex gap-3 px-4 py-3 ${!n.isRead ? 'bg-brand-50/30' : ''}`}>
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!n.isRead ? 'bg-brand-500' : 'bg-transparent'}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))}
              {dueFuToday.length === 0 && MOCK_NOTIFICATIONS.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-400">No notifications</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div className="relative pl-1 border-l border-slate-100 dark:border-slate-800" ref={profileRef}>
        <button
          onClick={() => setShowProfile((v) => !v)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          {photoUrl
            ? <img src={photoUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-100" />
            : <Avatar name={displayName} size="sm" />
          }
          <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 hidden md:block">{displayName.split(' ')[0]}</p>
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-100 bg-white shadow-card-lg z-50 overflow-hidden animate-slide-up">
            {/* User info header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-[#f8fafd]">
              {photoUrl
                ? <img src={photoUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                : <Avatar name={displayName} size="md" />
              }
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{(session?.user as { email?: string })?.email}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              {PROFILE_MENU.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setShowProfile(false) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-brand-50 transition-colors">
                      <Icon className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Sign out */}
            <div className="border-t border-slate-100 py-1.5">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-red-100 transition-colors">
                  <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-600 transition-colors" />
                </div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-red-700 transition-colors">Sign Out</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
