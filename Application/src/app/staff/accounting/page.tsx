'use client'

import { useMemo, useState, useCallback } from 'react'
import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  MOCK_CASHFLOW, MOCK_FIN_EXPENSES, MOCK_BUDGET_RESERVATIONS,
  MOCK_BUDGETS, MOCK_BUDGET_EXPENSES, MOCK_PURCHASE_REQUESTS,
} from '@/lib/mock-data'
import type { ExpenseStatus, BudgetReservation, ReservationStatus } from '@/types'
import { TrendingUp, TrendingDown, DollarSign, Lock, XCircle, Edit3, CheckCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const EXPENSE_STATUS: Record<ExpenseStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED: { label: 'Approved', cls: 'bg-brand-50 text-brand-600 ring-brand-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-red-200' },
  PAID:     { label: 'Paid',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

const STATUS_BADGE: Record<ReservationStatus, string> = {
  ACTIVE:    'bg-amber-50 text-amber-700',
  RELEASED:  'bg-slate-100 text-slate-500',
  CONVERTED: 'bg-emerald-50 text-emerald-700',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr']

export default function AccountingDashboard() {
  const router = useRouter()
  const [, setTick] = useState(0)
  const refresh = useCallback(() => setTick(n => n + 1), [])

  // Reservations modal state
  const [showReservations, setShowReservations]   = useState(false)
  const [resFilter, setResFilter]                 = useState<ReservationStatus | 'ALL'>('ALL')
  const [editing, setEditing]                     = useState<BudgetReservation | null>(null)
  const [editAmount, setEditAmount]               = useState('')
  const [releaseReason, setReleaseReason]         = useState('')
  const [releasing, setReleasing]                 = useState<BudgetReservation | null>(null)

  const totalInflow    = MOCK_CASHFLOW.filter(c => c.type === 'INFLOW').reduce((s, c) => s + c.amount, 0)
  const totalOutflow   = MOCK_CASHFLOW.filter(c => c.type === 'OUTFLOW').reduce((s, c) => s + c.amount, 0)
  const netCashflow    = totalInflow - totalOutflow
  const activeReserved = MOCK_BUDGET_RESERVATIONS.filter(r => r.status === 'ACTIVE').reduce((s, r) => s + r.amount, 0)

  const chartData = useMemo(() => MONTHS.map((month, i) => {
    const mm     = String(i + 1).padStart(2, '0')
    const prefix = `2025-${mm}`
    const inflow  = MOCK_CASHFLOW.filter(c => c.type === 'INFLOW'  && c.date.startsWith(prefix)).reduce((s, c) => s + c.amount, 0)
    const outflow = MOCK_CASHFLOW.filter(c => c.type === 'OUTFLOW' && c.date.startsWith(prefix)).reduce((s, c) => s + c.amount, 0)
    return { month, inflow, outflow }
  }), [])

  const budgetHealth = useMemo(() => MOCK_BUDGETS.map(b => {
    const spent = MOCK_BUDGET_EXPENSES.filter(e => e.budgetId === b.id).reduce((s, e) => s + e.amount, 0)
    const pct   = Math.round((spent / b.amount) * 100)
    return { ...b, spent, pct }
  }), [])

  const recentExpenses = [...MOCK_FIN_EXPENSES].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  const pendingPRs = MOCK_PURCHASE_REQUESTS.filter(pr =>
    pr.status === 'SUBMITTED' &&
    pr.approvalChain.some(a => a.role === 'ACCOUNTING' && a.status === 'PENDING'),
  )

  const filteredReservations = resFilter === 'ALL'
    ? MOCK_BUDGET_RESERVATIONS
    : MOCK_BUDGET_RESERVATIONS.filter(r => r.status === resFilter)

  // ── Reservation actions ────────────────────────────────────────────────────

  function handleRelease(r: BudgetReservation) {
    const idx = MOCK_BUDGET_RESERVATIONS.findIndex(x => x.id === r.id)
    if (idx < 0) return
    MOCK_BUDGET_RESERVATIONS[idx] = {
      ...MOCK_BUDGET_RESERVATIONS[idx],
      status: 'RELEASED',
      releasedAt: new Date().toISOString(),
    }
    setReleasing(null)
    setReleaseReason('')
    refresh()
  }

  function handleEditSave(r: BudgetReservation) {
    const val = parseFloat(editAmount)
    if (isNaN(val) || val <= 0) return
    const idx = MOCK_BUDGET_RESERVATIONS.findIndex(x => x.id === r.id)
    if (idx < 0) return
    MOCK_BUDGET_RESERVATIONS[idx] = { ...MOCK_BUDGET_RESERVATIONS[idx], amount: val }
    setEditing(null)
    setEditAmount('')
    refresh()
  }

  return (
    <div className="space-y-6">
      <SectionTitle description="Financial overview — income, expenses, and budget utilization.">
        Accounting Dashboard
      </SectionTitle>

      {/* ── Clickable Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Income → cashflow page */}
        <Link href="/staff/accounting/cashflow" className="block">
          <StatCard
            label="Total Income"
            value={formatCurrency(totalInflow)}
            icon={TrendingUp}
            color="bg-emerald-50 text-emerald-600"
          />
        </Link>

        {/* Total Expenses → expenses page */}
        <Link href="/staff/accounting/expenses" className="block">
          <StatCard
            label="Total Expenses"
            value={formatCurrency(totalOutflow)}
            icon={TrendingDown}
            color="bg-red-50 text-red-500"
          />
        </Link>

        {/* Net Cashflow → cashflow page */}
        <Link href="/staff/accounting/cashflow" className="block">
          <StatCard
            label="Net Cashflow"
            value={formatCurrency(netCashflow)}
            icon={DollarSign}
            color={netCashflow >= 0 ? 'bg-brand-50 text-brand-500' : 'bg-red-50 text-red-500'}
          />
        </Link>

        {/* Reserved Budgets → opens management modal */}
        <button
          className="block w-full text-left"
          onClick={() => { setShowReservations(true); setResFilter('ALL') }}
        >
          <StatCard
            label="Reserved Budgets"
            value={formatCurrency(activeReserved)}
            sub="click to manage reservations"
            icon={Lock}
            color="bg-amber-50 text-amber-600"
          />
        </button>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Cashflow Trend (Jan–Apr 2025)</CardTitle>
            <Link href="/staff/accounting/cashflow" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Bar dataKey="inflow"  name="Inflow"  fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Outflow" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Budget Utilization</CardTitle>
            <Link href="/staff/treasury/budget" className="text-xs text-brand-600 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-4">
            {budgetHealth.map(b => (
              <div key={b.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 truncate max-w-[120px]">{b.department.replace('College of ', '')}</span>
                  <span className={b.pct >= 100 ? 'text-red-600 font-bold' : b.pct >= 80 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                    {b.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${b.pct >= 100 ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                  />
                </div>
                <p className="text-2xs text-slate-400 mt-0.5">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Tables ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
            <CardTitle>Recent Expenses</CardTitle>
            <Link href="/staff/accounting/expenses" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <Table>
            <Thead><Th>Title</Th><Th>Amount</Th><Th>Date</Th><Th>Status</Th></Thead>
            <Tbody>
              {recentExpenses.map(e => {
                const s = EXPENSE_STATUS[e.status]
                return (
                  <Tr key={e.id}>
                    <Td>
                      <p className="font-medium text-slate-800 max-w-[180px] truncate">{e.title}</p>
                      <p className="text-xs text-slate-400">{e.category}</p>
                    </Td>
                    <Td><span className="font-semibold">{formatCurrency(e.amount)}</span></Td>
                    <Td className="text-slate-500">{formatDate(e.date)}</Td>
                    <Td><Badge className={s.cls}>{s.label}</Badge></Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>

        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
            <CardTitle>Pending PR Approvals (Accounting)</CardTitle>
            <Link href="/staff/purchasing/requests" className="text-xs text-brand-600 hover:underline">Review →</Link>
          </div>
          {pendingPRs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No pending approvals.</div>
          ) : (
            <Table>
              <Thead><Th>PR #</Th><Th>Title</Th><Th>Dept</Th><Th>Amount</Th></Thead>
              <Tbody>
                {pendingPRs.map(pr => (
                  <Tr key={pr.id}>
                    <Td><span className="font-mono text-xs text-brand-600 font-semibold">{pr.prNumber}</span></Td>
                    <Td className="max-w-[140px]"><p className="truncate text-slate-800 font-medium">{pr.title}</p></Td>
                    <Td className="text-slate-500">{pr.department.replace('College of ', '')}</Td>
                    <Td><span className="font-semibold text-amber-700">{formatCurrency(pr.totalAmount)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      </div>

      {/* ── Reserved Budgets Modal ─────────────────────────────────────────── */}
      {showReservations && (
        <Modal
          open
          onClose={() => { setShowReservations(false); setEditing(null); setReleasing(null) }}
          title="Budget Reservations"
          description="Manage active budget reservations — edit amounts or release reserved funds"
          size="lg"
          footer={
            <Button variant="outline" onClick={() => { setShowReservations(false); setEditing(null); setReleasing(null) }}>
              Close
            </Button>
          }
        >
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {([
              { label: 'Active',    status: 'ACTIVE',    color: 'bg-amber-50 text-amber-700' },
              { label: 'Released',  status: 'RELEASED',  color: 'bg-slate-100 text-slate-600' },
              { label: 'Converted', status: 'CONVERTED', color: 'bg-emerald-50 text-emerald-700' },
            ] as { label: string; status: ReservationStatus; color: string }[]).map(s => {
              const total = MOCK_BUDGET_RESERVATIONS
                .filter(r => r.status === s.status)
                .reduce((sum, r) => sum + r.amount, 0)
              const count = MOCK_BUDGET_RESERVATIONS.filter(r => r.status === s.status).length
              return (
                <button
                  key={s.status}
                  onClick={() => setResFilter(resFilter === s.status ? 'ALL' : s.status)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    resFilter === s.status ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-[#e4ebf5] hover:border-brand-200'
                  }`}
                >
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold mb-1.5 ${s.color}`}>{s.label}</span>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(total)}</p>
                  <p className="text-xs text-slate-400">{count} reservation{count !== 1 ? 's' : ''}</p>
                </button>
              )
            })}
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 mb-4">
            {(['ALL', 'ACTIVE', 'RELEASED', 'CONVERTED'] as const).map(f => (
              <button key={f}
                onClick={() => setResFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  resFilter === f
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-[#e4ebf5] text-slate-500 hover:border-brand-300 hover:text-brand-700'
                }`}>
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Reservations table */}
          {filteredReservations.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No reservations in this category.</div>
          ) : (
            <div className="space-y-2">
              {filteredReservations.map(r => (
                <div key={r.id} className="rounded-xl border border-[#e4ebf5] bg-white overflow-hidden">
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-xs text-brand-700 font-bold">{r.prNumber}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[r.status]}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{r.department}</p>
                      <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                    </div>

                    {/* Amount (editable inline for ACTIVE) */}
                    <div className="text-right shrink-0">
                      {editing?.id === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            className="w-28 rounded-lg border border-brand-400 bg-white px-2.5 py-1.5 text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleEditSave(r); if (e.key === 'Escape') setEditing(null) }}
                          />
                          <button onClick={() => handleEditSave(r)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditing(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${r.status === 'ACTIVE' ? 'text-amber-700' : 'text-slate-500'}`}>
                            {formatCurrency(r.amount)}
                          </span>
                          {r.status === 'ACTIVE' && (
                            <button
                              onClick={() => { setEditing(r); setEditAmount(String(r.amount)) }}
                              className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Edit amount"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Release button (ACTIVE only) */}
                    {r.status === 'ACTIVE' && editing?.id !== r.id && (
                      <button
                        onClick={() => setReleasing(r)}
                        className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Release
                      </button>
                    )}

                    {r.status === 'RELEASED' && r.releasedAt && (
                      <span className="shrink-0 text-xs text-slate-400">Released {formatDate(r.releasedAt)}</span>
                    )}
                    {r.status === 'CONVERTED' && r.convertedAt && (
                      <span className="shrink-0 text-xs text-slate-400">Converted {formatDate(r.convertedAt)}</span>
                    )}
                  </div>

                  {/* Release confirm row */}
                  {releasing?.id === r.id && (
                    <div className="border-t border-[#f0f4fa] bg-red-50 px-4 py-3">
                      <p className="text-xs font-semibold text-red-700 mb-2">Release this reservation?</p>
                      <p className="text-xs text-red-600 mb-2">
                        {formatCurrency(r.amount)} will be freed back to the <strong>{r.department}</strong> budget.
                      </p>
                      <input
                        value={releaseReason}
                        onChange={e => setReleaseReason(e.target.value)}
                        placeholder="Reason for release (optional)"
                        className="w-full rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs mb-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReleasing(null); setReleaseReason('') }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRelease(r)}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
                        >
                          Confirm Release
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
