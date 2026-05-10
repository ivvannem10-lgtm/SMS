'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Save, Lock, Send, CheckCircle2, XCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GradeBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import {
  MOCK_ENROLLMENTS, MOCK_GRADES, MOCK_OFFERINGS, MOCK_FACULTY,
  MOCK_GRADE_SUBMISSIONS, LOCKED_OFFERINGS, MOCK_AUDIT_LOGS, MOCK_NOTIFICATIONS,
  MOCK_GRADE_CRITERIA, MOCK_QUIZZES, MOCK_ASSIGNMENTS, MOCK_PERFORMANCE_TASKS,
} from '@/lib/mock-data'
import { fullName, gradeToLetter } from '@/lib/utils'
import type { GradeStatus, GradeSubmissionEntry, SessionUser } from '@/types'

type GradeRow = { quiz: string; assignment: string; midterm: string; final: string; pt: string }
type Weights  = { quiz: number; assignment: number; midterm: number; final: number; pt: number }

function computeFinal(r: GradeRow, w: Weights): number | null {
  const q  = parseFloat(r.quiz)
  const a  = parseFloat(r.assignment)
  const m  = parseFloat(r.midterm)
  const f  = parseFloat(r.final)
  const pt = parseFloat(r.pt)
  if ([q, a, m, f, pt].every(isNaN)) return null
  return (isNaN(q)  ? 0 : q)  * (w.quiz       / 100)
       + (isNaN(a)  ? 0 : a)  * (w.assignment  / 100)
       + (isNaN(m)  ? 0 : m)  * (w.midterm     / 100)
       + (isNaN(f)  ? 0 : f)  * (w.final       / 100)
       + (isNaN(pt) ? 0 : pt) * (w.pt          / 100)
}

