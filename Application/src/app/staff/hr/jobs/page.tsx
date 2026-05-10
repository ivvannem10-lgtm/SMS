'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Briefcase, Clock, Users, Plus, MoreVertical, X, Edit2, Trash2, ExternalLink,
} from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MOCK_JOB_POSTINGS, MOCK_JOB_APPLICATIONS } from '@/lib/mock-data'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { JobPosting, JobPostingStatus, EmploymentType, WorkSetup } from '@/types'

type FilterTab = 'ALL' | JobPostingStatus

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL',    label: 'All' },
  { key: 'OPEN',   label: 'Open' },
  { key: 'DRAFT',  label: 'Draft' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'FILLED', label: 'Filled' },
]

const JOB_STATUS_COLORS: Record<JobPostingStatus, string> = {
  OPEN:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
  DRAFT:  'bg-amber-50 text-amber-700 ring-amber-200',
  FILLED: 'bg-blue-50 text-blue-700 ring-blue-200',
}

const EMP_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME:    'Full-time',
  PART_TIME:    'Part-time',
  CONTRACT:     'Contract',
  PROBATIONARY: 'Probationary',
  CASUAL:       'Casual',
}

const WORK_SETUP_LABELS: Record<WorkSetup, string> = {
  ON_SITE: 'On-site',
  HYBRID:  'Hybrid',
  REMOTE:  'Remote',
}

const DEPARTMENTS = [
  'College of Computing',
  'Office of the Registrar',
  'College of Nursing',
  'IT Services',
  'Student Services',
  'Human Resources',
  'Finance',
]

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME',    label: 'Full-time' },
  { value: 'PART_TIME',    label: 'Part-time' },
  { value: 'CONTRACT',     label: 'Contract' },
  { value: 'PROBATIONARY', label: 'Probationary' },
  { value: 'CASUAL',       label: 'Casual' },
]

const WORK_SETUPS: { value: WorkSetup; label: string }[] = [
  { value: 'ON_SITE', label: 'On-site' },
  { value: 'HYBRID',  label: 'Hybrid' },
  { value: 'REMOTE',  label: 'Remote' },
]

interface JobFormData {
  title: string
  department: string
  employmentType: EmploymentType
  workSetup: WorkSetup
  location: string
  salaryMin: string
  salaryMax: string
  openings: string
  description: string
  requirements: string
  responsibilities: string
  closingDate: string
  status: 'OPEN' | 'DRAFT'
}

const DEFAULT_FORM: JobFormData = {
  title: '',
  department: DEPARTMENTS[0],
  employmentType: 'FULL_TIME',
  workSetup: 'ON_SITE',
  location: '',
  salaryMin: '',
  salaryMax: '',
  openings: '1',
  description: '',
  requirements: '',
  responsibilities: '',
  closingDate: '',
  status: 'OPEN',
}

let nextJobId = MOCK_JOB_POSTINGS.length + 1

