'use client'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ClipboardList, HelpCircle, BarChart2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { GradeBadge } from '@/components/ui/Badge'
import { MOCK_OFFERINGS, MOCK_ENROLLMENTS, MOCK_GRADES, MOCK_MODULES, MOCK_ASSIGNMENTS, MOCK_QUIZZES, MOCK_STUDENTS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR, gradeToLetter } from '@/lib/utils'
import { fullName } from '@/lib/utils'

const student = MOCK_STUDENTS[0]

export default function StudentSubjectPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const offering = MOCK_OFFERINGS.find((o) => o.id === offeringId)
  const enrollment = MOCK_ENROLLMENTS.find((e) => e.offeringId === offeringId && e.studentId === student.id)
  const grade = enrollment ? MOCK_GRADES.find((g) => g.enrollmentId === enrollment.id) : null
  const modules = MOCK_MODULES.filter((m) => m.offeringId === offeringId && m.isPublished)
  const assignments = MOCK_ASSIGNMENTS.filter((a) => a.offeringId === offeringId && a.isPublished)
  const quizzes = MOCK_QUIZZES.filter((q) => q.offeringId === offeringId && q.isPublished)

  if (!offering) return <div className="py-20 text-center text-slate-500">Subject not found.</div>

  const QUICK_LINKS = [
    { href: 'materials', label: 'Learning Materials', icon: BookOpen, count: modules.length, color: 'bg-blue-50 text-blue-600' },
    { href: 'assignments', label: 'Assignments', icon: ClipboardList, count: assignments.length, color: 'bg-violet-50 text-violet-600' },
    { href: 'quizzes', label: 'Quizzes', icon: HelpCircle, count: quizzes.length, color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/student/subjects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> My Subjects
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 shrink-0">
            <BookOpen className="h-7 w-7 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{offering.subject?.name}</h1>
            <p className="text-sm text-slate-500">{offering.subject?.code} · Section {offering.section} · {offering.subject?.units} units</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {offering.schedules?.map((s) => (
                <span key={s.id} className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}{s.room ? ` · ${s.room.name}` : ''}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Teacher: {offering.assignments?.[0]?.faculty ? fullName(offering.assignments[0].faculty) : 'TBA'}
            </p>
          </div>
        </div>
      </Card>

      {/* Grade card */}
      {grade && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Current Grades</h3>
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
                {g.label === 'Final Grade' && grade.finalGrade && (
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{gradeToLetter(grade.finalGrade)}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={`/student/subjects/${offeringId}/${link.href}`}>
            <Card hover className="cursor-pointer group text-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl mx-auto mb-2 ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{link.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{link.count} available</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
