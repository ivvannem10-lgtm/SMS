'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, HelpCircle, Clock, Eye, EyeOff, Trash2, Users, ChevronRight, BarChart2, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MOCK_QUIZZES } from '@/lib/mock-data'
import { Quiz, AssessmentType } from '@/types'
import { useConfirm } from '@/components/shared/ConfirmDialog'

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'QUIZ',            label: 'Quiz' },
  { value: 'LONG_QUIZ',       label: 'Long Quiz' },
  { value: 'PRACTICAL_EXAM',  label: 'Practical Exam' },
  { value: 'MIDTERM_EXAM',    label: 'Midterm Exam' },
  { value: 'FINAL_EXAM',      label: 'Final Exam' },
  { value: 'ASSIGNMENT_EXAM', label: 'Assignment Exam' },
  { value: 'ORAL_ASSESSMENT', label: 'Oral Assessment' },
  { value: 'LABORATORY',      label: 'Laboratory Assessment' },
]

const TYPE_COLOR: Record<string, string> = {
  QUIZ:            'bg-amber-50 text-amber-700',
  LONG_QUIZ:       'bg-orange-50 text-orange-700',
  MIDTERM_EXAM:    'bg-brand-50 text-brand-700',
  FINAL_EXAM:      'bg-red-50 text-red-700',
  PRACTICAL_EXAM:  'bg-violet-50 text-violet-700',
  ORAL_ASSESSMENT: 'bg-teal-50 text-teal-700',
  LABORATORY:      'bg-emerald-50 text-emerald-700',
  ASSIGNMENT_EXAM: 'bg-slate-100 text-slate-600',
}

