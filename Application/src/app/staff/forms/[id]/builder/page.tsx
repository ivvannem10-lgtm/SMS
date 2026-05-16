'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronUp, ChevronDown, Trash2, Plus, Settings, Layout,
  Star, Type, AlignLeft, Hash, Mail, Phone, CalendarDays, Clock,
  ChevronDown as ChevronDownIcon, CheckSquare, Circle, Upload, Minus,
  AlignLeft as RichTextIcon, ToggleLeft, Eye, Save, Send, XCircle, X,
  Zap, GitBranch, UserCheck, Bell, ChevronRight, Grip,
} from 'lucide-react'
import { MOCK_FORMS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type {
  FormField, FormFieldType, FormCondition, InstitutionalForm, FormVisibility,
  FormAutomationRule, FormActionType, FormTrigger,
  FormApprovalConfig, FormApprovalStep, FormApprovalMode,
  FormProcessOwner,
} from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Request', 'Survey', 'Evaluation', 'Registration', 'Feedback', 'Incident Report', 'Other']
const DEPARTMENTS = ['Human Resources', 'Academic Affairs', 'Administration', 'Asset Management', 'Finance', 'Registrar', 'IT Support', 'Other']
const VISIBILITIES: { value: FormVisibility; label: string }[] = [
  { value: 'PUBLIC_INTERNAL', label: 'Public Internal' },
  { value: 'STAFF_ONLY', label: 'Staff Only' },
  { value: 'STUDENT_ONLY', label: 'Student Only' },
  { value: 'DEPARTMENT_ONLY', label: 'Department Only' },
  { value: 'CUSTOM', label: 'Custom' },
]
const ROUTE_DEPTS = ['HR', 'AMO', 'ADMIN', 'IT_SUPPORT', 'ACADEMIC', 'FINANCE', 'REGISTRAR']

const STAFF_OPTIONS: FormProcessOwner[] = [
  { userId: 'u_accounting', name: 'Clara Accounting',     roleLabel: 'Accounting Officer',   role: 'ACCOUNTING',         email: 'accounting@school.edu', department: 'Finance' },
  { userId: 'u_hr',         name: 'Hannah Rodriguez',     roleLabel: 'HR Officer',            role: 'HR_STAFF',           email: 'hr@school.edu',         department: 'Human Resources' },
  { userId: 'u_amo',        name: 'Marco Dela Cruz',      roleLabel: 'AMO Officer',           role: 'AMO',                email: 'amo@school.edu',        department: 'Asset Management' },
  { userId: 'u_registrar',  name: 'Rosa Registrar',       roleLabel: 'Registrar',             role: 'REGISTRAR',          email: 'registrar@school.edu',  department: 'Registrar' },
  { userId: 'u_academic',   name: 'Alex Academic',        roleLabel: 'Academic Admin',        role: 'ACADEMIC_ADMIN',     email: 'academic@school.edu',   department: 'Academic Affairs' },
  { userId: 'u_purchasing', name: 'Mark Purchasing',      roleLabel: 'Purchasing Officer',    role: 'PURCHASING_OFFICER', email: 'purchasing@school.edu', department: 'Finance' },
  { userId: 'u_treasury',   name: 'Treasury Officer',     roleLabel: 'Treasurer',             role: 'TREASURER',          email: 'treasury@school.edu',   department: 'Finance' },
  { userId: 'u_superadmin', name: 'Alex Administrator',   roleLabel: 'Super Admin',           role: 'SUPER_ADMIN',        email: 'admin@school.edu',      department: 'Administration' },
  { userId: 'u_teacher',    name: 'Prof. Roberto Santos', roleLabel: 'Teacher',               role: 'TEACHER',            email: 'prof.santos@school.edu',department: 'College of Computing' },
]

const APPROVER_ROLES = [
  { value: 'ACCOUNTING',         label: 'Accounting Officer' },
  { value: 'HR_STAFF',           label: 'HR Staff' },
  { value: 'AMO',                label: 'Asset Management Officer' },
  { value: 'REGISTRAR',          label: 'Registrar' },
  { value: 'ACADEMIC_ADMIN',     label: 'Academic Admin' },
  { value: 'PURCHASING_OFFICER', label: 'Purchasing Officer' },
  { value: 'DEAN',               label: 'Department Dean' },
  { value: 'TREASURER',          label: 'Treasurer' },
  { value: 'SUPER_ADMIN',        label: 'Super Admin' },
]

const TRIGGER_LABELS: Record<FormTrigger, string> = {
  ON_SUBMIT:   'On Submit',
  ON_APPROVE:  'On Approve',
  ON_REJECT:   'On Reject',
  ON_DEADLINE: 'On Deadline',
}
const TRIGGER_COLORS: Record<FormTrigger, string> = {
  ON_SUBMIT:   'bg-brand-50 text-brand-700',
  ON_APPROVE:  'bg-emerald-50 text-emerald-700',
  ON_REJECT:   'bg-red-50 text-red-700',
  ON_DEADLINE: 'bg-amber-50 text-amber-700',
}
const ACTION_LABELS: Record<FormActionType, string> = {
  NOTIFY_DEPT:    'Notify Department',
  SEND_EMAIL:     'Send Email',
  CREATE_REQUEST: 'Create Request',
  CREATE_TICKET:  'Create Ticket',
  SET_STATUS:     'Set Status',
  ASSIGN_TO:      'Assign To',
}

type FieldGroup = { label: string; fields: { type: FormFieldType; label: string; icon: React.ElementType }[] }

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: 'Text',
    fields: [
      { type: 'SHORT_TEXT', label: 'Short Text', icon: Type },
      { type: 'LONG_TEXT',  label: 'Long Text',  icon: AlignLeft },
      { type: 'NUMBER',     label: 'Number',     icon: Hash },
      { type: 'EMAIL',      label: 'Email',      icon: Mail },
      { type: 'PHONE',      label: 'Phone',      icon: Phone },
    ],
  },
  {
    label: 'Choice',
    fields: [
      { type: 'DROPDOWN',     label: 'Dropdown',    icon: ChevronDownIcon },
      { type: 'MULTI_SELECT', label: 'Multi-select', icon: CheckSquare },
      { type: 'RADIO',        label: 'Radio',        icon: Circle },
      { type: 'CHECKBOX',     label: 'Checkbox',     icon: CheckSquare },
    ],
  },
  {
    label: 'Special',
    fields: [
      { type: 'DATE',            label: 'Date',       icon: CalendarDays },
      { type: 'TIME',            label: 'Time',       icon: Clock },
      { type: 'FILE_UPLOAD',     label: 'File Upload', icon: Upload },
      { type: 'RATING',          label: 'Rating',     icon: Star },
      { type: 'SECTION_DIVIDER', label: 'Divider',    icon: Minus },
      { type: 'RICH_TEXT',       label: 'Rich Text',  icon: RichTextIcon },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() { return `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }

function createField(type: FormFieldType): FormField {
  const base: FormField = {
    id: genId(), type,
    label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    required: false, width: 'full',
  }
  if (['DROPDOWN', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(type)) base.options = ['Option 1', 'Option 2']
  if (type === 'RATING') base.maxRating = 5
  if (type === 'FILE_UPLOAD') base.acceptedFiles = ['.pdf', '.jpg', '.png']
  return base
}

function defaultApproval(): FormApprovalConfig {
  return {
    enabled: false,
    mode: 'SEQUENTIAL',
    steps: [],
    notifySubmitterOnApprove: true,
    notifySubmitterOnReject: true,
    allowResubmitOnReject: false,
  }
}

// ─── Field Preview ────────────────────────────────────────────────────────────

function FieldPreview({ field }: { field: FormField }) {
  const inputCls = 'w-full rounded-lg border border-[#dce8f7] bg-[#f8fafd] px-3 py-2 text-sm text-slate-400 cursor-not-allowed'
  if (field.type === 'SECTION_DIVIDER') return (
    <div className="py-2">
      {field.label && field.label !== 'Section Divider' && <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{field.label}</p>}
      <hr className="border-[#dce8f7]" />
    </div>
  )
  if (field.type === 'RICH_TEXT') return <div className="rounded-lg border border-[#dce8f7] bg-[#f8fafd] px-3 py-2 text-sm text-slate-400 min-h-[60px]">{field.placeholder || 'Rich text content here…'}</div>
  if (field.type === 'RATING') return <div className="flex gap-1">{Array.from({ length: field.maxRating ?? 5 }).map((_, i) => <Star key={i} className="h-5 w-5 text-slate-300" />)}</div>
  if (field.type === 'RADIO') return <div className="space-y-1">{(field.options ?? []).map(o => <label key={o} className="flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded-full border border-slate-300 flex-shrink-0" />{o}</label>)}</div>
  if (field.type === 'CHECKBOX' || field.type === 'MULTI_SELECT') return <div className="space-y-1">{(field.options ?? []).map(o => <label key={o} className="flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded border border-slate-300 flex-shrink-0" />{o}</label>)}</div>
  if (field.type === 'DROPDOWN') return <select disabled className={inputCls}><option>{field.placeholder || 'Select an option…'}</option></select>
  if (field.type === 'LONG_TEXT') return <textarea disabled rows={3} placeholder={field.placeholder || 'Enter text…'} className={`${inputCls} resize-none`} />
  if (field.type === 'FILE_UPLOAD') return <div className="flex items-center justify-center border-2 border-dashed border-[#dce8f7] rounded-lg py-4 text-xs text-slate-400"><Upload className="h-4 w-4 mr-2" />Click to upload {field.acceptedFiles?.join(', ')}</div>
  const typeMap: Partial<Record<FormFieldType, string>> = { EMAIL: 'email', NUMBER: 'number', PHONE: 'tel', DATE: 'date', TIME: 'time' }
  return <input type={typeMap[field.type] ?? 'text'} disabled placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`} className={inputCls} />
}

// ─── Field Editor ─────────────────────────────────────────────────────────────

function FieldEditor({ field, allFields, onChange }: { field: FormField; allFields: FormField[]; onChange: (f: FormField) => void }) {
  const [showCondition, setShowCondition] = useState(!!field.condition)
  function update(patch: Partial<FormField>) { onChange({ ...field, ...patch }) }
  function updateOption(idx: number, val: string) { const o = [...(field.options ?? [])]; o[idx] = val; update({ options: o }) }
  function addOption() { update({ options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] }) }
  function removeOption(idx: number) { const o = [...(field.options ?? [])]; o.splice(idx, 1); update({ options: o }) }

  const hasOptions    = ['DROPDOWN', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(field.type)
  const isText        = ['SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'EMAIL', 'PHONE'].includes(field.type)
  const isAutoFillable = ['SHORT_TEXT', 'EMAIL'].includes(field.type)
  const triggerFields = allFields.filter(f => f.id !== field.id && f.type !== 'SECTION_DIVIDER' && f.type !== 'RICH_TEXT')
  const lCls = 'block text-xs font-semibold text-slate-600 mb-1'
  const iCls = 'w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className="space-y-4">
      <div><label className={lCls}>Label</label><input value={field.label} onChange={e => update({ label: e.target.value })} className={iCls} /></div>
      {isText && <div><label className={lCls}>Placeholder</label><input value={field.placeholder ?? ''} onChange={e => update({ placeholder: e.target.value })} className={iCls} placeholder="Optional placeholder…" /></div>}
      <div><label className={lCls}>Help Text</label><input value={field.helpText ?? ''} onChange={e => update({ helpText: e.target.value })} className={iCls} placeholder="Optional hint…" /></div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Required</span>
        <button onClick={() => update({ required: !field.required })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${field.required ? 'bg-brand-500' : 'bg-slate-200'}`}>
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${field.required ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
        </button>
      </div>
      <div>
        <label className={lCls}>Width</label>
        <div className="flex gap-2">
          {(['full', 'half'] as const).map(w => <button key={w} onClick={() => update({ width: w })} className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors capitalize ${field.width === w ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#dce8f7] text-slate-500 hover:bg-slate-50'}`}>{w} Width</button>)}
        </div>
      </div>
      {isAutoFillable && <div><label className={lCls}>Auto-fill Key</label><select value={field.autoFillKey ?? ''} onChange={e => update({ autoFillKey: e.target.value || undefined })} className={iCls}><option value="">None</option><option value="full_name">Full Name</option><option value="email">Email</option><option value="department">Department</option><option value="student_id">Student ID</option></select></div>}
      {field.type === 'RATING' && <div><label className={lCls}>Max Rating</label><div className="flex gap-2">{[3, 5, 10].map(n => <button key={n} onClick={() => update({ maxRating: n })} className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold ${(field.maxRating ?? 5) === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#dce8f7] text-slate-500 hover:bg-slate-50'}`}>{n} stars</button>)}</div></div>}
      {field.type === 'FILE_UPLOAD' && <div><label className={lCls}>Accepted File Types</label><div className="space-y-1.5">{['.pdf', '.jpg', '.png', '.doc', '.docx', '.xlsx'].map(ext => <label key={ext} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"><input type="checkbox" checked={(field.acceptedFiles ?? []).includes(ext)} onChange={e => { const c = field.acceptedFiles ?? []; update({ acceptedFiles: e.target.checked ? [...c, ext] : c.filter(x => x !== ext) }) }} className="rounded" />{ext}</label>)}</div></div>}
      {(field.type === 'SECTION_DIVIDER' || field.type === 'RICH_TEXT') && <div><label className={lCls}>Content</label><textarea value={field.placeholder ?? ''} onChange={e => update({ placeholder: e.target.value })} rows={3} className={`${iCls} resize-none`} placeholder="Enter section content…" /></div>}
      {hasOptions && <div><label className={lCls}>Options</label><div className="space-y-1.5">{(field.options ?? []).map((opt, idx) => <div key={idx} className="flex items-center gap-1.5"><input value={opt} onChange={e => updateOption(idx, e.target.value)} className="flex-1 rounded-lg border border-[#dce8f7] bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20" /><button onClick={() => removeOption(idx)} className="p-1 text-slate-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button></div>)}<button onClick={addOption} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium mt-1"><Plus className="h-3.5 w-3.5" />Add Option</button></div></div>}
      {/* Conditional Logic */}
      <div className="border-t border-[#e4ebf5] pt-3">
        <button onClick={() => setShowCondition(!showCondition)} className="flex items-center gap-2 text-xs font-semibold text-slate-600 w-full">
          <ToggleLeft className="h-4 w-4 text-brand-500" />
          Conditional Logic
          <ChevronUp className={`h-3.5 w-3.5 ml-auto transition-transform ${showCondition ? '' : 'rotate-180'}`} />
        </button>
        {showCondition && <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-500">Show this field only when…</p>
          <select value={field.condition?.fieldId ?? ''} onChange={e => { if (!e.target.value) { update({ condition: undefined }); return } update({ condition: { fieldId: e.target.value, operator: 'equals', value: field.condition?.value ?? '' } }) }} className={iCls}>
            <option value="">Always show</option>
            {triggerFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          {field.condition && <>
            <select value={field.condition.operator} onChange={e => update({ condition: { ...field.condition!, operator: e.target.value as FormCondition['operator'] } })} className={iCls}>
              {(['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'] as const).map(op => <option key={op} value={op}>{op.replace(/_/g, ' ')}</option>)}
            </select>
            {field.condition.operator !== 'is_empty' && field.condition.operator !== 'is_not_empty' && <input value={field.condition.value} onChange={e => update({ condition: { ...field.condition!, value: e.target.value } })} placeholder="Value…" className={iCls} />}
          </>}
        </div>}
      </div>
    </div>
  )
}

// ─── Automation Panel ─────────────────────────────────────────────────────────

function AutomationPanel({ rules, onChange }: { rules: FormAutomationRule[]; onChange: (r: FormAutomationRule[]) => void }) {
  const [editing, setEditing] = useState<FormAutomationRule | null>(null)
  const [isNew, setIsNew] = useState(false)

  const iCls = 'w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20'
  const lCls = 'block text-xs font-semibold text-slate-600 mb-1'

  function startNew() {
    const r: FormAutomationRule = { id: genId(), trigger: 'ON_SUBMIT', action: 'NOTIFY_DEPT', isActive: true, config: {} }
    setEditing(r)
    setIsNew(true)
  }

  function saveRule(r: FormAutomationRule) {
    if (isNew) onChange([...rules, r])
    else onChange(rules.map(x => x.id === r.id ? r : x))
    setEditing(null)
    setIsNew(false)
  }

  function deleteRule(id: string) { onChange(rules.filter(r => r.id !== id)) }
  function toggleRule(id: string) { onChange(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)) }

  if (editing) return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => { setEditing(null); setIsNew(false) }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft className="h-4 w-4" /></button>
        <p className="text-xs font-bold text-slate-700">{isNew ? 'New Automation Rule' : 'Edit Rule'}</p>
      </div>

      <div>
        <label className={lCls}>Rule Label (optional)</label>
        <input value={editing.label ?? ''} onChange={e => setEditing({ ...editing, label: e.target.value || undefined })} className={iCls} placeholder="e.g. Notify Finance on submit…" />
      </div>

      <div>
        <label className={lCls}>Trigger</label>
        <select value={editing.trigger} onChange={e => setEditing({ ...editing, trigger: e.target.value as FormTrigger })} className={iCls}>
          <option value="ON_SUBMIT">On Submit — when user submits form</option>
          <option value="ON_APPROVE">On Approve — when submission approved</option>
          <option value="ON_REJECT">On Reject — when submission rejected</option>
          <option value="ON_DEADLINE">On Deadline — when deadline passes</option>
        </select>
      </div>

      <div>
        <label className={lCls}>Action</label>
        <select value={editing.action} onChange={e => setEditing({ ...editing, action: e.target.value as FormActionType, config: {} })} className={iCls}>
          <option value="NOTIFY_DEPT">Notify Department</option>
          <option value="SEND_EMAIL">Send Email</option>
          <option value="CREATE_REQUEST">Create Request (Request Center)</option>
          <option value="CREATE_TICKET">Create Support Ticket</option>
          <option value="SET_STATUS">Set Submission Status</option>
          <option value="ASSIGN_TO">Assign to Role</option>
        </select>
      </div>

      {/* Config fields */}
      {editing.action === 'NOTIFY_DEPT' && (
        <div>
          <label className={lCls}>Department to Notify</label>
          <select value={editing.config.department ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, department: e.target.value } })} className={iCls}>
            <option value="">Select department…</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      )}

      {editing.action === 'SEND_EMAIL' && (
        <div className="space-y-2">
          <div>
            <label className={lCls}>Send To</label>
            <select value={editing.config.emailTo ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, emailTo: e.target.value as 'submitter' | 'dept_head' | 'custom' } })} className={iCls}>
              <option value="">Select recipient…</option>
              <option value="submitter">Form Submitter</option>
              <option value="dept_head">Department Head</option>
              <option value="custom">Custom Email</option>
            </select>
          </div>
          {editing.config.emailTo === 'custom' && <div><label className={lCls}>Email Address</label><input type="email" value={editing.config.emailAddress ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, emailAddress: e.target.value } })} className={iCls} placeholder="name@school.edu" /></div>}
          <div><label className={lCls}>Subject</label><input value={editing.config.emailSubject ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, emailSubject: e.target.value } })} className={iCls} placeholder="e.g. Your form submission was received" /></div>
          <div><label className={lCls}>Message Body</label><textarea value={editing.config.emailBody ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, emailBody: e.target.value } })} rows={3} className={`${iCls} resize-none`} placeholder="Email content…" /></div>
        </div>
      )}

      {editing.action === 'CREATE_REQUEST' && (
        <div className="space-y-2">
          <div>
            <label className={lCls}>Request Category</label>
            <select value={editing.config.requestCategory ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, requestCategory: e.target.value } })} className={iCls}>
              <option value="">Select…</option>
              <option value="LEAVE">Leave</option>
              <option value="PURCHASE">Purchase</option>
              <option value="ASSET">Asset</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </div>
      )}

      {editing.action === 'CREATE_TICKET' && (
        <div className="space-y-2">
          <div>
            <label className={lCls}>Ticket Priority</label>
            <select value={editing.config.ticketPriority ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, ticketPriority: e.target.value } })} className={iCls}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      )}

      {editing.action === 'SET_STATUS' && (
        <div>
          <label className={lCls}>Set Status To</label>
          <select value={editing.config.submissionStatus ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, submissionStatus: e.target.value } })} className={iCls}>
            <option value="">Select…</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      )}

      {editing.action === 'ASSIGN_TO' && (
        <div>
          <label className={lCls}>Assign To Role</label>
          <select value={editing.config.assignToRole ?? ''} onChange={e => setEditing({ ...editing, config: { ...editing.config, assignToRole: e.target.value } })} className={iCls}>
            <option value="">Select role…</option>
            {APPROVER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={() => { setEditing(null); setIsNew(false) }} className="flex-1 rounded-lg border border-[#dce8f7] py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => saveRule(editing)} className="flex-1 rounded-lg bg-brand-500 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">Save Rule</button>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-bold uppercase tracking-widest text-slate-400">Automation Rules</p>
        <button onClick={startNew} className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors">
          <Plus className="h-3.5 w-3.5" />New Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#e4ebf5] py-8 text-center">
          <Zap className="h-6 w-6 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">No automation rules yet</p>
          <p className="text-2xs text-slate-300 mt-0.5">Add rules to auto-trigger actions when forms are submitted or approved</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className={cn('rounded-xl border p-3 transition-colors', rule.isActive ? 'border-[#e4ebf5] bg-white' : 'border-[#f0f0f0] bg-slate-50')}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {rule.label && <p className="text-xs font-semibold text-slate-700 truncate mb-1.5">{rule.label}</p>}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn('rounded-full px-2 py-0.5 text-2xs font-bold', TRIGGER_COLORS[rule.trigger])}>
                      {TRIGGER_LABELS[rule.trigger]}
                    </span>
                    <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-2xs font-semibold">
                      {ACTION_LABELS[rule.action]}
                    </span>
                  </div>
                  {rule.config.department && <p className="text-2xs text-slate-400 mt-1">→ {rule.config.department}</p>}
                  {rule.config.emailTo && <p className="text-2xs text-slate-400 mt-1">→ {rule.config.emailTo === 'custom' ? rule.config.emailAddress : rule.config.emailTo}</p>}
                  {rule.config.assignToRole && <p className="text-2xs text-slate-400 mt-1">→ {APPROVER_ROLES.find(r => r.value === rule.config.assignToRole)?.label ?? rule.config.assignToRole}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Active toggle */}
                  <button onClick={() => toggleRule(rule.id)} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${rule.isActive ? 'bg-brand-500' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${rule.isActive ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                  </button>
                  <button onClick={() => { setEditing({ ...rule }); setIsNew(false) }} className="p-1 text-slate-400 hover:text-brand-600 rounded-md hover:bg-brand-50 transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
        <p className="text-2xs text-brand-600 font-semibold mb-1 flex items-center gap-1"><Bell className="h-3 w-3" />How Automation Works</p>
        <p className="text-2xs text-slate-500 leading-relaxed">Rules fire automatically when their trigger condition is met. Rules are processed in order. Disabled rules are skipped.</p>
      </div>
    </div>
  )
}

// ─── Approval Panel ───────────────────────────────────────────────────────────

function ApprovalPanel({ config, onChange }: { config: FormApprovalConfig; onChange: (c: FormApprovalConfig) => void }) {
  function update(patch: Partial<FormApprovalConfig>) { onChange({ ...config, ...patch }) }

  function addStep() {
    const step: FormApprovalStep = {
      id: genId(),
      order: config.steps.length + 1,
      approverRole: 'ACCOUNTING',
      approverLabel: 'Accounting Officer',
      required: true,
    }
    update({ steps: [...config.steps, step] })
  }

  function updateStep(id: string, patch: Partial<FormApprovalStep>) {
    update({ steps: config.steps.map(s => s.id === id ? { ...s, ...patch } : s) })
  }

  function removeStep(id: string) {
    const steps = config.steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }))
    update({ steps })
  }

  function moveStep(id: string, dir: 'up' | 'down') {
    const steps = [...config.steps]
    const idx = steps.findIndex(s => s.id === id)
    if (dir === 'up' && idx > 0) [steps[idx - 1], steps[idx]] = [steps[idx], steps[idx - 1]]
    else if (dir === 'down' && idx < steps.length - 1) [steps[idx], steps[idx + 1]] = [steps[idx + 1], steps[idx]]
    update({ steps: steps.map((s, i) => ({ ...s, order: i + 1 })) })
  }

  const iCls = 'w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20'
  const lCls = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className={cn('rounded-xl border p-3 transition-colors', config.enabled ? 'border-brand-200 bg-brand-50' : 'border-[#e4ebf5] bg-white')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700">Approval Workflow</p>
            <p className="text-2xs text-slate-400 mt-0.5">{config.enabled ? 'Submissions require approval before processing' : 'Submissions are auto-processed'}</p>
          </div>
          <button onClick={() => update({ enabled: !config.enabled })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.enabled ? 'bg-brand-500' : 'bg-slate-200'}`}>
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Approval Mode */}
          <div>
            <label className={lCls}>Approval Mode</label>
            <div className="space-y-1.5">
              {([
                { value: 'SEQUENTIAL', label: 'Sequential', desc: 'Approvers act in order — step 2 only after step 1 approves' },
                { value: 'ANY_ONE',    label: 'Any One',    desc: 'Any single approver can approve the submission' },
                { value: 'ALL',        label: 'All Required', desc: 'All approvers must approve regardless of order' },
              ] as { value: FormApprovalMode; label: string; desc: string }[]).map(m => (
                <button key={m.value} onClick={() => update({ mode: m.value })}
                  className={cn('w-full rounded-lg border px-3 py-2 text-left transition-colors', config.mode === m.value ? 'border-brand-500 bg-brand-50' : 'border-[#dce8f7] bg-white hover:bg-slate-50')}>
                  <p className={cn('text-xs font-semibold', config.mode === m.value ? 'text-brand-700' : 'text-slate-700')}>{m.label}</p>
                  <p className="text-2xs text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Approval Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={lCls} style={{ marginBottom: 0 }}>Approval Steps</label>
              <button onClick={addStep} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                <Plus className="h-3.5 w-3.5" />Add Step
              </button>
            </div>

            {config.steps.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#e4ebf5] py-6 text-center">
                <UserCheck className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No approval steps yet</p>
                <button onClick={addStep} className="mt-2 text-xs text-brand-600 hover:underline font-medium">Add the first step</button>
              </div>
            ) : (
              <div className="space-y-2">
                {config.steps.map((step, idx) => (
                  <div key={step.id} className="rounded-xl border border-[#e4ebf5] bg-white p-3">
                    {/* Step header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-2xs font-bold shrink-0">{step.order}</span>
                      <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{step.approverLabel}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => moveStep(step.id, 'up')} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveStep(step.id, 'down')} disabled={idx === config.steps.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeStep(step.id)} className="p-0.5 text-slate-400 hover:text-red-500 ml-0.5"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {/* Approver role */}
                    <select
                      value={step.approverRole}
                      onChange={e => {
                        const role = APPROVER_ROLES.find(r => r.value === e.target.value)
                        updateStep(step.id, { approverRole: e.target.value, approverLabel: role?.label ?? e.target.value })
                      }}
                      className={iCls + ' text-xs'}
                    >
                      {APPROVER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>

                    {/* Required + auto-approve */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-2xs text-slate-500">Required</span>
                      <button onClick={() => updateStep(step.id, { required: !step.required })} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${step.required ? 'bg-brand-500' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${step.required ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>
                    <div className="mt-2">
                      <label className="block text-2xs text-slate-500 mb-1">Auto-approve after (days, optional)</label>
                      <input
                        type="number" min="1" max="30"
                        value={step.autoApproveDays ?? ''}
                        onChange={e => updateStep(step.id, { autoApproveDays: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="e.g. 3"
                        className={iCls + ' text-xs'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification settings */}
          <div className="border-t border-[#e4ebf5] pt-3 space-y-2">
            <p className="text-2xs font-bold uppercase tracking-widest text-slate-400">Notifications</p>
            {[
              { key: 'notifySubmitterOnApprove' as const, label: 'Notify submitter on approval' },
              { key: 'notifySubmitterOnReject'  as const, label: 'Notify submitter on rejection' },
              { key: 'allowResubmitOnReject'    as const, label: 'Allow resubmit after rejection' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{label}</span>
                <button onClick={() => update({ [key]: !config[key] })} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${config[key] ? 'bg-brand-500' : 'bg-slate-200'}`}>
                  <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${config[key] ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Approval message */}
          <div>
            <label className={lCls}>Message shown to submitter while pending</label>
            <textarea
              value={config.approvalMessage ?? ''}
              onChange={e => update({ approvalMessage: e.target.value || undefined })}
              rows={2} className={`${iCls} resize-none text-xs`}
              placeholder="e.g. Your submission is being reviewed. You will be notified once approved."
            />
          </div>
        </>
      )}

      {!config.enabled && (
        <div className="rounded-xl border border-[#e4ebf5] bg-slate-50 p-3">
          <p className="text-2xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-600">Approval workflow is off.</span> Submissions will be immediately recorded without requiring any approver action. Enable above to configure a review chain.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ form, onClose }: { form: InstitutionalForm; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-card-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e4ebf5]">
          <div className="flex items-start gap-3">
            <span className="mt-1 block w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
            <div><h2 className="text-base font-bold text-slate-900">Form Preview</h2><p className="text-sm text-slate-500">{form.title}</p></div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">{form.title}</h3>
            {form.description && <p className="mt-1 text-sm text-slate-500">{form.description}</p>}
          </div>
          {form.fields.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No fields added yet.</div>
          ) : (
            <div className="space-y-5">
              {form.fields.map(field => (
                <div key={field.id} className={field.width === 'half' ? 'w-1/2' : 'w-full'}>
                  {field.type !== 'SECTION_DIVIDER' && field.type !== 'RICH_TEXT' && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</label>}
                  {field.helpText && <p className="text-xs text-slate-400 mb-1">{field.helpText}</p>}
                  <FieldPreview field={field} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-[#e4ebf5]">
            <button disabled className="w-full h-10 bg-brand-500/50 text-white rounded-lg text-sm font-semibold cursor-not-allowed">Submit (Preview Only)</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Builder Page ─────────────────────────────────────────────────────────────

type LeftTab = 'fields' | 'automation' | 'approval' | 'settings'

const LEFT_TABS: { key: LeftTab; label: string; icon: React.ElementType }[] = [
  { key: 'fields',     label: 'Fields',     icon: Layout },
  { key: 'automation', label: 'Automation',  icon: Zap },
  { key: 'approval',   label: 'Approval',    icon: GitBranch },
  { key: 'settings',   label: 'Settings',    icon: Settings },
]

export default function BuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const form = MOCK_FORMS.find(f => f.id === id)

  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => forceUpdate(n => n + 1), [])

  const [leftTab, setLeftTab] = useState<LeftTab>('fields')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [showPreview, setShowPreview] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSave = useCallback(() => {
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (form) form.updatedAt = new Date().toISOString()
      setSaveStatus('saved')
    }, 1500)
  }, [form])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  if (!form) return (
    <div className="flex h-full items-center justify-center text-slate-400 text-sm">
      Form not found.{' '}
      <button onClick={() => router.push('/staff/forms')} className="ml-2 text-brand-600 underline">Go back</button>
    </div>
  )

  const selectedField = form.fields.find(f => f.id === selectedFieldId) ?? null

  function mutateForm(fn: (f: InstitutionalForm) => void) {
    fn(form!)
    refresh()
    triggerSave()
  }

  function addField(type: FormFieldType) {
    mutateForm(f => { const field = createField(type); f.fields.push(field); setSelectedFieldId(field.id) })
  }
  function updateField(updated: FormField) {
    mutateForm(f => { const idx = f.fields.findIndex(x => x.id === updated.id); if (idx >= 0) f.fields[idx] = updated })
  }
  function deleteField(fid: string) {
    mutateForm(f => { f.fields = f.fields.filter(x => x.id !== fid); if (selectedFieldId === fid) setSelectedFieldId(null) })
  }
  function moveField(fid: string, dir: 'up' | 'down') {
    mutateForm(f => {
      const idx = f.fields.findIndex(x => x.id === fid)
      if (dir === 'up' && idx > 0) [f.fields[idx - 1], f.fields[idx]] = [f.fields[idx], f.fields[idx - 1]]
      else if (dir === 'down' && idx < f.fields.length - 1) [f.fields[idx], f.fields[idx + 1]] = [f.fields[idx + 1], f.fields[idx]]
    })
  }
  function togglePublish() {
    mutateForm(f => { if (f.status === 'PUBLISHED') { f.status = 'DRAFT' } else { f.status = 'PUBLISHED'; f.publishedAt = new Date().toISOString() } })
  }
  function updateSetting<K extends keyof InstitutionalForm>(key: K, val: InstitutionalForm[K]) {
    mutateForm(f => { (f as InstitutionalForm)[key] = val })
  }

  // Ensure form has automation + approval defaults
  if (!form.automation) form.automation = []
  if (!form.approval)   form.approval   = defaultApproval()

  const automation = form.automation
  const approval   = form.approval

  const activeRuleCount   = automation.filter(r => r.isActive).length
  const approvalStepCount = approval.steps.length

  const panelCls = 'bg-white border-r border-[#e4ebf5] flex flex-col overflow-hidden'

  return (
    <>
      <div className="fixed left-[220px] top-14 right-0 bottom-0 z-[25] flex flex-col bg-[#f3f6fb]" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Top Bar */}
        <div className="flex items-center gap-3 border-b border-[#e4ebf5] bg-white px-4 py-2.5 shrink-0">
          <button onClick={() => router.push('/staff/forms')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-medium">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <input value={form.title} onChange={e => updateSetting('title', e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm font-bold text-slate-900 focus:outline-none border-b border-transparent focus:border-brand-300" />
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', form.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
            {form.status}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : ''}</span>
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 rounded-lg border border-[#e4ebf5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Eye className="h-3.5 w-3.5" />Preview
          </button>
          <button onClick={togglePublish} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold', form.status === 'PUBLISHED' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-500 text-white hover:bg-emerald-600')}>
            {form.status === 'PUBLISHED' ? <><XCircle className="h-3.5 w-3.5" />Unpublish</> : <><Send className="h-3.5 w-3.5" />Publish</>}
          </button>
          <button onClick={() => { triggerSave(); setSaveStatus('saved') }} className="flex items-center gap-1.5 rounded-lg bg-brand-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-600">
            <Save className="h-3.5 w-3.5" />Save
          </button>
        </div>

        {/* 3-panel body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className={cn(panelCls, 'w-[260px] shrink-0')}>
            {/* 4 tabs in a 2×2 grid */}
            <div className="grid grid-cols-4 border-b border-[#e4ebf5] shrink-0">
              {LEFT_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setLeftTab(t.key); if (t.key !== 'fields') setSelectedFieldId(null) }}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 py-2.5 text-2xs font-semibold transition-colors',
                    leftTab === t.key
                      ? 'border-b-2 border-brand-500 text-brand-600 bg-brand-50/50'
                      : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent',
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                  {/* badges */}
                  {t.key === 'automation' && activeRuleCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-500 text-white text-[9px] font-bold">{activeRuleCount}</span>
                  )}
                  {t.key === 'approval' && approval.enabled && (
                    <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold">{approvalStepCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {/* Fields tab */}
              {leftTab === 'fields' && (
                <div className="space-y-4">
                  {FIELD_GROUPS.map(group => (
                    <div key={group.label}>
                      <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.fields.map(f => (
                          <button key={f.type} onClick={() => addField(f.type)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#e4ebf5] bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors text-left">
                            <f.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Automation tab */}
              {leftTab === 'automation' && (
                <AutomationPanel
                  rules={automation}
                  onChange={rules => mutateForm(f => { f.automation = rules })}
                />
              )}

              {/* Approval tab */}
              {leftTab === 'approval' && (
                <ApprovalPanel
                  config={approval}
                  onChange={cfg => mutateForm(f => { f.approval = cfg })}
                />
              )}

              {/* Settings tab */}
              {leftTab === 'settings' && (
                <div className="space-y-3">
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Form Title</label><input value={form.title} onChange={e => updateSetting('title', e.target.value)} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" /></div>
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Description</label><textarea value={form.description ?? ''} onChange={e => updateSetting('description', e.target.value || undefined)} rows={2} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20" /></div>
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Category</label><select value={form.category} onChange={e => updateSetting('category', e.target.value)} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Visibility</label><select value={form.visibility} onChange={e => updateSetting('visibility', e.target.value as FormVisibility)} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">{VISIBILITIES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select></div>
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Department</label><select value={form.department} onChange={e => updateSetting('department', e.target.value)} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
                  <div className="border-t border-[#e4ebf5] pt-3 space-y-2">
                    {([
                      { key: 'oneSubmissionPerUser' as const, label: 'One submission per user' },
                      { key: 'allowAnonymous'        as const, label: 'Allow anonymous' },
                      { key: 'showProgressBar'       as const, label: 'Show progress bar' },
                      { key: 'autoCloseOnDeadline'   as const, label: 'Auto-close on deadline' },
                    ]).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">{label}</span>
                        <button onClick={() => updateSetting('settings', { ...form.settings, [key]: !form.settings[key] })} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.settings[key] ? 'bg-brand-500' : 'bg-slate-200'}`}>
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.settings[key] ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Deadline Date</label><input type="date" value={form.settings.deadlineDate ?? ''} onChange={e => updateSetting('settings', { ...form.settings, deadlineDate: e.target.value || undefined })} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" /></div>
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Success Message</label><textarea value={form.settings.successMessage} onChange={e => updateSetting('settings', { ...form.settings, successMessage: e.target.value })} rows={2} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20" /></div>
                  <div><label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Route to Department</label><select value={form.settings.routeToDept ?? ''} onChange={e => updateSetting('settings', { ...form.settings, routeToDept: e.target.value || undefined })} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"><option value="">None</option>{ROUTE_DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>

                  {/* Process Owner */}
                  <div className="border-t border-[#e4ebf5] pt-3">
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-2">Process Owner</label>
                    <p className="text-2xs text-slate-400 mb-2 leading-relaxed">The person accountable for this form — notified of submissions, responsible for the workflow.</p>

                    {/* Owner selector */}
                    <select
                      value={form.processOwner?.userId ?? ''}
                      onChange={e => {
                        if (!e.target.value) { updateSetting('processOwner', undefined); return }
                        const staff = STAFF_OPTIONS.find(s => s.userId === e.target.value)
                        if (staff) updateSetting('processOwner', { ...staff })
                      }}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">— No process owner assigned —</option>
                      {STAFF_OPTIONS.map(s => (
                        <option key={s.userId} value={s.userId}>{s.name} ({s.roleLabel})</option>
                      ))}
                    </select>

                    {/* Selected owner card */}
                    {form.processOwner && (
                      <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50 p-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold shrink-0">
                          {form.processOwner.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{form.processOwner.name}</p>
                          <p className="text-2xs text-brand-600 font-medium">{form.processOwner.roleLabel}</p>
                          {form.processOwner.department && <p className="text-2xs text-slate-400">{form.processOwner.department}</p>}
                          {form.processOwner.email && <p className="text-2xs text-slate-400 truncate">{form.processOwner.email}</p>}
                        </div>
                        <button
                          onClick={() => updateSetting('processOwner', undefined)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors shrink-0"
                          title="Remove process owner"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Manual override for external person */}
                    {!form.processOwner && (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-2xs text-slate-400">Or enter manually:</p>
                        <input
                          placeholder="Full name"
                          className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          onBlur={e => { if (e.target.value.trim()) updateSetting('processOwner', { name: e.target.value.trim(), roleLabel: 'External', email: '' }) }}
                        />
                        <input
                          placeholder="Email (optional)"
                          type="email"
                          className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          onBlur={e => { if (form.processOwner && e.target.value.trim()) updateSetting('processOwner', { ...form.processOwner, email: e.target.value.trim() }) }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl">
              {/* Process Owner badge on canvas */}
              {form.processOwner && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#e4ebf5] bg-white px-4 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold shrink-0">
                    {form.processOwner.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Process Owner</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {form.processOwner.name}
                      <span className="font-normal text-slate-400 ml-1">· {form.processOwner.roleLabel}</span>
                      {form.processOwner.department && <span className="font-normal text-slate-400"> · {form.processOwner.department}</span>}
                    </p>
                  </div>
                  <button onClick={() => setLeftTab('settings')} className="text-2xs text-brand-600 hover:underline font-medium shrink-0">Edit</button>
                </div>
              )}

              {/* Approval badge on canvas */}
              {approval.enabled && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                  <GitBranch className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Approval workflow active — {approval.steps.length} step{approval.steps.length !== 1 ? 's' : ''} ({approval.mode.replace('_', ' ').toLowerCase()})
                  </p>
                </div>
              )}
              {activeRuleCount > 0 && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5">
                  <Zap className="h-4 w-4 text-brand-500 shrink-0" />
                  <p className="text-xs text-brand-700 font-medium">
                    {activeRuleCount} automation rule{activeRuleCount !== 1 ? 's' : ''} active on this form
                  </p>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800">{form.title}</h2>
                {form.description && <p className="text-sm text-slate-500 mt-0.5">{form.description}</p>}
              </div>

              {form.fields.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center">
                  <Layout className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-400">Add fields from the left panel</p>
                  <p className="text-xs text-slate-300 mt-1">Click any field type chip to add it here</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {form.fields.map((field, idx) => (
                    <div key={field.id} onClick={() => { setSelectedFieldId(field.id); setLeftTab('fields') }}
                      className={cn('bg-white rounded-xl border p-4 cursor-pointer transition-all group', selectedFieldId === field.id ? 'border-brand-500 shadow-[0_0_0_2px_rgba(26,74,138,0.1)]' : 'border-[#e4ebf5] hover:border-brand-200', field.width === 'half' ? 'max-w-[50%]' : '')}>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-slate-300 cursor-grab shrink-0 select-none">⠿</span>
                        <div className="flex-1 min-w-0">
                          {field.type !== 'SECTION_DIVIDER' && field.type !== 'RICH_TEXT' && <p className="text-xs font-semibold text-slate-700 mb-1.5">{field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}</p>}
                          {field.helpText && <p className="text-xs text-slate-400 mb-1">{field.helpText}</p>}
                          <FieldPreview field={field} />
                        </div>
                        <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={e => { e.stopPropagation(); moveField(field.id, 'up') }} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={e => { e.stopPropagation(); moveField(field.id, 'down') }} disabled={idx === form.fields.length - 1} className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
                          <button onClick={e => { e.stopPropagation(); deleteField(field.id) }} className="p-0.5 text-slate-400 hover:text-red-500 mt-1"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <button onClick={() => setLeftTab('fields')} className="flex items-center gap-2 rounded-xl border-2 border-dashed border-brand-200 px-6 py-3 text-sm font-medium text-brand-500 hover:border-brand-400 hover:bg-brand-50 transition-colors">
                  <Plus className="h-4 w-4" />Add Field
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel — Field Editor (only when a field is selected) */}
          {selectedField && leftTab === 'fields' ? (
            <div className={cn(panelCls, 'w-[280px] shrink-0')}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4ebf5] shrink-0">
                <p className="text-xs font-bold text-slate-700">Field Editor</p>
                <button onClick={() => setSelectedFieldId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FieldEditor field={selectedField} allFields={form.fields} onChange={updateField} />
              </div>
            </div>
          ) : (
            <div className={cn(panelCls, 'w-[280px] shrink-0 items-center justify-center')}>
              <div className="text-center text-slate-300 px-4">
                {leftTab === 'automation' ? (
                  <>
                    <Zap className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-xs font-medium">Configure automation rules in the left panel</p>
                  </>
                ) : leftTab === 'approval' ? (
                  <>
                    <GitBranch className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-xs font-medium">Set up your approval workflow in the left panel</p>
                  </>
                ) : (
                  <>
                    <Settings className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs font-medium">Select a field to edit its properties</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreview && <PreviewModal form={form} onClose={() => setShowPreview(false)} />}
    </>
  )
}
