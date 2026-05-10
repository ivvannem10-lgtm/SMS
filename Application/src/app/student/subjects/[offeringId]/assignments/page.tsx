'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, CalendarDays, CheckCircle2, Clock, Lock, ChevronDown, ChevronUp, Upload, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { MOCK_ASSIGNMENTS, MOCK_STUDENTS, MOCK_ENROLLMENTS } from '@/lib/mock-data'
import { Assignment, AssignmentSubmission } from '@/types'

const student = MOCK_STUDENTS[0]

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function isOverdue(dueDate?: string) {
  return dueDate ? new Date(dueDate) < new Date() : false
}

export default function StudentAssignmentsPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const enrollment = MOCK_ENROLLMENTS.find(e => e.offeringId === offeringId && e.studentId === student.id)
  const isLocked = !enrollment || enrollment.status !== 'ENROLLED'

  const assignments = MOCK_ASSIGNMENTS.filter(a => a.offeringId === offeringId && a.isPublished)

  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function getMySubmission(asgn: Assignment): AssignmentSubmission | undefined {
    return asgn.submissions?.find(s => s.studentId === student.id)
  }

  async function handleSubmit() {
    if (!submitTarget || !content.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    const overdue = isOverdue(submitTarget.dueDate)
    const existing = getMySubmission(submitTarget)
    if (!existing) {
      submitTarget.submissions = submitTarget.submissions ?? []
      submitTarget.submissions.push({
        id: `sub_${Date.now()}`,
        assignmentId: submitTarget.id,
        studentId: student.id,
        content: content.trim(),
        isLate: overdue,
        submittedAt: new Date().toISOString(),
      })
    }
    setContent('')
    setSubmitting(false)
    setSubmitTarget(null)
  }

  if (isLocked) {
    return (
      <div className="max-w-3xl space-y-5">
        <Link href={`/student/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to Course
        </Link>
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-amber-900">LMS Access Locked</p>
            <p className="text-sm text-amber-700">Assignments are only available to officially enrolled students.</p>
          </div>
        </Card>
      </div>
    )
  }

  const totalCount    = assignments.length
  const submittedCount = assignments.filter(a => getMySubmission(a)).length
  const gradedCount   = assignments.filter(a => {
    const s = getMySubmission(a)
    return s && s.grade !== undefined
  }).length
  const pendingCount  = totalCount - submittedCount

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={`/student/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Assignments</h1>
        <p className="text-sm text-slate-500">{totalCount} assignment{totalCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: pendingCount, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Submitted', count: submittedCount, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { label: 'Graded', count: gradedCount, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-3 py-2.5 text-center ${s.color}`}>
            <p className="text-xl font-bold">{s.count}</p>
            <p className="text-[11px] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {totalCount === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12">
            <ClipboardList className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No assignments published yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map(asgn => {
            const submission = getMySubmission(asgn)
            const overdue    = isOverdue(asgn.dueDate)
            const isOpen     = expanded.has(asgn.id)

            let statusBadge: React.ReactNode
            if (submission?.grade !== undefined) {
              statusBadge = <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Graded</span>
            } else if (submission) {
              statusBadge = <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-blue-50 text-blue-700"><CheckCircle2 className="h-3 w-3" /> Submitted{submission.isLate ? ' (Late)' : ''}</span>
            } else if (overdue) {
              statusBadge = <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-red-50 text-red-700"><Clock className="h-3 w-3" /> Overdue</span>
            } else {
              statusBadge = <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-amber-50 text-amber-700"><Clock className="h-3 w-3" /> Pending</span>
            }

            return (
              <div key={asgn.id} className="rounded-2xl border border-[#e4ebf5] bg-white shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 shrink-0">
                    <ClipboardList className="h-5 w-5 text-violet-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      {statusBadge}
                    </div>
                    <p className="font-semibold text-slate-900">{asgn.title}</p>
                    {asgn.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{asgn.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className={`flex items-center gap-1 ${overdue && !submission ? 'text-red-600 font-semibold' : ''}`}>
                        <CalendarDays className="h-3 w-3" />
                        Due: {fmtDate(asgn.dueDate)}
                      </span>
                      <span>{asgn.totalPoints} pts</span>
                      {submission?.grade !== undefined && (
                        <span className={`font-bold ${submission.grade / asgn.totalPoints >= 0.75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          Score: {submission.grade}/{asgn.totalPoints} ({Math.round(submission.grade / asgn.totalPoints * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {!submission && !overdue && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Upload className="h-3.5 w-3.5" />}
                        onClick={() => { setSubmitTarget(asgn); setContent('') }}
                      >
                        Submit
                      </Button>
                    )}
                    {submission && (
                      <button
                        onClick={() => toggleExpand(asgn.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {isOpen ? 'Hide' : 'View'}
                        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Submission detail */}
                {submission && isOpen && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Your Submission</p>
                    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap">
                      {submission.content ?? '—'}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                      <span>Submitted: {fmtDate(submission.submittedAt)}</span>
                      {submission.isLate && <span className="text-red-500 font-semibold">Late submission</span>}
                    </div>
                    {submission.feedback && (
                      <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
                        <p className="text-[11px] font-bold text-brand-700 uppercase tracking-wide mb-1">Instructor Feedback</p>
                        <p className="text-xs text-slate-700">{submission.feedback}</p>
                      </div>
                    )}
                    {submission.grade !== undefined && (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <span className="text-xs font-semibold text-emerald-700">Final Grade</span>
                        <span className="text-lg font-bold text-emerald-700">{submission.grade}/{asgn.totalPoints}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Submit modal */}
      <Modal
        open={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        title={`Submit: ${submitTarget?.title}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSubmitTarget(null)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!content.trim()}>
              Submit Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {submitTarget && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-600">
              <p className="font-semibold">{submitTarget.description}</p>
              <p className="mt-1 text-slate-400">Due: {fmtDate(submitTarget.dueDate)} · {submitTarget.totalPoints} pts</p>
              {isOverdue(submitTarget.dueDate) && (
                <p className="mt-1 text-red-600 font-semibold">⚠ This assignment is past due. Your submission will be marked as late.</p>
              )}
            </div>
          )}
          <Textarea
            label="Your Answer / Response *"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your answer here…"
            rows={6}
            required
          />
          <p className="text-[11px] text-slate-400">File upload is available in the full version. For now, paste your answer or code in the text field above.</p>
        </div>
      </Modal>
    </div>
  )
}
