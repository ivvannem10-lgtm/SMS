'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  GraduationCap, Monitor, Users, Copy, Check,
  ExternalLink, Zap,
} from 'lucide-react'

const ACCOUNTS = [
  // Administration
  { email: 'admin@school.edu',          label: 'Super Admin',        role: 'SUPER_ADMIN',        portal: '/staff/dashboard',   color: 'bg-slate-500',   group: 'Administration' },
  { email: 'admissions@school.edu',     label: 'Admission Officer',  role: 'ADMISSION_OFFICER',  portal: '/staff/admissions',  color: 'bg-violet-500',  group: 'Administration' },
  { email: 'registrar@school.edu',      label: 'Registrar',          role: 'REGISTRAR',          portal: '/staff/registrar',   color: 'bg-blue-500',    group: 'Administration' },
  { email: 'academic@school.edu',       label: 'Academic Admin',     role: 'ACADEMIC_ADMIN',     portal: '/staff/academic',    color: 'bg-cyan-500',    group: 'Administration' },
  // Finance
  { email: 'treasury@school.edu',       label: 'Treasurer',          role: 'TREASURER',          portal: '/staff/treasury',    color: 'bg-emerald-500', group: 'Finance' },
  { email: 'accounting@school.edu',     label: 'Accounting',         role: 'ACCOUNTING',         portal: '/staff/accounting',  color: 'bg-teal-500',    group: 'Finance' },
  { email: 'purchasing@school.edu',     label: 'Purchasing Officer', role: 'PURCHASING_OFFICER', portal: '/staff/purchasing',  color: 'bg-lime-500',    group: 'Finance' },
  // Deans
  { email: 'dean.computing@school.edu', label: 'Dean — Computing',   role: 'DEAN',               portal: '/staff/dean',        color: 'bg-indigo-500',  group: 'Deans' },
  { email: 'dean.business@school.edu',  label: 'Dean — Business',    role: 'DEAN',               portal: '/staff/dean',        color: 'bg-indigo-500',  group: 'Deans' },
  { email: 'dean.nursing@school.edu',   label: 'Dean — Nursing',     role: 'DEAN',               portal: '/staff/dean',        color: 'bg-indigo-500',  group: 'Deans' },
  { email: 'dean.arts@school.edu',      label: 'Dean — Arts',        role: 'DEAN',               portal: '/staff/dean',        color: 'bg-indigo-500',  group: 'Deans' },
  // Others
  { email: 'hr@school.edu',             label: 'HR Staff',           role: 'HR_STAFF',           portal: '/staff/hr',          color: 'bg-pink-500',    group: 'Other' },
  { email: 'amo@school.edu',            label: 'Asset Management',   role: 'AMO',                portal: '/staff/ams',         color: 'bg-yellow-500',  group: 'Other' },
  { email: 'prof.santos@school.edu',    label: 'Teacher',            role: 'TEACHER',            portal: '/teacher/subjects',  color: 'bg-orange-500',  group: 'Other' },
  { email: 'student@school.edu',        label: 'Student',            role: 'STUDENT',            portal: '/student/dashboard', color: 'bg-slate-400',   group: 'Other' },
]

const GROUPS = ['Administration', 'Finance', 'Deans', 'Other']

