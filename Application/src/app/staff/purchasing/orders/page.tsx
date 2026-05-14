'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import {
  MOCK_PURCHASE_ORDERS, MOCK_PURCHASE_REQUESTS, MOCK_VENDORS,
  MOCK_NOTIFICATIONS, MOCK_AUDIT_LOGS,
} from '@/lib/mock-data'
import type { PurchaseOrder, POStatus, POItem } from '@/types'
import { Plus, Eye, Truck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { SessionUser } from '@/types'

const PO_STATUS_MAP: Record<POStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  SENT:      { label: 'Sent',      cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELIVERED: { label: 'Delivered', cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  CLOSED:    { label: 'Closed',    cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
}

const EMPTY_PO_ITEM: POItem = { id: '', name: '', quantity: 1, unit: 'unit', unitPrice: 0, total: 0 }

export default function PurchaseOrdersPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined

  const [orders, setOrders]   = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS)
  const [statusFilter, setFilter] = useState('ALL')
  const [viewPO, setViewPO]   = useState<PurchaseOrder | null>(null)
  const [createOpen, setCreate] = useState(false)
  const [saving, setSaving]   = useState(false)

  // Create PO form
  const [form, setForm] = useState({
    prId: '', vendorId: '', deliveryDate: '', terms: '', notes: '',
  })
  const [poItems, setPOItems] = useState<POItem[]>([{ ...EMPTY_PO_ITEM, id: 'poi_new_0' }])

  const filtered = useMemo(() => {
    return (statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter))
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, statusFilter])

  const poTotal = poItems.reduce((s,i) => s + i.quantity * i.unitPrice, 0)

  function updateItem(id: string, key: keyof POItem, value: string | number) {
    setPOItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, [key]: value }
      updated.total = updated.quantity * updated.unitPrice
      return updated
    }))
  }

  function handleCreate() {
    setSaving(true)
    setTimeout(() => {
      const vendor = MOCK_VENDORS.find(v => v.id === form.vendorId)
      const seq = String(MOCK_PURCHASE_ORDERS.length + 1).padStart(5, '0')
      const newPO: PurchaseOrder = {
        id: `po_${Date.now()}`, poNumber: `PO-2025-${seq}`,
        prId: form.prId, vendorId: form.vendorId, vendorName: vendor?.name ?? 'Unknown',
        items: poItems.map((i,idx) => ({ ...i, id:`poi_new_${idx}`, total: i.quantity*i.unitPrice })),
        totalAmount: poTotal, status: 'SENT',
        deliveryDate: form.deliveryDate || undefined,
        terms: form.terms || undefined, notes: form.notes || undefined,
        createdBy: user?.name ?? 'Purchasing',
        schoolId: 'school_1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      MOCK_PURCHASE_ORDERS.push(newPO)
      // Update PR status to PROCUREMENT_ONGOING
      const prIdx = MOCK_PURCHASE_REQUESTS.findIndex(p => p.id === form.prId)
      if (prIdx >= 0) {
        MOCK_PURCHASE_REQUESTS[prIdx] = { ...MOCK_PURCHASE_REQUESTS[prIdx], status: 'PROCUREMENT_ONGOING', purchaseOrderId: newPO.id }
      }
      MOCK_NOTIFICATIONS.push({ id:`notif_${Date.now()}`, title:'Purchase Order Created', message:`${newPO.poNumber} created`, type:'PO', isRead:false, schoolId:'school_1', createdAt:new Date().toISOString() })
      MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'CREATE_PO', entity:'PurchaseOrder', entityId:newPO.id, details:`PO ${newPO.poNumber} created`, userId:user?.id??'u_purchasing', schoolId:'school_1', createdAt:new Date().toISOString() })
      setOrders([...MOCK_PURCHASE_ORDERS])
      setForm({ prId:'', vendorId:'', deliveryDate:'', terms:'', notes:'' })
      setPOItems([{ ...EMPTY_PO_ITEM, id:'poi_new_0' }])
      setSaving(false)
      setCreate(false)
    }, 600)
  }

  function handleDeliver(po: PurchaseOrder) {
    const idx = MOCK_PURCHASE_ORDERS.findIndex(o => o.id === po.id)
    if (idx < 0) return
    MOCK_PURCHASE_ORDERS[idx] = { ...po, status: 'DELIVERED', deliveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    // Update PR to DELIVERED
    const prIdx = MOCK_PURCHASE_REQUESTS.findIndex(p => p.id === po.prId)
    if (prIdx >= 0) MOCK_PURCHASE_REQUESTS[prIdx] = { ...MOCK_PURCHASE_REQUESTS[prIdx], status: 'DELIVERED' }
    setOrders([...MOCK_PURCHASE_ORDERS])
    setViewPO(MOCK_PURCHASE_ORDERS[idx])
    MOCK_NOTIFICATIONS.push({ id:`notif_${Date.now()}`, title:'PO Delivered', message:`${po.poNumber} marked as delivered`, type:'PO', isRead:false, schoolId:'school_1', createdAt:new Date().toISOString() })
  }

  // Approved PRs that don't have a PO yet
  const approvedPRs = MOCK_PURCHASE_REQUESTS.filter(p => p.status === 'APPROVED' && !p.purchaseOrderId)

  return (
    <div className="space-y-6">
      <SectionTitle description="Create and track purchase orders issued to vendors."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5"/>} onClick={() => setCreate(true)}>Create PO</Button>}
      >Purchase Orders</SectionTitle>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white border border-[#e4ebf5] rounded-xl p-1 w-fit">
        {['ALL','DRAFT','SENT','CONFIRMED','DELIVERED','CLOSED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${statusFilter===s ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {s === 'ALL' ? 'All' : PO_STATUS_MAP[s as POStatus]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <Th>PO Number</Th>
            <Th>Vendor</Th>
            <Th>PR Reference</Th>
            <Th>Total Amount</Th>
            <Th>Status</Th>
            <Th>Delivery Date</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {filtered.length === 0 && (
              <Tr><Td colSpan={7} className="text-center py-10 text-slate-400">No purchase orders found.</Td></Tr>
            )}
            {filtered.map(po => {
              const s = PO_STATUS_MAP[po.status]
              const pr = MOCK_PURCHASE_REQUESTS.find(p => p.id === po.prId)
              const overdue = po.deliveryDate && po.status !== 'DELIVERED' && new Date(po.deliveryDate) < new Date()
              return (
                <Tr key={po.id}>
                  <Td><span className="font-mono text-xs text-brand-600 font-bold">{po.poNumber}</span></Td>
                  <Td>
                    <p className="font-medium text-slate-800">{po.vendorName}</p>
                  </Td>
                  <Td>
                    {pr ? (
                      <div>
                        <p className="font-mono text-xs text-brand-600">{pr.prNumber}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[140px]">{pr.title}</p>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </Td>
                  <Td><span className="font-bold text-slate-800">{formatCurrency(po.totalAmount)}</span></Td>
                  <Td><Badge className={s.cls}>{s.label}</Badge></Td>
                  <Td>
                    {po.deliveryDate ? (
                      <span className={overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                        {formatDate(po.deliveryDate)}{overdue ? ' ⚠' : ''}
                      </span>
                    ) : '—'}
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="xs" variant="soft" icon={<Eye className="h-3 w-3"/>} onClick={() => setViewPO(po)}>View</Button>
                      {po.status === 'CONFIRMED' && (
                        <Button size="xs" variant="success" icon={<Truck className="h-3 w-3"/>} onClick={() => handleDeliver(po)}>Delivered</Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Card>

      {/* View PO Modal */}
      <Modal open={!!viewPO} onClose={() => setViewPO(null)} title="Purchase Order Details" size="xl"
        footer={
          viewPO ? (
            <div className="flex gap-2">
              {viewPO.status === 'CONFIRMED' && (
                <Button variant="success" icon={<Truck className="h-3.5 w-3.5"/>} onClick={() => handleDeliver(viewPO)}>Mark as Delivered</Button>
              )}
              <Button variant="outline" onClick={() => setViewPO(null)}>Close</Button>
            </div>
          ) : undefined
        }
      >
        {viewPO && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-sm text-brand-600 font-bold">{viewPO.poNumber}</span>
                <div className="mt-1"><Badge className={PO_STATUS_MAP[viewPO.status].cls}>{PO_STATUS_MAP[viewPO.status].label}</Badge></div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-600">{formatCurrency(viewPO.totalAmount)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Created: {formatDate(viewPO.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Vendor', viewPO.vendorName],
                ['Created By', viewPO.createdBy],
                ['Delivery Date', viewPO.deliveryDate ? formatDate(viewPO.deliveryDate) : '—'],
                ['Delivered', viewPO.deliveredAt ? formatDateTime(viewPO.deliveredAt) : '—'],
                ['Terms', viewPO.terms ?? '—'],
                ['Notes', viewPO.notes ?? '—'],
              ].map(([k,v]) => (
                <div key={k}><span className="text-slate-500">{k}: </span><span className="font-medium text-slate-800">{v}</span></div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">Order Items</p>
              <Card padding="none">
                <Table>
                  <Thead><Th>Item</Th><Th>Qty</Th><Th>Unit</Th><Th>Unit Price</Th><Th>Total</Th></Thead>
                  <Tbody>
                    {viewPO.items.map(item => (
                      <Tr key={item.id}>
                        <Td className="font-medium text-slate-800">{item.name}</Td>
                        <Td>{item.quantity}</Td>
                        <Td>{item.unit}</Td>
                        <Td>{formatCurrency(item.unitPrice)}</Td>
                        <Td className="font-semibold">{formatCurrency(item.total)}</Td>
                      </Tr>
                    ))}
                    <Tr className="bg-brand-50">
                      <Td colSpan={4} className="font-bold text-right text-brand-700">Total</Td>
                      <Td className="font-bold text-brand-700">{formatCurrency(viewPO.totalAmount)}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Card>
            </div>
          </div>
        )}
      </Modal>

      {/* Create PO Modal */}
      <Modal open={createOpen} onClose={() => setCreate(false)} title="Create Purchase Order" size="xl"
        footer={<>
          <Button variant="outline" onClick={() => setCreate(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} disabled={!form.vendorId || poItems.every(i=>!i.name)} onClick={handleCreate}>Create PO</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">From Approved PR</label>
              <select value={form.prId} onChange={e=>setForm(f=>({...f,prId:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <option value="">— Select PR (optional) —</option>
                {approvedPRs.map(p=><option key={p.id} value={p.id}>{p.prNumber} — {p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor *</label>
              <select value={form.vendorId} onChange={e=>setForm(f=>({...f,vendorId:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <option value="">— Select Vendor —</option>
                {MOCK_VENDORS.filter(v=>v.status==='ACTIVE').map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Date</label>
              <input type="date" value={form.deliveryDate} onChange={e=>setForm(f=>({...f,deliveryDate:e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Terms</label>
              <input value={form.terms} onChange={e=>setForm(f=>({...f,terms:e.target.value}))} placeholder="Net 30 days, etc."
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-widest">Order Items</p>
              <Button size="xs" variant="soft" icon={<Plus className="h-3 w-3"/>}
                onClick={() => setPOItems(p=>[...p,{...EMPTY_PO_ITEM,id:`poi_new_${Date.now()}`}])}>Add</Button>
            </div>
            <div className="space-y-2">
              {poItems.map((item, i) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {i===0 && <label className="block text-2xs text-slate-500 mb-0.5">Item Name</label>}
                    <input value={item.name} onChange={e=>updateItem(item.id,'name',e.target.value)} placeholder="Item"
                      className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-2">
                    {i===0 && <label className="block text-2xs text-slate-500 mb-0.5">Qty</label>}
                    <input type="number" value={item.quantity} onChange={e=>updateItem(item.id,'quantity',parseInt(e.target.value)||1)} min="1"
                      className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-2">
                    {i===0 && <label className="block text-2xs text-slate-500 mb-0.5">Unit</label>}
                    <input value={item.unit} onChange={e=>updateItem(item.id,'unit',e.target.value)}
                      className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-3">
                    {i===0 && <label className="block text-2xs text-slate-500 mb-0.5">Unit Price</label>}
                    <input type="number" value={item.unitPrice} onChange={e=>updateItem(item.id,'unitPrice',parseFloat(e.target.value)||0)} min="0"
                      className="w-full h-8 text-sm border border-[#dce8f7] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
                  </div>
                  <div className="col-span-1">
                    <button onClick={()=>setPOItems(p=>p.filter(x=>x.id!==item.id))} disabled={poItems.length===1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-30">×</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-sm font-bold text-brand-700">Total: {formatCurrency(poTotal)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
