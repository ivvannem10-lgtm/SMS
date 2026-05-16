'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MOCK_JOURNAL_ENTRIES, MOCK_CHART_OF_ACCOUNTS } from '@/lib/mock-data'
import type { JournalEntry, JournalEntryStatus } from '@/types'
import { BookOpen, FileCheck, FileText, DollarSign, X } from 'lucide-react'

type ModuleFilter = 'ALL' | 'TREASURY' | 'PURCHASING' | 'AMS' | 'HRIS' | 'MANUAL' | 'PAYROLL'

const STATUS_CFG: Record<JournalEntryStatus, { label: string; cls: string }> = {
  POSTED: { label: 'Posted', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  DRAFT:  { label: 'Draft',  cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  VOID:   { label: 'Void',   cls: 'bg-red-50 text-red-600 ring-red-200' },
}

const MODULE_CFG: Record<string, { label: string; cls: string }> = {
  TREASURY:   { label: 'Treasury',   cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  PURCHASING: { label: 'Purchasing', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  AMS:        { label: 'AMS',        cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  HRIS:       { label: 'HRIS',       cls: 'bg-pink-50 text-pink-700 ring-pink-200' },
  PAYROLL:    { label: 'Payroll',    cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  MANUAL:     { label: 'Manual',     cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

export default function LedgerPage() {
  const [accountFilter, setAccountFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('ALL')
  const [search, setSearch] = useState('')
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)

  const entries = useMemo(() => {
    return MOCK_JOURNAL_ENTRIES.filter(je => {
      if (moduleFilter !== 'ALL' && je.sourceModule !== moduleFilter) return false
      if (dateFrom && je.date < dateFrom) return false
      if (dateTo && je.date > dateTo) return false
      if (accountFilter) {
        const hasAccount = je.lines.some(l => l.accountCode === accountFilter)
        if (!hasAccount) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!je.entryNumber.toLowerCase().includes(q) && !je.description.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [accountFilter, dateFrom, dateTo, moduleFilter, search])

  const stats = useMemo(() => ({
    total:      MOCK_JOURNAL_ENTRIES.length,
    posted:     MOCK_JOURNAL_ENTRIES.filter(j => j.status === 'POSTED').length,
    draft:      MOCK_JOURNAL_ENTRIES.filter(j => j.status === 'DRAFT').length,
    totalDebits: entries.reduce((s, j) => s + j.totalDebit, 0),
    totalCredits: entries.reduce((s, j) => s + j.totalCredit, 0),
  }), [entries])

  return (
    <div className="space-y-6">
      <SectionTitle description="View all journal entries across all modules.">General Ledger</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Entries"  value={stats.total}   icon={BookOpen}    color="bg-brand-50 text-brand-600" />
        <StatCard label="Posted"         value={stats.posted}  icon={FileCheck}   color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Draft"          value={stats.draft}   icon={FileText}    color="bg-slate-100 text-slate-500" />
        <StatCard label="Total Debits"   value={formatCurrency(stats.totalDebits)}  icon={DollarSign} color="bg-blue-50 text-blue-600" />
        <StatCard label="Total Credits"  value={formatCurrency(stats.totalCredits)} icon={DollarSign} color="bg-violet-50 text-violet-600" />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            label="Account"
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
          >
            <option value="">All Accounts</option>
            {MOCK_CHART_OF_ACCOUNTS.filter(a => a.parentCode).map(a => (
              <option key={a.id} value={a.code}>{a.code} — {a.name}</option>
            ))}
          </Select>
          <Input label="Date From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <Input label="Date To"   type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)} />
          <Select label="Source Module" value={moduleFilter} onChange={e => setModuleFilter(e.target.value as ModuleFilter)}>
            <option value="ALL">All Modules</option>
            <option value="TREASURY">Treasury</option>
            <option value="PURCHASING">Purchasing</option>
            <option value="AMS">AMS</option>
            <option value="HRIS">HRIS</option>
            <option value="MANUAL">Manual</option>
            <option value="PAYROLL">Payroll</option>
          </Select>
          <Input label="Search" placeholder="Entry # or description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
          <CardTitle>Journal Entries ({entries.length})</CardTitle>
        </div>
        <Table>
          <Thead>
            <Th>Entry #</Th>
            <Th>Date</Th>
            <Th>Description</Th>
            <Th>Module</Th>
            <Th>Reference</Th>
            <Th>Debit</Th>
            <Th>Credit</Th>
            <Th>Status</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {entries.map(je => (
              <Tr key={je.id}>
                <Td>
                  <span className="font-mono text-xs font-bold text-brand-600">{je.entryNumber}</span>
                </Td>
                <Td className="text-slate-500 text-xs">{formatDate(je.date)}</Td>
                <Td>
                  <p className="font-medium text-slate-800 max-w-[200px] truncate text-sm">{je.description}</p>
                </Td>
                <Td>
                  <Badge className={MODULE_CFG[je.sourceModule]?.cls ?? 'bg-slate-100 text-slate-600'}>
                    {MODULE_CFG[je.sourceModule]?.label ?? je.sourceModule}
                  </Badge>
                </Td>
                <Td className="text-slate-500 text-xs font-mono">{je.reference ?? '—'}</Td>
                <Td>
                  <span className="text-emerald-700 font-semibold text-sm tabular-nums">{formatCurrency(je.totalDebit)}</span>
                </Td>
                <Td>
                  <span className="text-red-600 font-semibold text-sm tabular-nums">{formatCurrency(je.totalCredit)}</span>
                </Td>
                <Td>
                  <Badge className={STATUS_CFG[je.status].cls}>{STATUS_CFG[je.status].label}</Badge>
                </Td>
                <Td>
                  <Button size="xs" variant="soft" onClick={() => setViewEntry(je)}>View</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {entries.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No journal entries match your filters.</div>
        )}
      </Card>

      {/* View Entry Slide-Over */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setViewEntry(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#e4ebf5] sticky top-0 bg-white z-10">
              <div className="flex items-start gap-3">
                <span className="mt-1 block w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
                <div>
                  <p className="font-mono text-sm font-bold text-brand-600">{viewEntry.entryNumber}</p>
                  <h2 className="text-base font-bold text-slate-900">{viewEntry.description}</h2>
                </div>
              </div>
              <button onClick={() => setViewEntry(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Entry info */}
            <div className="px-6 py-4 border-b border-[#e4ebf5] bg-[#f3f6fb]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Date</p>
                  <p className="font-semibold text-slate-800">{formatDate(viewEntry.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Source Module</p>
                  <Badge className={MODULE_CFG[viewEntry.sourceModule]?.cls ?? 'bg-slate-100 text-slate-600'}>
                    {MODULE_CFG[viewEntry.sourceModule]?.label ?? viewEntry.sourceModule}
                  </Badge>
                </div>
                {viewEntry.reference && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Reference</p>
                    <p className="font-mono font-semibold text-slate-800">{viewEntry.reference}</p>
                  </div>
                )}
                {viewEntry.sourceDept && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Department</p>
                    <p className="font-semibold text-slate-800">{viewEntry.sourceDept}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 font-medium">Status</p>
                  <Badge className={STATUS_CFG[viewEntry.status].cls}>{STATUS_CFG[viewEntry.status].label}</Badge>
                </div>
                {viewEntry.postedBy && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Posted By</p>
                    <p className="font-semibold text-slate-800">{viewEntry.postedBy}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Journal Lines */}
            <div className="px-6 py-4">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Journal Lines</p>
              <div className="border border-[#e4ebf5] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#f0f4fa]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider">Account</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Debit</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewEntry.lines.map((line, i) => (
                      <tr key={line.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-3 py-2 font-mono text-xs text-brand-600 font-bold">{line.accountCode}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-800">{line.accountName}</p>
                          {line.description && <p className="text-xs text-slate-400">{line.description}</p>}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {line.debit > 0 ? <span className="text-emerald-700 font-semibold">{formatCurrency(line.debit)}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {line.credit > 0 ? <span className="text-red-600 font-semibold">{formatCurrency(line.credit)}</span> : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="border-t-2 border-[#e4ebf5] bg-[#f0f4fa] font-bold">
                      <td colSpan={2} className="px-3 py-2 text-xs uppercase tracking-wider text-slate-700">Totals</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{formatCurrency(viewEntry.totalDebit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-600">{formatCurrency(viewEntry.totalCredit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
