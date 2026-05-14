'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MOCK_FORMS, MOCK_FORM_SUBMISSIONS } from '@/lib/mock-data'
import { formatDateTime } from '@/lib/utils'
import type { FormSubmission, FormSubmissionStatus, Role } from '@/types'

const AGENT_ROLES: Role[] = ['SUPER_ADMIN', 'REGISTRAR', 'HR_STAFF', 'ACCOUNTING', 'ACADEMIC_ADMIN', 'PURCHASING_OFFICER', 'AMO', 'DEAN']

const STATUS_COLORS: Record<FormSubmissionStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  COMPLETED: 'bg-teal-50 text-teal-700',
}

function SubStatusBadge({ status }: { status: FormSubmissionStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function SubmissionsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role as Role | undefined
  const isAgent = role ? AGENT_ROLES.includes(role) : false

  const form = MOCK_FORMS.find(f => f.id === id)
  const [, forceUpdate] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [viewSub, setViewSub] = useState<FormSubmission | null>(null)
  const [statusUpdate, setStatusUpdate] = useState<FormSubmissionStatus>('UNDER_REVIEW')
  const [notes, setNotes] = useState('')

  const allSubs = MOCK_FORM_SUBMISSIONS.filter(s => s.formId === id)
  const filtered = filterStatus === 'ALL' ? allSubs : allSubs.filter(s => s.status === filterStatus)

  const total = allSubs.length
  const submitted = allSubs.filter(s => s.status === 'SUBMITTED').length
  const approved = allSubs.filter(s => s.status === 'APPROVED').length
  const rejected = allSubs.filter(s => s.status === 'REJECTED').length

  function handleUpdateStatus() {
    if (!viewSub) return
    const sub = MOCK_FORM_SUBMISSIONS.find(s => s.id === viewSub.id)
    if (sub) {
      sub.status = statusUpdate
      sub.notes = notes || undefined
      sub.reviewedAt = new Date().toISOString()
      sub.reviewedBy = (session?.user as { name?: string })?.name ?? 'Staff'
      forceUpdate(n => n + 1)
      setViewSub({ ...sub })
    }
  }

  if (!form) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        Form not found.{' '}
        <button onClick={() => router.push('/staff/forms')} className="text-brand-600 underline">Go back</button>
      </div>
    )
  }

  return (
    <div>
      <SectionTitle
        description={`Viewing submissions for: ${form.title}`}
        actions={
          <button
            onClick={() => router.push('/staff/forms')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Forms
          </button>
        }
      >
        Form Submissions
      </SectionTitle>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={total} icon={Users} color="bg-brand-50 text-brand-500" />
        <StatCard label="Submitted" value={submitted} icon={Clock} color="bg-blue-50 text-blue-600" />
        <StatCard label="Approved" value={approved} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Rejected" value={rejected} icon={XCircle} color="bg-red-50 text-red-500" />
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterStatus === s
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-[#e4ebf5] text-slate-600 hover:bg-brand-50'
            }`}
          >
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <Card padding="none">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Submitter</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4fa]">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{sub.submittedByName}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs capitalize">{sub.submittedByRole.toLowerCase()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(sub.submittedAt)}</td>
                    <td className="px-4 py-3"><SubStatusBadge status={sub.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setViewSub(sub); setStatusUpdate(sub.status); setNotes(sub.notes ?? '') }}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors ml-auto"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isAgent ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 text-xs text-slate-400 text-center">
        Export functionality would be available in production.
      </p>

      {/* View / Review Modal */}
      {viewSub && (
        <Modal
          open={!!viewSub}
          onClose={() => setViewSub(null)}
          title="Submission Details"
          description={`${viewSub.submittedByName} · ${formatDateTime(viewSub.submittedAt)}`}
          size="lg"
          footer={
            isAgent ? (
              <div className="flex items-center gap-2 w-full">
                <select
                  value={statusUpdate}
                  onChange={e => setStatusUpdate(e.target.value as FormSubmissionStatus)}
                  className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'] as const).map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <Button variant="primary" size="sm" onClick={handleUpdateStatus}>Update Status</Button>
                <Button variant="outline" size="sm" onClick={() => setViewSub(null)}>Close</Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setViewSub(null)}>Close</Button>
            )
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SubStatusBadge status={viewSub.status} />
              {viewSub.reviewedBy && (
                <span className="text-xs text-slate-400">Reviewed by {viewSub.reviewedBy} · {formatDateTime(viewSub.reviewedAt)}</span>
              )}
            </div>

            {/* Responses */}
            <div className="space-y-3">
              {form.fields.map(field => {
                const val = viewSub.responses[field.id]
                if (val === undefined || val === null || val === '') return null
                return (
                  <div key={field.id} className="rounded-lg border border-[#e4ebf5] p-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">{field.label}</p>
                    <p className="text-sm text-slate-800">
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </p>
                  </div>
                )
              })}
            </div>

            {isAgent && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this submission…"
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            )}
            {viewSub.notes && !isAgent && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Reviewer Notes</p>
                <p className="text-sm text-amber-900">{viewSub.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
