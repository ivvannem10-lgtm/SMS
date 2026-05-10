'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle2, XCircle,
  BookOpen, BarChart2, Users, Clock, Star, AlertCircle, ChevronRight, Settings,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MOCK_QUIZZES } from '@/lib/mock-data'
import type {
  Quiz, QuizQuestion, QuizAttempt, QuizQuestionType, AssessmentType,
  AttemptStatus, StudentAnswer,
} from '@/types'

// ─── Constant maps ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  QUIZ: 'Quiz',
  LONG_QUIZ: 'Long Quiz',
  PRACTICAL_EXAM: 'Practical Exam',
  MIDTERM_EXAM: 'Midterm Exam',
  FINAL_EXAM: 'Final Exam',
  ASSIGNMENT_EXAM: 'Assignment Exam',
  ORAL_ASSESSMENT: 'Oral Assessment',
  LABORATORY: 'Laboratory Assessment',
}

const QTYPE_COLOR: Record<string, string> = {
  MCQ: 'bg-blue-50 text-blue-700',
  TRUE_FALSE: 'bg-teal-50 text-teal-700',
  IDENTIFICATION: 'bg-violet-50 text-violet-700',
  FILL_IN_BLANK: 'bg-indigo-50 text-indigo-700',
  ESSAY: 'bg-orange-50 text-orange-700',
  LONG_RESPONSE: 'bg-orange-50 text-orange-700',
  CODING: 'bg-slate-100 text-slate-700',
  MATCHING: 'bg-pink-50 text-pink-700',
}

const QTYPE_LABEL: Record<string, string> = {
  MCQ: 'MCQ',
  TRUE_FALSE: 'T/F',
  IDENTIFICATION: 'ID',
  FILL_IN_BLANK: 'Fill',
  ESSAY: 'Essay',
  LONG_RESPONSE: 'Long',
  CODING: 'Code',
  MATCHING: 'Match',
}

const MANUAL_TYPES: QuizQuestionType[] = ['ESSAY', 'LONG_RESPONSE', 'CODING']
const AUTO_TYPES: QuizQuestionType[]   = ['MCQ', 'TRUE_FALSE', 'IDENTIFICATION', 'FILL_IN_BLANK']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function fmtSeconds(s?: number) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec}s`
}

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function isAutoGraded(type: QuizQuestionType) {
  return (AUTO_TYPES as string[]).includes(type)
}

function checkAnswer(q: QuizQuestion, given?: string): boolean {
  if (!given || !q.answer) return false
  const t = q.type as QuizQuestionType
  if (t === 'MCQ' || t === 'TRUE_FALSE') return given.trim() === q.answer.trim()
  if (t === 'IDENTIFICATION' || t === 'FILL_IN_BLANK')
    return given.trim().toLowerCase() === q.answer.trim().toLowerCase()
  return false
}

// ─── Status badges ─────────────────────────────────────────────────────────────

function AttemptStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED:   'bg-amber-50 text-amber-700 border border-amber-200',
    GRADED:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border border-blue-200',
    TIMED_OUT:   'bg-red-50 text-red-700 border border-red-200',
    NOT_STARTED: 'bg-slate-100 text-slate-500',
  }
  const cls = map[status] ?? 'bg-slate-100 text-slate-500'
  const labels: Record<string, string> = {
    SUBMITTED: 'Submitted', GRADED: 'Graded', IN_PROGRESS: 'In Progress',
    TIMED_OUT: 'Timed Out', NOT_STARTED: 'Not Started',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

function VisibilityBadge({ v }: { v?: string }) {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    DRAFT:     'bg-slate-100 text-slate-500',
    HIDDEN:    'bg-amber-50 text-amber-700 border border-amber-200',
  }
  const cls = map[v ?? 'DRAFT'] ?? 'bg-slate-100 text-slate-500'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${cls}`}>
      {v ?? 'DRAFT'}
    </span>
  )
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'questions' | 'submissions' | 'analytics'

// ─── Question form state ───────────────────────────────────────────────────────

interface QuestionForm {
  type: QuizQuestionType
  question: string
  points: string
  // MCQ
  options: string[]
  correctOption: number
  // TRUE_FALSE
  tfAnswer: 'True' | 'False'
  // ID / Fill
  answerKey: string
}

