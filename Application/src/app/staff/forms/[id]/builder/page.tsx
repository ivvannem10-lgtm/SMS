'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronUp, ChevronDown, Trash2, Plus, Settings, Layout,
  Star, Type, AlignLeft, Hash, Mail, Phone, CalendarDays, Clock,
  ChevronDown as ChevronDownIcon, CheckSquare, Circle, Upload, Minus,
  AlignLeft as RichTextIcon, ToggleLeft, Eye, Save, Send, XCircle, X,
} from 'lucide-react'
import { MOCK_FORMS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { FormField, FormFieldType, FormCondition, InstitutionalForm, FormVisibility } from '@/types'

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

type FieldGroup = { label: string; fields: { type: FormFieldType; label: string; icon: React.ElementType }[] }

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: 'Text',
    fields: [
      { type: 'SHORT_TEXT', label: 'Short Text', icon: Type },
      { type: 'LONG_TEXT', label: 'Long Text', icon: AlignLeft },
      { type: 'NUMBER', label: 'Number', icon: Hash },
      { type: 'EMAIL', label: 'Email', icon: Mail },
      { type: 'PHONE', label: 'Phone', icon: Phone },
    ],
  },
  {
    label: 'Choice',
    fields: [
      { type: 'DROPDOWN', label: 'Dropdown', icon: ChevronDownIcon },
      { type: 'MULTI_SELECT', label: 'Multi-select', icon: CheckSquare },
      { type: 'RADIO', label: 'Radio', icon: Circle },
      { type: 'CHECKBOX', label: 'Checkbox', icon: CheckSquare },
    ],
  },
  {
    label: 'Special',
    fields: [
      { type: 'DATE', label: 'Date', icon: CalendarDays },
      { type: 'TIME', label: 'Time', icon: Clock },
      { type: 'FILE_UPLOAD', label: 'File Upload', icon: Upload },
      { type: 'RATING', label: 'Rating', icon: Star },
      { type: 'SECTION_DIVIDER', label: 'Divider', icon: Minus },
      { type: 'RICH_TEXT', label: 'Rich Text', icon: RichTextIcon },
    ],
  },
]

function genFieldId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function createField(type: FormFieldType): FormField {
  const base: FormField = { id: genFieldId(), type, label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), required: false, width: 'full' }
  if (['DROPDOWN', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(type)) base.options = ['Option 1', 'Option 2']
  if (type === 'RATING') base.maxRating = 5
  if (type === 'FILE_UPLOAD') base.acceptedFiles = ['.pdf', '.jpg', '.png']
  return base
}

// Preview field renderer
function FieldPreview({ field }: { field: FormField }) {
  const inputCls = 'w-full rounded-lg border border-[#dce8f7] bg-[#f8fafd] px-3 py-2 text-sm text-slate-400 cursor-not-allowed'
  if (field.type === 'SECTION_DIVIDER') {
    return (
      <div className="py-2">
        {field.label && field.label !== 'Section Divider' && (
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{field.label}</p>
        )}
        <hr className="border-[#dce8f7]" />
      </div>
    )
  }
  if (field.type === 'RICH_TEXT') {
    return (
      <div className="rounded-lg border border-[#dce8f7] bg-[#f8fafd] px-3 py-2 text-sm text-slate-400 min-h-[60px]">
        {field.placeholder || 'Rich text content here…'}
      </div>
    )
  }
  if (field.type === 'RATING') {
    return (
      <div className="flex gap-1">
        {Array.from({ length: field.maxRating ?? 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 text-slate-300" />
        ))}
      </div>
    )
  }
  if (field.type === 'RADIO') {
    return (
      <div className="space-y-1">
        {(field.options ?? []).map(o => (
          <label key={o} className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 rounded-full border border-slate-300 flex-shrink-0" />
            {o}
          </label>
        ))}
      </div>
    )
  }
  if (field.type === 'CHECKBOX' || field.type === 'MULTI_SELECT') {
    return (
      <div className="space-y-1">
        {(field.options ?? []).map(o => (
          <label key={o} className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 rounded border border-slate-300 flex-shrink-0" />
            {o}
          </label>
        ))}
      </div>
    )
  }
  if (field.type === 'DROPDOWN') {
    return (
      <select disabled className={inputCls}>
        <option>{field.placeholder || 'Select an option…'}</option>
      </select>
    )
  }
  if (field.type === 'LONG_TEXT') {
    return <textarea disabled rows={3} placeholder={field.placeholder || 'Enter text…'} className={`${inputCls} resize-none`} />
  }
  if (field.type === 'FILE_UPLOAD') {
    return (
      <div className="flex items-center justify-center border-2 border-dashed border-[#dce8f7] rounded-lg py-4 text-xs text-slate-400">
        <Upload className="h-4 w-4 mr-2" />
        Click to upload {field.acceptedFiles?.join(', ')}
      </div>
    )
  }
  const typeMap: Partial<Record<FormFieldType, string>> = {
    EMAIL: 'email', NUMBER: 'number', PHONE: 'tel', DATE: 'date', TIME: 'time',
  }
  return (
    <input
      type={typeMap[field.type] ?? 'text'}
      disabled
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
      className={inputCls}
    />
  )
}

