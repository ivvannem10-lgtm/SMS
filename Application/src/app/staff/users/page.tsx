'use client'
import { useState, useMemo } from 'react'
import {
  Plus, Search, Trash2, Edit2, Shield, Users,
  Check, X, ChevronDown, Lock,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge, RoleBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { MOCK_SYSTEM_USERS, MOCK_CUSTOM_ROLES } from '@/lib/mock-data'
import type { CustomRole, ModuleKey, ModulePermission } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const SYSTEM_ROLES = [
  { key: 'SUPER_ADMIN',       label: 'Super Admin',        desc: 'Full system access — all modules',          color: 'bg-brand-900 text-white' },
  { key: 'ADMISSION_OFFICER', label: 'Admission Officer',  desc: 'Applicant intake, review, and CRM',         color: 'bg-violet-100 text-violet-700' },
  { key: 'REGISTRAR',         label: 'Registrar',          desc: 'Student records, docs, grade finalization',  color: 'bg-brand-50 text-brand-700' },
  { key: 'TREASURER',         label: 'Treasurer',          desc: 'Fees, billing, and payment validation',      color: 'bg-emerald-50 text-emerald-700' },
  { key: 'ACADEMIC_ADMIN',    label: 'Academic Admin',     desc: 'Subjects, offerings, rooms, curriculum',     color: 'bg-cyan-50 text-cyan-700' },
  { key: 'DEAN',              label: 'Dean',               desc: 'Department students, teacher assignment',    color: 'bg-brand-100 text-brand-700' },
  { key: 'TEACHER',           label: 'Teacher / Faculty',  desc: 'Grade book, LMS, schedule management',      color: 'bg-orange-50 text-orange-700' },
  { key: 'STUDENT',           label: 'Student',            desc: 'Enrollment, SOA, grades, LMS access',       color: 'bg-slate-100 text-slate-600' },
]

const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'admissions',      label: 'Admissions' },
  { key: 'academic',        label: 'Academic Admin' },
  { key: 'registrar',       label: 'Registrar' },
  { key: 'treasury',        label: 'Treasury' },
  { key: 'lms',             label: 'LMS' },
  { key: 'reports',         label: 'Reports' },
  { key: 'user_management', label: 'User Management' },
]

const PERM_LEVELS = ['view', 'create', 'edit', 'delete'] as const
type PermLevel = typeof PERM_LEVELS[number]

function blankPermissions(): ModulePermission[] {
  return MODULES.map(m => ({ module: m.key, view: false, create: false, edit: false, delete: false }))
}

let _nextId = 1
function genId() { return `cr_${Date.now()}_${_nextId++}` }

// ── Sub-components ────────────────────────────────────────────────────────────

function PermToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
        on ? 'bg-brand-500 text-white' : 'border border-slate-300 bg-white text-transparent hover:border-brand-400'
      }`}
    >
      <Check className="h-3 w-3" />
    </button>
  )
}

// ── Role Modal ────────────────────────────────────────────────────────────────

function RoleModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: CustomRole
  onSave: (r: CustomRole) => void
  onClose: () => void
}) {
  const [name, setName]   = useState(initial?.name ?? '')
  const [desc, setDesc]   = useState(initial?.description ?? '')
  const [perms, setPerms] = useState<ModulePermission[]>(
    initial?.permissions ?? blankPermissions()
  )
  const [expanded, setExpanded] = useState<Set<ModuleKey>>(new Set())
  const [err, setErr] = useState('')

  function togglePerm(moduleKey: ModuleKey, level: PermLevel) {
    setPerms(prev => prev.map(p => {
      if (p.module !== moduleKey) return p
      const next = { ...p, [level]: !p[level] }
      // enabling create/edit/delete auto-enables view
      if (level !== 'view' && next[level]) next.view = true
      return next
    }))
  }

  function toggleModuleView(moduleKey: ModuleKey, allOn: boolean) {
    setPerms(prev => prev.map(p =>
      p.module === moduleKey
        ? { ...p, view: !allOn, create: !allOn, edit: !allOn, delete: !allOn }
        : p
    ))
  }

  function save() {
    if (!name.trim()) { setErr('Role name is required.'); return }
    onSave({
      id:          initial?.id ?? genId(),
      name:        name.trim(),
      description: desc.trim(),
      permissions: perms,
      createdAt:   initial?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <Modal
      open
      title={initial ? 'Edit Role' : 'Create New Role'}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-5 p-1">

        {/* Name + Description */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Role Name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setErr('') }}
              placeholder="e.g. Finance Viewer"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            />
            {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Brief description of this role"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            />
          </div>
        </div>

        {/* Permissions matrix */}
        <div>
          <p className="mb-2 text-xs font-bold text-slate-600 uppercase tracking-widest">Module Access</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {/* Header row */}
            <div className="grid bg-[#f0f4fa] border-b border-[#dce8f7] px-4 py-2"
              style={{ gridTemplateColumns: '1fr repeat(4, 72px)' }}>
              <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">Module</span>
              {PERM_LEVELS.map(l => (
                <span key={l} className="text-center text-xs font-bold text-brand-700 uppercase tracking-widest capitalize">{l}</span>
              ))}
            </div>

            {/* Module rows */}
            {perms.map(p => {
              const mod    = MODULES.find(m => m.key === p.module)!
              const allOn  = PERM_LEVELS.every(l => p[l])
              const someOn = PERM_LEVELS.some(l => p[l])
              return (
                <div key={p.module}
                  className="grid items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                  style={{ gridTemplateColumns: '1fr repeat(4, 72px)' }}>
                  {/* Module label + toggle-all */}
                  <button
                    onClick={() => toggleModuleView(p.module, allOn)}
                    className="flex items-center gap-2 text-left"
                  >
                    <div className={`h-2 w-2 rounded-full ${someOn ? 'bg-brand-500' : 'bg-slate-200'}`} />
                    <span className={`text-sm font-medium ${someOn ? 'text-slate-800' : 'text-slate-500'}`}>{mod.label}</span>
                    {someOn && !allOn && <span className="text-[10px] text-slate-400">(partial)</span>}
                  </button>
                  {PERM_LEVELS.map(l => (
                    <div key={l} className="flex justify-center">
                      <PermToggle
                        on={p[l]}
                        onChange={() => togglePerm(p.module, l)}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">Click a module name to toggle all permissions. Enabling Create/Edit/Delete auto-enables View.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={save}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
          <Check className="h-3.5 w-3.5" />
          {initial ? 'Save Changes' : 'Create Role'}
        </button>
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const [tab, setTab] = useState<'users' | 'roles'>('users')

  // Users tab state
  const [userSearch, setUserSearch] = useState('')

  // Roles tab state
  const [customRoles, setCustomRoles]   = useState<CustomRole[]>(() => [...MOCK_CUSTOM_ROLES])
  const [modalRole, setModalRole]       = useState<CustomRole | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomRole | null>(null)

  // ── filtered users ──
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase()
    if (!q) return MOCK_SYSTEM_USERS
    return MOCK_SYSTEM_USERS.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  }, [userSearch])

  // ── role CRUD (in-memory, syncs to module-level array) ──
  function saveRole(r: CustomRole) {
    const isNew = !customRoles.find(c => c.id === r.id)
    const next  = isNew
      ? [...customRoles, r]
      : customRoles.map(c => c.id === r.id ? r : c)
    setCustomRoles(next)
    // sync to module-level so GenerateTab dropdowns etc. see the data
    MOCK_CUSTOM_ROLES.splice(0, MOCK_CUSTOM_ROLES.length, ...next)
    setModalRole(null)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const next = customRoles.filter(c => c.id !== deleteTarget.id)
    setCustomRoles(next)
    MOCK_CUSTOM_ROLES.splice(0, MOCK_CUSTOM_ROLES.length, ...next)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle description="View system accounts and manage custom roles for the school.">
        User Management
      </SectionTitle>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {([['users', 'Users', Users], ['roles', 'Role Management', Shield]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ══ USERS TAB ═══════════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search by name, email or role…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="w-72"
            />
            <p className="text-xs text-slate-400">
              {filteredUsers.length} of {MOCK_SYSTEM_USERS.length} users
            </p>
          </div>

          <Card padding="none">
            <Table>
              <Thead>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Type</Th>
              </Thead>
              <Tbody>
                {filteredUsers.map(u => (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" />
                        <span className="font-medium text-slate-900 text-sm">{u.name}</span>
                      </div>
                    </Td>
                    <Td><span className="text-sm text-slate-500">{u.email}</span></Td>
                    <Td><RoleBadge role={u.role} /></Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          : 'bg-slate-100 text-slate-500 ring-1 ring-slate-300'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <Lock className="h-2.5 w-2.5" />
                        System
                      </span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>

          {customRoles.length > 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{customRoles.length} custom role{customRoles.length !== 1 ? 's' : ''}</span>
                {' '}defined — switch to the <button onClick={() => setTab('roles')} className="text-brand-600 underline underline-offset-2">Role Management</button> tab to manage them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══ ROLES TAB ═══════════════════════════════════════════════════════ */}
      {tab === 'roles' && (
        <div className="space-y-6">

          {/* System Roles — read-only */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-700">System Roles</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                <Lock className="h-2.5 w-2.5" /> Read-only
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {SYSTEM_ROLES.map(r => (
                <div key={r.key}
                  className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold ${r.color}`}>
                      {r.label}
                    </span>
                    <Lock className="h-3 w-3 shrink-0 text-slate-300 mt-0.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Roles — editable */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-700">Custom Roles</h2>
                {customRoles.length > 0 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                    {customRoles.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setModalRole('new')}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Role
              </button>
            </div>

            {customRoles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                <Shield className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No custom roles yet</p>
                <p className="mt-1 text-xs text-slate-400">Click "Create Role" to define a new access profile.</p>
              </div>
            ) : (
              <Card padding="none">
                <Table>
                  <Thead>
                    <Th>Role Name</Th>
                    <Th>Description</Th>
                    <Th>Module Access</Th>
                    <Th>Created</Th>
                    <Th />
                  </Thead>
                  <Tbody>
                    {customRoles.map(r => {
                      const activeModules = r.permissions.filter(p => p.view || p.create || p.edit || p.delete)
                      return (
                        <Tr key={r.id}>
                          <Td>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                                <Shield className="h-3.5 w-3.5 text-brand-500" />
                              </div>
                              <span className="font-semibold text-slate-800 text-sm">{r.name}</span>
                            </div>
                          </Td>
                          <Td>
                            <span className="text-xs text-slate-500">{r.description || <span className="italic text-slate-300">No description</span>}</span>
                          </Td>
                          <Td>
                            {activeModules.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">No access</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {activeModules.slice(0, 3).map(p => {
                                  const mod = MODULES.find(m => m.key === p.module)!
                                  const levels = PERM_LEVELS.filter(l => p[l])
                                  return (
                                    <span key={p.module}
                                      className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">
                                      {mod.label} ({levels.join(', ')})
                                    </span>
                                  )
                                })}
                                {activeModules.length > 3 && (
                                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                    +{activeModules.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </Td>
                          <Td>
                            <span className="text-xs text-slate-400">
                              {new Date(r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </Td>
                          <Td>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setModalRole(r)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                title="Edit role"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(r)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                title="Delete role"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Create / Edit Role Modal ───────────────────────────────────────── */}
      {modalRole !== null && (
        <RoleModal
          initial={modalRole === 'new' ? undefined : modalRole}
          onSave={saveRole}
          onClose={() => setModalRole(null)}
        />
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-l-[3px] border-red-500 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">Delete "{deleteTarget.name}"?</p>
              <p className="mt-1 text-xs text-slate-500">This custom role will be permanently removed. System roles are not affected.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
