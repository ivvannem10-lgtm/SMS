'use client'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Lock,
  ClipboardList, PenLine, FileText, Star, ChevronRight,
} from 'lucide-react'
import {
  MOCK_ENROLLMENTS, MOCK_OFFERINGS, MOCK_GRADE_SUBMISSIONS, LOCKED_OFFERINGS,
  MOCK_QUIZZES, MOCK_ASSIGNMENTS, MOCK_PERFORMANCE_TASKS,
} from '@/lib/mock-data'
import { formatDate, cn } from '@/lib/utils'
import type { SessionUser } from '@/types'
import { useSession } from 'next-auth/react'

interface PendingItem {
  id: string
  type: 'quiz' | 'assignment' | 'pt'
  title: string
  studentName: string
  studentId: string
  submittedAt: string
  href: string
  questionCount?: number
}

export default function GradesPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const { data: session } = useSession()

  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.offeringId === offeringId)
  const offering    = MOCK_OFFERINGS.find((o) => o.id === offeringId)
  const submission  = MOCK_GRADE_SUBMISSIONS.find((s) => s.offeringId === offeringId)
  const locked      = LOCKED_OFFERINGS.has(offeringId)

  // ── Pending manual grading items ──────────────────────────────────────────

  const pendingItems: PendingItem[] = []

  const manualQTypes = ['ESSAY', 'LONG_RESPONSE', 'CODING', 'FILE_UPLOAD']

  MOCK_QUIZZES.filter(q => q.offeringId === offeringId && q.isPublished).forEach((quiz) => {
    const hasManual = (quiz.questions ?? []).some(q => manualQTypes.includes(q.type))
    if (!hasManual) return
    ;(quiz.attempts ?? []).filter(a => !a.isFullyGraded && a.submittedAt).forEach((attempt) => {
      if (!enrollments.find(e => e.studentId === attempt.studentId)) return
      const ungradedCount = (attempt.answers ?? []).filter(ans => {
        const q = (quiz.questions ?? []).find(q => q.id === ans.questionId)
        return q && manualQTypes.includes(q.type) && ans.score === undefined
      }).length
      if (ungradedCount === 0) return
      pendingItems.push({
        id: attempt.id, type: 'quiz', title: quiz.title,
        studentName: attempt.studentName ?? attempt.studentId,
        studentId: attempt.studentId, submittedAt: attempt.submittedAt!,
        href: `/teacher/subjects/${offeringId}/quizzes/${quiz.id}`,
        questionCount: ungradedCount,
      })
    })
  })

  MOCK_ASSIGNMENTS.filter(a => a.offeringId === offeringId && a.isPublished).forEach((asgn) => {
    ;(asgn.submissions ?? []).filter(s => s.grade === undefined && s.content).forEach((sub) => {
      if (!enrollments.find(e => e.studentId === sub.studentId)) return
      pendingItems.push({
        id: sub.id, type: 'assignment', title: asgn.title,
        studentName: sub.studentId, studentId: sub.studentId,
        submittedAt: sub.submittedAt,
        href: `/teacher/subjects/${offeringId}/assignments`,
      })
    })
  })

  MOCK_PERFORMANCE_TASKS.filter(t => t.offeringId === offeringId && t.isPublished).forEach((task) => {
    ;(task.submissions ?? []).filter(s => s.finalScore === undefined && s.submittedAt).forEach((sub) => {
      if (!enrollments.find(e => e.studentId === sub.studentId)) return
      pendingItems.push({
        id: sub.id, type: 'pt', title: task.title,
        studentName: sub.studentName ?? sub.studentId,
        studentId: sub.studentId, submittedAt: sub.submittedAt,
        href: `/teacher/subjects/${offeringId}/performance-tasks/${task.id}`,
      })
    })
  })

  const TYPE_META = {
    quiz:       { icon: ClipboardList, label: 'Quiz / Exam',      color: 'bg-violet-50 text-violet-600 border-violet-200' },
    assignment: { icon: FileText,      label: 'Assignment',        color: 'bg-blue-50 text-blue-600 border-blue-200' },
    pt:         { icon: Star,          label: 'Performance Task',  color: 'bg-rose-50 text-rose-600 border-rose-200' },
  }

  return (
    <div className="max-w-4xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>

      {/* Status banners */}
      {submission?.status === 'SUBMITTED' && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Grades Submitted — Under Registrar Review</p>
            <p className="text-xs text-amber-600">Grade book is locked until the Registrar closes or returns the submission.</p>
          </div>
        </div>
      )}
      {submission?.status === 'CLOSED' && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Lock className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Submission Closed — Pending Publication</p>
            <p className="text-xs text-blue-600">Closed by {submission.closedBy} · The Registrar will publish grades once verified.</p>
          </div>
        </div>
      )}
      {submission?.status === 'PUBLISHED' && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Grades Published</p>
            <p className="text-xs text-emerald-600">Published by {submission.publishedBy} · Grades are now visible in student profiles.</p>
          </div>
        </div>
      )}
      {submission?.status === 'RETURNED' && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <XCircle className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">Grades Returned — Corrections Needed</p>
            <p className="text-xs text-red-600">Reason: {submission.returnReason}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="h-4.5 w-4.5 text-brand-500" />
          <h1 className="text-lg font-bold text-slate-900">Pending Manual Grading</h1>
          {pendingItems.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-2xs font-bold text-white">
              {pendingItems.length}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 ml-6">
          Essays, coding questions, and ungraded assignments that require your review.
          Calculated grades are submitted from{' '}
          <Link href="/teacher/grades" className="text-brand-500 hover:underline">Grade Finalization</Link>.
        </p>
      </div>

      {/* Pending items */}
      {pendingItems.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] px-6 py-10 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">All submissions are graded</p>
            <p className="text-xs text-slate-400 mt-0.5">
              No essays, coding questions, or ungraded assignments remaining.
              You can now submit grades from{' '}
              <Link href="/teacher/grades" className="text-brand-500 hover:underline">Grade Finalization</Link>.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f0f4fa] border-b border-[#dce8f7]">
              <tr>
                {['Assessment', 'Type', 'Student', 'Submitted', 'Pending', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-2xs font-bold uppercase tracking-widest text-brand-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4fa]">
              {pendingItems.map((item) => {
                const meta = TYPE_META[item.type]
                return (
                  <tr key={item.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', meta.color)}>
                        <meta.icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-2xs font-bold">
                          {item.studentName.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm text-slate-700">{item.studentName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(item.submittedAt)}</td>
                    <td className="px-4 py-3">
                      {item.questionCount ? (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          {item.questionCount} question{item.questionCount !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Ungraded</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={item.href}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
                        Grade <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
