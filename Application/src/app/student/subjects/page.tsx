'use client'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EnrollmentBadge } from '@/components/ui/Badge'
import { MOCK_ENROLLMENTS, MOCK_STUDENTS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR } from '@/lib/utils'

const student = MOCK_STUDENTS[0]
const enrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === student.id)

export default function StudentSubjectsPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <SectionTitle description={`${enrollments.length} subjects enrolled this semester`}>My Subjects</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {enrollments.map((enrollment) => (
          <Link key={enrollment.id} href={`/student/subjects/${enrollment.offeringId}`}>
            <Card hover className="cursor-pointer group h-full">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{enrollment.offering?.subject?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{enrollment.offering?.subject?.code} · {enrollment.offering?.subject?.units} units</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {enrollment.offering?.schedules?.map((s) => (
                      <span key={s.id} className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {enrollment.offering?.assignments?.[0]?.faculty ? `Teacher: ${enrollment.offering.assignments[0].faculty.firstName} ${enrollment.offering.assignments[0].faculty.lastName}` : ''}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <EnrollmentBadge status={enrollment.status} />
                <span className="text-xs text-slate-400">Section {enrollment.offering?.section}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
