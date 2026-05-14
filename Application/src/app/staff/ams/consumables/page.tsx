'use client'
import { useState, useRef, useEffect } from 'react'
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3,
  Plus, ArrowDownCircle, ArrowUpCircle, MoreVertical, Search,
  Filter, X, Trash2, Edit, ChevronRight, ArrowRight, Upload,
} from 'lucide-react'
import { MOCK_CONSUMABLES, MOCK_CONSUMABLE_TRANSACTIONS, MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import { ImportModal } from '@/components/shared/ImportModal'
import { SectionTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import type { Consumable, ConsumableTransaction, ConsumableUnit, StockStatus, ConsumableTransactionType } from '@/types'

const DEPARTMENTS = [
  'Office of the Registrar', 'Admissions Office', 'Finance Office',
  'Academic Affairs', 'Asset Management', 'Human Resources',
  'College of Computing', 'College of Business', 'College of Nursing', 'Arts & Sciences',
]

const UNIT_LABELS: Record<ConsumableUnit, string> = {
  PIECE: 'pc', REAM: 'ream', BOX: 'box', BOTTLE: 'bottle',
  SET: 'set', PACK: 'pack', LITER: 'L', KILOGRAM: 'kg',
}

function getStockStatus(c: Consumable): StockStatus {
  if (c.quantity <= c.lowStockThreshold) return 'LOW'
  if (c.quantity >= c.overstockThreshold) return 'OVERSTOCK'
  return 'NORMAL'
}

const STATUS_MAP: Record<StockStatus, { label: string; cls: string; bar: string }> = {
  LOW:       { label: 'Low Stock',  cls: 'bg-red-50 text-red-700 ring-red-200',         bar: 'bg-red-500' },
  NORMAL:    { label: 'Normal',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500' },
  OVERSTOCK: { label: 'Overstock', cls: 'bg-blue-50 text-blue-700 ring-blue-200',       bar: 'bg-blue-500' },
}

const TX_TYPE_MAP: Record<ConsumableTransactionType, { label: string; cls: string }> = {
  ISSUE:      { label: 'Issue',      cls: 'bg-red-50 text-red-700 ring-red-200' },
  RESTOCK:    { label: 'Restock',    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  ADJUSTMENT: { label: 'Adjustment', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

function ProgressBar({ value, max, status, lowPct }: { value: number; max: number; status: StockStatus; lowPct: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="relative h-2 rounded-full bg-slate-100 overflow-visible">
      <div
        className={cn('h-2 rounded-full transition-all duration-300', STATUS_MAP[status].bar)}
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-slate-400 rounded-full"
        style={{ left: `${lowPct}%` }}
        title="Low stock threshold"
      />
    </div>
  )
}

interface IssueModalProps {
  item: Consumable
  onClose: () => void
  onSubmit: (qty: number, by: string, dept: string, purpose: string) => void
}

function IssueModal({ item, onClose, onSubmit }: IssueModalProps) {
  const [qty, setQty] = useState(1)
  const [by, setBy] = useState('')
  const [dept, setDept] = useState(DEPARTMENTS[0])
  const [purpose, setPurpose] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (qty < 1 || qty > item.quantity || !by.trim()) return
    onSubmit(qty, by, dept, purpose)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#e4ebf5]">
          <span className="w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
          <h2 className="text-[15px] font-bold text-slate-900">Issue Stock</h2>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-[#e4ebf5] px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">Item</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">Available: {item.quantity} {UNIT_LABELS[item.unit]}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity to Issue</label>
            <input
              type="number" min={1} max={item.quantity} value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Requested By</label>
            <input
              type="text" value={by} onChange={(e) => setBy(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
            <select
              value={dept} onChange={(e) => setDept(e.target.value)}
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400 bg-white"
            >
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)}
              placeholder="Brief description of use"
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#dce8f7] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 text-sm font-semibold transition-colors">Issue Stock</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface RestockModalProps {
  item: Consumable
  onClose: () => void
  onSubmit: (qty: number, supplier: string, purchaseDate: string) => void
}

function RestockModal({ item, onClose, onSubmit }: RestockModalProps) {
  const [qty, setQty] = useState(1)
  const [supplier, setSupplier] = useState(item.supplier ?? '')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (qty < 1) return
    onSubmit(qty, supplier, purchaseDate)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#e4ebf5]">
          <span className="w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
          <h2 className="text-[15px] font-bold text-slate-900">Restock Item</h2>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-[#e4ebf5] px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">Item</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">Current stock: {item.quantity} {UNIT_LABELS[item.unit]}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity to Add</label>
            <input
              type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))}
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Supplier</label>
            <input
              type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier name"
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purchase Date</label>
            <input
              type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#dce8f7] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold transition-colors">Restock</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const UNIT_OPTIONS: ConsumableUnit[] = ['PIECE', 'REAM', 'BOX', 'BOTTLE', 'SET', 'PACK', 'LITER', 'KILOGRAM']

interface ConsumableFormState {
  name: string
  description: string
  category: string
  unit: ConsumableUnit
  quantity: string
  lowStockThreshold: string
  overstockThreshold: string
  supplier: string
  cost: string
  purchaseDate: string
}

const EMPTY_FORM: ConsumableFormState = {
  name: '', description: '', category: '', unit: 'PIECE',
  quantity: '', lowStockThreshold: '', overstockThreshold: '',
  supplier: '', cost: '', purchaseDate: '',
}

interface AddEditModalProps {
  item?: Consumable
  onClose: () => void
  onSubmit: (data: ConsumableFormState, isEdit: boolean, id?: string) => void
}

function AddEditModal({ item, onClose, onSubmit }: AddEditModalProps) {
  const [form, setForm] = useState<ConsumableFormState>(
    item
      ? {
          name: item.name,
          description: item.description ?? '',
          category: item.category,
          unit: item.unit,
          quantity: String(item.quantity),
          lowStockThreshold: String(item.lowStockThreshold),
          overstockThreshold: String(item.overstockThreshold),
          supplier: item.supplier ?? '',
          cost: item.cost != null ? String(item.cost) : '',
          purchaseDate: item.purchaseDate ?? '',
        }
      : EMPTY_FORM,
  )

  const set = (k: keyof ConsumableFormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.category.trim()) return
    onSubmit(form, !!item, item?.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#e4ebf5] sticky top-0 bg-white z-10">
          <span className="w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
          <h2 className="text-[15px] font-bold text-slate-900">{item ? 'Edit Item' : 'Add Consumable Item'}</h2>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <input type="text" value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit</label>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value as ConsumableUnit)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400 bg-white">
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Initial Quantity</label>
              <input type="number" min={0} value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Low Stock Threshold</label>
              <input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Overstock Threshold</label>
              <input type="number" min={0} value={form.overstockThreshold} onChange={(e) => set('overstockThreshold', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Supplier</label>
              <input type="text" value={form.supplier} onChange={(e) => set('supplier', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cost per Unit (₱)</label>
              <input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => set('cost', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#dce8f7] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 text-sm font-semibold transition-colors">{item ? 'Save Changes' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteModalProps {
  item: Consumable
  onClose: () => void
  onConfirm: () => void
}

function DeleteModal({ item, onClose, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden border border-red-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-red-100 bg-red-50">
          <Trash2 className="h-4 w-4 text-red-600" />
          <h2 className="text-[15px] font-bold text-red-700">Delete Item</h2>
          <button onClick={onClose} className="ml-auto text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-semibold text-slate-900">{item.name}</span>? This action cannot be undone.</p>
          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 rounded-lg border border-[#dce8f7] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold transition-colors">Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThreeDotMenu({ onIssue, onRestock, onEdit, onDelete }: {
  onIssue: () => void; onRestock: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-white border border-[#e4ebf5] shadow-card-md overflow-hidden">
          <button onClick={() => { onIssue(); setOpen(false) }} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
            <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" /> Issue Stock
          </button>
          <button onClick={() => { onRestock(); setOpen(false) }} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
            <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" /> Restock
          </button>
          <div className="border-t border-[#e4ebf5]" />
          <button onClick={() => { onEdit(); setOpen(false) }} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
            <Edit className="h-3.5 w-3.5 text-brand-500" /> Edit
          </button>
          <button onClick={() => { onDelete(); setOpen(false) }} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function ConsumablesPage() {
  const confirm = useConfirm()
  const [consumables, setConsumables] = useState<Consumable[]>(MOCK_CONSUMABLES)
  const [transactions, setTransactions] = useState<ConsumableTransaction[]>(MOCK_CONSUMABLE_TRANSACTIONS)
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockStatus>('ALL')

  const [issueTarget, setIssueTarget] = useState<Consumable | null>(null)
  const [restockTarget, setRestockTarget] = useState<Consumable | null>(null)
  const [editTarget, setEditTarget] = useState<Consumable | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Consumable | null>(null)
  const [addOpen,    setAddOpen]    = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const categories = ['ALL', ...Array.from(new Set(consumables.map((c) => c.category)))]
  const lowItems = consumables.filter((c) => getStockStatus(c) === 'LOW')

  // Push low-stock notification into the header bell on mount
  useEffect(() => {
    if (lowItems.length === 0) return
    const notifId = 'ams_low_stock'
    const existing = MOCK_NOTIFICATIONS.find((n) => n.id === notifId)
    const message = `${lowItems.length} consumable item${lowItems.length !== 1 ? 's are' : ' is'} running low: ${lowItems.map((c) => c.name).join(', ')}. Restock soon.`
    if (existing) {
      existing.message = message
      existing.isRead  = false
    } else {
      MOCK_NOTIFICATIONS.unshift({
        id:        notifId,
        title:     `${lowItems.length} item${lowItems.length !== 1 ? 's' : ''} running low`,
        message,
        type:      'SYSTEM',
        isRead:    false,
        link:      '/staff/ams/consumables',
        schoolId:  'school_1',
        createdAt: new Date().toISOString(),
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const normalItems = consumables.filter((c) => getStockStatus(c) === 'NORMAL')
  const overstockItems = consumables.filter((c) => getStockStatus(c) === 'OVERSTOCK')

  const filtered = consumables.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    const matchCat = categoryFilter === 'ALL' || c.category === categoryFilter
    const matchStatus = statusFilter === 'ALL' || getStockStatus(c) === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  const sortedTx = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  function handleIssue(qty: number, by: string, dept: string, purpose: string) {
    if (!issueTarget) return
    const idx = MOCK_CONSUMABLES.findIndex((c) => c.id === issueTarget.id)
    if (idx < 0) return
    const before = MOCK_CONSUMABLES[idx].quantity
    MOCK_CONSUMABLES[idx].quantity -= qty
    const tx: ConsumableTransaction = {
      id: `ctx_${Date.now()}`,
      consumableId: issueTarget.id,
      consumableName: issueTarget.name,
      type: 'ISSUE',
      quantity: qty,
      requestedBy: by,
      department: dept,
      purpose: purpose || undefined,
      balanceBefore: before,
      balanceAfter: before - qty,
      createdAt: new Date().toISOString(),
    }
    MOCK_CONSUMABLE_TRANSACTIONS.unshift(tx)
    setConsumables([...MOCK_CONSUMABLES])
    setTransactions([...MOCK_CONSUMABLE_TRANSACTIONS])
    setIssueTarget(null)
  }

  function handleRestock(qty: number, supplier: string, purchaseDate: string) {
    if (!restockTarget) return
    const idx = MOCK_CONSUMABLES.findIndex((c) => c.id === restockTarget.id)
    if (idx < 0) return
    const before = MOCK_CONSUMABLES[idx].quantity
    MOCK_CONSUMABLES[idx].quantity += qty
    if (supplier) MOCK_CONSUMABLES[idx].supplier = supplier
    if (purchaseDate) MOCK_CONSUMABLES[idx].purchaseDate = purchaseDate
    const tx: ConsumableTransaction = {
      id: `ctx_${Date.now()}`,
      consumableId: restockTarget.id,
      consumableName: restockTarget.name,
      type: 'RESTOCK',
      quantity: qty,
      requestedBy: 'Asset Management',
      department: 'Asset Management',
      balanceBefore: before,
      balanceAfter: before + qty,
      createdAt: new Date().toISOString(),
    }
    MOCK_CONSUMABLE_TRANSACTIONS.unshift(tx)
    setConsumables([...MOCK_CONSUMABLES])
    setTransactions([...MOCK_CONSUMABLE_TRANSACTIONS])
    setRestockTarget(null)
  }

  function handleAddEdit(data: ConsumableFormState, isEdit: boolean, id?: string) {
    if (isEdit && id) {
      const idx = MOCK_CONSUMABLES.findIndex((c) => c.id === id)
      if (idx >= 0) {
        MOCK_CONSUMABLES[idx] = {
          ...MOCK_CONSUMABLES[idx],
          name: data.name,
          description: data.description || undefined,
          category: data.category,
          unit: data.unit,
          quantity: Number(data.quantity) || 0,
          lowStockThreshold: Number(data.lowStockThreshold) || 0,
          overstockThreshold: Number(data.overstockThreshold) || 0,
          supplier: data.supplier || undefined,
          cost: data.cost ? Number(data.cost) : undefined,
          purchaseDate: data.purchaseDate || undefined,
        }
      }
      setEditTarget(null)
    } else {
      const newItem: Consumable = {
        id: `cons_${Date.now()}`,
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        unit: data.unit,
        quantity: Number(data.quantity) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 0,
        overstockThreshold: Number(data.overstockThreshold) || 0,
        supplier: data.supplier || undefined,
        cost: data.cost ? Number(data.cost) : undefined,
        purchaseDate: data.purchaseDate || undefined,
        createdAt: new Date().toISOString(),
      }
      MOCK_CONSUMABLES.push(newItem)
      setAddOpen(false)
    }
    setConsumables([...MOCK_CONSUMABLES])
  }

  function handleDelete() {
    if (!deleteTarget) return
    const idx = MOCK_CONSUMABLES.findIndex((c) => c.id === deleteTarget.id)
    if (idx >= 0) MOCK_CONSUMABLES.splice(idx, 1)
    setConsumables([...MOCK_CONSUMABLES])
    setDeleteTarget(null)
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <SectionTitle
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-all">
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white px-3.5 py-2 text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" /> Add Item
            </button>
            <button onClick={() => { setActiveTab('inventory'); setIssueTarget(null) }}
              className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-sm font-semibold transition-colors">
              <ArrowDownCircle className="h-4 w-4 text-brand-500" /> Record Transaction
            </button>
          </div>
        }
      >
        Consumables Inventory{' '}
        <span className="text-slate-400 font-normal text-base">({consumables.length})</span>
      </SectionTitle>

      {importOpen && (
        <ImportModal
          templateId="consumables"
          onClose={() => setImportOpen(false)}
          onImport={(rows) => {
            rows.forEach((row) => {
              const item: Consumable = {
                id: `cons_imp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                name: row.name ?? '', category: row.category ?? 'General',
                description: row.description || undefined,
                unit: (row.unit as ConsumableUnit) || 'PIECE',
                quantity: Number(row.quantity ?? 0),
                lowStockThreshold: Number(row.low_stock_threshold ?? 10),
                overstockThreshold: Number(row.overstock_threshold ?? 100),
                supplier: row.supplier || undefined,
                cost: row.cost_per_unit ? Number(row.cost_per_unit) : undefined,
                purchaseDate: row.purchase_date || undefined,
                createdAt: new Date().toISOString(),
              }
              MOCK_CONSUMABLES.push(item)
            })
            setConsumables([...MOCK_CONSUMABLES])
            setImportOpen(false)
          }}
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-brand-50 flex items-center justify-center"><Package className="h-4 w-4 text-brand-500" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Items</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{consumables.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', lowItems.length > 0 ? 'bg-red-50' : 'bg-slate-50')}>
              <AlertTriangle className={cn('h-4 w-4', lowItems.length > 0 ? 'text-red-500' : 'text-slate-400')} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Low Stock</p>
          </div>
          <p className={cn('text-2xl font-bold tabular-nums', lowItems.length > 0 ? 'text-red-600' : 'text-slate-900')}>{lowItems.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-emerald-500" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Normal</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{normalItems.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-blue-500" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Overstock</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{overstockItems.length}</p>
        </div>
      </div>

      {lowItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {lowItems.length} item{lowItems.length > 1 ? 's' : ''} are running low. Restock soon.
          </p>
          <button
            onClick={() => { setStatusFilter('LOW'); setActiveTab('inventory') }}
            className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            View <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn('px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors', activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={cn('px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors', activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
        >
          Transaction Log
        </button>
      </div>

      {activeTab === 'inventory' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or category…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#dce8f7] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 bg-white"
              >
                {categories.map((c) => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>)}
              </select>
              <select
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | StockStatus)}
                className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="LOW">Low Stock</option>
                <option value="NORMAL">Normal</option>
                <option value="OVERSTOCK">Overstock</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No items match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item) => {
                const status = getStockStatus(item)
                const { cls, bar } = STATUS_MAP[status]
                const lowPct = Math.min((item.lowStockThreshold / item.overstockThreshold) * 100, 100)
                const pct = Math.min((item.quantity / item.overstockThreshold) * 100, 100)
                return (
                  <div key={item.id} className="rounded-2xl bg-white border border-[#e4ebf5] p-5 hover:border-brand-200 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h3>
                          <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{item.category}</Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                        )}
                      </div>
                      <ThreeDotMenu
                        onIssue={() => setIssueTarget(item)}
                        onRestock={() => setRestockTarget(item)}
                        onEdit={() => setEditTarget(item)}
                        onDelete={() => setDeleteTarget(item)}
                      />
                    </div>

                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{item.quantity}</span>
                      <span className="text-sm text-slate-400 mb-0.5">{UNIT_LABELS[item.unit]}</span>
                      <Badge className={cn(cls, 'ml-auto mb-0.5')}>{STATUS_MAP[status].label}</Badge>
                    </div>

                    <ProgressBar value={item.quantity} max={item.overstockThreshold} status={status} lowPct={lowPct} />

                    <div className="flex items-center justify-between mt-2 mb-3">
                      <span className="text-xs text-slate-400">Low: {item.lowStockThreshold} {UNIT_LABELS[item.unit]}</span>
                      <span className="text-xs text-slate-400">{Math.round(pct)}%</span>
                      <span className="text-xs text-slate-400">Max: {item.overstockThreshold} {UNIT_LABELS[item.unit]}</span>
                    </div>

                    {(item.supplier || item.cost != null) && (
                      <div className="border-t border-[#e4ebf5] pt-3 flex items-center justify-between flex-wrap gap-1">
                        {item.supplier && <span className="text-xs text-slate-500">{item.supplier}</span>}
                        {item.cost != null && (
                          <span className="text-xs font-semibold text-slate-700 ml-auto">{formatCurrency(item.cost)} / {UNIT_LABELS[item.unit]}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Item</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Qty</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Requested By</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Department</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Balance</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-brand-700 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4ebf5]">
                {sortedTx.map((tx) => {
                  const { label, cls } = TX_TYPE_MAP[tx.type]
                  return (
                    <tr key={tx.id} className="hover:bg-brand-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{tx.consumableName}</td>
                      <td className="px-4 py-3">
                        <Badge className={cls}>{label}</Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-slate-700">{tx.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{tx.requestedBy}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{tx.department}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs tabular-nums text-slate-600 font-mono">
                          {tx.balanceBefore}
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className={cn('font-semibold', tx.type === 'ISSUE' ? 'text-red-600' : 'text-emerald-600')}>{tx.balanceAfter}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {issueTarget && (
        <IssueModal item={issueTarget} onClose={() => setIssueTarget(null)} onSubmit={handleIssue} />
      )}
      {restockTarget && (
        <RestockModal item={restockTarget} onClose={() => setRestockTarget(null)} onSubmit={handleRestock} />
      )}
      {(addOpen || editTarget) && (
        <AddEditModal
          item={editTarget ?? undefined}
          onClose={() => { setAddOpen(false); setEditTarget(null) }}
          onSubmit={handleAddEdit}
        />
      )}
      {deleteTarget && (
        <DeleteModal item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </div>
  )
}