export default function DevPage() {
  const router = useRouter()
  const [loading, setLoading] = useState('')
  const [copied, setCopied] = useState('')

  async function login(email: string, portal: string) {
    setLoading(email)
    const res = await signIn('credentials', { email, password: 'password', redirect: false })
    setLoading('')
    if (res?.error) { alert('Login failed'); return }
    router.push(portal)
    router.refresh()
  }

  function copyUrl(email: string) {
    const alias = email.split('@')[0].replace('.', '-')
    const url = `${window.location.origin}/api/dev/login?as=${email}`
    navigator.clipboard.writeText(url)
    setCopied(email)
    setTimeout(() => setCopied(''), 1800)
  }

  return (
    <div className="min-h-screen bg-[#0c1225] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Dev Testing Panel</h1>
            <p className="text-sm text-slate-400">Click any account to sign in instantly. All passwords: <code className="font-mono text-slate-300">password</code></p>
          </div>
        </div>

        {/* Multi-session tip */}
        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <p className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Testing multiple roles simultaneously
          </p>
          <div className="grid gap-2 sm:grid-cols-3 text-xs text-slate-400">
            <div className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2.5">
              <span className="text-amber-400 font-bold shrink-0">①</span>
              <span><span className="text-white font-medium">Chrome Incognito</span> — Each incognito window has its own independent session. Press <kbd className="rounded bg-white/10 px-1 font-mono text-[10px] text-slate-300">Ctrl+Shift+N</kbd></span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2.5">
              <span className="text-amber-400 font-bold shrink-0">②</span>
              <span><span className="text-white font-medium">Chrome Profiles</span> — Add multiple profiles in Chrome settings. Each profile has separate cookies.</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2.5">
              <span className="text-amber-400 font-bold shrink-0">③</span>
              <span><span className="text-white font-medium">Different browsers</span> — Chrome + Firefox + Safari each have fully independent sessions.</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Use the <span className="text-slate-300 font-medium">Copy URL</span> button to get an instant-login URL you can open in any window —{' '}
            <code className="font-mono text-slate-400">http://localhost:3000/api/dev/login?as=student@school.edu</code>
          </p>
        </div>

        {/* Account groups */}
        {GROUPS.map(group => {
          const accounts = ACCOUNTS.filter(a => a.group === group)
          return (
            <div key={group} className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">{group}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map(acc => {
                  const isLoading = loading === acc.email
                  const isCopied  = copied === acc.email
                  return (
                    <div key={acc.email}
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition-colors">
                      {/* Avatar */}
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${acc.color} shrink-0`}>
                        <span className="text-[11px] font-bold text-white">
                          {acc.label.charAt(0)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-200 truncate">{acc.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{acc.email}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy URL */}
                        <button
                          onClick={() => copyUrl(acc.email)}
                          title="Copy auto-login URL"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-colors"
                        >
                          {isCopied
                            ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                            : <Copy className="h-3.5 w-3.5" />}
                        </button>

                        {/* Login button */}
                        <button
                          onClick={() => login(acc.email, acc.portal)}
                          disabled={!!loading}
                          className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-all ${
                            isLoading
                              ? 'bg-brand-500/30 text-brand-300'
                              : loading
                              ? 'opacity-40 cursor-not-allowed text-slate-500'
                              : 'bg-brand-500/20 text-brand-300 hover:bg-brand-500/40 hover:text-brand-200'
                          }`}
                        >
                          {isLoading ? (
                            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <ExternalLink className="h-3 w-3" />
                          )}
                          Login
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* URL reference */}
        <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5" />
            Auto-login URL pattern
          </p>
          <div className="space-y-1.5">
            {[
              ['admin', 'Super Admin → /staff/dashboard'],
              ['student', 'Student → /student/dashboard'],
              ['teacher', 'Teacher → /teacher/subjects'],
              ['registrar', 'Registrar → /staff/registrar'],
              ['treasurer', 'Treasurer → /staff/treasury'],
              ['hr', 'HR Staff → /staff/hr'],
              ['amo', 'Asset Management → /staff/ams'],
            ].map(([alias, desc]) => (
              <div key={alias} className="flex items-center gap-3">
                <code className="text-[11px] font-mono text-brand-400 bg-brand-500/10 rounded px-2 py-0.5 whitespace-nowrap">
                  /api/dev/login?as={alias}
                </code>
                <span className="text-[11px] text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-600">
            Append <code className="font-mono text-slate-500">&amp;redirect=/path</code> to land on a specific page after login.
          </p>
        </div>
      </div>
    </div>
  )
}
