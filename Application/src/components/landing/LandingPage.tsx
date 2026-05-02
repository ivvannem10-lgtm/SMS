'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  GraduationCap, BookOpen, Banknote, UserCheck,
  Users, BarChart2, ArrowRight, CheckCircle2, Star,
  Shield, Zap, Globe, ChevronRight,
} from 'lucide-react'

const FEATURES = [
  { icon: UserCheck,  title: 'Admissions',         desc: 'Digital application pipeline — from applicant to enrolled student with zero paperwork.',  color: 'bg-violet-500' },
  { icon: BookOpen,   title: 'Registrar',           desc: 'Full student records, enrollment, grade tracking, and academic history in one place.',      color: 'bg-blue-500' },
  { icon: Banknote,   title: 'Treasury & Billing',  desc: 'Real-time Statement of Accounts, payments, charges, and receipts with full audit trail.',   color: 'bg-emerald-500' },
  { icon: GraduationCap, title: 'Dean Portal',      desc: 'Department-scoped dashboards, program management, teacher assignments, and analytics.',     color: 'bg-orange-500' },
  { icon: Users,      title: 'Faculty LMS',         desc: 'Course materials, quizzes, assignments, grading criteria and grade book for teachers.',     color: 'bg-teal-500' },
  { icon: BarChart2,  title: 'Analytics',           desc: 'School-wide pipeline statistics, enrollment trends, and academic performance insights.',    color: 'bg-brand-500' },
]

const STATS = [
  { value: '10+', label: 'Modules' },
  { value: '7',   label: 'User Roles' },
  { value: '100%', label: 'Cloud Ready' },
  { value: '0',   label: 'Paperwork' },
]

const PIPELINE = [
  { step: '01', label: 'Apply',         icon: UserCheck,    color: 'text-violet-600 bg-violet-50' },
  { step: '02', label: 'Enroll',        icon: BookOpen,     color: 'text-blue-600 bg-blue-50' },
  { step: '03', label: 'Pay',           icon: Banknote,     color: 'text-emerald-600 bg-emerald-50' },
  { step: '04', label: 'Learn',         icon: GraduationCap, color: 'text-orange-600 bg-orange-50' },
  { step: '05', label: 'Graduate',      icon: Star,         color: 'text-amber-600 bg-amber-50' },
]

function AnimatedNumber({ target, suffix = '' }: { target: number | string; suffix?: string }) {
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    if (typeof target === 'string') { setDisplay(target); return }
    let start = 0
    const end = target
    const duration = 1200
    const step = (end / duration) * 16
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setDisplay(Math.floor(start).toString())
      if (start >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <>{display}{suffix}</>
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 shadow-sm">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              School <span className="text-brand-400">Eco</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/apply" className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
              Apply Now
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-600 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c1e3d] via-[#1a4a8a] to-[#1e5ba8] pb-32 pt-32">
        {/* Background dots pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Floating blobs */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-xs font-semibold text-white/90">SaaS-based School Information System</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-none">
            The smarter way<br />
            <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              to run your school
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100/80 leading-relaxed">
            School Eco connects every department — from admissions to graduation — in one synchronized platform. Replace spreadsheets, paper forms, and disconnected systems with a unified school ecosystem.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/apply"
              className="group flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-brand-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Apply as Student
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              Staff Portal
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Hero stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-blue-200/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline section ───────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">The School Eco Pipeline</p>
            <h2 className="text-3xl font-black text-slate-900">Every student journey, synchronized</h2>
          </div>

          <div className="flex flex-col items-center gap-0 sm:flex-row sm:items-stretch sm:gap-0">
            {PIPELINE.map((stage, i) => (
              <div key={stage.step} className="flex flex-1 flex-col items-center sm:flex-row">
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-[#e4ebf5] px-5 py-6 shadow-card text-center flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stage.color}`}>
                    <stage.icon className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stage.step}</p>
                  <p className="text-sm font-bold text-slate-900">{stage.label}</p>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="flex h-8 w-full items-center justify-center sm:h-full sm:w-8">
                    <ChevronRight className="h-5 w-5 text-slate-300 rotate-90 sm:rotate-0 shrink-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">Everything you need</p>
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">One platform. Every department.</h2>
            <p className="mt-4 text-base text-slate-500 max-w-xl mx-auto">Built around how schools actually work — not how software vendors think they work.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-[#e4ebf5] bg-white p-6 hover:border-brand-200 hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.color} mb-4`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why School Eco ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-[#0c1e3d] to-[#1a4a8a] text-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-3">Why School Eco?</p>
              <h2 className="text-3xl font-black leading-tight mb-6">
                Stop managing<br />seven different systems
              </h2>
              <p className="text-blue-100/80 leading-relaxed mb-8">
                Most schools juggle separate tools for admissions, records, billing, LMS, and reporting. School Eco replaces all of them with one unified, role-based platform where every department sees exactly what they need.
              </p>
              <div className="space-y-3">
                {[
                  'Role-based portals for every staff member',
                  'Real-time data across all departments',
                  'Complete audit trail for compliance',
                  'Built-in LMS with grading & assessments',
                  'Treasury with SOA, receipts & overpayment tracking',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-100/90">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield,  title: 'Secure',      desc: 'Role-based access control — staff see only their domain',  bg: 'bg-white/10' },
                { icon: Zap,     title: 'Fast',         desc: 'Instant search, real-time updates, no page reloads',       bg: 'bg-white/10' },
                { icon: Globe,   title: 'Cloud-first',  desc: 'Access from anywhere, on any device',                      bg: 'bg-white/10' },
                { icon: BarChart2, title: 'Insightful', desc: 'Analytics for deans, admin, and academic coordinators',    bg: 'bg-white/10' },
              ].map((card) => (
                <div key={card.title} className={`rounded-2xl border border-white/10 ${card.bg} p-5 backdrop-blur-sm`}>
                  <card.icon className="h-6 w-6 text-blue-300 mb-3" />
                  <p className="text-sm font-bold text-white mb-1">{card.title}</p>
                  <p className="text-xs text-blue-200/70 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-black text-slate-900 sm:text-4xl mb-4">
            Ready to synchronize your school?
          </h2>
          <p className="text-base text-slate-500 mb-10">
            Students can apply online. Staff can log in immediately with their credentials.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/apply"
              className="group flex items-center gap-2 rounded-2xl bg-brand-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5"
            >
              Apply for Admission
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-8 py-3.5 text-sm font-bold text-slate-700 hover:border-brand-300 hover:bg-brand-50 transition-all"
            >
              Staff / Faculty Login
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500">
              <GraduationCap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">School Eco</span>
            <span className="text-xs text-slate-400">— School Ecosystem</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} School Eco. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/login" className="hover:text-brand-600 transition-colors">Staff Login</Link>
            <Link href="/apply" className="hover:text-brand-600 transition-colors">Apply Online</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
