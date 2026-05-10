'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, X, ExternalLink, ChevronRight, AlertCircle, CheckCircle2, Clock, CreditCard } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, EnrollmentBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_SEMESTERS, MOCK_SOA } from '@/lib/mock-data'
import { fullName, yearLevelLabel, formatDate } from '@/lib/utils'
import type { Student, StudentStatus, SOA } from '@/types'

function php(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Balance breakdown modal ───────────────────────────────────────────────────
function BalanceModal({ soa, onClose }: { soa: SOA; onClose: () => void }) {
  const METHOD_LABEL: Record<string, string> = {
    CASH: 'Cash', ONLINE: 'Online', GCASH: 'GCash', BANK: 'Bank Transfer',
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[440px] mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#0c1e3d] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-300" />
            <p className="text-sm font-bold text-white">Balance Breakdown</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Summary bar */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            {[
              { label: 'Total',     value: php(soa.totalAmount),  cls: 'text-slate-800' },
              { label: 'Paid',      value: php(soa.paidAmount),   cls: 'text-emerald-600' },
              { label: 'Balance',   value: php(soa.balance),      cls: soa.balance > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center py-4 px-2">
                <p className={`text-base font-bold tabular-nums ${s.cls}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Fee breakdown */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fee Breakdown</p>
              <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-[#f0f4fa]">
                    {(soa.items ?? []).filter(i => !i.voided).map(item => (
                      <tr key={item.id}>
                        <td className="py-2.5 pl-4 pr-2 text-xs text-slate-700">{item.description}</td>
                        <td className="py-2.5 pl-2 pr-4 text-right text-xs font-semibold text-slate-800 font-mono">
                          {php(item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="py-2.5 pl-4 pr-2 text-xs font-bold text-slate-600">Total</td>
                      <td className="py-2.5 pl-2 pr-4 text-right text-xs font-bold text-slate-800 font-mono">
                        {php(soa.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment history */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment History</p>
              {(soa.payments ?? []).length === 0 ? (
                <div className="rounded-xl border border-[#e4ebf5] bg-white px-4 py-3">
                  <span className="text-xs text-slate-400 italic">No payments recorded</span>
                </div>
              ) : (
                <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-[#f0f4fa]">
                      {(soa.payments ?? []).map(p => (
                        <tr key={p.id}>
                          <td className="py-2.5 pl-4 pr-2">
                            <p className="text-xs font-semibold text-slate-700">{METHOD_LABEL[p.method] ?? p.method}</p>
                            {p.receiptNumber && (
                              <p className="text-[10px] text-slate-400 font-mono">{p.receiptNumber}</p>
                            )}
                          </td>
                          <td className="py-2.5 pl-2 pr-4 text-right">
                            <p className="text-xs font-bold text-emerald-600 font-mono">{php(p.amount)}</p>
                            <p className="text-[10px] text-slate-400">
                              {p.validatedAt
                                ? new Date(p.validatedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Remaining balance callout */}
            {soa.balance > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-700">Outstanding Balance</p>
                  <p className="text-sm font-extrabold text-red-600 tabular-nums">{php(soa.balance)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <button onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Student quick-view drawer ─────────────────────────────────────────────────

function StudentDrawer({ student, enrolledIds, activeSemId, onClose }: {
  student: Student
  enrolledIds: Set<string>
  activeSemId?: string
  onClose: () => void
}) {
  const isEnrolled = enrolledIds.has(student.id)
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === student.id && e.semesterId === activeSemId)
  const soa         = MOCK_SOA.find(s => s.studentId === student.id && s.semesterId === activeSemId)
  const hasBalance  = soa && soa.balance > 0

  const [balanceOpen, setBalanceOpen] = useState(false)

  function Row({ label, value }: { label: string; value?: string | null }) {
    return (
      <tr>
        <td className="py-2 pl-3 pr-2 w-32 text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#f8fafd] whitespace-nowrap">{label}</td>
        <td className="py-2 pl-2 pr-3 text-xs text-slate-800">{value || '—'}</td>
      </tr>
    )
  }

  const statusColors: Record<string, string> = {
    ACTIVE:    'bg-emerald-50 text-emerald-700',
    INACTIVE:  'bg-slate-100 text-slate-500',
    DROPPED:   'bg-red-50 text-red-700',
    GRADUATED: 'bg-cyan-50 text-cyan-700',
  }

  return (
    <>
      <div className="fixed inset-0 z-[25] bg-[#0c1e3d]/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[36] flex w-full max-w-[460px] flex-col bg-white border-l border-[#e4ebf5] shadow-2xl">

        {/* Header */}
        <div className="shrink-0 bg-[#0c1e3d] flex items-stretch">
          {/* Square profile photo */}
          <div className="flex h-[130px] w-[110px] shrink-0 items-center justify-center bg-brand-700/60 text-4xl font-extrabold text-white tracking-tight select-none">
            {fullName(student).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex flex-1 min-w-0 flex-col justify-center gap-1.5 px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-white leading-snug">{fullName(student)}</p>
              <button onClick={onClose} className="shrink-0 rounded-lg p-1 hover:bg-white/10 transition-colors mt-0.5">
                <X className="h-4 w-4 text-white/50" />
              </button>
            </div>
            <p className="text-xs text-blue-300">{student.email}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <code className="text-[10px] bg-white/10 text-blue-200 px-2 py-0.5 rounded font-mono">{student.studentId}</code>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[student.status] ?? 'bg-slate-100 text-slate-500'}`}>
                {student.status}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafd]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Information</p>
          <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
            <table className="w-full"><tbody className="divide-y divide-[#f0f4fa]">
              <Row label="Full Name"    value={fullName(student)} />
              <Row label="Date of Birth" value={formatDate(student.dateOfBirth)} />
              <Row label="Gender"       value={student.gender} />
              <Row label="Phone"        value={student.phone} />
              <Row label="Address"      value={student.address} />
            </tbody></table>
          </div>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic</p>
          <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
            <table className="w-full"><tbody className="divide-y divide-[#f0f4fa]">
              <Row label="Program"    value={student.program?.name ?? student.program?.code} />
              <Row label="Year Level" value={yearLevelLabel(student.yearLevel)} />
              <Row label="Status"     value={student.status} />
            </tbody></table>
          </div>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Enrollment</p>
          {enrollments.length === 0 ? (
            <div className="rounded-xl border border-[#e4ebf5] bg-white px-4 py-3">
              <span className="text-xs text-amber-600 font-semibold">Not enrolled this semester</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-[#e4ebf5] bg-white px-3 py-2">
                  <p className="text-xs text-slate-700 truncate">{e.offering?.subject?.name ?? e.offeringId}</p>
                  <EnrollmentBadge status={e.status} />
                </div>
              ))}
            </div>
          )}

          {/* ── Pending Balance ─────────────────────────────────────── */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Balance</p>
          {!soa ? (
            <div className="rounded-xl border border-[#e4ebf5] bg-white px-4 py-3">
              <span className="text-xs text-slate-400 italic">No statement of account this semester</span>
            </div>
          ) : soa.balance === 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700">Fully Paid</p>
                <p className="text-[11px] text-emerald-600">Total paid: {php(soa.paidAmount)}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setBalanceOpen(true)}
              className="w-full flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-3 transition-colors text-left group"
            >
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-red-700">
                    {soa.status === 'PARTIAL' ? 'Partial Payment' : 'Unpaid Balance'}
                  </p>
                  {soa.status === 'PARTIAL' && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">Partial</span>
                  )}
                </div>
                <p className="text-base font-extrabold text-red-600 tabular-nums leading-tight">{php(soa.balance)}</p>
                <p className="text-[10px] text-red-400 mt-0.5">of {php(soa.totalAmount)} total · {php(soa.paidAmount)} paid</p>
              </div>
              <ChevronRight className="h-4 w-4 text-red-400 group-hover:text-red-600 shrink-0 transition-colors" />
            </button>
          )}
        </div>
        {/* Footer */}
        <div className="shrink-0 border-t border-[#e4ebf5] bg-white px-4 py-3">
          <Link href={`/staff/registrar/${student.id}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Open Full Record &amp; Edit
          </Link>
        </div>
      </div>

      {balanceOpen && soa && (
        <BalanceModal soa={soa} onClose={() => setBalanceOpen(false)} />
      )}
    </>
  )
}

// ── Global school-wide stats (no department filter) ───────────────────────────
function useRegistrarStats() {
  const sem = MOCK_SEMESTERS.find((s) => s.isActive)
  const semStart = sem?.startDate ? new Date(sem.startDate) : null

  const enrolledIds = new Set(
    MOCK_ENROLLMENTS
      .filter((e) => e.status === 'ENROLLED' && e.semesterId === sem?.id)
      .map((e) => e.studentId),
  )

  return {
    total:      MOCK_STUDENTS.length,
    enrolled:   MOCK_STUDENTS.filter((s) => enrolledIds.has(s.id)).length,
    notEnrolled:MOCK_STUDENTS.filter((s) => s.status === 'ACTIVE' && !enrolledIds.has(s.id)).length,
    newlyAdded: semStart ? MOCK_STUDENTS.filter((s) => new Date(s.createdAt) >= semStart).length : 0,
    enrolledIds,
    activeSemId: sem?.id,
  }
}

const STATUS_FILTERS: { value: StudentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',       label: 'All' },
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'INACTIVE',  label: 'Inactive' },
  { value: 'GRADUATED', label: 'Graduated' },
  { value: 'DROPPED',   label: 'Dropped' },
]

export default function RegistrarPage() {
  return <Suspense><RegistrarPageInner /></Suspense>
}

function RegistrarPageInner() {
  const stats        = useRegistrarStats()
  const searchParams = useSearchParams()

  const [query,        setQuery]        = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'ALL'>('ALL')
  const [enrollFilter, setEnrollFilter] = useState<'ALL' | 'ENROLLED' | 'NOT_ENROLLED' | 'NEW'>('ALL')
  const [viewStudent,  setViewStudent]  = useState<Student | null>(null)

  // Initialise filters from URL params (e.g. dashboard stat card clicks)
  useEffect(() => {
    const enroll = searchParams.get('enroll')
    if (enroll === 'ENROLLED' || enroll === 'NOT_ENROLLED' || enroll === 'NEW') {
      setEnrollFilter(enroll)
    }
  }, [searchParams])

  const semStart = (() => {
    const sem = MOCK_SEMESTERS.find((s) => s.isActive)
    return sem?.startDate ? new Date(sem.startDate) : null
  })()

  // ── No department filtering — all students visible ────────────────────────
  const filtered = MOCK_STUDENTS.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
    if (enrollFilter === 'ENROLLED'     && !stats.enrolledIds.has(s.id)) return false
    if (enrollFilter === 'NOT_ENROLLED' &&  stats.enrolledIds.has(s.id)) return false
    if (enrollFilter === 'NEW'          && !(semStart && new Date(s.createdAt) >= semStart)) return false

    const q = query.toLowerCase()
    return (
      !q ||
      fullName(s).toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.program?.code?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle>
        Student Records
      </SectionTitle>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, ID, email, program…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="w-72"
        />

        {/* Status filter pills */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                statusFilter === f.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Enrollment filter */}
        <Select
          value={enrollFilter}
          onChange={(e) => setEnrollFilter(e.target.value as typeof enrollFilter)}
          className="w-44 text-sm"
        >
          <option value="ALL">All enrollment</option>
          <option value="ENROLLED">Enrolled only</option>
          <option value="NOT_ENROLLED">Not enrolled</option>
          <option value="NEW">Newly added</option>
        </Select>
      </div>

      {/* ── Student table ─────────────────────────────────────────────────── */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{MOCK_STUDENTS.length}</span> students
            &nbsp;·&nbsp;All departments
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No students match your filters"
            description="Try adjusting the search or filter criteria."
            className="py-16"
          />
        ) : (
          <Table>
            <Thead>
              <Th>Student</Th>
              <Th>Student ID</Th>
              <Th>Program</Th>
              <Th>Year Level</Th>
              <Th>Enrollment</Th>
              <Th>Standing</Th>
              <Th />
            </Thead>
            <Tbody>
              {filtered.map((student) => {
                const currentEnrollment = MOCK_ENROLLMENTS.find(
                  (e) => e.studentId === student.id && e.semesterId === stats.activeSemId,
                )
                const subjectCount = MOCK_ENROLLMENTS.filter((e) => e.studentId === student.id).length
                const initials = fullName(student).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <Tr key={student.id} onClick={() => setViewStudent(student)}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {/* Square photo avatar */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{fullName(student)}</p>
                          <p className="text-xs text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                        {student.studentId}
                      </code>
                    </Td>
                    <Td>
                      <p className="text-sm font-medium">{student.program?.code ?? '—'}</p>
                      <p className="text-xs text-slate-400 max-w-[150px] truncate">{student.program?.name}</p>
                    </Td>
                    <Td className="text-sm">{yearLevelLabel(student.yearLevel)}</Td>
                    <Td>
                      {currentEnrollment ? (
                        <div>
                          <EnrollmentBadge status={currentEnrollment.status} />
                          <p className="text-[10px] text-slate-400 mt-0.5">{subjectCount} subject{subjectCount !== 1 ? 's' : ''}</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Not enrolled
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Badge className={
                        student.status === 'ACTIVE'    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                        student.status === 'INACTIVE'  ? 'bg-slate-100 text-slate-500 ring-slate-400/20' :
                        student.status === 'DROPPED'   ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        student.status === 'GRADUATED' ? 'bg-cyan-50 text-cyan-700 ring-cyan-600/20' :
                        'bg-slate-100 text-slate-500 ring-slate-400/20'
                      }>
                        {student.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Link
                        href={`/staff/registrar/${student.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Manage →
                      </Link>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      {viewStudent && (
        <StudentDrawer
          student={viewStudent}
          enrolledIds={stats.enrolledIds}
          activeSemId={stats.activeSemId}
          onClose={() => setViewStudent(null)}
        />
      )}
    </div>
  )
}
