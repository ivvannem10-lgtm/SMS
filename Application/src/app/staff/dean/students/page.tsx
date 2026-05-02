'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Search, X, ExternalLink } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, EnrollmentBadge } from '@/components/ui/Badge'
import { MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_SEMESTERS } from '@/lib/mock-data'
import { fullName, FACULTY_DEPT_TO_COLLEGE, formatDate, yearLevelLabel } from '@/lib/utils'
import type { Student, StudentStatus } from '@/types'
import Link from 'next/link'

const YEAR_LABELS: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' }

// ── Student quick-view drawer (read-only for Dean) ────────────────────────────

function StudentDrawer({ student, activeSemId, onClose }: {
  student: Student; activeSemId?: string; onClose: () => void
}) {
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === student.id && e.semesterId === activeSemId)
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700', INACTIVE: 'bg-slate-100 text-slate-500',
    DROPPED: 'bg-red-50 text-red-700', GRADUATED: 'bg-cyan-50 text-cyan-700',
  }
  function Row({ label, value }: { label: string; value?: string | null }) {
    return (
      <tr>
        <td className="py-2 pl-3 pr-2 w-32 text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#f8fafd]">{label}</td>
        <td className="py-2 pl-2 pr-3 text-xs text-slate-800">{value || '—'}</td>
      </tr>
    )
  }
  return (
    <>
      <div className="fixed inset-0 z-[25] bg-[#0c1e3d]/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[36] flex w-full max-w-[440px] flex-col bg-white border-l border-[#e4ebf5] shadow-2xl">
        <div className="shrink-0 bg-[#0c1e3d] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={fullName(student)} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{fullName(student)}</p>
                <p className="text-xs text-blue-300 mt-0.5">{student.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="text-[10px] bg-white/10 text-blue-200 px-2 py-0.5 rounded font-mono">{student.studentId}</code>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[student.status] ?? 'bg-slate-100'}`}>{student.status}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-4 w-4 text-white/60" /></button>
          </div>
        </div>
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
        </div>
        <div className="shrink-0 border-t border-[#e4ebf5] bg-white px-4 py-3">
          <p className="text-center text-[10px] text-slate-400">Dean view — read only</p>
        </div>
      </div>
    </>
  )
}

export default function DeanStudentsPage() {
  return <Suspense><DeanStudentsInner /></Suspense>
}

function DeanStudentsInner() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const user = session?.user as { deanDepartment?: string } | undefined
  const deanDepartment = user?.deanDepartment ?? 'College of Computing'

  const activeSemester = MOCK_SEMESTERS.find((s) => s.isActive)

  const enrolledIds = new Set(
    MOCK_ENROLLMENTS
      .filter((e) => e.status === 'ENROLLED' && e.semesterId === activeSemester?.id)
      .map((e) => e.studentId),
  )

  const deptStudents = MOCK_STUDENTS.filter((s) => s.program?.department === deanDepartment)

  const [query,       setQuery]       = useState('')
  const [yearFilter,  setYearFilter]  = useState<string>('ALL')
  const [statusFilter,setStatusFilter]= useState<StudentStatus | 'ALL'>('ALL')
  const [enrollFilter,setEnrollFilter]= useState<'ALL' | 'ENROLLED' | 'NOT_ENROLLED'>('ALL')
  const [viewStudent, setViewStudent] = useState<Student | null>(null)

  // Pre-select year from URL param (e.g. ?year=1)
  useEffect(() => {
    const y = searchParams.get('year')
    if (y) setYearFilter(y)
  }, [searchParams])

  const filtered = deptStudents.filter((s) => {
    if (yearFilter  !== 'ALL' && String(s.yearLevel) !== yearFilter)  return false
    if (statusFilter !== 'ALL' && s.status !== statusFilter)          return false
    if (enrollFilter === 'ENROLLED'     && !enrolledIds.has(s.id))    return false
    if (enrollFilter === 'NOT_ENROLLED' &&  enrolledIds.has(s.id))    return false
    const q = query.toLowerCase()
    return !q || fullName(s).toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || (s.program?.code?.toLowerCase().includes(q) ?? false)
  })

  return (
    <div className="space-y-5 max-w-6xl">
      <SectionTitle description={`${deanDepartment} · Read-only`}>
        Student List
      </SectionTitle>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, ID, program…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="w-64"
        />

        {/* Year level pills */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(['ALL', '1', '2', '3', '4'] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYearFilter(y)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${yearFilter === y ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {y === 'ALL' ? 'All Years' : `${y}${y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th'} Year`}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StudentStatus | 'ALL')} className="w-36 text-sm">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DROPPED">Dropped</option>
          <option value="GRADUATED">Graduated</option>
        </Select>

        {/* Enrollment filter */}
        <Select value={enrollFilter} onChange={(e) => setEnrollFilter(e.target.value as typeof enrollFilter)} className="w-40 text-sm">
          <option value="ALL">All Enrollment</option>
          <option value="ENROLLED">Enrolled only</option>
          <option value="NOT_ENROLLED">Not enrolled</option>
        </Select>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
        <span className="font-semibold text-slate-700">{deptStudents.length}</span> students
      </p>

      {/* Table */}
      <Card padding="none">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No students match the selected filters.</p>
        ) : (
          <Table>
            <Thead>
              <Th>Student</Th>
              <Th>Student ID</Th>
              <Th>Program</Th>
              <Th>Year Level</Th>
              <Th>Enrollment</Th>
              <Th>Status</Th>
            </Thead>
            <Tbody>
              {filtered.map((student) => {
                const enr = MOCK_ENROLLMENTS.find(
                  (e) => e.studentId === student.id && e.semesterId === activeSemester?.id,
                )
                return (
                  <Tr key={student.id} onClick={() => setViewStudent(student)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullName(student)} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900">{fullName(student)}</p>
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
                      <p className="text-xs text-slate-400 max-w-[160px] truncate">{student.program?.name}</p>
                    </Td>
                    <Td className="text-sm">{yearLevelLabel(student.yearLevel)}</Td>
                    <Td>
                      {enr
                        ? <EnrollmentBadge status={enr.status} />
                        : <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/20">Not enrolled</span>
                      }
                    </Td>
                    <Td>
                      <Badge className={
                        student.status === 'ACTIVE'    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                        student.status === 'GRADUATED' ? 'bg-cyan-50 text-cyan-700 ring-cyan-600/20' :
                        student.status === 'DROPPED'   ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                         'bg-slate-100 text-slate-500 ring-slate-400/20'
                      }>
                        {student.status}
                      </Badge>
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
          activeSemId={activeSemester?.id}
          onClose={() => setViewStudent(null)}
        />
      )}
    </div>
  )
}
