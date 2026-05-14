'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, Palette, Settings, HelpCircle, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useSession, signOut } from 'next-auth/react'
import { MOCK_NOTIFICATIONS, CRM_FOLLOWUPS } from '@/lib/mock-data'
import { loadProfile } from '@/app/providers'


const PROFILE_MENU = [
  { label: 'Personalization', href: '/staff/personalization', icon: Palette,    desc: 'Theme & appearance' },
  { label: 'Profile',         href: '/staff/profile',         icon: User,        desc: 'Edit your info' },
  { label: 'Settings',        href: '/staff/settings',        icon: Settings,    desc: 'Account & security' },
  { label: 'Help',            href: '/staff/help',            icon: HelpCircle,  desc: 'Guides & FAQ' },
]


export function Header() {
  const { data: session } = useSession()
  const user     = session?.user as { name?: string; id?: string } | undefined
  const userId   = (session?.user as { id?: string })?.id ?? 'default'
  const router   = useRouter()

  const [showNotifs,  setShowNotifs]  = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [photoUrl,    setPhotoUrl]    = useState<string>('')
  const [notifs,      setNotifs]      = useState(() => MOCK_NOTIFICATIONS.map(n => ({ ...n })))

  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Load saved photo on mount
  useEffect(() => {
    const p = loadProfile(userId)
    if (p.photoDataUrl) setPhotoUrl(p.photoDataUrl)
  }, [userId])

  const today      = new Date().toISOString().slice(0, 10)
  const dueFuToday = CRM_FOLLOWUPS.filter((f) => !f.done && f.dueDate === today)
  const unread     = notifs.filter((n) => !n.isRead).length + dueFuToday.length

  function markOneRead(id: string) {
    // Mutate the shared array so student page stays in sync
    const orig = MOCK_NOTIFICATIONS.find(x => x.id === id)
    if (orig) orig.isRead = true
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  function markAllRead() {
    MOCK_NOTIFICATIONS.forEach(n => { n.isRead = true })
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const displayName = user?.name ?? 'User'

  return (
    <header className="sticky top-0 z-[35] flex h-14 items-center gap-4 border-b border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 px-6">
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
              <div className="flex items-center gap-2">
                {unread > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-semibold text-brand-600">{unread} new</span>}
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-2xs text-slate-500 hover:text-brand-600 font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
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
              {notifs.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  onClick={() => { markOneRead(n.id); if (n.link) router.push(n.link) }}
                  className={`w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${!n.isRead ? 'bg-brand-50/30' : ''}`}
                >
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.isRead ? 'bg-brand-500' : 'bg-transparent'}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </button>
              ))}
              {dueFuToday.length === 0 && MOCK_NOTIFICATIONS.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-400">No notifications</div>
              )}
            </div>
            {notifs.length > 5 && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                <button
                  onClick={() => { setShowNotifs(false); router.push('/student/notifications') }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  View all {notifs.length} notifications
                </button>
              </div>
            )}
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
