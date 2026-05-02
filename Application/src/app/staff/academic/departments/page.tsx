'use client'

import { useState } from 'react'
import {
  Plus, Building2, GraduationCap, BookOpen,
  Pencil, Trash2, Check, Mail, KeyRound, Info,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { MOCK_DEPARTMENTS, MOCK_PROGRAMS } from '@/lib/mock-data'
import type { Department } from '@/types'

let nextDeptId = 10

const DEAN_COLORS = [
  'bg-brand-50 text-brand-700',
  'bg-violet-50 text-violet-700',
  'bg-emerald-50 text-emerald-700',
  'bg-amber-50 text-amber-700',
  'bg-cyan-50 text-cyan-700',
  'bg-rose-50 text-rose-700',
]

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS)

  // Add modal
  const [addOpen,   setAddOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [createdDean, setCreatedDean] = useState<{ email: string; password: string; dept: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: '', code: '', deanName: '', deanEmail: '' })
  const formErrors = {
    name:      !form.name.trim()     ? 'Department name is required.' : '',
    code:      !form.code.trim()     ? 'Code is required.' : departments.some((d) => d.code.toLowerCase() === form.code.trim().toLowerCase() && d.id !== editTarget?.id) ? 'Code already in use.' : '',
    deanEmail: form.deanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.deanEmail) ? 'Invalid email.' : '',
  }
  const isValid = !formErrors.name && !formErrors.code && !formErrors.deanEmail

  function openAdd() {
    setForm({ name: '', code: '', deanName: '', deanEmail: '' })
    setAddOpen(true)
  }
  function openEdit(dept: Department) {
    setForm({ name: dept.name, code: dept.code, deanName: dept.deanName ?? '', deanEmail: dept.deanEmail ?? '' })
    setEditTarget(dept)
  }

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))

    if (editTarget) {
      setDepartments((prev) => prev.map((d) => d.id === editTarget.id
        ? { ...d, name: form.name.trim(), code: form.code.trim().toUpperCase(), deanName: form.deanName.trim() || undefined, deanEmail: form.deanEmail.trim() || undefined }
        : d,
      ))
      setEditTarget(null)
    } else {
      const newDept: Department = {
        id:        `dept_${++nextDeptId}`,
        name:      form.name.trim(),
        code:      form.code.trim().toUpperCase(),
        deanName:  form.deanName.trim() || undefined,
        deanEmail: form.deanEmail.trim() || undefined,
        schoolId:  'school_1',
        createdAt: new Date().toISOString(),
      }
      setDepartments((prev) => [...prev, newDept])
      // Show generated dean credentials
      if (form.deanEmail.trim()) {
        setCreatedDean({ email: form.deanEmail.trim(), password: 'password', dept: form.name.trim() })
      }
      setAddOpen(false)
    }
    setSaving(false)
    setForm({ name: '', code: '', deanName: '', deanEmail: '' })
  }

  function handleDelete() {
    if (!deleteTarget) return
    setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const programCount = (deptName: string) =>
    MOCK_PROGRAMS.filter((p) => p.department === deptName).length

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionTitle
        description="Manage academic departments. Each department is headed by a Dean."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            Add Department
          </Button>
        }
      >
        Departments
      </SectionTitle>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-200 px-5 py-3.5">
        <Info className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
        <p className="text-xs text-brand-700 leading-relaxed">
          Each department corresponds to a <strong>Dean account</strong>. When you add a department and assign a dean email,
          a Dean portal login is provisioned for that email. Deans can then create programs within their department.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Departments', value: departments.length, icon: Building2, color: 'bg-brand-50 text-brand-600' },
          { label: 'Departments with Dean', value: departments.filter((d) => d.deanEmail).length, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Programs', value: MOCK_PROGRAMS.length, icon: BookOpen, color: 'bg-violet-50 text-violet-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-card">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card padding="none">
        {departments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Building2 className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No departments yet</p>
            <p className="text-xs text-slate-400">Click "Add Department" to create the first one.</p>
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add Department</Button>
          </div>
        ) : (
          <Table>
            <Thead>
              <Th>Department</Th>
              <Th>Code</Th>
              <Th>Dean</Th>
              <Th>Dean Email</Th>
              <Th>Programs</Th>
              <Th />
            </Thead>
            <Tbody>
              {departments.map((dept, idx) => (
                <Tr key={dept.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${DEAN_COLORS[idx % DEAN_COLORS.length]}`}>
                        {dept.code.slice(0, 2)}
                      </div>
                      <p className="font-semibold text-slate-900">{dept.name}</p>
                    </div>
                  </Td>
                  <Td>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{dept.code}</code>
                  </Td>
                  <Td className="text-slate-700">{dept.deanName ?? <span className="text-slate-400 italic">Not assigned</span>}</Td>
                  <Td>
                    {dept.deanEmail
                      ? <span className="flex items-center gap-1 text-xs text-brand-600"><Mail className="h-3 w-3" />{dept.deanEmail}</span>
                      : <span className="text-slate-400 italic text-xs">—</span>
                    }
                  </Td>
                  <Td>
                    <Badge className="bg-brand-50 text-brand-700 ring-brand-200">
                      {programCount(dept.name)} programs
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(dept)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(dept)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* ── Add Modal ────────────────────────────────────────────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Department"
        description="A Dean account will be provisioned for the email provided."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!isValid} icon={<Check className="h-4 w-4" />}>
              Create Department
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Department Name" placeholder="e.g. College of Engineering" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={form.name !== '' ? formErrors.name : ''} />
          <Input label="Code" placeholder="e.g. COE" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} error={form.code !== '' ? formErrors.code : ''} hint="Short unique identifier (2–5 letters)" />
          <div className="border-t border-[#e4ebf5] pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dean Account</p>
            <div className="space-y-3">
              <Input label="Dean Full Name" placeholder="e.g. Dr. Juan dela Cruz" value={form.deanName} onChange={(e) => setForm((f) => ({ ...f, deanName: e.target.value }))} />
              <Input label="Dean Email" type="email" placeholder="e.g. dean.engineering@school.edu" value={form.deanEmail} onChange={(e) => setForm((f) => ({ ...f, deanEmail: e.target.value }))} error={form.deanEmail !== '' ? formErrors.deanEmail : ''} icon={<Mail className="h-4 w-4" />} />
              <div className="rounded-lg bg-slate-50 border border-[#e4ebf5] px-4 py-3 flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500">Default password: <strong className="text-slate-700">password</strong> — dean must change on first login.</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Department"
        description={editTarget?.name}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!isValid} icon={<Check className="h-4 w-4" />}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Department Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={form.name !== '' ? formErrors.name : ''} />
          <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} error={form.code !== '' ? formErrors.code : ''} />
          <div className="border-t border-[#e4ebf5] pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dean Account</p>
            <div className="space-y-3">
              <Input label="Dean Full Name" value={form.deanName} onChange={(e) => setForm((f) => ({ ...f, deanName: e.target.value }))} />
              <Input label="Dean Email" type="email" value={form.deanEmail} onChange={(e) => setForm((f) => ({ ...f, deanEmail: e.target.value }))} error={form.deanEmail !== '' ? formErrors.deanEmail : ''} icon={<Mail className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Department"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          The associated Dean account will lose access. Programs under this department will become unlinked.
        </p>
      </Modal>

      {/* ── Dean Credentials Modal ───────────────────────────────────────────── */}
      <Modal
        open={!!createdDean}
        onClose={() => setCreatedDean(null)}
        title="Dean Account Created"
        description={createdDean?.dept}
        size="sm"
        footer={<Button onClick={() => setCreatedDean(null)} icon={<Check className="h-4 w-4" />}>Done</Button>}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Share these credentials with the new Dean:</p>
          <div className="rounded-xl border border-[#e4ebf5] bg-slate-50 divide-y divide-[#e4ebf5]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</span>
              <code className="text-sm font-mono text-brand-700">{createdDean?.email}</code>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</span>
              <code className="text-sm font-mono text-slate-700">{createdDean?.password}</code>
            </div>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            The Dean should change their password upon first login.
          </p>
        </div>
      </Modal>
    </div>
  )
}
