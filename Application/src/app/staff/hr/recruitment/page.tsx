'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SectionTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { MOCK_JOB_APPLICATIONS, MOCK_JOB_POSTINGS } from '@/lib/mock-data'
import type { JobApplication, AtsStage, InterviewType } from '@/types'
import {
  Star, Calendar, Mail, Phone, ChevronRight, X, UserCircle,
  CheckCircle, AlertCircle, Briefcase, ArrowRight, Filter,
} from 'lucide-react'

const PIPELINE: AtsStage[] = ['NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'FINAL_EVALUATION', 'HIRED']

const STAGE_META: Record<AtsStage, { label: string; color: string; header: string; badge: string }> = {
  NEW:                 { label: 'New',                color: 'border-slate-300',  header: 'bg-slate-50',   badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
  SCREENING:           { label: 'Screening',          color: 'border-blue-300',   header: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700 ring-blue-200' },
  SHORTLISTED:         { label: 'Shortlisted',        color: 'border-violet-300', header: 'bg-violet-50',  badge: 'bg-violet-100 text-violet-700 ring-violet-200' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled',color: 'border-amber-300',  header: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700 ring-amber-200' },
  INTERVIEW_COMPLETED: { label: 'Interview Done',     color: 'border-orange-300', header: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700 ring-orange-200' },
  FINAL_EVALUATION:    { label: 'Final Evaluation',   color: 'border-rose-300',   header: 'bg-rose-50',    badge: 'bg-rose-100 text-rose-700 ring-rose-200' },
  HIRED:               { label: 'Hired',              color: 'border-emerald-300',header: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  REJECTED:            { label: 'Rejected',           color: 'border-red-300',    header: 'bg-red-50',     badge: 'bg-red-100 text-red-700 ring-red-200' },
}

function StarRating({ value, onChange }: { value?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={cn('h-4 w-4', onChange ? 'cursor-pointer' : 'cursor-default')}
        >
          <Star
            className={cn('h-4 w-4', (value ?? 0) >= i ? 'fill-amber-400 text-amber-400' : 'text-slate-300')}
          />
        </button>
      ))}
    </div>
  )
}

function ApplicantCard({
  app,
  onMove,
  onClick,
}: {
  app: JobApplication
  onMove: (app: JobApplication) => void
  onClick: (app: JobApplication) => void
}) {
  const nextIdx = PIPELINE.indexOf(app.stage) + 1
  const hasNext = nextIdx < PIPELINE.length

  return (
    <div
      className="bg-white rounded-xl border border-[#e4ebf5] shadow-card p-3 cursor-pointer hover:shadow-card-md hover:-translate-y-px transition-all duration-150"
      onClick={() => onClick(app)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-slate-900 leading-tight">{app.applicantName}</p>
      </div>
      <p className="text-xs text-slate-500 mb-2 truncate">{app.jobTitle}</p>
      <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
        <Calendar className="h-3 w-3" />
        <span>{formatDate(app.appliedAt)}</span>
      </div>
      {app.rating && (
        <div className="mb-2">
          <StarRating value={app.rating} />
        </div>
      )}
      {app.interviewDate && (
        <div className="flex items-center gap-1 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 text-xs font-medium">
            <Calendar className="h-3 w-3" />
            {formatDate(app.interviewDate)}
          </span>
        </div>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove(app) }}
          className="mt-1 w-full flex items-center justify-center gap-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs font-medium py-1 transition-colors"
        >
          Move to {STAGE_META[PIPELINE[nextIdx]].label}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function SlideOver({
  app,
  onClose,
  onSave,
}: {
  app: JobApplication
  onClose: () => void
  onSave: (updated: JobApplication) => void
}) {
  const confirm = useConfirm()
  const [form, setForm] = useState<JobApplication>({ ...app })
  const [rejectReason, setRejectReason] = useState(app.rejectionReason ?? '')

  async function handleSave() {
    if (form.stage === 'REJECTED' && app.stage !== 'REJECTED') {
      const ok = await confirm({
        title: 'Reject Applicant?',
        message: 'This will move the applicant to the rejected stage.',
        variant: 'danger',
        confirmLabel: 'Reject Applicant',
      })
      if (!ok) return
    }
    if (form.stage === 'HIRED' && app.stage !== 'HIRED') {
      const ok = await confirm({
        title: 'Mark as Hired?',
        message: 'This will finalize hiring for this applicant.',
        variant: 'success',
        confirmLabel: 'Confirm Hire',
      })
      if (!ok) return
    }
    const updated = { ...form, rejectionReason: form.stage === 'REJECTED' ? rejectReason : form.rejectionReason, updatedAt: new Date().toISOString() }
    onSave(updated)
  }

  return (
    <div className="fixed inset-0 z-[36] flex justify-end pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-[#e4ebf5]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-brand-500" />
            <span className="font-semibold text-slate-900">{app.applicantName}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <span>{app.jobTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{app.email}</span>
            </div>
            {app.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{app.phone}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rating</label>
            <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as AtsStage }))}
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            >
              {([...PIPELINE, 'REJECTED'] as AtsStage[]).map((s) => (
                <option key={s} value={s}>{STAGE_META[s].label}</option>
              ))}
            </select>
          </div>

          {form.stage === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none"
                placeholder="Reason for rejection..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none"
              placeholder="Internal notes..."
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Interview Scheduling</p>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={form.interviewDate ? form.interviewDate.slice(0, 16) : ''}
                onChange={(e) => setForm((f) => ({ ...f, interviewDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Interview Type</label>
              <select
                value={form.interviewType ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, interviewType: (e.target.value || undefined) as InterviewType | undefined }))}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              >
                <option value="">Select type</option>
                <option value="PHONE">Phone</option>
                <option value="VIDEO">Video</option>
                <option value="ONSITE">Onsite</option>
                <option value="PANEL">Panel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Meeting Link (optional)</label>
              <input
                type="url"
                value={form.interviewLink ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, interviewLink: e.target.value || undefined }))}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                placeholder="https://meet.google.com/..."
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Interview Notes</label>
              <textarea
                value={form.interviewNotes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, interviewNotes: e.target.value || undefined }))}
                rows={2}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none"
                placeholder="Post-interview remarks..."
              />
            </div>
          </div>

          {form.stage === 'HIRED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Salary Offer (PHP)</label>
              <input
                type="number"
                value={form.offeredSalary ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, offeredSalary: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                placeholder="e.g. 35000"
              />
              {form.offeredSalary && (
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(form.offeredSalary)}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#e4ebf5]">
          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function RecruitmentInner() {
  const searchParams = useSearchParams()
  const jobFilter = searchParams.get('jobId') ?? 'all'
  const confirm = useConfirm()

  const [apps, setApps] = useState<JobApplication[]>(MOCK_JOB_APPLICATIONS)
  const [selectedJobId, setSelectedJobId] = useState(jobFilter)
  const [slideOver, setSlideOver] = useState<JobApplication | null>(null)
  const [rejectedOpen, setRejectedOpen] = useState(false)

  const openJobs = MOCK_JOB_POSTINGS.filter((j) => j.status === 'OPEN')
  const filtered = selectedJobId === 'all' ? apps : apps.filter((a) => a.jobId === selectedJobId)

  const mainApps = filtered.filter((a) => a.stage !== 'REJECTED')
  const rejectedApps = filtered.filter((a) => a.stage === 'REJECTED')

  async function moveToNext(app: JobApplication) {
    const idx = PIPELINE.indexOf(app.stage)
    if (idx < 0 || idx >= PIPELINE.length - 1) return
    const nextStage = PIPELINE[idx + 1]
    if (nextStage === 'HIRED') {
      const ok = await confirm({
        title: 'Mark as Hired?',
        message: 'This will finalize hiring for this applicant.',
        variant: 'success',
        confirmLabel: 'Confirm Hire',
      })
      if (!ok) return
    }
    const target = MOCK_JOB_APPLICATIONS.find((a) => a.id === app.id)
    if (target) {
      target.stage = nextStage
      target.updatedAt = new Date().toISOString()
    }
    setApps([...MOCK_JOB_APPLICATIONS])
  }

  function handleSave(updated: JobApplication) {
    const target = MOCK_JOB_APPLICATIONS.find((a) => a.id === updated.id)
    if (target) Object.assign(target, updated)
    setApps([...MOCK_JOB_APPLICATIONS])
    setSlideOver(null)
  }

  return (
    <div className="flex flex-col h-full">
      <SectionTitle
        description={`${apps.filter((a) => a.stage !== 'REJECTED').length} applicants across ${openJobs.length} open positions`}
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            >
              <option value="all">All Jobs</option>
              {MOCK_JOB_POSTINGS.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
        }
      >
        Recruitment Pipeline
      </SectionTitle>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE.map((stage) => {
            const meta = STAGE_META[stage]
            const stageApps = mainApps.filter((a) => a.stage === stage)
            return (
              <div
                key={stage}
                className={cn('flex flex-col w-64 rounded-xl border-2 overflow-hidden', meta.color)}
              >
                <div className={cn('flex items-center justify-between px-3 py-2.5', meta.header)}>
                  <span className="text-xs font-semibold text-slate-700">{meta.label}</span>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset', meta.badge)}>
                    {stageApps.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2 min-h-[120px]">
                  {stageApps.map((app) => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      onMove={moveToNext}
                      onClick={setSlideOver}
                    />
                  ))}
                  {stageApps.length === 0 && (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-xs text-slate-400">No applicants</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-[#e4ebf5] shadow-card overflow-hidden">
        <button
          onClick={() => setRejectedOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-slate-700">
              Rejected ({rejectedApps.length})
            </span>
          </div>
          <ChevronRight className={cn('h-4 w-4 text-slate-400 transition-transform', rejectedOpen && 'rotate-90')} />
        </button>
        {rejectedOpen && (
          <div className="overflow-x-auto border-t border-[#e4ebf5]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-brand-700 uppercase tracking-widest">Applicant</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-brand-700 uppercase tracking-widest">Position</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-brand-700 uppercase tracking-widest">Reason</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-brand-700 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody>
                {rejectedApps.map((app) => (
                  <tr key={app.id} className="border-b border-[#f0f4fa] hover:bg-brand-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{app.applicantName}</p>
                      <p className="text-xs text-slate-500">{app.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{app.jobTitle}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm max-w-xs">
                      <p className="line-clamp-2">{app.rejectionReason ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(app.updatedAt)}</td>
                  </tr>
                ))}
                {rejectedApps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">No rejected applicants</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {slideOver && (
        <>
          <div className="fixed inset-0 z-[25] bg-brand-900/30" onClick={() => setSlideOver(null)} />
          <SlideOver app={slideOver} onClose={() => setSlideOver(null)} onSave={handleSave} />
        </>
      )}
    </div>
  )
}

export default function RecruitmentPage() {
  return (
    <Suspense>
      <RecruitmentInner />
    </Suspense>
  )
}
