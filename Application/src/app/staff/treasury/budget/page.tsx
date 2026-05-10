'use client'
import { useState, useMemo } from 'react'
import {
  Plus, AlertTriangle, CheckCircle2, XCircle, ChevronRight,
  Wallet, TrendingDown, BarChart2, Building2, Calendar, Trash2, Edit2,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { MOCK_BUDGETS, MOCK_BUDGET_EXPENSES, BUDGET_DEPARTMENTS } from '@/lib/mock-data'
import type { Budget, BudgetExpense, BudgetPeriod } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function php(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function usedFor(budgetId: string) {
  return MOCK_BUDGET_EXPENSES
    .filter(e => e.budgetId === budgetId)
    .reduce((s, e) => s + e.amount, 0)
}

type BudgetHealth = 'safe' | 'warning' | 'critical'
function health(pct: number): BudgetHealth {
  if (pct >= 100) return 'critical'
  if (pct >= 80)  return 'warning'
  return 'safe'
}

const HEALTH_COLOR: Record<BudgetHealth, string> = {
  safe:     'bg-emerald-500',
  warning:  'bg-amber-400',
  critical: 'bg-red-500',
}
const HEALTH_TEXT: Record<BudgetHealth, string> = {
  safe:     'text-emerald-700',
  warning:  'text-amber-700',
  critical: 'text-red-700',
}
const HEALTH_BG: Record<BudgetHealth, string> = {
  safe:     'bg-emerald-50 border-emerald-200',
  warning:  'bg-amber-50 border-amber-200',
  critical: 'bg-red-50 border-red-200',
}

const PERIOD_LABEL: Record<BudgetPeriod, string> = {
  MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly',
}

let _nextBudId = 1; function genBudId() { return `bud_${Date.now()}_${_nextBudId++}` }
let _nextExpId = 1; function genExpId() { return `bex_${Date.now()}_${_nextExpId++}` }

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, h }: { pct: number; h: BudgetHealth }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${HEALTH_COLOR[h]}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

// ── Budget Form Modal ─────────────────────────────────────────────────────────
function BudgetModal({ initial, onSave, onClose }: {
  initial?: Budget
  onSave: (b: Budget) => void
  onClose: () => void
}) {
  const [name,       setName]       = useState(initial?.name ?? '')
  const [department, setDept]       = useState(initial?.department ?? BUDGET_DEPARTMENTS[0])
  const [amount,     setAmount]     = useState(initial?.amount?.toString() ?? '')
  const [period,     setPeriod]     = useState<BudgetPeriod>(initial?.periodType ?? 'QUARTERLY')
  const [startDate,  setStartDate]  = useState(initial?.startDate ?? '')
  const [endDate,    setEndDate]    = useState(initial?.endDate ?? '')
  const [err,        setErr]        = useState('')

  function save() {
    if (!name.trim())             { setErr('Budget name is required.'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0)   { setErr('Enter a valid budget amount.'); return }
    if (!startDate || !endDate)   { setErr('Start and end dates are required.'); return }
    if (endDate < startDate)      { setErr('End date must be after start date.'); return }
    onSave({
      id:         initial?.id ?? genBudId(),
      name:       name.trim(),
      department,
      amount:     amt,
      periodType: period,
      startDate,
      endDate,
      createdAt:  initial?.createdAt ?? new Date().toISOString(),
    })
  }

  const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400'
  const label = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <Modal open title={initial ? 'Edit Budget' : 'Create Budget'} onClose={onClose} size="md">
      <div className="space-y-4 p-1">
        <div>
          <label className={label}>Budget Name <span className="text-red-500">*</span></label>
          <input value={name} onChange={e => { setName(e.target.value); setErr('') }} placeholder="e.g. Q2 2025 — Nursing" className={field} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Department <span className="text-red-500">*</span></label>
            <select value={department} onChange={e => setDept(e.target.value)} className={field}>
              {BUDGET_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Budget Amount (₱) <span className="text-red-500">*</span></label>
            <input type="number" min={1} value={amount} onChange={e => { setAmount(e.target.value); setErr('') }} placeholder="e.g. 250000" className={field} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>Period Type</label>
            <select value={period} onChange={e => setPeriod(e.target.value as BudgetPeriod)} className={field}>
              {(['MONTHLY','QUARTERLY','YEARLY'] as BudgetPeriod[]).map(p => (
                <option key={p} value={p}>{PERIOD_LABEL[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Start Date <span className="text-red-500">*</span></label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>End Date <span className="text-red-500">*</span></label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={field} />
          </div>
        </div>
        {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 mt-4">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={save} className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
          {initial ? 'Save Changes' : 'Create Budget'}
        </button>
      </div>
    </Modal>
  )
}

// ── Expense Form Modal ────────────────────────────────────────────────────────
function ExpenseModal({ budgets, onSave, onClose }: {
  budgets: Budget[]
  onSave: (e: BudgetExpense) => void
  onClose: () => void
}) {
  const [budgetId, setBudgetId] = useState(budgets[0]?.id ?? '')
  const [desc,     setDesc]     = useState('')
  const [amount,   setAmount]   = useState('')
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10))
  const [err,      setErr]      = useState('')

  const selectedBudget = budgets.find(b => b.id === budgetId)
  const usedAmt        = budgetId ? usedFor(budgetId) : 0
  const remaining      = selectedBudget ? selectedBudget.amount - usedAmt : 0

  function save() {
    if (!budgetId)              { setErr('Select a budget.'); return }
    if (!desc.trim())           { setErr('Description is required.'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setErr('Enter a valid amount.'); return }
    if (amt > remaining)        { setErr(`Amount exceeds remaining balance (${php(remaining)}).`); return }
    if (!date)                  { setErr('Date is required.'); return }
    onSave({
      id:         genExpId(),
      budgetId,
      department: selectedBudget!.department,
      description: desc.trim(),
      amount:     amt,
      date,
      recordedBy: 'Clara Accounting',
    })
  }

  const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400'
  const label = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <Modal open title="Record Expense" onClose={onClose} size="md">
      <div className="space-y-4 p-1">
        <div>
          <label className={label}>Budget <span className="text-red-500">*</span></label>
          <select value={budgetId} onChange={e => { setBudgetId(e.target.value); setErr('') }} className={field}>
            <option value="">— Select budget —</option>
            {budgets.map(b => <option key={b.id} value={b.id}>{b.name} ({b.department})</option>)}
          </select>
          {selectedBudget && (
            <p className="mt-1 text-[11px] text-slate-400">
              Remaining: <span className={`font-semibold ${remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>{php(remaining)}</span>
            </p>
          )}
        </div>
        <div>
          <label className={label}>Description <span className="text-red-500">*</span></label>
          <input value={desc} onChange={e => { setDesc(e.target.value); setErr('') }} placeholder="e.g. Lab Equipment Purchase" className={field} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Amount (₱) <span className="text-red-500">*</span></label>
            <input type="number" min={1} value={amount} onChange={e => { setAmount(e.target.value); setErr('') }} placeholder="0.00" className={field} />
          </div>
          <div>
            <label className={label}>Date <span className="text-red-500">*</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={field} />
          </div>
        </div>
        {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 mt-4">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={save} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">Record Expense</button>
      </div>
    </Modal>
  )
}

// ── Budget Card ───────────────────────────────────────────────────────────────
function BudgetCard({ budget, expenses, onEdit, onDelete }: {
  budget: Budget
  expenses: BudgetExpense[]
  onEdit: () => void
  onDelete: () => void
}) {
  const used      = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining = budget.amount - used
  const pct       = (used / budget.amount) * 100
  const h         = health(pct)

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${HEALTH_BG[h]} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{budget.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 truncate">{budget.department}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {h === 'critical' && <XCircle className="h-4 w-4 text-red-500" />}
          {h === 'warning'  && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          {h === 'safe'     && <CheckCircle2  className="h-4 w-4 text-emerald-500" />}
          <button onClick={onEdit}   className="rounded p-1 hover:bg-white/70 transition-colors"><Edit2   className="h-3.5 w-3.5 text-slate-400" /></button>
          <button onClick={onDelete} className="rounded p-1 hover:bg-white/70 transition-colors"><Trash2  className="h-3.5 w-3.5 text-slate-400" /></button>
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Total',     value: budget.amount, cls: 'text-slate-700' },
          { label: 'Used',      value: used,           cls: `font-bold ${HEALTH_TEXT[h]}` },
          { label: 'Remaining', value: remaining,       cls: remaining < 0 ? 'text-red-600 font-bold' : 'text-slate-700' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white/60 px-2 py-2">
            <p className={`text-sm font-bold tabular-nums ${s.cls}`}>{php(s.value)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">{PERIOD_LABEL[budget.periodType]}</span>
          <span className={`font-bold ${HEALTH_TEXT[h]}`}>{Math.min(pct, 100).toFixed(1)}% used</span>
        </div>
        <ProgressBar pct={pct} h={h} />
        {h === 'warning'  && <p className="text-[11px] font-semibold text-amber-600">⚠ Approaching budget limit</p>}
        {h === 'critical' && <p className="text-[11px] font-semibold text-red-600">🔴 Budget fully consumed</p>}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1 text-[11px] text-slate-400">
        <Calendar className="h-3 w-3 shrink-0" />
        {budget.startDate} → {budget.endDate}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BudgetManagementPage() {
  const [budgets,  setBudgets]  = useState<Budget[]>([...MOCK_BUDGETS])
  const [expenses, setExpenses] = useState<BudgetExpense[]>([...MOCK_BUDGET_EXPENSES])

  const [tab,          setTab]          = useState<'overview' | 'budgets' | 'expenses'>('overview')
  const [budgetModal,  setBudgetModal]  = useState<Budget | null | 'new'>(null)
  const [expenseModal, setExpenseModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)
  const [deptFilter,   setDeptFilter]   = useState('All')

  // ── Derived stats ──
  const stats = useMemo(() => {
    const totalAllocated = budgets.reduce((s, b) => s + b.amount, 0)
    const totalUsed      = expenses.reduce((s, e) => s + e.amount, 0)
    const warnings       = budgets.filter(b => {
      const used = expenses.filter(e => e.budgetId === b.id).reduce((s, e) => s + e.amount, 0)
      return (used / b.amount) >= 0.8
    }).length
    return { totalAllocated, totalUsed, remaining: totalAllocated - totalUsed, warnings }
  }, [budgets, expenses])

  // ── Filtered lists ──
  const filteredBudgets  = useMemo(() =>
    deptFilter === 'All' ? budgets : budgets.filter(b => b.department === deptFilter),
    [budgets, deptFilter]
  )
  const filteredExpenses = useMemo(() =>
    deptFilter === 'All' ? expenses : expenses.filter(e => e.department === deptFilter),
    [expenses, deptFilter]
  )

  // ── CRUD ──
  function saveBudget(b: Budget) {
    const isNew = !budgets.find(x => x.id === b.id)
    const next  = isNew ? [...budgets, b] : budgets.map(x => x.id === b.id ? b : x)
    setBudgets(next)
    MOCK_BUDGETS.splice(0, MOCK_BUDGETS.length, ...next)
    setBudgetModal(null)
  }

  function deleteBudget() {
    if (!deleteTarget) return
    const next = budgets.filter(b => b.id !== deleteTarget.id)
    setBudgets(next)
    MOCK_BUDGETS.splice(0, MOCK_BUDGETS.length, ...next)
    setDeleteTarget(null)
  }

  function saveExpense(e: BudgetExpense) {
    const next = [...expenses, e]
    setExpenses(next)
    MOCK_BUDGET_EXPENSES.splice(0, MOCK_BUDGET_EXPENSES.length, ...next)
    setExpenseModal(false)
  }

  const DEPT_OPTIONS = ['All', ...BUDGET_DEPARTMENTS]

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle description="Allocate and monitor departmental budgets — independent of student billing and treasury flows.">
        Budget Management
      </SectionTitle>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {([
          ['overview',  'Overview',  BarChart2],
          ['budgets',   'Budgets',   Wallet],
          ['expenses',  'Expenses',  TrendingDown],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── Department filter (shared) ─────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {DEPT_OPTIONS.map(d => (
            <button key={d} onClick={() => setDeptFilter(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                deptFilter === d ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {d === 'All' ? 'All Departments' : d.replace('College of ', '')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {tab !== 'overview' && (
            <button onClick={() => tab === 'expenses' ? setExpenseModal(true) : setBudgetModal('new')}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              {tab === 'expenses' ? 'Record Expense' : 'Create Budget'}
            </button>
          )}
        </div>
      </div>

      {/* ══ OVERVIEW ════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Allocated', value: php(stats.totalAllocated), icon: Wallet,       color: 'text-brand-600',   bg: 'bg-brand-50' },
              { label: 'Total Used',      value: php(stats.totalUsed),      icon: TrendingDown,  color: 'text-red-600',     bg: 'bg-red-50' },
              { label: 'Total Remaining', value: php(stats.remaining),      icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Alerts',          value: String(stats.warnings),    icon: AlertTriangle,  color: 'text-amber-600',   bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-[#e4ebf5] bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Budget overview cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {filteredBudgets.map(b => (
              <BudgetCard
                key={b.id}
                budget={b}
                expenses={expenses.filter(e => e.budgetId === b.id)}
                onEdit={()   => setBudgetModal(b)}
                onDelete={() => setDeleteTarget(b)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ BUDGETS TAB ═════════════════════════════════════════════════════ */}
      {tab === 'budgets' && (
        <Card padding="none">
          <Table>
            <Thead>
              <Th>Budget Name</Th>
              <Th>Department</Th>
              <Th>Total</Th>
              <Th>Used</Th>
              <Th>Remaining</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th />
            </Thead>
            <Tbody>
              {filteredBudgets.length === 0 ? (
                <Tr><Td colSpan={8}><p className="py-8 text-center text-sm text-slate-400">No budgets found.</p></Td></Tr>
              ) : filteredBudgets.map(b => {
                const used      = expenses.filter(e => e.budgetId === b.id).reduce((s, e) => s + e.amount, 0)
                const remaining = b.amount - used
                const pct       = (used / b.amount) * 100
                const h         = health(pct)
                return (
                  <Tr key={b.id}>
                    <Td><span className="font-semibold text-slate-800">{b.name}</span></Td>
                    <Td><div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-300" />{b.department}</div></Td>
                    <Td><span className="font-mono text-sm text-slate-700">{php(b.amount)}</span></Td>
                    <Td><span className={`font-mono text-sm font-semibold ${HEALTH_TEXT[h]}`}>{php(used)}</span></Td>
                    <Td><span className={`font-mono text-sm ${remaining < 0 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{php(remaining)}</span></Td>
                    <Td>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {PERIOD_LABEL[b.periodType]}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1"><ProgressBar pct={pct} h={h} /></div>
                        <span className={`text-[11px] font-semibold w-10 text-right ${HEALTH_TEXT[h]}`}>{Math.min(pct,100).toFixed(0)}%</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setBudgetModal(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ══ EXPENSES TAB ════════════════════════════════════════════════════ */}
      {tab === 'expenses' && (
        <Card padding="none">
          <Table>
            <Thead>
              <Th>Description</Th>
              <Th>Department</Th>
              <Th>Budget</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Recorded By</Th>
            </Thead>
            <Tbody>
              {filteredExpenses.length === 0 ? (
                <Tr><Td colSpan={6}><p className="py-8 text-center text-sm text-slate-400">No expenses recorded.</p></Td></Tr>
              ) : [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date)).map(e => {
                const bud = budgets.find(b => b.id === e.budgetId)
                return (
                  <Tr key={e.id}>
                    <Td><span className="font-medium text-slate-800">{e.description}</span></Td>
                    <Td><div className="flex items-center gap-1.5 text-sm text-slate-600"><Building2 className="h-3.5 w-3.5 text-slate-300" />{e.department}</div></Td>
                    <Td><span className="text-xs text-slate-500">{bud?.name ?? '—'}</span></Td>
                    <Td><span className="font-mono text-sm font-semibold text-red-600">−{php(e.amount)}</span></Td>
                    <Td><span className="text-sm text-slate-500">{new Date(e.date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span></Td>
                    <Td><span className="text-xs text-slate-400">{e.recordedBy}</span></Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {budgetModal !== null && (
        <BudgetModal
          initial={budgetModal === 'new' ? undefined : budgetModal}
          onSave={saveBudget}
          onClose={() => setBudgetModal(null)}
        />
      )}
      {expenseModal && (
        <ExpenseModal
          budgets={budgets}
          onSave={saveExpense}
          onClose={() => setExpenseModal(false)}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-l-[3px] border-red-500 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">Delete "{deleteTarget.name}"?</p>
              <p className="mt-1 text-xs text-slate-500">All expenses linked to this budget will be unlinked. This does not affect any Treasury records.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={deleteBudget} className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
