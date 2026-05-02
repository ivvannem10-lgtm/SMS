'use client'
import { useState } from 'react'
import { Plus, CalendarPlus } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, Input } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { MOCK_OFFERINGS, MOCK_SEMESTERS, MOCK_ACADEMIC_YEARS, MOCK_SUBJECTS, MOCK_ROOMS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR, fullName } from '@/lib/utils'
import type { SubjectOffering, Semester } from '@/types'

export default function OfferingsPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL')
  const [yearFilter,   setYearFilter]   = useState<string>('ALL')

  const [addModal,     setAddModal]     = useState(false)
  const [semModal,     setSemModal]     = useState(false)
  const [manageOff,    setManageOff]    = useState<SubjectOffering | null>(null)
  const [publishOff,   setPublishOff]   = useState<SubjectOffering | null>(null)
  const [offerings,    setOfferings]    = useState(MOCK_OFFERINGS)
  const [semesters,    setSemesters]    = useState<Semester[]>(MOCK_SEMESTERS)
  const [academicYears] = useState(MOCK_ACADEMIC_YEARS)

  const [newOff, setNewOff] = useState({
    subjectId: '', section: '',
    semesterId: semesters.find((s) => s.isActive)?.id ?? semesters[0]?.id ?? '',
    maxStudents: '40', roomId: '',
  })

  const [newSem, setNewSem] = useState({
    name: '', type: 'FIRST' as 'FIRST' | 'SECOND' | 'SUMMER',
    academicYearId: academicYears.find((ay) => ay.isActive)?.id ?? academicYears[0]?.id ?? '',
    startDate: '', endDate: '', enrollmentStart: '', enrollmentEnd: '', maxUnits: '24',
  })

  // School year filter options
  const yearOptions = [{ id: 'ALL', name: 'All School Years' }, ...academicYears]

  const semesterIdsForYear = yearFilter === 'ALL'
    ? null
    : semesters.filter((s) => s.academicYearId === yearFilter).map((s) => s.id)

  const filtered = offerings.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
    if (semesterIdsForYear && !semesterIdsForYear.includes(o.semesterId)) return false
    return true
  })

  // Group by semester, newest first
  const grouped: Record<string, SubjectOffering[]> = {}
  for (const o of filtered) {
    if (!grouped[o.semesterId]) grouped[o.semesterId] = []
    grouped[o.semesterId].push(o)
  }
  const semOrder = semesters.map((s) => s.id)
  const sortedSemIds = Object.keys(grouped).sort((a, b) => semOrder.indexOf(a) - semOrder.indexOf(b))

  function handlePublish(id: string) {
    setOfferings((p) => p.map((o) => o.id === id ? { ...o, status: 'PUBLISHED' } : o))
    setPublishOff(null)
  }

  function handleAddOffering() {
    const subject  = MOCK_SUBJECTS.find((s) => s.id === newOff.subjectId)
    const semester = semesters.find((s) => s.id === newOff.semesterId)
    const room     = MOCK_ROOMS.find((r) => r.id === newOff.roomId)
    if (!subject || !semester) return
    const id = `off_${Date.now()}`
    const created: SubjectOffering = {
      id, subjectId: newOff.subjectId, subject, semesterId: newOff.semesterId, semester,
      section: newOff.section, maxStudents: parseInt(newOff.maxStudents) || 40,
      status: 'DRAFT', assignments: [], _count: { enrollments: 0 },
      schedules: [],
      createdAt: new Date().toISOString(),
    }
    setOfferings((p) => [created, ...p])
    setAddModal(false)
    setNewOff({
      subjectId: '', section: '',
      semesterId: semesters.find((s) => s.isActive)?.id ?? semesters[0]?.id ?? '',
      maxStudents: '40', roomId: '',
    })
  }

  function handleAddSemester() {
    if (!newSem.name.trim() || !newSem.startDate || !newSem.endDate) return
    const sem: Semester = {
      id: `sem_${Date.now()}`,
      name: newSem.name, type: newSem.type,
      academicYearId: newSem.academicYearId,
      startDate: newSem.startDate, endDate: newSem.endDate,
      enrollmentStart: newSem.enrollmentStart || undefined,
      enrollmentEnd: newSem.enrollmentEnd || undefined,
      maxUnits: parseInt(newSem.maxUnits) || 24,
      isActive: false,
    }
    setSemesters((p) => [...p, sem])
    setSemModal(false)
    setNewSem({ name: '', type: 'FIRST', academicYearId: academicYears.find((ay) => ay.isActive)?.id ?? '', startDate: '', endDate: '', enrollmentStart: '', enrollmentEnd: '', maxUnits: '24' })
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle
        description="Subject offerings across all semesters"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setSemModal(true)}>
              New Semester
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddModal(true)}>
              Add Offering
            </Button>
          </div>
        }
      >
        Subject Offerings
      </SectionTitle>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(['ALL', 'DRAFT', 'PUBLISHED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${statusFilter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-48 text-sm">
          {yearOptions.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </Select>
      </div>

      {/* Offerings grouped by semester */}
      {sortedSemIds.map((semId) => {
        const sem  = semesters.find((s) => s.id === semId)
        const rows = grouped[semId]
        return (
          <div key={semId}>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{sem?.name ?? semId}</p>
              {sem?.isActive && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Current
                </span>
              )}
            </div>
            <Card padding="none">
              <Table>
                <Thead>
                  <Th>Subject</Th>
                  <Th>Section</Th>
                  <Th>Schedule</Th>
                  <Th>Enrolled</Th>
                  <Th>Status</Th>
                  <Th />
                </Thead>
                <Tbody>
                  {rows.map((offering) => (
                    <Tr key={offering.id}>
                      <Td>
                        <p className="font-medium">{offering.subject?.name}</p>
                        <p className="text-xs text-slate-400">{offering.subject?.code} · {offering.subject?.units} units</p>
                      </Td>
                      <Td><code className="text-xs font-mono text-slate-600">{offering.section}</code></Td>
                      <Td className="text-xs">
                        {(offering.schedules ?? []).length === 0
                          ? <span className="text-slate-400">—</span>
                          : offering.schedules!.map((s) => (
                            <p key={s.id}>{DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}{s.room ? ` · ${s.room.name}` : ''}</p>
                          ))}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(((offering._count?.enrollments ?? 0) / offering.maxStudents) * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{offering._count?.enrollments}/{offering.maxStudents}</span>
                        </div>
                      </Td>
                      <Td>
                        <Badge className={offering.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'}>
                          {offering.status}
                        </Badge>
                      </Td>
                      <Td>
                        {offering.status === 'DRAFT' ? (
                          <button onClick={() => setPublishOff(offering)} className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                            Publish
                          </button>
                        ) : (
                          <button onClick={() => setManageOff(offering)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                            Manage
                          </button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <Card>
          <p className="text-center text-sm text-slate-400 py-8">No offerings match the selected filters.</p>
        </Card>
      )}

      {/* ── New Semester Modal ──────────────────────────────────────────────── */}
      <Modal
        open={semModal}
        onClose={() => setSemModal(false)}
        title="New Semester"
        description="Add a new semester to the academic calendar."
        footer={
          <>
            <Button variant="outline" onClick={() => setSemModal(false)}>Cancel</Button>
            <Button onClick={handleAddSemester}>Save Semester</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Semester Name" value={newSem.name} onChange={(e) => setNewSem((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. 1st Semester 2025-2026" />
          </div>
          <Select label="Type" value={newSem.type} onChange={(e) => setNewSem((p) => ({ ...p, type: e.target.value as typeof newSem.type }))}>
            <option value="FIRST">1st Semester</option>
            <option value="SECOND">2nd Semester</option>
            <option value="SUMMER">Summer</option>
          </Select>
          <Select label="Academic Year" value={newSem.academicYearId} onChange={(e) => setNewSem((p) => ({ ...p, academicYearId: e.target.value }))}>
            {academicYears.map((ay) => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
          </Select>
          <Input label="Start Date" type="date" value={newSem.startDate} onChange={(e) => setNewSem((p) => ({ ...p, startDate: e.target.value }))} />
          <Input label="End Date"   type="date" value={newSem.endDate}   onChange={(e) => setNewSem((p) => ({ ...p, endDate:   e.target.value }))} />
          <Input label="Enrollment Opens" type="date" value={newSem.enrollmentStart} onChange={(e) => setNewSem((p) => ({ ...p, enrollmentStart: e.target.value }))} />
          <Input label="Enrollment Closes" type="date" value={newSem.enrollmentEnd} onChange={(e) => setNewSem((p) => ({ ...p, enrollmentEnd: e.target.value }))} />
          <Input label="Max Units" type="number" value={newSem.maxUnits} onChange={(e) => setNewSem((p) => ({ ...p, maxUnits: e.target.value }))} />
        </div>
      </Modal>

      {/* ── Add Offering Modal ──────────────────────────────────────────────── */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add Offering"
        description="Create a new subject offering for a semester."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddOffering}>Create Offering</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Subject" value={newOff.subjectId} onChange={(e) => setNewOff((p) => ({ ...p, subjectId: e.target.value }))}>
            <option value="">Select subject…</option>
            {MOCK_SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </Select>
          <Select label="Semester" value={newOff.semesterId} onChange={(e) => setNewOff((p) => ({ ...p, semesterId: e.target.value }))}>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="Section" value={newOff.section} onChange={(e) => setNewOff((p) => ({ ...p, section: e.target.value }))} placeholder="e.g. CS1A" />
          <Input label="Max Students" type="number" value={newOff.maxStudents} onChange={(e) => setNewOff((p) => ({ ...p, maxStudents: e.target.value }))} />
          <Select label="Room" value={newOff.roomId} onChange={(e) => setNewOff((p) => ({ ...p, roomId: e.target.value }))}>
            <option value="">No room assigned</option>
            {MOCK_ROOMS.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.building}</option>)}
          </Select>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-400 mt-1">Schedule (day &amp; time) will be assigned by the teacher after the Dean assigns them to this offering.</p>
          </div>
        </div>
      </Modal>

      {/* ── Publish Confirm Modal ───────────────────────────────────────────── */}
      <Modal
        open={!!publishOff}
        onClose={() => setPublishOff(null)}
        title="Publish Offering"
        description={`Publish "${publishOff?.subject?.name} — ${publishOff?.section}"? The Dean will then be able to assign a teacher.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPublishOff(null)}>Cancel</Button>
            <Button onClick={() => publishOff && handlePublish(publishOff.id)}>Publish</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Once published, this offering will be visible to the Dean for teacher assignment and to students for enrollment.</p>
      </Modal>

      {/* ── Manage Modal (view-only) ────────────────────────────────────────── */}
      {manageOff && (
        <Modal
          open={!!manageOff}
          onClose={() => setManageOff(null)}
          title={manageOff.subject?.name ?? 'Offering'}
          description={`${manageOff.subject?.code} · Section ${manageOff.section} · ${manageOff.semester?.name}`}
          size="lg"
          footer={<Button variant="outline" onClick={() => setManageOff(null)}>Close</Button>}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ViewField label="Subject Code" value={manageOff.subject?.code ?? '—'} />
              <ViewField label="Section"      value={manageOff.section ?? '—'} />
              <ViewField label="Units"        value={`${manageOff.subject?.units ?? '—'} units`} />
              <ViewField label="Max Students" value={String(manageOff.maxStudents)} />
              <ViewField label="Enrolled"     value={`${manageOff._count?.enrollments ?? 0} / ${manageOff.maxStudents}`} />
              <ViewField label="Status"       value={manageOff.status} />
              <ViewField label="Required Hrs" value={`${(manageOff.subject?.units ?? 0) * 18} hrs/sem`} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Schedule</p>
              {(manageOff.schedules ?? []).length === 0
                ? <p className="text-sm text-slate-400 italic">No schedule set.</p>
                : (manageOff.schedules ?? []).map((s) => (
                  <p key={s.id} className="text-sm text-slate-700">
                    {DAY_ABBR[s.dayOfWeek]} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    {s.room ? ` · ${s.room.name}` : ''}
                  </p>
                ))
              }
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Teacher</p>
              {(manageOff.assignments ?? []).length === 0
                ? <p className="text-sm text-amber-600 italic">No teacher assigned. The Dean assigns teachers.</p>
                : (manageOff.assignments ?? []).map((a) => (
                  <p key={a.id} className="text-sm text-slate-700">
                    {a.faculty ? fullName(a.faculty) : '—'} · {a.role}
                  </p>
                ))
              }
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  )
}
