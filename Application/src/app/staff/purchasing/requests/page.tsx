'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import {
  MOCK_PURCHASE_REQUESTS, MOCK_BUDGETS, MOCK_BUDGET_EXPENSES,
  MOCK_BUDGET_RESERVATIONS, MOCK_NOTIFICATIONS, MOCK_AUDIT_LOGS,
} from '@/lib/mock-data'
import type { PurchaseRequest, PRStatus, PRPriority, PRItem } from '@/types'
import { Plus, ChevronDown, CheckCircle2, XCircle, Clock, Eye, ArrowRight, Bell } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { SessionUser } from '@/types'

const PR_STATUS_MAP: Record<PRStatus, { label: string; cls: string }> = {
  DRAFT:               { label: 'Draft',         cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  SUBMITTED:           { label: 'Submitted',     cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  UNDER_REVIEW:        { label: 'Under Review',  cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  APPROVED:            { label: 'Approved',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REJECTED:            { label: 'Rejected',      cls: 'bg-red-50 text-red-700 ring-red-200' },
  PROCUREMENT_ONGOING: { label: 'Procurement',   cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELIVERED:           { label: 'Delivered',     cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  CLOSED:              { label: 'Closed',        cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  CANCELLED:           { label: 'Cancelled',     cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
}

const PR_PRIORITY_MAP: Record<PRPriority, { label: string; cls: string }> = {
  LOW:    { label: 'Low',    cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  NORMAL: { label: 'Normal', cls: 'bg-blue-50 text-blue-600 ring-blue-200' },
  HIGH:   { label: 'High',   cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  URGENT: { label: 'Urgent', cls: 'bg-red-50 text-red-600 ring-red-200' },
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'ALL',                label: 'All' },
  { key: 'SUBMITTED',          label: 'Submitted' },
  { key: 'UNDER_REVIEW',       label: 'Under Review' },
  { key: 'APPROVED',           label: 'Approved' },
  { key: 'REJECTED',           label: 'Rejected' },
  { key: 'PROCUREMENT_ONGOING',label: 'Procurement' },
  { key: 'DELIVERED',          label: 'Delivered' },
]

const DEPARTMENTS = ['College of Computing','College of Business','College of Nursing','Arts & Sciences','Administration']

const EMPTY_ITEM: PRItem = { id: '', name: '', quantity: 1, unit: 'unit', estimatedCost: 0 }

export default function PurchaseRequestsPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const role = user?.role ?? ''

  const [prs, setPRs]           = useState<PurchaseRequest[]>(MOCK_PURCHASE_REQUESTS)
  const [tab, setTab]           = useState('ALL')
  const [viewPR, setViewPR]     = useState<PurchaseRequest | null>(null)
  const [createOpen, setCreate] = useState(false)
  const [rejectOpen, setReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Create PR form
  const [form, setForm] = useState({
    title: '', department: DEPARTMENTS[0], purpose: '', priority: 'NORMAL' as PRPriority,
    notes: '',
  })
  const [items, setItems] = useState<PRItem[]>([{ ...EMPTY_ITEM, id: 'new_0' }])
  const [saving, setSaving]         = useState(false)
  const [budgetError, setBudgetError] = useState('')
  const [successPR, setSuccessPR]   = useState<{ prNumber: string; dept: string; amount: number } | null>(null)

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.estimatedCost, 0)

  const filtered = useMemo(() => {
    if (tab === 'ALL') return prs
    return prs.filter(pr => pr.status === tab)
  }, [prs, tab])

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM, id: `new_${Date.now()}` }])
  }
  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }
  function updateItem(id: string, key: keyof PRItem, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i))
  }

  function checkBudget(deptId: string, amount: number) {
    const budget = MOCK_BUDGETS.find(b => b.department === deptId)
    if (!budget) return { ok: false, msg: 'No budget found for this department.' }
    const spent = MOCK_BUDGET_EXPENSES.filter(e => e.budgetId === budget.id).reduce((s,e) => s + e.amount, 0)
    const reserved = MOCK_BUDGET_RESERVATIONS.filter(r => r.budgetId === budget.id && r.status === 'ACTIVE').reduce((s,r) => s + r.amount, 0)
    const remaining = budget.amount - spent - reserved
    if (amount > remaining) return { ok: false, msg: `Insufficient budget. Available: ${formatCurrency(remaining)} (Budget: ${formatCurrency(budget.amount)} - Spent: ${formatCurrency(spent)} - Reserved: ${formatCurrency(reserved)})` }
    return { ok: true, msg: '', budgetId: budget.id }
  }

  function handleCreate() {
    setBudgetError('')
    const check = checkBudget(form.department, totalAmount)
    if (!check.ok) { setBudgetError(check.msg); return }

    setSaving(true)
    setTimeout(() => {
      const newSeq = String(MOCK_PURCHASE_REQUESTS.length + 1).padStart(5, '0')
      const newPR: PurchaseRequest = {
        id: `pr_${Date.now()}`,
        prNumber: `PR-2025-${newSeq}`,
        title: form.title, department: form.department,
        requestedBy: user?.id ?? 'u_purchasing', requestedByName: user?.name ?? 'Staff',
        items: items.map((i, idx) => ({ ...i, id: `pri_new_${idx}` })),
        totalAmount,
        purpose: form.purpose, priority: form.priority,
        status: 'SUBMITTED', notes: form.notes || undefined,
        budgetId: check.budgetId,
        approvalChain: [
          { step: 1, role: 'ACCOUNTING', status: 'PENDING' },
          { step: 2, role: 'PURCHASING_OFFICER', status: 'PENDING' },
        ],
        schoolId: 'school_1',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      }
      MOCK_PURCHASE_REQUESTS.push(newPR)

      // Budget reservation
      if (check.budgetId) {
        MOCK_BUDGET_RESERVATIONS.push({
          id: `br_${Date.now()}`, budgetId: check.budgetId, prId: newPR.id,
          prNumber: newPR.prNumber, department: form.department,
          amount: totalAmount, status: 'ACTIVE', createdAt: new Date().toISOString(),
        })
        // Update PR with reservationId
        const idx = MOCK_PURCHASE_REQUESTS.findIndex(p => p.id === newPR.id)
        if (idx >= 0) {
          MOCK_PURCHASE_REQUESTS[idx] = { ...MOCK_PURCHASE_REQUESTS[idx], reservationId: MOCK_BUDGET_RESERVATIONS[MOCK_BUDGET_RESERVATIONS.length-1].id }
        }
      }

      const now = new Date().toISOString()
      // Notify submitter — submitted confirmation
      MOCK_NOTIFICATIONS.push({
        id: `notif_${Date.now()}`, type: 'PR', isRead: false, schoolId: 'school_1', createdAt: now,
        title: `Purchase Request Submitted — ${newPR.prNumber}`,
        message: `Your request "${newPR.title}" (${formatCurrency(totalAmount)}) has been submitted.\n\nNext Step → Step 1 of 2: Awaiting Accounting Officer review. You will be notified once it is approved or returned.`,
        link: '/staff/purchasing/requests',
      })
      // Notify accounting — action required
      MOCK_NOTIFICATIONS.push({
        id: `notif_${Date.now() + 1}`, type: 'PR', isRead: false, schoolId: 'school_1', createdAt: now,
        userId: 'u_accounting',
        title: `New Purchase Request Requires Your Review — ${newPR.prNumber}`,
        message: `${newPR.requestedByName} submitted a purchase request from ${form.department} for ${formatCurrency(totalAmount)}.\n\nAction Required → Step 1 of 2: Review and approve or reject this request.`,
        link: '/staff/purchasing/requests',
      })
      MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'CREATE_PR', entity:'PurchaseRequest', entityId:newPR.id, details:`PR ${newPR.prNumber} submitted by ${user?.name}`, userId:user?.id??'u_purchasing', schoolId:'school_1', createdAt: now })

      setPRs([...MOCK_PURCHASE_REQUESTS])
      setSuccessPR({ prNumber: newPR.prNumber, dept: form.department, amount: totalAmount })
      setForm({ title:'', department:DEPARTMENTS[0], purpose:'', priority:'NORMAL', notes:'' })
      setItems([{ ...EMPTY_ITEM, id: 'new_0' }])
      setSaving(false)
    }, 600)
  }

  function handleApprove(pr: PurchaseRequest) {
    const canApprove = (role === 'ACCOUNTING' || role === 'SUPER_ADMIN') &&
      pr.approvalChain.some(a => a.role === 'ACCOUNTING' && a.status === 'PENDING')
      || (role === 'PURCHASING_OFFICER' || role === 'SUPER_ADMIN') &&
      pr.approvalChain.some(a => a.role === 'PURCHASING_OFFICER' && a.status === 'PENDING')

    const idx = MOCK_PURCHASE_REQUESTS.findIndex(p => p.id === pr.id)
    if (idx < 0) return

    const chain = [...pr.approvalChain]
    // Approve the step matching role
    const stepToApprove = role === 'ACCOUNTING' || (role === 'SUPER_ADMIN' && chain.find(a=>a.role==='ACCOUNTING'&&a.status==='PENDING'))
      ? chain.find(a => a.role === 'ACCOUNTING' && a.status === 'PENDING')
      : chain.find(a => a.role === 'PURCHASING_OFFICER' && a.status === 'PENDING')

    if (!stepToApprove) return

    stepToApprove.status = 'APPROVED'
    stepToApprove.approverName = user?.name ?? role
    stepToApprove.timestamp = new Date().toISOString()

    const allApproved = chain.every(a => a.status === 'APPROVED')
    const newStatus: PRStatus = allApproved ? 'APPROVED'
      : stepToApprove.role === 'ACCOUNTING' ? 'UNDER_REVIEW'
      : 'APPROVED'

    MOCK_PURCHASE_REQUESTS[idx] = { ...pr, approvalChain: chain, status: newStatus, updatedAt: new Date().toISOString(), approvedAt: allApproved ? new Date().toISOString() : undefined }
    const now2 = new Date().toISOString()
    if (allApproved) {
      // Fully approved — notify submitter
      MOCK_NOTIFICATIONS.push({
        id: `notif_${Date.now()}`, type: 'PR', isRead: false, schoolId: 'school_1', createdAt: now2,
        userId: pr.requestedBy,
        title: `Purchase Request Fully Approved — ${pr.prNumber}`,
        message: `Great news! Your purchase request "${pr.title}" has been fully approved by all parties.\n\nNext Step → Proceed to create a Purchase Order in the Purchasing module to begin procurement.`,
        link: '/staff/purchasing/orders',
      })
    } else {
      // Step 1 approved — notify purchasing officer
      MOCK_NOTIFICATIONS.push({
        id: `notif_${Date.now()}`, type: 'PR', isRead: false, schoolId: 'school_1', createdAt: now2,
        userId: 'u_purchasing',
        title: `Purchase Request Ready for Your Review — ${pr.prNumber}`,
        message: `${pr.prNumber} from ${pr.department} (${formatCurrency(pr.totalAmount)}) has passed Accounting review.\n\nAction Required → Step 2 of 2: Review and approve or reject this purchase request.`,
        link: '/staff/purchasing/requests',
      })
      // Notify submitter of progress
      MOCK_NOTIFICATIONS.push({
        id: `notif_${Date.now() + 1}`, type: 'PR', isRead: false, schoolId: 'school_1', createdAt: now2,
        userId: pr.requestedBy,
        title: `Purchase Request Update — ${pr.prNumber}`,
        message: `Your request "${pr.title}" has been approved by the Accounting Office.\n\nNext Step → Step 2 of 2: Awaiting Purchasing Officer final approval.`,
        link: '/staff/purchasing/requests',
      })
    }
    setPRs([...MOCK_PURCHASE_REQUESTS])
    setViewPR(MOCK_PURCHASE_REQUESTS[idx])
  }

  function handleRejectSubmit(pr: PurchaseRequest) {
    const idx = MOCK_PURCHASE_REQUESTS.findIndex(p => p.id === pr.id)
    if (idx < 0) return
    const chain = [...pr.approvalChain]
    const step = chain.find(a => a.status === 'PENDING')
    if (step) { step.status = 'REJECTED'; step.comments = rejectReason; step.timestamp = new Date().toISOString() }
    MOCK_PURCHASE_REQUESTS[idx] = { ...pr, approvalChain: chain, status: 'REJECTED', rejectionReason: rejectReason, rejectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    // Release reservation
    const res = MOCK_BUDGET_RESERVATIONS.find(r => r.prId === pr.id && r.status === 'ACTIVE')
    if (res) { res.status = 'RELEASED'; res.releasedAt = new Date().toISOString() }
    MOCK_NOTIFICATIONS.push({
      id: `notif_${Date.now()}`, type: 'PR', isRead: false, schoolId: 'school_1', createdAt: new Date().toISOString(),
      userId: pr.requestedBy,
      title: `Purchase Request Rejected — ${pr.prNumber}`,
      message: `Your purchase request "${pr.title}" was rejected by ${user?.name ?? 'the reviewer'}.\n\nReason: ${rejectReason}\n\nNext Step → You may revise and resubmit a new Purchase Request addressing the rejection reason.`,
      link: '/staff/purchasing/requests',
    })
    setPRs([...MOCK_PURCHASE_REQUESTS])
    setViewPR(MOCK_PURCHASE_REQUESTS[idx])
    setReject(false)
    setRejectReason('')
  }

  const canApproveAsAccounting    = (pr: PurchaseRequest) => ['ACCOUNTING','SUPER_ADMIN'].includes(role) && pr.approvalChain.some(a => a.role==='ACCOUNTING' && a.status==='PENDING')
  const canApproveAsPurchasing    = (pr: PurchaseRequest) => ['PURCHASING_OFFICER','SUPER_ADMIN'].includes(role) && pr.approvalChain.some(a => a.role==='PURCHASING_OFFICER' && a.status==='PENDING')
  const canReject                  = (pr: PurchaseRequest) => ['ACCOUNTING','PURCHASING_OFFICER','SUPER_ADMIN'].includes(role) && pr.approvalChain.some(a => a.status==='PENDING') && !['APPROVED','REJECTED','CLOSED','CANCELLED'].includes(pr.status)

  return (
    <div className="space-y-6">
      <SectionTitle description="Manage purchase requests — submit, review, and approve."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5"/>} onClick={() => setCreate(true)}>Create PR</Button>}
      >Purchase Requests</SectionTitle>

      {/* Filter Tabs */}
      <div className="flex gap-1 flex-wrap bg-white border border-[#e4ebf5] rounded-xl p-1 w-fit">
        {FILTER_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${tab===t.key ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {t.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${tab===t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {t.key === 'ALL' ? prs.length : prs.filter(p=>p.status===t.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* PR List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="text-center py-10 text-slate-400">No purchase requests found.</Card>
        )}
        {filtered.map(pr => {
          const s = PR_STATUS_MAP[pr.status]
          const p = PR_PRIORITY_MAP[pr.priority]
          return (
            <Card key={pr.id} className="hover:border-brand-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-brand-600 font-bold">{pr.prNumber}</span>
                    <Badge className={s.cls}>{s.label}</Badge>
                    <Badge className={p.cls}>{p.label}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-1">{pr.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{pr.department} · Requested by {pr.requestedByName}</p>
                  <p className="text-xs text-slate-400 mt-1">Submitted: {pr.submittedAt ? formatDate(pr.submittedAt) : '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(pr.totalAmount)}</p>
                  <p className="text-xs text-slate-400">{pr.items.length} item{pr.items.length !== 1 ? 's' : ''}</p>
                  <Button size="xs" variant="soft" className="mt-2" icon={<Eye className="h-3 w-3"/>} onClick={() => setViewPR(pr)}>View</Button>
                </div>
              </div>
              {/* Approval chain mini */}
              <div className="mt-3 pt-3 border-t border-[#f0f4fa] flex gap-3">
                {pr.approvalChain.map(a => (
                  <div key={a.step} className={`flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 ${
                    a.status==='APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                    a.status==='REJECTED' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {a.status==='APPROVED' ? <CheckCircle2 className="h-3 w-3"/> : a.status==='REJECTED' ? <XCircle className="h-3 w-3"/> : <Clock className="h-3 w-3"/>}
                    {a.role === 'PURCHASING_OFFICER' ? 'Purchasing' : a.role}: {a.status === 'PENDING' ? 'Pending' : a.status}
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* View PR Modal */}
      <Modal open={!!viewPR} onClose={() => setViewPR(null)} title="Purchase Request Details" size="xl"
        footer={
          viewPR ? (
            <div className="flex gap-2 w-full">
              <div className="flex-1"/>
              {canApproveAsAccounting(viewPR) && (
                <Button variant="success" size="sm" onClick={() => handleApprove(viewPR)}>Approve (Accounting)</Button>
              )}
              {canApproveAsPurchasing(viewPR) && (
                <Button variant="success" size="sm" onClick={() => handleApprove(viewPR)}>Approve (Purchasing)</Button>
              )}
              {canReject(viewPR) && (
                <Button variant="danger" size="sm" onClick={() => setReject(true)}>Reject</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setViewPR(null)}>Close</Button>
            </div>
          ) : undefined
        }
      >
        {viewPR && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-brand-600 font-bold">{viewPR.prNumber}</span>
                  <Badge className={PR_STATUS_MAP[viewPR.status].cls}>{PR_STATUS_MAP[viewPR.status].label}</Badge>
                  <Badge className={PR_PRIORITY_MAP[viewPR.priority].cls}>{PR_PRIORITY_MAP[viewPR.priority].label}</Badge>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{viewPR.title}</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-600">{formatCurrency(viewPR.totalAmount)}</p>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Department', viewPR.department],
                ['Requested By', viewPR.requestedByName],
                ['Submitted', viewPR.submittedAt ? formatDateTime(viewPR.submittedAt) : '—'],
                ['Purpose', viewPR.purpose],
              ].map(([k,v]) => (
                <div key={k}><span className="text-slate-500">{k}: </span><span className="font-medium text-slate-800">{v}</span></div>
              ))}
            </div>

            {viewPR.rejectionReason && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                <strong>Rejection Reason:</strong> {viewPR.rejectionReason}
              </div>
            )}

            {/* Budget Balance */}
            {(() => {
              const budget = MOCK_BUDGETS.find(b => b.department === viewPR.department)
              if (!budget) return (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  No budget allocated for <strong>{viewPR.department}</strong>.
                </div>
              )
              const spent     = MOCK_BUDGET_EXPENSES.filter(e => e.budgetId === budget.id).reduce((s, e) => s + e.amount, 0)
              const reserved  = MOCK_BUDGET_RESERVATIONS.filter(r => r.budgetId === budget.id && r.status === 'ACTIVE' && r.prId !== viewPR.id).reduce((s, r) => s + r.amount, 0)
              const available = budget.amount - spent - reserved
              const sufficient = available >= viewPR.totalAmount
              const shortfall  = viewPR.totalAmount - available
              return (
                <div className={`rounded-xl border px-4 py-3 ${sufficient ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-600">Department Budget Balance</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Budget</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(budget.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Spent</span>
                      <span className="font-semibold text-red-600">−{formatCurrency(spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reserved (other PRs)</span>
                      <span className="font-semibold text-amber-600">−{formatCurrency(reserved)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">This PR Amount</span>
                      <span className="font-semibold text-brand-700">{formatCurrency(viewPR.totalAmount)}</span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${sufficient ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    <span className={`text-sm font-bold ${sufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                      Available Balance
                    </span>
                    <div className="text-right">
                      <p className={`text-xl font-bold tabular-nums ${sufficient ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(available)}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${sufficient ? 'text-emerald-600' : 'text-red-600'}`}>
                        {sufficient
                          ? `✓ Sufficient — ${formatCurrency(available - viewPR.totalAmount)} will remain after approval`
                          : `✗ Short by ${formatCurrency(shortfall)} — insufficient budget`}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Items */}
            <div>
              <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">Requested Items</p>
              <Card padding="none">
                <Table>
                  <Thead>
                    <Th>Item</Th>
                    <Th>Qty</Th>
                    <Th>Unit</Th>
                    <Th>Est. Cost</Th>
                    <Th>Subtotal</Th>
                  </Thead>
                  <Tbody>
                    {viewPR.items.map(item => (
                      <Tr key={item.id}>
                        <Td>
                          <p className="font-medium text-slate-800">{item.name}</p>
                          {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
                        </Td>
                        <Td>{item.quantity}</Td>
                        <Td>{item.unit}</Td>
                        <Td>{formatCurrency(item.estimatedCost)}</Td>
                        <Td className="font-semibold">{formatCurrency(item.quantity * item.estimatedCost)}</Td>
                      </Tr>
                    ))}
                    <Tr className="bg-brand-50">
                      <Td colSpan={4} className="font-bold text-right text-brand-700">Total</Td>
                      <Td className="font-bold text-brand-700">{formatCurrency(viewPR.totalAmount)}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Card>
            </div>

            {/* Next Step Banner */}
            {(() => {
              const pendingStep = viewPR.approvalChain.find(a => a.status === 'PENDING')
              if (!pendingStep || ['APPROVED','REJECTED','CLOSED','CANCELLED'].includes(viewPR.status)) return null
              const isAccounting = pendingStep.role === 'ACCOUNTING'
              return (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 mt-0.5">
                    <ArrowRight className="h-3.5 w-3.5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-0.5">
                      Next Step — Step {pendingStep.step} of {viewPR.approvalChain.length}
                    </p>
                    <p className="text-sm font-semibold text-amber-900">
                      Awaiting {isAccounting ? 'Accounting Officer' : 'Purchasing Officer'} Review
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {isAccounting
                        ? 'The Accounting Office must verify budget availability and approve this request before it proceeds to the Purchasing Officer.'
                        : 'Accounting has approved this request. The Purchasing Officer must give final approval before procurement begins.'}
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Fully approved next step */}
            {viewPR.status === 'APPROVED' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200 mt-0.5">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-0.5">Next Step — Fully Approved</p>
                  <p className="text-sm font-semibold text-emerald-900">Create a Purchase Order</p>
                  <p className="text-xs text-emerald-700 mt-0.5">This request has been approved by all parties. Proceed to the Purchase Orders module to create a PO and begin procurement.</p>
                </div>
              </div>
            )}

            {/* Rejected next step */}
            {viewPR.status === 'REJECTED' && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-200 mt-0.5">
                  <XCircle className="h-3.5 w-3.5 text-red-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-0.5">Request Rejected</p>
                  <p className="text-sm font-semibold text-red-900">Revise and Resubmit</p>
                  <p className="text-xs text-red-700 mt-0.5">Address the rejection reason and submit a new purchase request. The requester has been notified.</p>
                </div>
              </div>
            )}

            {/* Approval Chain */}
            <div>
              <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3">Approval Timeline</p>
              <div className="space-y-3">
                {viewPR.approvalChain.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${
                    a.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' :
                    a.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      a.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                      a.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-slate-300 text-white'
                    }`}>
                      {a.status === 'APPROVED' ? <CheckCircle2 className="h-3.5 w-3.5"/> :
                       a.status === 'REJECTED' ? <XCircle className="h-3.5 w-3.5"/> :
                       <Clock className="h-3.5 w-3.5"/>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Step {a.step}: {a.role === 'PURCHASING_OFFICER' ? 'Purchasing Officer' : a.role}</p>
                      {a.approverName && <p className="text-xs text-slate-500">By: {a.approverName}</p>}
                      {a.timestamp && <p className="text-xs text-slate-400">{formatDateTime(a.timestamp)}</p>}
                      {a.comments && <p className="text-xs text-slate-600 mt-1 italic">"{a.comments}"</p>}
                      {a.status === 'PENDING' && <p className="text-xs text-amber-600 font-medium mt-0.5">Awaiting approval</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectOpen} onClose={() => setReject(false)} title="Reject Purchase Request" size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setReject(false)}>Cancel</Button>
          <Button variant="danger" disabled={!rejectReason.trim()} onClick={() => viewPR && handleRejectSubmit(viewPR)}>Reject PR</Button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Provide a reason for rejection. This will be visible to the requester.</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} placeholder="Reason for rejection..."
            className="w-full text-sm border border-[#dce8f7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"/>
        </div>
      </Modal>

      {/* Create PR Modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreate(false); setSuccessPR(null) }}
        title={successPR ? 'Request Submitted' : 'Create Purchase Request'}
        size="xl"
        footer={
          successPR ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setCreate(false); setSuccessPR(null) }}>Close</Button>
              <Button variant="soft" onClick={() => setSuccessPR(null)}>Submit Another PR</Button>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={() => setCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={saving} disabled={!form.title || !form.purpose || items.length === 0} onClick={handleCreate}>Submit PR</Button>
            </>
          )
        }
      >
        {/* ── Success panel ──────────────────────────────────────────────────── */}
        {successPR ? (
          <div className="py-4 space-y-5">
            {/* Confirmation header */}
            <div className="flex flex-col items-center text-center py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-3">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Purchase Request Submitted!</h3>
              <p className="text-sm text-slate-500 mt-1">Your request has been recorded and forwarded for review.</p>
            </div>

            {/* PR details */}
            <div className="rounded-xl bg-brand-50 border border-brand-100 px-5 py-4">
              <p className="text-xs text-brand-500 font-semibold uppercase tracking-widest mb-2">Request Details</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold font-mono text-brand-700">{successPR.prNumber}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{successPR.dept}</p>
                </div>
                <p className="text-2xl font-bold text-brand-600">{formatCurrency(successPR.amount)}</p>
              </div>
            </div>

            {/* Approval workflow next steps */}
            <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#f8fafd] border-b border-[#e4ebf5]">
                <Bell className="h-4 w-4 text-brand-500" />
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Approval Workflow — What Happens Next</p>
              </div>
              <div className="divide-y divide-[#f0f4fa]">
                {[
                  {
                    step: 1, icon: CheckCircle2, done: true,
                    label: 'Submitted',
                    desc: 'Your purchase request has been recorded and budget reserved.',
                    color: 'text-emerald-600', bg: 'bg-emerald-50',
                  },
                  {
                    step: 2, icon: Clock, done: false,
                    label: 'Accounting Review',
                    desc: 'The Accounting Officer will verify budget availability and approve or return the request. You\'ll be notified once actioned.',
                    color: 'text-amber-600', bg: 'bg-amber-50',
                    current: true,
                  },
                  {
                    step: 3, icon: Clock, done: false,
                    label: 'Purchasing Officer Approval',
                    desc: 'After Accounting approves, the Purchasing Officer will do the final review before procurement begins.',
                    color: 'text-slate-400', bg: 'bg-slate-50',
                  },
                  {
                    step: 4, icon: ArrowRight, done: false,
                    label: 'Purchase Order Created',
                    desc: 'Once fully approved, a Purchase Order will be created to begin the procurement process.',
                    color: 'text-slate-400', bg: 'bg-slate-50',
                  },
                ].map(s => (
                  <div key={s.step} className={`flex items-start gap-3 px-4 py-3 ${s.current ? 'bg-amber-50/50' : ''}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 ${s.bg}`}>
                      <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-bold ${s.current ? 'text-amber-700' : s.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                          Step {s.step}: {s.label}
                        </p>
                        {s.current && <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">CURRENT</span>}
                        {s.done && <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5">DONE</span>}
                      </div>
                      <p className={`text-xs mt-0.5 leading-relaxed ${s.current ? 'text-amber-600' : s.done ? 'text-emerald-600' : 'text-slate-400'}`}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
              <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value as PRPriority}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Purpose *</label>
              <textarea value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))} rows={2}
                className="w-full text-sm border border-[#dce8f7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"/>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-widest">Requested Items</p>
              <Button size="xs" variant="soft" icon={<Plus className="h-3 w-3"/>} onClick={addItem}>Add Item</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    {i === 0 && <label className="block text-2xs text-slate-500 mb-0.5">Item Name</label>}
                    <input value={item.name} onChange={e=>updateItem(item.id,'name',e.target.value)}
                      placeholder="Item name" className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="block text-2xs text-slate-500 mb-0.5">Qty</label>}
                    <input type="number" value={item.quantity} onChange={e=>updateItem(item.id,'quantity',parseInt(e.target.value)||1)} min="1"
                      className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="block text-2xs text-slate-500 mb-0.5">Unit</label>}
                    <input value={item.unit} onChange={e=>updateItem(item.id,'unit',e.target.value)}
                      className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="block text-2xs text-slate-500 mb-0.5">Est. Cost (each)</label>}
                    <input type="number" value={item.estimatedCost} onChange={e=>updateItem(item.id,'estimatedCost',parseFloat(e.target.value)||0)} min="0"
                      className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-1 flex items-end pb-0">
                    <button onClick={()=>removeItem(item.id)} disabled={items.length===1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-sm font-bold text-brand-700">Total: {formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {budgetError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{budgetError}</div>
          )}
        </div>
        )} {/* end else (form view) */}
      </Modal>
    </div>
  )
}
