'use client'
import { useState, useCallback } from 'react'
import {
  Search, ClipboardList, FileText, Star, CheckSquare, Users,
  Clock, ChevronRight, X, Check,
} from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MOCK_FORMS, MOCK_FORM_SUBMISSIONS, nextFsubId } from '@/lib/mock-data'
import { formatDateTime } from '@/lib/utils'
import type {
  InstitutionalForm, FormField, FormSubmissionStatus, FormVisibility,
} from '@/types'

const CATEGORIES_FILTER = ['All', 'Request', 'Survey', 'Feedback', 'Evaluation', 'Registration', 'Other']

const SUB_STATUS_COLORS: Record<FormSubmissionStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  COMPLETED: 'bg-teal-50 text-teal-700',
}

function getFormIcon(category: string) {
  const map: Record<string, React.ElementType> = {
    Request: FileText,
    Survey: ClipboardList,
    Feedback: Star,
    Evaluation: CheckSquare,
    Registration: Users,
    'Incident Report': FileText,
    Other: FileText,
  }
  return map[category] ?? FileText
}

function getDeptFromRole(role: string): string {
  const map: Record<string, string> = {
    TEACHER: 'College of Computing',
    STUDENT: 'Student',
    HR_STAFF: 'Human Resources',
    AMO: 'Asset Management',
    REGISTRAR: 'Registrar',
    ACADEMIC_ADMIN: 'Academic Affairs',
    ACCOUNTING: 'Finance',
    PURCHASING_OFFICER: 'Purchasing',
    TREASURER: 'Finance',
    DEAN: 'Administration',
    SUPER_ADMIN: 'Administration',
  }
  return map[role] ?? 'Administration'
}

function evaluateCondition(field: FormField, responses: Record<string, string | string[] | number>): boolean {
  if (!field.condition) return true
  const { fieldId, operator, value } = field.condition
  const prev = responses[fieldId]
  const prevStr = prev !== undefined ? String(prev) : ''
  if (operator === 'equals') return prevStr === value
  if (operator === 'not_equals') return prevStr !== value
  if (operator === 'contains') return prevStr.includes(value)
  if (operator === 'is_empty') return !prev || prevStr === ''
  if (operator === 'is_not_empty') return !!prev && prevStr !== ''
  return true
}

