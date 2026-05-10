'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Eye, EyeOff, Edit2, ClipboardCheck, Calendar, Users,
  CheckCircle2, Clock, AlertCircle, BookOpen, ListChecks, FileText,
  Trash2, Plus,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import {
  MOCK_PERFORMANCE_TASKS, MOCK_RUBRICS, MOCK_ENROLLMENTS, MOCK_STUDENTS,
} from '@/lib/mock-data'
import type {
  PerformanceTask, PTSubmission, Rubric, RubricCriterion, RubricLevel, CriterionScore,
} from '@/types'

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

function defaultLevels(criterionId: string): RubricLevel[] {
  return [
    { id: genId(`${criterionId}_lvl`), label: 'Excellent', score: 100, description: '' },
    { id: genId(`${criterionId}_lvl`), label: 'Good',      score: 85,  description: '' },
    { id: genId(`${criterionId}_lvl`), label: 'Fair',      score: 70,  description: '' },
    { id: genId(`${criterionId}_lvl`), label: 'Poor',      score: 50,  description: '' },
  ]
}

const LEVEL_COLORS: Record<string, string> = {
  Excellent: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  Good:      'border-blue-200 text-blue-700 bg-blue-50',
  Fair:      'border-amber-200 text-amber-700 bg-amber-50',
  Poor:      'border-red-200 text-red-700 bg-red-50',
}

function levelColor(label: string) {
  return LEVEL_COLORS[label] ?? 'border-slate-200 text-slate-600 bg-slate-50'
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'rubric' | 'submissions'

// ─── Edit Info Modal ──────────────────────────────────────────────────────────

function EditInfoModal({
  open,
  task,
  onClose,
  onSaved,
}: {
  open: boolean
  task: PerformanceTask
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle]               = useState(task.title)
  const [description, setDescription]   = useState(task.description ?? '')
  const [instructions, setInstructions] = useState(task.instructions ?? '')
  const [dueDate, setDueDate]           = useState(task.dueDate?.slice(0, 16) ?? '')
  const [saving, setSaving]             = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    task.title        = title.trim()
    task.description  = description.trim() || undefined
    task.instructions = instructions.trim() || undefined
    task.dueDate      = dueDate || undefined
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Task Info"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!title.trim()}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title *"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <Textarea
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
        <Textarea
          label="Instructions"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={4}
        />
        <Input
          label="Due Date"
          type="datetime-local"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
      </div>
    </Modal>
  )
}

// ─── Level Editor nested modal (used in Rubric tab editor) ───────────────────

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
              />
              <Input
                label="Description"
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

// ─── Edit Rubric Modal ────────────────────────────────────────────────────────

