'use client'

import { useState, useMemo } from 'react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn, formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import {
  MOCK_OFFICIAL_RECEIPTS, MOCK_STUDENTS, nextORNumber, MOCK_AUDIT_LOGS,
} from '@/lib/mock-data'
import type { OfficialReceipt } from '@/types'
import { Receipt, Plus, Search, DollarSign, Users, CalendarDays, TrendingUp } from 'lucide-react'

const PAYMENT_TYPES = ['Tuition Fee', 'Partial Payment', 'Miscellaneous Fee', 'Laboratory Fee', 'Registration Fee', 'Other']

const today = new Date().toISOString().slice(0, 10)

export default function CollectionsPage() {
  const [receipts, setReceipts] = useState<OfficialReceipt[]>(MOCK_OFFICIAL_RECEIPTS)
  const [search, setSearch]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [typeFilter, setType]   = useState('ALL')
  const [addOpen, setAddOpen]   = useState(false)
  const [viewOR, setViewOR]     = useState<OfficialReceipt | null>(null)

  // Form state
  const [form, setForm] = useState({
    studentSearch: '', studentId: '', studentName: '', studentNo: '',
    amount: '', paymentType: PAYMENT_TYPES[0], notes: '',
  })
  const [saving, setSaving] = useState(false)

  const studentMatches = useMemo(() => {
    if (!form.studentSearch || form.studentSearch.length < 2) return []
    const q = form.studentSearch.toLowerCase()
    return MOCK_STUDENTS.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentId.includes(q)
    ).slice(0, 8)
  }, [form.studentSearch])

  const filtered = useMemo(() => {
    return receipts.filter(r => {
      const matchSearch = !search || r.orNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.studentName.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'ALL' || r.paymentType === typeFilter
      const matchFrom = !dateFrom || r.issuedAt >= dateFrom
      const matchTo   = !dateTo   || r.issuedAt <= dateTo + 'T23:59:59Z'
      return matchSearch && matchType && matchFrom && matchTo
    })
  }, [receipts, search, typeFilter, dateFrom, dateTo])

  const todayReceipts  = receipts.filter(r => r.issuedAt.startsWith(today) && !r.voidedAt)
  const totalToday     = todayReceipts.reduce((s, r) => s + r.amount, 0)
  const semesterTotal  = receipts.filter(r => !r.voidedAt).reduce((s, r) => s + r.amount, 0)
  const studentsPaid   = new Set(receipts.filter(r => !r.voidedAt).map(r => r.studentId)).size

  function handleRecord() {
    setSaving(true)
    setTimeout(() => {
      const orNumber = nextORNumber()
      const newOR: OfficialReceipt = {
        id: `or_${Date.now()}`,
        orNumber,
        studentId:   form.studentId,
        studentName: form.studentName,
        studentNo:   form.studentNo,
        amount:      parseFloat(form.amount) || 0,
        paymentType: form.paymentType,
        semesterId:  'sem_1',
        issuedBy:    'Treasury Staff',
        issuedAt:    new Date().toISOString(),
        schoolId:    'school_1',
      }
      MOCK_OFFICIAL_RECEIPTS.push(newOR)
      setReceipts([...MOCK_OFFICIAL_RECEIPTS])
      MOCK_AUDIT_LOGS.unshift({ id:`al_${Date.now()}`, action:'RECORD_PAYMENT', entity:'OfficialReceipt', entityId:newOR.id, details:`Recorded ₱${newOR.amount} for ${newOR.studentName}`, userId:'u_treasurer', schoolId:'school_1', createdAt:new Date().toISOString() })
      setForm({ studentSearch:'', studentId:'', studentName:'', studentNo:'', amount:'', paymentType:PAYMENT_TYPES[0], notes:'' })
      setSaving(false)
      setAddOpen(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      <SectionTitle description="Record and track student payment collections for the current semester."
        actions={<Button size="sm" icon={<Plus className="h-3.5 w-3.5"/>} onClick={() => setAddOpen(true)}>Record Payment</Button>}
      >Collections</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Collections" value={formatCurrency(totalToday)} sub={`${todayReceipts.length} transactions`} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total This Semester" value={formatCurrency(semesterTotal)} icon={TrendingUp} color="bg-brand-50 text-brand-500" />
        <StatCard label="Students Paid" value={studentsPaid} sub="unique students" icon={Users} color="bg-violet-50 text-violet-600" />
        <StatCard label="Total Receipts" value={receipts.filter(r=>!r.voidedAt).length} sub="active" icon={Receipt} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search OR # or student..."
              className="w-full pl-9 pr-3 h-8 text-sm border border-[#dce8f7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
          </div>
          <select value={typeFilter} onChange={e=>setType(e.target.value)}
            className="h-8 text-sm border border-[#dce8f7] rounded-lg px-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option value="ALL">All Types</option>
            {PAYMENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400"/>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              className="h-8 text-sm border border-[#dce8f7] rounded-lg px-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              className="h-8 text-sm border border-[#dce8f7] rounded-lg px-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table>
          <Thead>
            <Th>OR Number</Th>
            <Th>Student</Th>
            <Th>Amount</Th>
            <Th>Payment Type</Th>
            <Th>Date Issued</Th>
            <Th>Status</Th>
            <Th></Th>
          </Thead>
          <Tbody>
            {filtered.length === 0 && (
              <Tr><Td colSpan={7} className="text-center py-10 text-slate-400">No collections found.</Td></Tr>
            )}
            {filtered.map(r => (
              <Tr key={r.id}>
                <Td><span className="font-mono text-xs text-brand-600 font-semibold">{r.orNumber}</span></Td>
                <Td>
                  <p className="font-medium text-slate-800">{r.studentName}</p>
                  <p className="text-xs text-slate-400">{r.studentNo}</p>
                </Td>
                <Td><span className="font-semibold text-slate-800">{formatCurrency(r.amount)}</span></Td>
                <Td>{r.paymentType}</Td>
                <Td className="text-slate-500">{formatDateTime(r.issuedAt)}</Td>
                <Td>
                  {r.voidedAt
                    ? <Badge className="bg-red-50 text-red-600 ring-red-200">Voided</Badge>
                    : <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Valid</Badge>
                  }
                </Td>
                <Td>
                  <Button size="xs" variant="soft" onClick={() => setViewOR(r)}>View</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Record Payment Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record Payment" size="md"
        footer={<>
          <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="success" loading={saving} onClick={handleRecord}
            disabled={!form.studentId || !form.amount}>Record & Issue OR</Button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search Student</label>
            <input
              value={form.studentSearch}
              onChange={e => setForm(f => ({...f, studentSearch: e.target.value, studentId:'', studentName:'', studentNo:''}))}
              placeholder="Type student name or ID..."
              className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            {studentMatches.length > 0 && !form.studentId && (
              <div className="mt-1 border border-[#dce8f7] rounded-lg bg-white shadow-card overflow-hidden">
                {studentMatches.map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({...f,
                    studentId: s.id, studentName: `${s.firstName} ${s.lastName}`,
                    studentNo: s.studentId, studentSearch: `${s.firstName} ${s.lastName}`
                  }))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-brand-50 text-left border-b last:border-0 border-[#f0f4fa]">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-slate-400">{s.studentId}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {form.studentId && (
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Selected: {form.studentName} ({form.studentNo})</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (PHP)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f=>({...f, amount: e.target.value}))}
                placeholder="0.00" min="0"
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Type</label>
              <select value={form.paymentType} onChange={e => setForm(f=>({...f, paymentType: e.target.value}))}
                className="w-full h-9 text-sm border border-[#dce8f7] rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                {PAYMENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
            An Official Receipt will be automatically generated and numbered upon recording.
          </div>
        </div>
      </Modal>

      {/* View Receipt Modal */}
      <Modal open={!!viewOR} onClose={() => setViewOR(null)} title="Official Receipt" size="sm"
        footer={<>
          <Button variant="outline" onClick={() => { window.print() }}>Print</Button>
          <Button variant="outline" onClick={() => setViewOR(null)}>Close</Button>
        </>}
      >
        {viewOR && (
          <div className="space-y-3">
            <div className="text-center py-2 border-b border-[#e4ebf5]">
              <p className="text-xs text-slate-500">St. Dominic College</p>
              <p className="text-lg font-bold text-brand-600 font-mono">{viewOR.orNumber}</p>
            </div>
            {[
              ['Student', viewOR.studentName],
              ['Student No.', viewOR.studentNo],
              ['Amount', formatCurrency(viewOR.amount)],
              ['Payment Type', viewOR.paymentType],
              ['Issued By', viewOR.issuedBy],
              ['Date & Time', formatDateTime(viewOR.issuedAt)],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
            {viewOR.voidedAt && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 text-center font-semibold">
                VOIDED — {viewOR.voidReason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
