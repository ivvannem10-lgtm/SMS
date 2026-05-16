'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MOCK_PAYROLL_RUNS, MOCK_HR_EMPLOYEES, MOCK_JOURNAL_ENTRIES, nextJENumber, nextPRRunNumber } from '@/lib/mock-data'
import type { PayrollRun, PayrollStatus, PayrollItem, JournalEntry } from '@/types'
import { Plus, Users, DollarSign, Clock, CheckCircle, Eye } from 'lucide-react'

type TabFilter = 'ALL' | PayrollStatus

const STATUS_CFG: Record<PayrollStatus, { label: string; cls: string }> = {
  DRAFT:        { label: 'Draft',        cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  FOR_APPROVAL: { label: 'For Approval', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED:     { label: 'Approved',     cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  PROCESSED:    { label: 'Processed',    cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  PAID:         { label: 'Paid',         cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>(MOCK_PAYROLL_RUNS)
  const [tab, setTab] = useState<TabFilter>('ALL')
  const [viewRun, setViewRun] = useState<PayrollRun | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newPeriod, setNewPeriod] = useState('')
  const [newItems, setNewItems] = useState<PayrollItem[]>([])

  const filtered = useMemo(() => tab === 'ALL' ? runs : runs.filter(r => r.status === tab), [runs, tab])

  const stats = useMemo(() => ({
    total:       runs.length,
    paid:        runs.filter(r => r.status === 'PAID').length,
    forApproval: runs.filter(r => r.status === 'FOR_APPROVAL').length,
    totalNetPaid: runs.filter(r => r.status === 'PAID').reduce((s, r) => s + r.totalNet, 0),
  }), [runs])

  function initNewRun() {
    const items: PayrollItem[] = MOCK_HR_EMPLOYEES.map((emp, i) => ({
      id: `new_pri_${i}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      position: emp.position,
      basicPay: emp.salary ?? 35000,
      allowances: 3000,
      deductions: 7000,
      netPay: (emp.salary ?? 35000) + 3000 - 7000,
      taxWithheld: 2000,
    }))
    setNewItems(items)
    setNewPeriod('')
    setNewOpen(true)
  }

  function updateItem(idx: number, field: keyof PayrollItem, value: string) {
    setNewItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const numVal = parseFloat(value) || 0
      const updated = { ...item, [field]: numVal }
      updated.netPay = updated.basicPay + updated.allowances - updated.deductions
      return updated
    }))
  }

  function saveNewRun() {
    const totalGross = newItems.reduce((s, i) => s + i.basicPay + i.allowances, 0)
    const totalDeductions = newItems.reduce((s, i) => s + i.deductions, 0)
    const totalNet = newItems.reduce((s, i) => s + i.netPay, 0)
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const [year, month] = newPeriod.split('-')
    const periodName = `${months[parseInt(month) - 1]} ${year}`

    const newRun: PayrollRun = {
      id: `pr_run_${Date.now()}`,
      runNumber: nextPRRunNumber(),
      period: periodName,
      periodStart: `${newPeriod}-01`,
      periodEnd: `${newPeriod}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`,
      items: newItems,
      totalGross, totalDeductions, totalNet,
      status: 'DRAFT',
      processedBy: 'Clara Accounting',
      processedAt: new Date().toISOString(),
      schoolId: 'school_1',
      createdAt: new Date().toISOString(),
    }
    setRuns(prev => [newRun, ...prev])
    setNewOpen(false)
  }

  function processRun(id: string) {
    setRuns(prev => prev.map(r => r.id === id ? { ...r, status: 'FOR_APPROVAL' } : r))
  }

  function approveRun(id: string) {
    setRuns(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED', approvedBy: 'Clara Accounting' } : r))
  }

  function markPaid(run: PayrollRun) {
    const je: JournalEntry = {
      id: `je_pay_${Date.now()}`,
      entryNumber: nextJENumber(),
      date: new Date().toISOString().split('T')[0],
      description: `Payroll disbursement — ${run.period}`,
      sourceModule: 'PAYROLL',
      sourceDept: 'Human Resources',
      lines: [
        { id: `jl_p1_${run.id}`, accountId: 'coa_5001', accountCode: '5001', accountName: 'Salaries & Wages', debit: run.totalGross, credit: 0 },
        { id: `jl_p2_${run.id}`, accountId: 'coa_1002', accountCode: '1002', accountName: 'Cash in Bank', debit: 0, credit: run.totalNet, description: 'Net pay disbursed' },
        { id: `jl_p3_${run.id}`, accountId: 'coa_2002', accountCode: '2002', accountName: 'Accrued Expenses', debit: 0, credit: run.totalDeductions, description: 'Withheld taxes & deductions' },
      ],
      totalDebit: run.totalGross, totalCredit: run.totalGross,
      status: 'POSTED', postedBy: 'Clara Accounting', postedAt: new Date().toISOString(),
      schoolId: 'school_1', createdBy: 'u_accounting', createdAt: new Date().toISOString(),
    }
    MOCK_JOURNAL_ENTRIES.unshift(je)
    setRuns(prev => prev.map(r => r.id === run.id ? { ...r, status: 'PAID', paidAt: new Date().toISOString(), journalEntryId: je.id } : r))
    if (viewRun?.id === run.id) setViewRun(prev => prev ? { ...prev, status: 'PAID', paidAt: new Date().toISOString(), journalEntryId: je.id } : null)
  }

  const tabCounts = useMemo(() => ({
    ALL:          runs.length,
    DRAFT:        runs.filter(r => r.status === 'DRAFT').length,
    FOR_APPROVAL: runs.filter(r => r.status === 'FOR_APPROVAL').length,
    APPROVED:     runs.filter(r => r.status === 'APPROVED').length,
    PROCESSED:    runs.filter(r => r.status === 'PROCESSED').length,
    PAID:         runs.filter(r => r.status === 'PAID').length,
  }), [runs])

  return (
    <div className="space-y-6">
      <SectionTitle
        description="Manage payroll runs and disbursements."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={initNewRun}>New Payroll Run</Button>}
      >
        Payroll Management
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Runs"      value={stats.total}                              icon={Users}        color="bg-brand-50 text-brand-600" />
        <StatCard label="Paid"            value={stats.paid}                               icon={CheckCircle}  color="bg-emerald-50 text-emerald-600" />
        <StatCard label="For Approval"    value={stats.forApproval}                        icon={Clock}        color="bg-amber-50 text-amber-600" />
        <StatCard label="Total Net Paid"  value={formatCurrency(stats.totalNetPaid)}       icon={DollarSign}   color="bg-blue-50 text-blue-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'DRAFT', 'FOR_APPROVAL', 'APPROVED', 'PROCESSED', 'PAID'] as TabFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t === 'ALL' ? 'All' : STATUS_CFG[t as PayrollStatus].label} {tabCounts[t]}
          </button>
        ))}
      </div>

      {/* Payroll Run Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(run => (
          <Card key={run.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600">{run.runNumber}</span>
                <h3 className="font-bold text-slate-800 text-base mt-0.5">{run.period}</h3>
              </div>
              <Badge className={STATUS_CFG[run.status].cls}>{STATUS_CFG[run.status].label}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-[#f0f4fa] px-3 py-2 text-center">
                <p className="text-xs text-slate-500">Gross</p>
                <p className="font-bold text-slate-800 text-sm tabular-nums">{formatCurrency(run.totalGross)}</p>
              </div>
              <div className="rounded-lg bg-[#f0f4fa] px-3 py-2 text-center">
                <p className="text-xs text-slate-500">Deductions</p>
                <p className="font-bold text-red-600 text-sm tabular-nums">{formatCurrency(run.totalDeductions)}</p>
              </div>
              <div className="rounded-lg bg-[#f0f4fa] px-3 py-2 text-center">
                <p className="text-xs text-slate-500">Net Pay</p>
                <p className="font-bold text-emerald-700 text-sm tabular-nums">{formatCurrency(run.totalNet)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <Users className="h-3.5 w-3.5" />
              <span>{run.items.length} employees</span>
              {run.processedBy && <span>· Processed by {run.processedBy}</span>}
              {run.paidAt && <span>· Paid {formatDate(run.paidAt)}</span>}
            </div>

            <div className="flex items-center gap-2 border-t border-[#e4ebf5] pt-3">
              <Button size="xs" variant="soft" icon={<Eye className="h-3 w-3" />} onClick={() => setViewRun(run)}>
                View Details
              </Button>
              {run.status === 'DRAFT' && (
                <Button size="xs" variant="secondary" onClick={() => processRun(run.id)}>Process</Button>
              )}
              {run.status === 'FOR_APPROVAL' && (
                <Button size="xs" variant="success" onClick={() => approveRun(run.id)}>Approve</Button>
              )}
              {run.status === 'APPROVED' && (
                <Button size="xs" variant="primary" onClick={() => markPaid(run)}>Mark as Paid</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm">No payroll runs in this category.</div>
      )}

      {/* View Details Modal */}
      {viewRun && (
        <Modal
          open={!!viewRun}
          onClose={() => setViewRun(null)}
          title={`Payroll Run — ${viewRun.period}`}
          size="xl"
          footer={
            <div className="flex items-center gap-2">
              {viewRun.status === 'PAID' && !viewRun.journalEntryId && (
                <Button variant="soft" size="sm" onClick={() => markPaid(viewRun)}>Generate Journal Entry</Button>
              )}
              {viewRun.journalEntryId && (
                <span className="text-xs text-emerald-600 font-semibold">✓ Journal Entry generated</span>
              )}
              <Button variant="outline" onClick={() => setViewRun(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-[#f3f6fb] p-3">
                <p className="text-xs text-slate-500">Status</p>
                <Badge className={`mt-1 ${STATUS_CFG[viewRun.status].cls}`}>{STATUS_CFG[viewRun.status].label}</Badge>
              </div>
              <div className="rounded-lg bg-[#f3f6fb] p-3">
                <p className="text-xs text-slate-500">Period</p>
                <p className="font-semibold text-sm text-slate-800">{viewRun.periodStart} – {viewRun.periodEnd}</p>
              </div>
              <div className="rounded-lg bg-[#f3f6fb] p-3">
                <p className="text-xs text-slate-500">Processed By</p>
                <p className="font-semibold text-sm text-slate-800">{viewRun.processedBy ?? '—'}</p>
              </div>
            </div>

            <div className="border border-[#e4ebf5] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f0f4fa]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider">Employee</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider">Department</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Basic Pay</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Allowances</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Deductions</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Tax</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {viewRun.items.map((item, i) => (
                    <tr key={item.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-t border-[#e4ebf5]`}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800">{item.employeeName}</p>
                        <p className="text-xs text-slate-400">{item.position}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{item.department}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(item.basicPay)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(item.allowances)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-600">{formatCurrency(item.deductions)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-700">{formatCurrency(item.taxWithheld)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">{formatCurrency(item.netPay)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#e4ebf5] bg-[#f0f4fa] font-bold">
                    <td colSpan={2} className="px-3 py-2 text-xs uppercase tracking-wider text-slate-700">Totals</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(viewRun.totalGross)}</td>
                    <td />
                    <td className="px-3 py-2 text-right tabular-nums text-red-600">{formatCurrency(viewRun.totalDeductions)}</td>
                    <td />
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(viewRun.totalNet)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* New Payroll Run Modal */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Payroll Run"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={saveNewRun} disabled={!newPeriod}>Create Payroll Run</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Pay Period (Month)"
            type="month"
            value={newPeriod}
            onChange={e => setNewPeriod(e.target.value)}
          />

          {newItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payroll Items</p>
              <div className="border border-[#e4ebf5] rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#f0f4fa]">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wider">Employee</th>
                      <th className="px-3 py-2 text-right font-bold text-brand-700 uppercase tracking-wider">Basic Pay</th>
                      <th className="px-3 py-2 text-right font-bold text-brand-700 uppercase tracking-wider">Allowances</th>
                      <th className="px-3 py-2 text-right font-bold text-brand-700 uppercase tracking-wider">Deductions</th>
                      <th className="px-3 py-2 text-right font-bold text-brand-700 uppercase tracking-wider">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newItems.map((item, idx) => (
                      <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-t border-[#e4ebf5]`}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-800">{item.employeeName}</p>
                          <p className="text-slate-400">{item.department}</p>
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.basicPay} onChange={e => updateItem(idx, 'basicPay', e.target.value)}
                            className="w-24 rounded border border-[#dce8f7] bg-white px-2 py-1 text-xs text-right tabular-nums focus:border-brand-500 focus:outline-none" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.allowances} onChange={e => updateItem(idx, 'allowances', e.target.value)}
                            className="w-24 rounded border border-[#dce8f7] bg-white px-2 py-1 text-xs text-right tabular-nums focus:border-brand-500 focus:outline-none" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.deductions} onChange={e => updateItem(idx, 'deductions', e.target.value)}
                            className="w-24 rounded border border-[#dce8f7] bg-white px-2 py-1 text-xs text-right tabular-nums focus:border-brand-500 focus:outline-none" />
                        </td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums text-emerald-700">{formatCurrency(item.netPay)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[#e4ebf5] bg-[#f0f4fa] font-bold">
                      <td className="px-3 py-2 text-xs uppercase tracking-wider text-slate-700">Totals</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs">{formatCurrency(newItems.reduce((s, i) => s + i.basicPay, 0))}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-emerald-700">{formatCurrency(newItems.reduce((s, i) => s + i.allowances, 0))}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-red-600">{formatCurrency(newItems.reduce((s, i) => s + i.deductions, 0))}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-emerald-700 font-bold">{formatCurrency(newItems.reduce((s, i) => s + i.netPay, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
