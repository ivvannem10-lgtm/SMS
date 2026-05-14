'use client'
import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  Clock, CheckCircle2, XCircle, Eye, RefreshCw, Lock, Unlock,
  BookOpen, AlertCircle, Users, Calendar, Send, RotateCcw,
  ChevronDown,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { GradeBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import {
  MOCK_GRADE_SUBMISSIONS, MOCK_GRADES, MOCK_AUDIT_LOGS, MOCK_NOTIFICATIONS,
  MOCK_ACADEMIC_YEARS, MOCK_SEMESTERS, LOCKED_OFFERINGS,
} from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import type { GradeSubmission, GradeSubmissionStatus, SessionUser } from '@/types'

type Tab = 'SUBMITTED' | 'CLOSED' | 'PUBLISHED' | 'RETURNED'

function StatusChip({ status }: { status: GradeSubmissionStatus }) {
  if (status === 'SUBMITTED') return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"><Clock className="h-3 w-3" />Submitted</span>
  if (status === 'CLOSED')    return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"><Lock className="h-3 w-3" />Closed</span>
  if (status === 'PUBLISHED') return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Published</span>
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"><RotateCcw className="h-3 w-3" />Returned</span>
}

export default function GradeFinalizationPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const canAct = user?.role === 'REGISTRAR' || user?.role === 'SUPER_ADMIN'

  const [tab,          setTab]         = useState<Tab>('SUBMITTED')
  const [reviewing,    setReviewing]   = useState<GradeSubmission | null>(null)
  const [returnModal,  setReturnModal] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [processing,   setProcessing]  = useState(false)
  const [, forceUpdate] = useState(0)

  // ── Academic Year → Semester cascade ─────────────────────────────────────
  const activeAY  = MOCK_ACADEMIC_YEARS.find((a) => a.isActive) ?? MOCK_ACADEMIC_YEARS[0]
  const activeSem = MOCK_SEMESTERS.find((s) => s.isActive) ?? MOCK_SEMESTERS[0]
  const [selectedAY,  setSelectedAY]  = useState(activeAY?.id ?? '')
  const [selectedSem, setSelectedSem] = useState(activeSem?.id ?? '')

  const semsForAY = useMemo(
    () => MOCK_SEMESTERS.filter((s) => s.academicYearId === selectedAY),
    [selectedAY]
  )

  function handleAYChange(ayId: string) {
    setSelectedAY(ayId)
    const sems = MOCK_SEMESTERS.filter((s) => s.academicYearId === ayId)
    setSelectedSem((sems.find((s) => s.isActive) ?? sems[0])?.id ?? '')
  }

  function filtered(s: Tab) {
    return MOCK_GRADE_SUBMISSIONS.filter(
      (sub) => sub.status === s && (!selectedSem || sub.semesterId === selectedSem)
    )
  }

  const counts = {
    SUBMITTED: filtered('SUBMITTED').length,
    CLOSED:    filtered('CLOSED').length,
    PUBLISHED: filtered('PUBLISHED').length,
    RETURNED:  filtered('RETURNED').length,
  }

  const now = () => new Date().toISOString()

  // ── Close submission (lock for registrar review) ──────────────────────────
  async function handleClose(sub: GradeSubmission) {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 500))
    sub.status   = 'CLOSED'
    sub.closedAt = now()
    sub.closedBy = user?.name ?? 'Registrar'
    LOCKED_OFFERINGS.add(sub.offeringId)
    MOCK_AUDIT_LOGS.push({
      id: `al_${Date.now()}`, action: 'GRADE_CLOSED', entity: 'GradeSubmission', entityId: sub.id,
      details: `${user?.name} closed grade submission for ${sub.subjectName}`,
      userId: user?.id ?? 'unknown', schoolId: 'school_1', createdAt: now(),
    })
    MOCK_NOTIFICATIONS.push({
      id: `notif_${Date.now()}`, title: 'Grade Submission Closed',
      message: `Your grade submission for ${sub.subjectName} has been closed by the Registrar and is under final review.`,
      type: 'GRADE_APPROVED', isRead: false, link: '/teacher/grades', schoolId: 'school_1', createdAt: now(),
    })
    setProcessing(false)
    setReviewing(null)
    forceUpdate((n) => n + 1)
  }

  // ── Reopen (return to teacher from CLOSED) ────────────────────────────────
  async function handleReopen(sub: GradeSubmission) {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 500))
    LOCKED_OFFERINGS.delete(sub.offeringId)
    sub.status     = 'RETURNED'
    sub.returnedAt = now()
    sub.returnedBy = user?.name ?? 'Registrar'
    sub.returnReason = 'Reopened by registrar — please review and resubmit your grades.'
    MOCK_AUDIT_LOGS.push({
      id: `al_${Date.now()}`, action: 'GRADE_REOPENED', entity: 'GradeSubmission', entityId: sub.id,
      details: `${user?.name} reopened grade submission for ${sub.subjectName} — returned to faculty`,
      userId: user?.id ?? 'unknown', schoolId: 'school_1', createdAt: now(),
    })
    MOCK_NOTIFICATIONS.push({
      id: `notif_${Date.now()}`, title: 'Grade Submission Reopened',
      message: `Your grade submission for ${sub.subjectName} has been reopened. Please review and resubmit.`,
      type: 'GRADE_REJECTED', isRead: false, link: '/teacher/grades', schoolId: 'school_1', createdAt: now(),
    })
    setProcessing(false)
    setReviewing(null)
    forceUpdate((n) => n + 1)
  }

  // ── Return to teacher (from SUBMITTED, with reason) ───────────────────────
  async function handleReturn(sub: GradeSubmission) {
    if (!returnReason.trim()) return
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 600))
    LOCKED_OFFERINGS.delete(sub.offeringId)
    sub.status       = 'RETURNED'
    sub.returnedAt   = now()
    sub.returnedBy   = user?.name ?? 'Registrar'
    sub.returnReason = returnReason.trim()
    MOCK_AUDIT_LOGS.push({
      id: `al_${Date.now()}`, action: 'GRADE_RETURNED', entity: 'GradeSubmission', entityId: sub.id,
      details: `${user?.name} returned grades for ${sub.subjectName}. Reason: ${returnReason}`,
      userId: user?.id ?? 'unknown', schoolId: 'school_1', createdAt: now(),
    })
    MOCK_NOTIFICATIONS.push({
      id: `notif_${Date.now()}`, title: 'Grades Returned for Correction',
      message: `Your submission for ${sub.subjectName} was returned. Reason: ${returnReason}`,
      type: 'GRADE_REJECTED', isRead: false, link: '/teacher/grades', schoolId: 'school_1', createdAt: now(),
    })
    setProcessing(false)
    setReturnModal(false)
    setReturnReason('')
    setReviewing(null)
    forceUpdate((n) => n + 1)
  }

  // ── Publish grades to student records ────────────────────────────────────
  async function handlePublish(sub: GradeSubmission) {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 800))
    sub.entries.forEach((entry) => {
      const record = {
        id: `grade_${entry.enrollmentId}`,
        quizAverage: entry.quizAverage, assignmentAverage: entry.assignmentAverage,
        midtermGrade: entry.midtermGrade, finalExamGrade: entry.finalExamGrade,
        finalGrade: entry.finalGrade, letterGrade: entry.letterGrade,
        status: entry.gradeStatus, enrollmentId: entry.enrollmentId,
        gradedBy: sub.facultyName, gradedAt: sub.submittedAt, createdAt: now(),
      }
      const idx = MOCK_GRADES.findIndex((g) => g.enrollmentId === entry.enrollmentId)
      if (idx >= 0) Object.assign(MOCK_GRADES[idx], record)
      else MOCK_GRADES.push(record)
    })
    sub.status      = 'PUBLISHED'
    sub.publishedAt = now()
    sub.publishedBy = user?.name ?? 'Registrar'
    LOCKED_OFFERINGS.add(sub.offeringId)
    MOCK_AUDIT_LOGS.push({
      id: `al_${Date.now()}`, action: 'GRADE_PUBLISHED', entity: 'GradeSubmission', entityId: sub.id,
      details: `${user?.name} published grades for ${sub.subjectName} (${sub.entries.length} students)`,
      userId: user?.id ?? 'unknown', schoolId: 'school_1', createdAt: now(),
    })
    MOCK_NOTIFICATIONS.push({
      id: `notif_${Date.now()}`, title: 'Grades Published',
      message: `Grades for ${sub.subjectName} have been published and are now visible to students.`,
      type: 'GRADE_APPROVED', isRead: false, link: '/teacher/grades', schoolId: 'school_1', createdAt: now(),
    })
    setProcessing(false)
    setReviewing(null)
    forceUpdate((n) => n + 1)
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; activeClass: string }[] = [
    { id: 'SUBMITTED', label: 'Submitted',  icon: Clock,         activeClass: 'bg-amber-500 text-white' },
    { id: 'CLOSED',    label: 'Closed',     icon: Lock,          activeClass: 'bg-blue-600 text-white' },
    { id: 'PUBLISHED', label: 'Published',  icon: CheckCircle2,  activeClass: 'bg-emerald-600 text-white' },
    { id: 'RETURNED',  label: 'Returned',   icon: RotateCcw,     activeClass: 'bg-red-500 text-white' },
  ]

  const borderColor = (s: GradeSubmissionStatus) =>
    s === 'PUBLISHED' ? '#10b981' : s === 'CLOSED' ? '#3b82f6' : s === 'RETURNED' ? '#ef4444' : '#f59e0b'

  return (
    <div className="space-y-6">
      <SectionTitle description="Manage grade submissions from faculty — close, review, return, and publish to student records">
        Grade Finalization Room
      </SectionTitle>

      {/* AY → Semester filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="relative">
            <select value={selectedAY} onChange={(e) => handleAYChange(e.target.value)}
              className="appearance-none rounded-lg border border-[#dce8f7] bg-white pl-3 pr-8 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15">
              {MOCK_ACADEMIC_YEARS.map((ay) => (
                <option key={ay.id} value={ay.id}>{ay.name}{ay.isActive ? ' (Active)' : ''}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
        <span className="text-slate-300">›</span>
        <div className="relative">
          <select value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)}
            className="appearance-none rounded-lg border border-[#dce8f7] bg-white pl-3 pr-8 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15">
            {semsForAY.length === 0 && <option value="">No semesters</option>}
            {semsForAY.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.isActive ? ' (Current)' : ''}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Submitted',  value: counts.SUBMITTED, icon: Clock,        bg: 'bg-amber-50  border-amber-200',    text: 'text-amber-700' },
          { label: 'Closed',     value: counts.CLOSED,    icon: Lock,         bg: 'bg-blue-50   border-blue-200',     text: 'text-blue-700' },
          { label: 'Published',  value: counts.PUBLISHED, icon: CheckCircle2, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Returned',   value: counts.RETURNED,  icon: RotateCcw,    bg: 'bg-red-50    border-red-200',      text: 'text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${s.bg}`}>
            <s.icon className={`h-5 w-5 shrink-0 ${s.text}`} />
            <div>
              <p className={`text-2xl font-bold tabular-nums ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline banner */}
      <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 flex items-center gap-3 flex-wrap text-xs font-semibold text-brand-700">
        <span className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5"/>Teacher Submits</span>
        <span className="text-brand-300">→</span>
        <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5"/>Registrar Closes</span>
        <span className="text-brand-300">→</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5"/>Registrar Publishes</span>
        <span className="text-brand-300">→</span>
        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5"/>Visible to Students</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#e4ebf5] bg-[#f3f6fb] p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.id ? t.activeClass + ' shadow' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                tab === t.id ? 'bg-white/25 text-white' :
                t.id === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                t.id === 'CLOSED'    ? 'bg-blue-100 text-blue-700' :
                t.id === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                'bg-red-100 text-red-700'
              }`}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Submission cards */}
      {filtered(tab).length === 0 ? (
        <Card>
          <div className="py-14 text-center">
            {tab === 'SUBMITTED' ? <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              : tab === 'CLOSED' ? <Lock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              : tab === 'PUBLISHED' ? <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              : <RotateCcw className="mx-auto mb-3 h-10 w-10 text-slate-300" />}
            <p className="text-sm font-semibold text-slate-500">No {tab.toLowerCase()} submissions</p>
            <p className="text-xs text-slate-400 mt-1">
              {tab === 'SUBMITTED' && 'Waiting for teachers to submit their grade sheets.'}
              {tab === 'CLOSED' && 'No submissions closed for review yet.'}
              {tab === 'PUBLISHED' && 'No grades have been published to student records yet.'}
              {tab === 'RETURNED' && 'No submissions have been returned to faculty.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered(tab).map((sub) => (
            <Card key={sub.id} padding="none" className="overflow-hidden">
              <div className="border-l-4 pl-4 pr-5 py-4 h-full flex flex-col gap-3"
                style={{ borderColor: borderColor(sub.status) }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                      <BookOpen className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{sub.subjectName}</p>
                      <p className="text-xs text-slate-500">{sub.subjectCode}{sub.section ? ` · Sec ${sub.section}` : ''}</p>
                    </div>
                  </div>
                  <StatusChip status={sub.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{sub.entries.length} students</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(sub.submittedAt)}</span>
                </div>

                <p className="text-xs text-slate-600"><span className="font-medium">Teacher:</span> {sub.facultyName}</p>

                {sub.status === 'RETURNED' && sub.returnReason && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{sub.returnReason}</p>
                  </div>
                )}

                {sub.status === 'CLOSED' && (
                  <p className="text-xs text-blue-600 flex items-center gap-1"><Lock className="h-3 w-3"/>Closed by {sub.closedBy} · {formatDate(sub.closedAt)}</p>
                )}

                {sub.status === 'PUBLISHED' && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/>Published by {sub.publishedBy} · {formatDate(sub.publishedAt)}</p>
                )}

                <button onClick={() => setReviewing(sub)}
                  className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-[#dce8f7] bg-[#f3f6fb] px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> Review Grades
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Review modal ── */}
      <Modal
        open={!!reviewing}
        onClose={() => !processing && setReviewing(null)}
        title={reviewing ? `${reviewing.subjectName} — Grade Review` : ''}
        description={reviewing ? `${reviewing.subjectCode}${reviewing.section ? ` · Section ${reviewing.section}` : ''} · ${reviewing.facultyName} · ${reviewing.entries.length} students` : undefined}
        size="xl"
        footer={reviewing && canAct ? (
          <div className="flex items-center justify-between w-full gap-3 flex-wrap">
            <StatusChip status={reviewing.status} />
            <div className="flex gap-2">
              {/* SUBMITTED → Close or Return */}
              {reviewing.status === 'SUBMITTED' && (
                <>
                  <button onClick={() => setReturnModal(true)} disabled={processing}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                    <RotateCcw className="h-4 w-4" /> Return to Teacher
                  </button>
                  <Button
                    icon={processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    onClick={() => reviewing && handleClose(reviewing)}
                    loading={processing}
                  >
                    Close Submission
                  </Button>
                </>
              )}
              {/* CLOSED → Reopen or Publish */}
              {reviewing.status === 'CLOSED' && (
                <>
                  <button onClick={() => reviewing && handleReopen(reviewing)} disabled={processing}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                    {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                    Reopen
                  </button>
                  <button onClick={() => reviewing && handlePublish(reviewing)} disabled={processing}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Publish to Students
                  </button>
                </>
              )}
            </div>
          </div>
        ) : reviewing ? (
          <div className="flex items-center justify-between w-full">
            <StatusChip status={reviewing.status} />
            {reviewing.status === 'PUBLISHED' && reviewing.publishedBy && (
              <p className="text-xs text-slate-400">Published by {reviewing.publishedBy} · {formatDate(reviewing.publishedAt)}</p>
            )}
          </div>
        ) : null}
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

      {/* ── Return reason modal ── */}
      <Modal
        open={returnModal}
        onClose={() => !processing && setReturnModal(false)}
        title="Return to Teacher"
        description="Provide a reason so the faculty knows what to correct before resubmitting."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="soft" onClick={() => setReturnModal(false)} disabled={processing}>Cancel</Button>
            <button
              onClick={() => reviewing && handleReturn(reviewing)}
              disabled={!returnReason.trim() || processing}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors">
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Return to Faculty
            </button>
          </div>
        }
      >
        <div className="py-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reason</label>
          <textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            rows={3}
            placeholder="e.g. Missing final exam grades for 3 students…"
            className="w-full rounded-xl border border-[#dce8f7] px-3 py-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/15 resize-none"
          />
        </div>
      </Modal>
    </div>
  )
}
