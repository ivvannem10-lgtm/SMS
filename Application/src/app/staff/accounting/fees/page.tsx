'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, DollarSign, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { MOCK_FEE_STRUCTURES, nextFeeId } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import type { FeeStructure, FeeCategory, FeeApplicability } from '@/types'

const CATEGORIES: { value: FeeCategory; label: string; color: string }[] = [
  { value: 'TUITION', label: 'Tuition',       color: 'bg-brand-100 text-brand-700' },
  { value: 'MISC',    label: 'Miscellaneous', color: 'bg-violet-100 text-violet-700' },
  { value: 'LAB',     label: 'Laboratory',    color: 'bg-amber-100 text-amber-700' },
  { value: 'REG',     label: 'Registration',  color: 'bg-emerald-100 text-emerald-700' },
  { value: 'OTHER',   label: 'Other',         color: 'bg-slate-100 text-slate-600' },
]

const APPLICABILITY: { value: FeeApplicability; label: string }[] = [
  { value: 'ALL_STUDENTS',      label: 'All Students' },
  { value: 'PER_UNIT',          label: 'Per Unit (Tuition)' },
  { value: 'NEW_STUDENTS_ONLY', label: 'New Students Only' },
  { value: 'OPTIONAL',          label: 'Optional / Special' },
]

function catBadge(cat: FeeCategory) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[4]
}

function formatApplicability(a: FeeApplicability) {
  return APPLICABILITY.find(x => x.value === a)?.label ?? a
}

const BLANK = (): Omit<FeeStructure, 'id' | 'createdAt' | 'schoolId'> => ({
  name: '', category: 'MISC', amount: 0, description: '', applicability: 'ALL_STUDENTS', isActive: true,
})

