'use client'

import { useState } from 'react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { MOCK_HR_EMPLOYEES, MOCK_JOB_POSTINGS } from '@/lib/mock-data'
import type { HREmployee, HREmploymentStatus, EmploymentType, WorkSetup } from '@/types'
import { Users, UserPlus, Search, Filter, Eye, Building2, Briefcase, MapPin } from 'lucide-react'

const STATUS_BADGE: Record<HREmploymentStatus, string> = {
  ACTIVE:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ON_LEAVE:   'bg-amber-50 text-amber-700 ring-amber-200',
  TERMINATED: 'bg-red-50 text-red-700 ring-red-200',
  RESIGNED:   'bg-slate-100 text-slate-600 ring-slate-200',
  RETIRED:    'bg-blue-50 text-blue-700 ring-blue-200',
}

const STATUS_LABEL: Record<HREmploymentStatus, string> = {
  ACTIVE: 'Active', ON_LEAVE: 'On Leave', TERMINATED: 'Terminated', RESIGNED: 'Resigned', RETIRED: 'Retired',
}

const EMP_TYPE_BADGE: Record<EmploymentType, string> = {
  FULL_TIME:    'bg-brand-50 text-brand-600 ring-brand-200',
  PART_TIME:    'bg-violet-50 text-violet-700 ring-violet-200',
  CONTRACT:     'bg-orange-50 text-orange-700 ring-orange-200',
  PROBATIONARY: 'bg-amber-50 text-amber-700 ring-amber-200',
  CASUAL:       'bg-slate-100 text-slate-600 ring-slate-200',
}

const EMP_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract', PROBATIONARY: 'Probationary', CASUAL: 'Casual',
}

const WORK_SETUP_BADGE: Record<WorkSetup, string> = {
  ON_SITE: 'bg-slate-100 text-slate-600 ring-slate-200',
  HYBRID:  'bg-blue-50 text-blue-700 ring-blue-200',
  REMOTE:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const WORK_SETUP_LABEL: Record<WorkSetup, string> = {
  ON_SITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote',
}

const DEPARTMENTS = Array.from(new Set(MOCK_JOB_POSTINGS.map((j) => j.department)))

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function generateEmployeeNo(): string {
  const year = new Date().getFullYear()
  const existing = MOCK_HR_EMPLOYEES.filter((e) => e.employeeNo.startsWith(`EMP-${year}-`))
  const maxSeq = existing.reduce((max, e) => {
    const seq = parseInt(e.employeeNo.split('-')[2] ?? '0', 10)
    return seq > max ? seq : max
  }, 0)
  return `EMP-${year}-${String(maxSeq + 1).padStart(3, '0')}`
}

interface AddEmployeeForm {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  employmentType: EmploymentType
  workSetup: WorkSetup
  startDate: string
  salary: string
  status: HREmploymentStatus
}

const EMPTY_FORM: AddEmployeeForm = {
  firstName: '', middleName: '', lastName: '', email: '', phone: '',
  position: '', department: DEPARTMENTS[0] ?? '',
  employmentType: 'FULL_TIME', workSetup: 'ON_SITE',
  startDate: '', salary: '', status: 'ACTIVE',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<HREmployee[]>(MOCK_HR_EMPLOYEES)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<AddEmployeeForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const now = new Date()
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length
  const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length
  const newThisMonth = employees.filter((e) => {
    const d = new Date(e.startDate)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length

  const allDepts = Array.from(new Set(employees.map((e) => e.department))).sort()

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.firstName.toLowerCase().includes(q) || e.lastName.toLowerCase().includes(q) || e.employeeNo.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    const matchDept = deptFilter === 'all' || e.department === deptFilter
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    const matchType = typeFilter === 'all' || e.employmentType === typeFilter
    return matchSearch && matchDept && matchStatus && matchType
  })

  function handleAdd() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.position.trim() || !form.startDate) {
      setFormError('First name, last name, email, position, and start date are required.')
      return
    }
    const newEmp: HREmployee = {
      id: `emp_${Date.now()}`,
      employeeNo: generateEmployeeNo(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim() || undefined,
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      position: form.position.trim(),
      department: form.department,
      employmentType: form.employmentType,
      workSetup: form.workSetup,
      status: form.status,
      startDate: form.startDate,
      salary: form.salary ? Number(form.salary) : undefined,
      createdAt: new Date().toISOString(),
    }
    MOCK_HR_EMPLOYEES.push(newEmp)
    setEmployees([...MOCK_HR_EMPLOYEES])
    setShowModal(false)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  return (
    <div>
      <SectionTitle
        description="Manage all school staff and faculty employment records"
        actions={
          <button
            onClick={() => { setShowModal(true); setFormError('') }}
            className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </button>
        }
      >
        Employee Records
      </SectionTitle>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{activeCount}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0 ml-3">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">On Leave</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{onLeaveCount}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0 ml-3">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Headcount</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{employees.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-500 shrink-0 ml-3">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">New This Month</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{newThisMonth}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shrink-0 ml-3">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </div>

      <Card padding="none" className="mb-0">
        <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-[#e4ebf5]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or employee no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#dce8f7] bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            >
              <option value="all">All Departments</option>
              {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
              <option value="RESIGNED">Resigned</option>
              <option value="RETIRED">Retired</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            >
              <option value="all">All Types</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-700 uppercase tracking-widest">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-700 uppercase tracking-widest">Position & Dept</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-700 uppercase tracking-widest">Employment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-700 uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-700 uppercase tracking-widest">Start Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-700 uppercase tracking-widest">Salary</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-700 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-[#f0f4fa] hover:bg-brand-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold shrink-0">
                        {getInitials(emp.firstName, emp.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{emp.firstName} {emp.middleName ? `${emp.middleName} ` : ''}{emp.lastName}</p>
                        <p className="text-xs text-slate-500 font-mono">{emp.employeeNo}</p>
                        <p className="text-xs text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{emp.position}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      <p className="text-xs text-slate-500">{emp.department}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset mt-0.5', WORK_SETUP_BADGE[emp.workSetup])}>
                        {WORK_SETUP_LABEL[emp.workSetup]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', EMP_TYPE_BADGE[emp.employmentType])}>
                      {EMP_TYPE_LABEL[emp.employmentType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', STATUS_BADGE[emp.status])}>
                      {STATUS_LABEL[emp.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{formatDate(emp.startDate)}</td>
                  <td className="px-4 py-3 text-slate-700 text-sm font-medium tabular-nums">
                    {emp.salary ? formatCurrency(emp.salary) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/staff/hr/employees/${emp.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold px-3 py-1.5 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No employees match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-900/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e4ebf5]">
              <span className="w-[3px] h-6 rounded-full bg-brand-500 shrink-0" />
              <h2 className="text-base font-bold text-slate-900">Add Employee</h2>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Dela Cruz"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={form.middleName}
                  onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  placeholder="juan@school.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  placeholder="09171234567"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Position *</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  placeholder="e.g. Faculty Instructor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                >
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employment Type</label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as EmploymentType }))}
                    className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  >
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="PROBATIONARY">Probationary</option>
                    <option value="CASUAL">Casual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Work Setup</label>
                  <select
                    value={form.workSetup}
                    onChange={(e) => setForm((f) => ({ ...f, workSetup: e.target.value as WorkSetup }))}
                    className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  >
                    <option value="ON_SITE">On-site</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Salary (PHP)</label>
                  <input
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                    placeholder="e.g. 30000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as HREmploymentStatus }))}
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave (Probationary)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e4ebf5]">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError('') }}
                className="rounded-xl border border-[#dce8f7] bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 transition-colors"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
