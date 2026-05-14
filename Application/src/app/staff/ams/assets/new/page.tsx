'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Camera, Plus, Trash2, Save, Package,
  MapPin, DollarSign, Calendar, Tag, User, Building2,
} from 'lucide-react'
import { MOCK_ASSETS, MOCK_ASSET_TAG_FORMATS } from '@/lib/mock-data'
import { cn, formatCurrency } from '@/lib/utils'
import type { AssetCategory, AssetStatus, Asset, AssetInclusion } from '@/types'

const CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'PROJECTOR', label: 'Projector' },
  { value: 'ROUTER', label: 'Router' },
  { value: 'LAB_EQUIPMENT', label: 'Lab Equipment' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'SERVER', label: 'Server' },
  { value: 'OTHER_FIXED', label: 'Other Fixed Asset' },
]

const DEPARTMENTS = [
  'College of Computing', 'College of Business', 'College of Nursing',
  'Arts & Sciences', 'Office of the Registrar', 'IT Services',
  'Student Services', 'Human Resources', 'Finance', 'Asset Management', "Dean's Office",
]

const CAT_ABBR: Record<AssetCategory, string> = {
  LAPTOP: 'LAPTOP', DESKTOP: 'DESK', MONITOR: 'MON', PRINTER: 'PRINT',
  PROJECTOR: 'PROJ', ROUTER: 'ROUT', LAB_EQUIPMENT: 'LAB',
  TABLET: 'TAB', SERVER: 'SRV', OTHER_FIXED: 'ASSET',
}

function generateTag(category: AssetCategory): string {
  const fmt = MOCK_ASSET_TAG_FORMATS.find((f) => f.isDefault)
  const year = new Date().getFullYear()
  const seq = String(MOCK_ASSETS.length + 1).padStart(4, '0')
  if (fmt) {
    return `IT-${CAT_ABBR[category]}-${year}-${seq}`
  }
  return `IT-${CAT_ABBR[category]}-${year}-${seq}`
}

