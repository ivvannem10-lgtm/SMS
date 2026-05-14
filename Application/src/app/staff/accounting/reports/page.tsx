'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  MOCK_CASHFLOW, MOCK_FIN_EXPENSES, MOCK_BUDGETS, MOCK_BUDGET_EXPENSES, MOCK_OFFICIAL_RECEIPTS,
} from '@/lib/mock-data'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Printer } from 'lucide-react'

type TabType = 'cashflow' | 'budget' | 'expenses' | 'collections'

const COLORS = ['#1a4a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const TAB_LABELS: Record<TabType, string> = {
  cashflow: 'Cashflow',
  budget: 'Budget Utilization',
  expenses: 'Expense Summary',
  collections: 'Collection Summary',
}

export default function ReportsPage() {
  const [tab, setTab] = useState<TabType>('cashflow')

  // Cashflow by month
  const cashflowData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Aug']
    const prefixes = ['2025-01','2025-02','2025-03','2025-08']
    return months.map((month, i) => {
      const p = prefixes[i]
      const inflow  = MOCK_CASHFLOW.filter(c => c.type==='INFLOW'  && c.date.startsWith(p)).reduce((s,c)=>s+c.amount,0)
      const outflow = MOCK_CASHFLOW.filter(c => c.type==='OUTFLOW' && c.date.startsWith(p)).reduce((s,c)=>s+c.amount,0)
      return { month, inflow, outflow, net: inflow - outflow }
    })
  }, [])

  // Budget utilization
  const budgetData = useMemo(() => MOCK_BUDGETS.map(b => {
    const spent = MOCK_BUDGET_EXPENSES.filter(e => e.budgetId === b.id).reduce((s,e)=>s+e.amount,0)
    const remaining = Math.max(0, b.amount - spent)
    return { name: b.department.replace('College of ',''), spent, remaining, total: b.amount }
  }), [])

  // Expense by category
  const expenseByCat = useMemo(() => {
    const map = new Map<string, number>()
    MOCK_FIN_EXPENSES.forEach(e => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [])

  // Collections by type
  const collByType = useMemo(() => {
    const map = new Map<string, number>()
    MOCK_OFFICIAL_RECEIPTS.filter(r => !r.voidedAt).forEach(r => {
      map.set(r.paymentType, (map.get(r.paymentType) ?? 0) + r.amount)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [])

  function handleExport() {
    window.print()
  }

  return (
    <div className="space-y-6">
      <SectionTitle description="Generate and view financial summary reports."
        actions={<Button size="sm" variant="outline" icon={<Printer className="h-3.5 w-3.5"/>} onClick={handleExport}>Export / Print</Button>}
      >Financial Reports</SectionTitle>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white border border-[#e4ebf5] rounded-xl p-1 w-fit">
        {(Object.keys(TAB_LABELS) as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab===t ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'cashflow' && (
        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">Monthly Cashflow — 2025</CardTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa"/>
                <XAxis dataKey="month" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:11}} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))}/>
                <Bar dataKey="inflow"  name="Inflow"  fill="#10b981" radius={[4,4,0,0]}/>
                <Bar dataKey="outflow" name="Outflow" fill="#f87171" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card padding="none">
            <div className="px-5 py-3 border-b border-[#e4ebf5]"><CardTitle>Cashflow Detail</CardTitle></div>
            <Table>
              <Thead><Th>Month</Th><Th>Total Inflow</Th><Th>Total Outflow</Th><Th>Net</Th></Thead>
              <Tbody>
                {cashflowData.map(row => (
                  <Tr key={row.month}>
                    <Td className="font-medium">{row.month} 2025</Td>
                    <Td className="text-emerald-700 font-semibold">{formatCurrency(row.inflow)}</Td>
                    <Td className="text-red-600 font-semibold">{formatCurrency(row.outflow)}</Td>
                    <Td className={`font-bold ${row.net >= 0 ? 'text-brand-600' : 'text-red-600'}`}>{formatCurrency(row.net)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {tab === 'budget' && (
        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">Budget Utilization by Department</CardTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={budgetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa"/>
                <XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:12}} width={80}/>
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))}/>
                <Bar dataKey="spent"     name="Spent"     fill="#1a4a8a" radius={[0,4,4,0]}/>
                <Bar dataKey="remaining" name="Remaining" fill="#dce8f7" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card padding="none">
            <Table>
              <Thead><Th>Department</Th><Th>Total Budget</Th><Th>Spent</Th><Th>Remaining</Th><Th>Utilization</Th></Thead>
              <Tbody>
                {budgetData.map(b => {
                  const pct = Math.round((b.spent/b.total)*100)
                  return (
                    <Tr key={b.name}>
                      <Td className="font-medium">{b.name}</Td>
                      <Td>{formatCurrency(b.total)}</Td>
                      <Td className="font-semibold text-slate-800">{formatCurrency(b.spent)}</Td>
                      <Td className="text-emerald-700">{formatCurrency(b.remaining)}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${pct>=100?'bg-red-500':pct>=80?'bg-amber-400':'bg-emerald-500'}`} style={{width:`${Math.min(pct,100)}%`}}/>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{pct}%</span>
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle className="mb-4">Expenses by Category</CardTitle>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={expenseByCat} dataKey="value" nameKey="name" outerRadius={100} label={({name,percent}: {name?:string,percent?:number})=>`${name??''}: ${((percent??0)*100).toFixed(0)}%`} labelLine>
                    {expenseByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))}/>
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card padding="none">
              <Table>
                <Thead><Th>Category</Th><Th>Total Amount</Th><Th>Count</Th></Thead>
                <Tbody>
                  {expenseByCat.map(e => (
                    <Tr key={e.name}>
                      <Td className="font-medium">{e.name}</Td>
                      <Td className="font-semibold">{formatCurrency(e.value)}</Td>
                      <Td>{MOCK_FIN_EXPENSES.filter(x=>x.category===e.name).length}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          </div>
        </div>
      )}

      {tab === 'collections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardTitle className="mb-4">Collections by Payment Type</CardTitle>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={collByType} dataKey="value" nameKey="name" outerRadius={100} label={({name,percent}: {name?:string,percent?:number})=>`${name??''}: ${((percent??0)*100).toFixed(0)}%`}>
                    {collByType.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))}/>
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card padding="none">
              <Table>
                <Thead><Th>Payment Type</Th><Th>Total Collected</Th><Th>Count</Th></Thead>
                <Tbody>
                  {collByType.map(c => (
                    <Tr key={c.name}>
                      <Td className="font-medium">{c.name}</Td>
                      <Td className="font-semibold text-emerald-700">{formatCurrency(c.value)}</Td>
                      <Td>{MOCK_OFFICIAL_RECEIPTS.filter(r=>r.paymentType===c.name && !r.voidedAt).length}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
