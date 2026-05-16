'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MOCK_FIN_APPROVALS } from '@/lib/mock-data'
import type { FinancialApproval, FinApprovalStatus, FinApprovalType } from '@/types'
import { Clock, CheckCircle, XCircle, AlertCircle, Check, X } from 'lucide-react'

type TabFilter = 'ALL' | FinApprovalStatus

const TYPE_CFG: Record<FinApprovalType, { label: string; cls: string }> = {
  EXPENSE:           { label: 'Expense',          cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  BUDGET_ADJUSTMENT: { label: 'Budget Adjustment', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  JOURNAL_ENTRY:     { label: 'Journal Entry',     cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  PAYROLL:           { label: 'Payroll',           cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
}

const STATUS_CFG: Record<FinApprovalStatus, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 ring-amber-200',   icon: Clock },
  APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-600 ring-red-200',         icon: XCircle },
  ESCALATED: { label: 'Escalated', cls: 'bg-orange-50 text-orange-700 ring-orange-200', icon: AlertCircle },
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<FinancialApproval[]>(MOCK_FIN_APPROVALS)
  const [tab, setTab] = useState<TabFilter>('ALL')
  const [approveTarget, setApproveTarget] = useState<FinancialApproval | null>(null)
  const [rejectTarget, setRejectTarget] = useState<FinancialApproval | null>(null)
  const [approveComment, setApproveComment] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const filtered = useMemo(() => {
    if (tab === 'ALL') return approvals
    return approvals.filter(a => a.status === tab)
  }, [approvals, tab])

  const stats = useMemo(() => ({
    pending:  approvals.filter(a => a.status === 'PENDING').length,
    approved: approvals.filter(a => a.status === 'APPROVED').length,
    total:    approvals.length,
  }), [approvals])

  function handleApprove() {
    if (!approveTarget) return
    setApprovals(prev => prev.map(a => {
      if (a.id !== approveTarget.id) return a
      const updatedSteps = a.steps.map(s =>
        s.level === a.currentStep
          ? { ...s, status: 'APPROVED' as FinApprovalStatus, approverName: 'Clara Accounting', comment: approveComment, actionAt: new Date().toISOString() }
          : s
      )
      const allApproved = updatedSteps.every(s => s.status === 'APPROVED')
      const nextStep = a.currentStep + 1
      return {
        ...a,
        steps: updatedSteps,
        currentStep: allApproved ? a.currentStep : nextStep,
        status: allApproved ? 'APPROVED' : 'PENDING',
        updatedAt: new Date().toISOString(),
      }
    }))
    setApproveTarget(null)
    setApproveComment('')
  }

  function handleReject() {
    if (!rejectTarget) return
    setApprovals(prev => prev.map(a => {
      if (a.id !== rejectTarget.id) return a
      const updatedSteps = a.steps.map(s =>
        s.level === a.currentStep
          ? { ...s, status: 'REJECTED' as FinApprovalStatus, approverName: 'Clara Accounting', comment: rejectReason, actionAt: new Date().toISOString() }
          : s
      )
      return { ...a, steps: updatedSteps, status: 'REJECTED', updatedAt: new Date().toISOString() }
    }))
    setRejectTarget(null)
    setRejectReason('')
  }

  const tabCounts = useMemo(() => ({
    ALL: approvals.length,
    PENDING:  approvals.filter(a => a.status === 'PENDING').length,
    APPROVED: approvals.filter(a => a.status === 'APPROVED').length,
    REJECTED: approvals.filter(a => a.status === 'REJECTED').length,
    ESCALATED: approvals.filter(a => a.status === 'ESCALATED').length,
  }), [approvals])

  return (
    <div className="space-y-6">
      <SectionTitle description="Review and action financial approval requests.">Financial Approvals</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending"          value={stats.pending}  icon={Clock}        color="bg-amber-50 text-amber-600" />
        <StatCard label="Approved"         value={stats.approved} icon={CheckCircle}  color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total This Month" value={stats.total}    icon={AlertCircle}  color="bg-brand-50 text-brand-600" />
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as TabFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t === 'ALL' ? 'All' : STATUS_CFG[t as FinApprovalStatus].label} {tabCounts[t]}
          </button>
        ))}
      </div>

      {/* Approval Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(approval => {
          const typeCfg = TYPE_CFG[approval.type]
          const statusCfg = STATUS_CFG[approval.status]
          const StatusIcon = statusCfg.icon
          const canAction = approval.status === 'PENDING' && approval.steps[approval.currentStep - 1]?.approverRole === 'ACCOUNTING'

          return (
            <Card key={approval.id} className="relative">
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-600">{approval.approvalNumber}</span>
                  <Badge className={typeCfg.cls}>{typeCfg.label}</Badge>
                </div>
                <Badge className={statusCfg.cls}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusCfg.label}
                </Badge>
              </div>

              {/* Title & Amount */}
              <h3 className="font-bold text-slate-800 text-sm mb-1">{approval.title}</h3>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mb-3">{formatCurrency(approval.amount)}</p>

              {/* Info row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
                {approval.department && <span><span className="font-medium text-slate-600">Dept:</span> {approval.department}</span>}
                <span><span className="font-medium text-slate-600">By:</span> {approval.requestedByName}</span>
                <span><span className="font-medium text-slate-600">Requested:</span> {formatDate(approval.requestedAt)}</span>
              </div>

              {/* Approval Steps Timeline */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Approval Flow</p>
                <div className="flex items-center gap-2">
                  {approval.steps.map((step, i) => {
                    const isApproved = step.status === 'APPROVED'
                    const isRejected = step.status === 'REJECTED'
                    const isPending  = step.status === 'PENDING'
                    return (
                      <div key={step.id} className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold ${
                            isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-400'
                          }`}>
                            {isApproved ? <Check className="h-3.5 w-3.5" /> : isRejected ? <X className="h-3.5 w-3.5" /> : step.level}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 text-center leading-tight">
                            {step.approverRole === 'ACCOUNTING' ? 'Accounting' : 'Super Admin'}
                          </p>
                          {step.approverName && (
                            <p className="text-[10px] text-slate-400 text-center">{step.approverName}</p>
                          )}
                          {step.comment && (
                            <p className="text-[10px] text-slate-400 italic text-center max-w-[80px] truncate">{step.comment}</p>
                          )}
                        </div>
                        {i < approval.steps.length - 1 && (
                          <div className={`h-0.5 w-8 ${isApproved ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action buttons */}
              {canAction && (
                <div className="flex items-center gap-2 pt-3 border-t border-[#e4ebf5]">
                  <Button size="xs" variant="success" icon={<Check className="h-3 w-3" />} onClick={() => setApproveTarget(approval)}>
                    Approve
                  </Button>
                  <Button size="xs" variant="danger" icon={<X className="h-3 w-3" />} onClick={() => setRejectTarget(approval)}>
                    Reject
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm">No approvals in this category.</div>
      )}

      {/* Approve Modal */}
      <Modal
        open={!!approveTarget}
        onClose={() => { setApproveTarget(null); setApproveComment('') }}
        title="Approve Request"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setApproveTarget(null); setApproveComment('') }}>Cancel</Button>
            <Button variant="success" onClick={handleApprove}>Confirm Approval</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Approving <span className="font-bold">{approveTarget?.title}</span> for <span className="font-bold text-brand-600">{formatCurrency(approveTarget?.amount ?? 0)}</span>.
          </p>
          <Textarea label="Comment (optional)" value={approveComment} onChange={e => setApproveComment(e.target.value)} placeholder="Add a note..." rows={2} />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason('') }}
        title="Reject Request"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason('') }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>Confirm Rejection</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Rejecting <span className="font-bold">{rejectTarget?.title}</span> for <span className="font-bold text-red-600">{formatCurrency(rejectTarget?.amount ?? 0)}</span>.
          </p>
          <Textarea label="Reason *" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide rejection reason..." rows={3} />
        </div>
      </Modal>
    </div>
  )
}
