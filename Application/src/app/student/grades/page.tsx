'use client'
import { BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { GradeBadge } from '@/components/ui/Badge'
import { MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_GRADE_SUBMISSIONS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

// Fixed to demo student — same pattern as other student pages
const student = MOCK_STUDENTS[0]

export default function StudentGradesPage() {
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === student?.id)

  // Only show grades from PUBLISHED submissions — this is the safety gate
  const approvedEntries = MOCK_GRADE_SUBMISSIONS
    .filter((s) => s.status === 'PUBLISHED')
    .flatMap((s) => s.entries.map((e) => ({ ...e, submission: s })))

  const gradeByEnrollment = Object.fromEntries(
    approvedEntries.map((e) => [e.enrollmentId, e])
  )

  const hasAny = enrollments.some((e) => gradeByEnrollment[e.id])

  return (
    <div className="space-y-5 max-w-4xl">
      <SectionTitle description="Only officially approved grades are shown here">
        My Grades
      </SectionTitle>

      {enrollments.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">No subjects enrolled yet.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase tracking-widest">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase tracking-widest">Units</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase tracking-widest">Final Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase tracking-widest">Rating</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase tracking-widest">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enrollment) => {
                  const entry = gradeByEnrollment[enrollment.id]
                  const sub   = entry?.submission

                  return (
                    <tr key={enrollment.id} className="hover:bg-brand-50/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{enrollment.offering?.subject?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{enrollment.offering?.subject?.code} · Section {enrollment.offering?.section}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {enrollment.offering?.subject?.units ?? '—'}
                      </td>
                      {entry ? (
                        <>
                          <td className="px-4 py-3 text-center">
                            <p className={`text-lg font-bold ${entry.finalGrade != null ? (entry.finalGrade >= 75 ? 'text-emerald-700' : 'text-red-600') : 'text-slate-400'}`}>
                              {entry.finalGrade?.toFixed(1) ?? '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono text-sm font-semibold text-slate-700">{entry.letterGrade ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <GradeBadge status={entry.gradeStatus} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <span className="text-xs text-slate-400">{formatDate(sub?.publishedAt)}</span>
                            </div>
                          </td>
                        </>
                      ) : (
                        <td colSpan={4} className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" /> Pending finalization
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!hasAny && (
            <div className="border-t border-slate-100 py-6 text-center">
              <p className="text-xs text-slate-400">Your grades will appear here once your professor submits and the Registrar approves them.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