export default function JobPostingsPage() {
  const [postings, setPostings] = useState<JobPosting[]>([...MOCK_JOB_POSTINGS])
  const [filter, setFilter] = useState<FilterTab>('ALL')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<JobPosting | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobPosting | null>(null)

  const [form, setForm] = useState<JobFormData>(DEFAULT_FORM)

  const filtered = postings.filter((j) => filter === 'ALL' || j.status === filter)

  function openCreate() {
    setForm(DEFAULT_FORM)
    setEditTarget(null)
    setCreateOpen(true)
  }

  function openEdit(job: JobPosting) {
    setForm({
      title: job.title,
      department: job.department,
      employmentType: job.employmentType,
      workSetup: job.workSetup,
      location: job.location,
      salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
      salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
      openings: String(job.openings),
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      closingDate: job.closingDate ? job.closingDate.slice(0, 10) : '',
      status: job.status === 'DRAFT' ? 'DRAFT' : 'OPEN',
    })
    setEditTarget(job)
    setCreateOpen(true)
    setOpenMenu(null)
  }

  function handleSave() {
    const payload: Partial<JobPosting> = {
      title: form.title.trim(),
      department: form.department,
      employmentType: form.employmentType,
      workSetup: form.workSetup,
      location: form.location.trim(),
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      openings: Number(form.openings) || 1,
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      responsibilities: form.responsibilities.trim(),
      closingDate: form.closingDate ? new Date(form.closingDate).toISOString() : undefined,
      status: form.status,
    }

    if (editTarget) {
      const idx = MOCK_JOB_POSTINGS.findIndex((j) => j.id === editTarget.id)
      if (idx >= 0) {
        Object.assign(MOCK_JOB_POSTINGS[idx], payload)
      }
      setPostings([...MOCK_JOB_POSTINGS])
    } else {
      const newJob: JobPosting = {
        id: `job_${++nextJobId}`,
        ...payload,
        title: payload.title!,
        department: payload.department!,
        employmentType: payload.employmentType!,
        workSetup: payload.workSetup!,
        location: payload.location!,
        description: payload.description!,
        requirements: payload.requirements!,
        responsibilities: payload.responsibilities!,
        openings: payload.openings!,
        status: payload.status!,
        postedAt: new Date().toISOString(),
        createdBy: 'HR Staff',
      }
      MOCK_JOB_POSTINGS.push(newJob)
      setPostings([...MOCK_JOB_POSTINGS])
    }
    setCreateOpen(false)
  }

  function handleToggleStatus(job: JobPosting) {
    const idx = MOCK_JOB_POSTINGS.findIndex((j) => j.id === job.id)
    if (idx >= 0) {
      MOCK_JOB_POSTINGS[idx].status = MOCK_JOB_POSTINGS[idx].status === 'CLOSED' ? 'OPEN' : 'CLOSED'
    }
    setPostings([...MOCK_JOB_POSTINGS])
    setOpenMenu(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    const idx = MOCK_JOB_POSTINGS.findIndex((j) => j.id === deleteTarget.id)
    if (idx >= 0) MOCK_JOB_POSTINGS.splice(idx, 1)
    setPostings([...MOCK_JOB_POSTINGS])
    setDeleteTarget(null)
  }

  const openCount  = postings.filter((j) => j.status === 'OPEN').length
  const draftCount = postings.filter((j) => j.status === 'DRAFT').length

  return (
    <div className="space-y-6">
      <SectionTitle
        description={`${postings.length} total · ${openCount} open · ${draftCount} draft`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Post New Job
          </Button>
        }
      >
        Job Postings
      </SectionTitle>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'h-8 px-4 rounded-full text-sm font-medium transition-all duration-150',
              filter === tab.key
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-[#e4ebf5] hover:bg-brand-50 hover:text-brand-600',
            )}
          >
            {tab.label}
            {tab.key !== 'ALL' && (
              <span className={cn(
                'ml-1.5 text-[10px] font-bold',
                filter === tab.key ? 'text-white/80' : 'text-slate-400',
              )}>
                {postings.filter((j) => j.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <div className="py-8 text-center text-sm text-slate-400">No job postings found.</div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((job) => {
          const appCount = MOCK_JOB_APPLICATIONS.filter((a) => a.jobId === job.id).length
          return (
            <Card key={job.id} className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 leading-tight">{job.title}</h2>
                    <Badge className={JOB_STATUS_COLORS[job.status]}>{job.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === job.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl shadow-card-lg border border-[#e4ebf5] py-1 animate-slide-up">
                      <button
                        onClick={() => openEdit(job)}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(job)}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        {job.status === 'CLOSED' ? 'Reopen' : 'Close Posting'}
                      </button>
                      <div className="my-1 border-t border-[#f0f4fa]" />
                      <button
                        onClick={() => { setDeleteTarget(job); setOpenMenu(null) }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-1.5">
                <Badge className="bg-brand-50 text-brand-600 ring-brand-100">{EMP_TYPE_LABELS[job.employmentType]}</Badge>
                <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{WORK_SETUP_LABELS[job.workSetup]}</Badge>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {job.location}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 ring-1 ring-inset ring-[#e4ebf5] py-2">
                  <p className="text-xs text-slate-400 mb-0.5">Salary</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {job.salaryMin && job.salaryMax
                      ? `${formatCurrency(job.salaryMin)} – ${formatCurrency(job.salaryMax)}`
                      : 'Negotiable'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 ring-1 ring-inset ring-[#e4ebf5] py-2">
                  <p className="text-xs text-slate-400 mb-0.5">Openings</p>
                  <p className="text-sm font-bold text-slate-700">{job.openings}</p>
                </div>
                <div className="rounded-lg bg-slate-50 ring-1 ring-inset ring-[#e4ebf5] py-2">
                  <p className="text-xs text-slate-400 mb-0.5">Applicants</p>
                  <p className="text-sm font-bold text-slate-700">{appCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Posted {formatDate(job.postedAt)}
                </span>
                {job.closingDate && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Closes {formatDate(job.closingDate)}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-[#f0f4fa]">
                <Link
                  href={`/staff/hr/recruitment?jobId=${job.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
                >
                  View Applications <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          )
        })}
      </div>

      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={editTarget ? 'Edit Job Posting' : 'Post New Job'}
        description={editTarget ? `Editing: ${editTarget.title}` : 'Fill in the details for the new job posting.'}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || !form.location.trim()}>
              {editTarget ? 'Save Changes' : 'Post Job'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g. Computer Science Instructor"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>

            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'OPEN' | 'DRAFT' })}
            >
              <option value="OPEN">Open</option>
              <option value="DRAFT">Draft</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Employment Type"
              value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>

            <Select
              label="Work Setup"
              value={form.workSetup}
              onChange={(e) => setForm({ ...form, workSetup: e.target.value as WorkSetup })}
            >
              {WORK_SETUPS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>

            <Input
              label="Number of Openings"
              type="number"
              min="1"
              value={form.openings}
              onChange={(e) => setForm({ ...form, openings: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location"
              placeholder="e.g. Main Campus"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <Input
              label="Closing Date (optional)"
              type="date"
              value={form.closingDate}
              onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Salary Min (optional)"
              type="number"
              placeholder="e.g. 25000"
              value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
            />
            <Input
              label="Salary Max (optional)"
              type="number"
              placeholder="e.g. 40000"
              value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
            />
          </div>

          <Textarea
            label="Job Description"
            rows={4}
            placeholder="Describe the role and its purpose within the organization..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Textarea
            label="Requirements"
            rows={4}
            placeholder="List qualifications, degrees, certifications, experience..."
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          />

          <Textarea
            label="Responsibilities"
            rows={4}
            placeholder="List the key duties and responsibilities for this role..."
            value={form.responsibilities}
            onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Job Posting"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
