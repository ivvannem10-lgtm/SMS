'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Wrench, Plus, Search, CheckCircle, Clock, AlertCircle, X,
  Calendar, DollarSign, User, Package, Filter,
} from 'lucide-react'
import { MOCK_MAINTENANCE_LOGS, MOCK_ASSETS, MOCK_ASSET_HISTORY } from '@/lib/mock-data'
import { SectionTitle } from '@/components/ui/Card'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import type { MaintenanceLog, MaintenanceType, MaintenanceStatus } from '@/types'

const TYPE_LABELS: Record<MaintenanceType, string> = {
  REPAIR: 'Repair', PREVENTIVE: 'Preventive', WARRANTY_CLAIM: 'Warranty Claim', INSPECTION: 'Inspection',
}
const TYPE_COLORS: Record<MaintenanceType, string> = {
  REPAIR: 'bg-red-50 text-red-700 ring-red-200',
  PREVENTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  WARRANTY_CLAIM: 'bg-violet-50 text-violet-700 ring-violet-200',
  INSPECTION: 'bg-blue-50 text-blue-700 ring-blue-200',
}
const STATUS_MAP: Record<MaintenanceStatus, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 ring-amber-200',   icon: Clock },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 ring-blue-200',      icon: Wrench },
  COMPLETED:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle },
  CANCELLED:   { label: 'Cancelled',   cls: 'bg-slate-100 text-slate-600 ring-slate-200',  icon: X },
}

const DEPARTMENTS = [
  'College of Computing', 'College of Business', 'College of Nursing',
  'Arts & Sciences', 'Office of the Registrar', 'IT Services',
  'Student Services', 'Human Resources', 'Finance', 'Asset Management',
]

