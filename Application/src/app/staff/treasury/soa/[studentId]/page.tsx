'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Plus, CheckCircle2, Printer, Trash2,
  CreditCard, AlertCircle, RotateCcw, Receipt, Info,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { SOABadge, PaymentBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { ProcessFlow } from '@/components/shared/ProcessFlow'
import {
  MOCK_SOA, MOCK_STUDENTS, MOCK_SEMESTERS, MOCK_TREASURY_LOGS,
} from '@/lib/mock-data'
import { fullName, formatCurrency, formatDate, formatDateTime, generateReceiptNumber } from '@/lib/utils'
import type { SOA, SOAItem, Payment, TreasuryTransaction } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────────
let nextItemId = 200
let nextPayId  = 200
let nextLogId  = 1000

function pushLog(log: Omit<TreasuryTransaction, 'id' | 'createdAt'>) {
  MOCK_TREASURY_LOGS.push({
    ...log,
    id:        `tx_${++nextLogId}`,
    createdAt: new Date().toISOString(),
  })
}

function computeSOA(soa: SOA) {
  const activeItems = soa.items?.filter((i) => !i.voided) ?? []
  const total    = activeItems.reduce((s, i) => s + i.amount, 0)
  const paid     = soa.payments?.filter((p) => p.status === 'VALIDATED').reduce((s, p) => s + p.amount, 0) ?? 0
  const balance  = Math.max(total - paid, 0)
  const over     = Math.max(paid - total, 0)
  let   status: SOA['status'] = 'UNPAID'
  if (paid >= total && total > 0) status = over > 0 ? 'OVERPAID' : 'PAID'
  else if (paid > 0)              status = 'PARTIAL'
  return { total, paid, balance, over, status }
}

const CHARGE_TYPES = ['TUITION', 'LAB', 'MISC', 'FINE', 'OTHER']
const PAYMENT_METHODS = [
  { value: 'CASH',   label: 'Cash (Walk-in)' },
  { value: 'GCASH',  label: 'GCash' },
  { value: 'ONLINE', label: 'Online Transfer' },
  { value: 'BANK',   label: 'Bank Deposit' },
]

export default function SOADetailPage({ params }: { params: { studentId: string } }) {
  const { studentId } = params
  const { data: session } = useSession()
  const cashier = (session?.user as { name?: string })?.name ?? 'Treasury Staff'

  const activeSem = MOCK_SEMESTERS.find((s) => s.isActive)
  const student   = MOCK_STUDENTS.find((s) => s.id === studentId)
  const studentName = student ? fullName(student) : 'Unknown Student'
  const studentNo   = student?.studentId ?? studentId

  // Find or initialise SOA in MOCK_SOA
  const existingIdx = MOCK_SOA.findIndex((s) => s.studentId === studentId && s.semesterId === activeSem?.id)
  const initSOA: SOA = existingIdx >= 0 ? MOCK_SOA[existingIdx] : {
    id: `soa_new_${studentId}`,
    totalAmount: 0, paidAmount: 0, balance: 0, overpayment: 0,
    status: 'UNPAID',
    studentId, student,
    semesterId: activeSem?.id ?? 'sem_1', semester: activeSem,
    items: [], payments: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }

  const [soa, setSOA] = useState<SOA>(initSOA)

  // Modals
  const [chargeModal, setChargeModal]   = useState(false)
  const [payModal,    setPayModal]      = useState(false)
  const [voidItem,    setVoidItem]      = useState<SOAItem | null>(null)
  const [applyModal,  setApplyModal]    = useState(false)
  const [refundModal, setRefundModal]   = useState(false)
  const [saving,      setSaving]        = useState(false)
  const [toast,       setToast]         = useState('')

  // Charge form
  const [chargeDesc,   setChargeDesc]   = useState('')
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeType,   setChargeType]   = useState('TUITION')

  // Payment form
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('CASH')
  const [payRef,    setPayRef]    = useState('')
  const [payNotes,  setPayNotes]  = useState('')

  // Void form
  const [voidReason, setVoidReason] = useState('')

  // Refund form
  const [refundAmount, setRefundAmount] = useState('')
  const [refundNotes,  setRefundNotes]  = useState('')

  if (!student) return <div className="py-20 text-center text-slate-500">Student not found.</div>

  const { total, paid, balance, over, status } = computeSOA(soa)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  function syncSOA(updated: SOA) {
    const c = computeSOA(updated)
    const synced: SOA = { ...updated, totalAmount: c.total, paidAmount: c.paid, balance: c.balance, overpayment: c.over, status: c.status, updatedAt: new Date().toISOString() }
    setSOA(synced)
    // Upsert into MOCK_SOA
    const idx = MOCK_SOA.findIndex((s) => s.id === synced.id)
    if (idx >= 0) MOCK_SOA[idx] = synced
    else MOCK_SOA.push(synced)
  }

  // ── Add charge ─────────────────────────────────────────────────────────────
  async function handleAddCharge() {
    if (!chargeDesc.trim() || !chargeAmount || isNaN(+chargeAmount) || +chargeAmount <= 0) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    const newItem: SOAItem = {
      id:          `item_${++nextItemId}`,
      soaId:       soa.id,
      description: chargeDesc.trim(),
      amount:      +chargeAmount,
      type:        chargeType,
      createdAt:   new Date().toISOString(),
    }
    const updated = { ...soa, items: [...(soa.items ?? []), newItem] }
    syncSOA(updated)
    pushLog({ type: 'CHARGE_ADDED', amount: +chargeAmount, description: `Added charge: ${chargeDesc.trim()}`, studentId, studentName: studentName, studentNo: studentNo, soaId: soa.id, itemId: newItem.id, cashier })
    setChargeModal(false); setChargeDesc(''); setChargeAmount(''); setChargeType('TUITION')
    showToast(`Charge of ${formatCurrency(+chargeAmount)} added.`)
    setSaving(false)
  }

  // ── Receive payment ────────────────────────────────────────────────────────
  async function handlePayment() {
    const amt = +payAmount
    if (!amt || amt <= 0) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    const receipt = generateReceiptNumber()
    const newPayment: Payment = {
      id:             `pay_${++nextPayId}`,
      soaId:          soa.id,
      amount:         amt,
      method:         payMethod as Payment['method'],
      status:         'VALIDATED',
      receiptNumber:  receipt,
      referenceNumber: payRef.trim() || undefined,
      notes:          payNotes.trim() || undefined,
      validatedBy:    cashier,
      validatedAt:    new Date().toISOString(),
      createdAt:      new Date().toISOString(),
    }
    const updated = { ...soa, payments: [...(soa.payments ?? []), newPayment] }
    syncSOA(updated)
    const overpaidBy = Math.max(amt - balance, 0)
    pushLog({ type: 'PAYMENT_RECEIVED', amount: amt, description: `Payment received via ${payMethod} · OR: ${receipt}${overpaidBy > 0 ? ` (overpayment: ${formatCurrency(overpaidBy)})` : ''}`, studentId, studentName: studentName, studentNo: studentNo, soaId: soa.id, paymentId: newPayment.id, cashier, referenceNumber: payRef.trim() || receipt, notes: payNotes.trim() || undefined })
    setPayModal(false); setPayAmount(''); setPayRef(''); setPayNotes('')
    showToast(`Payment of ${formatCurrency(amt)} validated. OR: ${receipt}${overpaidBy > 0 ? ` · Overpayment: ${formatCurrency(overpaidBy)}` : ''}`)
    setSaving(false)
  }

  // ── Void charge ────────────────────────────────────────────────────────────
  async function handleVoid() {
    if (!voidItem || !voidReason.trim()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    const updated = {
      ...soa,
      items: (soa.items ?? []).map((i) => i.id === voidItem.id
        ? { ...i, voided: true, voidReason: voidReason.trim(), voidedBy: cashier, voidedAt: new Date().toISOString() }
        : i,
      ),
    }
    syncSOA(updated)
    pushLog({ type: 'CHARGE_VOIDED', amount: voidItem.amount, description: `Voided: ${voidItem.description} — Reason: ${voidReason.trim()}`, studentId, studentName: studentName, studentNo: studentNo, soaId: soa.id, itemId: voidItem.id, cashier, notes: voidReason.trim() })
    setVoidItem(null); setVoidReason('')
    showToast(`Charge "${voidItem.description}" has been voided.`)
    setSaving(false)
  }

  // ── Apply overpayment ──────────────────────────────────────────────────────
  async function handleApplyOverpayment() {
    if (over <= 0) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    pushLog({ type: 'OVERPAYMENT_APPLIED', amount: over, description: `Overpayment of ${formatCurrency(over)} applied as credit to next semester`, studentId, studentName: studentName, studentNo: studentNo, soaId: soa.id, cashier })
    setApplyModal(false)
    showToast(`Overpayment of ${formatCurrency(over)} applied as credit.`)
    setSaving(false)
  }

  // ── Issue refund ───────────────────────────────────────────────────────────
  async function handleRefund() {
    const amt = +refundAmount
    if (!amt || amt <= 0 || amt > over) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    pushLog({ type: 'REFUND_ISSUED', amount: amt, description: `Refund of ${formatCurrency(amt)} issued${refundNotes.trim() ? ` — ${refundNotes.trim()}` : ''}`, studentId, studentName: studentName, studentNo: studentNo, soaId: soa.id, cashier, notes: refundNotes.trim() || undefined })
    setRefundModal(false); setRefundAmount(''); setRefundNotes('')
    showToast(`Refund of ${formatCurrency(amt)} recorded.`)
    setSaving(false)
  }

  const activeItems  = soa.items?.filter((i) => !i.voided) ?? []
  const voidedItems  = soa.items?.filter((i) => i.voided)  ?? []
  const tuitionItems = activeItems.filter((i) => i.type === 'TUITION')
  const labItems     = activeItems.filter((i) => i.type === 'LAB')
  const miscItems    = activeItems.filter((i) => i.type === 'MISC')
  const otherItems   = activeItems.filter((i) => i.type === 'FINE' || i.type === 'OTHER')

  const payAmt = parseFloat(payAmount) || 0
  const overpayPreview = payAmt > balance ? payAmt - balance : 0

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/staff/treasury" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Treasury
      </Link>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{toast}</p>
        </div>
      )}

      {/* ── Student header ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar name={studentName} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{studentName}</h1>
                <p className="text-sm text-slate-500">{studentNo} · {student.program?.name} · {activeSem?.name}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <SOABadge status={status} />
                <Button variant="outline" size="sm" icon={<Printer className="h-3.5 w-3.5" />}>Print SOA</Button>
                <Button variant="soft"    size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setChargeModal(true)}>Add Charge</Button>
                {balance > 0 && (
                  <Button size="sm" variant="success" icon={<Receipt className="h-3.5 w-3.5" />} onClick={() => { setPayAmount(''); setPayModal(true) }}>
                    Receive Payment
                  </Button>
                )}
              </div>
            </div>

            {/* Balance summary */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center rounded-xl bg-slate-50 border border-[#e4ebf5] p-3">
                <p className="text-xs text-slate-500">Total Billed</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(total)}</p>
              </div>
              <div className="text-center rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                <p className="text-xs text-emerald-600">Amount Paid</p>
                <p className="text-lg font-bold text-emerald-700 tabular-nums">{formatCurrency(paid)}</p>
              </div>
              {over > 0 ? (
                <div className="text-center rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <p className="text-xs text-blue-500">Overpayment</p>
                  <p className="text-lg font-bold text-blue-700 tabular-nums">+{formatCurrency(over)}</p>
                </div>
              ) : (
                <div className={`text-center rounded-xl p-3 border ${balance > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-[#e4ebf5]'}`}>
                  <p className={`text-xs ${balance > 0 ? 'text-red-500' : 'text-slate-500'}`}>Balance Due</p>
                  <p className={`text-lg font-bold tabular-nums ${balance > 0 ? 'text-red-700' : 'text-slate-900'}`}>{formatCurrency(balance)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Overpayment action bar */}
      {over > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 px-5 py-3.5">
          <CreditCard className="h-4 w-4 text-blue-500 shrink-0" />
          <p className="flex-1 text-sm text-blue-800">
            This student has an overpayment of <strong>{formatCurrency(over)}</strong>.
          </p>
          <Button size="sm" variant="soft" onClick={() => { setRefundAmount(String(over)); setRefundModal(true) }} icon={<RotateCcw className="h-3.5 w-3.5" />}>Refund</Button>
          <Button size="sm" onClick={() => setApplyModal(true)} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>Apply as Credit</Button>
        </div>
      )}

      {/* Pipeline */}
      <Card>
        <p className="text-xs text-slate-400 mb-2 font-medium">Payment Pipeline</p>
        <ProcessFlow
          statuses={{ admissions: 'completed', registrar: 'completed', treasury: status === 'PAID' || status === 'OVERPAID' ? 'completed' : 'active', sis: status === 'PAID' || status === 'OVERPAID' ? 'completed' : 'pending', lms: 'pending' }}
          sublabels={{ treasury: status === 'PAID' ? 'Fully Paid ✓' : status === 'OVERPAID' ? 'Overpaid ✓' : status === 'PARTIAL' ? 'Partial payment' : 'Awaiting payment' }}
        />
      </Card>

      {/* ── Charges breakdown ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-900">Statement of Account</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">ID: {studentNo}</p>
            <Button variant="soft" size="xs" icon={<Plus className="h-3 w-3" />} onClick={() => setChargeModal(true)}>Add Charge</Button>
          </div>
        </div>

        {(soa.items ?? []).length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No charges yet.</p>
            <button onClick={() => setChargeModal(true)} className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium">+ Add first charge</button>
          </div>
        )}

        {[
          { title: 'Tuition Fees',        items: tuitionItems, color: 'bg-blue-50 text-blue-700' },
          { title: 'Laboratory Fees',     items: labItems,     color: 'bg-orange-50 text-orange-700' },
          { title: 'Miscellaneous Fees',  items: miscItems,    color: 'bg-slate-100 text-slate-700' },
          { title: 'Fines & Others',      items: otherItems,   color: 'bg-red-50 text-red-700' },
        ].map((group) => group.items.length > 0 && (
          <div key={group.title} className="mb-5">
            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold mb-2 ${group.color}`}>{group.title}</span>
            <div className="space-y-1">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 group/row">
                  <p className="text-sm text-slate-700 flex-1">{item.description}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(item.amount)}</p>
                    <button
                      onClick={() => { setVoidItem(item); setVoidReason('') }}
                      className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-all rounded px-1.5 py-0.5 hover:bg-red-50"
                      title="Void this charge"
                    >
                      <Trash2 className="h-3 w-3" /> Void
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Totals */}
        {activeItems.length > 0 && (
          <div className="border-t border-slate-200 pt-3 mt-3 space-y-1.5">
            <div className="flex justify-between px-3">
              <p className="text-sm font-bold text-slate-900">TOTAL</p>
              <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(total)}</p>
            </div>
            <div className="flex justify-between px-3">
              <p className="text-sm text-emerald-600">Amount Paid</p>
              <p className="text-sm font-medium text-emerald-600 tabular-nums">({formatCurrency(paid)})</p>
            </div>
            {over > 0 ? (
              <div className="flex justify-between px-3 pt-2 border-t border-slate-200 text-blue-600">
                <p className="text-sm font-bold">OVERPAYMENT</p>
                <p className="text-sm font-bold tabular-nums">+{formatCurrency(over)}</p>
              </div>
            ) : (
              <div className={`flex justify-between px-3 pt-2 border-t border-slate-200 ${balance > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                <p className="text-sm font-bold">BALANCE DUE</p>
                <p className="text-sm font-bold tabular-nums">{formatCurrency(balance)}</p>
              </div>
            )}
          </div>
        )}

        {/* Voided charges section */}
        {voidedItems.length > 0 && (
          <div className="mt-5 border-t border-dashed border-red-200 pt-4">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Voided Charges</p>
            <div className="space-y-1">
              {voidedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-red-50/50 opacity-60">
                  <div>
                    <p className="text-sm text-red-600 line-through">{item.description}</p>
                    <p className="text-xs text-red-400">Voided by {item.voidedBy} · {item.voidReason}</p>
                  </div>
                  <p className="text-sm text-red-400 line-through tabular-nums">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Payment history ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Payment History</h3>
          {balance > 0 && (
            <Button size="sm" variant="success" icon={<Receipt className="h-3.5 w-3.5" />} onClick={() => { setPayAmount(''); setPayModal(true) }}>
              Receive Payment
            </Button>
          )}
        </div>
        {(soa.payments?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {soa.payments?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#e4ebf5] px-4 py-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${p.status === 'VALIDATED' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                  <CheckCircle2 className={`h-4 w-4 ${p.status === 'VALIDATED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(p.amount)}</p>
                    <PaymentBadge status={p.status} />
                    <span className="text-xs text-slate-500 font-medium">{p.method}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {p.receiptNumber   && <p className="text-xs text-slate-500">OR: <span className="font-mono">{p.receiptNumber}</span></p>}
                    {p.referenceNumber && <p className="text-xs text-slate-500">Ref: {p.referenceNumber}</p>}
                    {p.notes           && <p className="text-xs text-slate-400 italic">{p.notes}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {p.validatedBy && <p className="text-xs font-semibold text-slate-600">{p.validatedBy}</p>}
                  {p.validatedAt && <p className="text-xs text-slate-400">{formatDateTime(p.validatedAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Add Charge */}
      <Modal open={chargeModal} onClose={() => setChargeModal(false)} title="Add Charge" description={studentName} size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setChargeModal(false)}>Cancel</Button>
          <Button onClick={handleAddCharge} loading={saving} disabled={!chargeDesc.trim() || !chargeAmount || +chargeAmount <= 0} icon={<Plus className="h-4 w-4" />}>Add Charge</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Charge Type" value={chargeType} onChange={(e) => setChargeType(e.target.value)}>
            {CHARGE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </Select>
          <Input label="Description *" placeholder="e.g. Tuition Fee — 18 units" value={chargeDesc} onChange={(e) => setChargeDesc(e.target.value)} />
          <Input label="Amount (₱) *" type="number" placeholder="0.00" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">This action will be logged under your name ({cashier}).</p>
          </div>
        </div>
      </Modal>

      {/* Receive Payment */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Receive Payment" description={studentName} size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setPayModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handlePayment} loading={saving} disabled={!payAmount || +payAmount <= 0} icon={<CheckCircle2 className="h-4 w-4" />}>Validate Payment</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 border border-[#e4ebf5] px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">Balance Due</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(balance)}</p>
            </div>
            {over > 0 && (
              <div>
                <p className="text-xs text-blue-500">Existing Credit</p>
                <p className="text-lg font-bold text-blue-600 tabular-nums">+{formatCurrency(over)}</p>
              </div>
            )}
          </div>

          <Input label="Amount Received (₱) *" type="number" placeholder="0.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />

          {/* Overpayment preview */}
          {overpayPreview > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700">
                Payment exceeds balance by <strong>{formatCurrency(overpayPreview)}</strong> — this will be recorded as an overpayment/credit.
              </p>
            </div>
          )}

          <Select label="Payment Method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>

          {payMethod !== 'CASH' && (
            <Input label="Reference Number" placeholder="Transaction ref #" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
          )}

          <Textarea label="Notes (optional)" placeholder="Any remarks…" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={2} />

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Logged under: <strong>{cashier}</strong>. A receipt number will be auto-generated.</p>
          </div>
        </div>
      </Modal>

      {/* Void Charge */}
      <Modal open={!!voidItem} onClose={() => { setVoidItem(null); setVoidReason('') }} title="Void Charge" description={voidItem?.description} size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setVoidItem(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleVoid} loading={saving} disabled={!voidReason.trim()} icon={<Trash2 className="h-4 w-4" />}>Void Charge</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-xs text-red-500">Charge to void</p>
            <p className="text-base font-bold text-red-800">{voidItem?.description}</p>
            <p className="text-sm text-red-600 font-semibold tabular-nums">{formatCurrency(voidItem?.amount ?? 0)}</p>
          </div>
          <Textarea label="Void Reason *" placeholder="Explain why this charge is being voided…" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} rows={3} />
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Voiding is irreversible. This will be logged under <strong>{cashier}</strong>.</p>
          </div>
        </div>
      </Modal>

      {/* Apply Overpayment */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Apply Overpayment" description="Apply credit to next semester's charges" size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setApplyModal(false)}>Cancel</Button>
          <Button onClick={handleApplyOverpayment} loading={saving} icon={<CheckCircle2 className="h-4 w-4" />}>Apply Credit</Button>
        </>}
      >
        <div className="space-y-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-xs text-blue-500">Overpayment Amount</p>
            <p className="text-2xl font-bold text-blue-700 tabular-nums">{formatCurrency(over)}</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            This overpayment will be recorded as a credit on the student's account and applied to the next semester's billing. This action is logged.
          </p>
        </div>
      </Modal>

      {/* Refund */}
      <Modal open={refundModal} onClose={() => setRefundModal(false)} title="Issue Refund" description={studentName} size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setRefundModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleRefund} loading={saving} disabled={!refundAmount || +refundAmount <= 0 || +refundAmount > over} icon={<RotateCcw className="h-4 w-4" />}>Issue Refund</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-xs text-blue-500">Available Overpayment</p>
            <p className="text-xl font-bold text-blue-700 tabular-nums">{formatCurrency(over)}</p>
          </div>
          <Input label="Refund Amount (₱) *" type="number" max={over} placeholder="0.00" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} hint={`Max: ${formatCurrency(over)}`} />
          <Textarea label="Notes" placeholder="Reason for refund…" value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} rows={2} />
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Logged under <strong>{cashier}</strong>. Ensure cash is handed to the student before confirming.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