export default function RegisterAssetPage() {
  const router = useRouter()
  const photoRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [inclusions, setInclusions] = useState<AssetInclusion[]>([])
  const [newInclusion, setNewInclusion] = useState({ name: '', quantity: 1 })
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', category: 'LAPTOP' as AssetCategory,
    brand: '', model: '', serialNumber: '', description: '',
    status: 'AVAILABLE' as AssetStatus,
    department: '', custodianType: 'DEPARTMENT' as 'INDIVIDUAL' | 'DEPARTMENT',
    custodianName: '',
    purchaseDate: '', supplier: '', purchaseCost: '',
    warrantyExpiry: '', campus: 'Main Campus',
    building: '', room: '', storageArea: '',
  })

  const assetTag = form.category ? generateTag(form.category) : '—'

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function addInclusion() {
    if (!newInclusion.name.trim()) return
    setInclusions((p) => [...p, { id: `inc_new_${Date.now()}`, name: newInclusion.name.trim(), quantity: newInclusion.quantity }])
    setNewInclusion({ name: '', quantity: 1 })
  }

  function removeInclusion(id: string) {
    setInclusions((p) => p.filter((i) => i.id !== id))
  }

  function handleSave() {
    if (!form.name.trim() || !form.department) return
    setSaving(true)
    const asset: Asset = {
      id: `ast_${Date.now()}`,
      assetTag,
      name: form.name.trim(),
      category: form.category,
      brand: form.brand || undefined,
      model: form.model || undefined,
      serialNumber: form.serialNumber || undefined,
      description: form.description || undefined,
      status: form.status,
      department: form.department,
      custodianType: form.custodianType,
      custodianName: form.custodianName || undefined,
      purchaseDate: form.purchaseDate || undefined,
      supplier: form.supplier || undefined,
      purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
      warrantyExpiry: form.warrantyExpiry || undefined,
      campus: form.campus || undefined,
      building: form.building || undefined,
      room: form.room || undefined,
      storageArea: form.storageArea || undefined,
      photo: photoPreview ?? undefined,
      inclusions: inclusions.length ? inclusions : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    MOCK_ASSETS.push(asset)
    setTimeout(() => router.push('/staff/ams/assets'), 600)
  }

  const steps = ['Basic Info', 'Ownership', 'Purchase', 'Location & Inclusions']
  const canNext1 = form.name.trim() && form.category
  const canNext2 = form.department
  const canSave = canNext1 && canNext2

  function InputField({ label, field, type = 'text', placeholder = '', required = false }: {
    label: string; field: string; type?: string; placeholder?: string; required?: boolean
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type={type}
          value={(form as Record<string, string>)[field]}
          onChange={(e) => set(field, e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#dce8f7] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/60 transition-all"
        />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/staff/ams/assets" className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Assets
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800">Register New Asset</span>
      </div>

      {/* Asset Tag Preview */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Auto-Generated Asset Tag</p>
        <p className="text-2xl font-black font-mono tracking-wider">{assetTag}</p>
        <p className="text-xs opacity-60 mt-1">Category: {CATEGORIES.find(c => c.value === form.category)?.label}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <button onClick={() => i < step - 1 && setStep(i + 1)}
              className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                step === i + 1 ? 'bg-brand-500 text-white' :
                step > i + 1 ? 'bg-emerald-500 text-white cursor-pointer' : 'bg-slate-100 text-slate-400')}>
              {step > i + 1 ? '✓' : i + 1}
            </button>
            <span className={cn('text-xs font-medium truncate', step === i + 1 ? 'text-brand-600' : 'text-slate-400')}>
              {s}
            </span>
            {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 rounded', step > i + 1 ? 'bg-emerald-400' : 'bg-slate-200')} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" /> Basic Information
          </h3>

          {/* Photo capture — mobile-first */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asset Photo</label>
            <div
              onClick={() => photoRef.current?.click()}
              className={cn('relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all',
                photoPreview ? 'border-brand-300 bg-brand-50/30 h-40' : 'border-[#dce8f7] bg-slate-50 h-32 hover:bg-brand-50/30 hover:border-brand-300')}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Asset" className="h-full w-full object-contain rounded-xl" />
              ) : (
                <>
                  <Camera className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Tap to take photo or upload</p>
                  <p className="text-xs text-slate-400 mt-0.5">Supports camera on mobile devices</p>
                </>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhoto} className="hidden" />
          </div>

          <InputField label="Asset Name" field="name" placeholder="e.g. Dell Latitude 5420" required />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}
              className="w-full rounded-xl border border-[#dce8f7] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Brand" field="brand" placeholder="e.g. Dell" />
            <InputField label="Model" field="model" placeholder="e.g. Latitude 5420" />
          </div>

          <InputField label="Serial Number" field="serialNumber" placeholder="e.g. DL542026001" />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={2} placeholder="Brief description of the asset..."
              className="w-full rounded-xl border border-[#dce8f7] px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Initial Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['AVAILABLE', 'IN_USE', 'DEPLOYED', 'UNDER_MAINTENANCE'] as AssetStatus[]).map((s) => (
                <button key={s} onClick={() => set('status', s)}
                  className={cn('rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                    form.status === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#e4ebf5] text-slate-600 hover:bg-slate-50')}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => canNext1 && setStep(2)} disabled={!canNext1}
            className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-40 transition-all">
            Next: Ownership →
          </button>
        </div>
      )}

      {/* Step 2: Ownership */}
      {step === 2 && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-brand-500" /> Ownership & Assignment
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department <span className="text-red-500">*</span></label>
            <select value={form.department} onChange={(e) => set('department', e.target.value)}
              className="w-full rounded-xl border border-[#dce8f7] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white">
              <option value="">— Select Department —</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Custodian Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['INDIVIDUAL', 'DEPARTMENT'] as const).map((t) => (
                <button key={t} onClick={() => set('custodianType', t)}
                  className={cn('rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                    form.custodianType === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#e4ebf5] text-slate-600 hover:bg-slate-50')}>
                  {t === 'INDIVIDUAL' ? 'Individual' : 'Department'}
                </button>
              ))}
            </div>
          </div>

          <InputField
            label={form.custodianType === 'INDIVIDUAL' ? 'Assigned Person' : 'Custodian Office/Team'}
            field="custodianName"
            placeholder={form.custodianType === 'INDIVIDUAL' ? 'e.g. Prof. Roberto Santos' : 'e.g. IT Services'}
          />

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-[#dce8f7] py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              ← Back
            </button>
            <button onClick={() => canNext2 && setStep(3)} disabled={!canNext2}
              className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-40 transition-all">
              Next: Purchase →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Purchase Info */}
      {step === 3 && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-brand-500" /> Purchase Information
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Purchase Date" field="purchaseDate" type="date" />
            <InputField label="Warranty Expiry" field="warrantyExpiry" type="date" />
          </div>

          <InputField label="Supplier / Vendor" field="supplier" placeholder="e.g. Dell Philippines" />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purchase Cost (PHP)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₱</span>
              <input type="number" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-[#dce8f7] pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)}
              className="flex-1 rounded-xl border border-[#dce8f7] py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              ← Back
            </button>
            <button onClick={() => setStep(4)}
              className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-all">
              Next: Location →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Location & Inclusions */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" /> Location
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Campus" field="campus" placeholder="Main Campus" />
              <InputField label="Building" field="building" placeholder="e.g. IT Building" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Room / Floor" field="room" placeholder="e.g. Room 101" />
              <InputField label="Storage Area" field="storageArea" placeholder="e.g. Cabinet A" />
            </div>
          </div>

          {/* Inclusions */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-500" /> Inclusions / Accessories
            </h3>

            {inclusions.length > 0 && (
              <div className="space-y-2">
                {inclusions.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between rounded-xl bg-brand-50/50 border border-brand-100 px-3.5 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{inc.name}</p>
                      <p className="text-xs text-slate-500">Qty: {inc.quantity}</p>
                    </div>
                    <button onClick={() => removeInclusion(inc.id)} className="rounded-lg p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input value={newInclusion.name} onChange={(e) => setNewInclusion((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Item name (e.g. Charger)"
                  className="w-full rounded-xl border border-[#dce8f7] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  onKeyDown={(e) => e.key === 'Enter' && addInclusion()} />
              </div>
              <div className="w-16">
                <input type="number" min="1" value={newInclusion.quantity}
                  onChange={(e) => setNewInclusion((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-[#dce8f7] px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <button onClick={addInclusion} disabled={!newInclusion.name.trim()}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(3)}
              className="flex-1 rounded-xl border border-[#dce8f7] py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              ← Back
            </button>
            <button onClick={handleSave} disabled={!canSave || saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-40 transition-all">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Register Asset'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
