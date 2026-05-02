'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, AlertCircle, CheckCircle2, CreditCard, Receipt } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { SOABadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { MOCK_SOA, MOCK_STUDENTS, MOCK_SEMESTERS } from '@/lib/mock-data'
import { fullName, formatCurrency, formatDate } from '@/lib/utils'

type AccountFilter = 'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID'

export default function StudentAccountsPage() {
  const [query,  setQuery]  = useState('')
  const [filter, setFilter] = useState<AccountFilter>('ALL')

  const activeSem = MOCK_SEMESTERS.find((s) => s.isActive)

  // Merge students with their SOA
  const accounts = useMemo(() => {
    return MOCK_STUDENTS.map((student) => {
      const soa = MOCK_SOA.find((s) => s.studentId === student.id && s.semesterId === activeSem?.id)
      return { student, soa }
    }).filter(({ soa }) => soa !== undefined) as { student: typeof MOCK_STUDENTS[0]; soa: typeof MOCK_SOA[0] }[]
  }, [activeSem])

  const filtered = useMemo(() => {
    return accounts.filter(({ student, soa }) => {
      if (filter === 'UNPAID'   && soa.status !== 'UNPAID')   return false
      if (filter === 'PARTIAL'  && soa.status !== 'PARTIAL')  return false
      if (filter === 'PAID'     && soa.status !== 'PAID')     return false
      if (filter === 'OVERPAID' && soa.overpayment <= 0)      return false
      const q = query.toLowerCase()
      return !q || fullName(student).toLowerCase().includes(q) || student.studentId.toLowerCase().includes(q)
    })
  }, [accounts, filter, query])

  // Summary stats
  const totalBalance     = accounts.reduce((s, { soa }) => s + soa.balance, 0)
  const totalOverpaid    = accounts.reduce((s, { soa }) => s + soa.overpayment, 0)
  const totalCollected   = accounts.reduce((s, { soa }) => s + soa.paidAmount, 0)
  const fullyPaidCount   = accounts.filter(({ soa }) => soa.status === 'PAID').length
  const overpaidCount    = accounts.filter(({ soa }) => soa.overpayment > 0).length

  return (
    <div className="space-y-6 max-w-6xl">
      <SectionTitle description={`${activeSem?.name ?? 'Current Semester'} · All student billing accounts`}>
        Student Accounts
      </SectionTitle>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Outstanding',  value: formatCurrency(totalBalance),   icon: AlertCircle,   color: 'bg-red-50 text-red-600',     sub: `${accounts.filter(({soa}) => soa.balance > 0).length} accounts` },
          { label: 'Total Collected',    value: formatCurrency(totalCollected),  icon: CheckCircle2,  color: 'bg-emerald-50 text-emerald-600', sub: `${fullyPaidCount} fully paid` },
          { label: 'Total Overpayments', value: formatCurrency(totalOverpaid),   icon: CreditCard,    color: 'bg-blue-50 text-blue-600',   sub: `${overpaidCount} accounts` },
          { label: 'Total Accounts',     value: accounts.length,                 icon: Receipt,       color: 'bg-brand-50 text-brand-600', sub: 'This semester' },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or student ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="w-72"
        />
        <div className="flex items-center gap-1 rounded-lg border border-[#e4ebf5] bg-white p-1">
          {(['ALL', 'UNPAID', 'PARTIAL', 'PAID', 'OVERPAID'] as AccountFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${filter === f ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of <span className="font-semibold text-slate-700">{accounts.length}</span> accounts
      </p>

      {/* Table */}
      <Card padding="none">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No accounts match the selected filter.</p>
        ) : (
          <Table>
            <Thead>
              <Th>Student</Th>
              <Th>Program</Th>
              <Th>Total Billed</Th>
              <Th>Amount Paid</Th>
              <Th>Balance Due</Th>
              <Th>Overpayment</Th>
              <Th>Status</Th>
              <Th>Last Payment</Th>
              <Th />
            </Thead>
            <Tbody>
              {filtered.map(({ student, soa }) => {
                const lastPayment = soa.payments?.filter((p) => p.status === 'VALIDATED').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
                return (
                  <Tr key={student.id} onClick={() => (window.location.href = `/staff/treasury/soa/${student.id}`)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullName(student)} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{fullName(student)}</p>
                          <p className="text-xs text-slate-400">{student.studentId}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-xs text-slate-500">{student.program?.code ?? '—'}</Td>
                    <Td className="font-medium text-slate-800">{formatCurrency(soa.totalAmount)}</Td>
                    <Td className="text-emerald-700 font-medium">{formatCurrency(soa.paidAmount)}</Td>
                    <Td>
                      <span className={`font-bold tabular-nums ${soa.balance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {formatCurrency(soa.balance)}
                      </span>
                    </Td>
                    <Td>
                      {soa.overpayment > 0
                        ? <span className="font-bold text-blue-600 tabular-nums">+{formatCurrency(soa.overpayment)}</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </Td>
                    <Td><SOABadge status={soa.status} /></Td>
                    <Td className="text-xs text-slate-400">{lastPayment ? formatDate(lastPayment.createdAt) : '—'}</Td>
                    <Td>
                      <Link
                        href={`/staff/treasury/soa/${student.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        <Receipt className="h-3.5 w-3.5" /> View SOA
                      </Link>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
