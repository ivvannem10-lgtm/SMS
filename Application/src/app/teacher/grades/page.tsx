'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { BookOpen, CheckCircle2, XCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { MOCK_OFFERINGS, MOCK_GRADE_SUBMISSIONS, LOCKED_OFFERINGS, MOCK_FACULTY } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import type { SessionUser } from '@/types'

export default function TeacherGradesPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined

  const faculty = MOCK_FACULTY.find((f) => f.email === user?.email)
  const myOfferings = MOCK_OFFERINGS.filter((o) =>
    o.assignments?.some((a) => a.facultyId === faculty?.id)
  )

  function getSubmission(offeringId: string) {
    return MOCK_GRADE_SUBMISSIONS.find((s) => s.offeringId === offeringId) ?? null
  }

  const pending  = myOfferings.filter((o) => getSubmission(o.id)?.status === 'PENDING').length
  const approved = myOfferings.filter((o) => getSubmission(o.id)?.status === 'APPROVED').length
  const rejected = myOfferings.filter((o) => getSubmission(o.id)?.status === 'REJECTED').length
  const draft    = myOfferings.filter((o) => !getSubmission(o.id)).length

  return (
    <div className="space-y-6">
      <SectionTitle description="Track submission status for all your assigned subjects">
        Grade Finalization
      </SectionTitle>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Not Submitted', value: draft,    color: 'text-slate-600',  bg: 'bg-slate-50  border-slate-200'  },
          { label: 'Pending',       value: pending,  color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200'  },
          { label: 'Approved',      value: approved, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Rejected',      value: rejected, color: 'text-red-600',    bg: 'bg-red-50    border-red-200'    },
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
            const sub = getSubmission(offering.id)
            const locked = LOCKED_OFFERINGS.has(offering.id)

            let statusChip: React.ReactNode
            if (!sub) {
              statusChip = (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Not Submitted
                </span>
              )
            } else if (sub.status === 'PENDING') {
              statusChip = (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Clock className="h-3 w-3" /> Pending Review
                </span>
              )
            } else if (sub.status === 'APPROVED') {
              statusChip = (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Approved
                </span>
              )
            } else {
              statusChip = (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  <XCircle className="h-3 w-3" /> Rejected
                </span>
              )
            }

            return (
              <Card key={offering.id} padding="none">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                    <BookOpen className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{offering.subject?.name}</p>
                    <p className="text-xs text-slate-500">{offering.subject?.code} · Section {offering.section} · {offering._count?.enrollments ?? 0} students</p>
                    {sub?.status === 'REJECTED' && sub.rejectionReason && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <p className="text-xs text-red-600 truncate">Reason: {sub.rejectionReason}</p>
                      </div>
                    )}
                    {sub && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {sub.status === 'APPROVED'
                          ? `Approved by ${sub.reviewedBy} on ${formatDate(sub.reviewedAt)}`
                          : sub.status === 'REJECTED'
                            ? `Returned on ${formatDate(sub.reviewedAt)}`
                            : `Submitted ${formatDate(sub.submittedAt)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusChip}
                    <Link
                      href={`/teacher/subjects/${offering.id}/grades`}
                      className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      {locked && sub?.status !== 'REJECTED' ? 'View' : 'Grade Book'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
