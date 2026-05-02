'use client'
import Link from 'next/link'
import { BookOpen, Users, Clock, CheckCircle2 } from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { MOCK_OFFERINGS, MOCK_FACULTY, MOCK_SEMESTERS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR } from '@/lib/utils'

const myFaculty = MOCK_FACULTY[0]
const activeSem = MOCK_SEMESTERS.find((s) => s.isActive)

export default function TeacherSubjectsPage() {
  const myOfferings = MOCK_OFFERINGS.filter(
    (o) => o.assignments?.some((a) => a.facultyId === myFaculty.id) && o.status === 'PUBLISHED',
  )

  return (
    <div className="space-y-5 max-w-5xl">
      <SectionTitle description={`${activeSem?.name ?? 'Current semester'} · ${myOfferings.length} course${myOfferings.length !== 1 ? 's' : ''} assigned`}>
        My Courses
      </SectionTitle>

      {myOfferings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 rounded-2xl border-2 border-dashed border-slate-200">
          <BookOpen className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">No courses assigned yet</p>
          <p className="text-xs text-slate-300">The dean will assign you to subject offerings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {myOfferings.map((offering) => {
            const scheduleCount = offering.schedules?.length ?? 0
            return (
              <Link key={offering.id} href={`/teacher/subjects/${offering.id}`}>
                <Card hover className="cursor-pointer group h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 shrink-0">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">{offering.subject?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{offering.subject?.code} · Section {offering.section}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Published
                    </span>
                  </div>

                  {/* Schedule pills */}
                  {scheduleCount > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {offering.schedules!.map((s) => (
                        <span key={s.id} className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                          <Clock className="h-2.5 w-2.5" />
                          {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                          {s.room ? ` · ${s.room.name}` : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 italic mb-3">No schedule set yet</p>
                  )}

                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                    {[
                      { label: 'Students', val: offering._count?.enrollments ?? 0, icon: Users },
                      { label: 'Units', val: offering.subject?.units ?? '—', icon: BookOpen },
                      { label: 'Max', val: offering.maxStudents, icon: Users },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className="text-base font-bold text-slate-900 tabular-nums">{stat.val}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
