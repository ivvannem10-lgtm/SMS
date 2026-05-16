'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Plus, LayoutTemplate, Eye, Edit3, Copy, Archive,
  Send, XCircle, ClipboardList, Search, FileText,
} from 'lucide-react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MOCK_FORMS, nextFormId } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import type { InstitutionalForm, FormStatus, FormVisibility, Role } from '@/types'

const FORM_BUILDER_ROLES: Role[] = [
  'SUPER_ADMIN', 'REGISTRAR', 'HR_STAFF', 'ACCOUNTING',
  'ACADEMIC_ADMIN', 'PURCHASING_OFFICER', 'AMO', 'DEAN',
]

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Archived', value: 'ARCHIVED' },
]

const CATEGORIES = ['Request', 'Survey', 'Evaluation', 'Registration', 'Feedback', 'Incident Report', 'Other']
const DEPARTMENTS = ['Human Resources', 'Academic Affairs', 'Administration', 'Asset Management', 'Finance', 'Registrar', 'IT Support', 'Other']
const VISIBILITIES: { value: FormVisibility; label: string }[] = [
  { value: 'PUBLIC_INTERNAL', label: 'Public Internal (all users)' },
  { value: 'STAFF_ONLY', label: 'Staff Only' },
  { value: 'STUDENT_ONLY', label: 'Student Only' },
  { value: 'DEPARTMENT_ONLY', label: 'Department Only' },
  { value: 'CUSTOM', label: 'Custom' },
]

function statusBorderColor(s: FormStatus) {
  if (s === 'PUBLISHED') return 'border-l-4 border-l-emerald-500'
  if (s === 'DRAFT') return 'border-l-4 border-l-slate-400'
  if (s === 'CLOSED') return 'border-l-4 border-l-amber-500'
  return 'border-l-4 border-l-gray-300'
}

function StatusBadge({ status }: { status: FormStatus }) {
  const map: Record<FormStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    PUBLISHED: 'bg-emerald-50 text-emerald-700',
    CLOSED: 'bg-amber-50 text-amber-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, string> = {
    'Request': 'bg-blue-50 text-blue-700',
    'Survey': 'bg-violet-50 text-violet-700',
    'Evaluation': 'bg-teal-50 text-teal-700',
    'Feedback': 'bg-pink-50 text-pink-700',
    'Registration': 'bg-orange-50 text-orange-700',
    'Incident Report': 'bg-red-50 text-red-700',
    'Other': 'bg-slate-100 text-slate-600',
  }
  const cls = map[category] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {category}
    </span>
  )
}

