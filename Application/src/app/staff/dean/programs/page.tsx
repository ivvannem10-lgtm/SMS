'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, BookOpen, Check, Pencil, Trash2, Users, Info } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PROGRAMS, MOCK_STUDENTS, MOCK_DEPARTMENTS } from '@/lib/mock-data'
import type { Program } from '@/types'

let nextProgId = 20

const PROGRAM_TYPES = ['Bachelor', 'Master', 'Doctorate', 'Associate', 'Certificate']

export default function DeanProgramsPage() {
  const { data: session } = useSession()
  const user = session?.user as { deanDepartment?: string } | undefined
  const deanDepartment = user?.deanDepartment ?? ''

  const dept = MOCK_DEPARTMENTS.find((d) => d.name === deanDepartment)

  // Programs scoped to this dean's department
  const [programs, setPrograms] = useState<Program[]>(
    MOCK_PROGRAMS.filter((p) => p.department === deanDepartment),
  )

  const [addOpen,      setAddOpen]      = useState(false)
  const [editTarget,   setEditTarget]   = useState<Program | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null)
  const [saving,       setSaving]       = useState(false)

  const [form, setForm] = useState({ name: '', code: '', type: 'Bachelor' })
  const formErrors = {
    name: !form.name.trim() ? 'Program name is required.' : '',
    code: !form.code.trim() ? 'Code is required.'
      : programs.some((p) => p.code.toLowerCase() === form.code.trim().toLowerCase() && p.id !== editTarget?.id)
        ? 'Code already used in this department.' : '',
  }
  const isValid = !formErrors.name && !formErrors.code

  function openAdd() {
    setForm({ name: '', code: '', type: 'Bachelor' })
    setAddOpen(true)
  }
  function openEdit(prog: Program) {
    setForm({ name: prog.name, code: prog.code, type: 'Bachelor' })
    setEditTarget(prog)
  }

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))

    if (editTarget) {
      setPrograms((prev) => prev.map((p) => p.id === editTarget.id
        ? { ...p, name: form.name.trim(), code: form.code.trim().toUpperCase() }
        : p,
      ))
      setEditTarget(null)
    } else {
      const newProg: Program = {
        id:           `prog_${++nextProgId}`,
        name:         `${form.type} of ${form.name.trim()}`,
        code:         form.code.trim().toUpperCase(),
        department:   deanDepartment,
        departmentId: dept?.id,
        schoolId:     'school_1',
      }
      setPrograms((prev) => [...prev, newProg])
      setAddOpen(false)
    }
    setSaving(false)
    setForm({ name: '', code: '', type: 'Bachelor' })
  }

  function handleDelete() {
    if (!deleteTarget) return
    setPrograms((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const studentCount = (progId: string) =>
    MOCK_STUDENTS.filter((s) => s.programId === progId).length

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionTitle
        description={`${deanDepartment} · Manage academic programs offered by your department`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            Add Program
          </Button>
        }
      >
        Programs
      </SectionTitle>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-200 px-5 py-3.5">
        <Info className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
        <p className="text-xs text-brand-700 leading-relaxed">
          Programs you create here are visible to the Registrar when enrolling students and to applicants on the application form.
          You can only manage programs under <strong>{deanDepartment}</strong>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 mb-3">
            <BookOpen className="h-4 w-4 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{programs.length}</p>
          <p className="text-xs font-medium text-slate-600 mt-1">Total Programs</p>
        </div>
        <div className="rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 mb-3">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {MOCK_STUDENTS.filter((s) => programs.some((p) => p.id === s.programId)).length}
          </p>
          <p className="text-xs font-medium text-slate-600 mt-1">Students Enrolled</p>
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        {programs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No programs yet</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Create your department's first program. Students and applicants can then select it.
            </p>
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAdd}>Add Program</Button>
          </div>
        ) : (
          <Table>
            <Thead>
              <Th>Program Name</Th>
              <Th>Code</Th>
              <Th>Department</Th>
              <Th>Students</Th>
              <Th />
            </Thead>
            <Tbody>
              {programs.map((prog) => (
                <Tr key={prog.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                        <BookOpen className="h-3.5 w-3.5 text-brand-600" />
                      </div>
                      <p className="font-semibold text-slate-900">{prog.name}</p>
                    </div>
                  </Td>
                  <Td>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{prog.code}</code>
                  </Td>
                  <Td className="text-sm text-slate-600">{prog.department}</Td>
                  <Td>
                    <Badge className="bg-slate-100 text-slate-600 ring-slate-200">
                      {studentCount(prog.id)} students
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(prog)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(prog)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
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

      {/* ── Add Program Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Program"
        description={deanDepartment}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!isValid} icon={<Check className="h-4 w-4" />}>
              Create Program
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Program Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            {PROGRAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>

          <Input
            label="Program Name"
            placeholder={`e.g. Science in Computer Science`}
            hint={form.type && form.name ? `Full name: ${form.type} of ${form.name}` : undefined}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={form.name !== '' ? formErrors.name : ''}
          />

          <Input
            label="Program Code"
            placeholder="e.g. BSCS"
            hint="Unique short code used on student records"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            error={form.code !== '' ? formErrors.code : ''}
          />

          {form.name && form.code && (
            <div className="rounded-xl border border-[#e4ebf5] bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Preview</p>
              <p className="text-sm font-bold text-slate-900">{form.type} of {form.name}</p>
              <p className="text-xs text-brand-600 font-mono mt-0.5">{form.code.toUpperCase()}</p>
              <p className="text-xs text-slate-400 mt-0.5">{deanDepartment}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Program"
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
          <Input label="Program Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={form.name !== '' ? formErrors.name : ''} />
          <Input label="Program Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} error={form.code !== '' ? formErrors.code : ''} />
        </div>
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Program"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{deleteTarget?.name}</strong>? Students currently assigned to this program will become unlinked.
        </p>
      </Modal>
    </div>
  )
}
