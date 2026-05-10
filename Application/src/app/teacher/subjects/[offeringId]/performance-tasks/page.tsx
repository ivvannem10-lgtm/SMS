'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, ClipboardCheck, Calendar, Eye, EyeOff, Trash2,
  FileText, AlertCircle, CheckCircle2, Clock, ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { MOCK_PERFORMANCE_TASKS, MOCK_RUBRICS } from '@/lib/mock-data'
import type { PerformanceTask, Rubric, RubricCriterion, RubricLevel } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── Default levels for a new criterion ───────────────────────────────────────

function defaultLevels(criterionId: string): RubricLevel[] {
  return [
    { id: genId(`${criterionId}_lvl`), label: 'Excellent', score: 100, description: '' },
    { id: genId(`${criterionId}_lvl`), label: 'Good',      score: 85,  description: '' },
    { id: genId(`${criterionId}_lvl`), label: 'Fair',      score: 70,  description: '' },
    { id: genId(`${criterionId}_lvl`), label: 'Poor',      score: 50,  description: '' },
  ]
}

function makeDefaultCriteria(): RubricCriterion[] {
  const c1 = genId('crit')
  const c2 = genId('crit')
  const c3 = genId('crit')
  return [
    { id: c1, name: 'Content & Accuracy',      weight: 40, description: '', levels: defaultLevels(c1) },
    { id: c2, name: 'Creativity & Originality', weight: 30, description: '', levels: defaultLevels(c2) },
    { id: c3, name: 'Presentation & Format',    weight: 30, description: '', levels: defaultLevels(c3) },
  ]
}

// ─── Level Editor Modal ────────────────────────────────────────────────────────

