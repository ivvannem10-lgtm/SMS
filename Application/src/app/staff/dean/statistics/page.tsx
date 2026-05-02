'use client'

import { useSession } from 'next-auth/react'
import { TrendingUp, TrendingDown, Minus, Users, BookOpen, GraduationCap, UserX } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_SEMESTERS, MOCK_ACADEMIC_YEARS } from '@/lib/mock-data'
import { fullName } from '@/lib/utils'

const YEAR_LABELS: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' }

// ── Simulated historical trend data ──────────────────────────────────────────
// Each entry = one semester's snapshot for this department
type TrendPoint = {
  label: string        // e.g. "2nd Sem 2023-2024"
  type: 'past' | 'current'
  total: number
  enrolled: number
  active: number
  graduated: number
  dropped: number
  byYear: Record<number, number>
}

function buildTrend(deptStudents: ReturnType<typeof MOCK_STUDENTS.filter>, deptEnrolledIds: Set<string>): TrendPoint[] {
  // Current semester — real data
  const current: TrendPoint = {
    label:     MOCK_SEMESTERS.find((s) => s.isActive)?.name ?? '1st Sem 2024-2025',
    type:      'current',
    total:     deptStudents.length,
    enrolled:  deptStudents.filter((s) => deptEnrolledIds.has(s.id)).length,
    active:    deptStudents.filter((s) => s.status === 'ACTIVE').length,
    graduated: deptStudents.filter((s) => s.status === 'GRADUATED').length,
    dropped:   deptStudents.filter((s) => s.status === 'DROPPED').length,
    byYear: [1,2,3,4].reduce((a, y) => ({ ...a, [y]: deptStudents.filter((s) => s.yearLevel === y).length }), {}),
  }

  // Simulated past semesters (declining slightly backward)
  const past: TrendPoint[] = [
    {
      label: '2nd Sem 2023-2024', type: 'past',
      total: Math.max(current.total - 8, 0),
      enrolled: Math.max(current.enrolled - 5, 0),
      active: Math.max(current.active - 6, 0),
      graduated: Math.max(current.graduated - 2, 0),
      dropped: Math.max(current.dropped - 1, 0),
      byYear: { 1: Math.max((current.byYear[1] ?? 0) - 3, 0), 2: Math.max((current.byYear[2] ?? 0) - 2, 0), 3: Math.max((current.byYear[3] ?? 0) - 2, 0), 4: Math.max((current.byYear[4] ?? 0) - 1, 0) },
    },
    {
      label: '1st Sem 2023-2024', type: 'past',
      total: Math.max(current.total - 18, 0),
      enrolled: Math.max(current.enrolled - 12, 0),
      active: Math.max(current.active - 14, 0),
      graduated: Math.max(current.graduated - 4, 0),
      dropped: Math.max(current.dropped - 2, 0),
      byYear: { 1: Math.max((current.byYear[1] ?? 0) - 7, 0), 2: Math.max((current.byYear[2] ?? 0) - 5, 0), 3: Math.max((current.byYear[3] ?? 0) - 4, 0), 4: Math.max((current.byYear[4] ?? 0) - 2, 0) },
    },
    {
      label: '2nd Sem 2022-2023', type: 'past',
      total: Math.max(current.total - 29, 0),
      enrolled: Math.max(current.enrolled - 20, 0),
      active: Math.max(current.active - 22, 0),
      graduated: Math.max(current.graduated - 7, 0),
      dropped: Math.max(current.dropped - 3, 0),
      byYear: { 1: Math.max((current.byYear[1] ?? 0) - 12, 0), 2: Math.max((current.byYear[2] ?? 0) - 8, 0), 3: Math.max((current.byYear[3] ?? 0) - 6, 0), 4: Math.max((current.byYear[4] ?? 0) - 3, 0) },
    },
  ]

  return [...past, current]
}

function delta(current: number, prev: number) {
  const diff = current - prev
  return { diff, pct: prev > 0 ? Math.round((diff / prev) * 100) : 0 }
}

function TrendChip({ diff, pct }: { diff: number; pct: number }) {
  if (diff > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
      <TrendingUp className="h-3.5 w-3.5" /> +{diff} ({pct}%)
    </span>
  )
  if (diff < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500">
      <TrendingDown className="h-3.5 w-3.5" /> {diff} ({Math.abs(pct)}%)
    </span>
  )
  return <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400"><Minus className="h-3 w-3" /> No change</span>
}

// Simple inline bar chart
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-600 w-6 text-right">{value}</span>
    </div>
  )
}