export default function GradesPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined

  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.offeringId === offeringId)
  const offering    = MOCK_OFFERINGS.find((o) => o.id === offeringId)

  // Read saved grading criteria — fall back to 30/30/20/20/0 if not configured
  const savedCriteria = MOCK_GRADE_CRITERIA.find((c) => c.offeringId === offeringId)
  const ptWeight  = savedCriteria?.performanceTaskWeight ?? 0
  const examHalf  = Math.round((savedCriteria?.examWeight ?? 40) / 2)
  const weights: Weights = {
    quiz:       savedCriteria?.quizWeight       ?? 30,
    assignment: savedCriteria?.assignmentWeight ?? 30,
    midterm:    examHalf,
    final:      examHalf,
    pt:         ptWeight,
  }

  // Auto-compute LMS averages for a student from live quiz/assignment/PT data
  function getLMSScores(studentId: string) {
    const quizAttempts = MOCK_QUIZZES
      .filter(q => q.offeringId === offeringId)
      .flatMap(q => (q.attempts ?? []).filter(a => a.studentId === studentId && a.score !== undefined && a.maxScore))
    const quizAvg = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((s, a) => s + (a.score! / a.maxScore!) * 100, 0) / quizAttempts.length)
      : null

    const asgnSubs = MOCK_ASSIGNMENTS
      .filter(a => a.offeringId === offeringId)
      .flatMap(a => (a.submissions ?? []).filter(s => s.studentId === studentId && s.grade !== undefined))
    const asgnAvg = asgnSubs.length > 0
      ? Math.round(asgnSubs.reduce((s, sub) => {
          const asgn = MOCK_ASSIGNMENTS.find(a => a.id === sub.assignmentId)
          return s + ((sub.grade ?? 0) / (asgn?.totalPoints ?? 100)) * 100
        }, 0) / asgnSubs.length)
      : null

    const ptSubs = MOCK_PERFORMANCE_TASKS
      .filter(t => t.offeringId === offeringId)
      .flatMap(t => (t.submissions ?? []).filter(s => s.studentId === studentId && s.finalScore !== undefined))
    const ptAvg = ptSubs.length > 0
      ? Math.round(ptSubs.reduce((s, sub) => s + sub.finalScore!, 0) / ptSubs.length)
      : null

    return { quizAvg, asgnAvg, ptAvg }
  }

  const isLocked   = LOCKED_OFFERINGS.has(offeringId)
  const submission = MOCK_GRADE_SUBMISSIONS.find((s) => s.offeringId === offeringId)

  const [rows, setRows] = useState<Record<string, GradeRow>>(() => {
    const init: Record<string, GradeRow> = {}
    enrollments.forEach((e) => {
      const g = MOCK_GRADES.find((gr) => gr.enrollmentId === e.id)
      const lms = getLMSScores(e.studentId)
      init[e.id] = {
        quiz:       g?.quizAverage?.toString()       ?? (lms.quizAvg !== null ? String(lms.quizAvg) : ''),
        assignment: g?.assignmentAverage?.toString() ?? (lms.asgnAvg !== null ? String(lms.asgnAvg) : ''),
        midterm:    g?.midtermGrade?.toString()      ?? '',
        final:      g?.finalExamGrade?.toString()    ?? '',
        pt:         (lms.ptAvg !== null ? String(lms.ptAvg) : ''),
      }
    })
    return init
  })

  const [saving,          setSaving]         = useState(false)
  const [saved,           setSavedFlash]     = useState(false)
  const [finalizeModal,   setFinalizeModal]  = useState(false)
  const [finalizing,      setFinalizing]     = useState(false)
  const [syncing,         setSyncing]        = useState(false)

  function updateRow(enrollmentId: string, field: keyof GradeRow, value: string) {
    setRows((prev) => ({ ...prev, [enrollmentId]: { ...prev[enrollmentId], [field]: value } }))
  }

  async function handleSyncLMS() {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 500))
    setRows(prev => {
      const next = { ...prev }
      enrollments.forEach(e => {
        const lms = getLMSScores(e.studentId)
        next[e.id] = {
          ...next[e.id],
          ...(lms.quizAvg  !== null ? { quiz:       String(lms.quizAvg)  } : {}),
          ...(lms.asgnAvg  !== null ? { assignment: String(lms.asgnAvg)  } : {}),
          ...(lms.ptAvg    !== null ? { pt:         String(lms.ptAvg)    } : {}),
        }
      })
      return next
    })
    setSyncing(false)
  }

  const persistGrades = useCallback(() => {
    enrollments.forEach((e) => {
      const r = rows[e.id]
      const finalGrade = computeFinal(r, weights)
      const status: GradeStatus = finalGrade === null ? 'IN_PROGRESS' : finalGrade >= 75 ? 'PASSED' : 'FAILED'
      const record = {
        id:                 `grade_${e.id}`,
        quizAverage:        r.quiz       ? parseFloat(r.quiz)       : undefined,
        assignmentAverage:  r.assignment ? parseFloat(r.assignment) : undefined,
        midtermGrade:       r.midterm    ? parseFloat(r.midterm)    : undefined,
        finalExamGrade:     r.final      ? parseFloat(r.final)      : undefined,
        finalGrade:         finalGrade   ?? undefined,
        letterGrade:        finalGrade   !== null ? gradeToLetter(finalGrade) : undefined,
        status,
        enrollmentId: e.id,
        gradedBy:     user?.name,
        gradedAt:     new Date().toISOString(),
        createdAt:    new Date().toISOString(),
      }
      const idx = MOCK_GRADES.findIndex((g) => g.enrollmentId === e.id)
      if (idx >= 0) Object.assign(MOCK_GRADES[idx], record)
      else MOCK_GRADES.push(record)
    })
  }, [enrollments, rows, user])

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    persistGrades()
    setSaving(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2500)
  }

  async function handleFinalize() {
    setFinalizing(true)
    await new Promise((r) => setTimeout(r, 800))
    persistGrades()

    const faculty = MOCK_FACULTY.find((f) => f.email === user?.email)

    const entries: GradeSubmissionEntry[] = enrollments.map((e) => {
      const r = rows[e.id]
      const finalGrade = computeFinal(r, weights)
      return {
        enrollmentId:      e.id,
        studentId:         e.studentId,
        studentName:       e.student ? fullName(e.student) : e.studentId,
        studentNo:         e.student?.studentId ?? e.studentId,
        quizAverage:       r.quiz       ? parseFloat(r.quiz)       : undefined,
        assignmentAverage: r.assignment ? parseFloat(r.assignment) : undefined,
        midtermGrade:      r.midterm    ? parseFloat(r.midterm)    : undefined,
        finalExamGrade:    r.final      ? parseFloat(r.final)      : undefined,
        finalGrade:        finalGrade   ?? undefined,
        letterGrade:       finalGrade   !== null ? gradeToLetter(finalGrade) : undefined,
        gradeStatus:       (finalGrade === null ? 'IN_PROGRESS' : finalGrade >= 75 ? 'PASSED' : 'FAILED') as GradeStatus,
      }
    })

    MOCK_GRADE_SUBMISSIONS.push({
      id:          `gs_${Date.now()}`,
      offeringId,
      semesterId:  offering?.semesterId ?? 'sem_1',
      facultyId:   faculty?.id          ?? 'unknown',
      facultyName: user?.name            ?? 'Unknown Faculty',
      subjectCode: offering?.subject?.code ?? 'N/A',
      subjectName: offering?.subject?.name ?? 'Unknown Subject',
      section:     offering?.section,
      status:      'PENDING',
      entries,
      submittedAt: new Date().toISOString(),
    })

    LOCKED_OFFERINGS.add(offeringId)

    MOCK_AUDIT_LOGS.push({
      id:        `al_${Date.now()}`,
      action:    'GRADE_SUBMISSION',
      entity:    'GradeSubmission',
      entityId:  offeringId,
      details:   `${user?.name} submitted grades for ${offering?.subject?.name} (${entries.length} students)`,
      userId:    user?.id    ?? 'unknown',
      schoolId:  'school_1',
      createdAt: new Date().toISOString(),
    })

    MOCK_NOTIFICATIONS.push({
      id:        `notif_${Date.now()}`,
      title:     'New Grade Submission',
      message:   `${user?.name} submitted grades for ${offering?.subject?.name} – ${entries.length} students pending review`,
      type:      'GRADE_SUBMISSION',
      isRead:    false,
      link:      '/staff/grades',
      schoolId:  'school_1',
      createdAt: new Date().toISOString(),
    })

    setFinalizing(false)
    setFinalizeModal(false)
  }

  const statusBanner = () => {
    if (!submission) return null
    if (submission.status === 'PENDING') return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Awaiting Registrar Approval</p>
          <p className="text-xs text-amber-600">Grades are locked. You will be notified once reviewed.</p>
        </div>
      </div>
    )
    if (submission.status === 'APPROVED') return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Grades Approved & Published</p>
          <p className="text-xs text-emerald-600">Approved by {submission.reviewedBy} · Grades are now in official student records.</p>
        </div>
      </div>
    )
    if (submission.status === 'REJECTED') return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <XCircle className="h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-800">Grades Returned — Corrections Needed</p>
          <p className="text-xs text-red-600">Reason: {submission.rejectionReason} · Please correct and re-submit.</p>
        </div>
      </div>
    )
    return null
  }

  const locked = isLocked && submission?.status !== 'REJECTED'

  return (
    <div className="max-w-4xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>

      {statusBanner()}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Grade Book</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-slate-500">
              {enrollments.length} students · Quiz {weights.quiz}% · Assignment {weights.assignment}% · Midterm {weights.midterm}% · Final {weights.final}%
            </p>
            <Link
              href={`/teacher/subjects/${offeringId}/criteria`}
              className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
              title="Configure grade weights"
            >
              <Settings className="h-3 w-3" /> Configure
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!locked && (
            <Button
              variant="outline"
              size="sm"
              icon={syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              onClick={handleSyncLMS}
              loading={syncing}
              title="Pull quiz, assignment, and PT averages from LMS submission data"
            >
              Sync from LMS
            </Button>
          )}
          {!locked && (
            <Button
              variant="soft"
              icon={saved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Save className="h-4 w-4" />}
              onClick={handleSave}
              loading={saving}
            >
              {saved ? 'Saved' : 'Save Grades'}
            </Button>
          )}
          {!locked && (
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={() => setFinalizeModal(true)}
              disabled={enrollments.length === 0}
            >
              Finalize Grades
            </Button>
          )}
          {locked && submission?.status !== 'REJECTED' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">
              <Lock className="h-3.5 w-3.5" /> Submitted
            </span>
          )}
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-[#f0f4fa]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase tracking-widest">Student</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-violet-600 uppercase tracking-widest">Quiz<br /><span className="font-normal normal-case text-slate-400">{weights.quiz}%</span></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-widest">Assignment<br /><span className="font-normal normal-case text-slate-400">{weights.assignment}%</span></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-orange-600 uppercase tracking-widest">Midterm<br /><span className="font-normal normal-case text-slate-400">{weights.midterm}%</span></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-widest">Final Exam<br /><span className="font-normal normal-case text-slate-400">{weights.final}%</span></th>
                {weights.pt > 0 && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-rose-600 uppercase tracking-widest">Perf. Task<br /><span className="font-normal normal-case text-slate-400">{weights.pt}%</span></th>
                )}
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-widest">Final Grade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No students enrolled.</td></tr>
              )}
              {enrollments.map((enrollment) => {
                const row = rows[enrollment.id] ?? { quiz: '', assignment: '', midterm: '', final: '' }
                const finalGrade = computeFinal(row, weights)
                return (
                  <tr key={enrollment.id} className="hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={enrollment.student ? fullName(enrollment.student) : 'S'} size="xs" />
                        <div>
                          <p className="font-medium text-slate-900">{enrollment.student ? fullName(enrollment.student) : '—'}</p>
                          <p className="text-xs text-slate-400">{enrollment.student?.studentId}</p>
                        </div>
                      </div>
                    </td>
                    {(['quiz', 'assignment', 'midterm', 'final'] as const).map((field) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0" max="100" step="0.5"
                          value={row[field]}
                          onChange={(e) => updateRow(enrollment.id, field, e.target.value)}
                          disabled={locked}
                          placeholder="—"
                          className="w-16 rounded-lg border border-[#dce8f7] px-2 py-1 text-center text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}
                    {weights.pt > 0 && (
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0" max="100" step="0.5"
                          value={row.pt}
                          onChange={(e) => updateRow(enrollment.id, 'pt', e.target.value)}
                          disabled={locked}
                          placeholder="—"
                          className="w-16 rounded-lg border border-rose-200 px-2 py-1 text-center text-sm focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <p className={`text-lg font-bold ${finalGrade !== null ? (finalGrade >= 75 ? 'text-emerald-700' : 'text-red-600') : 'text-slate-300'}`}>
                        {finalGrade !== null ? finalGrade.toFixed(1) : '—'}
                      </p>
                      <p className="text-xs font-mono text-slate-500">{finalGrade !== null ? gradeToLetter(finalGrade) : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GradeBadge status={finalGrade === null ? 'IN_PROGRESS' : finalGrade >= 75 ? 'PASSED' : 'FAILED'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Finalize confirmation modal */}
      <Modal
        open={finalizeModal}
        onClose={() => !finalizing && setFinalizeModal(false)}
        title="Finalize & Submit Grades"
        description={`Submit grades for ${offering?.subject?.name} to the Registrar for approval. Once submitted, grades will be locked until reviewed.`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="soft" onClick={() => setFinalizeModal(false)} disabled={finalizing}>Cancel</Button>
            <Button icon={finalizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} onClick={handleFinalize} loading={finalizing}>
              Submit for Approval
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2">
          <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-700">
            <p className="font-semibold">{offering?.subject?.name} — Section {offering?.section}</p>
            <p className="mt-0.5 text-xs text-brand-500">{enrollments.length} students · {offering?.subject?.code}</p>
          </div>
          <p className="text-sm text-slate-600">The Registrar will review and either approve or return grades for corrections. Students will only see grades after approval.</p>
        </div>
      </Modal>
    </div>
  )
}