function EditRubricModal({
  open,
  rubric,
  task,
  onClose,
  onSaved,
}: {
  open: boolean
  rubric: Rubric
  task: PerformanceTask
  onClose: () => void
  onSaved: () => void
}) {
  const [rubricTitle, setRubricTitle] = useState(rubric.title)
  const [criteria, setCriteria]       = useState<RubricCriterion[]>(
    rubric.criteria.map(c => ({
      ...c,
      levels: c.levels.map(l => ({ ...l })),
    }))
  )
  const [levelEditorIdx, setLevelEditorIdx] = useState<number | null>(null)
  const [saving, setSaving]                 = useState(false)

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

  async function handleSave() {
    if (weightTotal() !== 100) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    // Update rubric in-place
    rubric.title    = rubricTitle.trim() || rubric.title
    rubric.criteria = criteria
    // Also update rubric inside the task
    task.rubric = rubric
    setSaving(false)
    onSaved()
    onClose()
  }

  const wTotal  = weightTotal()
  const weightOk = wTotal === 100

  return (
    <>
      <Modal
        open={open && levelEditorIdx === null}
        onClose={onClose}
        title="Edit Rubric"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={!weightOk}>
              Save Rubric
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Rubric Title"
            value={rubricTitle}
            onChange={e => setRubricTitle(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Criteria</span>
              <span className={`text-xs font-semibold ${weightOk ? 'text-emerald-600' : 'text-red-600'}`}>
                Total: {wTotal}% {weightOk ? '✓' : '(must equal 100%)'}
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
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={crit.description ?? ''}
                    onChange={e => updateCriterion(crit.id, 'description', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="soft" size="xs" onClick={() => setLevelEditorIdx(idx)}>
                      Edit Levels
                    </Button>
                    {criteria.length > 1 && (
                      <button
                        onClick={() => removeCriterion(crit.id)}
                        className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {crit.levels.map(lvl => (
                      <span key={lvl.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#e4ebf5] text-slate-500">
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
      </Modal>

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

// ─── Grading Modal ────────────────────────────────────────────────────────────

function GradingModal({
  open,
  submission,
  task,
  onClose,
  onSaved,
}: {
  open: boolean
  submission: PTSubmission
  task: PerformanceTask
  onClose: () => void
  onSaved: () => void
}) {
  const rubric = task.rubric

  // Initialize selected levels from existing criteriaScores
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    if (submission.criteriaScores) {
      for (const cs of submission.criteriaScores) {
        init[cs.criterionId] = cs.levelId
      }
    }
    return init
  })
  const [feedback, setFeedback] = useState(submission.feedback ?? '')
  const [saving, setSaving]     = useState(false)

  function selectLevel(criterionId: string, levelId: string) {
    setSelected(prev => ({ ...prev, [criterionId]: levelId }))
  }

  function computeScores(): CriterionScore[] {
    if (!rubric) return []
    return rubric.criteria.map(crit => {
      const lvlId  = selected[crit.id]
      const lvl    = crit.levels.find(l => l.id === lvlId)
      const score  = lvl?.score ?? 0
      const ws     = parseFloat(((score * crit.weight) / 100).toFixed(2))
      return {
        criterionId:   crit.id,
        levelId:       lvlId ?? '',
        score,
        weight:        crit.weight,
        weightedScore: ws,
      }
    })
  }

  function totalScore(scores: CriterionScore[]) {
    return parseFloat(scores.reduce((s, c) => s + c.weightedScore, 0).toFixed(2))
  }

  const scores = computeScores()
  const total  = totalScore(scores)
  const allSelected = rubric
    ? rubric.criteria.every(c => !!selected[c.id])
    : false

  async function handleSave() {
    if (!allSelected) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    submission.criteriaScores = scores
    submission.finalScore     = total
    submission.feedback       = feedback.trim() || undefined
    submission.gradedAt       = new Date().toISOString()
    submission.gradedBy       = 'Prof. Roberto Santos'
    setSaving(false)
    onSaved()
    onClose()
  }

  if (!rubric) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Grade — ${submission.studentName ?? submission.studentId}`}
      description={`Submitted ${fmtDate(submission.submittedAt)}${submission.isLate ? ' · Late' : ''}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!allSelected}
          >
            Save Grade
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Submitted content */}
        {submission.content && (
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Student Submission
            </p>
            <div className="max-h-36 overflow-y-auto rounded-lg bg-slate-50 border border-[#e4ebf5] p-3 text-sm text-slate-700 leading-relaxed">
              {submission.content}
            </div>
          </div>
        )}

        {/* Rubric grading */}
        <div>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Rubric Scoring
          </p>
          <div className="space-y-4">
            {rubric.criteria.map(crit => {
              const selLvlId = selected[crit.id]
              const selLvl   = crit.levels.find(l => l.id === selLvlId)
              const ws       = selLvl ? parseFloat(((selLvl.score * crit.weight) / 100).toFixed(2)) : null

              return (
                <div key={crit.id} className="p-3 rounded-lg border border-[#e4ebf5] bg-slate-50/60">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-800">{crit.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium border border-brand-100">
                      {crit.weight}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {crit.levels.map(lvl => {
                      const isSelected = selLvlId === lvl.id
                      return (
                        <button
                          key={lvl.id}
                          onClick={() => selectLevel(crit.id, lvl.id)}
                          className={`flex flex-col items-start px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 min-w-[80px] ${
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className="font-semibold">{lvl.label}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-brand-200' : 'text-slate-400'}`}>
                            {lvl.score} pts
                          </span>
                          {lvl.description && (
                            <span className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                              {lvl.description}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {ws !== null && selLvl && (
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      {selLvl.score} × {crit.weight}% = <span className="font-semibold text-slate-700">{ws} pts</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Total score */}
        <div className="rounded-xl border border-[#e4ebf5] bg-white p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Score Breakdown</p>
              <div className="space-y-0.5">
                {scores.map(cs => {
                  const crit = rubric.criteria.find(c => c.id === cs.criterionId)
                  if (!crit || !cs.levelId) return null
                  return (
                    <p key={cs.criterionId} className="text-xs text-slate-500">
                      {crit.name}: {cs.score} × {cs.weight}% = {cs.weightedScore} pts
                    </p>
                  )
                })}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Score</p>
              <p className="text-2xl font-bold text-slate-900 leading-none">
                {allSelected ? total : '—'}
                <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
              </p>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <Textarea
          label="Instructor Feedback (optional)"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          placeholder="Comments or suggestions for the student…"
        />
      </div>
    </Modal>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  task,
  onTogglePublish,
  onEditInfo,
}: {
  task: PerformanceTask
  onTogglePublish: () => void
  onEditInfo: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const subs        = task.submissions ?? []
  const gradedSubs  = subs.filter(s => !!s.finalScore)
  const pendingSubs = subs.filter(s => !s.finalScore)
  const avg         = gradedSubs.length
    ? parseFloat((gradedSubs.reduce((s, g) => s + (g.finalScore ?? 0), 0) / gradedSubs.length).toFixed(1))
    : null

  const shouldTruncate = (task.instructions ?? '').length > 220

  return (
    <div className="space-y-5">
      {/* Assessment info card */}
      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                task.isPublished
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {task.isPublished ? 'Published' : 'Draft'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-medium">
                Performance Task
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={onEditInfo}
            >
              Edit
            </Button>
            <Button
              variant={task.isPublished ? 'ghost' : 'soft'}
              size="sm"
              icon={task.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              onClick={onTogglePublish}
            >
              {task.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{task.description}</p>
        )}

        {task.instructions && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Instructions</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {shouldTruncate && !expanded
                ? `${task.instructions.slice(0, 220)}…`
                : task.instructions}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-brand-600 hover:text-brand-700 mt-1 font-medium"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#e4ebf5]">
          <div>
            <p className="text-xs text-slate-500">Due Date</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{fmtDate(task.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Rubric</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{task.rubric?.title ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Points</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">100 pts</p>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Submissions', value: subs.length,        icon: FileText,     color: 'bg-violet-50 text-violet-600' },
          { label: 'Graded',           value: gradedSubs.length,   icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Pending Grading',  value: pendingSubs.length,  icon: Clock,        color: 'bg-amber-50 text-amber-600' },
          { label: 'Average Score',    value: avg !== null ? `${avg}` : '—', icon: ClipboardCheck, color: 'bg-brand-50 text-brand-600' },
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
    </div>
  )
}

// ─── Rubric Tab ───────────────────────────────────────────────────────────────

function RubricTab({
  task,
  onRefresh,
}: {
  task: PerformanceTask
  onRefresh: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const rubric = task.rubric

  if (!rubric) {
    return (
      <Card className="py-12 text-center">
        <p className="text-slate-500 text-sm">No rubric attached to this task.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Rubric header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{rubric.title}</h3>
          {rubric.description && (
            <p className="text-sm text-slate-500 mt-0.5">{rubric.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Edit2 className="h-3.5 w-3.5" />}
          onClick={() => setEditOpen(true)}
        >
          Edit Rubric
        </Button>
      </div>

      {/* Criteria matrix */}
      <div className="space-y-4">
        {rubric.criteria.map(crit => (
          <Card key={crit.id} padding="none">
            {/* Criterion header */}
            <div className="px-5 py-3 border-b border-[#e4ebf5] bg-slate-50/70 rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{crit.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold border border-brand-100">
                  {crit.weight}%
                </span>
              </div>
              {crit.description && (
                <p className="text-xs text-slate-500 mt-0.5">{crit.description}</p>
              )}
            </div>

            {/* Level cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-[#e4ebf5]">
              {crit.levels.map(lvl => (
                <div
                  key={lvl.id}
                  className={`px-4 py-3 border-t-2 ${levelColor(lvl.label)}`}
                >
                  <p className="text-xs font-bold">{lvl.label}</p>
                  <p className="text-[11px] font-semibold mt-0.5">{lvl.score} pts</p>
                  {lvl.description && (
                    <p className="text-[10px] leading-snug mt-1 opacity-80">{lvl.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Edit rubric modal */}
      <EditRubricModal
        open={editOpen}
        rubric={rubric}
        task={task}
        onClose={() => setEditOpen(false)}
        onSaved={onRefresh}
      />
    </div>
  )
}

// ─── Submissions Tab ──────────────────────────────────────────────────────────

function SubmissionsTab({
  task,
  offeringId,
  onRefresh,
}: {
  task: PerformanceTask
  offeringId: string
  onRefresh: () => void
}) {
  const [gradingTarget, setGradingTarget] = useState<PTSubmission | null>(null)

  // Enrolled students (ENROLLED status only)
  const enrolled = MOCK_ENROLLMENTS.filter(
    e => e.offeringId === offeringId && e.status === 'ENROLLED'
  )

  // Build row data: submitted students + not-submitted enrolled students
  const submittedIds = new Set((task.submissions ?? []).map(s => s.studentId))

  // Rows for submitted students
  const submissionRows = (task.submissions ?? []).map(sub => {
    const student = MOCK_STUDENTS.find(s => s.id === sub.studentId)
    const status: 'graded' | 'submitted' = sub.finalScore != null ? 'graded' : 'submitted'
    return { sub, student, status }
  })

  // Rows for not-submitted enrolled students
  const notSubmittedRows = enrolled
    .filter(e => !submittedIds.has(e.studentId))
    .map(e => {
      const student = MOCK_STUDENTS.find(s => s.id === e.studentId)
      return {
        sub: null as PTSubmission | null,
        student,
        status: 'not_submitted' as const,
        studentId: e.studentId,
      }
    })

  const allRows = [
    ...submissionRows.map(r => ({ ...r, studentId: r.student?.id ?? r.sub.studentId })),
    ...notSubmittedRows,
  ]

  function statusBadge(status: 'graded' | 'submitted' | 'not_submitted') {
    if (status === 'graded')        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">Graded</span>
    if (status === 'submitted')     return <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 font-medium">Submitted</span>
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-medium">Not Submitted</span>
  }

  if (allRows.length === 0) {
    return (
      <Card className="py-12 text-center">
        <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No enrolled students found for this offering.</p>
      </Card>
    )
  }

  return (
    <>
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dce8f7] bg-[#f0f4fa]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-brand-700 uppercase tracking-widest">Student</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-brand-700 uppercase tracking-widest">Submitted</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-brand-700 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-brand-700 uppercase tracking-widest">Score</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-brand-700 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4ebf5]">
              {allRows.map((row, idx) => {
                const name = row.student
                  ? `${row.student.firstName} ${row.student.lastName}`
                  : (row.sub?.studentName ?? row.studentId)
                const sid  = row.student?.studentId ?? row.studentId

                return (
                  <tr key={idx} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">{sid}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.sub ? (
                        <div>
                          <p>{fmtDate(row.sub.submittedAt)}</p>
                          {row.sub.isLate && (
                            <span className="text-[10px] text-red-600 font-medium">Late</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(row.status)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {row.sub?.finalScore != null
                        ? <span className="font-semibold">{row.sub.finalScore}<span className="text-slate-400 font-normal"> / 100</span></span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.sub ? (
                        <Button
                          variant="soft"
                          size="xs"
                          onClick={() => setGradingTarget(row.sub)}
                        >
                          {row.sub.finalScore != null ? 'Re-grade' : 'Grade'}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">No submission</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Grading modal */}
      {gradingTarget && (
        <GradingModal
          open={true}
          submission={gradingTarget}
          task={task}
          onClose={() => setGradingTarget(null)}
          onSaved={() => { setGradingTarget(null); onRefresh() }}
        />
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformanceTaskDetailPage({
  params,
}: {
  params: { offeringId: string; taskId: string }
}) {
  const { offeringId, taskId } = params

  const [, forceRender] = useState(0)
  const refresh = () => forceRender(n => n + 1)

  const [activeTab, setActiveTab]   = useState<Tab>('overview')
  const [editInfoOpen, setEditInfoOpen] = useState(false)

  const task = MOCK_PERFORMANCE_TASKS.find(t => t.id === taskId && t.offeringId === offeringId)

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Performance task not found.</p>
        <Link
          href={`/teacher/subjects/${offeringId}/performance-tasks`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Performance Tasks
        </Link>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',     label: 'Overview',    icon: BookOpen },
    { key: 'rubric',       label: 'Rubric',      icon: ListChecks },
    { key: 'submissions',  label: 'Submissions', icon: Users },
  ]

  const togglePublish = () => {
    // task is non-null here — guarded by the early return above
    task!.isPublished = !task!.isPublished
    refresh()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Back link */}
      <Link
        href={`/teacher/subjects/${offeringId}/performance-tasks`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Performance Tasks
      </Link>

      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
          <ClipboardCheck className="h-5 w-5 text-rose-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
              task.isPublished
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {task.isPublished ? 'Published' : 'Draft'}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <Calendar className="h-3 w-3" />
                Due {fmtDate(task.dueDate)}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">{task.title}</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-[#e4ebf5] gap-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-b-2 border-brand-600 text-brand-700 font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.key === 'submissions' && (task.submissions?.length ?? 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {task.submissions?.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          task={task}
          onTogglePublish={togglePublish}
          onEditInfo={() => setEditInfoOpen(true)}
        />
      )}
      {activeTab === 'rubric' && (
        <RubricTab task={task} onRefresh={refresh} />
      )}
      {activeTab === 'submissions' && (
        <SubmissionsTab task={task} offeringId={offeringId} onRefresh={refresh} />
      )}

      {/* Edit info modal */}
      <EditInfoModal
        open={editInfoOpen}
        task={task}
        onClose={() => setEditInfoOpen(false)}
        onSaved={refresh}
      />
    </div>
  )
}
