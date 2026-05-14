'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Laptop, Monitor, Printer, Projector, Router, Tablet, Server,
  Package, HardDrive, Edit2, Send, AlertCircle, X, CheckCircle, ChevronDown,
  MapPin, ShoppingCart, Wrench, Clock, User, Building2, Tag, Plus,
} from 'lucide-react'
import {
  MOCK_ASSETS, MOCK_ASSET_DEPLOYMENTS, MOCK_ASSET_HISTORY, MOCK_MAINTENANCE_LOGS,
} from '@/lib/mock-data'
import { cn, formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { SectionTitle } from '@/components/ui/Card'
import type {
  AssetCategory, AssetStatus, AssetDeploymentStatus, AssetActivityType,
  DeploymentType, MaintenanceType, AssetDeployment, AssetHistory, MaintenanceLog, AssetInclusion,
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

const STATUS_MAP: Record<AssetStatus, { label: string; cls: string }> = {
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

const ACTIVITY_DOT: Record<AssetActivityType, string> = {
  REGISTERED:            'bg-emerald-500',
  BORROWED:              'bg-blue-500',
  RETURNED:              'bg-emerald-500',
  DEPLOYED:              'bg-violet-500',
  MAINTENANCE_STARTED:   'bg-amber-500',
  MAINTENANCE_COMPLETED: 'bg-emerald-500',
  STATUS_CHANGED:        'bg-slate-400',
  CUSTODIAN_CHANGED:     'bg-slate-400',
  DAMAGED:               'bg-orange-500',
  LOST:                  'bg-red-500',
  RETIRED:               'bg-slate-400',
}

const ACTIVITY_LABEL: Record<AssetActivityType, string> = {
  REGISTERED:            'Registered',
  BORROWED:              'Borrowed',
  RETURNED:              'Returned',
  DEPLOYED:              'Deployed',
  MAINTENANCE_STARTED:   'Maintenance Started',
  MAINTENANCE_COMPLETED: 'Maintenance Completed',
  STATUS_CHANGED:        'Status Changed',
  CUSTODIAN_CHANGED:     'Custodian Changed',
  DAMAGED:               'Damaged',
  LOST:                  'Lost',
  RETIRED:               'Retired',
}

const ACTIVITY_BADGE: Record<AssetActivityType, string> = {
  REGISTERED:            'bg-emerald-50 text-emerald-700 ring-emerald-200',
  BORROWED:              'bg-blue-50 text-blue-700 ring-blue-200',
  RETURNED:              'bg-emerald-50 text-emerald-700 ring-emerald-200',
  DEPLOYED:              'bg-violet-50 text-violet-700 ring-violet-200',
  MAINTENANCE_STARTED:   'bg-amber-50 text-amber-700 ring-amber-200',
  MAINTENANCE_COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  STATUS_CHANGED:        'bg-slate-100 text-slate-600 ring-slate-200',
  CUSTODIAN_CHANGED:     'bg-slate-100 text-slate-600 ring-slate-200',
  DAMAGED:               'bg-orange-50 text-orange-700 ring-orange-200',
  LOST:                  'bg-red-50 text-red-700 ring-red-200',
  RETIRED:               'bg-slate-100 text-slate-600 ring-slate-200',
}

const MAINT_STATUS_MAP = {
  PENDING:    { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  IN_PROGRESS:{ label: 'In Progress', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  COMPLETED:  { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CANCELLED:  { label: 'Cancelled',   cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

const MAINT_TYPE_LABEL: Record<MaintenanceType, string> = {
  REPAIR:          'Repair',
  PREVENTIVE:      'Preventive',
  WARRANTY_CLAIM:  'Warranty Claim',
  INSPECTION:      'Inspection',
}

const TABS = ['Info', 'Deployments', 'History', 'Maintenance'] as const
type Tab = typeof TABS[number]

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

function ReturnModal({
  deployment,
  inclusions,
  onClose,
  onSubmit,
}: {
  deployment: AssetDeployment
  inclusions: AssetInclusion[]
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

function AddMaintenanceModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: { maintenanceType: MaintenanceType; description: string; reportedBy: string; assignedTo: string; startDate: string; notes: string }) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    maintenanceType: 'REPAIR' as MaintenanceType,
    description: '',
    reportedBy: '',
    assignedTo: '',
    startDate: today,
    notes: '',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(9,24,46,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#e4ebf5]">
          <div className="flex items-center gap-2.5">
            <span className="w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">Add Maintenance Record</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Maintenance Type</label>
            <select value={form.maintenanceType} onChange={e => setForm(f => ({ ...f, maintenanceType: e.target.value as MaintenanceType }))}
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
              <option value="REPAIR">Repair</option>
              <option value="PREVENTIVE">Preventive</option>
              <option value="WARRANTY_CLAIM">Warranty Claim</option>
              <option value="INSPECTION">Inspection</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Describe the issue or maintenance work..."
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reported By</label>
              <input value={form.reportedBy} onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned To</label>
              <input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Technician / Service center" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Additional notes..."
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-[#e4ebf5]">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSubmit(form)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors">
            Save Record
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const [assets, setAssets] = useState(MOCK_ASSETS)
  const [deployments, setDeployments] = useState(MOCK_ASSET_DEPLOYMENTS)
  const [history, setHistory] = useState(MOCK_ASSET_HISTORY)
  const [maintenance, setMaintenance] = useState(MOCK_MAINTENANCE_LOGS)
  const [tab, setTab] = useState<Tab>('Info')
  const [returnDeployment, setReturnDeployment] = useState<AssetDeployment | null>(null)
  const [showAddMaint, setShowAddMaint] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<AssetActivityType | 'ALL'>('ALL')

  const foundAsset = assets.find(a => a.id === params.id)

  if (!foundAsset) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-600 font-semibold">Asset not found</p>
        <Link href="/staff/ams/assets" className="mt-4 text-brand-600 text-sm hover:underline">Back to Assets</Link>
      </div>
    )
  }

  const asset = foundAsset
  const statusInfo = STATUS_MAP[asset.status]
  const CategoryIcon = CATEGORY_ICON[asset.category]
  const assetDeployments = deployments.filter(d => d.assetId === asset.id)
  const assetHistory = history
    .filter(h => h.assetId === asset.id)
    .filter(h => historyFilter === 'ALL' || h.activityType === historyFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const assetMaintenance = maintenance.filter(m => m.assetId === asset.id)

  const warrantyDaysLeft = asset.warrantyExpiry
    ? Math.floor((new Date(asset.warrantyExpiry).getTime() - Date.now()) / 86400000)
    : null

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

    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: newStatus, updatedAt: now } : a))

    const newEntry: AssetHistory = {
      id: `hist_${Date.now()}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
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

  function handleAddMaintenance(data: { maintenanceType: MaintenanceType; description: string; reportedBy: string; assignedTo: string; startDate: string; notes: string }) {
    const now = new Date().toISOString()
    const newLog: MaintenanceLog = {
      id: `mnt_${Date.now()}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      maintenanceType: data.maintenanceType,
      status: 'PENDING',
      description: data.description,
      reportedBy: data.reportedBy,
      assignedTo: data.assignedTo || undefined,
      startDate: data.startDate,
      notes: data.notes || undefined,
      createdAt: now,
    }
    setMaintenance(prev => [...prev, newLog])

    const newEntry: AssetHistory = {
      id: `hist_${Date.now()}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      activityType: 'MAINTENANCE_STARTED',
      user: data.reportedBy,
      department: asset.department,
      startDate: data.startDate,
      status: 'UNDER_MAINTENANCE',
      remarks: data.description,
      createdAt: now,
    }
    setHistory(prev => [...prev, newEntry])
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, status: 'UNDER_MAINTENANCE', updatedAt: now } : a))
    setShowAddMaint(false)
  }

  return (
    <div className="space-y-5">
      {returnDeployment && (
        <ReturnModal
          deployment={returnDeployment}
          inclusions={asset.inclusions ?? []}
          onClose={() => setReturnDeployment(null)}
          onSubmit={handleReturn}
        />
      )}
      {showAddMaint && (
        <AddMaintenanceModal
          onClose={() => setShowAddMaint(false)}
          onSubmit={handleAddMaintenance}
        />
      )}

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/staff/ams" className="hover:text-brand-600 transition-colors">Asset Management</Link>
        <span>/</span>
        <Link href="/staff/ams/assets" className="hover:text-brand-600 transition-colors">Assets</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{asset.assetTag}</span>
      </div>

      {/* Header Card */}
      <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
        {/* Banner */}
        <div className="relative h-28 bg-gradient-to-r from-[#09182e] via-[#0c1e3d] to-[#11305c]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-[#09182e]/90 via-[#0c1e3d]/80 to-[#11305c]/70" />
        </div>

        {/* Avatar + Info */}
        <div className="px-6 pb-5">
          <div className="flex items-end gap-5 -mt-10 mb-4">
            <div className="h-20 w-20 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg ring-4 ring-white shrink-0">
              <CategoryIcon className="h-10 w-10 text-white" />
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <p className="font-mono text-sm font-bold text-brand-600 tracking-wider">{asset.assetTag}</p>
              <h1 className="text-xl font-bold text-slate-900 truncate">{asset.name}</h1>
            </div>
            <div className="flex items-center gap-2 pb-1 shrink-0">
              <Link href={`/staff/ams/assets/${asset.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#dce8f7] text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Link>
              <Link href="/staff/ams/borrow"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
                <Send className="h-3.5 w-3.5" />
                Deploy / Borrow
              </Link>
            </div>
          </div>

          {/* Pills row */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={statusInfo.cls}>{statusInfo.label}</Badge>
            <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{CATEGORY_LABEL[asset.category]}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
            {asset.brand && (
              <InfoPill label="Brand / Model" value={`${asset.brand}${asset.model ? ' ' + asset.model : ''}`} />
            )}
            {asset.serialNumber && (
              <InfoPill label="Serial No." value={asset.serialNumber} mono />
            )}
            <InfoPill label="Department" value={asset.department} />
            {asset.custodianName && (
              <InfoPill label="Custodian" value={asset.custodianName} />
            )}
            {asset.purchaseCost !== undefined && (
              <InfoPill label="Purchase Cost" value={formatCurrency(asset.purchaseCost)} />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#e4ebf5]">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              tab === t
                ? 'text-brand-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500'
                : 'text-slate-500 hover:text-slate-700',
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-500" /> Basic Information
            </h3>
            <div className="space-y-3">
              <InfoRow label="Asset Name" value={asset.name} />
              <InfoRow label="Category" value={CATEGORY_LABEL[asset.category]} />
              <InfoRow label="Brand" value={asset.brand} />
              <InfoRow label="Model" value={asset.model} />
              <InfoRow label="Serial Number" value={asset.serialNumber} mono />
              <InfoRow label="Description" value={asset.description} />
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" /> Location
            </h3>
            <div className="space-y-3">
              <InfoRow label="Campus" value={asset.campus} />
              <InfoRow label="Building" value={asset.building} />
              <InfoRow label="Room" value={asset.room} />
              <InfoRow label="Storage Area" value={asset.storageArea} />
            </div>
          </div>

          {/* Purchase Details */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-brand-500" /> Purchase Details
            </h3>
            <div className="space-y-3">
              <InfoRow label="Purchase Date" value={formatDate(asset.purchaseDate)} />
              <InfoRow label="Supplier" value={asset.supplier} />
              <InfoRow label="Purchase Cost" value={asset.purchaseCost !== undefined ? formatCurrency(asset.purchaseCost) : undefined} />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Warranty Expiry</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{formatDate(asset.warrantyExpiry)}</p>
                  {warrantyDaysLeft !== null && warrantyDaysLeft <= 90 && warrantyDaysLeft > 0 && (
                    <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Expires in {warrantyDaysLeft}d</Badge>
                  )}
                  {warrantyDaysLeft !== null && warrantyDaysLeft <= 0 && (
                    <Badge className="bg-red-50 text-red-700 ring-red-200">Expired</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inclusions */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-500" /> Inclusions / Accessories
            </h3>
            {(asset.inclusions ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No inclusions listed</p>
            ) : (
              <div className="space-y-2">
                {(asset.inclusions ?? []).map(inc => (
                  <div key={inc.id} className="flex items-center justify-between py-2 border-b border-[#f0f4fa] last:border-0">
                    <span className="text-sm font-medium text-slate-700">{inc.name}</span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">×{inc.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Deployments' && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                  {['Borrower', 'Department', 'Type', 'Start Date', 'Expected Return', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-brand-700 uppercase tracking-widest text-2xs font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assetDeployments.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No deployment records</td></tr>
                ) : assetDeployments.map(dep => {
                  const dt = DEPLOY_TYPE_MAP[dep.deploymentType]
                  const ds = DEPLOY_STATUS_MAP[dep.status]
                  return (
                    <tr key={dep.id} className="border-b border-[#f0f4fa] last:border-0 hover:bg-brand-50/40">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{dep.borrowerName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{dep.borrowerDepartment}</td>
                      <td className="px-4 py-3">
                        <Badge className={dt.cls}>{dt.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(dep.startDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {dep.expectedReturnDate ? formatDate(dep.expectedReturnDate) : <span className="text-slate-400">Open-ended</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', ds.cls)}>
                          {dep.status === 'ACTIVE' && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                          )}
                          {ds.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {dep.status === 'ACTIVE' && (
                          <button onClick={() => setReturnDeployment(dep)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                            Return Asset
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'History' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{assetHistory.length} records</p>
            <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value as AssetActivityType | 'ALL')}
              className="rounded-lg border border-[#dce8f7] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
              <option value="ALL">All Activity</option>
              {Object.entries(ACTIVITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            {assetHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No history records match the filter</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[7px] top-4 bottom-4 w-px bg-[#e4ebf5]" />
                <div className="space-y-6">
                  {assetHistory.map(h => (
                    <div key={h.id} className="flex gap-4">
                      <div className={cn('h-3.5 w-3.5 rounded-full shrink-0 mt-1 ring-2 ring-white', ACTIVITY_DOT[h.activityType])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</p>
                          <Badge className={ACTIVITY_BADGE[h.activityType]}>{ACTIVITY_LABEL[h.activityType]}</Badge>
                        </div>
                        <div className="text-sm text-slate-700 space-y-0.5">
                          {h.user && <p><span className="text-slate-500">User:</span> {h.user}</p>}
                          {h.department && <p><span className="text-slate-500">Dept:</span> {h.department}</p>}
                          {h.duration && <p><span className="text-slate-500">Duration:</span> {h.duration}</p>}
                          {h.location && <p><span className="text-slate-500">Location:</span> {h.location}</p>}
                          {h.remarks && <p className="text-slate-500 italic">{h.remarks}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Maintenance' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddMaint(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
              <Plus className="h-4 w-4" />
              Add Maintenance Record
            </button>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                    {['Type', 'Status', 'Description', 'Reported By', 'Assigned To', 'Start Date', 'Completion', 'Cost'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-brand-700 uppercase tracking-widest text-2xs font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assetMaintenance.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No maintenance records</td></tr>
                  ) : assetMaintenance.map(log => {
                    const ms = MAINT_STATUS_MAP[log.status]
                    return (
                      <tr key={log.id} className="border-b border-[#f0f4fa] last:border-0 hover:bg-brand-50/40">
                        <td className="px-4 py-3">
                          <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{MAINT_TYPE_LABEL[log.maintenanceType]}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={ms.cls}>{ms.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{log.description}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{log.reportedBy}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{log.assignedTo ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(log.startDate)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{log.completionDate ? formatDate(log.completionDate) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {log.cost !== undefined ? formatCurrency(log.cost) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoPill({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">{label}</p>
      <p className={cn('text-sm font-medium text-slate-700 truncate', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs text-slate-500 shrink-0 w-32">{label}</p>
      <p className={cn('text-sm font-medium text-slate-800 text-right', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  )
}
