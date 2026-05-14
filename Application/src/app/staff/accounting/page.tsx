'use client'

import { useMemo } from 'react'
import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  MOCK_CASHFLOW, MOCK_FIN_EXPENSES, MOCK_BUDGET_RESERVATIONS,
  MOCK_BUDGETS, MOCK_BUDGET_EXPENSES, MOCK_PURCHASE_REQUESTS,
} from '@/lib/mock-data'
import type { ExpenseStatus } from '@/types'
import { TrendingUp, TrendingDown, DollarSign, Lock, BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'

const EXPENSE_STATUS: Record<ExpenseStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED: { label: 'Approved', cls: 'bg-brand-50 text-brand-600 ring-brand-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-red-200' },
  PAID:     { label: 'Paid',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr']

export default function AccountingDashboard() {
  const totalInflow  = MOCK_CASHFLOW.filter(c => c.type === 'INFLOW').reduce((s,c) => s + c.amount, 0)
  const totalOutflow = MOCK_CASHFLOW.filter(c => c.type === 'OUTFLOW').reduce((s,c) => s + c.amount, 0)
  const netCashflow  = totalInflow - totalOutflow
  const activeReserved = MOCK_BUDGET_RESERVATIONS.filter(r => r.status === 'ACTIVE').reduce((s,r) => s + r.amount, 0)

  // Monthly cashflow for chart
  const chartData = useMemo(() => MONTHS.map((month, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const prefix = `2025-${mm}`
    const inflow  = MOCK_CASHFLOW.filter(c => c.type === 'INFLOW'  && c.date.startsWith(prefix)).reduce((s,c) => s + c.amount, 0)
    const outflow = MOCK_CASHFLOW.filter(c => c.type === 'OUTFLOW' && c.date.startsWith(prefix)).reduce((s,c) => s + c.amount, 0)
    return { month, inflow, outflow }
  }), [])

  // Budget utilization
  const budgetHealth = useMemo(() => MOCK_BUDGETS.map(b => {
    const spent = MOCK_BUDGET_EXPENSES.filter(e => e.budgetId === b.id).reduce((s,e) => s + e.amount, 0)
    const pct   = Math.round((spent / b.amount) * 100)
    return { ...b, spent, pct }
  }), [])

  // Recent expenses
  const recentExpenses = [...MOCK_FIN_EXPENSES].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  // Pending PRs for accounting
  const pendingPRs = MOCK_PURCHASE_REQUESTS.filter(pr =>
    pr.status === 'SUBMITTED' &&
    pr.approvalChain.some(a => a.role === 'ACCOUNTING' && a.status === 'PENDING')
  )

  return (
    <div className="space-y-6">
      <SectionTitle description="Financial overview — income, expenses, and budget utilization.">Accounting Dashboard</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income"      value={formatCurrency(totalInflow)}   icon={TrendingUp}   color="bg-emerald-50 text-emerald-600"/>
        <StatCard label="Total Expenses"    value={formatCurrency(totalOutflow)}  icon={TrendingDown} color="bg-red-50 text-red-500"/>
        <StatCard label="Net Cashflow"      value={formatCurrency(netCashflow)}   icon={DollarSign}   color={netCashflow >= 0 ? 'bg-brand-50 text-brand-500' : 'bg-red-50 text-red-500'}/>
        <StatCard label="Reserved Budgets"  value={formatCurrency(activeReserved)} sub="active reservations" icon={Lock} color="bg-amber-50 text-amber-600"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cashflow Chart */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Cashflow Trend (Jan–Apr 2025)</CardTitle>
            <Link href="/staff/accounting/cashflow" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Bar dataKey="inflow"  name="Inflow"  fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="outflow" name="Outflow" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Budget Utilization */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Budget Utilization</CardTitle>
            <Link href="/staff/treasury/budget" className="text-xs text-brand-600 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-4">
            {budgetHealth.map(b => (
              <div key={b.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 truncate max-w-[120px]">{b.department.replace('College of ','')}</span>
                  <span className={b.pct >= 100 ? 'text-red-600 font-bold' : b.pct >= 80 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                    {b.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${b.pct >= 100 ? 'bg-red-500' : b.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(b.pct, 100)}%` }} />
                </div>
                <p className="text-2xs text-slate-400 mt-0.5">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
            <CardTitle>Recent Expenses</CardTitle>
            <Link href="/staff/accounting/expenses" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <Table>
            <Thead>
              <Th>Title</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
            </Thead>
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

        {/* Pending PR Approvals */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
            <CardTitle>Pending PR Approvals (Accounting)</CardTitle>
            <Link href="/staff/purchasing/requests" className="text-xs text-brand-600 hover:underline">Review →</Link>
          </div>
          {pendingPRs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No pending approvals.</div>
          ) : (
            <Table>
              <Thead>
                <Th>PR #</Th>
                <Th>Title</Th>
                <Th>Dept</Th>
                <Th>Amount</Th>
              </Thead>
              <Tbody>
                {pendingPRs.map(pr => (
                  <Tr key={pr.id}>
                    <Td><span className="font-mono text-xs text-brand-600 font-semibold">{pr.prNumber}</span></Td>
                    <Td className="max-w-[140px]"><p className="truncate text-slate-800 font-medium">{pr.title}</p></Td>
                    <Td className="text-slate-500">{pr.department.replace('College of ','')}</Td>
                    <Td><span className="font-semibold text-amber-700">{formatCurrency(pr.totalAmount)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
