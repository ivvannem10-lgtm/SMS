'use client'
import { Printer } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SOABadge, PaymentBadge } from '@/components/ui/Badge'
import { MOCK_SOA, MOCK_STUDENTS } from '@/lib/mock-data'
import { fullName, formatCurrency, formatDateTime, formatDate } from '@/lib/utils'

const student = MOCK_STUDENTS[0]
const soa = MOCK_SOA.find((s) => s.studentId === student.id)

export default function StudentSOAPage() {
  if (!soa) return <div className="py-20 text-center text-slate-500">No SOA found for this semester.</div>

  const tuitionItems = soa.items?.filter((i) => i.type === 'TUITION') ?? []
  const labItems = soa.items?.filter((i) => i.type === 'LAB') ?? []
  const miscItems = soa.items?.filter((i) => i.type === 'MISC') ?? []

  function handlePrint() {
    if (!soa) return
    const win = window.open('', '_blank', 'width=860,height=1100')
    if (!win) return

    const rowsHtml = (items: typeof tuitionItems) =>
      items.map(i => `<tr><td>${i.description}</td><td class="r">${formatCurrency(i.amount)}</td></tr>`).join('')

    const payRowsHtml = (payments: typeof soa.payments) =>
      (payments ?? []).filter(p => p.status === 'VALIDATED').map(p => `<tr>
        <td>${formatDate(p.createdAt)}</td>
        <td>${p.method}</td>
        <td class="mono">${p.receiptNumber ?? '—'}</td>
        <td class="r">${formatCurrency(p.amount)}</td>
      </tr>`).join('')

    const statusLabels: Record<string, string> = { PAID: 'FULLY PAID', PARTIAL: 'PARTIALLY PAID', UNPAID: 'UNPAID', OVERPAID: 'OVERPAID' }
    const statusClasses: Record<string, string> = { PAID: 'paid', PARTIAL: 'partial', UNPAID: 'unpaid', OVERPAID: 'over' }
    const sl = statusLabels[soa.status] ?? soa.status
    const sc = statusClasses[soa.status] ?? 'unpaid'
    const issued = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>SOA — ${fullName(student)}</title>
    <style>
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;padding:32px 40px}
      .top{text-align:center;border-bottom:2px solid #1a4a8a;padding-bottom:14px;margin-bottom:18px}
      .top h1{font-size:18px;color:#1a4a8a;font-weight:700}
      .top .sub{font-size:13px;font-weight:700;margin-top:2px}
      .top .sem{font-size:11px;color:#555;margin-top:2px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:16px}
      .info-grid .field{font-size:11px;color:#666}
      .info-grid .value{font-weight:600;font-size:13px}
      .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
      .box{border:1px solid #dce8f7;border-radius:6px;padding:10px 12px;text-align:center}
      .box .bl{font-size:10px;color:#888;margin-bottom:2px}
      .box .bv{font-size:15px;font-weight:700}
      .box.red .bv{color:#dc2626}.box.green .bv{color:#059669}
      h2{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 6px}
      .cat{font-size:10px;font-weight:700;color:#1a4a8a;text-transform:uppercase;letter-spacing:.05em;padding:8px 0 2px}
      table{width:100%;border-collapse:collapse;margin-bottom:4px}
      th{background:#f0f4fa;color:#1a4a8a;font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:6px 10px;text-align:left}
      td{padding:5px 10px;border-bottom:1px solid #f3f4f6}
      .r{text-align:right}.mono{font-family:monospace;font-size:11px}
      .total-row td{font-weight:700;background:#f9fafb;border-top:2px solid #e5e7eb}
      .paid-row td{color:#059669}
      .bal-row td{font-weight:700;color:${soa.balance > 0 ? '#dc2626' : '#059669'};border-top:1px solid #e5e7eb}
      .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;text-transform:uppercase;margin-left:6px}
      .badge.paid{background:#d1fae5;color:#065f46}.badge.partial{background:#fef3c7;color:#92400e}
      .badge.unpaid{background:#fee2e2;color:#991b1b}.badge.over{background:#dbeafe;color:#1e40af}
      .sigs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}
      .sig-block{text-align:center}
      .sig-line{border-top:1px solid #333;margin-top:36px;padding-top:4px;font-size:11px;color:#555}
      .fn{text-align:center;font-size:10px;color:#aaa;margin-top:20px;border-top:1px dashed #e5e7eb;padding-top:8px}
      @media print{@page{margin:1.5cm}}
    </style></head><body>
    <div class="top">
      <h1>SchoolEco University</h1>
      <div class="sub">STATEMENT OF ACCOUNT</div>
      <div class="sem">${soa.semester?.name ?? '1st Semester 2025–2026'} &nbsp;|&nbsp; Issued: ${issued}</div>
    </div>

    <div class="info-grid">
      <div><div class="field">Student Name</div><div class="value">${fullName(student)} <span class="badge ${sc}">${sl}</span></div></div>
      <div><div class="field">Student No.</div><div class="value">${student.studentId}</div></div>
      <div><div class="field">Program</div><div class="value">${student.program?.name ?? '—'}</div></div>
      <div><div class="field">Date Issued</div><div class="value">${issued}</div></div>
    </div>

    <div class="summary">
      <div class="box"><div class="bl">Total Amount</div><div class="bv">${formatCurrency(soa.totalAmount)}</div></div>
      <div class="box green"><div class="bl">Amount Paid</div><div class="bv">${formatCurrency(soa.paidAmount)}</div></div>
      <div class="box ${soa.balance > 0 ? 'red' : 'green'}"><div class="bl">Balance Due</div><div class="bv">${formatCurrency(soa.balance)}</div></div>
    </div>

    <h2>Billing Breakdown</h2>
    ${tuitionItems.length > 0 ? `<div class="cat">Tuition Fees</div><table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${rowsHtml(tuitionItems)}</tbody></table>` : ''}
    ${labItems.length > 0 ? `<div class="cat">Laboratory Fees</div><table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${rowsHtml(labItems)}</tbody></table>` : ''}
    ${miscItems.length > 0 ? `<div class="cat">Miscellaneous Fees</div><table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${rowsHtml(miscItems)}</tbody></table>` : ''}

    <table style="margin-top:10px">
      <tbody>
        <tr class="total-row"><td><strong>TOTAL AMOUNT</strong></td><td class="r"><strong>${formatCurrency(soa.totalAmount)}</strong></td></tr>
        <tr class="paid-row"><td>Amount Paid</td><td class="r">(${formatCurrency(soa.paidAmount)})</td></tr>
        <tr class="bal-row"><td><strong>BALANCE DUE</strong></td><td class="r"><strong>${formatCurrency(soa.balance)}</strong></td></tr>
      </tbody>
    </table>

    ${(soa.payments?.length ?? 0) > 0 ? `
    <h2 style="margin-top:20px">Payment History</h2>
    <table>
      <thead><tr><th>Date</th><th>Method</th><th>OR No.</th><th class="r">Amount</th></tr></thead>
      <tbody>${payRowsHtml(soa.payments)}</tbody>
    </table>` : ''}

    <div class="sigs">
      <div class="sig-block"><div class="sig-line">Cashier's Signature over Printed Name</div></div>
      <div class="sig-block"><div class="sig-line">Student's Signature over Printed Name</div></div>
    </div>
    <div class="fn">This is an official document. Keep this for your records.</div>
    </body></html>`)

    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <SectionTitle description={soa.semester?.name} actions={<Button variant="outline" icon={<Printer className="h-4 w-4" />} onClick={handlePrint}>Print / Download</Button>}>
        Statement of Account
      </SectionTitle>

      {/* Header card */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">{fullName(student)}</h2>
            <p className="text-sm text-slate-500">{student.studentId} · {student.program?.code}</p>
          </div>
          <SOABadge status={soa.status} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Total Amount</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(soa.totalAmount)}</p>
          </div>
          <div className="text-center rounded-xl bg-emerald-50 p-3">
            <p className="text-xs text-emerald-600">Amount Paid</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(soa.paidAmount)}</p>
          </div>
          <div className={`text-center rounded-xl p-3 ${soa.balance > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
            <p className={`text-xs ${soa.balance > 0 ? 'text-red-500' : 'text-slate-500'}`}>Balance</p>
            <p className={`text-xl font-bold ${soa.balance > 0 ? 'text-red-700' : 'text-slate-700'}`}>{formatCurrency(soa.balance)}</p>
          </div>
        </div>
        {soa.balance > 0 && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            ⚠ You have an outstanding balance. Please settle at the Treasury Office.
          </div>
        )}
      </Card>

      {/* Breakdown */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Billing Breakdown</h3>
        {[
          { title: 'Tuition Fees', items: tuitionItems, color: 'bg-blue-50 text-blue-700' },
          { title: 'Laboratory Fees', items: labItems, color: 'bg-orange-50 text-orange-700' },
          { title: 'Miscellaneous Fees', items: miscItems, color: 'bg-slate-100 text-slate-700' },
        ].map((group) => group.items.length > 0 && (
          <div key={group.title} className="mb-4">
            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold mb-2 ${group.color}`}>{group.title}</span>
            {group.items.map((item) => (
              <div key={item.id} className="flex justify-between px-3 py-1.5 text-sm hover:bg-slate-50 rounded-lg">
                <span className="text-slate-600">{item.description}</span>
                <span className="font-medium text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="border-t border-slate-200 pt-3 space-y-1 mt-2">
          <div className="flex justify-between px-3 font-bold"><span>TOTAL</span><span>{formatCurrency(soa.totalAmount)}</span></div>
          <div className="flex justify-between px-3 text-sm text-emerald-600"><span>Amount Paid</span><span>({formatCurrency(soa.paidAmount)})</span></div>
          <div className={`flex justify-between px-3 font-bold pt-1 border-t border-slate-200 ${soa.balance > 0 ? 'text-red-600' : ''}`}>
            <span>BALANCE DUE</span><span>{formatCurrency(soa.balance)}</span>
          </div>
        </div>
      </Card>

      {/* Payment history */}
      <Card>
        <h3 className="text-sm font-semibold mb-4">Payment History</h3>
        {(soa.payments?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {soa.payments?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(p.amount)}</span>
                    <PaymentBadge status={p.status} />
                    <span className="text-xs text-slate-400">{p.method}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.receiptNumber && <span className="text-xs text-slate-500">OR: {p.receiptNumber}</span>}
                    <span className="text-xs text-slate-400">{formatDateTime(p.validatedAt ?? p.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
