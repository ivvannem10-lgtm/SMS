'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Clock, CheckCircle2, XCircle, Eye, RefreshCw,
  BookOpen, AlertCircle, Users, Calendar,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { GradeBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import {
  MOCK_GRADE_SUBMISSIONS, MOCK_GRADES, MOCK_AUDIT_LOGS, MOCK_NOTIFICATIONS,
} from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import type { GradeSubmission, GradeSubmissionStatus, SessionUser } from '@/types'

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

function StatusChip({ status }: { status: GradeSubmissionStatus }) {
  if (status === 'PENDING')  return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"><Clock className="h-3 w-3" />Pending</span>
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Approved</span>
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"><XCircle className="h-3 w-3" />Rejected</span>
}

export default function GradeFinalizationPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined

  const canAct = user?.role === 'REGISTRAR' || user?.role === 'SUPER_ADMIN'

  const [tab,          setTab]         = useState<Tab>('PENDING')
  const [reviewing,    setReviewing]   = useState<GradeSubmission | null>(null)
  const [rejectModal,  setRejectModal] = useState(false)
  const [rejectReason, setReason]      = useState('')
  const [processing,   setProcessing]  = useState(false)
  const [, forceUpdate]                = useState(0)

  function filtered(s: Tab) { return MOCK_GRADE_SUBMISSIONS.filter((sub) => sub.status === s) }
  const counts = { PENDING: filtered('PENDING').length, APPROVED: filtered('APPROVED').length, REJECTED: filtered('REJECTED').length }

  async function handleApprove(sub: GradeSubmission) {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 800))

    sub.entries.forEach((entry) => {
      const record = {
        id:                `grade_${entry.enrollmentId}`,
        quizAverage:       entry.quizAverage,
        assignmentAverage: entry.assignmentAverage,
        midtermGrade:      entry.midtermGrade,
        finalExamGrade:    entry.finalExamGrade,
        finalGrade:        entry.finalGrade,
        letterGrade:       entry.letterGrade,
        status:            entry.gradeStatus,
        enrollmentId:      entry.enrollmentId,
        gradedBy:          sub.facultyName,
        gradedAt:          sub.submittedAt,
        createdAt:         new Date().toISOString(),
      }
      const idx = MOCK_GRADES.findIndex((g) => g.enrollmentId === entry.enrollmentId)
      if (idx >= 0) Object.assign(MOCK_GRADES[idx], record)
      else MOCK_GRADES.push(record)
    })

    sub.status      = 'APPROVED'
    sub.reviewedAt  = new Date().toISOString()
    sub.reviewedBy  = user?.name ?? 'Registrar'

    MOCK_AUDIT_LOGS.push({
      id:        `al_${Date.now()}`,
      action:    'GRADE_APPROVAL',
      entity:    'GradeSubmission',
      entityId:  sub.id,
      details:   `${user?.name} approved grades for ${sub.subjectName} submitted by ${sub.facultyName} (${sub.entries.length} students)`,
      userId:    user?.id    ?? 'unknown',
      schoolId:  'school_1',
      createdAt: new Date().toISOString(),
    })

    MOCK_NOTIFICATIONS.push({
      id:        `notif_${Date.now()}`,
      title:     'Grades Approved',
      message:   `Your grade submission for ${sub.subjectName} has been approved and published to student records.`,
      type:      'GRADE_APPROVED',
      isRead:    false,
      link:      '/teacher/grades',
      schoolId:  'school_1',
      createdAt: new Date().toISOString(),
    })

    setProcessing(false)
    setReviewing(null)
    forceUpdate((n) => n + 1)
  }

  async function handleReject(sub: GradeSubmission) {
    if (!rejectReason.trim()) return
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 600))

    // Unlock offering so teacher can re-submit
    const { LOCKED_OFFERINGS } = await import('@/lib/mock-data')
    LOCKED_OFFERINGS.delete(sub.offeringId)

    sub.status           = 'REJECTED'
    sub.reviewedAt       = new Date().toISOString()
    sub.reviewedBy       = user?.name ?? 'Registrar'
    sub.rejectionReason  = rejectReason.trim()

    MOCK_AUDIT_LOGS.push({
      id:        `al_${Date.now()}`,
      action:    'GRADE_REJECTION',
      entity:    'GradeSubmission',
      entityId:  sub.id,
      details:   `${user?.name} rejected grades for ${sub.subjectName}. Reason: ${rejectReason}`,
      userId:    user?.id    ?? 'unknown',
      schoolId:  'school_1',
      createdAt: new Date().toISOString(),
    })

    MOCK_NOTIFICATIONS.push({
      id:        `notif_${Date.now()}`,
      title:     'Grade Submission Returned',
      message:   `Your submission for ${sub.subjectName} was returned for corrections. Reason: ${rejectReason}`,
      type:      'GRADE_REJECTED',
      isRead:    false,
      link:      '/teacher/grades',
      schoolId:  'school_1',
      createdAt: new Date().toISOString(),
    })

    setProcessing(false)
    setRejectModal(false)
    setReason('')
    setReviewing(null)
    forceUpdate((n) => n + 1)
  }

  const tabItems: { id: Tab; label: string; color: string }[] = [
    { id: 'PENDING',  label: 'Pending',  color: 'text-amber-600' },
    { id: 'APPROVED', label: 'Approved', color: 'text-emerald-600' },
    { id: 'REJECTED', label: 'Rejected', color: 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle description="Review and approve grade submissions from faculty before they enter official student records">
        Grade Finalization Room
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Review', value: counts.PENDING,  icon: Clock,         bg: 'bg-amber-50  border-amber-200',   text: 'text-amber-700' },
          { label: 'Approved',       value: counts.APPROVED, icon: CheckCircle2,  bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Rejected',       value: counts.REJECTED, icon: XCircle,       bg: 'bg-red-50    border-red-200',      text: 'text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${s.bg}`}>
            <s.icon className={`h-5 w-5 shrink-0 ${s.text}`} />
            <div>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#e4ebf5] bg-[#f3f6fb] p-1 w-fit">
        {tabItems.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                t.id === 'PENDING'  ? 'bg-amber-100 text-amber-700' :
                t.id === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                'bg-red-100 text-red-700'
              }`}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Submissions */}
      {filtered(tab).length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            {tab === 'PENDING'
              ? <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              : tab === 'APPROVED'
                ? <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                : <XCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />}
            <p className="text-sm text-slate-500">No {tab.toLowerCase()} submissions.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered(tab).map((sub) => (
            <Card key={sub.id} padding="none" className="overflow-hidden">
              <div className="border-l-4 pl-4 pr-5 py-4 h-full flex flex-col gap-3"
                style={{ borderColor: sub.status === 'APPROVED' ? '#10b981' : sub.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                      <BookOpen className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{sub.subjectName}</p>
                      <p className="text-xs text-slate-500">{sub.subjectCode}{sub.section ? ` · Section ${sub.section}` : ''}</p>
                    </div>
                  </div>
                  <StatusChip status={sub.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{sub.entries.length} students</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(sub.submittedAt)}</span>
                </div>

                <p className="text-xs text-slate-600">
                  <span className="font-medium">Teacher:</span> {sub.facultyName}
                </p>

                {sub.status === 'REJECTED' && sub.rejectionReason && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{sub.rejectionReason}</p>
                  </div>
                )}

                {sub.status === 'APPROVED' && (
                  <p className="text-xs text-slate-400">Approved by {sub.reviewedBy} · {formatDate(sub.reviewedAt)}</p>
                )}

                <button
                  onClick={() => setReviewing(sub)}
                  className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-[#dce8f7] bg-[#f3f6fb] px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> Review Grades
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review modal */}
      <Modal
        open={!!reviewing}
        onClose={() => !processing && setReviewing(null)}
        title={reviewing ? `${reviewing.subjectName} — Grade Review` : ''}
        description={reviewing ? `${reviewing.subjectCode}${reviewing.section ? ` · Section ${reviewing.section}` : ''} · Submitted by ${reviewing.facultyName}` : undefined}
        size="xl"
        footer={
          reviewing && canAct && reviewing.status === 'PENDING' ? (
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-slate-400">{reviewing.entries.length} students · submitted {formatDate(reviewing.submittedAt)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRejectModal(true)}
                  disabled={processing}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
                <Button
                  icon={processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  onClick={() => reviewing && handleApprove(reviewing)}
                  loading={processing}
                >
                  Approve & Publish
                </Button>
              </div>
            </div>
          ) : reviewing ? (
            <div className="flex items-center justify-between w-full">
              <StatusChip status={reviewing.status} />
              {reviewing.reviewedBy && (
                <p className="text-xs text-slate-400">
                  {reviewing.status === 'APPROVED' ? 'Approved' : 'Reviewed'} by {reviewing.reviewedBy} · {formatDate(reviewing.reviewedAt)}
                </p>
              )}
            </div>
          ) : null
        }
      >
        {reviewing && (
          <div className="overflow-auto max-h-[50vh]">
            <Table>
              <Thead>
                <Tr>
                  <Th>Student</Th>
                  <Th className="text-center">Quiz</Th>
                  <Th className="text-center">Assignment</Th>
                  <Th className="text-center">Midterm</Th>
                  <Th className="text-center">Final Exam</Th>
                  <Th className="text-center">Final Grade</Th>
                  <Th className="text-center">Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reviewing.entries.map((entry) => (
                  <Tr key={entry.enrollmentId}>
                    <Td>
                      <p className="font-medium text-slate-900 text-sm">{entry.studentName}</p>
                      <p className="text-xs text-slate-400">{entry.studentNo}</p>
                    </Td>
                    <Td className="text-center">{entry.quizAverage?.toFixed(1) ?? '—'}</Td>
                    <Td className="text-center">{entry.assignmentAverage?.toFixed(1) ?? '—'}</Td>
                    <Td className="text-center">{entry.midtermGrade?.toFixed(1) ?? '—'}</Td>
                    <Td className="text-center">{entry.finalExamGrade?.toFixed(1) ?? '—'}</Td>
                    <Td className="text-center">
                      {entry.finalGrade != null ? (
                        <div>
                          <p className={`text-base font-bold ${entry.finalGrade >= 75 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {entry.finalGrade.toFixed(1)}
                          </p>
                          <p className="text-xs font-mono text-slate-400">{entry.letterGrade}</p>
                        </div>
                      ) : '—'}
                    </Td>
                    <Td className="text-center"><GradeBadge status={entry.gradeStatus} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal
        open={rejectModal}
        onClose={() => !processing && setRejectModal(false)}
        title="Return Grades for Correction"
        description="Provide a reason so the faculty knows what to fix before re-submitting."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="soft" onClick={() => setRejectModal(false)} disabled={processing}>Cancel</Button>
            <button
              onClick={() => reviewing && handleReject(reviewing)}
              disabled={!rejectReason.trim() || processing}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Return to Faculty
            </button>
          </div>
        }
      >
        <div className="py-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reason for Return</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Missing final exam grades for 3 students…"
            className="w-full rounded-xl border border-[#dce8f7] px-3 py-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/15 resize-none"
          />
        </div>
      </Modal>
    </div>
  )
}
