'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search, ArrowRight, TrendingUp, AlertCircle,
  Banknote, UserCheck, CreditCard, Clock, Users,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SOABadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { MOCK_SOA, MOCK_STUDENTS, MOCK_TREASURY_LOGS, MOCK_SEMESTERS } from '@/lib/mock-data'
import { fullName, formatCurrency, formatDateTime } from '@/lib/utils'

const TX_LABELS: Record<string, { label: string; color: string }> = {
  CHARGE_ADDED:          { label: 'Charge Added',         color: 'text-amber-600 bg-amber-50 border-amber-200' },
  CHARGE_VOIDED:         { label: 'Charge Voided',        color: 'text-red-600 bg-red-50 border-red-200' },
  PAYMENT_RECEIVED:      { label: 'Payment Received',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  OVERPAYMENT_APPLIED:   { label: 'Overpayment Applied',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  REFUND_ISSUED:         { label: 'Refund Issued',        color: 'text-violet-600 bg-violet-50 border-violet-200' },
}

export default function TreasuryPage() {
  const { data: session } = useSession()
  const cashier = (session?.user as { name?: string })?.name ?? 'Treasury Staff'

  const [query, setQuery] = useState('')
  const activeSem = MOCK_SEMESTERS.find((s) => s.isActive)

  // Live read from module-level mutable array
  const [, forceUpdate] = useState(0)
  const logs = MOCK_TREASURY_LOGS

  // Collection stats — from logs this session
  const todayPayments = logs.filter((l) => l.type === 'PAYMENT_RECEIVED')
  const todayTotal    = todayPayments.reduce((s, l) => s + l.amount, 0)
  const pendingCount  = MOCK_SOA.filter((s) => s.status === 'UNPAID' || s.status === 'PARTIAL').length
  const overpaidCount = MOCK_SOA.filter((s) => s.overpayment > 0).length

  // Student search
  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return MOCK_STUDENTS.filter(
      (s) => fullName(s).toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q),
    ).slice(0, 6)
  }, [query])

  function getStudentSOA(studentId: string) {
    return MOCK_SOA.find((s) => s.studentId === studentId && s.semesterId === activeSem?.id)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <SectionTitle description={`Cashier · ${cashier} · ${activeSem?.name ?? 'Current Semester'}`}>
        Treasury
      </SectionTitle>

      {/* ── Collection summary ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Collected This Session', value: formatCurrency(todayTotal), icon: TrendingUp,   color: 'bg-emerald-50 text-emerald-600', sub: `${todayPayments.length} payment${todayPayments.length !== 1 ? 's' : ''}` },
          { label: 'Pending Accounts',       value: pendingCount,               icon: AlertCircle,  color: 'bg-amber-50 text-amber-600',    sub: 'Unpaid or partial' },
          { label: 'Overpaid Accounts',      value: overpaidCount,              icon: CreditCard,   color: 'bg-blue-50 text-blue-600',      sub: 'Credit balance' },
          { label: 'Total Accounts',         value: MOCK_SOA.length,            icon: Users,        color: 'bg-brand-50 text-brand-600',    sub: 'This semester' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-card">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            <p className="text-xs font-medium text-slate-700 mt-1">{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* ── Student search / cashier ─────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-4 w-4 text-brand-500 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">Cashier — Find Student</h3>
            </div>
            <Input
              placeholder="Search by name or student ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {searchResults.map((student) => {
                  const soa = getStudentSOA(student.id)
                  return (
                    <Link
                      key={student.id}
                      href={`/staff/treasury/soa/${student.id}`}
                      className="flex items-center gap-3 rounded-xl border border-[#e4ebf5] px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition-all group"
                    >
                      <Avatar name={fullName(student)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 truncate">{fullName(student)}</p>
                        <p className="text-xs text-slate-400">{student.studentId} · {student.program?.code}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {soa ? (
                          <>
                            <SOABadge status={soa.status} />
                            {soa.balance > 0 && (
                              <p className="text-xs font-bold text-red-600 mt-0.5">{formatCurrency(soa.balance)} due</p>
                            )}
                            {soa.overpayment > 0 && (
                              <p className="text-xs font-bold text-blue-600 mt-0.5">+{formatCurrency(soa.overpayment)} credit</p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No billing</span>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500 shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}

            {query.trim() && searchResults.length === 0 && (
              <p className="mt-3 text-center text-sm text-slate-400 py-4">No students found.</p>
            )}
          </Card>

        </div>

        {/* ── Recent transactions ──────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
              <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
              <Link href="/staff/treasury/logs" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-5">
                <Clock className="h-8 w-8 text-slate-200" />
                <p className="text-sm font-medium text-slate-400">No transactions yet</p>
                <p className="text-xs text-slate-300 text-center">Search for a student above to begin processing.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f4fa]">
                {[...logs].reverse().slice(0, 8).map((log) => {
                  const meta = TX_LABELS[log.type] ?? { label: log.type, color: 'text-slate-600 bg-slate-100 border-slate-200' }
                  return (
                    <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                      <div className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${meta.color}`}>
                        {log.type === 'PAYMENT_RECEIVED' ? '₱' : log.type === 'CHARGE_VOIDED' ? 'V' : log.type === 'CHARGE_ADDED' ? '+' : '↩'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{log.studentName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{log.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{log.cashier} · {formatDateTime(log.createdAt)}</p>
                      </div>
                      <p className={`text-xs font-bold tabular-nums shrink-0 ${log.type === 'PAYMENT_RECEIVED' ? 'text-emerald-600' : log.type === 'CHARGE_VOIDED' ? 'text-red-500 line-through' : 'text-slate-700'}`}>
                        {formatCurrency(log.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
