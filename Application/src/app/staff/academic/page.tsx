'use client'
import { useState } from 'react'
import { Plus, Edit2, Save, X } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { MOCK_SUBJECTS, MOCK_PROGRAMS } from '@/lib/mock-data'
import { yearLevelLabel } from '@/lib/utils'
import type { Subject } from '@/types'

function inferYearLevel(code: string): number {
  const m = code.match(/\d+/)
  if (!m) return 1
  return Math.min(Math.floor(parseInt(m[0]) / 100), 5)
}

type SubjectRow = Subject & { lectureUnits?: number; totalHours?: number }

export default function AcademicSubjectsPage() {
  const [subjects,  setSubjects]  = useState<SubjectRow[]>(
    MOCK_SUBJECTS.map((s) => ({ ...s, lectureUnits: s.units, totalHours: s.units * 18 })),
  )
  const [addModal,  setAddModal]  = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [editForm,  setEditForm]  = useState<Record<string, string>>({})

  const [newForm, setNewForm] = useState({
    code: '', name: '', programId: '', lectureUnits: '3', labUnits: '0', totalHours: '54', type: 'LECTURE', yearLevel: '1',
  })

  // Group by inferred year level
  const grouped: Record<number, SubjectRow[]> = {}
  for (const s of subjects) {
    const y = inferYearLevel(s.code)
    if (!grouped[y]) grouped[y] = []
    grouped[y].push(s)
  }
  const yearLevels = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  function startEdit(sub: SubjectRow) {
    setEditId(sub.id)
    setEditForm({
      code:         sub.code,
      name:         sub.name,
      programId:    sub.programId ?? '',
      lectureUnits: String(sub.lectureUnits ?? sub.units),
      labUnits:     String(sub.labUnits ?? 0),
      totalHours:   String(sub.totalHours ?? (sub.units * 18)),
      type:         sub.type,
    })
  }

  function saveEdit(id: string) {
    const lec = parseInt(editForm.lectureUnits) || 0
    const lab = parseInt(editForm.labUnits)     || 0
    setSubjects((p) => p.map((s) => s.id !== id ? s : {
      ...s,
      code:         editForm.code,
      name:         editForm.name,
      programId:    editForm.programId || undefined,
      program:      MOCK_PROGRAMS.find((p) => p.id === editForm.programId) ?? s.program,
      lectureUnits: lec,
      labUnits:     lab,
      units:        lec + lab,
      totalHours:   parseInt(editForm.totalHours) || 0,
      type:         editForm.type as Subject['type'],
    }))
    setEditId(null)
  }

  function cancelEdit() { setEditId(null) }

  function handleAddSubject() {
    const lec = parseInt(newForm.lectureUnits) || 0
    const lab = parseInt(newForm.labUnits)     || 0
    const prog = MOCK_PROGRAMS.find((p) => p.id === newForm.programId)
    const created: SubjectRow = {
      id:           `sub_${Date.now()}`,
      code:         newForm.code,
      name:         newForm.name,
      programId:    newForm.programId || undefined,
      program:      prog,
      lectureUnits: lec,
      labUnits:     lab,
      units:        lec + lab,
      totalHours:   parseInt(newForm.totalHours) || (lec + lab) * 18,
      type:         newForm.type as Subject['type'],
      schoolId:     'school_1',
    }
    setSubjects((p) => [...p, created])
    setNewForm({ code: '', name: '', programId: '', lectureUnits: '3', labUnits: '0', totalHours: '54', type: 'LECTURE', yearLevel: '1' })
    setAddModal(false)
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle
        description="Master list of all subjects organized by year level"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddModal(true)}>Add Subject</Button>}
      >
        Subject Master List
      </SectionTitle>

      {yearLevels.map((y) => (
        <div key={y}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {yearLevelLabel(y)}
          </p>
          <Card padding="none">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col style={{ width: 90  }} />  {/* Code */}
                  <col style={{ width: 76  }} />  {/* Program */}
                  <col style={{ width: 100 }} />  {/* Prerequisites */}
                  <col style={{ width: 220 }} />  {/* Subject Name */}
                  <col style={{ width: 68  }} />  {/* Lecture */}
                  <col style={{ width: 80  }} />  {/* Laboratory */}
                  <col style={{ width: 56  }} />  {/* Units */}
                  <col style={{ width: 80  }} />  {/* Total Hrs */}
                  <col style={{ width: 94  }} />  {/* Type */}
                  <col style={{ width: 40  }} />  {/* Edit */}
                </colgroup>
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Code</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Program</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Prerequisites</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Subject Name</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Lecture</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Laboratory</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Units</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Hrs</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                {grouped[y].map((sub) => {
                  const isEditing = editId === sub.id
                  const lec  = sub.lectureUnits ?? sub.units
                  const lab  = sub.labUnits ?? 0
                  const tot  = lec + lab
                  const hrs  = sub.totalHours ?? tot * 18
                  const prereqNames = sub.prerequisites
                    ?.map((p) => MOCK_SUBJECTS.find((s) => s.id === p.prerequisiteId)?.code ?? p.prerequisiteId)
                    .join(', ')

                  if (isEditing) {
                    const eLec = parseInt(editForm.lectureUnits) || 0
                    const eLab = parseInt(editForm.labUnits)     || 0
                    return (
                      <tr key={sub.id} className="bg-blue-50/40 border-b border-slate-100">
                        <td className="px-3 py-2">
                          <Input value={editForm.code} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))} className="w-full text-xs font-mono" />
                        </td>
                        <td className="px-3 py-2">
                          <Select value={editForm.programId} onChange={(e) => setEditForm((p) => ({ ...p, programId: e.target.value }))} className="w-full text-xs">
                            <option value="">General</option>
                            {MOCK_PROGRAMS.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400 truncate">{prereqNames || 'None'}</td>
                        <td className="px-3 py-2">
                          <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full text-sm" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input type="number" value={editForm.lectureUnits} onChange={(e) => { const lec = e.target.value; const lab = editForm.labUnits; setEditForm((p) => ({ ...p, lectureUnits: lec, totalHours: String(((parseInt(lec)||0)+(parseInt(lab)||0))*18) })) }} className="w-full text-center text-sm" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input type="number" value={editForm.labUnits} onChange={(e) => { const lab = e.target.value; const lec = editForm.lectureUnits; setEditForm((p) => ({ ...p, labUnits: lab, totalHours: String(((parseInt(lec)||0)+(parseInt(lab)||0))*18) })) }} className="w-full text-center text-sm" />
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-bold text-slate-900 tabular-nums">{eLec + eLab}</td>
                        <td className="px-3 py-2 text-center text-sm font-semibold text-brand-700 tabular-nums">{(eLec + eLab) * 18} hrs</td>
                        <td className="px-3 py-2">
                          <Select value={editForm.type} onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))} className="w-full text-xs">
                            <option value="LECTURE">Lecture</option>
                            <option value="LAB">Lab</option>
                            <option value="LECTURE_LAB">Lecture/Lab</option>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => saveEdit(sub.id)} title="Save" className="rounded p-1 text-emerald-600 hover:bg-emerald-50">
                              <Save className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={cancelEdit} title="Cancel" className="rounded p-1 text-slate-400 hover:bg-slate-100">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <code className="rounded bg-blue-50 px-2 py-0.5 text-xs font-mono font-semibold text-blue-700">{sub.code}</code>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{sub.program?.code ?? 'General'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 truncate">{prereqNames || 'None'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 truncate">{sub.name}</td>
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-slate-700">{lec}</td>
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-slate-700">{lab || '—'}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-900 tabular-nums">{tot}</td>
                      <td className="px-4 py-3 text-center text-xs tabular-nums text-slate-500">{hrs} hrs</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          sub.type === 'LECTURE_LAB' ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                          sub.type === 'LAB'         ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                                                       'bg-blue-50 text-blue-700 ring-blue-600/20'
                        }>{sub.type.replace('_', '/')}</Badge>
                      </td>
                      <td className="px-2 py-3">
                        <button onClick={() => startEdit(sub)} title="Edit" className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ))}

      {/* Add Subject Modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add Subject"
        description="Add a new subject to the master list."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddSubject}>Save Subject</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Subject Code" value={newForm.code} onChange={(e) => setNewForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. CS401" />
          <div className="sm:col-span-2">
            <Input label="Subject Name" value={newForm.name} onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Software Engineering" />
          </div>
          <Select label="Program" value={newForm.programId} onChange={(e) => setNewForm((p) => ({ ...p, programId: e.target.value }))}>
            <option value="">General / All Programs</option>
            {MOCK_PROGRAMS.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </Select>
          <Select label="Year Level" value={newForm.yearLevel} onChange={(e) => setNewForm((p) => ({ ...p, yearLevel: e.target.value }))}>
            {[1,2,3,4,5].map((y) => <option key={y} value={y}>{yearLevelLabel(y)}</option>)}
          </Select>
          <Input
            label="Lecture Units"
            type="number"
            value={newForm.lectureUnits}
            onChange={(e) => {
              const lec = e.target.value
              const lab = newForm.labUnits
              setNewForm((p) => ({ ...p, lectureUnits: lec, totalHours: String(((parseInt(lec) || 0) + (parseInt(lab) || 0)) * 18) }))
            }}
          />
          <Input
            label="Laboratory Units"
            type="number"
            value={newForm.labUnits}
            onChange={(e) => {
              const lab = e.target.value
              const lec = newForm.lectureUnits
              setNewForm((p) => ({ ...p, labUnits: lab, totalHours: String(((parseInt(lec) || 0) + (parseInt(lab) || 0)) * 18) }))
            }}
          />
          <Select label="Type" value={newForm.type} onChange={(e) => setNewForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="LECTURE">Lecture</option>
            <option value="LAB">Lab</option>
            <option value="LECTURE_LAB">Lecture/Lab</option>
          </Select>
          {/* Computed totals — auto-calculated, not manually entered */}
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
            <p className="text-xs text-brand-500 uppercase tracking-wide font-semibold mb-1">Auto-calculated</p>
            <p className="text-sm font-bold text-brand-800">
              {(parseInt(newForm.lectureUnits) || 0) + (parseInt(newForm.labUnits) || 0)} total units
              &nbsp;·&nbsp;
              {((parseInt(newForm.lectureUnits) || 0) + (parseInt(newForm.labUnits) || 0)) * 18} hrs/semester
            </p>
            <p className="text-xs text-brand-400 mt-0.5">Based on 18 weeks × units per week</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