function VisibilityBadge({ visibility }: { visibility: FormVisibility }) {
  const map: Record<FormVisibility, string> = {
    PUBLIC_INTERNAL: 'bg-sky-50 text-sky-700',
    STAFF_ONLY: 'bg-indigo-50 text-indigo-700',
    STUDENT_ONLY: 'bg-green-50 text-green-700',
    DEPARTMENT_ONLY: 'bg-amber-50 text-amber-700',
    CUSTOM: 'bg-slate-100 text-slate-600',
  }
  const labels: Record<FormVisibility, string> = {
    PUBLIC_INTERNAL: 'Public',
    STAFF_ONLY: 'Staff',
    STUDENT_ONLY: 'Students',
    DEPARTMENT_ONLY: 'Dept',
    CUSTOM: 'Custom',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[visibility]}`}>
      {labels[visibility]}
    </span>
  )
}

export default function FormsListPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role as Role | undefined
  const canCreate = role ? FORM_BUILDER_ROLES.includes(role) : false

  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => forceUpdate(n => n + 1), [])

  const [tab, setTab] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  // New form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState('Request')
  const [newDept, setNewDept] = useState('Administration')
  const [newVis, setNewVis] = useState<FormVisibility>('STAFF_ONLY')
  const [creating, setCreating] = useState(false)

  const filtered = MOCK_FORMS.filter(f => {
    if (tab !== 'ALL' && f.status !== tab) return false
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalForms = MOCK_FORMS.length
  const published = MOCK_FORMS.filter(f => f.status === 'PUBLISHED').length
  const totalSubs = MOCK_FORMS.reduce((s, f) => s + f.submissionCount, 0)
  const drafts = MOCK_FORMS.filter(f => f.status === 'DRAFT').length

  function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    const id = nextFormId()
    const now = new Date().toISOString()
    const form: InstitutionalForm = {
      id, title: newTitle.trim(), description: newDesc.trim() || undefined,
      department: newDept, createdBy: 'u_staff', createdByName: 'Staff',
      status: 'DRAFT', visibility: newVis, category: newCat,
      fields: [],
      settings: {
        oneSubmissionPerUser: false, allowAnonymous: false,
        autoCloseOnDeadline: false, showProgressBar: true,
        successMessage: 'Your response has been submitted successfully. Thank you!',
      },
      submissionCount: 0, schoolId: 'school_1', createdAt: now, updatedAt: now,
    }
    MOCK_FORMS.push(form)
    setCreating(false)
    setShowNew(false)
    setNewTitle('')
    setNewDesc('')
    router.push(`/staff/forms/${id}/builder`)
  }

  function togglePublish(form: InstitutionalForm) {
    const f = MOCK_FORMS.find(x => x.id === form.id)
    if (!f) return
    if (f.status === 'PUBLISHED') {
      f.status = 'DRAFT'
      f.updatedAt = new Date().toISOString()
    } else if (f.status === 'DRAFT') {
      f.status = 'PUBLISHED'
      f.publishedAt = new Date().toISOString()
      f.updatedAt = new Date().toISOString()
    }
    refresh()
  }

  function duplicateForm(form: InstitutionalForm) {
    const id = nextFormId()
    const now = new Date().toISOString()
    MOCK_FORMS.push({
      ...form,
      id, title: `Copy of ${form.title}`,
      status: 'DRAFT', submissionCount: 0,
      createdAt: now, updatedAt: now,
      publishedAt: undefined, closedAt: undefined,
    })
    refresh()
  }

  function archiveForm(form: InstitutionalForm) {
    const f = MOCK_FORMS.find(x => x.id === form.id)
    if (!f) return
    f.status = 'ARCHIVED'
    f.updatedAt = new Date().toISOString()
    refresh()
  }

  return (
    <div>
      <SectionTitle
        description="Create, publish, and manage institutional forms"
        actions={
          canCreate ? (
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowNew(true)}>
              New Form
            </Button>
          ) : undefined
        }
      >
        Form Builder
      </SectionTitle>

      {!canCreate && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You don't have permission to create forms. You can manage forms assigned to your department below.
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Forms" value={totalForms} icon={FileText} color="bg-brand-50 text-brand-500" />
        <StatCard label="Published" value={published} icon={Send} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Submissions" value={totalSubs} icon={ClipboardList} color="bg-violet-50 text-violet-600" />
        <StatCard label="Drafts" value={drafts} icon={Edit3} color="bg-slate-100 text-slate-500" />
      </div>

      {/* Filter + Search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-[#e4ebf5] text-slate-600 hover:bg-brand-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search forms…"
              className="h-8 rounded-lg border border-[#e4ebf5] bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Form cards grid */}
      {filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-16 text-center">
            <LayoutTemplate className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">No forms found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new form</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(form => (
            <div
              key={form.id}
              className={`bg-white rounded-xl border border-[#e4ebf5] shadow-card overflow-hidden ${statusBorderColor(form.status)}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-800 leading-snug flex-1 min-w-0">{form.title}</h3>
                  <StatusBadge status={form.status} />
                </div>
                {form.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{form.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <CategoryBadge category={form.category} />
                  <VisibilityBadge visibility={form.visibility} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{form.department}</span>
                  <span className="shrink-0 ml-2">{form.submissionCount} submissions</span>
                </div>
                {form.processOwner ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white text-[9px] font-bold shrink-0">
                      {form.processOwner.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <span className="text-xs text-slate-500 truncate">
                      <span className="text-slate-400">Owner: </span>
                      <span className="font-medium text-slate-600">{form.processOwner.name}</span>
                      <span className="text-slate-400"> · {form.processOwner.roleLabel}</span>
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">{formatDate(form.createdAt)}</p>
                )}
              </div>
              <div className="border-t border-[#e4ebf5] bg-[#f8fafd] px-4 py-2.5 flex flex-wrap items-center gap-1.5">
                {canCreate && (
                  <button
                    onClick={() => router.push(`/staff/forms/${form.id}/builder`)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => router.push(`/staff/forms/${form.id}/submissions`)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  Submissions
                </button>
                {canCreate && (
                  <>
                    {(form.status === 'PUBLISHED' || form.status === 'DRAFT') && (
                      <button
                        onClick={() => togglePublish(form)}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          form.status === 'PUBLISHED'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {form.status === 'PUBLISHED' ? (
                          <><XCircle className="h-3 w-3" />Unpublish</>
                        ) : (
                          <><Send className="h-3 w-3" />Publish</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => duplicateForm(form)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      Duplicate
                    </button>
                    {form.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => archiveForm(form)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Archive className="h-3 w-3" />
                        Archive
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Form Modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Create New Form"
        description="Create a new institutional form. You'll be taken to the form builder after saving."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newTitle.trim()}>
              Create & Open Builder
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Form Title *</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Faculty Leave Request Form"
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Brief description of this form's purpose…"
              rows={2}
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Visibility</label>
            <select
              value={newVis}
              onChange={e => setNewVis(e.target.value as FormVisibility)}
              className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {VISIBILITIES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
