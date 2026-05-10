'use client'
import { useState } from 'react'
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Filter, Search, Plus, X } from 'lucide-react'
import { MOCK_HR_LEAVES, MOCK_HR_EMPLOYEES } from '@/lib/mock-data'
import { SectionTitle } from '@/components/ui/Card'
import { cn, formatDate, initials } from '@/lib/utils'
import type { HRLeaveRequest, HRLeaveType, HRLeaveStatus } from '@/types'

const LEAVE_TYPE_MAP: Record<HRLeaveType, { label: string; cls: string }> = {
  SICK:       { label: 'Sick Leave',       cls: 'bg-red-50 text-red-700 ring-red-200' },
  VACATION:   { label: 'Vacation Leave',   cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  EMERGENCY:  { label: 'Emergency Leave',  cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  MATERNITY:  { label: 'Maternity Leave',  cls: 'bg-pink-50 text-pink-700 ring-pink-200' },
  PATERNITY:  { label: 'Paternity Leave',  cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
}

const STATUS_MAP: Record<HRLeaveStatus, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 ring-amber-200',   icon: Clock },
  APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 ring-red-200',         icon: XCircle },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600 ring-slate-200',  icon: X },
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<HRLeaveRequest[]>(MOCK_HR_LEAVES)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | HRLeaveStatus>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | HRLeaveType>('ALL')
  const [selectedLeave, setSelectedLeave] = useState<HRLeaveRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyForm, setApplyForm] = useState({
    employeeId: '', leaveType: 'SICK' as HRLeaveType,
    startDate: '', endDate: '', reason: '',
  })

  const filtered = leaves.filter((l) => {
    const matchSearch = l.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      l.employeeNo.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter
    const matchType = typeFilter === 'ALL' || l.leaveType === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const pending = leaves.filter((l) => l.status === 'PENDING')
  const approved = leaves.filter((l) => l.status === 'APPROVED')
  const rejected = leaves.filter((l) => l.status === 'REJECTED')

  function approveLeave(id: string) {
    const idx = MOCK_HR_LEAVES.findIndex((l) => l.id === id)
    if (idx >= 0) {
      MOCK_HR_LEAVES[idx].status = 'APPROVED'
      MOCK_HR_LEAVES[idx].reviewedBy = 'Hannah Rodriguez'
      MOCK_HR_LEAVES[idx].reviewedAt = new Date().toISOString()
    }
    setLeaves([...MOCK_HR_LEAVES])
    setSelectedLeave(null)
  }

  function rejectLeave(id: string) {
    if (!rejectReason.trim()) return
    const idx = MOCK_HR_LEAVES.findIndex((l) => l.id === id)
    if (idx >= 0) {
      MOCK_HR_LEAVES[idx].status = 'REJECTED'
      MOCK_HR_LEAVES[idx].rejectionReason = rejectReason.trim()
      MOCK_HR_LEAVES[idx].reviewedBy = 'Hannah Rodriguez'
      MOCK_HR_LEAVES[idx].reviewedAt = new Date().toISOString()
    }
    setLeaves([...MOCK_HR_LEAVES])
    setSelectedLeave(null)
    setRejectReason('')
  }

  function submitLeave() {
    if (!applyForm.employeeId || !applyForm.startDate || !applyForm.endDate || !applyForm.reason.trim()) return
    const emp = MOCK_HR_EMPLOYEES.find((e) => e.id === applyForm.employeeId)
    if (!emp) return
    const start = new Date(applyForm.startDate)
    const end = new Date(applyForm.endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
    const req: HRLeaveRequest = {
      id: `leave_${Date.now()}`,
      employeeId: emp.id, employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeNo: emp.employeeNo, department: emp.department,
      leaveType: applyForm.leaveType, startDate: applyForm.startDate, endDate: applyForm.endDate,
      totalDays: days, reason: applyForm.reason.trim(), status: 'PENDING',
      appliedAt: new Date().toISOString(),
    }
    MOCK_HR_LEAVES.push(req)
    setLeaves([...MOCK_HR_LEAVES])
    setApplyOpen(false)
    setApplyForm({ employeeId: '', leaveType: 'SICK', startDate: '', endDate: '', reason: '' })
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        description={`${pending.length} pending · ${approved.length} approved · ${rejected.length} rejected`}
        actions={
          <button onClick={() => setApplyOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
            <Plus className="h-3.5 w-3.5" /> File Leave Request
          </button>
        }
      >
        Leave Requests
      </SectionTitle>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: leaves.length, icon: Calendar, color: 'text-brand-600 bg-brand-50' },
          { label: 'Pending Review', value: pending.length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', value: approved.length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Rejected', value: rejected.length, icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-[#e4ebf5] px-5 py-4 flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..."
            className="w-full rounded-lg border border-[#dce8f7] pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
          <option value="ALL">All Types</option>
          <option value="SICK">Sick Leave</option>
          <option value="VACATION">Vacation Leave</option>
          <option value="EMERGENCY">Emergency Leave</option>
          <option value="MATERNITY">Maternity Leave</option>
          <option value="PATERNITY">Paternity Leave</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f0f4fa] border-b border-[#dce8f7]">
            <tr>
              {['Employee', 'Leave Type', 'Period', 'Days', 'Status', 'Applied', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-2xs font-bold uppercase tracking-widest text-brand-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4fa]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No leave requests found.</p>
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const typeInfo = LEAVE_TYPE_MAP[l.leaveType]
                const statusInfo = STATUS_MAP[l.status]
                const StatusIcon = statusInfo.icon
                return (
                  <tr key={l.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold shrink-0">
                          {initials(l.employeeName)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{l.employeeName}</p>
                          <p className="text-xs text-slate-400">{l.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', typeInfo.cls)}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatDate(l.startDate)}<br />
                      <span className="text-slate-400 text-xs">to {formatDate(l.endDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{l.totalDays}d</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', statusInfo.cls)}>
                        <StatusIcon className="h-3 w-3" /> {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(l.appliedAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedLeave(l); setRejectReason('') }}
                        className="text-xs text-brand-600 hover:underline font-medium">
                        {l.status === 'PENDING' ? 'Review' : 'Details'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Leave Detail / Review Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => setSelectedLeave(null)} />
          <div className="relative w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-l-[3px] border-brand-500 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Leave Request Details</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedLeave.employeeName} · {selectedLeave.employeeNo}</p>
              </div>
              <button onClick={() => setSelectedLeave(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="rounded-xl bg-[#f3f6fb] p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="text-sm font-medium text-slate-800">{selectedLeave.department}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Leave Type</p>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset mt-0.5', LEAVE_TYPE_MAP[selectedLeave.leaveType].cls)}>
                    {LEAVE_TYPE_MAP[selectedLeave.leaveType].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Start Date</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(selectedLeave.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Days</p>
                  <p className="text-sm font-bold text-slate-900">{selectedLeave.totalDays} day{selectedLeave.totalDays !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Filed On</p>
                  <p className="text-sm font-medium text-slate-800">{formatDate(selectedLeave.appliedAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Reason</p>
                <p className="text-sm text-slate-700 bg-[#f3f6fb] rounded-xl px-4 py-3">{selectedLeave.reason}</p>
              </div>
              {selectedLeave.reviewedBy && (
                <div className="rounded-xl border border-[#e4ebf5] px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Review by {selectedLeave.reviewedBy} on {formatDate(selectedLeave.reviewedAt)}</p>
                  {selectedLeave.rejectionReason && (
                    <p className="text-sm text-red-700 mt-1"><strong>Reason:</strong> {selectedLeave.rejectionReason}</p>
                  )}
                </div>
              )}
              {selectedLeave.status === 'PENDING' && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Rejection Reason (required to reject)</label>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                    rows={2} placeholder="Enter reason for rejection..."
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none" />
                </div>
              )}
            </div>
            {selectedLeave.status === 'PENDING' && (
              <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
                <button onClick={() => rejectLeave(selectedLeave.id)} disabled={!rejectReason.trim()}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
                <button onClick={() => approveLeave(selectedLeave.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" /> Approve Leave
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => setApplyOpen(false)} />
          <div className="relative w-[480px] rounded-2xl bg-white shadow-2xl">
            <div className="border-l-[3px] border-brand-500 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">File Leave Request</p>
              <p className="text-xs text-slate-500 mt-0.5">Submit a new leave request on behalf of an employee.</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Employee</label>
                <select value={applyForm.employeeId} onChange={(e) => setApplyForm((p) => ({ ...p, employeeId: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                  <option value="">— Select employee —</option>
                  {MOCK_HR_EMPLOYEES.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.department})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Leave Type</label>
                <select value={applyForm.leaveType} onChange={(e) => setApplyForm((p) => ({ ...p, leaveType: e.target.value as HRLeaveType }))}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                  <option value="SICK">Sick Leave</option>
                  <option value="VACATION">Vacation Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                  <input type="date" value={applyForm.startDate} onChange={(e) => setApplyForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">End Date</label>
                  <input type="date" value={applyForm.endDate} onChange={(e) => setApplyForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Reason</label>
                <textarea value={applyForm.reason} onChange={(e) => setApplyForm((p) => ({ ...p, reason: e.target.value }))}
                  rows={3} placeholder="Enter reason for leave..."
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
              <button onClick={() => setApplyOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={submitLeave} disabled={!applyForm.employeeId || !applyForm.startDate || !applyForm.endDate || !applyForm.reason.trim()}
                className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
