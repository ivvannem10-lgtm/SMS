'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MOCK_JOURNAL_ENTRIES, MOCK_CHART_OF_ACCOUNTS, nextJENumber } from '@/lib/mock-data'
import type { JournalEntry, JournalLine, JournalEntryStatus } from '@/types'
import { Plus, Trash2, BookOpen, FileCheck, AlertTriangle, Ban } from 'lucide-react'

type TabFilter = 'ALL' | JournalEntryStatus

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

interface NewLine {
  accountCode: string
  accountName: string
  accountId: string
  debit: string
  credit: string
  description: string
}

const emptyLine = (): NewLine => ({ accountCode: '', accountName: '', accountId: '', debit: '', credit: '', description: '' })

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_JOURNAL_ENTRIES)
  const [tab, setTab] = useState<TabFilter>('ALL')
  const [newOpen, setNewOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<JournalEntry | null>(null)
  const [voidReason, setVoidReason] = useState('')

  // New entry form
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newDesc, setNewDesc] = useState('')
  const [newRef, setNewRef] = useState('')
  const [newModule, setNewModule] = useState<JournalEntry['sourceModule']>('MANUAL')
  const [lines, setLines] = useState<NewLine[]>([emptyLine(), emptyLine()])

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const filtered = useMemo(() => {
    if (tab === 'ALL') return entries
    return entries.filter(e => e.status === tab)
  }, [entries, tab])

  function handleAccountSelect(idx: number, code: string) {
    const acct = MOCK_CHART_OF_ACCOUNTS.find(a => a.code === code)
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, accountCode: code, accountName: acct?.name ?? '', accountId: acct?.id ?? '' } : l))
  }

  function addLine() { setLines(prev => [...prev, emptyLine()]) }
  function removeLine(idx: number) { setLines(prev => prev.filter((_, i) => i !== idx)) }

  function saveEntry(post: boolean) {
    const jeLines: JournalLine[] = lines.filter(l => l.accountCode).map((l, i) => ({
      id: `jl_new_${i}`,
      accountId: l.accountId, accountCode: l.accountCode, accountName: l.accountName,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0,
      description: l.description || undefined,
    }))
    const newEntry: JournalEntry = {
      id: `je_${Date.now()}`,
      entryNumber: nextJENumber(),
      date: newDate, description: newDesc,
      reference: newRef || undefined,
      sourceModule: newModule, sourceDept: '',
      lines: jeLines,
      totalDebit, totalCredit,
      status: post ? 'POSTED' : 'DRAFT',
      postedBy: post ? 'Clara Accounting' : undefined,
      postedAt: post ? new Date().toISOString() : undefined,
      schoolId: 'school_1', createdBy: 'u_accounting',
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => [newEntry, ...prev])
    setNewOpen(false)
    setNewDesc('')
    setNewRef('')
    setLines([emptyLine(), emptyLine()])
  }

  function postEntry(je: JournalEntry) {
    setEntries(prev => prev.map(e => e.id === je.id ? { ...e, status: 'POSTED', postedBy: 'Clara Accounting', postedAt: new Date().toISOString() } : e))
  }

  function voidEntry() {
    if (!voidTarget) return
    setEntries(prev => prev.map(e => e.id === voidTarget.id ? { ...e, status: 'VOID', voidReason } : e))
    setVoidTarget(null)
    setVoidReason('')
  }

  const tabCounts = useMemo(() => ({
    ALL: entries.length,
    DRAFT: entries.filter(e => e.status === 'DRAFT').length,
    POSTED: entries.filter(e => e.status === 'POSTED').length,
    VOID: entries.filter(e => e.status === 'VOID').length,
  }), [entries])

  return (
    <div className="space-y-6">
      <SectionTitle
        description="Create and manage journal entries."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewOpen(true)}>New Journal Entry</Button>}
      >
        Journal Entries
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Entries" value={entries.length}                                      icon={BookOpen}       color="bg-brand-50 text-brand-600" />
        <StatCard label="Posted"        value={tabCounts.POSTED}                                    icon={FileCheck}      color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Draft"         value={tabCounts.DRAFT}                                     icon={AlertTriangle}  color="bg-amber-50 text-amber-600" />
        <StatCard label="Void"          value={tabCounts.VOID}                                      icon={Ban}            color="bg-red-50 text-red-500" />
      </div>

      {/* Tab filter */}
      <div className="flex gap-2">
        {(['ALL', 'DRAFT', 'POSTED', 'VOID'] as TabFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t === 'ALL' ? 'All' : STATUS_CFG[t as JournalEntryStatus].label} {t === 'ALL' ? tabCounts.ALL : tabCounts[t as JournalEntryStatus]}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <Th>Entry #</Th>
            <Th>Date</Th>
            <Th>Description</Th>
            <Th>Module</Th>
            <Th>Debit</Th>
            <Th>Credit</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {filtered.map(je => (
              <Tr key={je.id}>
                <Td><span className="font-mono text-xs font-bold text-brand-600">{je.entryNumber}</span></Td>
                <Td className="text-slate-500 text-xs">{formatDate(je.date)}</Td>
                <Td><p className="font-medium text-slate-800 max-w-[200px] truncate text-sm">{je.description}</p></Td>
                <Td>
                  <Badge className={MODULE_CFG[je.sourceModule]?.cls ?? 'bg-slate-100 text-slate-600'}>
                    {MODULE_CFG[je.sourceModule]?.label ?? je.sourceModule}
                  </Badge>
                </Td>
                <Td><span className="text-emerald-700 font-semibold text-sm tabular-nums">{formatCurrency(je.totalDebit)}</span></Td>
                <Td><span className="text-red-600 font-semibold text-sm tabular-nums">{formatCurrency(je.totalCredit)}</span></Td>
                <Td><Badge className={STATUS_CFG[je.status].cls}>{STATUS_CFG[je.status].label}</Badge></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {je.status === 'DRAFT' && (
                      <Button size="xs" variant="success" onClick={() => postEntry(je)}>Post</Button>
                    )}
                    {je.status === 'POSTED' && (
                      <Button size="xs" variant="danger" onClick={() => setVoidTarget(je)}>Void</Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No entries found.</div>
        )}
      </Card>

      {/* New Entry Modal */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New Journal Entry"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => saveEntry(false)} disabled={!newDesc || lines.filter(l => l.accountCode).length < 2}>Save as Draft</Button>
            <Button onClick={() => saveEntry(true)} disabled={!isBalanced || !newDesc}>Post Entry</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Date" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <Input label="Reference (optional)" value={newRef} onChange={e => setNewRef(e.target.value)} placeholder="OR-2025-001" />
            <Select label="Source Module" value={newModule} onChange={e => setNewModule(e.target.value as JournalEntry['sourceModule'])}>
              <option value="MANUAL">Manual</option>
              <option value="TREASURY">Treasury</option>
              <option value="PURCHASING">Purchasing</option>
              <option value="AMS">AMS</option>
              <option value="HRIS">HRIS</option>
              <option value="PAYROLL">Payroll</option>
            </Select>
          </div>
          <Textarea label="Description *" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe this journal entry..." rows={2} />

          {/* Journal Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Journal Lines</p>
              <Button size="xs" variant="soft" icon={<Plus className="h-3 w-3" />} onClick={addLine}>Add Line</Button>
            </div>

            <div className="border border-[#e4ebf5] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f0f4fa]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider w-32">Account</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider w-28">Debit</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider w-28">Credit</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} className="border-t border-[#e4ebf5]">
                      <td className="px-2 py-1.5">
                        <select
                          value={line.accountCode}
                          onChange={e => handleAccountSelect(idx, e.target.value)}
                          className="w-full rounded border border-[#dce8f7] bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                        >
                          <option value="">Select...</option>
                          {MOCK_CHART_OF_ACCOUNTS.filter(a => a.parentCode).map(a => (
                            <option key={a.id} value={a.code}>{a.code} — {a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={line.description}
                          onChange={e => setLines(prev => prev.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))}
                          placeholder="Optional note..."
                          className="w-full rounded border border-[#dce8f7] bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={line.debit}
                          onChange={e => setLines(prev => prev.map((l, i) => i === idx ? { ...l, debit: e.target.value, credit: e.target.value ? '' : l.credit } : l))}
                          placeholder="0.00"
                          className="w-full rounded border border-[#dce8f7] bg-white px-2 py-1 text-xs text-right tabular-nums focus:border-brand-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={line.credit}
                          onChange={e => setLines(prev => prev.map((l, i) => i === idx ? { ...l, credit: e.target.value, debit: e.target.value ? '' : l.debit } : l))}
                          placeholder="0.00"
                          className="w-full rounded border border-[#dce8f7] bg-white px-2 py-1 text-xs text-right tabular-nums focus:border-brand-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        {lines.length > 2 && (
                          <button onClick={() => removeLine(idx)} className="flex items-center justify-center h-6 w-6 rounded text-slate-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t-2 border-[#e4ebf5] bg-[#f0f4fa] font-bold">
                    <td colSpan={2} className="px-3 py-2 text-xs uppercase tracking-wider text-slate-700">Totals</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700 font-bold">{formatCurrency(totalDebit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-red-600 font-bold">{formatCurrency(totalCredit)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Balance indicator */}
            {totalDebit > 0 && (
              <div className={`mt-2 flex items-center gap-2 text-xs font-semibold ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                {isBalanced
                  ? '✓ Balanced — debit equals credit'
                  : `⚠ Imbalanced — difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Void Modal */}
      <Modal
        open={!!voidTarget}
        onClose={() => { setVoidTarget(null); setVoidReason('') }}
        title="Void Journal Entry"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setVoidTarget(null); setVoidReason('') }}>Cancel</Button>
            <Button variant="danger" onClick={voidEntry} disabled={!voidReason.trim()}>Void Entry</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            You are about to void <span className="font-mono font-bold text-brand-600">{voidTarget?.entryNumber}</span>. This action cannot be undone.
          </p>
          <Textarea label="Reason for voiding *" value={voidReason} onChange={e => setVoidReason(e.target.value)} placeholder="Provide a reason..." rows={3} />
        </div>
      </Modal>
    </div>
  )
}
