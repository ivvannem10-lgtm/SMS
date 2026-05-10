'use client'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, Clock, CheckCircle2, AlertCircle, Lock, CalendarDays, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MOCK_QUIZZES, MOCK_STUDENTS, MOCK_ENROLLMENTS } from '@/lib/mock-data'

const student = MOCK_STUDENTS[0]

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  QUIZ: 'Quiz', LONG_QUIZ: 'Long Quiz', PRACTICAL_EXAM: 'Practical Exam',
  MIDTERM_EXAM: 'Midterm Exam', FINAL_EXAM: 'Final Exam',
  ASSIGNMENT_EXAM: 'Assignment Exam', ORAL_ASSESSMENT: 'Oral Assessment', LABORATORY: 'Laboratory',
}

const ASSESSMENT_TYPE_COLOR: Record<string, string> = {
  QUIZ: 'bg-amber-50 text-amber-700 border-amber-200',
  LONG_QUIZ: 'bg-orange-50 text-orange-700 border-orange-200',
  MIDTERM_EXAM: 'bg-brand-50 text-brand-700 border-brand-200',
  FINAL_EXAM: 'bg-red-50 text-red-700 border-red-200',
  PRACTICAL_EXAM: 'bg-violet-50 text-violet-700 border-violet-200',
  ORAL_ASSESSMENT: 'bg-teal-50 text-teal-700 border-teal-200',
  LABORATORY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function fmtDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function getWindowStatus(quiz: { startDate?: string; endDate?: string }) {
  const now = new Date()
  const start = quiz.startDate ? new Date(quiz.startDate) : null
  const end = quiz.endDate ? new Date(quiz.endDate) : null
  if (start && now < start) return 'upcoming'
  if (end && now > end) return 'closed'
  return 'open'
}

export default function StudentQuizzesPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const enrollment = MOCK_ENROLLMENTS.find(e => e.offeringId === offeringId && e.studentId === student.id)
  const isLocked = !enrollment || enrollment.status !== 'ENROLLED'

  const allQuizzes = MOCK_QUIZZES.filter(q => q.offeringId === offeringId && q.isPublished)

  const open     = allQuizzes.filter(q => getWindowStatus(q) === 'open')
  const upcoming = allQuizzes.filter(q => getWindowStatus(q) === 'upcoming')
  const closed   = allQuizzes.filter(q => getWindowStatus(q) === 'closed')

  function getMyAttempt(quizId: string) {
    const quiz = MOCK_QUIZZES.find(q => q.id === quizId)
    return quiz?.attempts?.find(a => a.studentId === student.id) ?? null
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
            <div>
              <p className="text-lg font-bold text-amber-900">LMS Access Locked</p>
              <p className="text-sm text-amber-700 mt-1">Assessments are only available to officially enrolled students.</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  function QuizCard({ quiz }: { quiz: typeof allQuizzes[0] }) {
    const attempt = getMyAttempt(quiz.id)
    const status  = getWindowStatus(quiz)
    const typeLabel = ASSESSMENT_TYPE_LABELS[quiz.assessmentType ?? 'QUIZ'] ?? 'Quiz'
    const typeColor = ASSESSMENT_TYPE_COLOR[quiz.assessmentType ?? 'QUIZ'] ?? 'bg-amber-50 text-amber-700 border-amber-200'

    let statusBadge: React.ReactNode
    let actionNode: React.ReactNode

    if (attempt?.submittedAt || attempt?.status === 'SUBMITTED' || attempt?.status === 'GRADED' || attempt?.status === 'TIMED_OUT') {
      const isGraded = attempt.status === 'GRADED' || attempt.isFullyGraded
      statusBadge = (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${isGraded ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
          <CheckCircle2 className="h-3 w-3" />
          {isGraded ? 'Graded' : 'Submitted'}
        </span>
      )
      actionNode = (
        <Link
          href={`/student/subjects/${offeringId}/quizzes/${quiz.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          View Result <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )
    } else if (status === 'open') {
      statusBadge = (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-green-50 text-green-700">
          ● Open Now
        </span>
      )
      actionNode = (
        <Link
          href={`/student/subjects/${offeringId}/quizzes/${quiz.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Take Assessment <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )
    } else if (status === 'upcoming') {
      statusBadge = (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-violet-50 text-violet-700">
          <CalendarDays className="h-3 w-3" /> Upcoming
        </span>
      )
      actionNode = (
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed">
          Not yet open
        </span>
      )
    } else {
      statusBadge = (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase bg-slate-100 text-slate-500">
          Closed
        </span>
      )
      actionNode = attempt ? (
        <Link
          href={`/student/subjects/${offeringId}/quizzes/${quiz.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          View <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="text-[11px] text-slate-400">Missed</span>
      )
    }

    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[#e4ebf5] bg-white p-4 shadow-sm">
        {/* Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 shrink-0">
          <HelpCircle className="h-5 w-5 text-amber-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeColor}`}>
              {typeLabel}
            </span>
            {statusBadge}
          </div>
          <p className="font-semibold text-slate-900 truncate">{quiz.title}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {quiz.duration} min
            </span>
            <span>{quiz.totalPoints} pts</span>
            {quiz.passingScore && <span>Passing: {quiz.passingScore} pts</span>}
            {quiz.questions?.length ? <span>{quiz.questions.length} questions</span> : null}
            {attempt?.score !== undefined && (
              <span className={`font-semibold ${attempt.score >= (quiz.passingScore ?? 0) ? 'text-emerald-600' : 'text-red-600'}`}>
                Score: {attempt.score}/{quiz.totalPoints}
              </span>
            )}
          </div>
          {status !== 'open' && (
            <div className="mt-1 text-[11px] text-slate-400 flex gap-3">
              {quiz.startDate && <span>Opens: {fmtDate(quiz.startDate)}</span>}
              {quiz.endDate && <span>Closes: {fmtDate(quiz.endDate)}</span>}
            </div>
          )}
          {status === 'open' && quiz.endDate && (
            <p className="mt-1 text-[11px] text-green-600 font-medium">
              Closes: {fmtDate(quiz.endDate)}
            </p>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0">{actionNode}</div>
      </div>
    )
  }

  const totalCount = allQuizzes.length
  const attemptedCount = allQuizzes.filter(q => getMyAttempt(q.id)).length

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={`/student/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quizzes &amp; Exams</h1>
          <p className="text-sm text-slate-500">{totalCount} assessment{totalCount !== 1 ? 's' : ''} · {attemptedCount} attempted</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Now', count: open.length, color: 'text-green-700 bg-green-50 border-green-200' },
          { label: 'Upcoming', count: upcoming.length, color: 'text-violet-700 bg-violet-50 border-violet-200' },
          { label: 'Closed', count: closed.length, color: 'text-slate-600 bg-slate-50 border-slate-200' },
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
            <HelpCircle className="h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No assessments published yet.</p>
          </div>
        </Card>
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Open Now</h2>
              </div>
              {open.map(q => <QuizCard key={q.id} quiz={q} />)}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Upcoming
              </h2>
              {upcoming.map(q => <QuizCard key={q.id} quiz={q} />)}
            </section>
          )}

          {closed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Past Assessments</h2>
              {closed.map(q => <QuizCard key={q.id} quiz={q} />)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
