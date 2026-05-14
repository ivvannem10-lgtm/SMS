'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { MOCK_VENDORS, MOCK_AUDIT_LOGS } from '@/lib/mock-data'
import type { Vendor, VendorCategory, VendorStatus } from '@/types'
import { Plus, Search, Store, Phone, Mail, MapPin, Edit2 } from 'lucide-react'

const VENDOR_STATUS_MAP: Record<VendorStatus, { label: string; cls: string }> = {
  ACTIVE:      { label: 'Active',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  INACTIVE:    { label: 'Inactive',    cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  BLACKLISTED: { label: 'Blacklisted', cls: 'bg-red-50 text-red-700 ring-red-200' },
}

const VENDOR_CATEGORY_MAP: Record<VendorCategory, { label: string; cls: string }> = {
  SUPPLIES:     { label: 'Supplies',     cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  EQUIPMENT:    { label: 'Equipment',    cls: 'bg-brand-50 text-brand-600 ring-brand-200' },
  SERVICES:     { label: 'Services',     cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  CONSTRUCTION: { label: 'Construction', cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  IT:           { label: 'IT',           cls: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  FOOD:         { label: 'Food',         cls: 'bg-green-50 text-green-700 ring-green-200' },
  MEDICAL:      { label: 'Medical',      cls: 'bg-red-50 text-red-700 ring-red-200' },
  OTHER:        { label: 'Other',        cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

const CATEGORIES: VendorCategory[] = ['SUPPLIES','EQUIPMENT','SERVICES','CONSTRUCTION','IT','FOOD','MEDICAL','OTHER']

const EMPTY_FORM = {
  name: '', contactPerson: '', phone: '', email: '', address: '',
  category: 'SUPPLIES' as VendorCategory, tin: '', notes: '',
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS)
  const [search, setSearch]   = useState('')
  const [catFilter, setCat]   = useState('ALL')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEdit] = useState<Vendor | null>(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)

  const filtered = useMemo(() => {
    return vendors.filter(v => {
      const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.contactPerson ?? '').toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'ALL' || v.category === catFilter
      return matchSearch && matchCat
    })
  }, [vendors, search, catFilter])

  function openAdd() {
    setForm(EMPTY_FORM)
    setEdit(null)
    setAddOpen(true)
  }

  function openEdit(v: Vendor) {
    setForm({
      name: v.name, contactPerson: v.contactPerson ?? '', phone: v.phone ?? '',
      email: v.email ?? '', address: v.address ?? '', category: v.category,
      tin: v.tin ?? '', notes: v.notes ?? '',
    })
    setEdit(v)
    setAddOpen(true)
  }

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      if (editTarget) {
        const idx = MOCK_VENDORS.findIndex(v => v.id === editTarget.id)
        if (idx >= 0) {
          MOCK_VENDORS[idx] = {
            ...MOCK_VENDORS[idx],
            name: form.name, contactPerson: form.contactPerson || undefined,
            phone: form.phone || undefined, email: form.email || undefined,
            address: form.address || undefined, category: form.category,
            tin: form.tin || undefined, notes: form.notes || undefined,
          }
        }
        MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'EDIT_VENDOR', entity:'Vendor', entityId:editTarget.id, details:`Edited vendor: ${form.name}`, userId:'u_purchasing', schoolId:'school_1', createdAt:new Date().toISOString() })
      } else {
        const newVendor: Vendor = {
          id: `v_${Date.now()}`, name: form.name,
          contactPerson: form.contactPerson || undefined, phone: form.phone || undefined,
          email: form.email || undefined, address: form.address || undefined,
          category: form.category, status: 'ACTIVE',
          tin: form.tin || undefined, notes: form.notes || undefined,
          schoolId: 'school_1', createdAt: new Date().toISOString(),
        }
        MOCK_VENDORS.push(newVendor)
        MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'ADD_VENDOR', entity:'Vendor', entityId:newVendor.id, details:`Added vendor: ${form.name}`, userId:'u_purchasing', schoolId:'school_1', createdAt:new Date().toISOString() })
      }
      setVendors([...MOCK_VENDORS])
      setForm(EMPTY_FORM)
      setSaving(false)
      setAddOpen(false)
      setEdit(null)
    }, 500)
  }

  function handleToggleStatus(v: Vendor) {
    const idx = MOCK_VENDORS.findIndex(x => x.id === v.id)
    if (idx < 0) return
    const newStatus: VendorStatus = v.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    MOCK_VENDORS[idx] = { ...MOCK_VENDORS[idx], status: newStatus }
    setVendors([...MOCK_VENDORS])
  }

  return (
    <div className="space-y-6">
      <SectionTitle description="Manage approved vendors and suppliers."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5"/>} onClick={openAdd}>Add Vendor</Button>}
      >Vendor Registry</SectionTitle>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors..."
              className="w-full pl-9 pr-3 h-8 text-sm border border-[#dce8f7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
          </div>
          <select value={catFilter} onChange={e=>setCat(e.target.value)}
            className="h-8 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{VENDOR_CATEGORY_MAP[c].label}</option>)}
          </select>
        </div>
      </Card>

      {/* Vendor Cards Grid */}
      {filtered.length === 0 ? (
        <Card className="text-center py-10 text-slate-400">No vendors found.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => {
            const s = VENDOR_STATUS_MAP[v.status]
            const c = VENDOR_CATEGORY_MAP[v.category]
            return (
              <Card key={v.id} className="flex flex-col gap-3 hover:border-brand-200 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                      <Store className="h-4 w-4"/>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{v.name}</p>
                      {v.tin && <p className="text-2xs text-slate-400 font-mono">TIN: {v.tin}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge className={s.cls}>{s.label}</Badge>
                    <Badge className={c.cls}>{c.label}</Badge>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {v.contactPerson && (
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs">Contact:</span> {v.contactPerson}
                    </p>
                  )}
                  {v.phone && (
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0"/>
                      {v.phone}
                    </p>
                  )}
                  {v.email && (
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0"/>
                      <span className="truncate">{v.email}</span>
                    </p>
                  )}
                  {v.address && (
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0"/>
                      {v.address}
                    </p>
                  )}
                </div>

                <p className="text-2xs text-slate-400">Added: {formatDate(v.createdAt)}</p>

                <div className="flex gap-2 mt-auto pt-2 border-t border-[#f0f4fa]">
                  <Button size="xs" variant="soft" icon={<Edit2 className="h-3 w-3"/>} onClick={() => openEdit(v)}>Edit</Button>
                  <Button size="xs" variant={v.status === 'ACTIVE' ? 'outline' : 'success'}
                    onClick={() => handleToggleStatus(v)}>
                    {v.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Vendor Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={editTarget ? 'Edit Vendor' : 'Add Vendor'} size="lg"
        footer={<>
          <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} disabled={!form.name} onClick={handleSave}>
            {editTarget ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor Name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value as VendorCategory}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {CATEGORIES.map(c=><option key={c} value={c}>{VENDOR_CATEGORY_MAP[c].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">TIN Number</label>
              <input value={form.tin} onChange={e=>setForm(f=>({...f,tin:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Person</label>
              <input value={form.contactPerson} onChange={e=>setForm(f=>({...f,contactPerson:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
              <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
                className="w-full text-sm border border-[#dce8f7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"/>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
