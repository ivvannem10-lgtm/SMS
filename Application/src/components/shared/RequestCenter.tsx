'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar, ShoppingCart, Monitor, MessageSquare,
  Plus, Eye, CheckCircle, XCircle, Clock, Inbox,
  ChevronRight, AlertCircle, ClipboardList, LayoutTemplate,
  FileText, Search, Send, Edit3, Users, Copy, Archive,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FormsCenter } from '@/components/shared/FormsCenter'
import {
  MOCK_REQUESTS, MOCK_NOTIFICATIONS, MOCK_AUDIT_LOGS, nextReqNumber,
  MOCK_FORMS, nextFormId,
} from '@/lib/mock-data'
import { formatDate, formatDateTime } from '@/lib/utils'
import type {
  ChampionDept, RequestCategory, RequestType, RequestStatus,
  RequestPriority, UniversalRequest, RequestActivity,
  InstitutionalForm, FormStatus, FormVisibility, Role,
} from '@/types'

const FORM_BUILDER_ROLES: Role[] = [
  'SUPER_ADMIN', 'REGISTRAR', 'HR_STAFF', 'ACCOUNTING',
  'ACADEMIC_ADMIN', 'PURCHASING_OFFICER', 'AMO', 'DEAN',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  portal: 'staff' | 'teacher' | 'student'
  userId: string
  userName: string
  userRole: string
  championDept?: ChampionDept
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TO_CHAMPION: Record<RequestCategory, ChampionDept> = {
  LEAVE: 'HR',
  PURCHASE: 'PURCHASING',
  ASSET: 'AMO',
  GENERAL: 'ADMIN',
}

const CHAMPION_QUEUE_LABELS: Record<ChampionDept, string> = {
  HR: 'HR Department Queue',
  PURCHASING: 'Purchasing Queue',
  AMO: 'Asset Management Queue',
  ADMIN: 'Admin Queue',
}

const STATUS_BADGE: Record<RequestStatus, string> = {
  DRAFT:        'bg-slate-100 text-slate-600',
  SUBMITTED:    'bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
  APPROVED:     'bg-emerald-50 text-emerald-700',
  REJECTED:     'bg-red-50 text-red-700',
  PROCESSING:   'bg-violet-50 text-violet-700',
  COMPLETED:    'bg-teal-50 text-teal-700',
  CANCELLED:    'bg-gray-100 text-gray-600',
}

const PRIORITY_BADGE: Record<RequestPriority, string> = {
  LOW:    'bg-slate-100 text-slate-600',
  NORMAL: 'bg-blue-50 text-blue-700',
  HIGH:   'bg-amber-50 text-amber-700',
  URGENT: 'bg-red-50 text-red-700',
}

const TYPE_LABELS: Record<RequestType, string> = {
  VACATION_LEAVE: 'Vacation Leave',
  SICK_LEAVE: 'Sick Leave',
  MATERNITY_LEAVE: 'Maternity Leave',
  PATERNITY_LEAVE: 'Paternity Leave',
  EMERGENCY_LEAVE: 'Emergency Leave',
  OFFICIAL_BUSINESS_LEAVE: 'Official Business Leave',
  PURCHASE_REQUEST: 'Purchase Request',
  PROCUREMENT_REQUEST: 'Procurement Request',
  SUPPLY_REQUEST: 'Supply Request',
  EQUIPMENT_PURCHASE: 'Equipment Purchase',
  PC_REQUEST: 'PC Request',
  LAPTOP_REQUEST: 'Laptop Request',
  EQUIPMENT_BORROW: 'Equipment Borrow',
  DEVICE_DEPLOYMENT: 'Device Deployment',
  ASSET_RETURN: 'Asset Return',
  GENERAL_REQUEST: 'General Request',
}

interface TypeGroup {
  category: RequestCategory
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
  types: { type: RequestType; label: string }[]
}

const ALL_TYPE_GROUPS: TypeGroup[] = [
  {
    category: 'LEAVE', icon: Calendar, color: 'text-emerald-600', bgColor: 'bg-emerald-50',
    label: 'Leave Request',
    types: [
      { type: 'VACATION_LEAVE', label: 'Vacation Leave' },
      { type: 'SICK_LEAVE', label: 'Sick Leave' },
      { type: 'MATERNITY_LEAVE', label: 'Maternity Leave' },
      { type: 'PATERNITY_LEAVE', label: 'Paternity Leave' },
      { type: 'EMERGENCY_LEAVE', label: 'Emergency Leave' },
      { type: 'OFFICIAL_BUSINESS_LEAVE', label: 'Official Business Leave' },
    ],
  },
  {
    category: 'PURCHASE', icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50',
    label: 'Purchase / Procurement',
    types: [
      { type: 'PURCHASE_REQUEST', label: 'Purchase Request' },
      { type: 'PROCUREMENT_REQUEST', label: 'Procurement Request' },
      { type: 'SUPPLY_REQUEST', label: 'Supply Request' },
      { type: 'EQUIPMENT_PURCHASE', label: 'Equipment Purchase' },
    ],
  },
  {
    category: 'ASSET', icon: Monitor, color: 'text-violet-600', bgColor: 'bg-violet-50',
    label: 'Asset / Equipment',
    types: [
      { type: 'PC_REQUEST', label: 'PC Request' },
      { type: 'LAPTOP_REQUEST', label: 'Laptop Request' },
      { type: 'EQUIPMENT_BORROW', label: 'Equipment Borrow' },
      { type: 'DEVICE_DEPLOYMENT', label: 'Device Deployment' },
      { type: 'ASSET_RETURN', label: 'Asset Return' },
    ],
  },
  {
    category: 'GENERAL', icon: MessageSquare, color: 'text-slate-600', bgColor: 'bg-slate-100',
    label: 'General Request',
    types: [{ type: 'GENERAL_REQUEST', label: 'General Request' }],
  },
]

function getTypeGroups(portal: Props['portal']): TypeGroup[] {
  if (portal === 'student') {
    return ALL_TYPE_GROUPS.filter((g) => g.category === 'ASSET' || g.category === 'GENERAL')
  }
  return ALL_TYPE_GROUPS
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[priority]}`}>
      {priority}
    </span>
  )
}

function TypeBadge({ type }: { type: RequestType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
      {TYPE_LABELS[type]}
    </span>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function RequestDetailModal({
  req,
  onClose,
  isChampion,
  championDept,
  userName,
  onUpdate,
}: {
  req: UniversalRequest
  onClose: () => void
  isChampion: boolean
  championDept?: ChampionDept
  userName: string
  onUpdate: () => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)

  function pushActivity(action: string, remarks?: string) {
    const act: RequestActivity = {
      id: `ra_${Date.now()}`,
      action,
      performedBy: userName,
      timestamp: new Date().toISOString(),
      remarks,
    }
    req.activities.push(act)
    req.updatedAt = new Date().toISOString()
  }

  function handleAction(newStatus: RequestStatus, action: string, remarks?: string) {
    setLoading(true)
    req.status = newStatus
    pushActivity(action, remarks)
    if (newStatus === 'COMPLETED') req.completedAt = new Date().toISOString()
    onUpdate()
    setLoading(false)
  }

  const canAct = isChampion && (req.championDept === championDept || championDept === undefined)

  return (
    <Modal open onClose={onClose} title={req.reqNumber} description={req.title} size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>Close</Button>
      }
    >
      {/* Status row */}
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={req.status} />
        <PriorityBadge priority={req.priority} />
        <TypeBadge type={req.type} />
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {req.championDept} Dept
        </span>
      </div>

      {/* Form data */}
      <div className="rounded-xl border border-[#e4ebf5] bg-[#f8fafd] p-4 mb-5">
        <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3">Request Details</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(req.formData).map(([k, v]) => (
            v !== undefined && v !== '' ? (
              <div key={k}>
                <p className="text-2xs text-slate-400 uppercase tracking-wider font-medium capitalize">
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-sm text-slate-700 font-medium mt-0.5">{String(v)}</p>
              </div>
            ) : null
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-5">
        <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3">Activity Timeline</p>
        <div className="relative pl-5 space-y-4">
          {/* vertical line */}
          <span className="absolute left-[7px] top-1 bottom-1 w-[2px] bg-slate-200 rounded-full" />
          {req.activities.map((a, i) => (
            <div key={a.id} className="relative flex gap-3">
              <span className={`absolute -left-5 mt-0.5 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center ${i === req.activities.length - 1 ? 'bg-brand-500' : 'bg-slate-300'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{a.action}</span>
                  {a.performedByRole && (
                    <span className="text-2xs text-slate-400">by {a.performedBy}</span>
                  )}
                </div>
                <p className="text-2xs text-slate-400 mt-0.5">{formatDateTime(a.timestamp)}</p>
                {a.remarks && (
                  <p className="mt-1 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{a.remarks}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Champion actions */}
      {canAct && (
        <div className="rounded-xl border border-[#e4ebf5] bg-[#f8fafd] p-4">
          <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3">Champion Actions</p>
          <div className="flex flex-wrap gap-2">
            {req.status === 'SUBMITTED' && (
              <>
                <Button size="sm" variant="soft" icon={<Clock className="h-3.5 w-3.5" />} loading={loading}
                  onClick={() => handleAction('UNDER_REVIEW', 'Marked Under Review')}>
                  Mark Under Review
                </Button>
                <Button size="sm" variant="danger" icon={<XCircle className="h-3.5 w-3.5" />}
                  onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
            {req.status === 'UNDER_REVIEW' && (
              <>
                <Button size="sm" variant="success" icon={<CheckCircle className="h-3.5 w-3.5" />} loading={loading}
                  onClick={() => handleAction('APPROVED', 'Approved')}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" icon={<XCircle className="h-3.5 w-3.5" />}
                  onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
            {req.status === 'APPROVED' && (
              <Button size="sm" variant="soft" icon={<Clock className="h-3.5 w-3.5" />} loading={loading}
                onClick={() => handleAction('PROCESSING', 'Marked Processing')}>
                Mark Processing
              </Button>
            )}
            {req.status === 'PROCESSING' && (
              <Button size="sm" variant="success" icon={<CheckCircle className="h-3.5 w-3.5" />} loading={loading}
                onClick={() => handleAction('COMPLETED', 'Marked Completed')}>
                Mark Completed
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Reject reason sub-modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setRejectOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-card-lg overflow-hidden">
            <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-[#e4ebf5]">
              <span className="mt-1 block w-[3px] h-5 rounded-full bg-red-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Request</h3>
                <p className="mt-0.5 text-sm text-slate-500">Provide a reason for rejection.</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <textarea
                className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                rows={3}
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e4ebf5]">
              <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={loading}
                onClick={() => {
                  handleAction('REJECTED', 'Rejected', rejectReason || undefined)
                  setRejectOpen(false)
                }}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Leave Form ───────────────────────────────────────────────────────────────

function LeaveForm({
  formData,
  onChange,
}: {
  formData: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Type <span className="text-red-500">*</span></label>
        <select className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          value={formData.leaveType ?? ''} onChange={(e) => onChange('leaveType', e.target.value)}>
          <option value="">Select leave type...</option>
          <option value="VACATION_LEAVE">Vacation Leave</option>
          <option value="SICK_LEAVE">Sick Leave</option>
          <option value="MATERNITY_LEAVE">Maternity Leave</option>
          <option value="PATERNITY_LEAVE">Paternity Leave</option>
          <option value="EMERGENCY_LEAVE">Emergency Leave</option>
          <option value="OFFICIAL_BUSINESS_LEAVE">Official Business Leave</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
          <input type="date" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            value={formData.startDate ?? ''} onChange={(e) => onChange('startDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
          <input type="date" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            value={formData.endDate ?? ''} onChange={(e) => onChange('endDate', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason <span className="text-red-500">*</span></label>
        <textarea className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          rows={3} placeholder="Provide reason for leave..."
          value={formData.reason ?? ''} onChange={(e) => onChange('reason', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Emergency Contact</label>
        <input type="text" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          placeholder="Contact number during leave..."
          value={formData.emergencyContact ?? ''} onChange={(e) => onChange('emergencyContact', e.target.value)} />
      </div>
    </div>
  )
}

// ─── Purchase Form ────────────────────────────────────────────────────────────

function PurchaseForm({
  formData,
  onChange,
}: {
  formData: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Item Name <span className="text-red-500">*</span></label>
        <input type="text" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          placeholder="Name of item or service..."
          value={formData.itemName ?? ''} onChange={(e) => onChange('itemName', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity <span className="text-red-500">*</span></label>
          <input type="number" min="1" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            placeholder="1"
            value={formData.quantity ?? ''} onChange={(e) => onChange('quantity', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Estimated Cost (PHP) <span className="text-red-500">*</span></label>
          <input type="number" min="0" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            placeholder="0.00"
            value={formData.estimatedCost ?? ''} onChange={(e) => onChange('estimatedCost', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose <span className="text-red-500">*</span></label>
        <textarea className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          rows={3} placeholder="Purpose of this purchase..."
          value={formData.purpose ?? ''} onChange={(e) => onChange('purpose', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
        <select className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          value={formData.priority ?? 'NORMAL'} onChange={(e) => onChange('priority', e.target.value)}>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
    </div>
  )
}

// ─── Asset Form ───────────────────────────────────────────────────────────────

function AssetForm({
  formData,
  onChange,
}: {
  formData: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Asset Type <span className="text-red-500">*</span></label>
        <select className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          value={formData.assetType ?? ''} onChange={(e) => onChange('assetType', e.target.value)}>
          <option value="">Select asset type...</option>
          <option value="PC">PC (Desktop Computer)</option>
          <option value="Laptop">Laptop</option>
          <option value="Printer">Printer</option>
          <option value="Projector">Projector</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose <span className="text-red-500">*</span></label>
        <textarea className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          rows={3} placeholder="How will this asset be used?"
          value={formData.purpose ?? ''} onChange={(e) => onChange('purpose', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deployment Date <span className="text-red-500">*</span></label>
          <input type="date" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            value={formData.deploymentDate ?? ''} onChange={(e) => onChange('deploymentDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Return Date</label>
          <input type="date" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            value={formData.returnDate ?? ''} onChange={(e) => onChange('returnDate', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department / College</label>
        <input type="text" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          placeholder="e.g. College of Computing"
          value={formData.department ?? ''} onChange={(e) => onChange('department', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Justification <span className="text-red-500">*</span></label>
        <textarea className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          rows={3} placeholder="Why do you need this asset?"
          value={formData.justification ?? ''} onChange={(e) => onChange('justification', e.target.value)} />
      </div>
    </div>
  )
}

// ─── General Form ─────────────────────────────────────────────────────────────

function GeneralForm({
  formData,
  onChange,
}: {
  formData: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
        <input type="text" className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          placeholder="Brief subject of the request..."
          value={formData.subject ?? ''} onChange={(e) => onChange('subject', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description <span className="text-red-500">*</span></label>
        <textarea className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          rows={4} placeholder="Describe your request in detail..."
          value={formData.description ?? ''} onChange={(e) => onChange('description', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
        <select className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          value={formData.priority ?? 'NORMAL'} onChange={(e) => onChange('priority', e.target.value)}>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
    </div>
  )
}

// ─── Form Builder Tab (full feature parity with /staff/forms) ────────────────

const FORM_CATEGORIES = ['Request', 'Survey', 'Evaluation', 'Registration', 'Feedback', 'Incident Report', 'Other']
const FORM_DEPARTMENTS = ['Human Resources', 'Academic Affairs', 'Administration', 'Asset Management', 'Finance', 'Registrar', 'IT Support', 'Other']
const FORM_VISIBILITIES: { value: FormVisibility; label: string }[] = [
  { value: 'PUBLIC_INTERNAL', label: 'All Users (Public Internal)' },
  { value: 'STAFF_ONLY',      label: 'Staff Only' },
  { value: 'STUDENT_ONLY',    label: 'Student Only' },
  { value: 'DEPARTMENT_ONLY', label: 'Department Only' },
  { value: 'CUSTOM',          label: 'Custom' },
]

function statusBorderColor(s: FormStatus) {
  if (s === 'PUBLISHED') return 'border-l-4 border-l-emerald-500'
  if (s === 'DRAFT')     return 'border-l-4 border-l-slate-400'
  if (s === 'CLOSED')    return 'border-l-4 border-l-amber-500'
  return 'border-l-4 border-l-gray-300'
}

function FormStatusBadge({ status }: { status: FormStatus }) {
  const map: Record<FormStatus, string> = {
    DRAFT:    'bg-slate-100 text-slate-600',
    PUBLISHED:'bg-emerald-50 text-emerald-700',
    CLOSED:   'bg-amber-50 text-amber-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  )
}

function FormCategoryBadge({ category }: { category: string }) {
  const map: Record<string, string> = {
    'Request': 'bg-blue-50 text-blue-700',
    'Survey': 'bg-violet-50 text-violet-700',
    'Evaluation': 'bg-teal-50 text-teal-700',
    'Feedback': 'bg-pink-50 text-pink-700',
    'Registration': 'bg-orange-50 text-orange-700',
    'Incident Report': 'bg-red-50 text-red-700',
    'Other': 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[category] ?? 'bg-slate-100 text-slate-600'}`}>
      {category}
    </span>
  )
}

function FormVisibilityBadge({ visibility }: { visibility: FormVisibility }) {
  const map: Record<FormVisibility, string> = {
    PUBLIC_INTERNAL: 'bg-sky-50 text-sky-700',
    STAFF_ONLY:      'bg-indigo-50 text-indigo-700',
    STUDENT_ONLY:    'bg-green-50 text-green-700',
    DEPARTMENT_ONLY: 'bg-amber-50 text-amber-700',
    CUSTOM:          'bg-slate-100 text-slate-600',
  }
  const labels: Record<FormVisibility, string> = {
    PUBLIC_INTERNAL: 'Public',
    STAFF_ONLY:      'Staff',
    STUDENT_ONLY:    'Students',
    DEPARTMENT_ONLY: 'Dept',
    CUSTOM:          'Custom',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[visibility]}`}>
      {labels[visibility]}
    </span>
  )
}

function FormBuilderTab({ onRefresh }: { onRefresh: () => void }) {
  const router = useRouter()
  const [tab, setTab] = useState<FormStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newTitle, setNewTitle]   = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [newCat, setNewCat]       = useState('Request')
  const [newDept, setNewDept]     = useState('Administration')
  const [newVis, setNewVis]       = useState<FormVisibility>('STAFF_ONLY')

  const STATUS_TABS = ['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED', 'ARCHIVED'] as const

  const filtered = MOCK_FORMS.filter(f => {
    if (tab !== 'ALL' && f.status !== tab) return false
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalForms = MOCK_FORMS.length
  const published  = MOCK_FORMS.filter(f => f.status === 'PUBLISHED').length
  const totalSubs  = MOCK_FORMS.reduce((s, f) => s + f.submissionCount, 0)
  const drafts     = MOCK_FORMS.filter(f => f.status === 'DRAFT').length

  function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    const id = nextFormId()
    const now = new Date().toISOString()
    const form: InstitutionalForm = {
      id,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      category: newCat,
      department: newDept,
      status: 'DRAFT',
      visibility: newVis,
      fields: [],
      settings: {
        oneSubmissionPerUser: false,
        allowAnonymous: false,
        autoCloseOnDeadline: false,
        showProgressBar: true,
        successMessage: 'Your response has been submitted successfully. Thank you!',
      },
      submissionCount: 0,
      schoolId: 'school_1',
      createdBy: 'u_staff',
      createdByName: 'Staff',
      createdAt: now,
      updatedAt: now,
    }
    MOCK_FORMS.push(form)
    setCreating(false)
    setShowNew(false)
    setNewTitle('')
    setNewDesc('')
    onRefresh()
    router.push(`/staff/forms/${id}/builder`)
  }

  function togglePublish(form: InstitutionalForm) {
    const f = MOCK_FORMS.find(x => x.id === form.id)
    if (!f) return
    if (f.status === 'PUBLISHED') {
      f.status = 'DRAFT'
      f.updatedAt = new Date().toISOString()
    } else if (f.status === 'DRAFT') {
      f.status = 'PUBLISHED'
      f.publishedAt = new Date().toISOString()
      f.updatedAt = new Date().toISOString()
    }
    onRefresh()
  }

  function duplicateForm(form: InstitutionalForm) {
    const id = nextFormId()
    const now = new Date().toISOString()
    MOCK_FORMS.push({
      ...form,
      id,
      title: `Copy of ${form.title}`,
      status: 'DRAFT',
      submissionCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      closedAt: undefined,
    })
    onRefresh()
  }

  function archiveForm(form: InstitutionalForm) {
    const f = MOCK_FORMS.find(x => x.id === form.id)
    if (!f) return
    f.status = 'ARCHIVED'
    f.updatedAt = new Date().toISOString()
    onRefresh()
  }

  return (
    <div>
      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Forms',       value: totalForms, icon: FileText,      color: 'bg-brand-50 text-brand-500' },
          { label: 'Published',         value: published,  icon: Send,          color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Submissions', value: totalSubs,  icon: ClipboardList, color: 'bg-violet-50 text-violet-600' },
          { label: 'Drafts',            value: drafts,     icon: Edit3,         color: 'bg-slate-100 text-slate-500' },
        ].map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} padding="sm">
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <p className="text-xl font-bold tabular-nums text-slate-800">{s.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Toolbar: status filter + search + new button */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-[#e4ebf5] text-slate-600 hover:bg-brand-50'
              }`}>
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search forms…"
              className="h-8 w-52 rounded-lg border border-[#e4ebf5] bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowNew(true)}>
            New Form
          </Button>
        </div>
      </div>

      {/* Form cards grid */}
      {filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-16 text-center">
            <LayoutTemplate className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No forms found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new form</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(form => (
            <div key={form.id}
              className={`bg-white rounded-xl border border-[#e4ebf5] shadow-card overflow-hidden ${statusBorderColor(form.status)}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-800 leading-snug flex-1 min-w-0">{form.title}</h3>
                  <FormStatusBadge status={form.status} />
                </div>
                {form.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{form.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <FormCategoryBadge category={form.category} />
                  <FormVisibilityBadge visibility={form.visibility} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{form.department}</span>
                  <span className="shrink-0 ml-2">{form.submissionCount} submission{form.submissionCount !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{formatDate(form.createdAt)}</p>
              </div>

              {/* Action bar */}
              <div className="border-t border-[#e4ebf5] bg-[#f8fafd] px-4 py-2.5 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => router.push(`/staff/forms/${form.id}/builder`)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Edit3 className="h-3 w-3" />Edit
                </button>
                <button
                  onClick={() => router.push(`/staff/forms/${form.id}/submissions`)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Eye className="h-3 w-3" />Submissions
                </button>
                {(form.status === 'PUBLISHED' || form.status === 'DRAFT') && (
                  <button
                    onClick={() => togglePublish(form)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      form.status === 'PUBLISHED'
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {form.status === 'PUBLISHED'
                      ? <><XCircle className="h-3 w-3" />Unpublish</>
                      : <><Send className="h-3 w-3" />Publish</>}
                  </button>
                )}
                <button
                  onClick={() => duplicateForm(form)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Copy className="h-3 w-3" />Duplicate
                </button>
                {form.status !== 'ARCHIVED' && (
                  <button
                    onClick={() => archiveForm(form)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <Archive className="h-3 w-3" />Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Form Modal — full version */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Create New Form"
        description="Create a new institutional form. You'll be taken to the form builder after saving."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newTitle.trim()}>
              Create & Open Builder
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Form Title <span className="text-red-500">*</span></label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Faculty Leave Request Form"
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Brief description of this form's purpose…"
              rows={2}
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {FORM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select value={newDept} onChange={e => setNewDept(e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {FORM_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Visibility</label>
            <select value={newVis} onChange={e => setNewVis(e.target.value as FormVisibility)}
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
              {FORM_VISIBILITIES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RequestCenter({ portal, userId, userName, userRole, championDept }: Props) {
  const [tick, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick((t) => t + 1), [])

  const canBuildForms = FORM_BUILDER_ROLES.includes(userRole as Role) && portal === 'staff'

  const [activeTab, setActiveTab] = useState<'my' | 'new' | 'incoming' | 'forms' | 'builder'>('my')

  // New Request state
  const [newStep, setNewStep] = useState<'type-select' | 'form' | 'success'>('type-select')
  const [selectedGroup, setSelectedGroup] = useState<TypeGroup | null>(null)
  const [selectedType, setSelectedType] = useState<RequestType | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [lastReqNumber, setLastReqNumber] = useState<string>('')

  // Detail modal
  const [viewingReq, setViewingReq] = useState<UniversalRequest | null>(null)

  // My Requests filter
  const [myFilter, setMyFilter] = useState<RequestStatus | 'ALL'>('ALL')

  // Derived data
  const myRequests = MOCK_REQUESTS.filter((r) => r.submittedBy === userId)
  const pendingCount = myRequests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length
  const completedCount = myRequests.filter((r) => r.status === 'COMPLETED').length

  const incomingRequests = championDept
    ? MOCK_REQUESTS.filter(
        (r) => r.championDept === championDept &&
          (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'APPROVED' || r.status === 'PROCESSING'),
      )
    : []

  const filteredMy = myFilter === 'ALL' ? myRequests : myRequests.filter((r) => r.status === myFilter)

  const typeGroups = getTypeGroups(portal)

  function handleFormChange(k: string, v: string) {
    setFormData((prev) => ({ ...prev, [k]: v }))
    setFormError(null)
  }

  function validateForm(): boolean {
    if (!selectedGroup) return false
    const cat = selectedGroup.category
    if (cat === 'LEAVE') {
      if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
        setFormError('Please fill in all required fields: Leave Type, Start Date, End Date, Reason.')
        return false
      }
    } else if (cat === 'PURCHASE') {
      if (!formData.itemName || !formData.quantity || !formData.estimatedCost || !formData.purpose) {
        setFormError('Please fill in all required fields: Item Name, Quantity, Estimated Cost, Purpose.')
        return false
      }
    } else if (cat === 'ASSET') {
      if (!formData.assetType || !formData.purpose || !formData.deploymentDate || !formData.justification) {
        setFormError('Please fill in all required fields: Asset Type, Purpose, Deployment Date, Justification.')
        return false
      }
    } else if (cat === 'GENERAL') {
      if (!formData.subject || !formData.description) {
        setFormError('Please fill in all required fields: Subject, Description.')
        return false
      }
    }
    return true
  }

  function handleSubmit() {
    if (!selectedGroup || !selectedType) return
    if (!validateForm()) return

    const cat = selectedGroup.category
    const champion = CATEGORY_TO_CHAMPION[cat]
    const reqNum = nextReqNumber()
    const now = new Date().toISOString()
    const priority: RequestPriority = (formData.priority as RequestPriority) ?? 'NORMAL'

    // Build title
    let title = TYPE_LABELS[selectedType]
    if (cat === 'LEAVE' && formData.startDate) {
      title += ` — ${formatDate(formData.startDate)}`
      if (formData.endDate && formData.endDate !== formData.startDate) {
        title += ` to ${formatDate(formData.endDate)}`
      }
    } else if (cat === 'PURCHASE' && formData.itemName) {
      title = formData.itemName
    } else if (cat === 'ASSET' && formData.assetType) {
      title += ` — ${formData.assetType}`
    } else if (cat === 'GENERAL' && formData.subject) {
      title = formData.subject
    }

    const newReq: UniversalRequest = {
      id: `req_${Date.now()}`,
      reqNumber: reqNum,
      category: cat,
      type: selectedType,
      title,
      status: 'SUBMITTED',
      priority,
      submittedBy: userId,
      submittedByName: userName,
      submittedByRole: userRole,
      portal,
      championDept: champion,
      formData: { ...formData },
      activities: [
        {
          id: `ra_${Date.now()}`,
          action: 'Request Submitted',
          performedBy: userName,
          performedByRole: userRole,
          timestamp: now,
        },
      ],
      schoolId: 'school_1',
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
    }

    MOCK_REQUESTS.push(newReq)

    // Push notification
    MOCK_NOTIFICATIONS.push({
      id: `notif_${Date.now()}`,
      title: 'New Request Received',
      message: `${userName} submitted: ${title} (${reqNum})`,
      type: 'REQUEST',
      isRead: false,
      schoolId: 'school_1',
      createdAt: now,
    })

    // Push audit log
    MOCK_AUDIT_LOGS.push({
      id: `audit_${Date.now()}`,
      action: 'REQUEST_SUBMITTED',
      entity: 'UniversalRequest',
      entityId: newReq.id,
      details: `${userName} submitted ${reqNum}: ${title}`,
      userId,
      schoolId: 'school_1',
      createdAt: now,
    })

    setLastReqNumber(reqNum)
    setNewStep('success')
    forceUpdate()
  }

  function resetNewRequest() {
    setNewStep('type-select')
    setSelectedGroup(null)
    setSelectedType(null)
    setFormData({})
    setFormError(null)
  }

  const tabs: { key: 'my' | 'new' | 'incoming' | 'forms' | 'builder'; label: string; icon: React.ElementType }[] = [
    { key: 'my', label: 'My Requests', icon: Inbox },
    { key: 'new', label: 'New Request', icon: Plus },
    ...(championDept ? [{ key: 'incoming' as const, label: 'Incoming', icon: AlertCircle }] : []),
    { key: 'forms', label: 'Forms', icon: ClipboardList },
    ...(canBuildForms ? [{ key: 'builder' as const, label: 'Form Builder', icon: LayoutTemplate }] : []),
  ]

  return (
    <div>
      <SectionTitle
        description="Submit and track requests across departments"
        actions={
          <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => { setActiveTab('new'); resetNewRequest() }}>
            New Request
          </Button>
        }
      >
        Request Center
      </SectionTitle>

      {/* Stats strip — only on request tabs */}
      <div className={`grid grid-cols-3 gap-4 mb-6 ${activeTab === 'forms' || activeTab === 'builder' ? 'hidden' : ''}`}>
        {[
          { label: 'My Requests', value: myRequests.length, color: 'text-brand-700', bg: 'bg-brand-50' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Completed', value: completedCount, color: 'text-teal-700', bg: 'bg-teal-50' },
        ].map((s) => (
          <Card key={s.label} padding="sm">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-[#e4ebf5] p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); if (t.key === 'new') resetNewRequest() }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.key === 'incoming' && incomingRequests.length > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                {incomingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: My Requests ─────────────────────────────────────────────── */}
      {activeTab === 'my' && (
        <div>
          {/* Status filter */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {(['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map((s) => (
              <button key={s}
                onClick={() => setMyFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  myFilter === s
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-[#e4ebf5] text-slate-500 hover:border-brand-300 hover:text-brand-700'
                }`}>
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {filteredMy.length === 0 ? (
            <Card padding="lg">
              <div className="flex flex-col items-center py-8 text-center">
                <Inbox className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No requests found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {myFilter === 'ALL' ? "You haven't submitted any requests yet." : `No ${myFilter.replace(/_/g, ' ').toLowerCase()} requests.`}
                </p>
                <Button size="sm" variant="soft" className="mt-4"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => { setActiveTab('new'); resetNewRequest() }}>
                  Create Your First Request
                </Button>
              </div>
            </Card>
          ) : (
            <Card padding="none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-700 uppercase tracking-widest">REQ #</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-700 uppercase tracking-widest">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-700 uppercase tracking-widest">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-700 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-700 uppercase tracking-widest">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-700 uppercase tracking-widest">Submitted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredMy.map((req, i) => (
                    <tr key={req.id}
                      className={`border-b border-[#f0f4fa] hover:bg-brand-50/40 transition-colors cursor-pointer ${i === filteredMy.length - 1 ? 'border-0' : ''}`}
                      onClick={() => setViewingReq(req)}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-brand-700 font-semibold">{req.reqNumber}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium text-slate-800 truncate">{req.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={req.type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(req.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingReq(req) }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: New Request ─────────────────────────────────────────────── */}
      {activeTab === 'new' && (
        <div>
          {newStep === 'type-select' && (
            <div>
              <p className="text-sm text-slate-500 mb-5">Select the type of request you want to submit.</p>
              <div className="grid grid-cols-1 gap-6">
                {typeGroups.map((group) => {
                  const Icon = group.icon
                  return (
                    <Card key={group.category} padding="none">
                      {/* Group header */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e4ebf5]">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${group.bgColor}`}>
                          <Icon className={`h-4.5 w-4.5 ${group.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{group.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Routes to: <span className="font-semibold text-slate-600">{CATEGORY_TO_CHAMPION[group.category]} Department</span>
                          </p>
                        </div>
                      </div>
                      {/* Type grid */}
                      <div className="p-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {group.types.map((t) => (
                          <button
                            key={t.type}
                            onClick={() => { setSelectedGroup(group); setSelectedType(t.type); setNewStep('form') }}
                            className="flex items-center gap-2 rounded-xl border border-[#e4ebf5] bg-white px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {newStep === 'form' && selectedGroup && selectedType && (
            <div className="max-w-xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-5 text-xs text-slate-500">
                <button onClick={() => setNewStep('type-select')} className="hover:text-brand-600 font-semibold">
                  Select Type
                </button>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-800">{TYPE_LABELS[selectedType]}</span>
              </div>

              <Card padding="none">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e4ebf5]">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${selectedGroup.bgColor}`}>
                    <selectedGroup.icon className={`h-4.5 w-4.5 ${selectedGroup.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{TYPE_LABELS[selectedType]}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Will be sent to: <span className="font-semibold text-slate-600">{CATEGORY_TO_CHAMPION[selectedGroup.category]} Department</span>
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="p-5">
                  {selectedGroup.category === 'LEAVE' && (
                    <LeaveForm formData={formData} onChange={handleFormChange} />
                  )}
                  {selectedGroup.category === 'PURCHASE' && (
                    <PurchaseForm formData={formData} onChange={handleFormChange} />
                  )}
                  {selectedGroup.category === 'ASSET' && (
                    <AssetForm formData={formData} onChange={handleFormChange} />
                  )}
                  {selectedGroup.category === 'GENERAL' && (
                    <GeneralForm formData={formData} onChange={handleFormChange} />
                  )}

                  {formError && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {formError}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e4ebf5]">
                  <Button variant="outline" size="sm" onClick={() => setNewStep('type-select')}>Back</Button>
                  <Button variant="primary" size="sm" onClick={handleSubmit}>Submit Request</Button>
                </div>
              </Card>
            </div>
          )}

          {newStep === 'success' && (
            <div className="max-w-md">
              <Card padding="lg">
                <div className="flex flex-col items-center text-center py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Request Submitted!</h3>
                  <p className="text-sm text-slate-500 mt-2 mb-4">
                    Your request has been submitted and forwarded to the responsible department.
                  </p>
                  <div className="rounded-xl bg-brand-50 border border-brand-100 px-5 py-3 mb-6 w-full">
                    <p className="text-xs text-brand-600 font-medium">Request Number</p>
                    <p className="text-xl font-bold font-mono text-brand-700 mt-0.5">{lastReqNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setActiveTab('my'); resetNewRequest() }}>
                      View My Requests
                    </Button>
                    <Button size="sm" variant="soft" onClick={resetNewRequest}>
                      Submit Another
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Incoming Requests ────────────────────────────────────────── */}
      {activeTab === 'incoming' && championDept && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
              <Inbox className="h-4.5 w-4.5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{CHAMPION_QUEUE_LABELS[championDept]}</p>
              <p className="text-xs text-slate-500">{incomingRequests.length} active request{incomingRequests.length !== 1 ? 's' : ''} awaiting action</p>
            </div>
          </div>

          {incomingRequests.length === 0 ? (
            <Card padding="lg">
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No pending requests in your queue.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <Card key={req.id} padding="none" hover>
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Left info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-mono text-xs text-brand-700 font-bold">{req.reqNumber}</span>
                        <StatusBadge status={req.status} />
                        <PriorityBadge priority={req.priority} />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate mb-1">{req.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>From: <span className="text-slate-600 font-medium">{req.submittedByName}</span></span>
                        <span>{req.portal.toUpperCase()} portal</span>
                        <span>{formatDate(req.submittedAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setViewingReq(req)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 border border-[#e4ebf5] hover:bg-brand-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View & Act
                      </button>
                    </div>
                  </div>

                  {/* Quick action bar */}
                  <div className="flex items-center gap-2 px-5 py-3 border-t border-[#f0f4fa] bg-[#f8fafd] rounded-b-xl">
                    {req.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => {
                            req.status = 'UNDER_REVIEW'
                            req.activities.push({ id: `ra_${Date.now()}`, action: 'Marked Under Review', performedBy: userName, timestamp: new Date().toISOString() })
                            req.updatedAt = new Date().toISOString()
                            forceUpdate()
                          }}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Mark Under Review
                        </button>
                        <button
                          onClick={() => setViewingReq(req)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'UNDER_REVIEW' && (
                      <>
                        <button
                          onClick={() => {
                            req.status = 'APPROVED'
                            req.activities.push({ id: `ra_${Date.now()}`, action: 'Approved', performedBy: userName, timestamp: new Date().toISOString() })
                            req.updatedAt = new Date().toISOString()
                            forceUpdate()
                          }}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setViewingReq(req)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'APPROVED' && (
                      <button
                        onClick={() => {
                          req.status = 'PROCESSING'
                          req.activities.push({ id: `ra_${Date.now()}`, action: 'Marked Processing', performedBy: userName, timestamp: new Date().toISOString() })
                          req.updatedAt = new Date().toISOString()
                          forceUpdate()
                        }}
                        className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                      >
                        Mark Processing
                      </button>
                    )}
                    {req.status === 'PROCESSING' && (
                      <button
                        onClick={() => {
                          req.status = 'COMPLETED'
                          req.completedAt = new Date().toISOString()
                          req.activities.push({ id: `ra_${Date.now()}`, action: 'Marked Completed', performedBy: userName, timestamp: new Date().toISOString() })
                          req.updatedAt = new Date().toISOString()
                          forceUpdate()
                        }}
                        className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Forms ───────────────────────────────────────────────────── */}
      {activeTab === 'forms' && (
        <FormsCenter portal={portal} userId={userId} userName={userName} userRole={userRole} onRefresh={forceUpdate} />
      )}

      {/* ── Tab: Form Builder ────────────────────────────────────────────── */}
      {activeTab === 'builder' && canBuildForms && (
        <FormBuilderTab onRefresh={forceUpdate} />
      )}

      {/* Detail modal */}
      {viewingReq && (
        <RequestDetailModal
          req={viewingReq}
          onClose={() => setViewingReq(null)}
          isChampion={!!championDept}
          championDept={championDept}
          userName={userName}
          onUpdate={forceUpdate}
        />
      )}
    </div>
  )
}