// Single field renderer for fill modal
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: string | string[] | number | undefined
  onChange: (v: string | string[] | number) => void
}) {
  const inputCls = 'w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  if (field.type === 'SECTION_DIVIDER') {
    return (
      <div className="py-1">
        {field.label && field.label !== 'Section Divider' && (
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{field.label}</p>
        )}
        <hr className="border-[#dce8f7]" />
      </div>
    )
  }

  if (field.type === 'RICH_TEXT') {
    return (
      <div className="rounded-lg border border-[#dce8f7] bg-[#f8fafd] px-3 py-2 text-sm text-slate-500 min-h-[48px]">
        {field.placeholder || 'Section content'}
      </div>
    )
  }

  if (field.type === 'RATING') {
    const max = field.maxRating ?? 5
    const numVal = typeof value === 'number' ? value : 0
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <button key={i} type="button" onClick={() => onChange(i + 1)}>
            <Star className={`h-6 w-6 transition-colors ${i < numVal ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
    )
  }

  if (field.type === 'RADIO') {
    return (
      <div className="space-y-1.5">
        {(field.options ?? []).map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700">
            <input
              type="radio"
              name={field.id}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="accent-brand-500"
            />
            {opt}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'CHECKBOX' || field.type === 'MULTI_SELECT') {
    const arrVal = Array.isArray(value) ? value : []
    return (
      <div className="space-y-1.5">
        {(field.options ?? []).map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              value={opt}
              checked={arrVal.includes(opt)}
              onChange={e => {
                const next = e.target.checked ? [...arrVal, opt] : arrVal.filter(x => x !== opt)
                onChange(next)
              }}
              className="accent-brand-500 rounded"
            />
            {opt}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'DROPDOWN') {
    return (
      <select value={String(value ?? '')} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">{field.placeholder || 'Select an option…'}</option>
        {(field.options ?? []).map(opt => <option key={opt}>{opt}</option>)}
      </select>
    )
  }

  if (field.type === 'LONG_TEXT') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        rows={4}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
        className={`${inputCls} resize-none`}
      />
    )
  }

  if (field.type === 'FILE_UPLOAD') {
    return (
      <div className="flex items-center justify-center border-2 border-dashed border-[#dce8f7] rounded-lg py-4 text-xs text-slate-400">
        <input type="file" accept={(field.acceptedFiles ?? []).join(',')} className="hidden" id={`file_${field.id}`} />
        <label htmlFor={`file_${field.id}`} className="cursor-pointer flex items-center gap-2">
          <Check className="h-4 w-4" />
          Click to upload {(field.acceptedFiles ?? []).join(', ')}
        </label>
      </div>
    )
  }

  const typeMap: Record<string, string> = {
    EMAIL: 'email', NUMBER: 'number', PHONE: 'tel', DATE: 'date', TIME: 'time',
  }
  const inputType = typeMap[field.type] ?? 'text'
  return (
    <input
      type={inputType}
      value={String(value ?? '')}
      onChange={e => onChange(inputType === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
      className={inputCls}
    />
  )
}

// Fill Form Modal
function FillFormModal({
  form,
  userId,
  userName,
  userRole,
  onClose,
  onSubmit,
}: {
  form: InstitutionalForm
  userId: string
  userName: string
  userRole: string
  onClose: () => void
  onSubmit: (formId: string) => void
}) {
  const [responses, setResponses] = useState<Record<string, string | string[] | number>>(() => {
    const init: Record<string, string | string[] | number> = {}
    form.fields.forEach(f => {
      if (f.autoFillKey === 'full_name') init[f.id] = userName
      else if (f.autoFillKey === 'email') init[f.id] = `${userName.toLowerCase().replace(/\s/g, '.')}@school.edu`
      else if (f.autoFillKey === 'department') init[f.id] = getDeptFromRole(userRole)
      else if (f.autoFillKey === 'student_id') init[f.id] = userId
    })
    return init
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function setFieldValue(fieldId: string, val: string | string[] | number) {
    setResponses(prev => ({ ...prev, [fieldId]: val }))
  }

  function handleSubmit() {
    setSubmitting(true)
    setTimeout(() => {
      const sub = {
        id: nextFsubId(),
        formId: form.id,
        formTitle: form.title,
        submittedBy: userId,
        submittedByName: userName,
        submittedByRole: userRole,
        responses,
        status: 'SUBMITTED' as FormSubmissionStatus,
        schoolId: 'school_1',
        submittedAt: new Date().toISOString(),
      }
      MOCK_FORM_SUBMISSIONS.push(sub)
      const f = MOCK_FORMS.find(x => x.id === form.id)
      if (f) f.submissionCount++
      setSubmitting(false)
      setSubmitted(true)
      onSubmit(form.id)
    }, 600)
  }

  const visibleFields = form.fields.filter(f => evaluateCondition(f, responses))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-card-lg overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#e4ebf5] shrink-0">
          <div className="flex items-start gap-3">
            <span className="mt-1 block w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">{form.title}</h2>
              {form.description && <p className="mt-0.5 text-sm text-slate-500">{form.description}</p>}
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Submitted!</h3>
              <p className="text-sm text-slate-500 max-w-sm">{form.settings.successMessage}</p>
              <Button variant="outline" className="mt-6" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div className="space-y-5">
              {visibleFields.map(field => (
                <div key={field.id} className={field.width === 'half' ? 'w-1/2' : 'w-full'}>
                  {field.type !== 'SECTION_DIVIDER' && field.type !== 'RICH_TEXT' && (
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                  )}
                  {field.helpText && <p className="text-xs text-slate-400 mb-1">{field.helpText}</p>}
                  <FieldInput
                    field={field}
                    value={responses[field.id]}
                    onChange={val => setFieldValue(field.id, val)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {!submitted && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e4ebf5] bg-[#f8fafd] rounded-b-2xl shrink-0">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting} icon={<Check className="h-3.5 w-3.5" />}>
              Submit Form
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface FormsCenterProps {
  portal: 'staff' | 'teacher' | 'student'
  userId: string
  userName: string
  userRole: string
  onRefresh?: () => void
  /** When set, only shows forms owned by this dept or routed to it for approval */
  deptFilter?: string
}

function visibilityMatchesPortal(vis: FormVisibility, portal: 'staff' | 'teacher' | 'student'): boolean {
  if (portal === 'staff') return true  // staff sees all published forms regardless of visibility
  if (vis === 'PUBLIC_INTERNAL') return true
  if (portal === 'student') return vis === 'STUDENT_ONLY'
  if (portal === 'teacher') return vis === 'STAFF_ONLY'
  return false
}

export function FormsCenter({ portal, userId, userName, userRole, onRefresh, deptFilter }: FormsCenterProps) {
  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => {
    forceUpdate(n => n + 1)
    onRefresh?.()
  }, [onRefresh])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [activeTab, setActiveTab] = useState<'forms' | 'my-submissions'>('forms')
  const [fillForm, setFillForm] = useState<InstitutionalForm | null>(null)

  const matchesDept = (f: InstitutionalForm) => {
    if (!deptFilter) return true
    return f.department === deptFilter || f.settings.routeToDept === deptFilter
  }

  const draftCount = portal === 'staff'
    ? MOCK_FORMS.filter(f => f.status === 'DRAFT' && matchesDept(f)).length
    : 0

  const publishedForms = MOCK_FORMS.filter(f => {
    if (f.status !== 'PUBLISHED') return false
    if (!visibilityMatchesPortal(f.visibility, portal)) return false
    if (!matchesDept(f)) return false
    if (categoryFilter !== 'All' && f.category !== categoryFilter) return false
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const mySubmissions = MOCK_FORM_SUBMISSIONS.filter(s => s.submittedBy === userId)

  function handleSubmit() {
    refresh()
  }

  return (
    <div>
      <SectionTitle description="Submit and track your institutional forms">
        Forms Center
      </SectionTitle>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-[#e4ebf5]">
        <button
          onClick={() => setActiveTab('forms')}
          className={`pb-2.5 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'forms'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Browse Forms
        </button>
        <button
          onClick={() => setActiveTab('my-submissions')}
          className={`pb-2.5 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'my-submissions'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Submissions{mySubmissions.length > 0 && (
            <span className="ml-1.5 rounded-full bg-brand-100 text-brand-700 px-1.5 py-0.5 text-xs">{mySubmissions.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'forms' ? (
        <>
          {/* Search + Category filter */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search forms…"
                className="h-9 rounded-lg border border-[#e4ebf5] bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES_FILTER.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-brand-500 text-white'
                      : 'bg-white border border-[#e4ebf5] text-slate-600 hover:bg-brand-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Department filter banner */}
          {deptFilter && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs text-brand-700">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-[10px] shrink-0">F</span>
              <span>
                Showing <span className="font-bold">{deptFilter}</span> forms —
                forms owned by or routed to your department for approval.
              </span>
            </div>
          )}

          {/* Draft notice for staff */}
          {draftCount > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 text-white font-bold text-[10px]">!</span>
              {draftCount} form{draftCount !== 1 ? 's are' : ' is'} in draft — not shown here until published. Manage them in the <span className="font-semibold text-brand-600 mx-0.5">Form Builder</span> tab.
            </div>
          )}

          {publishedForms.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-16 text-center">
                <ClipboardList className="h-12 w-12 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-400">No forms available</p>
                <p className="text-xs text-slate-300 mt-1">Check back later for new forms</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publishedForms.map(form => {
                const Icon = getFormIcon(form.category)
                return (
                  <div key={form.id} className="bg-white rounded-xl border border-[#e4ebf5] shadow-card flex flex-col overflow-hidden hover:shadow-card-md transition-all hover:-translate-y-px">
                    <div className="p-5 flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                          <Icon className="h-4.5 w-4.5 text-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 leading-snug">{form.title}</h3>
                        </div>
                      </div>
                      {form.description && (
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{form.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-brand-50 text-brand-700 text-xs px-2 py-0.5 font-medium">{form.department}</span>
                        <span className="rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-0.5 font-medium">{form.category}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {form.submissionCount} submission{form.submissionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="px-5 pb-4">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => setFillForm(form)}
                        iconRight={<ChevronRight className="h-3.5 w-3.5" />}
                      >
                        Fill Out Form
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* My Submissions */
        <Card padding="none">
          {mySubmissions.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <ClipboardList className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No submissions yet</p>
              <p className="text-xs text-slate-300 mt-1">Fill out a form to see it here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                    <th className="text-left px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Form</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Submitted</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-brand-700 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f4fa]">
                  {mySubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-brand-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{sub.formTitle}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(sub.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${SUB_STATUS_COLORS[sub.status]}`}>
                          {sub.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-slate-400">{sub.id}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {fillForm && (
        <FillFormModal
          form={fillForm}
          userId={userId}
          userName={userName}
          userRole={userRole}
          onClose={() => setFillForm(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
