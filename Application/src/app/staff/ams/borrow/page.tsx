'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import {
  Send, RefreshCw, X, CheckCircle, Clock, AlertTriangle, Package,
  Laptop, Monitor, Printer, Projector, Router, Tablet, Server, HardDrive,
  CalendarClock, Infinity, Archive,
} from 'lucide-react'
import {
  MOCK_ASSETS, MOCK_ASSET_DEPLOYMENTS, MOCK_ASSET_HISTORY,
} from '@/lib/mock-data'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { SectionTitle, StatCard } from '@/components/ui/Card'
import type {
  AssetCategory, AssetStatus, AssetDeploymentStatus, DeploymentType,
  AssetDeployment, AssetHistory,
} from '@/types'

const CATEGORY_ICON: Record<AssetCategory, React.ElementType> = {
  LAPTOP: Laptop, DESKTOP: HardDrive, MONITOR: Monitor, PRINTER: Printer,
  PROJECTOR: Projector, ROUTER: Router, LAB_EQUIPMENT: Package,
  TABLET: Tablet, SERVER: Server, OTHER_FIXED: Package,
}

const CATEGORY_LABEL: Record<AssetCategory, string> = {
  LAPTOP: 'Laptop', DESKTOP: 'Desktop', MONITOR: 'Monitor', PRINTER: 'Printer',
  PROJECTOR: 'Projector', ROUTER: 'Router', LAB_EQUIPMENT: 'Lab Equipment',
  TABLET: 'Tablet', SERVER: 'Server', OTHER_FIXED: 'Other Fixed Asset',
}

