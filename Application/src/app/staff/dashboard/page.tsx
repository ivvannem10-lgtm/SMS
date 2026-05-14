'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  UserCheck, BookMarked, Banknote, Users, GraduationCap,
  TrendingUp, TrendingDown, Minus, ArrowRight, Clock,
  BookOpen, UserPlus, UserX, LayoutGrid, RefreshCw, CheckCircle2,
  FileText, ClipboardList, BarChart2, CalendarDays,
} from 'lucide-react'
import { syncAll } from '@/lib/sync'
import { Card, SectionTitle } from '@/components/ui/Card'
import { ApplicantBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  MOCK_APPLICANTS, MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_FACULTY,
  MOCK_AUDIT_LOGS, MOCK_SOA, MOCK_SEMESTERS, MOCK_OFFERINGS, MOCK_ROOMS,
} from '@/lib/mock-data'
import type { AuditLog } from '@/types'
import { fullName, formatDate, formatDateTime } from '@/lib/utils'

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.floor(eased * target))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setCount(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return count
}

// ─── Trend helpers ────────────────────────────────────────────────────────────

type Trend = 'up' | 'down' | 'neutral'

function trend(value: number, positive: boolean): Trend {
  if (value === 0) return 'neutral'
  return positive ? 'up' : 'down'
}

function trendLabel(value: number, singular: string, plural: string, zeroLabel: string): string {
  if (value === 0) return zeroLabel
  return `${value} ${value === 1 ? singular : plural}`
}

const REGISTRAR_RELEVANT_ENTITIES = ['Student', 'Enrollment']
const REGISTRAR_RELEVANT_ACTIONS  = ['CREATE', 'UPDATE']

const QUICK_ACTIONS = [
  { label: 'Billing & SOA',     href: '/staff/treasury',          icon: Banknote,   color: 'bg-emerald-600', hideFor: ['REGISTRAR', 'ADMISSION_OFFICER'] },
  { label: 'Student Accounts',  href: '/staff/treasury/accounts', icon: BookMarked, color: 'bg-brand-600',   hideFor: ['REGISTRAR', 'ADMISSION_OFFICER'] },
]

function getActivityHref(log: AuditLog): string {
  switch (log.entity) {
    case 'Applicant':  return `/staff/admissions/${log.entityId}`
    case 'Student':    return `/staff/registrar/${log.entityId}`
    case 'Enrollment': {
      const enr = MOCK_ENROLLMENTS.find((e) => e.id === log.entityId)
      return enr ? `/staff/registrar/${enr.studentId}` : '/staff/registrar'
    }
    case 'Payment':    return '/staff/treasury'
    case 'Grade':      return '/staff/academic'
    default:           return '/staff/dashboard'
  }
}

function TrendBadge({ trend, label }: { trend: 'up' | 'down' | 'neutral'; label: string }) {
  if (trend === 'up')   return <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><TrendingUp className="h-3 w-3" />{label}</span>
  if (trend === 'down') return <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500"><TrendingDown className="h-3 w-3" />{label}</span>
  return <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><Minus className="h-3 w-3" />{label}</span>
}

type StatItem = { key: string; label: string; value: number; icon: React.ElementType; iconBg: string; iconColor: string; border: string; href: string; trend: Trend; trendLabel: string; sub: string }