export default function DeanStatisticsPage() {
  const { data: session } = useSession()
  const user = session?.user as { deanDepartment?: string } | undefined
  const deanDepartment = user?.deanDepartment ?? 'College of Computing'

  const activeSemester = MOCK_SEMESTERS.find((s) => s.isActive)
  const deptStudents   = MOCK_STUDENTS.filter((s) => s.program?.department === deanDepartment)
  const deptEnrolledIds = new Set(
    MOCK_ENROLLMENTS
      .filter((e) => e.status === 'ENROLLED' && e.semesterId === activeSemester?.id)
      .filter((e) => MOCK_STUDENTS.find((s) => s.id === e.studentId)?.program?.department === deanDepartment)
      .map((e) => e.studentId),
  )

  const trend    = buildTrend(deptStudents, deptEnrolledIds)
  const current  = trend[trend.length - 1]
  const previous = trend[trend.length - 2]

  const totalDelta    = delta(current.total,     previous.total)
  const enrolledDelta = delta(current.enrolled,  previous.enrolled)
  const activeDelta   = delta(current.active,    previous.active)
  const droppedDelta  = delta(current.dropped,   previous.dropped)

  const maxTotal = Math.max(...trend.map((t) => t.total), 1)

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionTitle description={`${deanDepartment} · enrollment trends across semesters`}>
        Statistics
      </SectionTitle>

      {/* ── KPI comparison — current vs previous semester ─────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          vs. Previous Semester ({previous.label})
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Students',  icon: Users,          color: 'bg-indigo-50 text-indigo-600',  value: current.total,     d: totalDelta },
            { label: 'Enrolled',        icon: BookOpen,       color: 'bg-emerald-50 text-emerald-600', value: current.enrolled,  d: enrolledDelta },
            { label: 'Active',          icon: GraduationCap,  color: 'bg-blue-50 text-blue-600',      value: current.active,    d: activeDelta },
            { label: 'Dropped',         icon: UserX,          color: 'bg-red-50 text-red-500',        value: current.dropped,   d: droppedDelta },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{s.value}</p>
              <p className="text-xs font-medium text-slate-700 mt-1">{s.label}</p>
              <div className="mt-1.5">
                <TrendChip diff={s.d.diff} pct={s.d.pct} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Historical trend table ─────────────────────────────────────────── */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Enrollment Trend by Semester</h3>

        {/* Bar chart — total students */}
        <div className="space-y-3 mb-6">
          {trend.map((t, i) => (
            <div key={i} className="grid grid-cols-[140px_1fr] gap-3 items-center">
              <div>
                <p className="text-xs font-medium text-slate-700 truncate">{t.label}</p>
                {t.type === 'current' && (
                  <span className="text-[10px] font-semibold text-emerald-600">Current</span>
                )}
              </div>
              <Bar value={t.total} max={maxTotal} color={t.type === 'current' ? 'bg-indigo-500' : 'bg-slate-300'} />
            </div>
          ))}
        </div>

        {/* Detailed table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-2 text-left text-xs font-semibold text-slate-500">Semester</th>
                <th className="pb-2 text-center text-xs font-semibold text-slate-500">Total</th>
                <th className="pb-2 text-center text-xs font-semibold text-slate-500">Enrolled</th>
                <th className="pb-2 text-center text-xs font-semibold text-slate-500">Active</th>
                <th className="pb-2 text-center text-xs font-semibold text-slate-500">Graduated</th>
                <th className="pb-2 text-center text-xs font-semibold text-slate-500">Dropped</th>
                <th className="pb-2 text-center text-xs font-semibold text-slate-500">vs Prev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trend.map((t, i) => {
                const prev = i > 0 ? trend[i - 1] : null
                const d    = prev ? delta(t.total, prev.total) : null
                return (
                  <tr key={i} className={t.type === 'current' ? 'bg-indigo-50/50' : ''}>
                    <td className="py-2.5 pr-4">
                      <p className="text-xs font-medium text-slate-800">{t.label}</p>
                      {t.type === 'current' && <span className="text-[10px] font-semibold text-emerald-600">Current</span>}
                    </td>
                    <td className="py-2.5 text-center text-sm font-bold text-slate-900 tabular-nums">{t.total}</td>
                    <td className="py-2.5 text-center text-xs tabular-nums text-emerald-700 font-medium">{t.enrolled}</td>
                    <td className="py-2.5 text-center text-xs tabular-nums text-blue-700">{t.active}</td>
                    <td className="py-2.5 text-center text-xs tabular-nums text-cyan-700">{t.graduated}</td>
                    <td className="py-2.5 text-center text-xs tabular-nums text-red-600">{t.dropped}</td>
                    <td className="py-2.5 text-center">
                      {d ? <TrendChip diff={d.diff} pct={d.pct} /> : <span className="text-xs text-slate-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Year-level breakdown trend ─────────────────────────────────────── */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Students per Year Level — Trend</h3>
        <div className="space-y-5">
          {[1, 2, 3, 4].map((y) => {
            const maxY = Math.max(...trend.map((t) => t.byYear[y] ?? 0), 1)
            return (
              <div key={y}>
                <p className="text-xs font-semibold text-slate-600 mb-2">{YEAR_LABELS[y]}</p>
                <div className="space-y-2">
                  {trend.map((t, i) => (
                    <div key={i} className="grid grid-cols-[120px_1fr] gap-2 items-center">
                      <p className="text-xs text-slate-500 truncate">{t.label.replace(/(\d{4})-(\d{4})/, '$1-$2').split(' ').slice(0, 2).join(' ')}</p>
                      <Bar
                        value={t.byYear[y] ?? 0}
                        max={maxY}
                        color={t.type === 'current' ? 'bg-indigo-500' : 'bg-slate-300'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Current semester enrollment rate ──────────────────────────────── */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Enrollment Rate — Current Semester</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((y) => {
            const total    = deptStudents.filter((s) => s.yearLevel === y).length
            const enrolled = deptStudents.filter((s) => s.yearLevel === y && deptEnrolledIds.has(s.id)).length
            const pct      = total > 0 ? Math.round((enrolled / total) * 100) : 0
            return (
              <div key={y} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-1">{YEAR_LABELS[y]}</p>
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{pct}%</p>
                <p className="text-xs text-slate-400 mt-1">{enrolled}/{total} enrolled</p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
