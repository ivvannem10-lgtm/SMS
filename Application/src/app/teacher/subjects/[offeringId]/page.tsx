'use client'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ClipboardList, HelpCircle, BarChart2, Users, Settings, UserCheck, Megaphone, MessageSquare, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MOCK_OFFERINGS, MOCK_MODULES, MOCK_ASSIGNMENTS, MOCK_QUIZZES, MOCK_PERFORMANCE_TASKS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR } from '@/lib/utils'

const SUB_PAGES = [
  { href: 'materials',          label: 'Learning Materials',  icon: BookOpen,      desc: 'Modules, PDFs, videos',         color: 'bg-blue-50 text-blue-600' },
  { href: 'assignments',        label: 'Assignments',          icon: ClipboardList, desc: 'Create & grade assignments',    color: 'bg-violet-50 text-violet-600' },
  { href: 'quizzes',            label: 'Quizzes & Exams',     icon: HelpCircle,    desc: 'Time-limited assessments',      color: 'bg-amber-50 text-amber-600' },
  { href: 'performance-tasks',  label: 'Performance Tasks',   icon: Star,          desc: 'Rubric-based grading',          color: 'bg-rose-50 text-rose-600' },
  { href: 'grades',             label: 'Grade Book',           icon: BarChart2,     desc: 'Compute & submit grades',       color: 'bg-emerald-50 text-emerald-600' },
  { href: 'attendance',         label: 'Attendance',           icon: UserCheck,     desc: 'Record & view attendance',      color: 'bg-teal-50 text-teal-600' },
  { href: 'announcements',      label: 'Announcements',        icon: Megaphone,     desc: 'Post course announcements',     color: 'bg-red-50 text-red-600' },
  { href: 'discussions',        label: 'Discussions',          icon: MessageSquare, desc: 'Manage student discussions',    color: 'bg-indigo-50 text-indigo-600' },
  { href: 'criteria',           label: 'Grading Criteria',     icon: Settings,      desc: 'Set grade weights & formula',   color: 'bg-brand-50 text-brand-600' },
  { href: 'students',           label: 'Student List',          icon: Users,         desc: 'View enrolled students',        color: 'bg-orange-50 text-orange-600' },
]

export default function TeacherSubjectPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const offering = MOCK_OFFERINGS.find((o) => o.id === offeringId)
  if (!offering) return <div className="py-20 text-center text-slate-500">Subject not found.</div>

  const moduleCount     = MOCK_MODULES.filter((m) => m.offeringId === offeringId).length
  const assignmentCount = MOCK_ASSIGNMENTS.filter((a) => a.offeringId === offeringId).length
  const quizCount       = MOCK_QUIZZES.filter((q) => q.offeringId === offeringId).length
  const ptCount         = MOCK_PERFORMANCE_TASKS.filter((p) => p.offeringId === offeringId).length

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/teacher/subjects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to My Subjects
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 shrink-0">
            <BookOpen className="h-7 w-7 text-orange-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{offering.subject?.name}</h1>
            <p className="text-sm text-slate-500">{offering.subject?.code} · Section {offering.section} · {offering.subject?.units} units</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {offering.schedules?.map((s) => (
                <span key={s.id} className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                  {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}{s.room ? ` · ${s.room.name}` : ''}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{offering._count?.enrollments}</p>
            <p className="text-xs text-slate-400">students enrolled</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUB_PAGES.map((page) => (
          <Link key={page.href} href={`/teacher/subjects/${offeringId}/${page.href}`}>
            <Card hover className="cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${page.color} shrink-0`}>
                  <page.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{page.label}</p>
                  <p className="text-xs text-slate-500">{page.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  )
}
