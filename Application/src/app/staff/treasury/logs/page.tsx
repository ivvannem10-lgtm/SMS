'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FileText, Filter, ArrowRight, Download } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { MOCK_TREASURY_LOGS } from '@/lib/mock-data'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { TreasuryTxType } from '@/types'

const TX_META: Record<TreasuryTxType, { label: string; badgeColor: string; amountColor: string }> = {
  CHARGE_ADDED:        { label: 'Charge Added',        badgeColor: 'bg-amber-50 text-amber-700 ring-amber-200',   amountColor: 'text-slate-800' },
  CHARGE_VOIDED:       { label: 'Charge Voided',       badgeColor: 'bg-red-50 text-red-700 ring-red-200',         amountColor: 'text-red-500 line-through' },
  PAYMENT_RECEIVED:    { label: 'Payment Received',    badgeColor: 'bg-emerald-50 text-emerald-700 ring-emerald-200', amountColor: 'text-emerald-600 font-bold' },
  OVERPAYMENT_APPLIED: { label: 'Overpayment Applied', badgeColor: 'bg-blue-50 text-blue-700 ring-blue-200',      amountColor: 'text-blue-600' },
  REFUND_ISSUED:       { label: 'Refund Issued',       badgeColor: 'bg-violet-50 text-violet-700 ring-violet-200', amountColor: 'text-violet-600' },
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL',                  label: 'All Types' },
  { value: 'PAYMENT_RECEIVED',     label: 'Payment Received' },
  { value: 'CHARGE_ADDED',         label: 'Charge Added' },
  { value: 'CHARGE_VOIDED',        label: 'Charge Voided' },
  { value: 'OVERPAYMENT_APPLIED',  label: 'Overpayment Applied' },
  { value: 'REFUND_ISSUED',        label: 'Refund Issued' },
]

export default function TreasuryLogsPage() {
  const { data: session } = useSession()
  const me = (session?.user as { name?: string })?.name ?? ''

  const [query,       setQuery]       = useState('')
  const [typeFilter,  setTypeFilter]  = useState('ALL')
  const [cashierFilter, setCashierFilter] = useState('ALL')

  const logs = MOCK_TREASURY_LOGS

  // Unique cashiers for filter
  const cashiers = useMemo(() => {
    const set = new Set(logs.map((l) => l.cashier))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => {
    return [...logs].reverse().filter((log) => {
      if (typeFilter !== 'ALL' && log.type !== typeFilter) return false
      if (cashierFilter !== 'ALL' && log.cashier !== cashierFilter) return false
      const q = query.toLowerCase()
      return !q
        || log.studentName.toLowerCase().includes(q)
        || log.studentNo.toLowerCase().includes(q)
        || log.description.toLowerCase().includes(q)
        || log.cashier.toLowerCase().includes(q)
    })
  }, [logs, query, typeFilter, cashierFilter])

  // Summary for filtered view
  const totalReceived = filtered.filter((l) => l.type === 'PAYMENT_RECEIVED').reduce((s, l) => s + l.amount, 0)
  const totalVoided   = filtered.filter((l) => l.type === 'CHARGE_VOIDED').reduce((s, l) => s + l.amount, 0)
  const totalCharged  = filtered.filter((l) => l.type === 'CHARGE_ADDED').reduce((s, l) => s + l.amount, 0)

  return (
    <div className="space-y-6 max-w-7xl">
      <SectionTitle description="Complete audit trail of all treasury transactions — every action is logged and attributed">
        Transaction Logs
      </SectionTitle>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Received (filtered)',  value: formatCurrency(totalReceived),  color: 'text-emerald-600' },
          { label: 'Total Charged (filtered)',   value: formatCurrency(totalCharged),   color: 'text-slate-800' },
          { label: 'Total Voided (filtered)',    value: formatCurrency(totalVoided),    color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e4ebf5] bg-white px-5 py-4 shadow-card">
            <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search student, description, cashier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-72"
        />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48">
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)} className="w-48">
          <option value="ALL">All Cashiers</option>
          {cashiers.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          {filtered.length} of {logs.length} records
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <FileText className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">No transactions recorded yet</p>
            <p className="text-xs text-slate-300 text-center max-w-xs">
              Transaction logs appear here as the cashier processes payments, adds charges, and voids items.
            </p>
            <Link href="/staff/treasury" className="mt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Go to Cashier <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No transactions match your filters.</p>
        ) : (
          <Table>
            <Thead>
              <Th>Date & Time</Th>
              <Th>Type</Th>
              <Th>Student</Th>
              <Th>Description</Th>
              <Th>Amount</Th>
              <Th>Reference</Th>
              <Th>Processed By</Th>
              <Th>Notes</Th>
            </Thead>
            <Tbody>
              {filtered.map((log) => {
                const meta = TX_META[log.type as TreasuryTxType] ?? TX_META.CHARGE_ADDED
                return (
                  <Tr key={log.id}>
                    <Td className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</Td>
                    <Td>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badgeColor}`}>
                        {meta.label}
                      </span>
                    </Td>
                    <Td>
                      <Link href={`/staff/treasury/soa/${log.studentId}`} className="hover:text-brand-600 transition-colors">
                        <p className="text-sm font-semibold text-slate-800">{log.studentName}</p>
                        <p className="text-xs text-slate-400">{log.studentNo}</p>
                      </Link>
                    </Td>
                    <Td className="max-w-[200px]">
                      <p className="text-sm text-slate-700 truncate">{log.description}</p>
                    </Td>
                    <Td>
                      <span className={`text-sm font-bold tabular-nums ${meta.amountColor}`}>
                        {log.type === 'PAYMENT_RECEIVED' ? '+' : ''}{formatCurrency(log.amount)}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate-400">{log.referenceNumber ?? '—'}</Td>
                    <Td>
                      <p className={`text-xs font-semibold ${log.cashier === me ? 'text-brand-700' : 'text-slate-600'}`}>
                        {log.cashier}
                        {log.cashier === me && <span className="ml-1 text-brand-400">(you)</span>}
                      </p>
                    </Td>
                    <Td className="text-xs text-slate-400 max-w-[140px]">
                      <p className="truncate">{log.notes ?? '—'}</p>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
