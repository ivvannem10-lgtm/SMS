'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Star, Lock, CalendarDays, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Upload, BarChart2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { MOCK_PERFORMANCE_TASKS, MOCK_STUDENTS, MOCK_ENROLLMENTS } from '@/lib/mock-data'
import type { PerformanceTask, PTSubmission } from '@/types'

const student = MOCK_STUDENTS[0]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function isOverdue(dueDate?: string) {
  return dueDate ? new Date(dueDate) < new Date() : false
}

// ─── Level color by label ─────────────────────────────────────────────────────

const LEVEL_BG: Record<string, string> = {
  Excellent: 'bg-emerald-50 text-emerald-700',
  Good:      'bg-blue-50 text-blue-700',
  Fair:      'bg-amber-50 text-amber-700',
  Poor:      'bg-red-50 text-red-700',
}

function levelBg(label: string) {
  return LEVEL_BG[label] ?? 'bg-slate-50 text-slate-700'
}

// ─── Rubric table ─────────────────────────────────────────────────────────────

function RubricTable({
  task,
  mySubmission,
}: {
  task: PerformanceTask
  mySubmission?: PTSubmission
}) {
  const rubric = task.rubric
  if (!rubric) {
    return <p className="text-xs text-slate-400 italic">No rubric attached.</p>
  }

  // Map criterionId → selected levelId for the graded submission
  const selectedLevels: Record<string, string> = {}
  if (mySubmission?.criteriaScores) {
    for (const cs of mySubmission.criteriaScores) {
      selectedLevels[cs.criterionId] = cs.levelId
    }
  }

  const LEVEL_LABELS = ['Excellent', 'Good', 'Fair', 'Poor']

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#f0f4fa]">
            <th className="text-left px-3 py-2 font-semibold text-brand-700 uppercase tracking-wide border-b border-[#dce8f7] rounded-tl-lg">Criterion</th>
            <th className="text-center px-2 py-2 font-semibold text-brand-700 uppercase tracking-wide border-b border-[#dce8f7] whitespace-nowrap">Wt.</th>
            {LEVEL_LABELS.map(l => (
              <th key={l} className={`text-center px-2 py-2 font-semibold uppercase tracking-wide border-b border-[#dce8f7] ${levelBg(l)}`}>
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rubric.criteria.map((crit) => {
            const selectedLevelId = selectedLevels[crit.id]
            return (
              <tr key={crit.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-3 py-2.5 font-medium text-slate-800 align-top">
                  <div>{crit.name}</div>
                  {crit.description && (
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">{crit.description}</div>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center font-semibold text-slate-600 align-top whitespace-nowrap">
                  {crit.weight}%
                </td>
                {LEVEL_LABELS.map(label => {
                  const lvl = crit.levels.find(l => l.label === label)
                  if (!lvl) return <td key={label} className="px-2 py-2.5 text-center text-slate-300">—</td>
                  const isSelected = selectedLevelId === lvl.id
                  return (
                    <td
                      key={label}
                      className={`px-2 py-2.5 align-top rounded ${
                        isSelected
                          ? 'bg-brand-50 ring-2 ring-brand-500 ring-inset'
                          : ''
                      }`}
                    >
                      <div className={`text-center font-bold ${isSelected ? 'text-brand-700' : 'text-slate-600'}`}>
                        {lvl.score}
                      </div>
                      {lvl.description && (
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`}>
                          {lvl.description}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Formula preview */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {rubric.criteria.map(crit => {
          const cs = mySubmission?.criteriaScores?.find(s => s.criterionId === crit.id)
          if (!cs) return null
          return (
            <span key={crit.id} className="text-[10px] text-slate-500">
              <span className="font-semibold text-slate-700">{crit.name}</span>
              {' '}({crit.weight}%): {cs.score} × {crit.weight}% = <span className="text-brand-600 font-semibold">{cs.weightedScore.toFixed(1)} pts</span>
            </span>
          )
        })}
      </div>

      {mySubmission?.finalScore !== undefined && (
        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-brand-700">
          <BarChart2 className="h-4 w-4" />
          Total: {mySubmission.finalScore.toFixed(1)} / {task.totalPoints}
        </div>
      )}
    </div>
  )
}

// ─── Grade breakdown ──────────────────────────────────────────────────────────

function GradeBreakdown({
  task,
  submission,
}: {
  task: PerformanceTask
  submission: PTSubmission
}) {
  if (!submission.criteriaScores || submission.finalScore === undefined) return null

  const score = submission.finalScore
  const total = task.totalPoints
  const pct = Math.round((score / total) * 100)
  const passed = score >= 75

  return (
    <div className="border-t border-rose-100 bg-rose-50/40 px-4 py-4 space-y-4">
      {/* Score display */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Final Score</p>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums leading-none mt-0.5">
            {score.toFixed(1)}
            <span className="text-base font-semibold text-slate-400"> / {total}</span>
          </p>
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase ${
          passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {passed ? 'Passed' : 'Failed'}
        </div>
      </div>

      {/* Percentage bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Score percentage</span>
          <span className="font-semibold text-slate-700">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${passed ? 'bg-emerald-500' : 'bg-red-400'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Per-criterion breakdown */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Criterion Breakdown</p>
        <div className="space-y-2">
          {submission.criteriaScores.map(cs => {
            const crit = task.rubric?.criteria.find(c => c.id === cs.criterionId)
            const lvl  = crit?.levels.find(l => l.id === cs.levelId)
            if (!crit) return null
            return (
              <div key={cs.criterionId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{crit.name}</p>
                  {lvl && (
                    <span className={`mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-bold ${levelBg(lvl.label)}`}>
                      {lvl.label} — {cs.score} pts
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">{crit.weight}% weight</p>
                  <p className="text-sm font-bold text-brand-600">+{cs.weightedScore.toFixed(1)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructor feedback */}
      {submission.feedback && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-3">
          <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide mb-1">Instructor Feedback</p>
          <p className="text-xs text-slate-700 leading-relaxed">{submission.feedback}</p>
        </div>
      )}

      {submission.gradedBy && (
        <p className="text-[10px] text-slate-400">
          Graded by <span className="font-semibold">{submission.gradedBy}</span>
          {submission.gradedAt && <> · {fmtDate(submission.gradedAt)}</>}
        </p>
      )}
    </div>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: PerformanceTask }) {
  const mySubmission = task.submissions?.find(s => s.studentId === student.id)
  const overdue = isOverdue(task.dueDate)

  const isGraded    = !!mySubmission?.finalScore !== undefined && mySubmission?.gradedAt !== undefined
  const isSubmitted = !!mySubmission
  const isGradedFull = isSubmitted && mySubmission.gradedAt !== undefined && mySubmission.criteriaScores !== undefined

  const [rubricOpen, setRubricOpen] = useState(false)
  const [gradeOpen, setGradeOpen]   = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [content, setContent]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    task.submissions = task.submissions ?? []
    task.submissions.push({
      id: `pts_${Date.now()}`,
      taskId: task.id,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      content: content.trim(),
      submittedAt: new Date().toISOString(),
      isLate: isOverdue(task.dueDate),
    })
    setContent('')
    setSubmitting(false)
    setSubmitOpen(false)
  }

  // Status badge
  let statusBadge: React.ReactNode
  if (isGradedFull) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Graded
      </span>
    )
  } else if (isSubmitted) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
        <CheckCircle2 className="h-3 w-3" /> Submitted{mySubmission.isLate ? ' (Late)' : ''}
      </span>
    )
  } else if (overdue) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
        <Clock className="h-3 w-3" /> Overdue
      </span>
    )
  } else {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" /> Pending
      </span>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-[#e4ebf5] bg-white shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-start gap-4 p-4">
          {/* Icon */}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 shrink-0">
            <Star className="h-5 w-5 text-rose-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase bg-rose-50 text-rose-700 border-rose-200">
                <Star className="h-2.5 w-2.5" /> Performance Task
              </span>
              {statusBadge}
            </div>
            <p className="font-semibold text-slate-900">{task.title}</p>
            {task.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-500">
              {task.dueDate && (
                <span className={`flex items-center gap-1 ${overdue && !isSubmitted ? 'text-red-600 font-semibold' : ''}`}>
                  <CalendarDays className="h-3 w-3" />
                  Due: {fmtDate(task.dueDate)}
                  {overdue && !isSubmitted && <span className="ml-0.5">(Overdue)</span>}
                </span>
              )}
              <span>{task.totalPoints} pts</span>
              {isGradedFull && mySubmission.finalScore !== undefined && (
                <span className={`font-bold ${mySubmission.finalScore >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Score: {mySubmission.finalScore.toFixed(1)}/{task.totalPoints}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            {!isSubmitted && !overdue && (
              <Button
                variant="primary"
                size="sm"
                icon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => setSubmitOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
              >
                Submit Work
              </Button>
            )}
            {isSubmitted && !isGradedFull && (
              <button
                disabled
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed"
              >
                <Clock className="h-3.5 w-3.5" />
                Awaiting Grade
              </button>
            )}
            {isGradedFull && (
              <Button
                variant="outline"
                size="sm"
                icon={<BarChart2 className="h-3.5 w-3.5" />}
                onClick={() => setGradeOpen(v => !v)}
              >
                {gradeOpen ? 'Hide Grade' : 'View Grade'}
              </Button>
            )}
          </div>
        </div>

        {/* View Rubric toggle */}
        <div className="border-t border-slate-100">
          <button
            onClick={() => setRubricOpen(v => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-rose-500" />
              {rubricOpen ? 'Hide Rubric' : 'View Rubric'}
              {task.rubric && (
                <span className="text-slate-400 font-normal">— {task.rubric.title}</span>
              )}
            </span>
            {rubricOpen
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {rubricOpen && (
            <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/60">
              <RubricTable task={task} mySubmission={isGradedFull ? mySubmission : undefined} />
            </div>
          )}
        </div>

        {/* Grade breakdown */}
        {isGradedFull && gradeOpen && mySubmission && (
          <GradeBreakdown task={task} submission={mySubmission} />
        )}
      </div>

      {/* Submit modal */}
      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title={`Submit: ${task.title}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!content.trim()}
              className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white"
            >
              Submit Work
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Task meta */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">{task.title}</p>
            <p className="text-slate-400">
              Due: {fmtDate(task.dueDate)} · {task.totalPoints} pts
            </p>
            {isOverdue(task.dueDate) && (
              <p className="text-red-600 font-semibold">
                ⚠ This task is past due. Your submission will be marked as late.
              </p>
            )}
          </div>

          {/* Instructions */}
          {task.instructions && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Instructions</p>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {task.instructions}
              </div>
            </div>
          )}

          {/* Response textarea */}
          <Textarea
            label="Your Response / Answer *"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your response here…"
            rows={7}
            required
          />
          <p className="text-[11px] text-slate-400">
            File upload is available in the full version. Paste your response here.
          </p>
        </div>
      </Modal>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentPerformanceTasksPage({
  params,
}: {
  params: { offeringId: string }
}) {
  const { offeringId } = params

  const enrollment = MOCK_ENROLLMENTS.find(
    e => e.offeringId === offeringId && e.studentId === student.id,
  )
  const isLocked = !enrollment || enrollment.status !== 'ENROLLED'

  if (isLocked) {
    return (
      <div className="max-w-3xl space-y-5">
        <Link
          href={`/student/subjects/${offeringId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Course
        </Link>
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-amber-900">LMS Access Locked</p>
            <p className="text-sm text-amber-700">
              Performance tasks are only available to officially enrolled students.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const tasks = MOCK_PERFORMANCE_TASKS.filter(
    t => t.offeringId === offeringId && t.isPublished,
  )

  const totalCount     = tasks.length
  const submittedCount = tasks.filter(t => t.submissions?.some(s => s.studentId === student.id)).length
  const gradedCount    = tasks.filter(t =>
    t.submissions?.some(s => s.studentId === student.id && s.gradedAt !== undefined && s.criteriaScores !== undefined)
  ).length
  const pendingCount   = totalCount - submittedCount

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href={`/student/subjects/${offeringId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Performance Tasks
          <span className="ml-2 text-base font-normal text-slate-400">({totalCount})</span>
        </h1>
        <p className="text-sm text-slate-500">Rubric-based assessments</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending',   count: pendingCount,   color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Submitted', count: submittedCount, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { label: 'Graded',    count: gradedCount,    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        ].map(s => (
          <div
            key={s.label}
            className={`rounded-xl border px-3 py-2.5 text-center ${s.color}`}
          >
            <p className="text-xl font-bold">{s.count}</p>
            <p className="text-[11px] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task list */}
      {totalCount === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12">
            <Star className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No performance tasks published yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
