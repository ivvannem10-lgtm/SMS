'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const DEMO_ACCOUNTS = [
  { role: 'SUPER_ADMIN',       email: 'admin@school.edu',          label: 'Super Admin',        color: 'bg-slate-800 text-white hover:bg-slate-700' },
  { role: 'ADMISSION_OFFICER', email: 'admissions@school.edu',     label: 'Admission Officer',  color: 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100' },
  { role: 'REGISTRAR',         email: 'registrar@school.edu',      label: 'Registrar',          color: 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' },
  { role: 'TREASURER',         email: 'treasury@school.edu',       label: 'Treasurer',          color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' },
  { role: 'ACADEMIC_ADMIN',    email: 'academic@school.edu',       label: 'Academic Admin',     color: 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100' },
  { role: 'DEAN',              email: 'dean.computing@school.edu', label: 'Dean — Computing',   color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100' },
  { role: 'DEAN',              email: 'dean.business@school.edu',  label: 'Dean — Business',   color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100' },
  { role: 'DEAN',              email: 'dean.nursing@school.edu',   label: 'Dean — Nursing',    color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100' },
  { role: 'DEAN',              email: 'dean.arts@school.edu',      label: 'Dean — Arts',       color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100' },
  { role: 'TEACHER',           email: 'prof.santos@school.edu',    label: 'Teacher',            color: 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100' },
  { role: 'STUDENT',           email: 'student@school.edu',        label: 'Student',            color: 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 rounded-xl border border-white/8 bg-white/3 p-4">
            <p className="text-2xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Demo accounts · password: <span className="text-slate-400 font-mono">password</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => { setEmail(a.email); setPassword('password'); setError('') }}
                  className={`rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition-colors ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-600">
            New applicant?{' '}
            <a href="/apply" className="text-brand-400 hover:text-brand-300 transition-colors">Apply here →</a>
          </p>
        </div>
      </div>
    </div>
  )
}
