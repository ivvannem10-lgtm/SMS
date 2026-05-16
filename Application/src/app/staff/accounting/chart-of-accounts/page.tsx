'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { MOCK_CHART_OF_ACCOUNTS } from '@/lib/mock-data'
import type { ChartOfAccount, AccountType } from '@/types'
import { Plus, Edit2, Layers, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

type FilterType = 'ALL' | AccountType

const TYPE_CONFIG: Record<AccountType, { label: string; bg: string; text: string; border: string }> = {
  ASSET:     { label: 'Asset',     bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  LIABILITY: { label: 'Liability', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  EQUITY:    { label: 'Equity',    bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  REVENUE:   { label: 'Revenue',   bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200' },
  EXPENSE:   { label: 'Expense',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
}

const ACCOUNT_TYPES: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']

const EMPTY_FORM = { code: '', name: '', type: 'ASSET' as AccountType, parentCode: '', description: '', isActive: true }

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(MOCK_CHART_OF_ACCOUNTS)
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ChartOfAccount | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const stats = useMemo(() => {
    const totalAccts = accounts.length
    const totalAssets = accounts.filter(a => a.type === 'ASSET' && !a.parentCode).reduce((s, a) => {
      // sum sub-accounts
      return s + accounts.filter(x => x.parentCode === a.code && x.type === 'ASSET').reduce((ss, x) => ss + x.balance, 0)
    }, 0) + accounts.filter(a => a.type === 'ASSET' && a.parentCode).reduce((s, a) => s + a.balance, 0)
    const totalRevenue = accounts.filter(a => a.type === 'REVENUE' && a.parentCode).reduce((s, a) => s + a.balance, 0)
    const totalExpenses = accounts.filter(a => a.type === 'EXPENSE' && a.parentCode).reduce((s, a) => s + a.balance, 0)
    return { totalAccts, totalAssets, totalRevenue, totalExpenses }
  }, [accounts])

  const filtered = useMemo(() => {
    let list = accounts
    if (filter !== 'ALL') list = list.filter(a => a.type === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q))
    }
    return list
  }, [accounts, filter, search])

  // Group by type
  const grouped = useMemo(() => {
    const groups: Partial<Record<AccountType, ChartOfAccount[]>> = {}
    for (const type of ACCOUNT_TYPES) {
      const items = filtered.filter(a => a.type === type)
      if (items.length > 0) groups[type] = items
    }
    return groups
  }, [filtered])

  function openAdd() {
    setForm(EMPTY_FORM)
    setAddOpen(true)
  }

  function openEdit(acct: ChartOfAccount) {
    setForm({ code: acct.code, name: acct.name, type: acct.type, parentCode: acct.parentCode ?? '', description: acct.description ?? '', isActive: acct.isActive })
    setEditTarget(acct)
  }

  function saveAdd() {
    const newAcct: ChartOfAccount = {
      id: `coa_${form.code}`,
      code: form.code, name: form.name, type: form.type,
      parentCode: form.parentCode || undefined,
      description: form.description || undefined,
      isActive: form.isActive, balance: 0,
      schoolId: 'school_1', createdAt: new Date().toISOString(),
    }
    setAccounts(prev => [...prev, newAcct])
    setAddOpen(false)
  }

  function saveEdit() {
    if (!editTarget) return
    setAccounts(prev => prev.map(a => a.id === editTarget.id
      ? { ...a, code: form.code, name: form.name, type: form.type, parentCode: form.parentCode || undefined, description: form.description || undefined, isActive: form.isActive }
      : a
    ))
    setEditTarget(null)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        description="Manage your institution's chart of accounts."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add Account</Button>}
      >
        Chart of Accounts
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Accounts"  value={stats.totalAccts}                      icon={Layers}      color="bg-brand-50 text-brand-600" />
        <StatCard label="Total Assets"    value={formatCurrency(stats.totalAssets)}     icon={DollarSign}  color="bg-blue-50 text-blue-600" />
        <StatCard label="Total Revenue"   value={formatCurrency(stats.totalRevenue)}    icon={TrendingUp}  color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Expenses"  value={formatCurrency(stats.totalExpenses)}   icon={TrendingDown}color="bg-amber-50 text-amber-600" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {(['ALL', ...ACCOUNT_TYPES] as FilterType[]).map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === t
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All Types' : TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <Input
              placeholder="Search code or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-56 h-8 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Grouped Table */}
      <div className="space-y-4">
        {(Object.keys(grouped) as AccountType[]).map(type => {
          const cfg = TYPE_CONFIG[type]
          const items = grouped[type] ?? []
          return (
            <Card padding="none" key={type}>
              {/* Group header */}
              <div className={`flex items-center gap-3 px-5 py-3 border-b border-[#e4ebf5] ${cfg.bg}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${cfg.text}`}>
                  {cfg.label} Accounts
                </span>
                <span className={`ml-auto text-xs font-medium ${cfg.text}`}>{items.length} accounts</span>
              </div>
              <Table>
                <Thead>
                  <Th>Code</Th>
                  <Th>Account Name</Th>
                  <Th>Balance</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </Thead>
                <Tbody>
                  {items.map(acct => {
                    const isParent = !acct.parentCode
                    return (
                      <Tr key={acct.id}>
                        <Td>
                          <span className="font-mono text-xs font-bold text-brand-600">{acct.code}</span>
                        </Td>
                        <Td>
                          <span className={`${isParent ? 'font-bold text-slate-800' : 'pl-4 text-slate-600'} text-sm`}>
                            {acct.name}
                          </span>
                          {acct.description && (
                            <p className="text-xs text-slate-400 mt-0.5 pl-4">{acct.description}</p>
                          )}
                        </Td>
                        <Td className="text-right">
                          {!isParent && (
                            <span className={`font-semibold text-sm tabular-nums ${acct.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                              {formatCurrency(acct.balance)}
                            </span>
                          )}
                        </Td>
                        <Td>
                          <Badge className={acct.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}>
                            {acct.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          <button
                            onClick={() => openEdit(acct)}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Card>
          )
        })}
      </div>

      {/* Add Account Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Account"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={saveAdd} disabled={!form.code || !form.name}>Save Account</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. 1001" />
            <Select label="Account Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
            </Select>
          </div>
          <Input label="Account Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cash on Hand" />
          <Select label="Parent Account (optional)" value={form.parentCode} onChange={e => setForm(f => ({ ...f, parentCode: e.target.value }))}>
            <option value="">— No parent (top-level) —</option>
            {accounts.filter(a => !a.parentCode).map(a => (
              <option key={a.id} value={a.code}>{a.code} — {a.name}</option>
            ))}
          </Select>
          <Textarea label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
        </div>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Account"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={!form.code || !form.name}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            <Select label="Account Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
            </Select>
          </div>
          <Input label="Account Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Select label="Parent Account (optional)" value={form.parentCode} onChange={e => setForm(f => ({ ...f, parentCode: e.target.value }))}>
            <option value="">— No parent (top-level) —</option>
            {accounts.filter(a => !a.parentCode && a.id !== editTarget?.id).map(a => (
              <option key={a.id} value={a.code}>{a.code} — {a.name}</option>
            ))}
          </Select>
          <Textarea label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-[#e4ebf5]">
            <span className="text-xs font-semibold text-slate-600">Status</span>
            <button
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs font-medium ${form.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
              {form.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