function defaultQuestionForm(): QuestionForm {
  return {
    type: 'MCQ',
    question: '',
    points: '5',
    options: ['', '', '', ''],
    correctOption: 0,
    tfAnswer: 'True',
    answerKey: '',
  }
}

// ─── Grading form state ────────────────────────────────────────────────────────

type ManualScores = Record<string, { score: string; feedback: string }>

// ─── Edit quiz settings form ───────────────────────────────────────────────────

interface SettingsForm {
  title: string
  description: string
  instructions: string
  duration: string
  passingScore: string
  maxAttempts: string
  showResultsImmediately: boolean
  showCorrectAnswers: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════════

export default function QuizDetailPage({
  params,
}: {
  params: { offeringId: string; quizId: string }
}) {
  const { offeringId, quizId } = params
  const quiz = MOCK_QUIZZES.find((q) => q.id === quizId)

  // ── Not found ───────────────────────────────────────────────────────────────

  if (!quiz) {
    return (
      <div className="max-w-2xl space-y-5">
        <Link
          href={`/teacher/subjects/${offeringId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Link>
        <Card>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 text-sm font-medium">Assessment not found.</p>
          </div>
        </Card>
      </div>
    )
  }

  return <QuizDetailContent quiz={quiz} offeringId={offeringId} />
}

// ─── Inner client component ────────────────────────────────────────────────────

function QuizDetailContent({ quiz, offeringId }: { quiz: Quiz; offeringId: string }) {
  const [tab, setTab] = useState<Tab>('overview')

  // force re-render after mutations
  const [tick, setTick] = useState(0)
  const rerender = useCallback(() => setTick((t) => t + 1), [])

  // ── Tab nav ────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',     label: 'Overview',     icon: <BookOpen className="h-4 w-4" /> },
    { key: 'questions',    label: 'Questions',    icon: <Star className="h-4 w-4" /> },
    { key: 'submissions',  label: 'Submissions',  icon: <Users className="h-4 w-4" /> },
    { key: 'analytics',   label: 'Analytics',    icon: <BarChart2 className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-4xl space-y-5" key={tick}>
      {/* Back link */}
      <Link
        href={`/teacher/subjects/${offeringId}/quizzes`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Quizzes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {quiz.assessmentType ? TYPE_LABELS[quiz.assessmentType] ?? quiz.assessmentType : 'Assessment'}
            {' · '}
            {quiz.questions?.length ?? 0} question{(quiz.questions?.length ?? 0) !== 1 ? 's' : ''}
            {' · '}
            {quiz.totalPoints} pts
          </p>
        </div>
        <VisibilityBadge v={quiz.isPublished ? 'PUBLISHED' : (quiz.visibility ?? 'DRAFT')} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#e4ebf5]">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === key
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'    && <OverviewTab    quiz={quiz} rerender={rerender} offeringId={offeringId} quizId={quiz.id} />}
      {tab === 'questions'   && <QuestionsTab   quiz={quiz} rerender={rerender} />}
      {tab === 'submissions' && <SubmissionsTab quiz={quiz} rerender={rerender} />}
      {tab === 'analytics'   && <AnalyticsTab  quiz={quiz} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Overview
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab({ quiz, rerender, offeringId, quizId }: { quiz: Quiz; rerender: () => void; offeringId: string; quizId: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [saving,   setSaving]   = useState(false)

  const attempts = quiz.attempts ?? []
  const fullyGraded = attempts.filter((a) => a.isFullyGraded).length
  const scores = attempts
    .filter((a) => a.score !== undefined)
    .map((a) => a.score as number)
  const avgScore = scores.length > 0 ? scores.reduce((s, n) => s + n, 0) / scores.length : null
  const passRate =
    quiz.passingScore !== undefined && scores.length > 0
      ? Math.round((scores.filter((s) => s >= quiz.passingScore!).length / scores.length) * 100)
      : null

  const [form, setForm] = useState<SettingsForm>(() => ({
    title:                  quiz.title,
    description:            quiz.description ?? '',
    instructions:           quiz.instructions ?? '',
    duration:               quiz.duration.toString(),
    passingScore:           quiz.passingScore?.toString() ?? '',
    maxAttempts:            quiz.maxAttempts?.toString() ?? '',
    showResultsImmediately: quiz.showResultsImmediately ?? false,
    showCorrectAnswers:     quiz.showCorrectAnswers ?? false,
  }))

  function setF(field: keyof SettingsForm, val: string | boolean) {
    setForm((p) => ({ ...p, [field]: val }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    quiz.title          = form.title.trim()
    quiz.description    = form.description.trim() || undefined
    quiz.instructions   = form.instructions.trim() || undefined
    quiz.duration       = parseInt(form.duration) || quiz.duration
    quiz.passingScore   = form.passingScore ? parseInt(form.passingScore) : undefined
    quiz.maxAttempts    = form.maxAttempts  ? parseInt(form.maxAttempts)  : undefined
    quiz.showResultsImmediately = form.showResultsImmediately
    quiz.showCorrectAnswers     = form.showCorrectAnswers
    setSaving(false)
    setEditOpen(false)
    rerender()
  }

  function togglePublish() {
    quiz.isPublished = !quiz.isPublished
    quiz.visibility  = quiz.isPublished ? 'PUBLISHED' : 'DRAFT'
    rerender()
  }

  return (
    <div className="space-y-5">
      {/* Info card */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Assessment Info</h2>
          <Button variant="outline" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>

        {quiz.description && (
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">{quiz.description}</p>
        )}

        {quiz.instructions && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Instructions</p>
            <p className="text-sm text-blue-800 leading-relaxed">{quiz.instructions}</p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          {quiz.assessmentType && (
            <div>
              <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Type</dt>
              <dd className="mt-0.5">
                <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-bold">
                  {TYPE_LABELS[quiz.assessmentType] ?? quiz.assessmentType}
                </span>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Duration</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> {quiz.duration} min
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Total Points</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">{quiz.totalPoints} pts</dd>
          </div>
          {quiz.passingScore !== undefined && (
            <div>
              <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Passing Score</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{quiz.passingScore} pts</dd>
            </div>
          )}
          {(quiz.startDate || quiz.endDate) && (
            <div className="col-span-2">
              <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Date Window</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {fmt(quiz.startDate)} – {fmt(quiz.endDate)}
              </dd>
            </div>
          )}
          {quiz.maxAttempts !== undefined && (
            <div>
              <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Max Attempts</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{quiz.maxAttempts}</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Visibility</dt>
            <dd className="mt-0.5">
              <VisibilityBadge v={quiz.isPublished ? 'PUBLISHED' : (quiz.visibility ?? 'DRAFT')} />
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Show Results</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">
              {quiz.showResultsImmediately ? 'Immediately' : 'After grading'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Show Answers</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">
              {quiz.showCorrectAnswers ? 'Yes' : 'No'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatPill label="Submissions" value={attempts.length} />
        <StatPill label="Fully Graded" value={fullyGraded} />
        <StatPill
          label="Avg Score"
          value={avgScore !== null ? `${avgScore.toFixed(1)}/${quiz.totalPoints}` : '—'}
        />
        <StatPill label="Pass Rate" value={passRate !== null ? `${passRate}%` : '—'} />
      </div>

      {/* Publish toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {quiz.isPublished ? 'This assessment is published' : 'This assessment is a draft'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {quiz.isPublished
                ? 'Students can see and attempt this assessment.'
                : 'Only you can see this assessment.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/teacher/subjects/${offeringId}/quizzes/${quizId}/settings`}
              className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" /> Advanced Settings
            </Link>
            <Button
              variant={quiz.isPublished ? 'outline' : 'primary'}
              icon={quiz.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onClick={togglePublish}
            >
              {quiz.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit settings modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Assessment Settings"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setF('title', e.target.value)}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setF('description', e.target.value)}
            rows={2}
          />
          <Textarea
            label="Instructions"
            value={form.instructions}
            onChange={(e) => setF('instructions', e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Duration (min)"
              type="number"
              min="5"
              value={form.duration}
              onChange={(e) => setF('duration', e.target.value)}
            />
            <Input
              label="Passing Score"
              type="number"
              min="0"
              value={form.passingScore}
              onChange={(e) => setF('passingScore', e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Max Attempts"
              type="number"
              min="1"
              value={form.maxAttempts}
              onChange={(e) => setF('maxAttempts', e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div className="flex gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-500 focus:ring-brand-500/20"
                checked={form.showResultsImmediately}
                onChange={(e) => setF('showResultsImmediately', e.target.checked)}
              />
              Show results immediately
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-500 focus:ring-brand-500/20"
                checked={form.showCorrectAnswers}
                onChange={(e) => setF('showCorrectAnswers', e.target.checked)}
              />
              Show correct answers
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{value}</p>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2 — Questions
// ═══════════════════════════════════════════════════════════════════════════════

function QuestionsTab({ quiz, rerender }: { quiz: Quiz; rerender: () => void }) {
  const questions = [...(quiz.questions ?? [])].sort((a, b) => a.order - b.order)

  const [modalOpen,  setModalOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState<QuizQuestion | null>(null)
  const [delTarget,  setDelTarget]  = useState<QuizQuestion | null>(null)
  const [saving,     setSaving]     = useState(false)

  const [form, setForm] = useState<QuestionForm>(defaultQuestionForm)

  function openAdd() {
    setEditTarget(null)
    setForm(defaultQuestionForm())
    setModalOpen(true)
  }

  function openEdit(q: QuizQuestion) {
    setEditTarget(q)
    setForm({
      type:          q.type,
      question:      q.question,
      points:        q.points.toString(),
      options:       q.options?.length ? [...q.options, ...Array(4).fill('')].slice(0, 4) : ['', '', '', ''],
      correctOption: q.options ? q.options.indexOf(q.answer ?? '') : 0,
      tfAnswer:      (q.answer === 'True' || q.answer === 'False') ? q.answer as 'True' | 'False' : 'True',
      answerKey:     q.answer ?? '',
    })
    setModalOpen(true)
  }

  function setF<K extends keyof QuestionForm>(field: K, val: QuestionForm[K]) {
    setForm((p) => ({ ...p, [field]: val }))
  }

  function setOption(idx: number, val: string) {
    setForm((p) => {
      const opts = [...p.options]
      opts[idx] = val
      return { ...p, options: opts }
    })
  }

  async function handleSave() {
    if (!form.question.trim()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))

    const pts  = parseInt(form.points) || 5
    const type = form.type

    let answer: string | undefined
    let options: string[] | undefined

    if (type === 'MCQ') {
      const filled = form.options.filter((o) => o.trim())
      options = filled
      answer  = filled[form.correctOption] ?? filled[0]
    } else if (type === 'TRUE_FALSE') {
      answer = form.tfAnswer
    } else if (type === 'IDENTIFICATION' || type === 'FILL_IN_BLANK') {
      answer = form.answerKey.trim() || undefined
    }

    if (editTarget) {
      editTarget.question = form.question.trim()
      editTarget.type     = type
      editTarget.points   = pts
      editTarget.options  = options
      editTarget.answer   = answer
    } else {
      const q: QuizQuestion = {
        id:       genId(),
        quizId:   quiz.id,
        question: form.question.trim(),
        type,
        points:   pts,
        order:    (quiz.questions?.length ?? 0) + 1,
        options,
        answer,
      }
      if (!quiz.questions) quiz.questions = []
      quiz.questions.push(q)
      // keep totalPoints in sync
      quiz.totalPoints = (quiz.questions ?? []).reduce((s, q) => s + q.points, 0)
    }

    setSaving(false)
    setModalOpen(false)
    rerender()
  }

  function confirmDelete(q: QuizQuestion) {
    if (!quiz.questions) return
    const idx = quiz.questions.findIndex((x) => x.id === q.id)
    if (idx !== -1) quiz.questions.splice(idx, 1)
    // re-order
    quiz.questions.forEach((x, i) => { x.order = i + 1 })
    quiz.totalPoints = quiz.questions.reduce((s, x) => s + x.points, 0)
    setDelTarget(null)
    rerender()
  }

  const AUTO_GRADED_TYPES = new Set(['MCQ', 'TRUE_FALSE', 'IDENTIFICATION', 'FILL_IN_BLANK', 'ENUMERATION', 'MATCHING'])
  const invalidQs = questions.filter(
    (q) => q.points <= 0 || (AUTO_GRADED_TYPES.has(q.type) && !q.answer),
  )

  return (
    <div className="space-y-4">
      {/* Validation banner */}
      {!quiz.isPublished && invalidQs.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {invalidQs.length} question{invalidQs.length !== 1 ? 's' : ''} need{invalidQs.length === 1 ? 's' : ''} attention before publishing
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Questions highlighted in amber are missing a correct answer or point value. Fix them to enable publishing.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {questions.length} question{questions.length !== 1 ? 's' : ''} · {quiz.totalPoints} total pts
        </p>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Add Question
        </Button>
      </div>

      {questions.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpen className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No questions yet. Add the first one.</p>
          </div>
        </Card>
      )}

      {questions.map((q) => {
        const hasIssue =
          q.points <= 0 ||
          (AUTO_GRADED_TYPES.has(q.type) && !q.answer)
        return (
          <div key={q.id} className={hasIssue ? 'ring-2 ring-amber-300 ring-offset-1 rounded-2xl' : ''}>
            {hasIssue && (
              <div className="flex items-center gap-2 rounded-t-2xl bg-amber-50 border border-b-0 border-amber-300 px-3 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700">
                  {q.points <= 0 ? 'Points not set' : ''}
                  {q.points <= 0 && AUTO_GRADED_TYPES.has(q.type) && !q.answer ? ' · ' : ''}
                  {AUTO_GRADED_TYPES.has(q.type) && !q.answer ? 'No correct answer' : ''}
                </span>
              </div>
            )}
            <QuestionCard
              q={q}
              onEdit={() => openEdit(q)}
              onDelete={() => setDelTarget(q)}
            />
          </div>
        )
      })}

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Question' : 'Add Question'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Save Changes' : 'Add Question'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Question Type"
            value={form.type}
            onChange={(e) => setF('type', e.target.value as QuizQuestionType)}
          >
            <option value="MCQ">Multiple Choice (MCQ)</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="IDENTIFICATION">Identification</option>
            <option value="FILL_IN_BLANK">Fill in the Blank</option>
            <option value="ESSAY">Essay</option>
            <option value="LONG_RESPONSE">Long Response</option>
            <option value="CODING">Coding</option>
          </Select>

          <Textarea
            label="Question *"
            value={form.question}
            onChange={(e) => setF('question', e.target.value)}
            rows={3}
            placeholder="Enter the question text..."
          />

          <Input
            label="Points"
            type="number"
            min="1"
            value={form.points}
            onChange={(e) => setF('points', e.target.value)}
          />

          {/* Type-specific fields */}
          {form.type === 'MCQ' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 tracking-wide">Options</p>
              <p className="text-[11px] text-slate-400 -mt-1">Select the radio button to mark the correct answer.</p>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={form.correctOption === i}
                    onChange={() => setF('correctOption', i)}
                    className="text-brand-500 focus:ring-brand-500/20"
                    disabled={!opt.trim()}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  />
                </div>
              ))}
            </div>
          )}

          {form.type === 'TRUE_FALSE' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 tracking-wide">Correct Answer</p>
              <div className="flex gap-4">
                {(['True', 'False'] as const).map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input
                      type="radio"
                      name="tf_answer"
                      checked={form.tfAnswer === val}
                      onChange={() => setF('tfAnswer', val)}
                      className="text-brand-500 focus:ring-brand-500/20"
                    />
                    {val}
                  </label>
                ))}
              </div>
            </div>
          )}

          {(form.type === 'IDENTIFICATION' || form.type === 'FILL_IN_BLANK') && (
            <Input
              label="Answer Key"
              value={form.answerKey}
              onChange={(e) => setF('answerKey', e.target.value)}
              placeholder="Accepted answer (case-insensitive match)"
              hint="Students' answers are matched case-insensitively."
            />
          )}

          {(MANUAL_TYPES as string[]).includes(form.type) && (
            <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-100 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">
                This question type requires <strong>manual grading</strong> after submission.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        title="Delete Question"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDelete(delTarget!)}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Remove question <strong>#{delTarget?.order}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

function QuestionCard({
  q, onEdit, onDelete,
}: {
  q: QuizQuestion
  onEdit: () => void
  onDelete: () => void
}) {
  const isManual = (MANUAL_TYPES as string[]).includes(q.type)

  return (
    <Card>
      <div className="flex items-start gap-3">
        {/* Order badge */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600">
          {q.order}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${QTYPE_COLOR[q.type] ?? 'bg-slate-100 text-slate-600'}`}>
              {QTYPE_LABEL[q.type] ?? q.type}
            </span>
            <span className="text-[11px] text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
            {isManual && (
              <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                Manual grading required
              </span>
            )}
          </div>

          <p className="text-sm text-slate-800 font-medium leading-snug">{q.question}</p>

          {/* Type-specific answer display */}
          {q.type === 'MCQ' && q.options && (
            <ul className="mt-2 space-y-1">
              {q.options.map((opt, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${
                    opt === q.answer
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {opt === q.answer
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200" />}
                  {opt}
                </li>
              ))}
            </ul>
          )}

          {q.type === 'TRUE_FALSE' && (
            <p className="mt-2 text-xs text-slate-600">
              Answer: <strong className="text-emerald-700">{q.answer ?? '—'}</strong>
            </p>
          )}

          {(q.type === 'IDENTIFICATION' || q.type === 'FILL_IN_BLANK') && q.answer && (
            <p className="mt-2 text-xs text-slate-600">
              Answer key: <strong className="font-mono text-slate-800">{q.answer}</strong>
            </p>
          )}

          {q.type === 'MATCHING' && q.matchingPairs && (
            <div className="mt-2 space-y-1">
              {q.matchingPairs.map((pair) => (
                <div key={pair.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-medium">{pair.left}</span>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span>{pair.right}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Submissions
// ═══════════════════════════════════════════════════════════════════════════════

function SubmissionsTab({ quiz, rerender }: { quiz: Quiz; rerender: () => void }) {
  const attempts = quiz.attempts ?? []
  const [gradeTarget, setGradeTarget] = useState<QuizAttempt | null>(null)

  if (attempts.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <Users className="h-10 w-10 text-slate-200" />
          <p className="text-sm text-slate-500">No submissions yet.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{attempts.length} submission{attempts.length !== 1 ? 's' : ''}</p>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
              <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Student</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Score</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Submitted</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Time</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4fa]">
            {attempts.map((att) => {
              const canGrade = att.status === 'SUBMITTED' || att.status === 'GRADED'
              return (
                <tr key={att.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{att.studentName ?? att.studentId}</p>
                    {att.studentName && (
                      <p className="text-[11px] font-mono text-slate-400">{att.studentId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AttemptStatusBadge status={att.status} />
                    {att.isFullyGraded && (
                      <span className="ml-1.5 text-[10px] text-emerald-600 font-semibold">✓ Graded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-bold">
                    {att.score !== undefined ? (
                      <span className={att.score / (att.maxScore ?? quiz.totalPoints) >= 0.75 ? 'text-emerald-600' : 'text-amber-600'}>
                        {att.score}/{att.maxScore ?? quiz.totalPoints}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmt(att.submittedAt)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtSeconds(att.timeTakenSeconds)}</td>
                  <td className="px-4 py-3">
                    {canGrade && (
                      <Button size="xs" variant="soft" onClick={() => setGradeTarget(att)}>
                        Grade
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {gradeTarget && (
        <GradeModal
          quiz={quiz}
          attempt={gradeTarget}
          onClose={() => setGradeTarget(null)}
          onSaved={rerender}
        />
      )}
    </div>
  )
}

// ─── Grading modal ─────────────────────────────────────────────────────────────

function GradeModal({
  quiz, attempt, onClose, onSaved,
}: {
  quiz: Quiz
  attempt: QuizAttempt
  onClose: () => void
  onSaved: () => void
}) {
  const questions = [...(quiz.questions ?? [])].sort((a, b) => a.order - b.order)

  const [manualScores, setManualScores] = useState<ManualScores>(() => {
    const init: ManualScores = {}
    questions.filter((q) => (MANUAL_TYPES as string[]).includes(q.type)).forEach((q) => {
      const existing = attempt.answers?.find((a) => a.questionId === q.id)
      init[q.id] = {
        score:    existing?.score?.toString() ?? '',
        feedback: existing?.feedback ?? '',
      }
    })
    return init
  })

  const [totalOverride, setTotalOverride] = useState(
    attempt.score?.toString() ?? '',
  )
  const [saving, setSaving] = useState(false)

  function getStudentAnswer(questionId: string) {
    return attempt.answers?.find((a) => a.questionId === questionId)?.answer
  }

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))

    // Build updated answers array
    if (!attempt.answers) attempt.answers = []

    // Auto-graded questions
    const autoGradedAnswers: StudentAnswer[] = questions
      .filter((q) => isAutoGraded(q.type))
      .map((q) => {
        const given = getStudentAnswer(q.id)
        const correct = checkAnswer(q, given)
        return {
          questionId: q.id,
          answer:     given,
          score:      correct ? q.points : 0,
          maxScore:   q.points,
        }
      })

    // Manual questions
    const manualAnswers: StudentAnswer[] = questions
      .filter((q) => (MANUAL_TYPES as string[]).includes(q.type))
      .map((q) => {
        const ms = manualScores[q.id]
        const given = getStudentAnswer(q.id)
        return {
          questionId: q.id,
          answer:     given,
          score:      ms?.score ? parseFloat(ms.score) : undefined,
          maxScore:   q.points,
          feedback:   ms?.feedback || undefined,
        }
      })

    attempt.answers = [...autoGradedAnswers, ...manualAnswers]

    // Compute total score
    const allScored = [...autoGradedAnswers, ...manualAnswers].every(
      (a) => a.score !== undefined,
    )
    const computedTotal = attempt.answers.reduce(
      (s, a) => s + (a.score ?? 0), 0,
    )

    attempt.score   = totalOverride ? parseFloat(totalOverride) : computedTotal
    attempt.maxScore = quiz.totalPoints
    attempt.status   = 'GRADED' as AttemptStatus
    attempt.isFullyGraded = allScored

    setSaving(false)
    onClose()
    onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Grade Submission"
      description={`${attempt.studentName ?? attempt.studentId} · Submitted ${fmt(attempt.submittedAt)}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving} variant="success">
            Save Grades
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {questions.map((q, qi) => {
          const studentAns = getStudentAnswer(q.id)
          const isManual   = (MANUAL_TYPES as string[]).includes(q.type)
          const isAuto     = isAutoGraded(q.type)
          const correct    = isAuto ? checkAnswer(q, studentAns) : null
          const ms         = manualScores[q.id]

          return (
            <div key={q.id} className="rounded-xl border border-[#e4ebf5] p-4 space-y-3">
              {/* Question header */}
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-600">
                  {qi + 1}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${QTYPE_COLOR[q.type] ?? 'bg-slate-100 text-slate-600'}`}>
                  {QTYPE_LABEL[q.type] ?? q.type}
                </span>
                <span className="text-[11px] text-slate-400">{q.points} pts</span>
                {isAuto && correct !== null && (
                  correct
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                    : <XCircle className="h-4 w-4 text-red-400 ml-auto" />
                )}
              </div>

              <p className="text-sm font-medium text-slate-800">{q.question}</p>

              {/* Student answer */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  Student Answer
                </p>
                <p className={`text-sm ${studentAns ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                  {studentAns ?? 'No answer'}
                </p>
              </div>

              {/* Auto-graded: show result */}
              {isAuto && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                  correct ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
                }`}>
                  {correct
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                  <p className="text-xs">
                    {correct ? (
                      <span className="text-emerald-700 font-semibold">Correct — {q.points} pts awarded</span>
                    ) : (
                      <span className="text-red-600">
                        Incorrect — 0 pts &nbsp;
                        <span className="text-slate-500">Correct: <strong>{q.answer}</strong></span>
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Manual grading fields */}
              {isManual && ms && (
                <div className="space-y-3 border-t border-[#f0f4fa] pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={`Score (0–${q.points})`}
                      type="number"
                      min="0"
                      max={q.points}
                      value={ms.score}
                      onChange={(e) =>
                        setManualScores((p) => ({
                          ...p,
                          [q.id]: { ...p[q.id], score: e.target.value },
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <Textarea
                    label="Feedback (optional)"
                    value={ms.feedback}
                    onChange={(e) =>
                      setManualScores((p) => ({
                        ...p,
                        [q.id]: { ...p[q.id], feedback: e.target.value },
                      }))
                    }
                    rows={2}
                    placeholder="Write feedback for the student..."
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Total override */}
        <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4 space-y-2">
          <p className="text-sm font-semibold text-slate-700">Total Score Override</p>
          <p className="text-xs text-slate-500">
            Leave blank to use computed total. Use this to adjust the final score manually.
          </p>
          <Input
            type="number"
            min="0"
            max={quiz.totalPoints}
            value={totalOverride}
            onChange={(e) => setTotalOverride(e.target.value)}
            placeholder={`Auto-computed / max ${quiz.totalPoints}`}
          />
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4 — Analytics
// ═══════════════════════════════════════════════════════════════════════════════

function AnalyticsTab({ quiz }: { quiz: Quiz }) {
  const attempts  = quiz.attempts ?? []
  const questions = [...(quiz.questions ?? [])].sort((a, b) => a.order - b.order)

  if (attempts.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <BarChart2 className="h-10 w-10 text-slate-200" />
          <p className="text-sm text-slate-500">No submissions yet — analytics will appear here.</p>
        </div>
      </Card>
    )
  }

  const scores = attempts.filter((a) => a.score !== undefined).map((a) => a.score as number)
  const max    = quiz.totalPoints
  const avg    = scores.length > 0 ? scores.reduce((s, n) => s + n, 0) / scores.length : 0
  const highest = scores.length > 0 ? Math.max(...scores) : 0
  const lowest  = scores.length > 0 ? Math.min(...scores) : 0
  const passing = quiz.passingScore ?? Math.round(max * 0.75)
  const passRate = scores.length > 0
    ? Math.round((scores.filter((s) => s >= passing).length / scores.length) * 100)
    : 0

  // Score ranges
  type Range = { label: string; min: number; max: number; color: string }
  const ranges: Range[] = [
    { label: '90–100%', min: 0.90, max: 1.01, color: 'bg-emerald-500' },
    { label: '75–89%',  min: 0.75, max: 0.90, color: 'bg-blue-500' },
    { label: '60–74%',  min: 0.60, max: 0.75, color: 'bg-amber-400' },
    { label: '0–59%',   min: 0,    max: 0.60, color: 'bg-red-400' },
  ]

  const rangeData = ranges.map((r) => {
    const count = scores.filter((s) => {
      const pct = s / max
      return pct >= r.min && pct < r.max
    }).length
    return { ...r, count, pct: scores.length > 0 ? (count / scores.length) * 100 : 0 }
  })

  // Per-question analysis (auto-graded only)
  const autoQuestions = questions.filter((q) => isAutoGraded(q.type))

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatPill label="Total Submissions" value={attempts.length} />
        <StatPill label="Avg Score" value={`${avg.toFixed(1)}/${max}`} />
        <StatPill label="Highest" value={`${highest}/${max}`} />
        <StatPill label="Pass Rate" value={`${passRate}%`} />
      </div>

      {/* Score distribution */}
      <Card>
        <h3 className="text-sm font-bold text-slate-700 mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {rangeData.map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium w-20">{r.label}</span>
                <span className="tabular-nums">{r.count} student{r.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="h-5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${r.color}`}
                  style={{ width: `${Math.max(r.pct, r.count > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Passing threshold: {passing} pts ({Math.round((passing / max) * 100)}%)
          {quiz.passingScore === undefined && ' (default 75%)'}
        </p>
      </Card>

      {/* Per-question analysis */}
      {autoQuestions.length > 0 && (
        <Card>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Per-Question Analysis</h3>
          <div className="space-y-4">
            {autoQuestions.map((q) => {
              const answeredAttempts = attempts.filter((a) => a.answers)
              const correctCount = answeredAttempts.filter((a) => {
                const ans = a.answers?.find((x) => x.questionId === q.id)
                return checkAnswer(q, ans?.answer)
              }).length
              const pctCorrect = answeredAttempts.length > 0
                ? Math.round((correctCount / answeredAttempts.length) * 100)
                : 0
              const avgPts = answeredAttempts.length > 0
                ? answeredAttempts.reduce((s, a) => {
                    const ans = a.answers?.find((x) => x.questionId === q.id)
                    return s + (ans?.score ?? 0)
                  }, 0) / answeredAttempts.length
                : 0

              return (
                <div key={q.id} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2 flex-1">
                      Q{q.order}: {q.question}
                    </p>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-slate-800 tabular-nums">{pctCorrect}% correct</span>
                      <p className="text-[11px] text-slate-400">Avg {avgPts.toFixed(1)}/{q.points} pts</p>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pctCorrect >= 75 ? 'bg-emerald-400' : pctCorrect >= 50 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${pctCorrect}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {autoQuestions.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-4">
            Per-question analysis is only available for auto-graded question types.
          </p>
        </Card>
      )}
    </div>
  )
}