export default function FeeManagementPage() {
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const [addOpen, setAddOpen]     = useState(false)
  const [editFee, setEditFee]     = useState<FeeStructure | null>(null)
  const [delFee, setDelFee]       = useState<FeeStructure | null>(null)
  const [form, setForm]           = useState(BLANK())
  const [saving, setSaving]       = useState(false)
  const [filterCat, setFilterCat] = useState<FeeCategory | 'ALL'>('ALL')

  const fees = MOCK_FEE_STRUCTURES.filter(f => filterCat === 'ALL' || f.category === filterCat)

  const activeFees   = MOCK_FEE_STRUCTURES.filter(f => f.isActive)
  const totalFixed   = activeFees.filter(f => f.applicability !== 'PER_UNIT').reduce((s, f) => s + f.amount, 0)
  const perUnitRate  = activeFees.find(f => f.applicability === 'PER_UNIT')?.amount ?? 0
  const byCategory   = CATEGORIES.map(c => ({ ...c, count: MOCK_FEE_STRUCTURES.filter(f => f.category === c.value).length }))

  function openAdd() { setForm(BLANK()); setAddOpen(true) }
  function openEdit(fee: FeeStructure) { setForm({ name: fee.name, category: fee.category, amount: fee.amount, description: fee.description ?? '', applicability: fee.applicability, isActive: fee.isActive }); setEditFee(fee) }

  function handleSaveAdd() {
    if (!form.name.trim() || form.amount <= 0) return
    setSaving(true)
    setTimeout(() => {
      MOCK_FEE_STRUCTURES.push({
        id: nextFeeId(), name: form.name.trim(), category: form.category,
        amount: form.amount, description: form.description, applicability: form.applicability,
        isActive: form.isActive, schoolId: 'school_1',
        createdBy: 'Clara Accounting', createdAt: new Date().toISOString(),
      })
      setSaving(false); setAddOpen(false); refresh()
    }, 400)
  }

  function handleSaveEdit() {
    if (!editFee || !form.name.trim() || form.amount <= 0) return
    setSaving(true)
    setTimeout(() => {
      const idx = MOCK_FEE_STRUCTURES.findIndex(f => f.id === editFee.id)
      if (idx >= 0) Object.assign(MOCK_FEE_STRUCTURES[idx], { ...form, updatedAt: new Date().toISOString() })
      setSaving(false); setEditFee(null); refresh()
    }, 400)
  }

  function handleDelete() {
    if (!delFee) return
    const idx = MOCK_FEE_STRUCTURES.findIndex(f => f.id === delFee.id)
    if (idx >= 0) MOCK_FEE_STRUCTURES.splice(idx, 1)
    setDelFee(null); refresh()
  }

  function toggleActive(fee: FeeStructure) {
    fee.isActive = !fee.isActive
    fee.updatedAt = new Date().toISOString()
    refresh()
  }

  const FeeForm = () => (
    <div className="space-y-4">
      <div className="rounded-xl bg-brand-50 border border-brand-200 px-3 py-2.5 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-brand-500 mt-0.5 shrink-0" />
        <p className="text-xs text-brand-700">Active fees are visible to Treasury when adding charges to student SOAs.</p>
      </div>
      <Input label="Fee Name *" placeholder="e.g. Library Development Fee" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category *" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as FeeCategory }))}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
        <Input label="Amount (₱) *" type="number" min="0" placeholder="0.00" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} />
      </div>
      <Select label="Applicability *" value={form.applicability} onChange={e => setForm(f => ({ ...f, applicability: e.target.value as FeeApplicability }))}>
        {APPLICABILITY.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </Select>
      {form.applicability === 'PER_UNIT' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Treasury staff will multiply this rate by the number of enrolled units per student.
        </div>
      )}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Explain what this fee covers…" rows={2}
          className="w-full rounded-xl border border-[#dce8f7] px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none" />
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className={`w-9 h-5 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'} relative`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm text-slate-700">{form.isActive ? 'Active — visible to Treasury' : 'Inactive — hidden from Treasury'}</span>
      </label>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionTitle
        description="Define tuition and fee structures. Active fees are synced to Treasury for student SOA generation."
        actions={<Button onClick={openAdd} icon={<Plus className="h-4 w-4" />}>Add Fee</Button>}
      >
        Fee Management
      </SectionTitle>

      {/* Sync notice */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Synced with Treasury</p>
          <p className="text-xs text-emerald-700 mt-0.5">All active fees appear in the Treasury's "Add Charge" modal under <strong>Standard Fees</strong>. Treasury staff can apply them directly to student SOAs.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-slate-500">Active Fees</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{activeFees.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">{MOCK_FEE_STRUCTURES.length} total defined</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Fixed Fees Total</p>
          <p className="text-2xl font-bold text-brand-700 mt-1">{formatCurrency(totalFixed)}</p>
          <p className="text-xs text-slate-400 mt-0.5">per student (excl. tuition)</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Tuition Rate</p>
          <p className="text-2xl font-bold text-brand-700 mt-1">{formatCurrency(perUnitRate)}</p>
          <p className="text-xs text-slate-400 mt-0.5">per unit</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Categories</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {byCategory.filter(c => c.count > 0).map(c => (
              <span key={c.value} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.color}`}>{c.label} ({c.count})</span>
            ))}
          </div>
        </Card>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', ...CATEGORIES.map(c => c.value)] as (FeeCategory | 'ALL')[]).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterCat === cat ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {cat === 'ALL' ? 'All' : CATEGORIES.find(c => c.value === cat)?.label}
          </button>
        ))}
      </div>

      {/* Fee table */}
      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="bg-[#f0f4fa] border-b border-[#dce8f7]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase tracking-widest">Fee Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase tracking-widest">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-brand-700 uppercase tracking-widest">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-700 uppercase tracking-widest">Applicability</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-brand-700 uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-brand-700 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fees.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No fees found.</td></tr>
            )}
            {fees.map(fee => {
              const cat = catBadge(fee.category)
              return (
                <tr key={fee.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{fee.name}</p>
                    {fee.description && <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{fee.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                    {formatCurrency(fee.amount)}
                    {fee.applicability === 'PER_UNIT' && <span className="text-xs text-slate-400 font-sans">/unit</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatApplicability(fee.applicability)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(fee)} title={fee.isActive ? 'Deactivate' : 'Activate'}>
                      {fee.isActive
                        ? <ToggleRight className="h-5 w-5 text-emerald-500 mx-auto" />
                        : <ToggleLeft  className="h-5 w-5 text-slate-300 mx-auto" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(fee)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDelFee(fee)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {fees.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {fees.filter(f => f.isActive).length} active · {fees.filter(f => !f.isActive).length} inactive
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <DollarSign className="h-3.5 w-3.5" />
              Active fixed total: <span className="font-semibold text-slate-700 ml-1">{formatCurrency(fees.filter(f => f.isActive && f.applicability !== 'PER_UNIT').reduce((s, f) => s + f.amount, 0))}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Fee" description="Define a new fee item for student SOAs"
        footer={<>
          <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAdd} loading={saving} disabled={!form.name.trim() || form.amount <= 0} icon={<Plus className="h-4 w-4" />}>Add Fee</Button>
        </>}
      >
        <FeeForm />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editFee} onClose={() => setEditFee(null)} title="Edit Fee" description={editFee?.name}
        footer={<>
          <Button variant="outline" onClick={() => setEditFee(null)}>Cancel</Button>
          <Button onClick={handleSaveEdit} loading={saving} disabled={!form.name.trim() || form.amount <= 0}>Save Changes</Button>
        </>}
      >
        <FeeForm />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delFee} onClose={() => setDelFee(null)} title="Delete Fee" description={delFee?.name} size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setDelFee(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="h-4 w-4" />}>Delete Fee</Button>
        </>}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-slate-700">Are you sure you want to delete <strong>{delFee?.name}</strong>?</p>
            <p className="text-xs text-slate-500 mt-1">This will remove it from the fee structure. Existing SOA charges already added will not be affected.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
