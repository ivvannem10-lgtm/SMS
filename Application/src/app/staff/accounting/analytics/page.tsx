'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import {
  MOCK_CASHFLOW, MOCK_FIN_EXPENSES, MOCK_BUDGETS, MOCK_BUDGET_EXPENSES,
  MOCK_CHART_OF_ACCOUNTS,
} from '@/lib/mock-data'
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'

type Period = 'month' | 'quarter' | 'year'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const PIE_COLORS = ['#1a4a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

const EXPENSE_CATS = ['OPERATIONAL', 'PROCUREMENT', 'PAYROLL', 'MAINTENANCE', 'UTILITIES', 'EQUIPMENT', 'OTHER']

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month')

  const totalRevenue = useMemo(
    () => MOCK_CHART_OF_ACCOUNTS.filter(a => a.type === 'REVENUE' && a.parentCode).reduce((s, a) => s + a.balance, 0),
    []
  )
  const totalExpenses = useMemo(
    () => MOCK_CHART_OF_ACCOUNTS.filter(a => a.type === 'EXPENSE' && a.parentCode).reduce((s, a) => s + a.balance, 0),
    []
  )
  const netSurplus = totalRevenue - totalExpenses
  const budgetUtilPct = useMemo(() => {
    const totalBudget  = MOCK_BUDGETS.reduce((s, b) => s + b.amount, 0)
    const totalSpent   = MOCK_BUDGET_EXPENSES.reduce((s, e) => s + e.amount, 0)
    return totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  }, [])

  // Monthly Revenue vs Expenses chart
  const monthlyData = useMemo(() => MONTHS.map((month, i) => {
    const mm = String(i + 1).padStart(2, '0')
    const prefix = `2025-${mm}`
    const revenue = MOCK_CASHFLOW.filter(c => c.type === 'INFLOW' && c.date.startsWith(prefix)).reduce((s, c) => s + c.amount, 0)
    const expenses = MOCK_CASHFLOW.filter(c => c.type === 'OUTFLOW' && c.date.startsWith(prefix)).reduce((s, c) => s + c.amount, 0)
    return { month, revenue, expenses }
  }), [])

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() =>
    EXPENSE_CATS.map(cat => ({
      name: cat.charAt(0) + cat.slice(1).toLowerCase(),
      value: MOCK_FIN_EXPENSES.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    })).filter(e => e.value > 0),
    []
  )

  // Department Budget Utilization
  const deptBudgetData = useMemo(() => MOCK_BUDGETS.map(b => {
    const spent = MOCK_BUDGET_EXPENSES.filter(e => e.budgetId === b.id).reduce((s, e) => s + e.amount, 0)
    const pct = Math.round((spent / b.amount) * 100)
    return { name: b.department.replace('College of ', ''), pct, spent, budget: b.amount }
  }), [])

  // Revenue Sources (from COA 4001–4004)
  const revenueSourceData = useMemo(() =>
    MOCK_CHART_OF_ACCOUNTS.filter(a => a.type === 'REVENUE' && a.parentCode).map(a => ({
      name: a.name, value: a.balance,
    })).filter(a => a.value > 0),
    []
  )

  // Top Spending Departments
  const topDepts = useMemo(() => {
    const deptMap: Record<string, { spent: number; budget: number }> = {}
    MOCK_FIN_EXPENSES.forEach(e => {
      const dept = e.department ?? 'Administration'
      if (!deptMap[dept]) deptMap[dept] = { spent: 0, budget: 0 }
      deptMap[dept].spent += e.amount
    })
    MOCK_BUDGETS.forEach(b => {
      if (!deptMap[b.department]) deptMap[b.department] = { spent: 0, budget: 0 }
      deptMap[b.department].budget = b.amount
    })
    return Object.entries(deptMap)
      .map(([dept, { spent, budget }]) => ({ dept, spent, budget, pct: budget > 0 ? Math.round((spent / budget) * 100) : 0 }))
      .sort((a, b) => b.spent - a.spent)
  }, [])

  // Financial Health Indicators
  const currentAssets = MOCK_CHART_OF_ACCOUNTS.filter(a => a.parentCode === '1000').reduce((s, a) => s + Math.max(a.balance, 0), 0)
  const currentLiab   = MOCK_CHART_OF_ACCOUNTS.filter(a => a.parentCode === '2000').reduce((s, a) => s + a.balance, 0)
  const totalAssets   = MOCK_CHART_OF_ACCOUNTS.filter(a => a.type === 'ASSET' && a.parentCode).reduce((s, a) => s + Math.max(a.balance, 0), 0)
  const totalLiab     = MOCK_CHART_OF_ACCOUNTS.filter(a => a.type === 'LIABILITY' && a.parentCode).reduce((s, a) => s + a.balance, 0)
  const liquidityRatio   = currentLiab > 0 ? (currentAssets / currentLiab).toFixed(2) : 'N/A'
  const debtRatio        = totalAssets > 0 ? ((totalLiab / totalAssets) * 100).toFixed(1) + '%' : 'N/A'
  const revenueGrowth    = '+12.4%'  // mock
  const operatingMargin  = totalRevenue > 0 ? ((netSurplus / totalRevenue) * 100).toFixed(1) + '%' : 'N/A'

  return (
    <div className="space-y-6">
      <SectionTitle
        description="Financial performance analysis and key metrics."
        actions={
          <div className="flex gap-2">
            {(['month', 'quarter', 'year'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${period === p ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                This {p === 'month' ? 'Month' : p === 'quarter' ? 'Quarter' : 'Year'}
              </button>
            ))}
          </div>
        }
      >
        Financial Analytics
      </SectionTitle>

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"       value={formatCurrency(totalRevenue)}  icon={TrendingUp}   color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Expenses"      value={formatCurrency(totalExpenses)} icon={TrendingDown} color="bg-red-50 text-red-500" />
        <StatCard
          label="Net Surplus/Deficit"
          value={formatCurrency(Math.abs(netSurplus))}
          sub={netSurplus >= 0 ? 'Surplus' : 'Deficit'}
          icon={Activity}
          color={netSurplus >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}
        />
        <StatCard label="Budget Utilization"  value={`${budgetUtilPct}%`}           icon={Target}       color={budgetUtilPct >= 100 ? 'bg-red-50 text-red-500' : budgetUtilPct >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} />
      </div>

      {/* Row 2: Monthly Rev vs Exp + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardTitle className="mb-4">Monthly Revenue vs Expenses (2025)</CardTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: unknown) => `₱${(Number(v)/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="revenue"  name="Revenue"  fill="#1a4a8a" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">Expense Breakdown</CardTitle>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={expenseBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3: Dept Budget + Revenue Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-4">Department Budget Utilization</CardTitle>
          <div className="space-y-3">
            {deptBudgetData.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{d.name}</span>
                  <span className={`font-bold ${d.pct >= 100 ? 'text-red-600' : d.pct >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d.pct >= 100 ? 'bg-red-500' : d.pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(d.pct, 100)}%` }}
                  />
                </div>
                <p className="text-2xs text-slate-400 mt-0.5">{formatCurrency(d.spent)} / {formatCurrency(d.budget)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Revenue Sources</CardTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={revenueSourceData} dataKey="value" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }: { name?: string; percent?: number }) => `${(name ?? '').split(' ')[0]} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {revenueSourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 4: Top Spending Departments */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-[#e4ebf5]">
          <CardTitle>Top Spending Departments</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f0f4fa]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-brand-700 uppercase tracking-wider">Department</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Total Spent</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Budget</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-brand-700 uppercase tracking-wider">Utilization</th>
                <th className="px-4 py-2 text-center text-xs font-bold text-brand-700 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topDepts.map((d, i) => (
                <tr key={d.dept} className={`border-t border-[#e4ebf5] ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-400 text-xs">#{i + 1}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.dept}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(d.spent)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{d.budget > 0 ? formatCurrency(d.budget) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge className={d.pct >= 100 ? 'bg-red-50 text-red-600 ring-red-200' : d.pct >= 80 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}>
                      {d.pct}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={d.pct >= 80 ? 'text-red-500' : 'text-emerald-500'}>{d.pct >= 80 ? '↑' : '↓'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Row 5: Financial Health Indicators */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Financial Health Indicators</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Liquidity Ratio</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{liquidityRatio}</p>
            <p className="text-xs text-slate-400 mt-1">Current Assets / Current Liabilities</p>
            <Badge className="mt-2 bg-emerald-50 text-emerald-700 ring-emerald-200">Healthy</Badge>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Debt Ratio</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{debtRatio}</p>
            <p className="text-xs text-slate-400 mt-1">Total Liabilities / Total Assets</p>
            <Badge className="mt-2 bg-blue-50 text-blue-700 ring-blue-200">Low</Badge>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Revenue Growth</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{revenueGrowth}</p>
            <p className="text-xs text-slate-400 mt-1">Year-over-year growth</p>
            <Badge className="mt-2 bg-emerald-50 text-emerald-700 ring-emerald-200">Growing</Badge>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Operating Margin</p>
            <p className={`text-2xl font-bold mt-2 ${parseFloat(operatingMargin) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{operatingMargin}</p>
            <p className="text-xs text-slate-400 mt-1">Net Surplus / Total Revenue</p>
            <Badge className={`mt-2 ${parseFloat(operatingMargin) >= 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-600 ring-red-200'}`}>
              {parseFloat(operatingMargin) >= 0 ? 'Positive' : 'Negative'}
            </Badge>
          </Card>
        </div>
      </div>
    </div>
  )
}