function LevelEditorModal({
  open,
  criterionName,
  levels,
  onSave,
  onClose,
}: {
  open: boolean
  criterionName: string
  levels: RubricLevel[]
  onSave: (levels: RubricLevel[]) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<RubricLevel[]>(levels)

  function updateLevel(idx: number, field: keyof RubricLevel, val: string | number) {
    setDraft(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l))
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Levels — ${criterionName}`}
      description="Set label and score for each performance level."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { onSave(draft); onClose() }}>
            Save Levels
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {draft.map((lvl, idx) => (
          <div key={lvl.id} className="grid grid-cols-[1fr_100px] gap-3 items-start p-3 rounded-lg bg-slate-50 border border-[#e4ebf5]">
            <div className="space-y-2">
              <Input
                label="Label"
                value={lvl.label}
                onChange={e => updateLevel(idx, 'label', e.target.value)}
                placeholder="e.g. Excellent"
              />
              <Input
                label="Description (optional)"
                value={lvl.description ?? ''}
                onChange={e => updateLevel(idx, 'description', e.target.value)}
                placeholder="Brief descriptor"
              />
            </div>
            <Input
              label="Score"
              type="number"
              min={0}
              max={100}
              value={String(lvl.score)}
              onChange={e => updateLevel(idx, 'score', parseInt(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ─── Create Task Modal (2-step) ────────────────────────────────────────────────

interface CreateTaskModalProps {
  open: boolean
  offeringId: string
  onClose: () => void
  onCreated: () => void
}

function CreateTaskModal({ open, offeringId, onClose, onCreated }: CreateTaskModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)

  // Step 1 fields
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate]           = useState('')

  // Step 2 fields
  const [rubricTitle, setRubricTitle]   = useState('')
  const [criteria, setCriteria]         = useState<RubricCriterion[]>(() => makeDefaultCriteria())

  // Level editor nested modal
  const [levelEditorIdx, setLevelEditorIdx] = useState<number | null>(null)

  function weightTotal() {
    return criteria.reduce((s, c) => s + (c.weight || 0), 0)
  }

  function addCriterion() {
    const id = genId('crit')
    setCriteria(prev => [...prev, { id, name: '', weight: 0, description: '', levels: defaultLevels(id) }])
  }

  function removeCriterion(id: string) {
    if (criteria.length <= 1) return
    setCriteria(prev => prev.filter(c => c.id !== id))
  }

  function updateCriterion(id: string, field: keyof RubricCriterion, val: string | number) {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c))
  }

  function saveLevels(idx: number, levels: RubricLevel[]) {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, levels } : c))
  }

  function handleGoToStep2() {
    if (!title.trim()) return
    setRubricTitle(`${title.trim()} Rubric`)
    setStep(2)
  }

  async function handleCreate() {
    if (!title.trim() || weightTotal() !== 100) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))

    const rubricId = genId('rubric')
    const newRubric: Rubric = {
      id: rubricId,
      title: rubricTitle.trim() || `${title.trim()} Rubric`,
      offeringId,
      criteria,
      createdAt: new Date().toISOString(),
    }
    MOCK_RUBRICS.push(newRubric)

    const newTask: PerformanceTask = {
      id: genId('pt'),
      offeringId,
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      rubricId,
      rubric: newRubric,
      totalPoints: 100,
      dueDate: dueDate || undefined,
      isPublished: false,
      submissions: [],
      createdAt: new Date().toISOString(),
    }
    MOCK_PERFORMANCE_TASKS.push(newTask)

    setSaving(false)
    handleClose()
    onCreated()
  }

  function handleClose() {
    setStep(1)
    setTitle('')
    setDescription('')
    setInstructions('')
    setDueDate('')
    setRubricTitle('')
    setCriteria(makeDefaultCriteria())
    setLevelEditorIdx(null)
    onClose()
  }

  const wTotal = weightTotal()
  const weightOk = wTotal === 100

  return (
    <>
      <Modal
        open={open && levelEditorIdx === null}
        onClose={handleClose}
        title={step === 1 ? 'Create Performance Task' : 'Build Rubric'}
        description={step === 1 ? 'Step 1 of 2 — Basic information' : 'Step 2 of 2 — Define grading rubric'}
        size="lg"
        footer={
          step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleGoToStep2} disabled={!title.trim()}>
                Next: Create Rubric
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                loading={saving}
                disabled={!weightOk || !title.trim()}
              >
                Create Task
              </Button>
            </>
          )
        }
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? 'text-brand-700' : 'text-slate-400'}`}>
                {s === 1 ? 'Basic Info' : 'Rubric Builder'}
              </span>
              {s < 2 && <span className="text-slate-300 text-xs">→</span>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Research Paper: History of Computing"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief overview of the performance task…"
              rows={3}
            />
            <Textarea
              label="Instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Detailed instructions for students…"
              rows={4}
            />
            <Input
              label="Due Date"
              type="datetime-local"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Input
              label="Rubric Title"
              value={rubricTitle}
              onChange={e => setRubricTitle(e.target.value)}
              placeholder="Rubric title"
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Criteria</span>
                <span className={`text-xs font-semibold ${weightOk ? 'text-emerald-600' : 'text-red-600'}`}>
                  Total weight: {wTotal}% {weightOk ? '✓' : '(must equal 100%)'}
                </span>
              </div>
              <div className="space-y-3">
                {criteria.map((crit, idx) => (
                  <div key={crit.id} className="p-3 rounded-lg border border-[#e4ebf5] bg-slate-50 space-y-2">
                    <div className="grid grid-cols-[1fr_80px] gap-2">
                      <Input
                        placeholder="Criterion name"
                        value={crit.name}
                        onChange={e => updateCriterion(crit.id, 'name', e.target.value)}
                      />
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={crit.weight}
                          onChange={e => updateCriterion(crit.id, 'weight', parseInt(e.target.value) || 0)}
                          className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-900 shadow-inner-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="soft"
                        size="xs"
                        onClick={() => setLevelEditorIdx(idx)}
                      >
                        Edit Levels
                      </Button>
                      {criteria.length > 1 && (
                        <button
                          onClick={() => removeCriterion(crit.id)}
                          className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                          title="Remove criterion"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {crit.levels.map(lvl => (
                        <span
                          key={lvl.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#e4ebf5] text-slate-500"
                        >
                          {lvl.label} ({lvl.score})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addCriterion}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Criterion
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Nested level editor */}
      {levelEditorIdx !== null && criteria[levelEditorIdx] && (
        <LevelEditorModal
          open={true}
          criterionName={criteria[levelEditorIdx].name || `Criterion ${levelEditorIdx + 1}`}
          levels={criteria[levelEditorIdx].levels}
          onSave={levels => saveLevels(levelEditorIdx, levels)}
          onClose={() => setLevelEditorIdx(null)}
        />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformanceTasksPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const [, forceRender] = useState(0)
  const refresh = () => forceRender(n => n + 1)

  const tasks = MOCK_PERFORMANCE_TASKS.filter(t => t.offeringId === offeringId)

  const [createOpen, setCreateOpen]   = useState(false)
  const [delTarget, setDelTarget]     = useState<PerformanceTask | null>(null)
  const [delConfirmOpen, setDelConfirmOpen] = useState(false)

  // Stats
  const published    = tasks.filter(t => t.isPublished).length
  const totalSubs    = tasks.reduce((s, t) => s + (t.submissions?.length ?? 0), 0)
  const pendingGrade = tasks.reduce((s, t) =>
    s + (t.submissions?.filter(sub => !sub.finalScore).length ?? 0), 0)
  const graded       = tasks.reduce((s, t) =>
    s + (t.submissions?.filter(sub => !!sub.finalScore).length ?? 0), 0)

  function togglePublish(task: PerformanceTask) {
    task.isPublished = !task.isPublished
    refresh()
  }

  function handleDelete() {
    if (!delTarget) return
    const idx = MOCK_PERFORMANCE_TASKS.findIndex(t => t.id === delTarget.id)
    if (idx !== -1) MOCK_PERFORMANCE_TASKS.splice(idx, 1)
    setDelTarget(null)
    setDelConfirmOpen(false)
    refresh()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link
        href={`/teacher/subjects/${offeringId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="relative pl-3.5">
          <span className="absolute left-0 top-0.5 bottom-0.5 w-[3px] rounded-full bg-rose-500" />
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
            Performance Tasks
            <span className="ml-2 text-sm font-normal text-slate-400">({tasks.length})</span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Rubric-based assessments with criterion scoring
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
        >
          Create Performance Task
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Published',       value: published,    icon: Eye,          color: 'bg-brand-50 text-brand-600' },
          { label: 'Total Submissions', value: totalSubs,  icon: FileText,     color: 'bg-violet-50 text-violet-600' },
          { label: 'Pending Grading', value: pendingGrade, icon: Clock,        color: 'bg-amber-50 text-amber-600' },
          { label: 'Graded',          value: graded,       icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center">
              <ClipboardCheck className="h-7 w-7 text-rose-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">No performance tasks yet</p>
            <p className="text-sm text-slate-400 max-w-xs">
              Create your first rubric-based performance task for this subject.
            </p>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
              className="mt-1"
            >
              Create Performance Task
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const subCount     = task.submissions?.length ?? 0
            const pendingCount = task.submissions?.filter(s => !s.finalScore).length ?? 0

            return (
              <Card key={task.id} className="group">
                <div className="flex items-start gap-4">
                  {/* Icon badge */}
                  <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardCheck className="h-5 w-5 text-rose-500" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Rubric badge */}
                      {task.rubric?.title && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium border border-violet-100">
                          {task.rubric.title}
                        </span>
                      )}
                      {/* Published / Draft */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        task.isPublished
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {task.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 truncate">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate ? fmtDate(task.dueDate) : 'No due date'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardCheck className="h-3 w-3" />
                        100 pts
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {subCount} submission{subCount !== 1 ? 's' : ''}
                      </span>
                      {pendingCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="h-3 w-3" />
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={task.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      onClick={() => togglePublish(task)}
                    >
                      {task.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <button
                      onClick={() => { setDelTarget(task); setDelConfirmOpen(true) }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/teacher/subjects/${offeringId}/performance-tasks/${task.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Manage <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <CreateTaskModal
        open={createOpen}
        offeringId={offeringId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); refresh() }}
      />

      {/* Delete confirmation */}
      {delConfirmOpen && delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => { setDelTarget(null); setDelConfirmOpen(false) }} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-card-lg p-6 animate-slide-up">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Performance Task?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">{delTarget.title}</span> and all its
                  submissions will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setDelTarget(null); setDelConfirmOpen(false) }}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
