'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MOCK_CASHFLOW, MOCK_AUDIT_LOGS } from '@/lib/mock-data'
import type { CashflowEntry } from '@/types'
import { TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react'

const CATEGORIES = ['Tuition', 'Procurement', 'Payroll', 'Utilities', 'Miscellaneous', 'Other']

const MONTHS_LIST = [
  { value: '', label: 'All Months' },
  { value: '2025-01', label: 'January 2025' },
  { value: '2025-02', label: 'February 2025' },
  { value: '2025-03', label: 'March 2025' },
  { value: '2025-08', label: 'August 2025' },
]

export default function CashflowPage() {
  const [entries, setEntries] = useState<CashflowEntry[]>(MOCK_CASHFLOW)
  const [month, setMonth]     = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    type: 'INFLOW' as 'INFLOW' | 'OUTFLOW',
    amount: '', description: '', category: CATEGORIES[0],
    reference: '', date: new Date().toISOString().slice(0, 10),
  })

  const filtered = useMemo(() => {
    const base = month
      ? entries.filter(e => e.date.startsWith(month))
      : entries
    return [...base].sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, month])

  // Running balance (chronological)
  const chronological = useMemo(() =>
    [...filtered].sort((a, b) => a.date.localeCompare(b.date)),
  [filtered])

  const balanceMap = useMemo(() => {
    const m = new Map<string, number>()
    let bal = 0
    for (const e of chronological) {
      bal += e.type === 'INFLOW' ? e.amount : -e.amount
      m.set(e.id, bal)
    }
    return m
  }, [chronological])

  const totalInflow  = filtered.filter(e => e.type === 'INFLOW').reduce((s,e) => s + e.amount, 0)
  const totalOutflow = filtered.filter(e => e.type === 'OUTFLOW').reduce((s,e) => s + e.amount, 0)
  const netBalance   = totalInflow - totalOutflow

  function handleAdd() {
    setSaving(true)
    setTimeout(() => {
      const newEntry: CashflowEntry = {
        id: `cf_${Date.now()}`, type: form.type, amount: parseFloat(form.amount) || 0,
        description: form.description, reference: form.reference || undefined,
        category: form.category, date: form.date, schoolId: 'school_1',
        createdAt: new Date().toISOString(),
      }
      MOCK_CASHFLOW.push(newEntry)
      setEntries([...MOCK_CASHFLOW])
      MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'RECORD_CASHFLOW', entity:'CashflowEntry', entityId:newEntry.id, details:`${form.type} ₱${form.amount} — ${form.description}`, userId:'u_accounting', schoolId:'school_1', createdAt:new Date().toISOString() })
      setForm({ type:'INFLOW', amount:'', description:'', category:CATEGORIES[0], reference:'', date:new Date().toISOString().slice(0,10) })
      setSaving(false)
      setAddOpen(false)
    }, 500)
  }

  return (
    <div className="space-y-6">
      <SectionTitle description="Monitor all cashflow — inflows and outflows — with running balance."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5"/>} onClick={() => setAddOpen(true)}>Record Entry</Button>}
      >Cashflow Monitor</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Inflow"  value={formatCurrency(totalInflow)}  icon={TrendingUp}   color="bg-emerald-50 text-emerald-600"/>
        <StatCard label="Total Outflow" value={formatCurrency(totalOutflow)} icon={TrendingDown} color="bg-red-50 text-red-500"/>
        <StatCard label="Net Balance"   value={formatCurrency(netBalance)}   icon={DollarSign}   color={netBalance >= 0 ? 'bg-brand-50 text-brand-500' : 'bg-red-50 text-red-500'}/>
      </div>

      {/* Filter */}
      <Card padding="sm">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 font-medium">Filter by Month:</label>
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="h-8 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            {MONTHS_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <Th>Type</Th>
            <Th>Description</Th>
            <Th>Category</Th>
            <Th>Reference</Th>
            <Th>Date</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Balance</Th>
          </Thead>
          <Tbody>
            {filtered.length === 0 && (
              <Tr><Td colSpan={7} className="text-center py-10 text-slate-400">No entries found.</Td></Tr>
            )}
            {filtered.map(e => (
              <Tr key={e.id}>
                <Td>
                  {e.type === 'INFLOW'
                    ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Inflow</Badge>
                    : <Badge className="bg-red-50 text-red-600 ring-red-200">Outflow</Badge>
                  }
                </Td>
                <Td className="max-w-[200px]"><p className="truncate text-slate-800">{e.description}</p></Td>
                <Td><span className="text-slate-500 text-sm">{e.category}</span></Td>
                <Td><span className="font-mono text-xs text-slate-500">{e.reference || '—'}</span></Td>
                <Td className="text-slate-500">{formatDate(e.date)}</Td>
                <Td className={`text-right font-semibold tabular-nums ${e.type === 'INFLOW' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {e.type === 'INFLOW' ? '+' : '-'}{formatCurrency(e.amount)}
                </Td>
                <Td className="text-right font-semibold tabular-nums text-slate-700">
                  {formatCurrency(balanceMap.get(e.id) ?? 0)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Record Entry Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Cashflow Entry" size="md"
        footer={<>
          <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} disabled={!form.amount || !form.description} onClick={handleAdd}>Save Entry</Button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
            <div className="flex gap-3">
              {(['INFLOW','OUTFLOW'] as const).map(t => (
                <button key={t} onClick={() => setForm(f=>({...f, type:t}))}
                  className={`flex-1 h-9 rounded-lg border text-sm font-semibold transition-colors ${form.type===t
                    ? t==='INFLOW' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500'
                    : 'border-[#dce8f7] text-slate-600 hover:bg-slate-50'}`}
                >{t === 'INFLOW' ? '↑ Inflow' : '↓ Outflow'}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (PHP)</label>
              <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} min="0"
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reference (optional)</label>
              <input value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} placeholder="OR-#, PO-#..."
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