function typeLabel(t?: string) {
  return ASSESSMENT_TYPES.find(x => x.value === t)?.label ?? 'Quiz'
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function TeacherQuizzesPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const quizzes = MOCK_QUIZZES.filter(q => q.offeringId === offeringId)

  const confirm = useConfirm()

  const [open, setOpen]           = useState(false)
  const [saving, setSaving]       = useState(false)
  const [delTarget, setDelTarget] = useState<Quiz | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', instructions: '',
    assessmentType: 'QUIZ' as AssessmentType,
    duration: '30', totalPoints: '50', passingScore: '',
    startDate: '', endDate: '', maxAttempts: '1',
    showResultsImmediately: true,
  })

  function setF(field: string, val: string | boolean) {
    setForm(p => ({ ...p, [field]: val }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    MOCK_QUIZZES.push({
      id: `quiz_${Date.now()}`,
      offeringId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      instructions: form.instructions.trim() || undefined,
      assessmentType: form.assessmentType,
      duration: parseInt(form.duration) || 30,
      totalPoints: parseInt(form.totalPoints) || 50,
      passingScore: form.passingScore ? parseInt(form.passingScore) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      maxAttempts: parseInt(form.maxAttempts) || 1,
      showResultsImmediately: form.showResultsImmediately,
      isPublished: false,
      visibility: 'DRAFT',
      shuffleQuestions: false,
      shuffleOptions: false,
      showCorrectAnswers: false,
      questions: [],
      attempts: [],
      createdAt: new Date().toISOString(),
    })
    setForm({ title: '', description: '', instructions: '', assessmentType: 'QUIZ', duration: '30', totalPoints: '50', passingScore: '', startDate: '', endDate: '', maxAttempts: '1', showResultsImmediately: true })
    setSaving(false)
    setOpen(false)
  }

  const [validationTarget, setValidationTarget]   = useState<Quiz | null>(null)
  const [validationErrors, setValidationErrors]   = useState<string[]>([])

  const AUTO_GRADED = new Set(['MCQ', 'TRUE_FALSE', 'IDENTIFICATION', 'FILL_IN_BLANK', 'ENUMERATION', 'MATCHING'])

  async function validateAndPublish(quiz: Quiz) {
    if (quiz.isPublished) {
      const ok = await confirm({
        title: 'Unpublish Assessment?',
        message: 'Students will lose access to this assessment.',
        variant: 'warning',
        confirmLabel: 'Unpublish',
      })
      if (!ok) return
      quiz.isPublished = false
      quiz.visibility  = 'DRAFT'
      return
    }
    // Collect issues
    const issues: string[] = []
    const qs = quiz.questions ?? []
    if (qs.length === 0) {
      issues.push('No questions have been added to this assessment.')
    }
    qs.forEach((q, i) => {
      if (q.points <= 0)
        issues.push(`Q${i + 1}: "${q.question.slice(0, 40)}…" — points not assigned (currently ${q.points}).`)
      if (AUTO_GRADED.has(q.type) && !q.answer)
        issues.push(`Q${i + 1}: "${q.question.slice(0, 40)}…" — no correct answer set (${q.type}).`)
    })
    if (issues.length > 0) {
      setValidationTarget(quiz)
      setValidationErrors(issues)
    } else {
      quiz.isPublished = true
      quiz.visibility  = 'PUBLISHED'
    }
  }

  function confirmDelete(quiz: Quiz) {
    const idx = MOCK_QUIZZES.findIndex(q => q.id === quiz.id)
    if (idx !== -1) MOCK_QUIZZES.splice(idx, 1)
    setDelTarget(null)
  }

  // Summary stats
  const totalAttempts = quizzes.reduce((s, q) => s + (q.attempts?.length ?? 0), 0)
  const pendingGrade  = quizzes.reduce((s, q) =>
    s + (q.attempts?.filter(a => !a.isFullyGraded && a.submittedAt).length ?? 0), 0)
  const publishedCount = quizzes.filter(q => q.isPublished).length

  return (
    <div className="max-w-4xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500">{quizzes.length} assessment{quizzes.length !== 1 ? 's' : ''} · {publishedCount} published</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Create Assessment</Button>
      </div>

      {/* Stats row */}
      {quizzes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Published', value: publishedCount, icon: Eye, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Total Submissions', value: totalAttempts, icon: Users, color: 'text-brand-700 bg-brand-50' },
            { label: 'Pending Grading', value: pendingGrade, icon: ClipboardCheck, color: pendingGrade > 0 ? 'text-amber-700 bg-amber-50' : 'text-slate-500 bg-slate-50' },
          ].map(s => (
            <Card key={s.label} padding="sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color} shrink-0`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-[11px] text-slate-500">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assessment list */}
      {quizzes.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <HelpCircle className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No assessments yet. Create your first one to get started.</p>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Create Assessment</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => {
            const attemptCount  = quiz.attempts?.length ?? 0
            const pendingCount  = quiz.attempts?.filter(a => !a.isFullyGraded && a.submittedAt).length ?? 0
            const avgScore      = attemptCount > 0
              ? Math.round(quiz.attempts!.reduce((s, a) => s + (a.score ?? 0), 0) / attemptCount)
              : null

            return (
              <div key={quiz.id} className="rounded-2xl border border-[#e4ebf5] bg-white shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 shrink-0">
                    <HelpCircle className="h-5 w-5 text-amber-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_COLOR[quiz.assessmentType ?? 'QUIZ'] ?? 'bg-amber-50 text-amber-700'}`}>
                        {typeLabel(quiz.assessmentType)}
                      </span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${quiz.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {quiz.isPublished ? '● Published' : 'Draft'}
                      </span>
                      {pendingCount > 0 && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">
                          {pendingCount} needs grading
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">{quiz.title}</p>
                    {quiz.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{quiz.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {quiz.duration} min</span>
                      <span>{quiz.totalPoints} pts{quiz.passingScore ? ` · Pass: ${quiz.passingScore}` : ''}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {attemptCount} submitted</span>
                      {avgScore !== null && <span className="text-brand-600 font-medium">Avg: {avgScore}/{quiz.totalPoints}</span>}
                      <span className="flex items-center gap-1"><BarChart2 className="h-3 w-3" /> {quiz.questions?.length ?? 0} questions</span>
                    </div>
                    {(quiz.startDate || quiz.endDate) && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {fmtDate(quiz.startDate)} – {fmtDate(quiz.endDate)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Link
                      href={`/teacher/subjects/${offeringId}/quizzes/${quiz.id}`}
                      className="flex items-center gap-1 rounded-lg bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      Manage <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => validateAndPublish(quiz)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {quiz.isPublished ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {quiz.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => setDelTarget(quiz)}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Assessment" size="lg"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Create Assessment</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Title *" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g., Midterm Exam: Python Programming" required />
            </div>
            <Select label="Assessment Type *" value={form.assessmentType} onChange={e => setF('assessmentType', e.target.value)}>
              {ASSESSMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Input label="Max Attempts" type="number" min="1" value={form.maxAttempts} onChange={e => setF('maxAttempts', e.target.value)} />
            <div className="col-span-2">
              <Textarea label="Description" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="What does this assessment cover?" rows={2} />
            </div>
            <div className="col-span-2">
              <Textarea label="Instructions for Students" value={form.instructions} onChange={e => setF('instructions', e.target.value)} placeholder="Read each question carefully…" rows={2} />
            </div>
            <Input label="Duration (minutes) *" type="number" min="5" value={form.duration} onChange={e => setF('duration', e.target.value)} />
            <Input label="Total Points *" type="number" min="1" value={form.totalPoints} onChange={e => setF('totalPoints', e.target.value)} />
            <Input label="Passing Score" type="number" min="0" value={form.passingScore} onChange={e => setF('passingScore', e.target.value)} placeholder="e.g., 60" />
            <div />
            <Input label="Start Date & Time" type="datetime-local" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
            <Input label="End Date & Time" type="datetime-local" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              id="showResults"
              checked={form.showResultsImmediately}
              onChange={e => setF('showResultsImmediately', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            <label htmlFor="showResults" className="text-sm text-slate-700">Release results to students immediately after submission</label>
          </div>
          <p className="text-[11px] text-slate-400">After creating, go to the assessment page to add questions.</p>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Delete Assessment" size="sm"
        footer={<><Button variant="outline" onClick={() => setDelTarget(null)}>Cancel</Button><Button variant="danger" onClick={() => confirmDelete(delTarget!)}>Delete</Button></>}>
        <p className="text-sm text-slate-600">
          Delete <strong>{delTarget?.title}</strong>? All submissions and attempts will be lost.
        </p>
      </Modal>

      {/* Publish validation modal */}
      <Modal
        open={!!validationTarget}
        onClose={() => setValidationTarget(null)}
        title="Cannot Publish Assessment"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setValidationTarget(null)}>Close</Button>
            <Button
              onClick={() => {
                window.location.href = `/teacher/subjects/${offeringId}/quizzes/${validationTarget?.id}`
              }}
            >
              Go to Question Builder
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">
                Assessment cannot be published — fix the following issues first:
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Students will not be able to see or attempt this assessment until all issues are resolved.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {validationErrors.map((err, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">{i + 1}</span>
                <span className="text-sm text-slate-700">{err}</span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  )
}