// Field Editor Panel
function FieldEditor({
  field,
  allFields,
  onChange,
}: {
  field: FormField
  allFields: FormField[]
  onChange: (updated: FormField) => void
}) {
  const [showCondition, setShowCondition] = useState(!!field.condition)

  function update(patch: Partial<FormField>) {
    onChange({ ...field, ...patch })
  }

  function updateOption(idx: number, val: string) {
    const opts = [...(field.options ?? [])]
    opts[idx] = val
    update({ options: opts })
  }

  function addOption() {
    update({ options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] })
  }

  function removeOption(idx: number) {
    const opts = [...(field.options ?? [])]
    opts.splice(idx, 1)
    update({ options: opts })
  }

  const hasOptions = ['DROPDOWN', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(field.type)
  const isText = ['SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'EMAIL', 'PHONE'].includes(field.type)
  const isAutoFillable = ['SHORT_TEXT', 'EMAIL'].includes(field.type)
  const triggerFields = allFields.filter(f => f.id !== field.id && f.type !== 'SECTION_DIVIDER' && f.type !== 'RICH_TEXT')

  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'
  const inputCls = 'w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Label</label>
        <input value={field.label} onChange={e => update({ label: e.target.value })} className={inputCls} />
      </div>
      {isText && (
        <div>
          <label className={labelCls}>Placeholder</label>
          <input value={field.placeholder ?? ''} onChange={e => update({ placeholder: e.target.value })} className={inputCls} placeholder="Optional placeholder text…" />
        </div>
      )}
      <div>
        <label className={labelCls}>Help Text</label>
        <input value={field.helpText ?? ''} onChange={e => update({ helpText: e.target.value })} className={inputCls} placeholder="Optional hint for the user…" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Required</span>
        <button
          onClick={() => update({ required: !field.required })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${field.required ? 'bg-brand-500' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${field.required ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
        </button>
      </div>
      <div>
        <label className={labelCls}>Width</label>
        <div className="flex gap-2">
          {(['full', 'half'] as const).map(w => (
            <button
              key={w}
              onClick={() => update({ width: w })}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors capitalize ${
                field.width === w ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#dce8f7] text-slate-500 hover:bg-slate-50'
              }`}
            >
              {w} Width
            </button>
          ))}
        </div>
      </div>
      {isAutoFillable && (
        <div>
          <label className={labelCls}>Auto-fill Key</label>
          <select value={field.autoFillKey ?? ''} onChange={e => update({ autoFillKey: e.target.value || undefined })} className={inputCls}>
            <option value="">None</option>
            <option value="full_name">Full Name</option>
            <option value="email">Email</option>
            <option value="department">Department</option>
            <option value="student_id">Student ID</option>
          </select>
        </div>
      )}
      {field.type === 'RATING' && (
        <div>
          <label className={labelCls}>Max Rating</label>
          <div className="flex gap-2">
            {[3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => update({ maxRating: n })}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                  (field.maxRating ?? 5) === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#dce8f7] text-slate-500 hover:bg-slate-50'
                }`}
              >
                {n} stars
              </button>
            ))}
          </div>
        </div>
      )}
      {field.type === 'FILE_UPLOAD' && (
        <div>
          <label className={labelCls}>Accepted File Types</label>
          <div className="space-y-1.5">
            {['.pdf', '.jpg', '.png', '.doc', '.docx', '.xlsx'].map(ext => (
              <label key={ext} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(field.acceptedFiles ?? []).includes(ext)}
                  onChange={e => {
                    const curr = field.acceptedFiles ?? []
                    update({ acceptedFiles: e.target.checked ? [...curr, ext] : curr.filter(x => x !== ext) })
                  }}
                  className="rounded"
                />
                {ext}
              </label>
            ))}
          </div>
        </div>
      )}
      {(field.type === 'SECTION_DIVIDER' || field.type === 'RICH_TEXT') && (
        <div>
          <label className={labelCls}>Content</label>
          <textarea
            value={field.placeholder ?? ''}
            onChange={e => update({ placeholder: e.target.value })}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Enter section content or divider label…"
          />
        </div>
      )}
      {hasOptions && (
        <div>
          <label className={labelCls}>Options</label>
          <div className="space-y-1.5">
            {(field.options ?? []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-[#dce8f7] bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button onClick={() => removeOption(idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addOption} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium mt-1">
              <Plus className="h-3.5 w-3.5" />
              Add Option
            </button>
          </div>
        </div>
      )}
      {/* Conditional Logic */}
      <div className="border-t border-[#e4ebf5] pt-3">
        <button
          onClick={() => setShowCondition(!showCondition)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 w-full"
        >
          <ToggleLeft className="h-4 w-4 text-brand-500" />
          Conditional Logic
          <ChevronUp className={`h-3.5 w-3.5 ml-auto transition-transform ${showCondition ? '' : 'rotate-180'}`} />
        </button>
        {showCondition && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-500">Show this field only when…</p>
            <select
              value={field.condition?.fieldId ?? ''}
              onChange={e => {
                if (!e.target.value) { update({ condition: undefined }); return }
                update({ condition: { fieldId: e.target.value, operator: 'equals', value: field.condition?.value ?? '' } })
              }}
              className={inputCls}
            >
              <option value="">Always show</option>
              {triggerFields.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            {field.condition && (
              <>
                <select
                  value={field.condition.operator}
                  onChange={e => update({ condition: { ...field.condition!, operator: e.target.value as FormCondition['operator'] } })}
                  className={inputCls}
                >
                  {(['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'] as const).map(op => (
                    <option key={op} value={op}>{op.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {field.condition.operator !== 'is_empty' && field.condition.operator !== 'is_not_empty' && (
                  <input
                    value={field.condition.value}
                    onChange={e => update({ condition: { ...field.condition!, value: e.target.value } })}
                    placeholder="Value…"
                    className={inputCls}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Full preview modal
function PreviewModal({ form, onClose }: { form: InstitutionalForm; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-card-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e4ebf5]">
          <div className="flex items-start gap-3">
            <span className="mt-1 block w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Form Preview</h2>
              <p className="text-sm text-slate-500">{form.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
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
                  {field.type !== 'SECTION_DIVIDER' && field.type !== 'RICH_TEXT' && (
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                  )}
                  {field.helpText && <p className="text-xs text-slate-400 mb-1">{field.helpText}</p>}
                  <FieldPreview field={field} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-[#e4ebf5]">
            <button disabled className="w-full h-10 bg-brand-500/50 text-white rounded-lg text-sm font-semibold cursor-not-allowed">
              Submit (Preview Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const form = MOCK_FORMS.find(f => f.id === id)

  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => forceUpdate(n => n + 1), [])

  const [leftTab, setLeftTab] = useState<'fields' | 'settings'>('fields')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [showPreview, setShowPreview] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Trigger autosave
  const triggerSave = useCallback(() => {
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (form) form.updatedAt = new Date().toISOString()
      setSaveStatus('saved')
    }, 1500)
  }, [form])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  if (!form) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400 text-sm">
        Form not found.{' '}
        <button onClick={() => router.push('/staff/forms')} className="ml-2 text-brand-600 underline">Go back</button>
      </div>
    )
  }

  const selectedField = form.fields.find(f => f.id === selectedFieldId) ?? null

  function mutateForm(fn: (f: InstitutionalForm) => void) {
    fn(form!)
    refresh()
    triggerSave()
  }

  function addField(type: FormFieldType) {
    mutateForm(f => {
      const field = createField(type)
      f.fields.push(field)
      setSelectedFieldId(field.id)
    })
  }

  function updateField(updated: FormField) {
    mutateForm(f => {
      const idx = f.fields.findIndex(x => x.id === updated.id)
      if (idx >= 0) f.fields[idx] = updated
    })
  }

  function deleteField(fid: string) {
    mutateForm(f => {
      f.fields = f.fields.filter(x => x.id !== fid)
      if (selectedFieldId === fid) setSelectedFieldId(null)
    })
  }

  function moveField(fid: string, dir: 'up' | 'down') {
    mutateForm(f => {
      const idx = f.fields.findIndex(x => x.id === fid)
      if (dir === 'up' && idx > 0) {
        [f.fields[idx - 1], f.fields[idx]] = [f.fields[idx], f.fields[idx - 1]]
      } else if (dir === 'down' && idx < f.fields.length - 1) {
        [f.fields[idx], f.fields[idx + 1]] = [f.fields[idx + 1], f.fields[idx]]
      }
    })
  }

  function togglePublish() {
    mutateForm(f => {
      if (f.status === 'PUBLISHED') {
        f.status = 'DRAFT'
      } else {
        f.status = 'PUBLISHED'
        f.publishedAt = new Date().toISOString()
      }
    })
  }

  // Settings update helpers
  function updateSetting<K extends keyof InstitutionalForm>(key: K, val: InstitutionalForm[K]) {
    mutateForm(f => { (f as InstitutionalForm)[key] = val })
  }

  const panelCls = 'bg-white border-r border-[#e4ebf5] flex flex-col overflow-hidden'

  return (
    <>
      {/* Full-page override */}
      <div
        className="fixed left-[220px] top-14 right-0 bottom-0 z-[25] flex flex-col bg-[#f3f6fb]"
        style={{ height: 'calc(100vh - 56px)' }}
      >
        {/* Top Bar */}
        <div className="flex items-center gap-3 border-b border-[#e4ebf5] bg-white px-4 py-2.5 shrink-0">
          <button
            onClick={() => router.push('/staff/forms')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <input
            value={form.title}
            onChange={e => updateSetting('title', e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm font-bold text-slate-900 focus:outline-none border-b border-transparent focus:border-brand-300"
          />
          <span className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
            form.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
          )}>
            {form.status}
          </span>
          <span className="text-xs text-slate-400 shrink-0">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : ''}
          </span>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#e4ebf5] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            onClick={togglePublish}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              form.status === 'PUBLISHED'
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-500 text-white hover:bg-emerald-600',
            )}
          >
            {form.status === 'PUBLISHED' ? <><XCircle className="h-3.5 w-3.5" />Unpublish</> : <><Send className="h-3.5 w-3.5" />Publish</>}
          </button>
          <button
            onClick={() => { triggerSave(); setSaveStatus('saved') }}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-600 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </button>
        </div>

        {/* 3-panel body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className={cn(panelCls, 'w-[260px] shrink-0')}>
            {/* Tabs */}
            <div className="flex border-b border-[#e4ebf5] shrink-0">
              {(['fields', 'settings'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setLeftTab(t)}
                  className={cn(
                    'flex-1 py-2.5 text-xs font-semibold capitalize transition-colors',
                    leftTab === t
                      ? 'border-b-2 border-brand-500 text-brand-600 bg-brand-50/50'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {t === 'fields' ? <><Layout className="inline h-3.5 w-3.5 mr-1" />Fields</> : <><Settings className="inline h-3.5 w-3.5 mr-1" />Settings</>}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {leftTab === 'fields' ? (
                <div className="space-y-4">
                  {FIELD_GROUPS.map(group => (
                    <div key={group.label}>
                      <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.fields.map(f => (
                          <button
                            key={f.type}
                            onClick={() => addField(f.type)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#e4ebf5] bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors text-left"
                          >
                            <f.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Form Title</label>
                    <input value={form.title} onChange={e => updateSetting('title', e.target.value)}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Description</label>
                    <textarea value={form.description ?? ''} onChange={e => updateSetting('description', e.target.value || undefined)}
                      rows={2} className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Category</label>
                    <select value={form.category} onChange={e => updateSetting('category', e.target.value)}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Visibility</label>
                    <select value={form.visibility} onChange={e => updateSetting('visibility', e.target.value as FormVisibility)}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                      {VISIBILITIES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Department</label>
                    <select value={form.department} onChange={e => updateSetting('department', e.target.value)}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  {/* Settings toggles */}
                  <div className="border-t border-[#e4ebf5] pt-3 space-y-2">
                    {[
                      { key: 'oneSubmissionPerUser' as const, label: 'One submission per user' },
                      { key: 'allowAnonymous' as const, label: 'Allow anonymous' },
                      { key: 'showProgressBar' as const, label: 'Show progress bar' },
                      { key: 'autoCloseOnDeadline' as const, label: 'Auto-close on deadline' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">{label}</span>
                        <button
                          onClick={() => updateSetting('settings', { ...form.settings, [key]: !form.settings[key] })}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.settings[key] ? 'bg-brand-500' : 'bg-slate-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.settings[key] ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Deadline Date</label>
                    <input type="date" value={form.settings.deadlineDate ?? ''}
                      onChange={e => updateSetting('settings', { ...form.settings, deadlineDate: e.target.value || undefined })}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Success Message</label>
                    <textarea
                      value={form.settings.successMessage}
                      onChange={e => updateSetting('settings', { ...form.settings, successMessage: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-widest text-slate-400 mb-1">Route to Department</label>
                    <select value={form.settings.routeToDept ?? ''}
                      onChange={e => updateSetting('settings', { ...form.settings, routeToDept: e.target.value || undefined })}
                      className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                      <option value="">None</option>
                      {ROUTE_DEPTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800">{form.title}</h2>
                {form.description && <p className="text-sm text-slate-500 mt-0.5">{form.description}</p>}
              </div>

              {form.fields.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center">
                  <Layout className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-400">Add fields from the left panel to build your form</p>
                  <p className="text-xs text-slate-300 mt-1">Click any field type chip to add it here</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {form.fields.map((field, idx) => (
                    <div
                      key={field.id}
                      onClick={() => setSelectedFieldId(field.id)}
                      className={cn(
                        'bg-white rounded-xl border p-4 cursor-pointer transition-all group',
                        selectedFieldId === field.id ? 'border-brand-500 shadow-[0_0_0_2px_rgba(26,74,138,0.1)]' : 'border-[#e4ebf5] hover:border-brand-200',
                        field.width === 'half' ? 'max-w-[50%]' : '',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-slate-300 cursor-grab shrink-0 select-none">⠿</span>
                        <div className="flex-1 min-w-0">
                          {field.type !== 'SECTION_DIVIDER' && field.type !== 'RICH_TEXT' && (
                            <p className="text-xs font-semibold text-slate-700 mb-1.5">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </p>
                          )}
                          {field.helpText && <p className="text-xs text-slate-400 mb-1">{field.helpText}</p>}
                          <FieldPreview field={field} />
                        </div>
                        <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={e => { e.stopPropagation(); moveField(field.id, 'up') }} disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors">
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); moveField(field.id, 'down') }} disabled={idx === form.fields.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteField(field.id) }}
                            className="p-0.5 text-slate-400 hover:text-red-500 transition-colors mt-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Field */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setLeftTab('fields')}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-brand-200 px-6 py-3 text-sm font-medium text-brand-500 hover:border-brand-400 hover:bg-brand-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Field Editor */}
          {selectedField ? (
            <div className={cn(panelCls, 'w-[280px] shrink-0')}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4ebf5] shrink-0">
                <p className="text-xs font-bold text-slate-700">Field Editor</p>
                <button onClick={() => setSelectedFieldId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FieldEditor
                  field={selectedField}
                  allFields={form.fields}
                  onChange={updateField}
                />
              </div>
            </div>
          ) : (
            <div className={cn(panelCls, 'w-[280px] shrink-0 items-center justify-center')}>
              <div className="text-center text-slate-300 px-4">
                <Settings className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs font-medium">Select a field to edit its properties</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreview && <PreviewModal form={form} onClose={() => setShowPreview(false)} />}
    </>
  )
}
