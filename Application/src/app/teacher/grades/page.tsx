'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BookOpen, CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronRight, Send, RefreshCw, Lock, X, Calendar,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import {
  MOCK_OFFERINGS, MOCK_GRADE_SUBMISSIONS, LOCKED_OFFERINGS, MOCK_FACULTY,
  MOCK_ENROLLMENTS, MOCK_GRADES, MOCK_QUIZZES, MOCK_ASSIGNMENTS,
  MOCK_PERFORMANCE_TASKS, MOCK_GRADE_CRITERIA, MOCK_AUDIT_LOGS, MOCK_NOTIFICATIONS,
  MOCK_ACADEMIC_YEARS, MOCK_SEMESTERS,
} from '@/lib/mock-data'
import { formatDate, fullName, gradeToLetter } from '@/lib/utils'
import type { SessionUser, GradeStatus, GradeSubmissionEntry } from '@/types'

type Weights = { quiz: number; assignment: number; midterm: number; final: number; pt: number }

function getWeights(offeringId: string): Weights {
  const c = MOCK_GRADE_CRITERIA.find((x) => x.offeringId === offeringId)
  const examHalf = Math.round((c?.examWeight ?? 40) / 2)
  return { quiz: c?.quizWeight ?? 30, assignment: c?.assignmentWeight ?? 30, midterm: examHalf, final: examHalf, pt: c?.performanceTaskWeight ?? 0 }
}