const DEPLOY_TYPE_MAP: Record<DeploymentType, { label: string; cls: string }> = {
  TEMPORARY_BORROW:     { label: 'Temporary Borrow',      cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  LONG_TERM_DEPLOYMENT: { label: 'Long-term Deployment',  cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  PERMANENT_ASSIGNMENT: { label: 'Permanent Assignment',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

const DEPLOY_STATUS_MAP: Record<AssetDeploymentStatus, { label: string; cls: string }> = {
  ACTIVE:   { label: 'Active',   cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  RETURNED: { label: 'Returned', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  OVERDUE:  { label: 'Overdue',  cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

const ASSET_STATUS_MAP: Record<AssetStatus, { label: string; cls: string }> = {
  AVAILABLE:        { label: 'Available',         cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  BORROWED:         { label: 'Borrowed',           cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  DEPLOYED:         { label: 'Deployed',           cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  IN_USE:           { label: 'In Use',             cls: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  UNDER_MAINTENANCE:{ label: 'Under Maintenance',  cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  DAMAGED:          { label: 'Damaged',            cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  LOST:             { label: 'Lost',               cls: 'bg-red-50 text-red-700 ring-red-200' },
  RETIRED:          { label: 'Retired',            cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  OVERDUE:          { label: 'Overdue',            cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

const DEPARTMENTS = [
  'College of Computing',
  'College of Business',
  'College of Nursing',
  'Arts & Sciences',
  'Admissions Office',
  'Office of the Registrar',
  'Finance Office',
  'IT Services',
  'Human Resources',
  "Dean's Office",
  'Academic Affairs',
  'Asset Management',
]

type FilterTab = 'ALL' | AssetDeploymentStatus

interface ReturnForm {
  returnDate: string
  returnTime: string
  returnedBy: string
  receivedBy: string
  condition: string
  inspectionNotes: string
  missingAccessories: string[]
  damageReport: string
}

interface NewDeployForm {
  assetId: string
  borrowerName: string
  borrowerDepartment: string
  custodian: string
  deploymentType: DeploymentType
  startDate: string
  startTime: string
  expectedReturnDate: string
  expectedReturnTime: string
  purpose: string
}

function ReturnModal({
  deployment,
  inclusions,
  onClose,
  onSubmit,
}: {
  deployment: AssetDeployment
  inclusions: { id: string; name: string; quantity: number }[]
  onClose: () => void
  onSubmit: (form: ReturnForm) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toTimeString().slice(0, 5)
  const [form, setForm] = useState<ReturnForm>({
    returnDate: today,
    returnTime: now,
    returnedBy: deployment.borrowerName,
    receivedBy: '',
    condition: 'Good',
    inspectionNotes: '',
    missingAccessories: [],
    damageReport: '',
  })

  function toggleAccessory(name: string) {
    setForm(f => ({
      ...f,
      missingAccessories: f.missingAccessories.includes(name)
        ? f.missingAccessories.filter(a => a !== name)
        : [...f.missingAccessories, name],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(9,24,46,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e4ebf5]">
          <div className="flex items-center gap-2.5">
            <span className="w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">Process Return</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-[#f0f4fa] p-3 text-sm">
            <p className="font-semibold text-slate-800">{deployment.assetName}</p>
            <p className="text-slate-500 text-xs font-mono">{deployment.assetTag}</p>
            <p className="text-slate-600 text-xs mt-1">Borrowed by <span className="font-medium">{deployment.borrowerName}</span> · {deployment.borrowerDepartment}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Actual Return Date</label>
              <input type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Actual Return Time</label>
              <input type="time" value={form.returnTime} onChange={e => setForm(f => ({ ...f, returnTime: e.target.value }))}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Returned By</label>
              <input value={form.returnedBy} onChange={e => setForm(f => ({ ...f, returnedBy: e.target.value }))}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Received By</label>
              <input value={form.receivedBy} onChange={e => setForm(f => ({ ...f, receivedBy: e.target.value }))}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Name" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Asset Condition</label>
            <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Damaged</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Inspection Notes</label>
            <textarea value={form.inspectionNotes} onChange={e => setForm(f => ({ ...f, inspectionNotes: e.target.value }))}
              rows={2} placeholder="Any observations during inspection..."
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none" />
          </div>
          {inclusions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Missing Accessories</label>
              <div className="space-y-1.5">
                {inclusions.map(inc => (
                  <label key={inc.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.missingAccessories.includes(inc.name)}
                      onChange={() => toggleAccessory(inc.name)}
                      className="rounded border-slate-300 text-brand-500" />
                    <span className="text-sm text-slate-700">{inc.name} (x{inc.quantity})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {form.condition === 'Damaged' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Damage Report</label>
              <textarea value={form.damageReport} onChange={e => setForm(f => ({ ...f, damageReport: e.target.value }))}
                rows={3} placeholder="Describe the damage..."
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-[#e4ebf5]">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSubmit(form)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors">
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  )
}

function NewDeployModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (form: NewDeployForm) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toTimeString().slice(0, 5)
  const [form, setForm] = useState<NewDeployForm>({
    assetId: '',
    borrowerName: '',
    borrowerDepartment: '',
    custodian: '',
    deploymentType: 'TEMPORARY_BORROW',
    startDate: today,
    startTime: now,
    expectedReturnDate: '',
    expectedReturnTime: '',
    purpose: '',
  })

  const availableAssets = MOCK_ASSETS.filter(a => a.status === 'AVAILABLE')
  const selectedAsset = MOCK_ASSETS.find(a => a.id === form.assetId)
  const selectedAssetStatus = selectedAsset ? ASSET_STATUS_MAP[selectedAsset.status] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(9,24,46,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e4ebf5]">
          <div className="flex items-center gap-2.5">
            <span className="w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">New Borrow / Deploy Request</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-6">
          {/* Section 1 — Asset Selection */}
          <div>
            <h3 className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3 pb-2 border-b border-[#e4ebf5]">
              1. Asset Selection
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Asset</label>
              <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                <option value="">— Choose an available asset —</option>
                {availableAssets.map(a => (
                  <option key={a.id} value={a.id}>[{a.assetTag}] {a.name}</option>
                ))}
              </select>
            </div>
            {selectedAsset && (
              <div className="mt-3 rounded-xl bg-[#f0f4fa] p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{selectedAsset.name}</span>
                  {selectedAssetStatus && <Badge className={selectedAssetStatus.cls}>{selectedAssetStatus.label}</Badge>}
                </div>
                <p className="text-xs text-slate-500">Department: <span className="font-medium text-slate-700">{selectedAsset.department}</span></p>
                {(selectedAsset.inclusions ?? []).length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Inclusions:</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedAsset.inclusions ?? []).map(inc => (
                        <span key={inc.id} className="text-xs bg-white border border-[#dce8f7] rounded px-1.5 py-0.5 text-slate-600">
                          {inc.name} ×{inc.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2 — Borrower Information */}
          <div>
            <h3 className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3 pb-2 border-b border-[#e4ebf5]">
              2. Borrower Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Borrower Name</label>
                <input value={form.borrowerName} onChange={e => setForm(f => ({ ...f, borrowerName: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select value={form.borrowerDepartment} onChange={e => setForm(f => ({ ...f, borrowerDepartment: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                  <option value="">— Select department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Custodian</label>
                <input value={form.custodian} onChange={e => setForm(f => ({ ...f, custodian: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Responsible custodian name" />
              </div>
            </div>
          </div>

          {/* Section 3 — Deployment Details */}
          <div>
            <h3 className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3 pb-2 border-b border-[#e4ebf5]">
              3. Deployment Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Deployment Type</label>
                <div className="flex flex-col gap-2">
                  {([
                    { value: 'TEMPORARY_BORROW',     icon: Clock,        label: 'Temporary Borrow',     desc: 'Short-term use with a return date', color: 'text-blue-600',   bg: 'bg-blue-50',   ring: 'border-blue-400' },
                    { value: 'LONG_TERM_DEPLOYMENT',  icon: CalendarClock, label: 'Long-term Deployment', desc: 'Extended use over a longer period',  color: 'text-violet-600', bg: 'bg-violet-50', ring: 'border-violet-400' },
                    { value: 'PERMANENT_ASSIGNMENT',  icon: Archive,      label: 'Permanent Assignment',  desc: 'Asset permanently assigned to user',  color: 'text-emerald-600',bg: 'bg-emerald-50',ring: 'border-emerald-500' },
                  ] as { value: DeploymentType; icon: React.ElementType; label: string; desc: string; color: string; bg: string; ring: string }[]).map(opt => {
                    const Icon = opt.icon
                    const selected = form.deploymentType === opt.value
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => setForm(f => ({ ...f, deploymentType: opt.value }))}
                        className={cn(
                          'flex items-center gap-3 w-full rounded-xl border-2 px-4 py-3 text-left transition-all',
                          selected ? `${opt.ring} ${opt.bg}` : 'border-[#e4ebf5] bg-white hover:border-slate-300 hover:bg-slate-50',
                        )}>
                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', selected ? opt.bg : 'bg-slate-100')}>
                          <Icon className={cn('h-4.5 w-4.5', selected ? opt.color : 'text-slate-400')} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-sm font-semibold', selected ? opt.color : 'text-slate-700')}>{opt.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                        </div>
                        <div className={cn('h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all', selected ? `${opt.ring} ${opt.bg}` : 'border-slate-300')}>
                          {selected && <div className={cn('h-2 w-2 rounded-full', opt.color.replace('text-', 'bg-'))} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                </div>
              </div>
              {form.deploymentType !== 'PERMANENT_ASSIGNMENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Return Date</label>
                    <input type="date" value={form.expectedReturnDate} onChange={e => setForm(f => ({ ...f, expectedReturnDate: e.target.value }))}
                      className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Return Time</label>
                    <input type="time" value={form.expectedReturnTime} onChange={e => setForm(f => ({ ...f, expectedReturnTime: e.target.value }))}
                      className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Purpose</label>
                <textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  rows={3} placeholder="State the purpose of borrowing / deployment..."
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Section 4 — Terms */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            By confirming, you agree to return the asset in the same condition it was received, with all inclusions complete.
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-[#e4ebf5]">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSubmit(form)}
            disabled={!form.assetId || !form.borrowerName || !form.borrowerDepartment || !form.purpose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Confirm Request
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BorrowPage() {
  const [assets, setAssets] = useState(MOCK_ASSETS)
  const [deployments, setDeployments] = useState(MOCK_ASSET_DEPLOYMENTS)
  const [history, setHistory] = useState(MOCK_ASSET_HISTORY)
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL')
  const [returnDeployment, setReturnDeployment] = useState<AssetDeployment | null>(null)
  const [showNewDeploy, setShowNewDeploy] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const active = deployments.filter(d => d.status === 'ACTIVE').length
  const returned = deployments.filter(d => d.status === 'RETURNED').length
  const overdue = deployments.filter(d =>
    d.status === 'ACTIVE' && d.expectedReturnDate && d.expectedReturnDate < today
  ).length
  const thisMonth = deployments.filter(d => d.createdAt >= thisMonthStart).length

  const filtered = deployments.filter(d => {
    if (filterTab === 'ALL') return true
    return d.status === filterTab
  })

  function getInclusionsForDeployment(dep: AssetDeployment) {
    const asset = MOCK_ASSETS.find(a => a.id === dep.assetId)
    return asset?.inclusions ?? []
  }

  function handleReturn(form: ReturnForm) {
    if (!returnDeployment) return
    const now = new Date().toISOString()
    const newStatus: AssetStatus = form.condition === 'Damaged' ? 'DAMAGED' : 'AVAILABLE'

    setDeployments(prev => prev.map(d => d.id === returnDeployment.id ? {
      ...d,
      status: 'RETURNED' as AssetDeploymentStatus,
      returnDate: form.returnDate,
      returnTime: form.returnTime,
      returnedBy: form.returnedBy,
      receivedBy: form.receivedBy,
      conditionOnReturn: form.condition,
      inspectionNotes: form.inspectionNotes,
      missingAccessories: form.missingAccessories,
      damageReport: form.damageReport,
    } : d))

    setAssets(prev => prev.map(a => a.id === returnDeployment.assetId ? { ...a, status: newStatus, updatedAt: now } : a))

    const newEntry: AssetHistory = {
      id: `hist_${Date.now()}`,
      assetId: returnDeployment.assetId,
      assetTag: returnDeployment.assetTag,
      assetName: returnDeployment.assetName,
      activityType: 'RETURNED',
      user: form.returnedBy,
      department: returnDeployment.borrowerDepartment,
      custodian: form.receivedBy,
      startDate: form.returnDate,
      status: newStatus,
      remarks: form.inspectionNotes || `Returned by ${form.returnedBy}. Condition: ${form.condition}.`,
      createdAt: now,
    }
    setHistory(prev => [...prev, newEntry])
    setReturnDeployment(null)
  }

  function handleNewDeploy(form: NewDeployForm) {
    if (!form.assetId) return
    const now = new Date().toISOString()
    const asset = MOCK_ASSETS.find(a => a.id === form.assetId)
    if (!asset) return

    const newStatus: AssetStatus = form.deploymentType === 'TEMPORARY_BORROW' ? 'BORROWED' : 'DEPLOYED'
    const activityType = form.deploymentType === 'TEMPORARY_BORROW' ? 'BORROWED' : 'DEPLOYED'

    const newDep: AssetDeployment = {
      id: `dep_${Date.now()}`,
      assetId: form.assetId,
      assetTag: asset.assetTag,
      assetName: asset.name,
      borrowerName: form.borrowerName,
      borrowerDepartment: form.borrowerDepartment,
      custodian: form.custodian || undefined,
      deploymentType: form.deploymentType,
      startDate: form.startDate,
      startTime: form.startTime || undefined,
      expectedReturnDate: form.deploymentType !== 'PERMANENT_ASSIGNMENT' ? form.expectedReturnDate || undefined : undefined,
      expectedReturnTime: form.deploymentType !== 'PERMANENT_ASSIGNMENT' ? form.expectedReturnTime || undefined : undefined,
      purpose: form.purpose,
      status: 'ACTIVE',
      createdAt: now,
    }

    setDeployments(prev => [...prev, newDep])
    setAssets(prev => prev.map(a => a.id === form.assetId ? { ...a, status: newStatus, updatedAt: now } : a))

    const newEntry: AssetHistory = {
      id: `hist_${Date.now()}`,
      assetId: form.assetId,
      assetTag: asset.assetTag,
      assetName: asset.name,
      activityType,
      user: form.borrowerName,
      department: form.borrowerDepartment,
      custodian: form.custodian || undefined,
      startDate: form.startDate,
      status: newStatus,
      remarks: form.purpose,
      createdAt: now,
    }
    setHistory(prev => [...prev, newEntry])
    setShowNewDeploy(false)
  }

  return (
    <div className="space-y-5">
      {returnDeployment && (
        <ReturnModal
          deployment={returnDeployment}
          inclusions={getInclusionsForDeployment(returnDeployment)}
          onClose={() => setReturnDeployment(null)}
          onSubmit={handleReturn}
        />
      )}
      {showNewDeploy && (
        <NewDeployModal
          onClose={() => setShowNewDeploy(false)}
          onSubmit={handleNewDeploy}
        />
      )}

      <SectionTitle
        description="Track and manage all asset borrowing and deployment requests."
        actions={
          <button onClick={() => setShowNewDeploy(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
            <Send className="h-4 w-4" />
            New Borrow / Deploy Request
          </button>
        }
      >
        Borrow &amp; Deploy
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Deployments" value={active} icon={Send} color="bg-blue-50 text-blue-600" />
        <StatCard label="Returned" value={returned} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} color="bg-rose-50 text-rose-600" />
        <StatCard label="This Month" value={thisMonth} icon={Clock} color="bg-brand-50 text-brand-600" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1">
        {(['ALL', 'ACTIVE', 'RETURNED', 'OVERDUE'] as const).map(t => (
          <button key={t} onClick={() => setFilterTab(t === 'OVERDUE' ? 'OVERDUE' : t === 'ACTIVE' ? 'ACTIVE' : t === 'RETURNED' ? 'RETURNED' : 'ALL')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filterTab === t
                ? 'bg-brand-500 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
            )}>
            {t === 'ALL' ? 'All' : t === 'ACTIVE' ? 'Active' : t === 'RETURNED' ? 'Returned' : 'Overdue'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                {['Asset', 'Borrower & Dept', 'Type', 'Period', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-brand-700 uppercase tracking-widest text-2xs font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    No deployment records found
                  </td>
                </tr>
              ) : filtered.map(dep => {
                const depAsset = assets.find(a => a.id === dep.assetId)
                const dt = DEPLOY_TYPE_MAP[dep.deploymentType]
                const ds = DEPLOY_STATUS_MAP[dep.status]
                const isOverdue = dep.status === 'ACTIVE' && dep.expectedReturnDate && dep.expectedReturnDate < today
                const CatIcon = depAsset ? CATEGORY_ICON[depAsset.category] : Package

                return (
                  <tr key={dep.id} className="border-b border-[#f0f4fa] last:border-0 hover:bg-brand-50/40">
                    {/* Asset */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                          <CatIcon className="h-4 w-4 text-brand-500" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold text-brand-600">{dep.assetTag}</p>
                          <p className="text-sm font-medium text-slate-800">{dep.assetName}</p>
                          {depAsset && (
                            <Badge className="bg-slate-100 text-slate-600 ring-slate-200 mt-0.5">
                              {CATEGORY_LABEL[depAsset.category]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Borrower */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{dep.borrowerName}</p>
                      <p className="text-xs text-slate-500">{dep.borrowerDepartment}</p>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <Badge className={dt.cls}>{dt.label}</Badge>
                    </td>

                    {/* Period */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{formatDate(dep.startDate)}</p>
                      <p className="text-xs text-slate-500">
                        {dep.expectedReturnDate
                          ? <span>→ {formatDate(dep.expectedReturnDate)}</span>
                          : <span className="italic">Open-ended</span>
                        }
                      </p>
                      {isOverdue && (
                        <Badge className="bg-rose-50 text-rose-700 ring-rose-200 mt-0.5">Overdue</Badge>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', ds.cls)}>
                        {dep.status === 'ACTIVE' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                        )}
                        {ds.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {dep.status === 'ACTIVE' && (
                          <button onClick={() => setReturnDeployment(dep)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap">
                            Process Return
                          </button>
                        )}
                        {depAsset && (
                          <Link href={`/staff/ams/assets/${depAsset.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-[#e4ebf5] transition-colors whitespace-nowrap">
                            View Details
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
