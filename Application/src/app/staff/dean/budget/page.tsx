'use client'
import { useSession } from 'next-auth/react'
import { AlertTriangle, CheckCircle2, XCircle, Building2, Calendar, TrendingDown, Wallet } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { MOCK_BUDGETS, MOCK_BUDGET_EXPENSES } from '@/lib/mock-data'
import type { SessionUser } from '@/types'

function php(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type Health = 'safe' | 'warning' | 'critical'
function health(pct: number): Health {
  if (pct >= 100) return 'critical'
  if (pct >= 80)  return 'warning'
  return 'safe'
}

const BAR_COLOR: Record<Health, string> = {
  safe: 'bg-emerald-500', warning: 'bg-amber-400', critical: 'bg-red-500',
}
const H_TEXT: Record<Health, string> = {
  safe: 'text-emerald-700', warning: 'text-amber-700', critical: 'text-red-700',
}

function ProgressBar({ pct, h }: { pct: number; h: Health }) {
  return (
    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${BAR_COLOR[h]}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

export default function DeanBudgetPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const dept = (user as { deanDepartment?: string })?.deanDepartment ?? ''

  const myBudgets  = MOCK_BUDGETS.filter(b => b.department === dept)
  const myExpenses = MOCK_BUDGET_EXPENSES.filter(e => e.department === dept)

  const totals = myBudgets.reduce((acc, b) => {
    const used = myExpenses.filter(e => e.budgetId === b.id).reduce((s, e) => s + e.amount, 0)
    acc.allocated += b.amount
    acc.used      += used
    return acc
  }, { allocated: 0, used: 0 })
  const totRemaining = totals.allocated - totals.used

  if (!dept) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-400">Department not assigned to your account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <SectionTitle description={`Budget overview for ${dept} — read only. Contact Treasury to request changes.`}>
        Department Budget
      </SectionTitle>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Allocated', value: php(totals.allocated), icon: Wallet,       color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Total Used',      value: php(totals.used),      icon: TrendingDown,  color: 'text-red-600',   bg: 'bg-red-50' },
          { label: 'Remaining',       value: php(totRemaining),     icon: CheckCircle2,  color: totRemaining < 0 ? 'text-red-600' : 'text-emerald-600', bg: totRemaining < 0 ? 'bg-red-50' : 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-[#e4ebf5] bg-white p-5 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      {myBudgets.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Wallet className="mx-auto mb-3 h-10 w-10 text-slate-200" />
            <p className="text-sm text-slate-500">No budgets assigned to {dept} yet.</p>
            <p className="text-xs text-slate-400 mt-1">Contact the Treasury department to request a budget allocation.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {myBudgets.map(b => {
            const budExp    = myExpenses.filter(e => e.budgetId === b.id)
            const used      = budExp.reduce((s, e) => s + e.amount, 0)
            const remaining = b.amount - used
            const pct       = (used / b.amount) * 100
            const h         = health(pct)

            return (
              <Card key={b.id} padding="none">
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{b.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{b.startDate} → {b.endDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border
                      ${h === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : h === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}">
                      {h === 'critical' && <><XCircle className="h-3.5 w-3.5" />Depleted</>}
                      {h === 'warning'  && <><AlertTriangle className="h-3.5 w-3.5" />Near Limit</>}
                      {h === 'safe'     && <><CheckCircle2 className="h-3.5 w-3.5" />On Track</>}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Budget usage</span>
                      <span className={`font-bold ${H_TEXT[h]}`}>{Math.min(pct,100).toFixed(1)}%</span>
                    </div>
                    <ProgressBar pct={pct} h={h} />
                    {h === 'warning'  && <p className="text-xs font-semibold text-amber-600">⚠ You are nearing your budget limit.</p>}
                    {h === 'critical' && <p className="text-xs font-semibold text-red-600">🔴 Budget fully consumed. No further expenses can be recorded.</p>}
                  </div>

                  {/* Totals grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Budget',    value: b.amount,   cls: 'text-slate-700' },
                      { label: 'Used',      value: used,        cls: `font-bold ${H_TEXT[h]}` },
                      { label: 'Remaining', value: remaining,   cls: remaining < 0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 py-3">
                        <p className={`text-sm font-bold tabular-nums ${s.cls}`}>{php(s.value)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Expense list */}
                  {budExp.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Expenses</p>
                      <Table>
                        <Thead>
                          <Th>Description</Th>
                          <Th>Amount</Th>
                          <Th>Date</Th>
                        </Thead>
                        <Tbody>
                          {[...budExp].sort((a,b) => b.date.localeCompare(a.date)).map(e => (
                            <Tr key={e.id}>
                              <Td><span className="text-sm text-slate-700">{e.description}</span></Td>
                              <Td><span className="font-mono text-sm font-semibold text-red-600">−{php(e.amount)}</span></Td>
                              <Td><span className="text-xs text-slate-400">{new Date(e.date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span></Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
