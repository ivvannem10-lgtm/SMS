'use client'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ClipboardList, HelpCircle, BarChart2, Megaphone, MessageSquare, UserCheck, Lock, AlertCircle, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EnrollmentBadge, GradeBadge } from '@/components/ui/Badge'
import { MOCK_OFFERINGS, MOCK_ENROLLMENTS, MOCK_GRADES, MOCK_MODULES, MOCK_ASSIGNMENTS, MOCK_QUIZZES, MOCK_LMS_ANNOUNCEMENTS, MOCK_LMS_DISCUSSIONS, MOCK_LMS_ATTENDANCE, MOCK_STUDENTS, MOCK_PERFORMANCE_TASKS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR, gradeToLetter } from '@/lib/utils'
import { fullName } from '@/lib/utils'

const student = MOCK_STUDENTS[0]

export default function StudentSubjectPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const offering = MOCK_OFFERINGS.find((o) => o.id === offeringId)
  const enrollment = MOCK_ENROLLMENTS.find((e) => e.offeringId === offeringId && e.studentId === student.id)
  const grade = enrollment ? MOCK_GRADES.find((g) => g.enrollmentId === enrollment.id) : null
  const modules       = MOCK_MODULES.filter((m) => m.offeringId === offeringId && m.isPublished)
  const assignments   = MOCK_ASSIGNMENTS.filter((a) => a.offeringId === offeringId && a.isPublished)
  const quizzes       = MOCK_QUIZZES.filter((q) => q.offeringId === offeringId && q.isPublished)
  const perfTasks     = MOCK_PERFORMANCE_TASKS.filter((t) => t.offeringId === offeringId && t.isPublished)
  const announcements = MOCK_LMS_ANNOUNCEMENTS.filter(a => a.offeringId === offeringId)
  const discussions   = MOCK_LMS_DISCUSSIONS.filter(d => d.offeringId === offeringId)
  const myAttendance  = MOCK_LMS_ATTENDANCE.filter(a => a.offeringId === offeringId && a.studentId === student.id)

  if (!offering) return <div className="py-20 text-center text-slate-500">Subject not found.</div>

  const isLocked = !enrollment || enrollment.status === 'PRE_ENROLLED'

  // LMS access gate
  if (isLocked) {
    return (
      <div className="max-w-3xl space-y-5">
        <Link href="/student/subjects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> My Subjects
        </Link>
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 shrink-0"><BookOpen className="h-7 w-7 text-blue-600" /></div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{offering.subject?.name}</h1>
              <p className="text-sm text-slate-500">{offering.subject?.code} · Section {offering.section}</p>
            </div>
          </div>
        </Card>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-amber-900">LMS Access Locked</p>
            <p className="text-sm text-amber-700 mt-1 max-w-sm">Your enrollment is pending payment validation by the Treasury office. LMS access will be automatically unlocked once payment is confirmed.</p>
          </div>
          {enrollment && (
            <div className="flex items-center gap-2 rounded-xl bg-white border border-amber-200 px-4 py-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-700 font-semibold">Status: {enrollment.status.replace('_', ' ')}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Attendance summary
  const presentCount = myAttendance.filter(a => a.status === 'PRESENT').length
  const lateCount = myAttendance.filter(a => a.status === 'LATE').length
  const absentCount = myAttendance.filter(a => a.status === 'ABSENT').length
  const excusedCount = myAttendance.filter(a => a.status === 'EXCUSED').length
  const attendancePct = myAttendance.length > 0 ? Math.round(((presentCount + lateCount) / myAttendance.length) * 100) : 100

  // Upcoming deadlines
  const now = new Date()
  const upcoming = [
    ...assignments.filter(a => a.dueDate && new Date(a.dueDate) > now).map(a => ({ type: 'Assignment', title: a.title, due: a.dueDate!, color: 'text-violet-600 bg-violet-50' })),
    ...quizzes.filter(q => q.endDate && new Date(q.endDate) > now).map(q => ({ type: 'Quiz', title: q.title, due: q.endDate!, color: 'text-amber-600 bg-amber-50' })),
  ].sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime()).slice(0, 3)

  const myPTGraded = perfTasks.filter(t => (t.submissions ?? []).some(s => s.studentId === student.id && s.finalScore !== undefined)).length
  const LMS_CARDS = [
    { href: 'announcements',    label: 'Announcements',     icon: Megaphone,     count: announcements.length, color: 'bg-red-50 text-red-600',     desc: `${announcements.filter(a => a.isPinned).length} pinned` },
    { href: 'materials',        label: 'Learning Materials', icon: BookOpen,      count: modules.length,       color: 'bg-blue-50 text-blue-600',    desc: `${modules.reduce((s, m) => s + (m.materials?.length ?? 0), 0)} files` },
    { href: 'assignments',      label: 'Assignments',        icon: ClipboardList, count: assignments.length,   color: 'bg-violet-50 text-violet-600', desc: `${assignments.filter(a => (a.submissions ?? []).some(s => s.studentId === student.id)).length} submitted` },
    { href: 'quizzes',          label: 'Quizzes & Exams',   icon: HelpCircle,    count: quizzes.length,       color: 'bg-amber-50 text-amber-600',  desc: `${quizzes.filter(q => (q.attempts ?? []).some(a => a.studentId === student.id)).length} attempted` },
    { href: 'performance-tasks',label: 'Performance Tasks', icon: Star,          count: perfTasks.length,     color: 'bg-rose-50 text-rose-600',    desc: `${myPTGraded} graded` },
    { href: 'discussions',      label: 'Discussions',        icon: MessageSquare, count: discussions.length,   color: 'bg-emerald-50 text-emerald-600', desc: `${discussions.reduce((s, d) => s + d.replies.length, 0)} replies` },
    { href: '#attendance',      label: 'My Attendance',      icon: UserCheck,     count: attendancePct,        color: attendancePct >= 90 ? 'bg-emerald-50 text-emerald-600' : attendancePct >= 75 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600', desc: `${myAttendance.length} sessions recorded`, suffix: '%' },
    { href: '#grades',          label: 'Grade Summary',      icon: BarChart2,     count: grade?.finalGrade ?? null, color: 'bg-brand-50 text-brand-600', desc: grade ? gradeToLetter(grade.finalGrade ?? 0) : 'In progress' },
  ]

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/student/subjects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> My Subjects
      </Link>

      {/* Course header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shrink-0">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{offering.subject?.name}</h1>
              <span className="inline-flex rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">LMS Active</span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{offering.subject?.code} · Section {offering.section} · {offering.subject?.units} units</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {offering.schedules?.map((s) => (
                <span key={s.id} className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Instructor: {offering.assignments?.[0]?.faculty ? fullName(offering.assignments[0].faculty) : 'TBA'}
            </p>
          </div>
          <EnrollmentBadge status={enrollment.status} />
        </div>
      </Card>

      {/* Pinned announcement */}
      {announcements.filter(a => a.isPinned)[0] && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <Megaphone className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Pinned Announcement</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{announcements.filter(a => a.isPinned)[0].title}</p>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{announcements.filter(a => a.isPinned)[0].content}</p>
          </div>
          <Link href={`/student/subjects/${offeringId}/announcements`} className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-800 mt-0.5">View all &rarr;</Link>
        </div>
      )}

      {/* Upcoming deadlines */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Deadlines</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {upcoming.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${item.color.includes('violet') ? 'border-violet-200 bg-violet-50' : item.color.includes('amber') ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wide ${item.color}`}>{item.type}</p>
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">{item.title}</p>
                  <p className="text-[10px] text-slate-500">Due: {new Date(item.due).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LMS Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {LMS_CARDS.map((card) => (
          <Link key={card.label} href={card.href.startsWith('#') ? '#' : `/student/subjects/${offeringId}/${card.href}`}>
            <Card hover className="cursor-pointer group h-full">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-2.5 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">{card.label}</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1 tabular-nums">{card.count ?? '—'}{card.suffix ?? ''}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Grade card */}
      {grade && (
        <div id="grades">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">Grade Summary</h3>
              <GradeBadge status={grade.status} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Quiz Avg', value: grade.quizAverage, color: 'text-violet-700' },
                { label: 'Assignment Avg', value: grade.assignmentAverage, color: 'text-blue-700' },
                { label: 'Midterm', value: grade.midtermGrade, color: 'text-orange-700' },
                { label: 'Final Grade', value: grade.finalGrade, color: grade.finalGrade ? (grade.finalGrade >= 75 ? 'text-emerald-700' : 'text-red-700') : 'text-slate-400' },
              ].map((g) => (
                <div key={g.label} className="text-center rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">{g.label}</p>
                  <p className={`text-xl font-bold ${g.color}`}>{g.value ?? '—'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Attendance summary */}
      <div id="attendance">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Attendance Summary</h3>
            <span className={`text-sm font-bold ${attendancePct >= 90 ? 'text-emerald-600' : attendancePct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{attendancePct}% attendance rate</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Present', count: presentCount, color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Late', count: lateCount, color: 'text-amber-700 bg-amber-50' },
              { label: 'Absent', count: absentCount, color: 'text-red-700 bg-red-50' },
              { label: 'Excused', count: excusedCount, color: 'text-blue-700 bg-blue-50' },
            ].map(s => (
              <div key={s.label} className={`text-center rounded-xl py-3 ${s.color}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-[11px] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${attendancePct >= 90 ? 'bg-emerald-500' : attendancePct >= 75 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${attendancePct}%` }} />
          </div>
          {attendancePct < 75 && (
            <p className="text-xs text-red-600 font-semibold mt-2">Attendance below 75% — you may be at risk of being dropped from this subject.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
