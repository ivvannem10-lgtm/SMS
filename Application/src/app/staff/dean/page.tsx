'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Users, GraduationCap, BookOpen, Check,
  UserCheck, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Filter,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import {
  MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_FACULTY,
  MOCK_OFFERINGS, MOCK_SEMESTERS,
} from '@/lib/mock-data'
import { fullName, FACULTY_DEPT_TO_COLLEGE } from '@/lib/utils'

// Year-level labels
const YEAR_LABELS: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' }

// Animated number counter
function useCountUp(target: number, duration = 600) {
  const [count, setCount] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const diff  = target - start
    if (diff === 0) return
    const startTime = performance.now()
    const frame = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(frame)
      else prev.current = target
    }
    requestAnimationFrame(frame)
  }, [target, duration])
  return count
}

// Animated stat card
function AnimatedStatCard({
  icon: Icon, label, value, sub, color, onClick,
}: {
  icon: React.ElementType; label: string; value: number; sub: string; color: string; onClick: () => void
}) {
  const [pressed, setPressed] = useState(false)
  const [ripple, setRipple]   = useState<{ x: number; y: number; id: number } | null>(null)
  const count = useCountUp(value)

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() })
    setPressed(true)
    setTimeout(() => setPressed(false), 120)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`text-left w-full rounded-xl border border-slate-200 bg-white p-4 cursor-pointer
        transition-all duration-150 overflow-hidden relative select-none
        hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5
        ${pressed ? 'scale-[0.97] shadow-inner' : 'scale-100'}
      `}
    >
      {/* Ripple */}
      {ripple && (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-indigo-200/60 animate-ping"
          style={{
            left:   ripple.x - 20,
            top:    ripple.y - 20,
            width:  40,
            height: 40,
            animationDuration: '400ms',
            animationIterationCount: 1,
          }}
          onAnimationEnd={() => setRipple(null)}
        />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{count}</p>
      <p className="text-xs font-medium text-slate-700 mt-1">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>
    </button>
  )
}

// ── School year options for the chart filter ──────────────────────────────────
const SCHOOL_YEAR_OPTIONS = [
  { label: '2024–2025', value: '2024-2025', offsets: { total: [29, 18, 8, 0], enrolled: [20, 12, 5, 0] } },
  { label: '2023–2024', value: '2023-2024', offsets: { total: [18, 8, 0, -8], enrolled: [12, 5, 0, -5] } },
  { label: '2022–2023', value: '2022-2023', offsets: { total: [8, 0, -8, -18], enrolled: [5, 0, -5, -12] } },
]
const CHART_SEMS = ['2nd 2022-23', '1st 2023-24', '2nd 2023-24', '1st 2024-25'] as const

