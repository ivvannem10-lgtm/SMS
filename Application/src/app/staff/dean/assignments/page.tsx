'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Check, Lock, AlertCircle, Search } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select, Input } from '@/components/ui/Input'
import { MOCK_FACULTY, MOCK_OFFERINGS, MOCK_SEMESTERS } from '@/lib/mock-data'
import { fullName, formatTime, DAY_ABBR, FACULTY_DEPT_TO_COLLEGE } from '@/lib/utils'

export default function TeacherAssignmentPage() {
  const { data: session } = useSession()
  const user = session?.user as { deanDepartment?: string } | undefined
  const deanDepartment = user?.deanDepartment ?? 'College of Computing'

  const [tab,             setTab]             = useState<'needs' | 'assigned'>('needs')
  const [query,           setQuery]           = useState('')
  const [assignModal,     setAssignModal]     = useState<string | null>(null)
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedRole,    setSelectedRole]    = useState('LECTURE')
  const [saving,          setSaving]          = useState(false)

  const activeSemester = MOCK_SEMESTERS.find((s) => s.isActive)

  const deptOfferings = MOCK_OFFERINGS.filter(
    (o) => o.status === 'PUBLISHED' &&
           o.semesterId === activeSemester?.id &&
           o.subject?.program?.department === deanDepartment,
  )

  const deptFacultyOptions = MOCK_FACULTY.filter(
    (f) => f.status === 'ACTIVE' && FACULTY_DEPT_TO_COLLEGE[f.department ?? ''] === deanDepartment,
  )

  const withTeacher    = deptOfferings.filter((o) => (o.assignments?.length ?? 0) > 0)
  const withoutTeacher = deptOfferings.filter((o) => (o.assignments?.length ?? 0) === 0)

  const q = query.toLowerCase()
  const filteredWith    = withTeacher.filter((o) =>
    !q || o.subject?.name.toLowerCase().includes(q) || o.subject?.code.toLowerCase().includes(q) || o.section?.toLowerCase().includes(q),
  )
  const filteredWithout = withoutTeacher.filter((o) =>
    !q || o.subject?.name.toLowerCase().includes(q) || o.subject?.code.toLowerCase().includes(q) || o.section?.toLowerCase().includes(q),
  )

  const selectedOffering = MOCK_OFFERINGS.find((o) => o.id === assignModal)

  async function handleAssign() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    setAssignModal(null)
    setSelectedFaculty('')
  }

  const listToShow = tab === 'needs' ? filteredWithout : filteredWith

  return (
    <div className="space-y-5 max-w-5xl">
      <SectionTitle description={`${deanDepartment} · ${activeSemester?.name ?? 'Current semester'}`}>
        Teacher Assignment
      </SectionTitle>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button onClick={() => setTab('needs')} className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${tab === 'needs' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <p className="text-xs text-slate-500">Needs Teacher</p>
          <p className="text-2xl font-bold text-amber-600 tabular-nums mt-1">{withoutTeacher.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">of {deptOfferings.length} offerings</p>
        </button>
        <button onClick={() => setTab('assigned')} className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${tab === 'assigned' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <p className="text-xs text-slate-500">Teacher Assigned</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums mt-1">{withTeacher.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">of {deptOfferings.length} offerings</p>
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Completion</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {deptOfferings.length ? Math.round((withTeacher.length / deptOfferings.length) * 100) : 0}%
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${deptOfferings.length ? (withTeacher.length / deptOfferings.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Tab + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button onClick={() => setTab('needs')} className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${tab === 'needs' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
            Needs Teacher ({withoutTeacher.length})
          </button>
          <button onClick={() => setTab('assigned')} className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${tab === 'assigned' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
            Assigned ({withTeacher.length})
          </button>
        </div>
        <Input
          placeholder="Search subject, code, section…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="w-64"
        />
      </div>

      {/* Offerings list */}
      {deptOfferings.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-12 text-center px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Lock className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">No Published Offerings</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              The Academic Admin has not published any offerings for {deanDepartment} this semester.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 font-medium">Waiting for Academic Admin to publish offerings</p>
            </div>
          </div>
        </Card>
      ) : listToShow.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-400 py-8">
            {query ? 'No offerings match your search.' : tab === 'needs' ? 'All offerings have teachers assigned.' : 'No offerings have teachers assigned yet.'}
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-slate-50">
            {listToShow.map((offering) => {
              const hasTeacher = (offering.assignments?.length ?? 0) > 0
              return (
                <div key={offering.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasTeacher ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <Users className={`h-5 w-5 ${hasTeacher ? 'text-emerald-600' : 'text-amber-500'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{offering.subject?.name}</p>
                        <p className="text-xs text-slate-500">
                          {offering.subject?.code} · Section {offering.section} · {offering.subject?.units} units
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={hasTeacher ? 'outline' : 'primary'}
                        onClick={() => { setAssignModal(offering.id); setSelectedFaculty('') }}
                      >
                        {hasTeacher ? 'Change Teacher' : 'Assign Teacher'}
                      </Button>
                    </div>

                    {/* Schedule */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {offering.schedules?.map((s) => (
                        <span key={s.id} className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                          {s.room ? ` · ${s.room.name}` : ''}
                        </span>
                      ))}
                    </div>

                    {/* Current teacher */}
                    {hasTeacher ? (
                      offering.assignments?.map((a) => (
                        <div key={a.id} className="mt-2 flex items-center gap-2.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                          <Avatar name={a.faculty ? fullName(a.faculty) : 'F'} size="xs" />
                          <p className="text-sm font-medium text-slate-900">{a.faculty ? fullName(a.faculty) : '—'}</p>
                          <Badge className="bg-orange-50 text-orange-700 ring-orange-600/20">{a.role}</Badge>
                          <p className="ml-auto text-xs text-slate-400">{a.faculty?.department}</p>
                        </div>
                      ))
                    ) : (
                      <div className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-600">
                        No teacher assigned yet
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Assign Teacher Modal */}
      <Modal
        open={!!assignModal}
        onClose={() => { setAssignModal(null); setSelectedFaculty('') }}
        title="Assign Teacher"
        description={selectedOffering ? `${selectedOffering.subject?.name} · Section ${selectedOffering.section}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button onClick={handleAssign} loading={saving} disabled={!selectedFaculty} icon={<Check className="h-4 w-4" />}>
              Assign Teacher
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-700">
            Only faculty members from <strong>{deanDepartment}</strong> are shown.
          </div>
          <Select label="Select Teacher" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
            <option value="">Choose a faculty member…</option>
            {deptFacultyOptions.length === 0
              ? <option disabled>No faculty in this department</option>
              : deptFacultyOptions.map((f) => <option key={f.id} value={f.id}>{fullName(f)} — {f.position ?? f.department}</option>)
            }
          </Select>
          <Select label="Teaching Role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
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
    </div>
  )
}
