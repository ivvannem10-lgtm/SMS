'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MOCK_FIN_EXPENSES, MOCK_AUDIT_LOGS } from '@/lib/mock-data'
import type { FinancialExpense, ExpenseCategory, ExpenseStatus } from '@/types'
import { Plus, Search, DollarSign, Clock, CheckCircle2, Filter } from 'lucide-react'

const EXPENSE_STATUS_MAP: Record<ExpenseStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED: { label: 'Approved', cls: 'bg-brand-50 text-brand-600 ring-brand-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-red-200' },
  PAID:     { label: 'Paid',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

const CATEGORIES: ExpenseCategory[] = ['OPERATIONAL','PROCUREMENT','PAYROLL','MAINTENANCE','UTILITIES','EQUIPMENT','OTHER']
const DEPARTMENTS = ['All Departments','College of Computing','College of Nursing','College of Business','Arts & Sciences','Administration']

const EMPTY_FORM = { title:'', category:'OPERATIONAL' as ExpenseCategory, department:'', amount:'', vendor:'', date:'', description:'' }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<FinancialExpense[]>(MOCK_FIN_EXPENSES)
  const [search, setSearch]     = useState('')
  const [catFilter, setCat]     = useState('ALL')
  const [statusFilter, setStatus] = useState('ALL')
  const [deptFilter, setDept]   = useState('All Departments')
  const [addOpen, setAddOpen]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase())
      const matchCat    = catFilter === 'ALL' || e.category === catFilter
      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter
      const matchDept   = deptFilter === 'All Departments' || e.department === deptFilter
      return matchSearch && matchCat && matchStatus && matchDept
    }).sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  }, [expenses, search, catFilter, statusFilter, deptFilter])

  const totalExpenses = expenses.reduce((s,e) => s + e.amount, 0)
  const pendingCount  = expenses.filter(e => e.status === 'PENDING').length
  const paidTotal     = expenses.filter(e => e.status === 'PAID').reduce((s,e) => s + e.amount, 0)

  function handleAdd() {
    setSaving(true)
    setTimeout(() => {
      const newExp: FinancialExpense = {
        id: `fe_${Date.now()}`, title: form.title, category: form.category,
        department: form.department || undefined, amount: parseFloat(form.amount) || 0,
        vendor: form.vendor || undefined, date: form.date,
        description: form.description || undefined, status: 'PENDING',
        schoolId: 'school_1', createdAt: new Date().toISOString(), createdBy: 'Clara Accounting',
      }
      MOCK_FIN_EXPENSES.push(newExp)
      setExpenses([...MOCK_FIN_EXPENSES])
      MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'RECORD_EXPENSE', entity:'FinancialExpense', entityId:newExp.id, details:`Recorded expense: ${form.title} ₱${form.amount}`, userId:'u_accounting', schoolId:'school_1', createdAt:new Date().toISOString() })
      setForm(EMPTY_FORM)
      setSaving(false)
      setAddOpen(false)
    }, 500)
  }

  function handleApprove(id: string) {
    const idx = MOCK_FIN_EXPENSES.findIndex(e => e.id === id)
    if (idx >= 0) {
      MOCK_FIN_EXPENSES[idx] = { ...MOCK_FIN_EXPENSES[idx], status: 'APPROVED', approvedBy: 'Clara Accounting', approvedAt: new Date().toISOString() }
      setExpenses([...MOCK_FIN_EXPENSES])
    }
  }

  function handleReject(id: string) {
    const idx = MOCK_FIN_EXPENSES.findIndex(e => e.id === id)
    if (idx >= 0) {
      MOCK_FIN_EXPENSES[idx] = { ...MOCK_FIN_EXPENSES[idx], status: 'REJECTED' }
      setExpenses([...MOCK_FIN_EXPENSES])
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle description="Track, approve, and manage all financial expenses."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5"/>} onClick={() => setAddOpen(true)}>Record Expense</Button>}
      >Expense Management</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Expenses"   value={formatCurrency(totalExpenses)} icon={DollarSign} color="bg-brand-50 text-brand-500"/>
        <StatCard label="Pending Approval" value={pendingCount}                  icon={Clock}       color="bg-amber-50 text-amber-600"/>
        <StatCard label="Total Paid"       value={formatCurrency(paidTotal)}     icon={CheckCircle2} color="bg-emerald-50 text-emerald-600"/>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expenses..."
              className="w-full pl-9 pr-3 h-8 text-sm border border-[#dce8f7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
          </div>
          <select value={catFilter} onChange={e=>setCat(e.target.value)}
            className="h-8 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatus(e.target.value)}
            className="h-8 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PAID">Paid</option>
          </select>
          <select value={deptFilter} onChange={e=>setDept(e.target.value)}
            className="h-8 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <Th>Title</Th>
            <Th>Category</Th>
            <Th>Department</Th>
            <Th>Amount</Th>
            <Th>Vendor</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {filtered.length === 0 && (
              <Tr><Td colSpan={8} className="text-center py-10 text-slate-400">No expenses found.</Td></Tr>
            )}
            {filtered.map(e => {
              const s = EXPENSE_STATUS_MAP[e.status]
              return (
                <Tr key={e.id}>
                  <Td>
                    <p className="font-medium text-slate-800 max-w-[180px] truncate">{e.title}</p>
                    {e.description && <p className="text-xs text-slate-400 truncate max-w-[180px]">{e.description}</p>}
                  </Td>
                  <Td><span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{e.category}</span></Td>
                  <Td className="text-slate-500">{e.department ? e.department.replace('College of ','') : '—'}</Td>
                  <Td><span className="font-semibold text-slate-800">{formatCurrency(e.amount)}</span></Td>
                  <Td className="text-slate-500">{e.vendor || '—'}</Td>
                  <Td className="text-slate-500">{formatDate(e.date)}</Td>
                  <Td><Badge className={s.cls}>{s.label}</Badge></Td>
                  <Td>
                    {e.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button size="xs" variant="success" onClick={() => handleApprove(e.id)}>Approve</Button>
                        <Button size="xs" variant="danger"  onClick={() => handleReject(e.id)}>Reject</Button>
                      </div>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Card>

      {/* Add Expense Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Expense" size="lg"
        footer={<>
          <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} disabled={!form.title || !form.amount || !form.date} onClick={handleAdd}>Save Expense</Button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value as ExpenseCategory}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <option value="">— Select —</option>
                {DEPARTMENTS.filter(d=>d!=='All Departments').map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (PHP) *</label>
              <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} min="0"
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor</label>
            <input value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))}
              className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
              className="w-full text-sm border border-[#dce8f7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"/>
          </div>
        </div>
      </Modal>
    </div>
  )
}
