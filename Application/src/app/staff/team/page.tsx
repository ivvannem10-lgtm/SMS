'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Mail, Phone, Cake, Building2, X } from 'lucide-react'
import { SectionTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { MOCK_STAFF_MEMBERS } from '@/lib/mock-data'
import type { StaffMember } from '@/lib/mock-data'

const ROLE_COLOR: Record<string, string> = {
  'Super Admin':       'bg-brand-900 text-white',
  'Admission Officer': 'bg-violet-100 text-violet-700',
  'Registrar':         'bg-blue-100 text-blue-700',
  'Treasurer':         'bg-emerald-100 text-emerald-700',
  'Academic Admin':    'bg-orange-100 text-orange-700',
  'Dean':              'bg-brand-100 text-brand-700',
  'Teacher':           'bg-teal-100 text-teal-700',
}

const ROLE_DEPT_MAP: Record<string, string> = {
  ADMISSION_OFFICER: 'Admissions Office',
  REGISTRAR:         'Registrar Office',
  TREASURER:         'Finance Office',
  ACADEMIC_ADMIN:    'Academic Affairs',
}

function formatBirthday(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ALL_DEPTS = ['All Departments', ...Array.from(new Set(MOCK_STAFF_MEMBERS.map((m) => m.department))).sort()]

// ── Profile modal (table layout) ──────────────────────────────────────────────

function ProfileModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const rows = [
    { label: 'Full Name',   value: member.name },
    { label: 'Job Title',   value: member.role },
    { label: 'Department',  value: member.department },
    { label: 'Email',       value: member.email },
    { label: 'Phone',       value: member.phone ?? '—' },
    { label: 'Birthday',    value: formatBirthday(member.birthday) },
  ]
  return (
    <Modal open onClose={onClose} title="Team Member Profile" size="md"
      footer={
        <button onClick={onClose} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <X className="h-4 w-4" /> Close
        </button>
      }
    >
      <div className="flex flex-col items-center gap-3 mb-5">
        <Avatar name={member.name} size="xl" />
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">{member.name}</p>
          <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${ROLE_COLOR[member.role] ?? 'bg-slate-100 text-slate-600'}`}>
            {member.role}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
        <table className="w-full">
          <tbody className="divide-y divide-[#f0f4fa]">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="py-2.5 pl-4 pr-3 w-32 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-[#f8fafd]">{r.label}</td>
                <td className="py-2.5 pl-3 pr-4 text-sm text-slate-900 font-medium">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamHubPage() {
  const { data: session } = useSession()
  const role     = (session?.user as { role?: string; deanDepartment?: string })?.role ?? ''
  const deanDept = (session?.user as { deanDepartment?: string })?.deanDepartment

  const [dept,           setDept]           = useState('All Departments')
  const [roleTab,        setRoleTab]        = useState<'ALL' | 'ADMIN' | 'DEAN' | 'TEACHER'>('ALL')
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)
  const [deptInit,       setDeptInit]       = useState(false)

  useEffect(() => {
    if (!deptInit && session) {
      if (role === 'DEAN' && deanDept) setDept(deanDept)
      else if (ROLE_DEPT_MAP[role])    setDept(ROLE_DEPT_MAP[role])
      setDeptInit(true)
    }
  }, [session, role, deanDept, deptInit])

  const ADMIN_ROLES = useMemo(() => ['Super Admin', 'Admission Officer', 'Registrar', 'Treasurer', 'Academic Admin'], [])

  const filtered = useMemo(() => {
    return MOCK_STAFF_MEMBERS.filter((m) => {
      const matchDept = dept === 'All Departments' || m.department === dept
      const matchRole =
        roleTab === 'ALL'     ? true :
        roleTab === 'ADMIN'   ? ADMIN_ROLES.includes(m.role) :
        roleTab === 'DEAN'    ? m.role === 'Dean' :
        roleTab === 'TEACHER' ? m.role === 'Teacher' : true
      return matchDept && matchRole
    })
  }, [dept, roleTab, ADMIN_ROLES])

  const totalCount   = MOCK_STAFF_MEMBERS.length
  const adminCount   = MOCK_STAFF_MEMBERS.filter((m) => ADMIN_ROLES.includes(m.role)).length
  const deanCount    = MOCK_STAFF_MEMBERS.filter((m) => m.role === 'Dean').length
  const teacherCount = MOCK_STAFF_MEMBERS.filter((m) => m.role === 'Teacher').length

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle description="School-wide employee directory — all staff and faculty">
        Team Hub
      </SectionTitle>

      {/* Role filter tabs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { tab: 'ALL'     as const, label: 'Total Staff',        value: totalCount,   color: 'bg-brand-50 text-brand-700'   },
          { tab: 'ADMIN'   as const, label: 'Admin Staff',        value: adminCount,   color: 'bg-violet-50 text-violet-700' },
          { tab: 'DEAN'    as const, label: 'Deans',              value: deanCount,    color: 'bg-blue-50 text-blue-700'     },
          { tab: 'TEACHER' as const, label: 'Faculty / Teachers', value: teacherCount, color: 'bg-teal-50 text-teal-700'     },
        ].map((s) => (
          <button key={s.tab} onClick={() => setRoleTab(s.tab)}
            className={`rounded-xl border p-4 text-left transition-all ${roleTab === s.tab ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-300' : 'border-[#e4ebf5] bg-white hover:border-brand-200'}`}
          >
            <p className={`text-2xl font-bold tabular-nums ${roleTab === s.tab ? 'text-brand-700' : 'text-slate-900'}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Department filter + count */}
      <div className="flex items-center gap-3">
        <select value={dept} onChange={(e) => setDept(e.target.value)}
          className="rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {ALL_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Users className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">No staff found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e4ebf5] overflow-hidden bg-white">
          <Table>
            <Thead>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Birthday</Th>
            </Thead>
            <Tbody>
              {filtered.map((member) => (
                <Tr key={member.id} onClick={() => setSelectedMember(member)}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.name} size="sm" />
                      <span className="font-semibold text-slate-900">{member.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_COLOR[member.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {member.role}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Building2 className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      {member.department}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      {member.email}
                    </div>
                  </Td>
                  <Td>
                    {member.phone ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        {member.phone}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </Td>
                  <Td>
                    {member.birthday ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Cake className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        {formatBirthday(member.birthday)}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}

      {selectedMember && (
        <ProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}
