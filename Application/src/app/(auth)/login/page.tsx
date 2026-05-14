'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, GraduationCap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const DEMO_GROUPS = [
  {
    label: 'Administration',
    accounts: [
      { email: 'admin@school.edu',      label: 'Super Admin',       dot: 'bg-slate-400' },
      { email: 'admissions@school.edu', label: 'Admission Officer', dot: 'bg-violet-400' },
      { email: 'registrar@school.edu',  label: 'Registrar',         dot: 'bg-blue-400' },
      { email: 'academic@school.edu',   label: 'Academic Admin',    dot: 'bg-cyan-400' },
    ],
  },
  {
    label: 'Finance',
    accounts: [
      { email: 'treasury@school.edu',   label: 'Treasurer',         dot: 'bg-emerald-400' },
      { email: 'accounting@school.edu', label: 'Accounting',        dot: 'bg-teal-400' },
      { email: 'purchasing@school.edu', label: 'Purchasing Officer',dot: 'bg-lime-400' },
    ],
  },
  {
    label: 'Deans',
    accounts: [
      { email: 'dean.computing@school.edu', label: 'Dean — Computing', dot: 'bg-indigo-400' },
      { email: 'dean.business@school.edu',  label: 'Dean — Business',  dot: 'bg-indigo-400' },
      { email: 'dean.nursing@school.edu',   label: 'Dean — Nursing',   dot: 'bg-indigo-400' },
      { email: 'dean.arts@school.edu',      label: 'Dean — Arts',      dot: 'bg-indigo-400' },
    ],
  },
  {
    label: 'Other',
    accounts: [
      { email: 'hr@school.edu',            label: 'HR Staff',          dot: 'bg-pink-400' },
      { email: 'amo@school.edu',           label: 'Asset Management',  dot: 'bg-yellow-400' },
      { email: 'prof.santos@school.edu',   label: 'Teacher',           dot: 'bg-orange-400' },
      { email: 'student@school.edu',       label: 'Student',           dot: 'bg-slate-400' },
    ],
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [agreed, setAgreed]         = useState(false)
  const [showDemo, setShowDemo]     = useState(false)
  const [demoLoading, setDemoLoading] = useState('')

  async function loginAsDemo(demoEmail: string) {
    setAgreed(true)
    setError('')
    setDemoLoading(demoEmail)
    const res = await signIn('credentials', { email: demoEmail, password: 'password', redirect: false })
    setDemoLoading('')
    if (res?.error) { setError('Demo login failed. Please try again.'); return }
    router.push('/')
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return
    setError(''); setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) { setError('Invalid email or password.'); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0c1225] flex">
      {/* Left: school branding panel */}
      <div className="hidden lg:flex w-[420px] flex-col justify-between p-10 border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-glow">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white leading-tight">St. Dominic College</p>
            <p className="text-xs text-slate-500 leading-tight">Powered by School Eco</p>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <p className="text-3xl font-black text-white leading-snug mb-3 tracking-tight">
            One system.<br />Every process.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            From admissions to graduation — manage every academic lifecycle stage in a single, unified platform.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { label: 'Admissions',  sub: 'Application tracking' },
              { label: 'Registrar',   sub: 'Student records' },
              { label: 'Treasury',    sub: 'Billing & payments' },
              { label: 'LMS',         sub: 'Learning management' },
              { label: 'Team Hub',    sub: 'Employee directory' },
              { label: 'Calendar',    sub: 'Academic events' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/5 border border-white/8 p-3 hover:bg-white/8 transition-colors">
                <p className="text-xs font-semibold text-slate-300">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© {new Date().getFullYear()} St. Dominic College</p>
      </div>

      {/* Right: login form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <p className="text-base font-bold text-white">St. Dominic College</p>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-slate-400 mb-7">Sign in to your portal to continue.</p>

          {error && (
            <div className="flex items-center gap-2 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 tracking-wide">Email address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu" required autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 focus:border-brand-500/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms agreement */}
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Before signing in, please read and accept our{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors font-medium"
                >
                  Terms of Service
                </a>
                . If accessing on behalf of a minor student, parental or guardian consent is required.
              </p>
              <button
                type="button"
                onClick={() => setAgreed(!agreed)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all duration-200 ${
                  agreed
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                }`}
              >
                {agreed ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
                    </svg>
                    Agreed — Terms Accepted
                  </>
                ) : (
                  'I Agree to the Terms of Service'
                )}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!agreed}>
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            New applicant?{' '}
            <a href="/apply" className="text-brand-400 hover:text-brand-300 transition-colors">Apply here →</a>
          </p>

          {/* Demo accounts panel */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-400">D</span>
                <span className="text-xs font-semibold text-slate-400">Demo Accounts</span>
                <span className="text-[10px] text-slate-600">— all passwords: <span className="font-mono text-slate-500">password</span></span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`} />
            </button>

            {showDemo && (
              <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-3">
                <p className="text-[10px] text-slate-600 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Click any account to sign in instantly
                </p>
                {DEMO_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">{group.label}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.accounts.map((acc) => {
                        const isThis = demoLoading === acc.email
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            disabled={!!demoLoading}
                            onClick={() => loginAsDemo(acc.email)}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-all ${
                              isThis
                                ? 'bg-brand-500/30 text-brand-300 ring-1 ring-brand-500/40'
                                : demoLoading
                                ? 'opacity-40 text-slate-500 cursor-not-allowed'
                                : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                          >
                            {isThis ? (
                              <svg className="h-3 w-3 animate-spin shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${acc.dot}`} />
                            )}
                            {acc.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="pt-1 border-t border-white/8">
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    For simultaneous multi-role testing, open a{' '}
                    <span className="text-slate-400 font-medium">Chrome Incognito window</span>
                    {' '}or use a different{' '}
                    <span className="text-slate-400 font-medium">browser profile</span>
                    {' '}— each has its own independent session.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
