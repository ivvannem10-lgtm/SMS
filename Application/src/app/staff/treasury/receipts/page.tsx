'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { MOCK_OFFICIAL_RECEIPTS, MOCK_AUDIT_LOGS } from '@/lib/mock-data'
import type { OfficialReceipt } from '@/types'
import { Search, Receipt, DollarSign, Calendar } from 'lucide-react'

const today = new Date().toISOString().slice(0, 10)
const thisMonth = new Date().toISOString().slice(0, 7)

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<OfficialReceipt[]>(MOCK_OFFICIAL_RECEIPTS)
  const [search, setSearch]     = useState('')
  const [voidOpen, setVoidOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<OfficialReceipt | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voiding, setVoiding]   = useState(false)

  const filtered = useMemo(() => {
    if (!search) return receipts
    const q = search.toLowerCase()
    return receipts.filter(r =>
      r.orNumber.toLowerCase().includes(q) || r.studentName.toLowerCase().includes(q)
    )
  }, [receipts, search])

  const todayCount   = receipts.filter(r => r.issuedAt.startsWith(today) && !r.voidedAt).length
  const monthAmount  = receipts.filter(r => r.issuedAt.startsWith(thisMonth) && !r.voidedAt).reduce((s,r)=>s+r.amount,0)
  const totalAmount  = receipts.filter(r => !r.voidedAt).reduce((s,r)=>s+r.amount,0)

  function openVoid(r: OfficialReceipt) {
    setVoidTarget(r)
    setVoidReason('')
    setVoidOpen(true)
  }

  function handleVoid() {
    if (!voidTarget || !voidReason.trim()) return
    setVoiding(true)
    setTimeout(() => {
      const idx = MOCK_OFFICIAL_RECEIPTS.findIndex(r => r.id === voidTarget.id)
      if (idx >= 0) {
        MOCK_OFFICIAL_RECEIPTS[idx] = {
          ...MOCK_OFFICIAL_RECEIPTS[idx],
          voidedAt: new Date().toISOString(),
          voidedBy: 'Treasury Staff',
          voidReason: voidReason.trim(),
        }
      }
      MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'VOID_RECEIPT', entity:'OfficialReceipt', entityId:voidTarget.id, details:`Voided ${voidTarget.orNumber}: ${voidReason}`, userId:'u_treasurer', schoolId:'school_1', createdAt:new Date().toISOString() })
      setReceipts([...MOCK_OFFICIAL_RECEIPTS])
      setVoiding(false)
      setVoidOpen(false)
      setVoidTarget(null)
    }, 500)
  }

  function handlePrint(r: OfficialReceipt) {
    const w = window.open('', '_blank', 'width=400,height=600')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>OR ${r.orNumber}</title>
    <style>body{font-family:sans-serif;padding:24px;max-width:320px;margin:auto}
    h2{text-align:center;color:#1a4a8a}.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:13px}
    .label{color:#666}.value{font-weight:600}.or{text-align:center;font-size:22px;font-weight:bold;color:#1a4a8a;margin:8px 0}
    </style></head><body>
    <h2>St. Dominic College</h2>
    <p style="text-align:center;font-size:11px;color:#888">Official Receipt</p>
    <div class="or">${r.orNumber}</div>
    <div class="row"><span class="label">Student</span><span class="value">${r.studentName}</span></div>
    <div class="row"><span class="label">Student No.</span><span class="value">${r.studentNo}</span></div>
    <div class="row"><span class="label">Amount</span><span class="value">${formatCurrency(r.amount)}</span></div>
    <div class="row"><span class="label">Type</span><span class="value">${r.paymentType}</span></div>
    <div class="row"><span class="label">Issued By</span><span class="value">${r.issuedBy}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${formatDateTime(r.issuedAt)}</span></div>
    ${r.voidedAt ? '<p style="color:red;text-align:center;font-weight:bold;margin-top:16px">*** VOIDED ***</p>' : ''}
    <script>window.print()</script></body></html>`)
    w.document.close()
  }

  return (
    <div className="space-y-6">
      <SectionTitle description="View and manage all issued official receipts.">Official Receipts</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Issued Today"    value={todayCount}              icon={Receipt}    color="bg-brand-50 text-brand-500"/>
        <StatCard label="This Month"      value={formatCurrency(monthAmount)} icon={Calendar} color="bg-emerald-50 text-emerald-600"/>
        <StatCard label="Total Amount"    value={formatCurrency(totalAmount)} icon={DollarSign} color="bg-violet-50 text-violet-600"/>
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search OR number or student..."
            className="w-full pl-9 pr-3 h-8 text-sm border border-[#dce8f7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <Th>OR Number</Th>
            <Th>Student</Th>
            <Th>Amount</Th>
            <Th>Type</Th>
            <Th>Issued By</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {filtered.length === 0 && (
              <Tr><Td colSpan={8} className="text-center py-10 text-slate-400">No receipts found.</Td></Tr>
            )}
            {filtered.map(r => (
              <Tr key={r.id}>
                <Td><span className="font-mono text-xs font-semibold text-brand-600">{r.orNumber}</span></Td>
                <Td>
                  <p className="font-medium text-slate-800">{r.studentName}</p>
                  <p className="text-xs text-slate-400">{r.studentNo}</p>
                </Td>
                <Td><span className="font-semibold">{formatCurrency(r.amount)}</span></Td>
                <Td><span className="text-slate-600 text-sm">{r.paymentType}</span></Td>
                <Td className="text-slate-500">{r.issuedBy}</Td>
                <Td className="text-slate-500">{formatDateTime(r.issuedAt)}</Td>
                <Td>
                  {r.voidedAt
                    ? <Badge className="bg-red-50 text-red-600 ring-red-200">Voided</Badge>
                    : <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Valid</Badge>
                  }
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="xs" variant="outline" onClick={() => handlePrint(r)}>Print</Button>
                    {!r.voidedAt && (
                      <Button size="xs" variant="danger" onClick={() => openVoid(r)}>Void</Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Void Modal */}
      <Modal open={voidOpen} onClose={() => setVoidOpen(false)} title="Void Official Receipt" size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setVoidOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={voiding} disabled={!voidReason.trim()} onClick={handleVoid}>Void Receipt</Button>
        </>}
      >
        {voidTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">You are about to void:</p>
              <p className="text-sm text-red-700 mt-1">{voidTarget.orNumber} — {voidTarget.studentName} — {formatCurrency(voidTarget.amount)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Voiding *</label>
              <textarea value={voidReason} onChange={e => setVoidReason(e.target.value)} rows={3}
                placeholder="Provide a reason..."
                className="w-full text-sm border border-[#dce8f7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"/>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