export default function MaintenancePage() {
  const confirm = useConfirm()
  const [logs, setLogs] = useState<MaintenanceLog[]>(MOCK_MAINTENANCE_LOGS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | MaintenanceType>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | MaintenanceStatus>('ALL')
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState<MaintenanceLog | null>(null)
  const [completeForm, setCompleteForm] = useState({ completionDate: '', cost: '', notes: '' })
  const [form, setForm] = useState({
    assetId: '', maintenanceType: 'REPAIR' as MaintenanceType,
    description: '', reportedBy: '', assignedTo: '', startDate: '', notes: '',
  })

  const filtered = logs.filter((l) => {
    const matchSearch = l.assetName.toLowerCase().includes(search.toLowerCase()) ||
      l.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      l.reportedBy.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'ALL' || l.maintenanceType === typeFilter
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const pending    = logs.filter((l) => l.status === 'PENDING').length
  const inProgress = logs.filter((l) => l.status === 'IN_PROGRESS').length
  const completed  = logs.filter((l) => l.status === 'COMPLETED').length
  const totalCost  = logs.filter((l) => l.cost).reduce((s, l) => s + (l.cost ?? 0), 0)

  function handleAdd() {
    if (!form.assetId || !form.description.trim() || !form.reportedBy.trim()) return
    const asset = MOCK_ASSETS.find((a) => a.id === form.assetId)
    if (!asset) return
    const log: MaintenanceLog = {
      id: `mnt_${Date.now()}`,
      assetId: form.assetId,
      assetTag: asset.assetTag,
      assetName: asset.name,
      maintenanceType: form.maintenanceType,
      status: 'IN_PROGRESS',
      description: form.description.trim(),
      reportedBy: form.reportedBy.trim(),
      assignedTo: form.assignedTo || undefined,
      startDate: form.startDate || new Date().toISOString().split('T')[0],
      notes: form.notes || undefined,
      createdAt: new Date().toISOString(),
    }
    MOCK_MAINTENANCE_LOGS.push(log)
    // Update asset status
    const aIdx = MOCK_ASSETS.findIndex((a) => a.id === form.assetId)
    if (aIdx >= 0) MOCK_ASSETS[aIdx].status = 'UNDER_MAINTENANCE'
    // Add history entry
    MOCK_ASSET_HISTORY.push({
      id: `hist_mnt_${Date.now()}`,
      assetId: form.assetId,
      assetTag: asset.assetTag,
      assetName: asset.name,
      activityType: 'MAINTENANCE_STARTED',
      user: form.reportedBy.trim(),
      startDate: log.startDate,
      status: 'UNDER_MAINTENANCE',
      remarks: form.description.trim(),
      createdAt: new Date().toISOString(),
    })
    setLogs([...MOCK_MAINTENANCE_LOGS])
    setAddOpen(false)
    setForm({ assetId: '', maintenanceType: 'REPAIR', description: '', reportedBy: '', assignedTo: '', startDate: '', notes: '' })
  }

  function handleComplete() {
    if (!completeOpen) return
    const idx = MOCK_MAINTENANCE_LOGS.findIndex((l) => l.id === completeOpen.id)
    if (idx < 0) return
    MOCK_MAINTENANCE_LOGS[idx].status = 'COMPLETED'
    MOCK_MAINTENANCE_LOGS[idx].completionDate = completeForm.completionDate || new Date().toISOString().split('T')[0]
    if (completeForm.cost) MOCK_MAINTENANCE_LOGS[idx].cost = Number(completeForm.cost)
    if (completeForm.notes) MOCK_MAINTENANCE_LOGS[idx].notes = completeForm.notes
    // Set asset back to AVAILABLE
    const aIdx = MOCK_ASSETS.findIndex((a) => a.id === completeOpen.assetId)
    if (aIdx >= 0) MOCK_ASSETS[aIdx].status = 'AVAILABLE'
    // Add history
    MOCK_ASSET_HISTORY.push({
      id: `hist_mntc_${Date.now()}`,
      assetId: completeOpen.assetId,
      assetTag: completeOpen.assetTag,
      assetName: completeOpen.assetName,
      activityType: 'MAINTENANCE_COMPLETED',
      user: MOCK_MAINTENANCE_LOGS[idx].assignedTo ?? 'IT Services',
      startDate: completeForm.completionDate || new Date().toISOString().split('T')[0],
      status: 'AVAILABLE',
      remarks: completeForm.notes || 'Maintenance completed.',
      createdAt: new Date().toISOString(),
    })
    setLogs([...MOCK_MAINTENANCE_LOGS])
    setCompleteOpen(null)
    setCompleteForm({ completionDate: '', cost: '', notes: '' })
  }

  async function handleCancel(id: string) {
    const log = MOCK_MAINTENANCE_LOGS.find((l) => l.id === id)
    const ok = await confirm({
      title: 'Cancel Maintenance',
      message: `Cancel the maintenance record for "${log?.assetName ?? 'this asset'}"? The asset will be restored to Available status.`,
      confirmLabel: 'Cancel Maintenance',
      variant: 'danger',
    })
    if (!ok) return
    const idx = MOCK_MAINTENANCE_LOGS.findIndex((l) => l.id === id)
    if (idx >= 0) {
      MOCK_MAINTENANCE_LOGS[idx].status = 'CANCELLED'
      const aIdx = MOCK_ASSETS.findIndex((a) => a.id === MOCK_MAINTENANCE_LOGS[idx].assetId)
      if (aIdx >= 0) MOCK_ASSETS[aIdx].status = 'AVAILABLE'
    }
    setLogs([...MOCK_MAINTENANCE_LOGS])
    setSelectedLog(null)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        description={`${logs.length} maintenance records · ${inProgress} in progress`}
        actions={
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
            <Plus className="h-3.5 w-3.5" /> Log Maintenance
          </button>
        }
      >
        Maintenance Logs
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'In Progress', value: inProgress, icon: Wrench, cls: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: pending, icon: Clock, cls: 'text-amber-600 bg-amber-50' },
          { label: 'Completed', value: completed, icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Cost', value: formatCurrency(totalCost), icon: DollarSign, cls: 'text-brand-600 bg-brand-50', isText: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-[#e4ebf5] px-5 py-4 flex items-center gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.cls)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className={cn('font-bold text-slate-900', s.isText ? 'text-base' : 'text-2xl')}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search asset or reporter..."
            className="w-full rounded-lg border border-[#dce8f7] pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none">
          <option value="ALL">All Types</option>
          {(Object.keys(TYPE_LABELS) as MaintenanceType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none">
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f0f4fa] border-b border-[#dce8f7]">
            <tr>
              {['Asset', 'Type', 'Description', 'Reported By', 'Assigned To', 'Period', 'Cost', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-2xs font-bold uppercase tracking-widest text-brand-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4fa]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <Wrench className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No maintenance records found.</p>
                </td>
              </tr>
            ) : filtered.map((log) => {
              const statusInfo = STATUS_MAP[log.status]
              const StatusIcon = statusInfo.icon
              return (
                <tr key={log.id} className="hover:bg-brand-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/staff/ams/assets/${log.assetId}`} className="group">
                      <p className="text-xs font-mono text-brand-600 group-hover:underline">{log.assetTag}</p>
                      <p className="text-sm font-semibold text-slate-800">{log.assetName}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', TYPE_COLORS[log.maintenanceType])}>
                      {TYPE_LABELS[log.maintenanceType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-48">
                    <p className="text-sm text-slate-700 line-clamp-2">{log.description}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{log.reportedBy}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{log.assignedTo ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-700">{formatDate(log.startDate)}</p>
                    {log.completionDate && (
                      <p className="text-xs text-emerald-600 mt-0.5">→ {formatDate(log.completionDate)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">
                    {log.cost ? formatCurrency(log.cost) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', statusInfo.cls)}>
                      <StatusIcon className="h-3 w-3" /> {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {(log.status === 'PENDING' || log.status === 'IN_PROGRESS') && (
                        <>
                          <button onClick={() => { setCompleteOpen(log); setCompleteForm({ completionDate: '', cost: '', notes: '' }) }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                            Complete
                          </button>
                          <button onClick={() => handleCancel(log.id)}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50">
                            Cancel
                          </button>
                        </>
                      )}
                      <button onClick={() => setSelectedLog(log)}
                        className="rounded-lg border border-[#dce8f7] px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Slide-over */}
      {selectedLog && (
        <div className="fixed inset-0 z-[36] flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative ml-auto w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl">
            <div className="border-l-[3px] border-brand-500 px-5 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="text-sm font-bold text-slate-900">Maintenance Details</p>
                <p className="text-xs text-slate-500 font-mono">{selectedLog.assetTag}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="rounded-xl bg-[#f3f6fb] p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', TYPE_COLORS[selectedLog.maintenanceType])}>
                    {TYPE_LABELS[selectedLog.maintenanceType]}
                  </span>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', STATUS_MAP[selectedLog.status].cls)}>
                    {selectedLog.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-slate-500">Asset</p><p className="text-sm font-medium text-slate-800">{selectedLog.assetName}</p></div>
                  <div><p className="text-xs text-slate-500">Start Date</p><p className="text-sm font-medium text-slate-800">{formatDate(selectedLog.startDate)}</p></div>
                  <div><p className="text-xs text-slate-500">Reported By</p><p className="text-sm font-medium text-slate-800">{selectedLog.reportedBy}</p></div>
                  <div><p className="text-xs text-slate-500">Assigned To</p><p className="text-sm font-medium text-slate-800">{selectedLog.assignedTo ?? '—'}</p></div>
                  {selectedLog.completionDate && (
                    <div><p className="text-xs text-slate-500">Completed</p><p className="text-sm font-medium text-emerald-700">{formatDate(selectedLog.completionDate)}</p></div>
                  )}
                  {selectedLog.cost && (
                    <div><p className="text-xs text-slate-500">Cost</p><p className="text-sm font-medium text-slate-800">{formatCurrency(selectedLog.cost)}</p></div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700 bg-[#f3f6fb] rounded-xl px-4 py-3">{selectedLog.description}</p>
              </div>
              {selectedLog.notes && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700 bg-[#f3f6fb] rounded-xl px-4 py-3">{selectedLog.notes}</p>
                </div>
              )}
              <Link href={`/staff/ams/assets/${selectedLog.assetId}`}
                className="block text-center text-xs text-brand-600 hover:underline font-medium">
                View Asset Profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => setCompleteOpen(null)} />
          <div className="relative w-[440px] rounded-2xl bg-white shadow-2xl">
            <div className="border-l-[3px] border-emerald-500 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">Mark Maintenance Complete</p>
              <p className="text-xs text-slate-500 mt-0.5">{completeOpen.assetName} · {completeOpen.assetTag}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Completion Date</label>
                  <input type="date" value={completeForm.completionDate} onChange={(e) => setCompleteForm((p) => ({ ...p, completionDate: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Repair Cost (PHP)</label>
                  <input type="number" placeholder="0" value={completeForm.cost} onChange={(e) => setCompleteForm((p) => ({ ...p, cost: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Completion Notes</label>
                <textarea value={completeForm.notes} onChange={(e) => setCompleteForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3} placeholder="What was repaired / replaced?"
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
              </div>
              <p className="text-xs text-slate-400">Asset status will be set back to <strong>Available</strong> after completion.</p>
            </div>
            <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
              <button onClick={() => setCompleteOpen(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleComplete}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" /> Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-l-[3px] border-brand-500 px-5 py-4 sticky top-0 bg-white">
              <p className="text-sm font-bold text-slate-900">Log Maintenance Request</p>
              <p className="text-xs text-slate-500 mt-0.5">Record a new maintenance or repair for an asset.</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Asset <span className="text-red-500">*</span></label>
                <select value={form.assetId} onChange={(e) => setForm((p) => ({ ...p, assetId: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                  <option value="">— Select Asset —</option>
                  {MOCK_ASSETS.map((a) => (
                    <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Maintenance Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_LABELS) as MaintenanceType[]).map((t) => (
                    <button key={t} onClick={() => setForm((p) => ({ ...p, maintenanceType: t }))}
                      className={cn('rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                        form.maintenanceType === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#e4ebf5] text-slate-600 hover:bg-slate-50')}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Describe the issue or maintenance to be performed..."
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Reported By <span className="text-red-500">*</span></label>
                  <input value={form.reportedBy} onChange={(e) => setForm((p) => ({ ...p, reportedBy: e.target.value }))}
                    placeholder="Name of reporter"
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Assigned To</label>
                  <input value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                    placeholder="Technician or service center"
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Additional notes..."
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
              </div>
              <p className="text-xs text-slate-400">Asset status will be set to <strong>Under Maintenance</strong> after submission.</p>
            </div>
            <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
              <button onClick={() => setAddOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} disabled={!form.assetId || !form.description.trim() || !form.reportedBy.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40">
                <Wrench className="h-3.5 w-3.5" /> Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