function AnimatedStatItem({ stat, index }: { stat: StatItem; index: number }) {
  const count = useCountUp(stat.value)
  return (
    <Link href={stat.href}>
      <div
        className={`animate-slide-up group rounded-xl border bg-white p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer ${stat.border}`}
        style={{ animationDelay: `${index * 70}ms` }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </div>
          <TrendBadge trend={stat.trend} label={stat.trendLabel} />
        </div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none mb-1">
          {count.toLocaleString()}
        </p>
        <p className="text-xs font-medium text-slate-700 leading-tight">{stat.label}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
      </div>
    </Link>
  )
}

function StatGrid({ items }: { items: StatItem[] }) {
  const cols = items.length === 4
    ? 'grid-cols-2 lg:grid-cols-4'
    : 'grid-cols-2 lg:grid-cols-5'
  return (
    <div className={`grid gap-3 ${cols}`}>
      {items.map((stat, i) => (
        <AnimatedStatItem key={stat.key} stat={stat} index={i} />
      ))}
    </div>
  )
}

export default function StaffDashboardPage() {
  const { data: session } = useSession()
  const role            = (session?.user as { role?: string })?.role ?? ''
  const isRegistrar     = role === 'REGISTRAR'
  const isAcademicAdmin = role === 'ACADEMIC_ADMIN' || role === 'SUPER_ADMIN'
  const isAdmission     = role === 'ADMISSION_OFFICER'
  const isSuperAdmin    = role === 'SUPER_ADMIN'
  const visibleActions  = QUICK_ACTIONS.filter((a) => !a.hideFor.includes(role))
  const [syncing,  setSyncing]  = useState(false)
  const [synced,   setSynced]   = useState(false)

  async function handleSyncAll() {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 800))
    syncAll()
    setSyncing(false)
    setSynced(true)
    setTimeout(() => setSynced(false), 3000)
  }

  // ── Compute live stats ───────────────────────────────────────────────────
  const sem      = MOCK_SEMESTERS.find((s) => s.isActive)
  const semStart = sem?.startDate ? new Date(sem.startDate) : null

  const gs = {
    pending:         MOCK_APPLICANTS.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length,
    accepted:        MOCK_APPLICANTS.filter((a) => a.status === 'ACCEPTED').length,
    enrolled:        MOCK_ENROLLMENTS.filter((e) => e.status === 'ENROLLED' && e.semesterId === sem?.id).length,
    pendingPayments: MOCK_SOA.filter((s) => s.status === 'UNPAID' || s.status === 'PARTIAL').length,
    activeFaculty:   MOCK_FACULTY.filter((f) => f.status === 'ACTIVE').length,
  }

  const enrolledIds = new Set(
    MOCK_ENROLLMENTS.filter((e) => e.status === 'ENROLLED' && e.semesterId === sem?.id).map((e) => e.studentId),
  )
  const rs = {
    totalStudents: MOCK_STUDENTS.length,
    totalEnrolled: MOCK_STUDENTS.filter((s) => enrolledIds.has(s.id)).length,
    notEnrolled:   MOCK_STUDENTS.filter((s) => s.status === 'ACTIVE' && !enrolledIds.has(s.id)).length,
    newlyAdded:    semStart ? MOCK_STUDENTS.filter((s) => new Date(s.createdAt) >= semStart).length : 0,
  }

  // ── Stat card definitions — trends computed from live data ───────────────
  const ADMISSION_STAT_ITEMS = [
    {
      key: 'pending', label: 'Pending Applicants', value: gs.pending,
      icon: UserCheck, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', border: 'border-violet-100',
      href: '/staff/admissions',
      trend:      trend(gs.pending, false) as Trend,
      trendLabel: trendLabel(gs.pending, 'awaiting review', 'awaiting review', 'None pending'),
      sub: 'For admissions review',
    },
    {
      key: 'accepted', label: 'Accepted', value: gs.accepted,
      icon: UserCheck, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100',
      href: '/staff/admissions',
      trend:      trend(gs.accepted, true) as Trend,
      trendLabel: trendLabel(gs.accepted, 'accepted', 'accepted', 'None accepted yet'),
      sub: 'Ready for registrar',
    },
    {
      key: 'enrolled', label: 'Enrolled Students', value: gs.enrolled,
      icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100',
      href: '/staff/registrar',
      trend:      trend(gs.enrolled, true) as Trend,
      trendLabel: trendLabel(gs.enrolled, 'enrolled', 'enrolled', 'None enrolled yet'),
      sub: sem?.name ?? 'Current semester',
    },
  ]

  const GENERAL_STAT_ITEMS = [
    ...ADMISSION_STAT_ITEMS,
    {
      key: 'payments', label: 'Pending Payments', value: gs.pendingPayments,
      icon: Banknote, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100',
      href: '/staff/treasury',
      trend:      (gs.pendingPayments === 0 ? 'up' : 'down') as Trend,
      trendLabel: gs.pendingPayments === 0 ? 'All accounts clear' : trendLabel(gs.pendingPayments, 'account unpaid', 'accounts unpaid', ''),
      sub: 'Awaiting payment',
    },
    {
      key: 'faculty', label: 'Active Faculty', value: gs.activeFaculty,
      icon: GraduationCap, iconBg: 'bg-orange-50', iconColor: 'text-orange-600', border: 'border-orange-100',
      href: '/staff/dean',
      trend:      trend(gs.activeFaculty, true) as Trend,
      trendLabel: trendLabel(gs.activeFaculty, 'active', 'active', 'No faculty yet'),
      sub: 'All departments',
    },
  ]

  const REGISTRAR_STAT_ITEMS = [
    {
      key: 'total', label: 'Total Students', value: rs.totalStudents,
      icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100',
      href: '/staff/registrar',
      trend:      trend(rs.totalStudents, true) as Trend,
      trendLabel: trendLabel(rs.totalStudents, 'student', 'students', 'No students yet'),
      sub: 'All departments',
    },
    {
      key: 'enrolled', label: 'Enrolled This Term', value: rs.totalEnrolled,
      icon: BookOpen, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100',
      href: '/staff/registrar?enroll=ENROLLED',
      trend:      trend(rs.totalEnrolled, true) as Trend,
      trendLabel: trendLabel(rs.totalEnrolled, 'enrolled', 'enrolled', 'None enrolled yet'),
      sub: sem?.name ?? 'Current semester',
    },
    {
      key: 'notEnroll', label: 'Not Yet Enrolled', value: rs.notEnrolled,
      icon: UserX, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100',
      href: '/staff/registrar?enroll=NOT_ENROLLED',
      trend:      (rs.notEnrolled === 0 ? 'up' : 'neutral') as Trend,
      trendLabel: rs.notEnrolled === 0 ? 'All students enrolled' : trendLabel(rs.notEnrolled, 'needs enrollment', 'need enrollment', ''),
      sub: 'Active students only',
    },
    {
      key: 'new', label: 'Newly Added', value: rs.newlyAdded,
      icon: UserPlus, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', border: 'border-violet-100',
      href: '/staff/registrar?enroll=NEW',
      trend:      trend(rs.newlyAdded, true) as Trend,
      trendLabel: trendLabel(rs.newlyAdded, 'this term', 'this term', 'None added yet'),
      sub: 'Since term started',
    },
  ]

  const statItems = isRegistrar ? REGISTRAR_STAT_ITEMS : isAdmission ? ADMISSION_STAT_ITEMS : GENERAL_STAT_ITEMS

  const activityLogs = isRegistrar
    ? MOCK_AUDIT_LOGS.filter(
        (l) => REGISTRAR_RELEVANT_ENTITIES.includes(l.entity) && REGISTRAR_RELEVANT_ACTIONS.includes(l.action),
      )
    : MOCK_AUDIT_LOGS

  const recentApplicants = MOCK_APPLICANTS.slice(0, 4)

  // ── Academic Admin monitoring stats ──────────────────────────────────────
  const publishedOfferings = MOCK_OFFERINGS.filter((o) => o.status === 'PUBLISHED' && o.semesterId === MOCK_SEMESTERS.find((s) => s.isActive)?.id)
  const offeringsWithTeacher = publishedOfferings.filter((o) => (o.assignments ?? []).length > 0)
  const teacherAssignPct = publishedOfferings.length ? Math.round((offeringsWithTeacher.length / publishedOfferings.length) * 100) : 0

  const offeringsWithSchedule = publishedOfferings.filter((o) => (o.schedules ?? []).length > 0)
  const schedulePct = publishedOfferings.length ? Math.round((offeringsWithSchedule.length / publishedOfferings.length) * 100) : 0

  if (isAcademicAdmin && role === 'ACADEMIC_ADMIN') {
    return (
      <div className="space-y-6 max-w-7xl">
        <SectionTitle description="Academic setup monitoring for the current semester">
          Academic Dashboard
        </SectionTitle>

        {/* Monitoring KPIs */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Monitoring Overview</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Rooms */}
            <Link href="/staff/academic/rooms">
              <div className="animate-slide-up rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer" style={{ animationDelay: '70ms' }}>
                <p className="text-xs font-medium text-slate-500 mb-1">Rooms with Time Slots</p>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">0<span className="text-lg text-slate-400">/{MOCK_ROOMS.length}</span></p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-orange-400" style={{ width: '0%' }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Set available times per room so teachers can schedule</p>
              </div>
            </Link>

            {/* Teacher assignment by Dean */}
            <Link href="/staff/academic/offerings">
              <div className="animate-slide-up rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer" style={{ animationDelay: '140ms' }}>
                <p className="text-xs font-medium text-slate-500 mb-1">Teacher Assignment</p>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{offeringsWithTeacher.length}<span className="text-lg text-slate-400">/{publishedOfferings.length}</span></p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${teacherAssignPct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">{teacherAssignPct}% of published offerings have a teacher (assigned by Dean)</p>
              </div>
            </Link>

            {/* Teacher schedules */}
            <Link href="/staff/academic/offerings">
              <div className="animate-slide-up rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer" style={{ animationDelay: '210ms' }}>
                <p className="text-xs font-medium text-slate-500 mb-1">Offerings with Schedule</p>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{offeringsWithSchedule.length}<span className="text-lg text-slate-400">/{publishedOfferings.length}</span></p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${schedulePct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">{schedulePct}% of published offerings have a schedule set</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Published offerings breakdown */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Published Offerings — Current Semester</h3>
            <Link href="/staff/academic/offerings" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              Manage all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {publishedOfferings.length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-slate-400">No published offerings this semester.</p>
            )}
            {publishedOfferings.map((o) => {
              const hasTeacher  = (o.assignments ?? []).length > 0
              const hasSchedule = (o.schedules ?? []).length > 0
              return (
                <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{o.subject?.name}</p>
                    <p className="text-xs text-slate-400">{o.subject?.code} · Section {o.section}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${hasTeacher ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {hasTeacher ? 'Teacher assigned' : 'No teacher'}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${hasSchedule ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {hasSchedule ? 'Scheduled' : 'No schedule'}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <SectionTitle
        description={
          isRegistrar
            ? 'School-wide student records — all departments, current term'
            : 'System-wide overview — current term statistics'
        }
        actions={isSuperAdmin ? (
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50 transition-all"
          >
            {synced
              ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Synced</>
              : syncing
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Syncing…</>
                : <><RefreshCw className="h-3.5 w-3.5" /> Sync All Records</>
            }
          </button>
        ) : undefined}
      >
        {isRegistrar ? 'Registrar Dashboard' : 'Dashboard'}
      </SectionTitle>

      {/* ── Statistics Monitoring Panel ───────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          {isRegistrar ? 'Global Statistics — All Departments' : 'Statistics Overview'}
        </p>
        <StatGrid items={statItems} />
      </div>

      {/* ── Admissions quick actions ──────────────────────────────────────── */}
      {isAdmission && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Add Applicant',     href: '/staff/admissions', icon: UserPlus,   color: 'bg-brand-500' },
              { label: 'Review Applicants', href: '/staff/admissions', icon: UserCheck,  color: 'bg-violet-600' },
              { label: 'Admissions CRM',    href: '/staff/admissions/crm', icon: LayoutGrid, color: 'bg-indigo-600' },
            ].map((a, i) => (
              <Link key={a.href + a.label} href={a.href}>
                <div
                  className="animate-slide-up group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                  style={{ animationDelay: `${(i + statItems.length) * 70}ms` }}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.color} shadow-sm shrink-0`}>
                    <a.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{a.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      {visibleActions.length > 0 && (
        <div className={`grid gap-3 ${visibleActions.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {visibleActions.map((a, i) => (
            <Link key={a.href} href={a.href}>
              <div
                className="animate-slide-up group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                style={{ animationDelay: `${(i + statItems.length) * 70}ms` }}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.color} shadow-sm shrink-0`}>
                  <a.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                  {a.label}
                </span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Bottom: recent applicants + activity ──────────────────────────── */}
      <div className={`grid grid-cols-1 gap-4 ${isAdmission ? '' : 'lg:grid-cols-3'}`}>

        {/* Recent applicants — shown to admissions and super admin */}
        {(isAdmission || role === 'SUPER_ADMIN') && (
          <div className={`animate-slide-up ${isAdmission ? '' : 'lg:col-span-2'}`} style={{ animationDelay: '320ms' }}>
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Recent Applicants</h3>
              <Link href="/staff/admissions" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentApplicants.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-slate-400">No applicants yet.</p>
              ) : recentApplicants.map((app) => (
                <Link key={app.id} href={`/staff/admissions/${app.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <Avatar name={fullName(app)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{fullName(app)}</p>
                    <p className="text-xs text-slate-500">{app.program?.code} · {app.applicantType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <ApplicantBadge status={app.status} />
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(app.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
          </div>
        )}

      </div>
    </div>
  )
}