function getLMSScores(studentId: string, offeringId: string) {
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

function computeFinal(quizAvg: number | null, asgnAvg: number | null, ptAvg: number | null, midterm: number | undefined, finalEx: number | undefined, w: Weights): number | null {
  if (quizAvg === null && asgnAvg === null && midterm === undefined && finalEx === undefined) return null
  return (quizAvg ?? 0) * (w.quiz / 100)
       + (asgnAvg ?? 0) * (w.assignment / 100)
       + (midterm  ?? 0) * (w.midterm / 100)
       + (finalEx  ?? 0) * (w.final / 100)
       + (ptAvg    ?? 0) * (w.pt / 100)
}

export default function TeacherGradesPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const faculty = MOCK_FACULTY.find((f) => f.email === user?.email)

  const allMyOfferings = MOCK_OFFERINGS.filter((o) =>
    o.assignments?.some((a) => a.facultyId === faculty?.id)
  )

  // ── Academic Year → Semester cascade ────────────────────────────────────────
  const activeAY  = MOCK_ACADEMIC_YEARS.find((a) => a.isActive) ?? MOCK_ACADEMIC_YEARS[0]
  const activeSem = MOCK_SEMESTERS.find((s) => s.isActive) ?? MOCK_SEMESTERS[0]

  const [selectedAY,  setSelectedAY]  = useState(activeAY?.id ?? '')
  const [selectedSem, setSelectedSem] = useState(activeSem?.id ?? '')

  // Semesters for the selected academic year
  const semsForAY = useMemo(
    () => MOCK_SEMESTERS.filter((s) => s.academicYearId === selectedAY),
    [selectedAY]
  )

  // When academic year changes, auto-select its active/first semester
  function handleAYChange(ayId: string) {
    setSelectedAY(ayId)
    const sems = MOCK_SEMESTERS.filter((s) => s.academicYearId === ayId)
    const pref  = sems.find((s) => s.isActive) ?? sems[0]
    setSelectedSem(pref?.id ?? '')
  }

  // Filter offerings to selected semester
  const myOfferings = useMemo(
    () => allMyOfferings.filter((o) => !selectedSem || o.semesterId === selectedSem),
    [allMyOfferings, selectedSem]
  )

  const [submissions, setSubmissions] = useState(() => [...MOCK_GRADE_SUBMISSIONS])
  const [confirmId,   setConfirmId]   = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)

  function getSubmission(offeringId: string) {
    return submissions.find((s) => s.offeringId === offeringId) ?? null
  }

  const submitted = myOfferings.filter((o) => getSubmission(o.id)?.status === 'SUBMITTED').length
  const closed    = myOfferings.filter((o) => getSubmission(o.id)?.status === 'CLOSED').length
  const published = myOfferings.filter((o) => getSubmission(o.id)?.status === 'PUBLISHED').length
  const returned  = myOfferings.filter((o) => getSubmission(o.id)?.status === 'RETURNED').length
  const draft     = myOfferings.filter((o) => !getSubmission(o.id)).length

  async function handleSubmit(offeringId: string) {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))

    const offering    = myOfferings.find((o) => o.id === offeringId)
    const enrollments = MOCK_ENROLLMENTS.filter((e) => e.offeringId === offeringId)
    const weights     = getWeights(offeringId)

    const entries: GradeSubmissionEntry[] = enrollments.map((e) => {
      const saved = MOCK_GRADES.find((g) => g.enrollmentId === e.id)
      const lms   = getLMSScores(e.studentId, offeringId)
      const mid   = saved?.midtermGrade
      const fin   = saved?.finalExamGrade
      const finalGrade = computeFinal(lms.quizAvg, lms.asgnAvg, lms.ptAvg, mid, fin, weights)
      const status: GradeStatus = finalGrade === null ? 'IN_PROGRESS' : finalGrade >= 75 ? 'PASSED' : 'FAILED'

      // Persist to MOCK_GRADES
      const record = {
        id: `grade_${e.id}`,
        quizAverage: lms.quizAvg ?? undefined, assignmentAverage: lms.asgnAvg ?? undefined,
        midtermGrade: mid, finalExamGrade: fin,
        finalGrade: finalGrade ?? undefined,
        letterGrade: finalGrade !== null ? gradeToLetter(finalGrade) : undefined,
        status, enrollmentId: e.id,
        gradedBy: user?.name, gradedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      }
      const idx = MOCK_GRADES.findIndex((g) => g.enrollmentId === e.id)
      if (idx >= 0) Object.assign(MOCK_GRADES[idx], record)
      else MOCK_GRADES.push(record)

      return {
        enrollmentId: e.id, studentId: e.studentId,
        studentName: e.student ? fullName(e.student) : e.studentId,
        studentNo: e.student?.studentId ?? e.studentId,
        quizAverage: lms.quizAvg ?? undefined, assignmentAverage: lms.asgnAvg ?? undefined,
        midtermGrade: mid, finalExamGrade: fin,
        finalGrade: finalGrade ?? undefined,
        letterGrade: finalGrade !== null ? gradeToLetter(finalGrade) : undefined,
        gradeStatus: status,
      }
    })

    const gs = {
      id: `gs_${Date.now()}`, offeringId,
      semesterId: offering?.semesterId ?? 'sem_1',
      facultyId: faculty?.id ?? 'unknown',
      facultyName: user?.name ?? 'Unknown Faculty',
      subjectCode: offering?.subject?.code ?? 'N/A',
      subjectName: offering?.subject?.name ?? 'Unknown Subject',
      section: offering?.section,
      status: 'SUBMITTED' as const,
      entries, submittedAt: new Date().toISOString(),
    }

    // Remove previous submission for same offering (re-submit after rejection)
    const prevIdx = MOCK_GRADE_SUBMISSIONS.findIndex((s) => s.offeringId === offeringId)
    if (prevIdx >= 0) MOCK_GRADE_SUBMISSIONS.splice(prevIdx, 1)
    MOCK_GRADE_SUBMISSIONS.push(gs)
    LOCKED_OFFERINGS.add(offeringId)

    MOCK_AUDIT_LOGS.push({
      id: `al_${Date.now()}`, action: 'GRADE_SUBMISSION', entity: 'GradeSubmission', entityId: offeringId,
      details: `${user?.name} submitted grades for ${offering?.subject?.name} (${entries.length} students)`,
      userId: user?.id ?? 'unknown', schoolId: 'school_1', createdAt: new Date().toISOString(),
    })
    MOCK_NOTIFICATIONS.push({
      id: `notif_${Date.now()}`, title: 'New Grade Submission',
      message: `${user?.name} submitted grades for ${offering?.subject?.name} – ${entries.length} students pending review`,
      type: 'GRADE_SUBMISSION', isRead: false, link: '/staff/grades', schoolId: 'school_1', createdAt: new Date().toISOString(),
    })

    setSubmissions([...MOCK_GRADE_SUBMISSIONS])
    setSubmitting(false)
    setConfirmId(null)
  }

  const confirmOffering = myOfferings.find((o) => o.id === confirmId)

  return (
    <div className="space-y-6">
      <SectionTitle description="Track and submit grades for all your assigned subjects">
        Grade Finalization
      </SectionTitle>

      {/* Academic Year → Semester cascade filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedAY}
            onChange={(e) => handleAYChange(e.target.value)}
            className="rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
          >
            {MOCK_ACADEMIC_YEARS.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name}{ay.isActive ? ' (Active)' : ''}
              </option>
            ))}
          </select>
        </div>
        <span className="text-slate-300">›</span>
        <select
          value={selectedSem}
          onChange={(e) => setSelectedSem(e.target.value)}
          className="rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        >
          {semsForAY.length === 0 && <option value="">No semesters</option>}
          {semsForAY.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.isActive ? ' (Current)' : ''}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          {myOfferings.length} subject{myOfferings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
            { label: 'Not Submitted', value: draft,     color: 'text-slate-600',   bg: 'bg-slate-50   border-slate-200'   },
          { label: 'Submitted',     value: submitted, color: 'text-amber-600',   bg: 'bg-amber-50   border-amber-200'   },
          { label: 'Closed',        value: closed,    color: 'text-blue-600',    bg: 'bg-blue-50    border-blue-200'    },
          { label: 'Published',     value: published, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Returned',      value: returned,  color: 'text-red-600',     bg: 'bg-red-50     border-red-200'     },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {myOfferings.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">No subjects assigned to you yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {myOfferings.map((offering) => {
            const sub    = getSubmission(offering.id)
                    const locked = LOCKED_OFFERINGS.has(offering.id)
            const isDraft    = !sub
            const isReturned = sub?.status === 'RETURNED'
            const canSubmit  = isDraft || isReturned

            return (
              <div key={offering.id} className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{offering.subject?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {offering.subject?.code} · Section {offering.section} · {offering._count?.enrollments ?? 0} students
                    </p>
                    {isReturned && sub.returnReason && (
                      <div className="mt-1.5 flex items-start gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600">Returned: {sub.returnReason}</p>
                      </div>
                    )}
                    {sub && !isReturned && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {sub.status === 'PUBLISHED'
                          ? `Published by ${sub.publishedBy ?? 'Registrar'} · ${formatDate(sub.publishedAt)}`
                          : sub.status === 'CLOSED'
                          ? `Closed by ${sub.closedBy ?? 'Registrar'} · ${formatDate(sub.closedAt)}`
                          : `Submitted ${formatDate(sub.submittedAt)}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Status badge */}
                    {sub?.status === 'SUBMITTED' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Clock className="h-3 w-3" /> Under Review
                      </span>
                    )}
                    {sub?.status === 'CLOSED' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <Lock className="h-3 w-3" /> Closed
                      </span>
                    )}
                    {sub?.status === 'PUBLISHED' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Published
                      </span>
                    )}
                    {isReturned && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                        <XCircle className="h-3 w-3" /> Returned
                      </span>
                    )}
                    {isDraft && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Not Submitted
                      </span>
                    )}

                    {/* Submit Grades button */}
                    {canSubmit && (
                      <button
                        onClick={() => setConfirmId(offering.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 px-3.5 py-2 text-xs font-bold text-white transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {isReturned ? 'Resubmit Grades' : 'Submit Grades'}
                      </button>
                    )}

                    {/* Grade book link */}
                    <Link
                      href={`/teacher/subjects/${offering.id}/grades`}
                      className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      {locked ? 'View' : 'Grade Book'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Approved bar */}
                {sub?.status === 'PUBLISHED' && (
                  <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-2 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <p className="text-xs text-emerald-700">
                      Grades are published and visible to students in their profile.
                    </p>
                  </div>
                )}
                {sub?.status === 'CLOSED' && (
                  <div className="border-t border-blue-100 bg-blue-50 px-5 py-2 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700">
                      Submission closed by Registrar — under final review before publishing.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm submit modal */}
      {confirmId && confirmOffering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => !submitting && setConfirmId(null)} />
          <div className="relative w-[420px] rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-l-[3px] border-brand-500 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Submit Grades for Approval</p>
                <p className="text-xs text-slate-400 mt-0.5">This will send grades to the Registrar for review.</p>
              </div>
              {!submitting && (
                <button onClick={() => setConfirmId(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3">
                <p className="text-sm font-semibold text-brand-800">{confirmOffering.subject?.name}</p>
                <p className="text-xs text-brand-500 mt-0.5">
                  {confirmOffering.subject?.code} · Section {confirmOffering.section} · {confirmOffering._count?.enrollments ?? 0} students
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Grades will be computed from LMS data (quizzes, assignments, performance tasks) plus any manually entered exam scores. Students will only see grades after the Registrar approves them.
              </p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Once submitted, the grade book will be locked until reviewed.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
              <button onClick={() => setConfirmId(null)} disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                Cancel
              </button>
              <button onClick={() => handleSubmit(confirmId)} disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
                {submitting
                  ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting…</>
                  : <><Send className="h-3.5 w-3.5" /> Submit Grades</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
