'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, Building2,
  FileText, ShieldCheck, AlertCircle, Edit2, Save, X, CheckCircle, Upload,
  CreditCard, Heart, BadgeCheck,
} from 'lucide-react'
import { MOCK_HR_EMPLOYEES, MOCK_HR_LEAVES, MOCK_HR_ONBOARDING } from '@/lib/mock-data'
import { cn, formatDate, formatCurrency, initials } from '@/lib/utils'
import type { HREmployee, HREmploymentStatus, EmploymentType, WorkSetup } from '@/types'

const STATUS_MAP: Record<HREmploymentStatus, { label: string; cls: string }> = {
  ACTIVE:     { label: 'Active',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  ON_LEAVE:   { label: 'On Leave',   cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  TERMINATED: { label: 'Terminated', cls: 'bg-red-50 text-red-700 ring-red-200' },
  RESIGNED:   { label: 'Resigned',   cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  RETIRED:    { label: 'Retired',    cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
}

const EMP_TYPE_MAP: Record<EmploymentType, string> = {
  FULL_TIME:    'Full-time',
  PART_TIME:    'Part-time',
  CONTRACT:     'Contract',
  PROBATIONARY: 'Probationary',
  CASUAL:       'Casual',
}

const WORK_MAP: Record<WorkSetup, { label: string; cls: string }> = {
  ON_SITE: { label: 'On-site', cls: 'bg-slate-100 text-slate-700' },
  HYBRID:  { label: 'Hybrid',  cls: 'bg-blue-50 text-blue-700' },
  REMOTE:  { label: 'Remote',  cls: 'bg-emerald-50 text-emerald-700' },
}

const TABS = ['Profile', 'Documents', 'Leave History', 'Onboarding'] as const
type Tab = typeof TABS[number]

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [employees, setEmployees] = useState(MOCK_HR_EMPLOYEES)
  const emp = employees.find((e) => e.id === params.id)
  const [tab, setTab] = useState<Tab>('Profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<HREmployee>>(emp ?? {})

  const leaves = MOCK_HR_LEAVES.filter((l) => l.employeeId === params.id)
  const onboarding = MOCK_HR_ONBOARDING.find((o) => o.employeeId === params.id)

  if (!emp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-600 font-medium">Employee not found</p>
        <Link href="/staff/hr/employees" className="mt-4 text-brand-600 text-sm hover:underline">Back to Employees</Link>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[emp.status]
  const workInfo = WORK_MAP[emp.workSetup]

  function saveEdits() {
    const idx = MOCK_HR_EMPLOYEES.findIndex((e) => e.id === params.id)
    if (idx >= 0) {
      Object.assign(MOCK_HR_EMPLOYEES[idx], form)
      setEmployees([...MOCK_HR_EMPLOYEES])
    }
    setEditing(false)
  }

  function Field({ label, value }: { label: string; value?: string | null }) {
    return (
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
      </div>
    )
  }

  function EditField({ label, field, type = 'text' }: { label: string; field: keyof HREmployee; type?: string }) {
    return (
      <div>
        <label className="text-xs text-slate-500 mb-0.5 block">{label}</label>
        <input
          type={type}
          value={(form[field] as string) ?? ''}
          onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
          className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15"
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/staff/hr/employees" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Employees
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{emp.firstName} {emp.lastName}</span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-brand-700 to-brand-900 relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        {/* Profile section — below banner */}
        <div className="px-6 pt-4 pb-5">
          <div className="flex items-start justify-between gap-4">
            {/* Avatar + name block */}
            <div className="flex items-center gap-4 -mt-10">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white text-2xl font-bold ring-4 ring-white shadow-xl">
                {initials(`${emp.firstName} ${emp.lastName}`)}
              </div>
              <div className="mt-10">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {emp.firstName} {emp.middleName ? emp.middleName[0] + '. ' : ''}{emp.lastName}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">{emp.position}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', statusInfo.cls)}>
                    {statusInfo.label}
                  </span>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', workInfo.cls)}>
                    {workInfo.label}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tracking-wide">{emp.employeeNo}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0 mt-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button onClick={saveEdits} className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </button>
                </>
              ) : (
                <button onClick={() => { setForm(emp); setEditing(true) }} className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Quick info row */}
          <div className="mt-4 pt-4 border-t border-[#f0f4fa] flex flex-wrap gap-4">
            {emp.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {emp.email}
              </div>
            )}
            {emp.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {emp.phone}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-slate-400" /> {emp.department}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {EMP_TYPE_MAP[emp.employmentType]}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> Since {formatDate(emp.startDate)}
            </div>
            {emp.salary && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                {formatCurrency(emp.salary)}/mo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('rounded-lg px-4 py-1.5 text-sm font-medium transition-all', tab === t ? 'bg-white shadow text-brand-700' : 'text-slate-600 hover:text-slate-800')}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-brand-500" /> Personal Information
            </h3>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="First Name" field="firstName" />
                <EditField label="Last Name" field="lastName" />
                <EditField label="Middle Name" field="middleName" />
                <EditField label="Birthday" field="birthday" type="date" />
                <div>
                  <label className="text-xs text-slate-500 mb-0.5 block">Gender</label>
                  <select value={form.gender ?? ''} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <EditField label="Phone" field="phone" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" value={emp.firstName} />
                <Field label="Last Name" value={emp.lastName} />
                <Field label="Middle Name" value={emp.middleName} />
                <Field label="Birthday" value={formatDate(emp.birthday)} />
                <Field label="Gender" value={emp.gender} />
                <Field label="Phone" value={emp.phone} />
              </div>
            )}
            {!editing && emp.address && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{emp.address}</p>
              </div>
            )}
            {editing && (
              <div className="mt-4">
                <EditField label="Address" field="address" />
              </div>
            )}
          </div>

          {/* Employment Details */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Briefcase className="h-4 w-4 text-brand-500" /> Employment Details
            </h3>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Position" field="position" />
                <div>
                  <label className="text-xs text-slate-500 mb-0.5 block">Department</label>
                  <select value={form.department ?? ''} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                    {['College of Computing','College of Business','College of Nursing','Arts & Sciences','Office of the Registrar','IT Services','Student Services','Human Resources','Finance'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-0.5 block">Employment Type</label>
                  <select value={form.employmentType ?? ''} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value as EmploymentType }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                    {(['FULL_TIME','PART_TIME','CONTRACT','PROBATIONARY','CASUAL'] as EmploymentType[]).map(t => <option key={t} value={t}>{EMP_TYPE_MAP[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-0.5 block">Status</label>
                  <select value={form.status ?? ''} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as HREmploymentStatus }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                    {(['ACTIVE','ON_LEAVE','TERMINATED','RESIGNED','RETIRED'] as HREmploymentStatus[]).map(s => <option key={s} value={s}>{STATUS_MAP[s].label}</option>)}
                  </select>
                </div>
                <EditField label="Start Date" field="startDate" type="date" />
                <div>
                  <label className="text-xs text-slate-500 mb-0.5 block">Monthly Salary</label>
                  <input type="number" value={form.salary ?? ''} onChange={(e) => setForm((p) => ({ ...p, salary: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Position" value={emp.position} />
                <Field label="Department" value={emp.department} />
                <Field label="Employment Type" value={EMP_TYPE_MAP[emp.employmentType]} />
                <Field label="Work Setup" value={workInfo.label} />
                <Field label="Start Date" value={formatDate(emp.startDate)} />
                <Field label="Monthly Salary" value={emp.salary ? formatCurrency(emp.salary) : '—'} />
              </div>
            )}
          </div>

          {/* Government IDs */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-brand-500" /> Government IDs
            </h3>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="SSS Number" field="sssNo" />
                <EditField label="PhilHealth Number" field="philhealthNo" />
                <EditField label="Pag-IBIG Number" field="pagibigNo" />
                <EditField label="TIN Number" field="tinNo" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="SSS Number" value={emp.sssNo} />
                <Field label="PhilHealth Number" value={emp.philhealthNo} />
                <Field label="Pag-IBIG Number" value={emp.pagibigNo} />
                <Field label="TIN Number" value={emp.tinNo} />
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Heart className="h-4 w-4 text-rose-500" /> Emergency Contact
            </h3>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Name" field="emergencyContactName" />
                <EditField label="Relation" field="emergencyContactRelation" />
                <EditField label="Phone" field="emergencyContactPhone" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={emp.emergencyContactName} />
                <Field label="Relation" value={emp.emergencyContactRelation} />
                <Field label="Phone" value={emp.emergencyContactPhone} />
              </div>
            )}
            {!editing && emp.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{emp.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-500" /> Employee Documents
            </h3>
            <button className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Upload className="h-3.5 w-3.5" /> Upload Document
            </button>
          </div>
          {(!emp.documents || emp.documents.length === 0) ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emp.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[#e4ebf5] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                      <FileText className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{doc.filename}</p>
                      <p className="text-xs text-slate-500">{doc.type} · Uploaded {formatDate(doc.uploadedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.verified ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <AlertCircle className="h-3.5 w-3.5" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Leave History' && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e4ebf5]">
            <h3 className="text-sm font-bold text-slate-900">Leave History</h3>
          </div>
          {leaves.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No leave requests on record.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                <tr>
                  {['Type', 'Period', 'Days', 'Status', 'Applied'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-bold uppercase tracking-widest text-brand-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4fa]">
                {leaves.map((l) => {
                  const leaveColors: Record<string, string> = {
                    SICK: 'bg-red-50 text-red-700 ring-red-200', VACATION: 'bg-blue-50 text-blue-700 ring-blue-200',
                    EMERGENCY: 'bg-amber-50 text-amber-700 ring-amber-200', MATERNITY: 'bg-pink-50 text-pink-700 ring-pink-200', PATERNITY: 'bg-purple-50 text-purple-700 ring-purple-200',
                  }
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-amber-50 text-amber-700 ring-amber-200', APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                    REJECTED: 'bg-red-50 text-red-700 ring-red-200', CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
                  }
                  return (
                    <tr key={l.id} className="hover:bg-brand-50/50">
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', leaveColors[l.leaveType] ?? 'bg-slate-100 text-slate-600 ring-slate-200')}>
                          {l.leaveType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{l.totalDays}d</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', statusColors[l.status] ?? 'bg-slate-100 text-slate-600 ring-slate-200')}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(l.appliedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Onboarding' && (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-5">
            <BadgeCheck className="h-4 w-4 text-brand-500" /> Onboarding Checklist
          </h3>
          {!onboarding ? (
            <div className="text-center py-12">
              <BadgeCheck className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No onboarding record found for this employee.</p>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-5 rounded-xl bg-[#f3f6fb] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">{onboarding.completedTasksCount} / {onboarding.totalTasksCount} tasks completed</p>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                    onboarding.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                    onboarding.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                    'bg-slate-100 text-slate-600 ring-slate-200')}>
                    {onboarding.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-brand-500 transition-all"
                    style={{ width: `${(onboarding.completedTasksCount / onboarding.totalTasksCount) * 100}%` }} />
                </div>
              </div>

              {/* Tasks grouped by category */}
              {(() => {
                const byCategory: Record<string, typeof onboarding.tasks> = {}
                onboarding.tasks.forEach((t) => {
                  if (!byCategory[t.category]) byCategory[t.category] = []
                  byCategory[t.category].push(t)
                })
                return Object.entries(byCategory).map(([cat, tasks]) => (
                  <div key={cat} className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{cat}</p>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className={cn('flex items-start gap-3 rounded-xl border p-3',
                          task.isCompleted ? 'border-emerald-100 bg-emerald-50/50' : 'border-[#e4ebf5] bg-white')}>
                          <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                            task.isCompleted ? 'bg-emerald-100' : 'bg-slate-100')}>
                            {task.isCompleted
                              ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              : <div className="h-2 w-2 rounded-full bg-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium', task.isCompleted ? 'text-emerald-800 line-through opacity-70' : 'text-slate-800')}>{task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {task.dueDate && <p className="text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p>}
                              {task.assignedTo && <p className="text-xs text-slate-400">→ {task.assignedTo}</p>}
                              {task.completedAt && <p className="text-xs text-emerald-600">Done {formatDate(task.completedAt)}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </>
          )}
        </div>
      )}
    </div>
  )
}
