'use client'
import { Printer } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SOABadge, PaymentBadge } from '@/components/ui/Badge'
import { MOCK_SOA, MOCK_STUDENTS } from '@/lib/mock-data'
import { fullName, formatCurrency, formatDateTime } from '@/lib/utils'

const student = MOCK_STUDENTS[0]
const soa = MOCK_SOA.find((s) => s.studentId === student.id)

export default function StudentSOAPage() {
  if (!soa) return <div className="py-20 text-center text-slate-500">No SOA found for this semester.</div>

  const tuitionItems = soa.items?.filter((i) => i.type === 'TUITION') ?? []
  const labItems = soa.items?.filter((i) => i.type === 'LAB') ?? []
  const miscItems = soa.items?.filter((i) => i.type === 'MISC') ?? []

  return (
    <div className="max-w-2xl space-y-5">
      <SectionTitle description={soa.semester?.name} actions={<Button variant="outline" icon={<Printer className="h-4 w-4" />}>Print / Download</Button>}>
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
