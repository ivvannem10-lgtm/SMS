'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, ClipboardList, CalendarDays, Eye, EyeOff, Trash2, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { MOCK_ASSIGNMENTS } from '@/lib/mock-data'
import { Assignment } from '@/types'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function isOverdue(dueDate?: string) {
  return dueDate ? new Date(dueDate) < new Date() : false
}

export default function AssignmentsPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const assignments = MOCK_ASSIGNMENTS.filter((a) => a.offeringId === offeringId)

  const [open, setOpen]           = useState(false)
  const [saving, setSaving]       = useState(false)
  const [delTarget, setDelTarget] = useState<Assignment | null>(null)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())

  const [form, setForm] = useState({ title: '', description: '', dueDate: '', totalPoints: '100' })
  function set(field: string, val: string) { setForm(p => ({ ...p, [field]: val })) }

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    MOCK_ASSIGNMENTS.push({
      id: `asgn_${Date.now()}`,
      offeringId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      dueDate: form.dueDate || undefined,
      totalPoints: parseInt(form.totalPoints) || 100,
      isPublished: false,
      submissions: [],
      createdAt: new Date().toISOString(),
    })
    setForm({ title: '', description: '', dueDate: '', totalPoints: '100' })
    setSaving(false)
    setOpen(false)
  }

  function togglePublish(asgn: Assignment) { asgn.isPublished = !asgn.isPublished }

  function confirmDelete(asgn: Assignment) {
    const idx = MOCK_ASSIGNMENTS.findIndex((a) => a.id === asgn.id)
    if (idx !== -1) MOCK_ASSIGNMENTS.splice(idx, 1)
    setDelTarget(null)
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Assignments</h1>
          <p className="text-sm text-slate-500">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Create Assignment</Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardList className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No assignments yet. Create your first one.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((asgn) => {
            const subs        = asgn.submissions ?? []
            const gradedCount = subs.filter((s) => s.grade !== undefined).length
            const isOpen      = expanded.has(asgn.id)
            const overdue     = isOverdue(asgn.dueDate)

            return (
              <Card key={asgn.id}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 shrink-0">
                    <ClipboardList className="h-5 w-5 text-violet-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{asgn.title}</h3>
                        {asgn.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{asgn.description}</p>
                        )}
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        asgn.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {asgn.isPublished ? '● Published' : 'Draft'}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span className={overdue ? 'text-red-500 font-medium' : ''}>
                          Due: {fmtDate(asgn.dueDate)}
                          {overdue && ' (Closed)'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> {asgn.totalPoints} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {subs.length} submitted · {gradedCount} graded
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submissions expandable */}
                {subs.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleExpand(asgn.id)}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <span>Submissions ({subs.length})</span>
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isOpen && (
                      <div className="mt-1 rounded-xl border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                          {subs.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs hover:bg-slate-50">
                              <span className="font-mono text-slate-600">{sub.studentId}</span>
                              <span className={`text-[11px] ${sub.isLate ? 'text-red-500' : 'text-slate-400'}`}>
                                {sub.isLate ? 'Late · ' : ''}{fmtDate(sub.submittedAt)}
                              </span>
                              <span className={`font-bold min-w-[60px] text-right ${
                                sub.grade !== undefined
                                  ? sub.grade / asgn.totalPoints >= 0.75 ? 'text-emerald-600' : 'text-amber-600'
                                  : 'text-slate-400'
                              }`}>
                                {sub.grade !== undefined ? `${sub.grade}/${asgn.totalPoints}` : 'Ungraded'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 justify-end">
                  <button
                    onClick={() => togglePublish(asgn)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {asgn.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {asgn.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => setDelTarget(asgn)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Assignment" size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Assignment</Button>
          </>
        }>
        <div className="space-y-4">
          <Input label="Assignment Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g., Hello World Program" required />
          <Textarea label="Instructions" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe what students need to submit…" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date & Time" type="datetime-local" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            <Input label="Total Points *" type="number" min="1" value={form.totalPoints} onChange={e => set('totalPoints', e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Delete Assignment" size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDelete(delTarget!)}>Delete</Button>
          </>
        }>
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{delTarget?.title}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