export default function DeanPage() {
  const { data: session } = useSession()
  const user = session?.user as { name?: string; deanDepartment?: string } | undefined
  // Default to College of Computing for the generic dean@school.edu account
  const deanDepartment = user?.deanDepartment ?? 'College of Computing'

  const [assignModal,     setAssignModal]     = useState<string | null>(null)
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedRole,    setSelectedRole]    = useState('LECTURE')
  const [saving,          setSaving]          = useState(false)
  const [showYearBreakdown, setShowYearBreakdown] = useState(false)
  const [chartYear,       setChartYear]       = useState('2024-2025')

  // Stat card modals
  const [summaryModal, setSummaryModal] = useState<'all' | 'enrolled' | 'active' | 'faculty' | 'yearLevel' | null>(null)

  // ── Department-scoped data ─────────────────────────────────────────────────

  const deptStudents = MOCK_STUDENTS.filter(
    (s) => s.program?.department === deanDepartment,
  )

  const activeSemester = MOCK_SEMESTERS.find((s) => s.isActive)

  const deptEnrolledIds = new Set(
    MOCK_ENROLLMENTS
      .filter((e) => e.status === 'ENROLLED' && e.semesterId === activeSemester?.id)
      .filter((e) => {
        const student = MOCK_STUDENTS.find((s) => s.id === e.studentId)
        return student?.program?.department === deanDepartment
      })
      .map((e) => e.studentId),
  )

  const deptFaculty = MOCK_FACULTY.filter(
    (f) => FACULTY_DEPT_TO_COLLEGE[f.department ?? ''] === deanDepartment,
  )

  // Published offerings that belong to this department
  const deptPublishedOfferings = MOCK_OFFERINGS.filter(
    (o) => o.status === 'PUBLISHED' && o.subject?.program?.department === deanDepartment,
  )
  const hasPublishedOfferings = deptPublishedOfferings.length > 0

  // Faculty scoped to this dept only (for teacher assignment)
  const deptFacultyOptions = MOCK_FACULTY.filter(
    (f) => f.status === 'ACTIVE' && FACULTY_DEPT_TO_COLLEGE[f.department ?? ''] === deanDepartment,
  )

  // Year-level breakdown
  const yearBreakdown = [1, 2, 3, 4].map((y) => ({
    year: y,
    total: deptStudents.filter((s) => s.yearLevel === y).length,
    enrolled: deptStudents.filter((s) => s.yearLevel === y && deptEnrolledIds.has(s.id)).length,
  }))

  async function handleAssign() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    setAssignModal(null)
    setSelectedFaculty('')
  }

  const selectedOffering = MOCK_OFFERINGS.find((o) => o.id === assignModal)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page header */}
      <SectionTitle
        description={`${deanDepartment} · Read-only access to other modules`}
      >
        Dean Dashboard
      </SectionTitle>

      {/* Department scope banner */}
      <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 shrink-0">
          <UserCheck className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Department Scope Active</p>
          <p className="text-xs text-indigo-600">
            You are viewing data exclusively for <strong>{deanDepartment}</strong>. Other departments are not visible to this account.
          </p>
        </div>
      </div>

      {/* ── Stats row — animated clickable cards ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([
          { key: 'all'      as const, label: 'Total Students',    value: deptStudents.length,                                           sub: deanDepartment,                              icon: Users,          color: 'bg-indigo-50 text-indigo-600' },
          { key: 'enrolled' as const, label: 'Enrolled This Term', value: deptEnrolledIds.size,                                          sub: activeSemester?.name ?? 'Current semester',  icon: BookOpen,       color: 'bg-emerald-50 text-emerald-600' },
          { key: 'active'   as const, label: 'Active Students',    value: deptStudents.filter((s) => s.status === 'ACTIVE').length,      sub: `${deptStudents.filter((s) => s.status !== 'ACTIVE').length} inactive`, icon: UserCheck, color: 'bg-blue-50 text-blue-600' },
          { key: 'faculty'  as const, label: 'Faculty Members',    value: deptFaculty.length,                                            sub: 'In this department',                        icon: GraduationCap,  color: 'bg-violet-50 text-violet-600' },
        ] as const).map((stat) => (
          <AnimatedStatCard
            key={stat.key}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            color={stat.color}
            onClick={() => setSummaryModal(stat.key)}
          />
        ))}
      </div>

      {/* ── Enrollment trend — Recharts bar chart ─────────────────────────── */}
      {(() => {
        const base  = deptStudents.length
        const eBase = deptEnrolledIds.size
        const yearOpt = SCHOOL_YEAR_OPTIONS.find((o) => o.value === chartYear) ?? SCHOOL_YEAR_OPTIONS[0]

        // Build 4-semester chart data based on the selected school year filter
        const chartData = CHART_SEMS.map((sem, i) => {
          const totalOffset   = yearOpt.offsets.total[i]
          const enrollOffset  = yearOpt.offsets.enrolled[i]
          const isCurrent     = yearOpt.value === '2024-2025' && i === 3
          return {
            sem,
            Total:    Math.max(base - totalOffset,  0),
            Enrolled: Math.max(eBase - enrollOffset, 0),
            current:  isCurrent,
          }
        })

        const prev   = chartData[chartData.length - 2]
        const curr   = chartData[chartData.length - 1]
        const diff   = curr.Total - prev.Total
        const pct    = prev.Total > 0 ? Math.round((diff / prev.Total) * 100) : 0
        const rising = diff > 0

        return (
          <Card>
            {/* Header row with filter */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Enrollment Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">{deanDepartment} · 4 semesters</p>
              </div>
              <div className="flex items-center gap-2">
                {/* School year filter */}
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                  <Filter className="h-3 w-3 text-slate-400 shrink-0" />
                  <select
                    value={chartYear}
                    onChange={(e) => setChartYear(e.target.value)}
                    className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
                  >
                    {SCHOOL_YEAR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Trend badge */}
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
                  rising ? 'bg-emerald-50 text-emerald-700' : diff < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {rising ? <TrendingUp className="h-3.5 w-3.5" /> : diff < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  {rising ? `+${diff}` : diff} ({rising ? '+' : ''}{pct}%)
                </span>
              </div>
            </div>

            {/* Recharts grouped bar chart */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="28%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="sem" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Total" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.current ? '#6366f1' : '#cbd5e1'} />
                  ))}
                </Bar>
                <Bar dataKey="Enrolled" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.current ? '#10b981' : '#a7f3d0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Economic progress bars — enrollment rate per year level */}
            <div className="mt-5 border-t border-slate-100 pt-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Enrollment Rate by Year Level</p>
              {[1, 2, 3, 4].map((y) => {
                const total    = deptStudents.filter((s) => s.yearLevel === y).length
                const enrolled = deptStudents.filter((s) => s.yearLevel === y && deptEnrolledIds.has(s.id)).length
                const rate     = total > 0 ? Math.round((enrolled / total) * 100) : 0
                const color    = rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400'
                return (
                  <div key={y}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">{YEAR_LABELS[y]}</span>
                      <span className="text-xs tabular-nums text-slate-500">{enrolled}/{total} · <span className="font-semibold text-slate-700">{rate}%</span></span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-700`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary row */}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">{curr.Total}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Enrolled</p>
                <p className="text-xl font-bold text-emerald-600 tabular-nums">{curr.Enrolled}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Rate</p>
                <p className="text-xl font-bold text-indigo-600 tabular-nums">
                  {curr.Total > 0 ? Math.round((curr.Enrolled / curr.Total) * 100) : 0}%
                </p>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* ── Year-level breakdown (accordion) ─────────────────────────────── */}
      <Card>
        <button
          onClick={() => setShowYearBreakdown((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Students by Year Level</p>
            <p className="text-xs text-slate-500 mt-0.5">{deanDepartment}</p>
          </div>
          {showYearBreakdown ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showYearBreakdown && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {yearBreakdown.map((row) => (
              <Link key={row.year} href={`/staff/dean/students?year=${row.year}`}>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer">
                  <p className="text-xs font-semibold text-slate-500 mb-2">{YEAR_LABELS[row.year]}</p>
                  <p className="text-3xl font-bold text-slate-900">{row.total}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="font-medium text-emerald-600">{row.enrolled}</span> enrolled
                  </p>
                  {row.total > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round((row.enrolled / row.total) * 100)}%` }} />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* ── Assign Teacher Modal ──────────────────────────────────────────── */}
      <Modal
        open={!!assignModal}
        onClose={() => { setAssignModal(null); setSelectedFaculty('') }}
        title="Assign Teacher"
        description={selectedOffering ? `${selectedOffering.subject?.name} · Section ${selectedOffering.section}` : ''}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button
              onClick={handleAssign}
              loading={saving}
              disabled={!selectedFaculty}
              icon={<Check className="h-4 w-4" />}
            >
              Assign Teacher
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-700">
            Only faculty members from <strong>{deanDepartment}</strong> are shown.
          </div>

          <Select
            label="Select Teacher"
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
          >
            <option value="">Choose a faculty member…</option>
            {deptFacultyOptions.length === 0 ? (
              <option disabled>No faculty in this department</option>
            ) : (
              deptFacultyOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {fullName(f)} — {f.position ?? f.department}
                </option>
              ))
            )}
          </Select>

          <Select
            label="Teaching Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="LECTURE">Lecture</option>
            <option value="LAB">Laboratory</option>
            <option value="BOTH">Both (Lecture + Laboratory)</option>
          </Select>

          {selectedFaculty && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-800 mb-1">Schedule Conflict Check</p>
              <p className="text-xs text-emerald-700">✓ No conflicts detected for this faculty member</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Data Summary Modals ───────────────────────────────────────────── */}

      {/* All Students */}
      <Modal open={summaryModal === 'all'} onClose={() => setSummaryModal(null)} title="All Students" description={deanDepartment} size="lg"
        footer={<Button variant="outline" onClick={() => setSummaryModal(null)}>Close</Button>}
      >
        <div className="divide-y divide-slate-50">
          {deptStudents.length === 0
            ? <p className="text-center text-sm text-slate-400 py-6">No students in this department.</p>
            : deptStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{s.firstName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{fullName(s)}</p>
                  <p className="text-xs text-slate-400">{s.studentId} · {s.program?.code} · {YEAR_LABELS[s.yearLevel]}</p>
                </div>
                <Badge className={
                  s.status === 'ACTIVE'    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                  s.status === 'GRADUATED' ? 'bg-cyan-50 text-cyan-700 ring-cyan-600/20' :
                  s.status === 'DROPPED'   ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                             'bg-slate-100 text-slate-500 ring-slate-400/20'
                }>{s.status}</Badge>
              </div>
            ))}
        </div>
      </Modal>

      {/* Enrolled Students */}
      <Modal open={summaryModal === 'enrolled'} onClose={() => setSummaryModal(null)} title="Enrolled This Term" description={activeSemester?.name} size="lg"
        footer={<Button variant="outline" onClick={() => setSummaryModal(null)}>Close</Button>}
      >
        <div className="divide-y divide-slate-50">
          {deptStudents.filter((s) => deptEnrolledIds.has(s.id)).length === 0
            ? <p className="text-center text-sm text-slate-400 py-6">No enrolled students this term.</p>
            : deptStudents.filter((s) => deptEnrolledIds.has(s.id)).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{s.firstName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{fullName(s)}</p>
                  <p className="text-xs text-slate-400">{s.studentId} · {s.program?.code} · {YEAR_LABELS[s.yearLevel]}</p>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Enrolled</span>
              </div>
            ))}
        </div>
      </Modal>

      {/* Active Students */}
      <Modal open={summaryModal === 'active'} onClose={() => setSummaryModal(null)} title="Active Students" description={deanDepartment} size="lg"
        footer={<Button variant="outline" onClick={() => setSummaryModal(null)}>Close</Button>}
      >
        <div className="divide-y divide-slate-50">
          {deptStudents.filter((s) => s.status === 'ACTIVE').length === 0
            ? <p className="text-center text-sm text-slate-400 py-6">No active students.</p>
            : deptStudents.filter((s) => s.status === 'ACTIVE').map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{s.firstName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{fullName(s)}</p>
                  <p className="text-xs text-slate-400">{s.studentId} · {s.program?.code} · {YEAR_LABELS[s.yearLevel]}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deptEnrolledIds.has(s.id) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {deptEnrolledIds.has(s.id) ? 'Enrolled' : 'Not enrolled'}
                </span>
              </div>
            ))}
        </div>
      </Modal>

      {/* Faculty Members */}
      <Modal open={summaryModal === 'faculty'} onClose={() => setSummaryModal(null)} title="Faculty Members" description={deanDepartment} size="lg"
        footer={<Button variant="outline" onClick={() => setSummaryModal(null)}>Close</Button>}
      >
        <div className="divide-y divide-slate-50">
          {deptFaculty.length === 0
            ? <p className="text-center text-sm text-slate-400 py-6">No faculty in this department.</p>
            : deptFaculty.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{f.firstName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{fullName(f)}</p>
                  <p className="text-xs text-slate-400">{f.facultyId} · {f.position ?? '—'} · {f.department}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${f.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {f.status}
                </span>
              </div>
            ))}
        </div>
      </Modal>

      {/* Students by Year Level */}
      <Modal open={summaryModal === 'yearLevel'} onClose={() => setSummaryModal(null)} title="Students by Year Level" description={deanDepartment}
        footer={<Button variant="outline" onClick={() => setSummaryModal(null)}>Close</Button>}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {yearBreakdown.map((row) => (
            <div key={row.year} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 mb-2">{YEAR_LABELS[row.year]}</p>
              <p className="text-3xl font-bold text-slate-900">{row.total}</p>
              <p className="text-xs text-slate-400 mt-1"><span className="font-medium text-emerald-600">{row.enrolled}</span> enrolled</p>
              {row.total > 0 && (
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round((row.enrolled / row.total) * 100)}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
