'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Flag, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Send, Lock, Eye,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  MOCK_QUIZZES, MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_OFFERINGS, MOCK_GRADES,
} from '@/lib/mock-data'
import type { Quiz, QuizQuestion, QuizAttempt, AttemptStatus, StudentAnswer } from '@/types'

// ── Demo student ──────────────────────────────────────────────────────────────
const student = MOCK_STUDENTS[0]

// ── Helpers ───────────────────────────────────────────────────────────────────
type Mode = 'start' | 'taking' | 'submitted' | 'result'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function fmtSeconds(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function assessmentTypeBadge(type?: string) {
  const map: Record<string, { label: string; cls: string }> = {
    QUIZ:            { label: 'Quiz',         cls: 'bg-amber-50 text-amber-700' },
    LONG_QUIZ:       { label: 'Long Quiz',    cls: 'bg-orange-50 text-orange-700' },
    MIDTERM_EXAM:    { label: 'Midterm Exam', cls: 'bg-red-50 text-red-700' },
    FINAL_EXAM:      { label: 'Final Exam',   cls: 'bg-red-100 text-red-800' },
    PRACTICAL_EXAM:  { label: 'Practical',    cls: 'bg-violet-50 text-violet-700' },
    ASSIGNMENT_EXAM: { label: 'Assignment',   cls: 'bg-blue-50 text-blue-700' },
    ORAL_ASSESSMENT: { label: 'Oral',         cls: 'bg-teal-50 text-teal-700' },
    LABORATORY:      { label: 'Lab',          cls: 'bg-emerald-50 text-emerald-700' },
  }
  const entry = type ? map[type] : null
  if (!entry) return null
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${entry.cls}`}>
      {entry.label}
    </span>
  )
}

// ── Score a single question ───────────────────────────────────────────────────
function scoreQuestion(q: QuizQuestion, studentAnswer: string | undefined): number | undefined {
  const type = q.type
  if (!studentAnswer) return 0

  if (type === 'MCQ') {
    return studentAnswer === q.answer ? q.points : 0
  }
  if (type === 'TRUE_FALSE') {
    return studentAnswer.toLowerCase() === (q.answer ?? '').toLowerCase() ? q.points : 0
  }
  if (type === 'IDENTIFICATION' || type === 'FILL_IN_BLANK') {
    return studentAnswer.trim().toLowerCase() === (q.answer ?? '').toLowerCase() ? q.points : 0
  }
  // ESSAY, LONG_RESPONSE, CODING, MATCHING — needs manual grading
  return undefined
}

function isManualType(type: string) {
  return ['ESSAY', 'LONG_RESPONSE', 'CODING', 'MATCHING'].includes(type)
}

// ── Gate screens ──────────────────────────────────────────────────────────────
function NotEnrolledGate({ offeringId }: { offeringId: string }) {
  return (
    <div className="max-w-xl mx-auto py-20 flex flex-col items-center gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Lock className="h-8 w-8 text-slate-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800">Access Restricted</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          You must be enrolled in this subject to access assessments.
        </p>
      </div>
      <Link href={`/student/subjects/${offeringId}/quizzes`}>
        <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>Back to Quizzes</Button>
      </Link>
    </div>
  )
}

function WindowGate({
  offeringId, quiz,
}: { offeringId: string; quiz: Quiz }) {
  const now = new Date()
  const start = quiz.startDate ? new Date(quiz.startDate) : null
  const end   = quiz.endDate   ? new Date(quiz.endDate)   : null
  const tooEarly = start && now < start
  const tooLate  = end   && now > end

  return (
    <div className="max-w-xl mx-auto py-20 flex flex-col items-center gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-800">Assessment Not Available</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          {tooEarly
            ? `This assessment opens on ${fmtDate(quiz.startDate)}.`
            : tooLate
            ? `This assessment closed on ${fmtDate(quiz.endDate)}.`
            : 'This assessment is not currently available.'}
        </p>
        {start && <p className="text-xs text-slate-400 mt-2">Opens: {fmtDate(quiz.startDate)}</p>}
        {end   && <p className="text-xs text-slate-400">Closes: {fmtDate(quiz.endDate)}</p>}
      </div>
      <Link href={`/student/subjects/${offeringId}/quizzes`}>
        <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>Back to Quizzes</Button>
      </Link>
    </div>
  )
}

// ── Reusable question navigator button ────────────────────────────────────────
function QBtn({
  idx, label, isCurrent, isAnswered, isFlagged,
  onClick,
}: {
  idx: number; label: number; isCurrent: boolean; isAnswered: boolean; isFlagged: boolean;
  onClick: () => void
}) {
  let cls = 'h-9 w-9 rounded-lg text-xs font-bold transition-all border '
  if (isFlagged) {
    cls += 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-400'
  } else if (isCurrent) {
    cls += 'bg-brand-600 text-white border-brand-700 ring-2 ring-brand-400'
  } else if (isAnswered) {
    cls += 'bg-brand-600 text-white border-brand-700'
  } else {
    cls += 'bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:bg-brand-50'
  }
  return (
    <button className={cls} onClick={onClick}>
      {label}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentQuizPage({
  params,
}: {
  params: { offeringId: string; quizId: string }
}) {
  const { offeringId, quizId } = params

  // ── Resolve data ────────────────────────────────────────────────────────────
  const offering   = MOCK_OFFERINGS.find((o) => o.id === offeringId)
  const quiz       = MOCK_QUIZZES.find((q) => q.id === quizId) as (Quiz & {
    assessmentType?: string
    instructions?: string
    passingScore?: number
    maxAttempts?: number
    showResultsImmediately?: boolean
    showCorrectAnswers?: boolean
    visibility?: string
    answers?: string[]
  }) | undefined

  const enrollment = MOCK_ENROLLMENTS.find(
    (e) => e.offeringId === offeringId && e.studentId === student.id,
  )

  // ── Guard: enrollment ───────────────────────────────────────────────────────
  if (!offering || !quiz || !quiz.isPublished) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-slate-500">
        <p className="text-lg font-bold text-slate-800">Assessment not found.</p>
        <Link href={`/student/subjects/${offeringId}/quizzes`} className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Link>
      </div>
    )
  }

  if (!enrollment || enrollment.status !== 'ENROLLED') {
    return <NotEnrolledGate offeringId={offeringId} />
  }

  // ── Guard: time window ──────────────────────────────────────────────────────
  const now = new Date()
  const windowStart = quiz.startDate ? new Date(quiz.startDate) : null
  const windowEnd   = quiz.endDate   ? new Date(quiz.endDate)   : null
  const outsideWindow =
    (windowStart && now < windowStart) ||
    (windowEnd   && now > windowEnd)

  if (outsideWindow) {
    return <WindowGate offeringId={offeringId} quiz={quiz} />
  }

  return <QuizBody offeringId={offeringId} quiz={quiz} offering={offering} />
}

// ── QuizBody — all stateful logic ─────────────────────────────────────────────
// Separated so hooks are called unconditionally after the guards above
function QuizBody({
  offeringId,
  quiz,
  offering,
}: {
  offeringId: string
  quiz: Quiz & {
    assessmentType?: string
    instructions?: string
    passingScore?: number
    maxAttempts?: number
    showResultsImmediately?: boolean
    showCorrectAnswers?: boolean
  }
  offering: NonNullable<ReturnType<typeof MOCK_OFFERINGS.find>>
}) {
  const questions: QuizQuestion[] = (quiz.questions ?? []).slice().sort((a, b) => a.order - b.order)

  // Check existing attempt by demo student
  const existingAttempt = (quiz.attempts ?? []).find(
    (a) => a.studentId === student.id && (a.status === 'SUBMITTED' || a.status === 'GRADED' || a.status === 'TIMED_OUT'),
  ) as (QuizAttempt & { answers?: StudentAnswer[]; isFullyGraded?: boolean }) | undefined

  // Derived settings with safe defaults
  const isOneWay       = quiz.navigationMode === 'ONE_WAY'
  const isAllAtOnce    = quiz.questionDisplayMode === 'ALL_AT_ONCE'
  const allowOvertime  = quiz.timerBehavior === 'ALLOW_OVERTIME'
  const noCopyPaste    = quiz.security?.disableCopyPaste ?? false
  const detectTabSwitch = quiz.security?.tabSwitchDetection ?? false
  const tabSwitchLimit = quiz.security?.tabSwitchLimit ?? 0

  // Feedback derived (new fields override legacy booleans)
  const resolvedFeedbackLevel = quiz.feedbackLevel
    ?? (quiz.showCorrectAnswers ? 'SCORE_AND_ANSWERS' : 'SCORE_ONLY')
  const releaseImmediately = quiz.feedbackTiming
    ? quiz.feedbackTiming === 'IMMEDIATELY'
    : (quiz.showResultsImmediately ?? true)

  // Mode state
  const [mode, setMode] = useState<Mode>(existingAttempt ? 'result' : 'start')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60)
  const [overtime, setOvertime] = useState(false)           // post-zero overtime counter
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submittedAttempt, setSubmittedAttempt] = useState<QuizAttempt & { answers?: StudentAnswer[] } | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [tabWarning, setTabWarning] = useState(false)

  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const overtimeRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef    = useRef<number>(Date.now())
  const attemptStartRef = useRef<Date>(new Date())

  // ── Timer countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          if (allowOvertime) {
            setOvertime(true)
          } else {
            handleSubmit(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive])

  // ── Tab switch detection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!detectTabSwitch || mode !== 'taking') return
    function onVisibilityChange() {
      if (document.hidden) {
        setTabSwitches(prev => {
          const next = prev + 1
          setTabWarning(true)
          setTimeout(() => setTabWarning(false), 4000)
          if (tabSwitchLimit > 0 && next >= tabSwitchLimit) {
            handleSubmit(true)
          }
          return next
        })
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectTabSwitch, mode, tabSwitchLimit])

  // ── Auto-save flash ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'taking') return
    setSavedFlash(true)
    const t = setTimeout(() => setSavedFlash(false), 1200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers])

  // ── Start assessment ────────────────────────────────────────────────────────
  function handleStart() {
    startTimeRef.current = Date.now()
    attemptStartRef.current = new Date()
    setTimeLeft(quiz.duration * 60)
    setAnswers({})
    setFlagged(new Set())
    setCurrentQ(0)
    setTimerActive(true)
    setMode('taking')
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (timedOut = false) => {
      if (timerRef.current) clearInterval(timerRef.current)
      setTimerActive(false)
      setShowSubmitModal(false)

      // Grade each question
      const gradedAnswers: StudentAnswer[] = questions.map((q) => {
        const raw = answers[q.id]
        const isManual = isManualType(q.type)
        const score = isManual ? undefined : scoreQuestion(q, raw)
        return {
          questionId: q.id,
          answer: raw,
          score,
          maxScore: q.points,
          feedback: undefined,
        }
      })

      // Sum auto-graded scores
      const autoScore = gradedAnswers.reduce((sum, a) => {
        return a.score !== undefined ? sum + a.score : sum
      }, 0)

      const noManualQuestions = questions.every((q) => !isManualType(q.type))

      const attempt: QuizAttempt & { answers: StudentAnswer[]; isFullyGraded: boolean } = {
        id: `att_${Date.now()}`,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        score: autoScore,
        maxScore: quiz.totalPoints,
        startedAt: attemptStartRef.current.toISOString(),
        submittedAt: new Date().toISOString(),
        timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
        status: timedOut ? 'TIMED_OUT' : 'SUBMITTED',
        quizId: quiz.id,
        answers: gradedAnswers,
        isFullyGraded: noManualQuestions,
      }

      if (!quiz.attempts) quiz.attempts = []
      quiz.attempts.push(attempt)

      // ── Auto-push quiz average to gradebook ────────────────────────────────
      if (noManualQuestions) {
        const offeringId = quiz.offeringId
        const enroll = MOCK_ENROLLMENTS.find(
          (e) => e.offeringId === offeringId && e.studentId === student.id,
        )
        if (enroll) {
          // Recompute average across ALL quiz attempts for this offering
          const offeringQuizzes = MOCK_QUIZZES.filter(
            (q) => q.offeringId === offeringId && q.isPublished,
          )
          const myAttempts = offeringQuizzes.flatMap((q) =>
            (q.attempts ?? []).filter(
              (a) => a.studentId === student.id && a.maxScore && a.score !== undefined,
            ),
          )
          const quizAvg =
            myAttempts.length > 0
              ? Math.round(
                  myAttempts.reduce(
                    (s, a) => s + (a.score! / a.maxScore!) * 100,
                    0,
                  ) / myAttempts.length,
                )
              : undefined

          const gradeIdx = MOCK_GRADES.findIndex((g) => g.enrollmentId === enroll.id)
          if (gradeIdx >= 0) {
            MOCK_GRADES[gradeIdx] = { ...MOCK_GRADES[gradeIdx], quizAverage: quizAvg }
          } else {
            MOCK_GRADES.push({
              id: `grade_${enroll.id}`,
              enrollmentId: enroll.id,
              quizAverage: quizAvg,
              status: 'IN_PROGRESS',
              createdAt: new Date().toISOString(),
            })
          }
        }
      }

      setSubmittedAttempt(attempt)
      setMode('submitted')
    },
    [answers, questions, quiz],
  )

  // ── Set answer for current question ────────────────────────────────────────
  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleFlag(questionId: string) {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  // ── RESULT mode (pre-existing attempt) ─────────────────────────────────────
  if (mode === 'result' && existingAttempt) {
    const att = existingAttempt
    const pct  = att.maxScore ? Math.round(((att.score ?? 0) / att.maxScore) * 100) : null
    const passed = quiz.passingScore != null && att.score != null
      ? att.score >= quiz.passingScore
      : null

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Link
          href={`/student/subjects/${offeringId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quizzes &amp; Exams
        </Link>

        <Card>
          <div className="flex items-center gap-3 mb-1">
            <Eye className="h-5 w-5 text-brand-500" />
            <h1 className="text-lg font-bold text-slate-900">{quiz.title}</h1>
            {assessmentTypeBadge(quiz.assessmentType)}
          </div>
          <p className="text-sm text-slate-500">
            {offering.subject?.code} · {offering.subject?.name} · Section {offering.section}
          </p>
        </Card>

        {/* Score card */}
        <Card>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50">
              <CheckCircle className="h-10 w-10 text-brand-600" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {att.score ?? '—'} <span className="text-slate-300">/</span> {att.maxScore ?? quiz.totalPoints}
                <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
              </p>
              {pct !== null && (
                <p className="text-lg font-bold text-slate-500 mt-0.5">{pct}%</p>
              )}
              {passed !== null && (
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {passed ? 'Passed' : 'Failed'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-center w-full max-w-xs mt-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Submitted</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{fmtDate(att.submittedAt)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Time Taken</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {att.timeTakenSeconds != null ? fmtDuration(att.timeTakenSeconds) : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Per-question breakdown if showCorrectAnswers */}
        {resolvedFeedbackLevel !== 'SCORE_ONLY' && att.answers && questions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question Review</p>
            {questions.map((q, i) => {
              const sa = att.answers!.find((a) => a.questionId === q.id)
              const correct = !isManualType(q.type)
                ? scoreQuestion(q, sa?.answer) === q.points
                : null
              return (
                <Card key={q.id}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      correct === true  ? 'bg-emerald-100 text-emerald-700' :
                      correct === false ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                      <div className="mt-1.5 space-y-0.5 text-xs">
                        <p className="text-slate-500">
                          Your answer:{' '}
                          <span className={`font-semibold ${
                            correct === true ? 'text-emerald-700' :
                            correct === false ? 'text-red-600' : 'text-slate-700'
                          }`}>
                            {sa?.answer || <em className="text-slate-400">No answer</em>}
                          </span>
                        </p>
                        {!isManualType(q.type) && correct === false && q.answer && (
                          <p className="text-slate-500">
                            Correct answer: <span className="font-semibold text-emerald-700">{q.answer}</span>
                          </p>
                        )}
                        {isManualType(q.type) && (
                          <p className="text-slate-400 italic">Manually graded</p>
                        )}
                      </div>
                      {sa?.feedback && (
                        <p className="mt-1 text-xs text-brand-700 italic">Feedback: {sa.feedback}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-slate-700">
                        {sa?.score ?? '—'}<span className="text-slate-300">/{q.points}</span>
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {resolvedFeedbackLevel === 'SCORE_ONLY' && (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            Correct answers are not shown for this assessment.
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Link href={`/student/subjects/${offeringId}/quizzes`}>
            <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>Back to Quizzes</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── SUBMITTED mode ──────────────────────────────────────────────────────────
  if (mode === 'submitted' && submittedAttempt) {
    const att = submittedAttempt
    const pct = att.maxScore ? Math.round(((att.score ?? 0) / att.maxScore) * 100) : null
    const timedOut = att.status === 'TIMED_OUT'
    const autoOnly = (att as QuizAttempt & { isFullyGraded?: boolean }).isFullyGraded

    return (
      <div className="max-w-2xl mx-auto py-10 flex flex-col items-center gap-6 text-center">
        <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${timedOut ? 'bg-amber-100' : 'bg-emerald-100'}`}>
          {timedOut
            ? <Clock className="h-10 w-10 text-amber-500" />
            : <CheckCircle className="h-10 w-10 text-emerald-600" />
          }
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-900">
            {timedOut ? 'Time Up — Auto-submitted' : 'Assessment Submitted Successfully'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Submitted on {fmtDate(att.submittedAt)}
          </p>
        </div>

        {/* Auto-score preview */}
        {questions.length > 0 && (
          <Card className="w-full max-w-sm text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Score Summary</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-extrabold text-slate-900 tabular-nums">
                {att.score ?? 0}
              </p>
              <p className="text-xl text-slate-300">/</p>
              <p className="text-xl font-bold text-slate-400">{att.maxScore ?? quiz.totalPoints}</p>
            </div>
            {pct !== null && (
              <p className="text-center text-slate-500 mt-1 text-sm font-semibold">{pct}%</p>
            )}
            {!autoOnly && (
              <p className="text-center text-xs text-amber-600 mt-2">
                Auto-graded questions scored. Essay/coding questions will be graded by your instructor.
              </p>
            )}
          </Card>
        )}

        {releaseImmediately ? (
          <p className="text-sm text-emerald-600 font-semibold">Your results are available now.</p>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 max-w-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Results will be available after your instructor releases grades.
          </div>
        )}

        <Link href={`/student/subjects/${offeringId}/quizzes`}>
          <Button variant="primary" icon={<ArrowLeft className="h-4 w-4" />}>Back to Course</Button>
        </Link>
      </div>
    )
  }

  // ── START mode ──────────────────────────────────────────────────────────────
  if (mode === 'start') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/student/subjects/${offeringId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quizzes &amp; Exams
        </Link>

        {/* Assessment info */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 shrink-0">
              <Flag className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{quiz.title}</h1>
                {assessmentTypeBadge(quiz.assessmentType)}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {offering.subject?.code} · {offering.subject?.name} · Section {offering.section}
              </p>
              {quiz.description && (
                <p className="text-sm text-slate-600 mt-2">{quiz.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {quiz.duration} minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                  {quiz.totalPoints} points total
                </span>
                {questions.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-slate-400" />
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {(quiz.startDate || quiz.endDate) && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Window: {fmtDate(quiz.startDate)} – {fmtDate(quiz.endDate)}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Instructions */}
        {quiz.instructions && (
          <Card>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Instructions</p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{quiz.instructions}</p>
          </Card>
        )}

        {/* Rules */}
        <Card>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Rules</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {[
              'Once started, the timer cannot be paused.',
              'Answers are auto-saved as you proceed.',
              'The assessment auto-submits when time runs out.',
              quiz.maxAttempts ? `You have ${quiz.maxAttempts} attempt(s) allowed for this assessment.` : null,
              !releaseImmediately ? 'Results will be released by your instructor.' : null,
            ].filter(Boolean).map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </Card>

        {/* No questions warning */}
        {questions.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              This assessment has no questions yet. Please check back later or contact your instructor.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            variant="primary"
            disabled={questions.length === 0}
            onClick={handleStart}
            className="px-10"
          >
            Start Assessment
          </Button>
        </div>
      </div>
    )
  }

  // ── TAKING mode ──────────────────────────────────────────────────────────────
  const q = questions[currentQ]
  if (!q) return null

  const answeredCount = questions.filter((qq) => !!answers[qq.id]).length
  const timerRed = timeLeft < 300

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#e4ebf5] shadow-sm px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 shrink-0">
            <Flag className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{quiz.title}</p>
            <p className="text-[11px] text-slate-400 truncate">
              {offering.subject?.code} · {offering.section}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Tab switch warning */}
          {tabWarning && (
            <span className="rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-600 animate-pulse">
              ⚠ Tab switch detected ({tabSwitches}{tabSwitchLimit > 0 ? `/${tabSwitchLimit}` : ''})
            </span>
          )}

          {/* Auto-save indicator */}
          <span className={`text-[11px] font-medium transition-opacity ${savedFlash ? 'text-emerald-600 opacity-100' : 'opacity-0'}`}>
            Saved
          </span>

          {/* Timer — shows overtime in amber when ALLOW_OVERTIME */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold ${
            overtime
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : timerRed
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}>
            <Clock className="h-3.5 w-3.5" />
            {overtime ? '+overtime' : fmtSeconds(timeLeft)}
          </div>

          {/* Submit button */}
          <Button
            variant="primary"
            size="sm"
            icon={<Send className="h-3.5 w-3.5" />}
            onClick={() => setShowSubmitModal(true)}
          >
            Submit
          </Button>
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-0">

        {/* Left sidebar — question nav */}
        <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-[#e4ebf5] bg-[#f8fafc] p-4 gap-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Questions ({answeredCount}/{questions.length} answered)
          </p>

          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((qq, i) => (
              <QBtn
                key={qq.id}
                idx={i}
                label={i + 1}
                isCurrent={i === currentQ}
                isAnswered={!!answers[qq.id]}
                isFlagged={flagged.has(qq.id)}
                onClick={() => setCurrentQ(i)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-auto space-y-1.5 border-t border-slate-200 pt-3">
            {[
              { cls: 'bg-brand-600 border-brand-700', label: 'Answered' },
              { cls: 'bg-white border-slate-200', label: 'Unanswered' },
              { cls: 'bg-amber-50 border-amber-300 ring-2 ring-amber-400', label: 'Flagged' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`h-3.5 w-3.5 rounded border ${item.cls}`} />
                <span className="text-[11px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: question content */}
        <div
          className="flex-1 px-4 md:px-8 py-6 max-w-2xl mx-auto w-full"
          onCopy={noCopyPaste ? (e) => e.preventDefault() : undefined}
          onCut={noCopyPaste ? (e) => e.preventDefault() : undefined}
          onPaste={noCopyPaste ? (e) => e.preventDefault() : undefined}
          style={noCopyPaste ? { userSelect: 'none' } : undefined}
        >
          {/* Question header */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Question {currentQ + 1} of {questions.length}
              </span>
              <span className="ml-2 text-[11px] text-slate-400">· {q.points} {q.points === 1 ? 'pt' : 'pts'}</span>
            </div>
            <button
              onClick={() => toggleFlag(q.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                flagged.has(q.id)
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              {flagged.has(q.id) ? 'Flagged' : 'Flag for Review'}
            </button>
          </div>

          {/* Question text */}
          <p className="text-base font-semibold text-slate-900 leading-relaxed mb-6">{q.question}</p>

          {/* Answer input — varies by type */}
          <div className="space-y-3">
            {q.type === 'MCQ' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                        selected
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt}
                        checked={selected}
                        onChange={() => setAnswer(q.id, opt)}
                        className="h-4 w-4 accent-brand-600"
                      />
                      <span className={`text-sm ${selected ? 'font-semibold text-brand-800' : 'text-slate-700'}`}>
                        {opt}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}

            {q.type === 'TRUE_FALSE' && (
              <div className="flex gap-3">
                {['True', 'False'].map((opt) => {
                  const selected = answers[q.id] === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswer(q.id, opt)}
                      className={`flex-1 rounded-xl border py-4 text-base font-bold transition-colors ${
                        selected
                          ? opt === 'True'
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-red-400 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}

            {(q.type === 'IDENTIFICATION' || q.type === 'FILL_IN_BLANK') && (
              <input
                type="text"
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder={q.type === 'IDENTIFICATION' ? 'Type your answer…' : 'Fill in the blank…'}
                className="w-full rounded-xl border border-[#dce8f7] bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
            )}

            {(q.type === 'ESSAY' || q.type === 'LONG_RESPONSE') && (
              <textarea
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Write your answer here…"
                rows={7}
                className="w-full rounded-xl border border-[#dce8f7] bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                style={{ minHeight: '150px' }}
              />
            )}

            {q.type === 'CODING' && (
              <textarea
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="// Write your code here…"
                rows={10}
                className="w-full rounded-xl border border-[#dce8f7] bg-slate-900 px-4 py-3 font-mono text-sm text-emerald-300 placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                style={{ minHeight: '200px' }}
                spellCheck={false}
              />
            )}

            {q.type === 'MATCHING' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Matching questions — type your answer:</p>
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Type your matching answer…"
                  rows={4}
                  className="w-full rounded-xl border border-[#dce8f7] bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  style={{ minHeight: '100px' }}
                />
              </div>
            )}
          </div>

          {/* Navigation row */}
          <div className="mt-8 flex items-center justify-between">
            {isOneWay ? (
              <div className="text-[11px] text-slate-400 italic">One-way navigation</div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="h-4 w-4" />}
                disabled={currentQ === 0}
                onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
            )}

            {/* Mobile progress */}
            <span className="text-xs text-slate-400 md:hidden tabular-nums">
              {answeredCount}/{questions.length} answered
            </span>

            {currentQ < questions.length - 1 ? (
              <Button
                variant="outline"
                size="sm"
                iconRight={<ChevronRight className="h-4 w-4" />}
                onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<Send className="h-4 w-4" />}
                onClick={() => setShowSubmitModal(true)}
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit confirmation modal ───────────────────────────────────────── */}
      {(() => {
        const unansweredQs = questions
          .map((q, i) => ({ q, n: i + 1 }))
          .filter(({ q }) => !answers[q.id])
        const flaggedQs = questions
          .map((q, i) => ({ q, n: i + 1 }))
          .filter(({ q }) => flagged.has(q.id))
        const hasUnanswered = unansweredQs.length > 0
        const hasFlagged    = flaggedQs.length > 0

        return (
          <Modal
            open={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            title="Submit Exam"
            size="sm"
            footer={
              <>
                <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
                  No, Review Again
                </Button>
                <Button variant="primary" icon={<Send className="h-4 w-4" />} onClick={() => handleSubmit(false)}>
                  Yes, Submit Exam
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {/* Primary warning */}
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Are you sure you want to submit your exam?</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    You will <strong>not</strong> be able to change your answers after submission.
                    Make sure you have reviewed all questions.
                  </p>
                </div>
              </div>

              {/* Summary grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`rounded-xl py-3 ${answeredCount === questions.length ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Answered</p>
                  <p className={`text-xl font-bold ${answeredCount === questions.length ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {answeredCount}
                    <span className="text-sm font-normal text-slate-400">/{questions.length}</span>
                  </p>
                </div>
                <div className={`rounded-xl py-3 ${hasUnanswered ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Unanswered</p>
                  <p className={`text-xl font-bold ${hasUnanswered ? 'text-red-600' : 'text-slate-400'}`}>
                    {unansweredQs.length}
                  </p>
                </div>
                <div className={`rounded-xl py-3 ${hasFlagged ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Flagged</p>
                  <p className={`text-xl font-bold ${hasFlagged ? 'text-amber-600' : 'text-slate-400'}`}>
                    {flaggedQs.length}
                  </p>
                </div>
              </div>

              {/* Unanswered question list */}
              {hasUnanswered && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                  <p className="text-[11px] font-bold text-red-600 mb-1">
                    Unanswered — will receive 0 points:
                  </p>
                  <p className="text-[11px] text-red-500">
                    {unansweredQs.map(({ n }) => `Q${n}`).join(', ')}
                  </p>
                </div>
              )}

              {/* Flagged question list */}
              {hasFlagged && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                  <p className="text-[11px] font-bold text-amber-700 mb-1">
                    Flagged for review:
                  </p>
                  <p className="text-[11px] text-amber-600">
                    {flaggedQs.map(({ n }) => `Q${n}`).join(', ')}
                  </p>
                </div>
              )}

              {/* All good state */}
              {!hasUnanswered && !hasFlagged && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-[11px] font-semibold text-emerald-700">
                    All {questions.length} questions answered. Ready to submit.
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}
