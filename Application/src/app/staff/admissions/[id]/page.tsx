'use client'
import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, FileText, User, Users, School, AlertCircle,
  Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Upload, Eye, Download,
  CloudUpload, X, File, ImageIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { ApplicantBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { ProcessFlow } from '@/components/shared/ProcessFlow'
import { MOCK_APPLICANTS } from '@/lib/mock-data'
import { fullName, formatDate } from '@/lib/utils'
import type { ApplicantDocument } from '@/types'

type Tab = 'personal' | 'family' | 'education' | 'documents'

const DOC_TYPES: { value: string; label: string }[] = [
  { value: 'FORM_137',            label: 'Form 137 (Transcript of Records)' },
  { value: 'PSA_BIRTH_CERT',      label: 'PSA / NSO Birth Certificate' },
  { value: 'GOOD_MORAL',          label: 'Certificate of Good Moral Character' },
  { value: 'REPORT_CARD',         label: 'Latest Report Card' },
  { value: 'MEDICAL_CERT',        label: 'Medical Certificate' },
  { value: 'PHOTO_2X2',           label: '2×2 ID Photo' },
  { value: 'HONORABLE_DISMISSAL', label: 'Honorable Dismissal / Transfer Credential' },
  { value: 'BARANGAY_CLEARANCE',  label: 'Barangay Clearance' },
  { value: 'MARRIAGE_CERT',       label: 'Marriage Certificate' },
  { value: 'OTHER',               label: 'Other Document' },
]

let nextDocSeq = 900

export default function ApplicantDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role
  const canDecide = role === 'ADMISSION_OFFICER' || role === 'SUPER_ADMIN'

  const applicant = MOCK_APPLICANTS.find((a) => a.id === id)
  const [tab,         setTab]         = useState<Tab>('personal')
  const [acceptModal, setAcceptModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejReason,   setRejReason]   = useState('')
  const [loading,     setLoading]     = useState(false)
  const [status,      setStatus]      = useState(applicant?.status)

  // ── Document state ──────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<ApplicantDocument[]>(applicant?.documents ?? [])
  const [docModal,  setDocModal]  = useState(false)
  const [editDoc,   setEditDoc]   = useState<ApplicantDocument | null>(null)
  const [docForm,   setDocForm]   = useState({ type: 'FORM_137', filename: '', verified: false })
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [fileUrl,    setFileUrl]    = useState<string>('')   // object URL for preview
  const [dragOver,   setDragOver]   = useState(false)
  const [delDoc,    setDelDoc]    = useState<ApplicantDocument | null>(null)
  const [docSaving, setDocSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function openAddDoc() {
    setEditDoc(null)
    setDocForm({ type: 'FORM_137', filename: '', verified: false })
    setPickedFile(null)
    setFileUrl('')
    setDocModal(true)
  }
  function openEditDoc(doc: ApplicantDocument) {
    setEditDoc(doc)
    setDocForm({ type: doc.type, filename: doc.filename, verified: doc.verified })
    setPickedFile(null)
    setFileUrl(doc.url ?? '')
    setDocModal(true)
  }

  // Accept a File object from input or drop
  function acceptFile(file: File) {
    // Revoke old URL to avoid memory leak
    if (fileUrl && fileUrl.startsWith('blob:')) URL.revokeObjectURL(fileUrl)
    const url = URL.createObjectURL(file)
    setPickedFile(file)
    setFileUrl(url)
    // Auto-fill filename from file name
    setDocForm((f) => ({ ...f, filename: file.name }))
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (fileUrl && fileUrl.startsWith('blob:')) URL.revokeObjectURL(fileUrl)
    const url = URL.createObjectURL(file)
    setPickedFile(file)
    setFileUrl(url)
    setDocForm((f) => ({ ...f, filename: file.name }))
  }, [fileUrl])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) acceptFile(file)
  }

  function clearFile() {
    if (fileUrl.startsWith('blob:')) URL.revokeObjectURL(fileUrl)
    setPickedFile(null)
    setFileUrl('')
    setDocForm((f) => ({ ...f, filename: editDoc?.filename ?? '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function syncDocs(updated: ApplicantDocument[]) {
    setDocuments(updated)
    const idx = MOCK_APPLICANTS.findIndex((a) => a.id === id)
    if (idx >= 0) MOCK_APPLICANTS[idx].documents = updated
  }

  async function handleSaveDoc() {
    const fname = docForm.filename.trim() || pickedFile?.name
    if (!fname) return
    setDocSaving(true)
    await new Promise((r) => setTimeout(r, 400))

    const now = new Date().toISOString()
    if (editDoc) {
      syncDocs(documents.map((d) =>
        d.id === editDoc.id
          ? { ...d, type: docForm.type, filename: fname, url: fileUrl || d.url, verified: docForm.verified }
          : d,
      ))
    } else {
      const newDoc: ApplicantDocument = {
        id:          `doc_${id}_${++nextDocSeq}`,
        applicantId: id,
        type:        docForm.type,
        filename:    fname,
        url:         fileUrl || undefined,
        verified:    docForm.verified,
        createdAt:   now,
      }
      syncDocs([...documents, newDoc])
    }
    setDocModal(false)
    setPickedFile(null)
    setDocSaving(false)
  }

  function handleDeleteDoc() {
    if (!delDoc) return
    if (delDoc.url?.startsWith('blob:')) URL.revokeObjectURL(delDoc.url)
    syncDocs(documents.filter((d) => d.id !== delDoc.id))
    setDelDoc(null)
  }

  function toggleVerified(doc: ApplicantDocument) {
    syncDocs(documents.map((d) => d.id === doc.id ? { ...d, verified: !d.verified } : d))
  }

  function isImage(filename: string) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filename)
  }
  function fileSizeLabel(file: File) {
    return file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`
  }

  const staffName = (session?.user as { name?: string })?.name ?? 'Admissions Staff'

  if (!applicant) return <div className="py-20 text-center text-slate-500">Applicant not found. <Link href="/staff/admissions" className="text-blue-600">Back</Link></div>

  async function handleAccept() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    // Persist to shared array so list page reflects the change
    const idx = MOCK_APPLICANTS.findIndex((a) => a.id === id)
    if (idx >= 0) {
      MOCK_APPLICANTS[idx].status     = 'ACCEPTED'
      MOCK_APPLICANTS[idx].reviewedBy = staffName
      MOCK_APPLICANTS[idx].reviewedAt = new Date().toISOString()
    }
    setStatus('ACCEPTED')
    setAcceptModal(false)
    setLoading(false)
  }

  async function handleReject() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const idx = MOCK_APPLICANTS.findIndex((a) => a.id === id)
    if (idx >= 0) {
      MOCK_APPLICANTS[idx].status          = 'REJECTED'
      MOCK_APPLICANTS[idx].rejectionReason = rejReason
      MOCK_APPLICANTS[idx].reviewedBy      = staffName
      MOCK_APPLICANTS[idx].reviewedAt      = new Date().toISOString()
    }
    setStatus('REJECTED')
    setRejectModal(false)
    setLoading(false)
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'family', label: 'Family Background', icon: Users },
    { id: 'education', label: 'Education History', icon: School },
    { id: 'documents', label: 'Documents', icon: FileText },
  ]

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/staff/admissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Admissions
      </Link>

      {/* Status banner for accepted */}
      {(status === 'ACCEPTED') && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Application Accepted</p>
            <p className="text-xs text-emerald-700">Student ID will be generated. Send to Registrar for subject assignment.</p>
          </div>
        </div>
      )}
      {(status === 'REJECTED') && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">Application Rejected</p>
            <p className="text-xs text-red-700">{applicant.rejectionReason ?? rejReason}</p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <Card>
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar name={fullName(applicant)} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{fullName(applicant)}</h1>
                <p className="text-sm text-slate-500">{applicant.program?.name} · {applicant.applicantType}</p>
              </div>
              <div className="flex items-center gap-2">
                <ApplicantBadge status={(status ?? applicant.status) as 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'} />
                {canDecide && (status === 'PENDING' || status === 'UNDER_REVIEW') && (
                  <>
                    <Button variant="success" size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => setAcceptModal(true)}>Accept</Button>
                    <Button variant="danger" size="sm" icon={<XCircle className="h-3.5 w-3.5" />} onClick={() => setRejectModal(true)}>Reject</Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
              <Info label="Reference #" value={applicant.referenceNumber} mono />
              <Info label="Email" value={applicant.email} />
              <Info label="Phone" value={applicant.phone ?? '—'} />
              <Info label="Applied" value={formatDate(applicant.createdAt)} />
              {applicant.reviewedAt && <Info label="Reviewed" value={formatDate(applicant.reviewedAt)} />}
              {applicant.reviewedBy && <Info label="Reviewed by" value={applicant.reviewedBy} />}
            </div>
          </div>
        </div>
      </Card>

      {/* Pipeline indicator */}
      <Card>
        <p className="text-xs text-slate-400 mb-2 font-medium">Admission Pipeline Status</p>
        <ProcessFlow
          statuses={{ admissions: status === 'ACCEPTED' ? 'completed' : status === 'REJECTED' ? 'blocked' : 'active', registrar: 'pending', treasury: 'pending', sis: 'pending', lms: 'pending' }}
          sublabels={{ admissions: status === 'ACCEPTED' ? 'Accepted ✓' : status === 'REJECTED' ? 'Rejected' : 'Under Review' }}
        />
      </Card>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'personal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="mb-3 text-sm font-semibold">Personal Details</h3>
              <dl className="space-y-2">
                <Row label="Full Name"      value={[applicant.firstName, applicant.middleName, applicant.lastName, (applicant as {suffix?: string}).suffix].filter(Boolean).join(' ')} />
                <Row label="Date of Birth"  value={formatDate(applicant.dateOfBirth)} />
                <Row label="Place of Birth" value={(applicant as {placeOfBirth?: string}).placeOfBirth ?? '—'} />
                <Row label="Gender"         value={applicant.gender ?? '—'} />
                <Row label="Civil Status"   value={(applicant as {civilStatus?: string}).civilStatus ?? '—'} />
                <Row label="Nationality"    value={(applicant as {nationality?: string}).nationality ?? '—'} />
                <Row label="Religion"       value={(applicant as {religion?: string}).religion ?? '—'} />
                <Row label="Blood Type"     value={(applicant as {bloodType?: string}).bloodType ?? '—'} />
              </dl>
            </Card>
            <Card>
              <h3 className="mb-3 text-sm font-semibold">Contact & Academic Intent</h3>
              <dl className="space-y-2">
                <Row label="Email"   value={applicant.email} />
                <Row label="Phone"   value={applicant.phone ?? '—'} />
                <Row label="Address" value={applicant.address ?? '—'} />
                <Row label="Program" value={applicant.program?.name ?? '—'} />
                <Row label="Type"    value={applicant.applicantType} />
                <Row label="GWA"     value={(applicant as {gwa?: string}).gwa ?? '—'} />
                <Row label="Strand"  value={(applicant as {strand?: string}).strand ?? '—'} />
                {applicant.remarks && <Row label="Remarks" value={applicant.remarks} />}
              </dl>
            </Card>
          </div>
        </div>
      )}

      {tab === 'family' && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold">Family Background</h3>
          {applicant.familyBackground ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              <Row label="Father's Name" value={applicant.familyBackground.fatherName ?? '—'} />
              <Row label="Father's Occupation" value={applicant.familyBackground.fatherOccupation ?? '—'} />
              <Row label="Mother's Name" value={applicant.familyBackground.motherName ?? '—'} />
              <Row label="Mother's Occupation" value={applicant.familyBackground.motherOccupation ?? '—'} />
              <Row label="Guardian" value={applicant.familyBackground.guardianName ?? '—'} />
              <Row label="Guardian Relation" value={applicant.familyBackground.guardianRelation ?? '—'} />
              <Row label="Monthly Income" value={applicant.familyBackground.monthlyIncome ?? '—'} />
              <Row label="Living With" value={applicant.familyBackground.livingWith ?? '—'} />
            </div>
          ) : <p className="text-sm text-slate-400">No family background recorded.</p>}
        </Card>
      )}

      {tab === 'education' && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold">Previous Education</h3>
          {(applicant.previousEducations?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400">No education history recorded.</p>
          ) : (
            <div className="space-y-4">
              {applicant.previousEducations?.map((edu) => (
                <div key={edu.id} className="rounded-xl border border-slate-100 p-4">
                  <p className="font-medium text-slate-900">{edu.schoolName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{edu.level.replace('_', ' ')} · {edu.yearFrom}–{edu.yearTo ?? 'Present'}</p>
                  {edu.honors && <span className="mt-1.5 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{edu.honors}</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Documents
              <span className="ml-2 text-xs font-normal text-slate-400">
                {documents.filter((d) => d.verified).length}/{documents.length} verified
              </span>
            </h3>
            <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAddDoc}>
              Add Document
            </Button>
          </div>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Upload className="h-9 w-9 text-slate-200" />
              <p className="text-sm text-slate-400">No documents on file yet.</p>
              <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAddDoc}>
                Add First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const typeLabel = DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type.replace(/_/g, ' ')
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      doc.verified ? 'border-emerald-200 bg-emerald-50/40' : 'border-[#e4ebf5] bg-white'
                    }`}
                  >
                    {/* File icon */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${doc.verified ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <FileText className={`h-4 w-4 ${doc.verified ? 'text-emerald-600' : 'text-slate-500'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{typeLabel}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400 font-mono truncate">{doc.filename}</p>
                        {doc.url
                          ? <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded"><Upload className="h-2.5 w-2.5" /> Attached</span>
                          : <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">No file</span>
                        }
                      </div>
                    </div>

                    {/* Verified toggle */}
                    <button
                      onClick={() => toggleVerified(doc)}
                      title={doc.verified ? 'Click to unverify' : 'Click to verify'}
                      className="flex items-center gap-1.5 shrink-0"
                    >
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
                        doc.verified
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100'
                      }`}>
                        {doc.verified
                          ? <><CheckCircle2 className="h-3 w-3" /> Verified</>
                          : <><AlertCircle className="h-3 w-3" /> Unverified</>
                        }
                      </span>
                    </button>

                    {/* View / Download — only if file is attached */}
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-md p-1.5 text-brand-500 hover:bg-brand-50 transition-colors"
                        title="View file"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => openEditDoc(doc)}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                      title="Edit / replace file"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDelDoc(doc)}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Remove document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary bar */}
          {documents.length > 0 && (
            <div className="mt-4 flex items-center gap-5 border-t border-[#f0f4fa] pt-3 text-xs text-slate-500">
              <span>Total: <strong className="text-slate-800">{documents.length}</strong></span>
              <span>Verified: <strong className="text-emerald-600">{documents.filter((d) => d.verified).length}</strong></span>
              <span>Pending: <strong className="text-amber-600">{documents.filter((d) => !d.verified).length}</strong></span>
            </div>
          )}
        </Card>
      )}

      {/* ── Add / Edit Document Modal ───────────────────────────────────────── */}
      <Modal
        open={docModal}
        onClose={() => { setDocModal(false); setPickedFile(null) }}
        title={editDoc ? 'Update Document' : 'Add Document'}
        description={fullName(applicant)}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setDocModal(false); setPickedFile(null) }}>Cancel</Button>
            <Button
              onClick={handleSaveDoc}
              loading={docSaving}
              disabled={!docForm.filename.trim() && !pickedFile}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              {editDoc ? 'Save Changes' : 'Add Document'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Document type */}
          <Select
            label="Document Type"
            value={docForm.type}
            onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))}
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>

          {/* ── File upload zone ── */}
          {!pickedFile && !fileUrl ? (
            <div>
              <p className="text-xs font-semibold text-slate-700 tracking-wide mb-1.5">Attach File</p>
              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                className="hidden"
                onChange={handleFileInput}
              />
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center gap-2 py-8 transition-all ${
                  dragOver
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-[#dce8f7] bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <CloudUpload className={`h-8 w-8 ${dragOver ? 'text-brand-500' : 'text-slate-300'}`} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    {dragOver ? 'Drop to upload' : 'Click to browse or drag & drop'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PDF, Word, JPG, PNG — max 10 MB</p>
                </div>
              </div>
              {/* Or manual filename */}
              <p className="text-xs text-slate-400 text-center mt-2">or enter filename manually</p>
              <Input
                placeholder="e.g. form137_juan_delacruz.pdf"
                value={docForm.filename}
                onChange={(e) => setDocForm((f) => ({ ...f, filename: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          ) : (
            /* ── File preview ── */
            <div>
              <p className="text-xs font-semibold text-slate-700 tracking-wide mb-1.5">Attached File</p>
              <div className="rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Icon based on type */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#e4ebf5]">
                    {pickedFile && isImage(pickedFile.name)
                      ? <ImageIcon className="h-5 w-5 text-brand-400" />
                      : <File className="h-5 w-5 text-brand-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {pickedFile?.name ?? docForm.filename}
                    </p>
                    {pickedFile && (
                      <p className="text-xs text-slate-400">{fileSizeLabel(pickedFile)}</p>
                    )}
                  </div>
                  {/* View */}
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md p-1.5 text-brand-500 hover:bg-brand-100 transition-colors"
                      title="Preview file"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  )}
                  {/* Replace */}
                  <button
                    onClick={() => { clearFile(); fileInputRef.current?.click() }}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition-colors"
                    title="Replace file"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  {/* Remove */}
                  <button
                    onClick={clearFile}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Image thumbnail */}
                {pickedFile && isImage(pickedFile.name) && fileUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-[#e4ebf5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrl} alt="preview" className="max-h-48 w-full object-contain bg-slate-100" />
                  </div>
                )}
              </div>

              {/* Hidden input for replacement */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* Verified toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[#e4ebf5] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Mark as Verified</p>
              <p className="text-xs text-slate-400">Original document has been physically checked</p>
            </div>
            <button onClick={() => setDocForm((f) => ({ ...f, verified: !f.verified }))} className="shrink-0">
              {docForm.verified
                ? <ToggleRight className="h-7 w-7 text-emerald-500" />
                : <ToggleLeft  className="h-7 w-7 text-slate-300" />
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Document Confirm ─────────────────────────────────────────── */}
      <Modal
        open={!!delDoc}
        onClose={() => setDelDoc(null)}
        title="Remove Document"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDelDoc(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteDoc} icon={<Trash2 className="h-4 w-4" />}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Remove <strong>{DOC_TYPES.find((t) => t.value === delDoc?.type)?.label ?? delDoc?.type}</strong> ({delDoc?.filename}) from this applicant's record?
        </p>
      </Modal>

      {/* Accept Modal */}
      <Modal open={acceptModal} onClose={() => setAcceptModal(false)} title="Accept Applicant" description={`Accept ${fullName(applicant)} and generate their Student ID?`} size="sm"
        footer={<><Button variant="outline" onClick={() => setAcceptModal(false)}>Cancel</Button><Button variant="success" onClick={handleAccept} loading={loading} icon={<CheckCircle2 className="h-4 w-4" />}>Confirm Acceptance</Button></>}>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          <p className="font-semibold">This will:</p>
          <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
            <li>Generate a unique Student ID number</li>
            <li>Update status to "Accepted"</li>
            <li>Move applicant to Registrar queue</li>
            <li>Send notification email to applicant</li>
          </ul>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject Application" size="sm"
        footer={<><Button variant="outline" onClick={() => setRejectModal(false)}>Cancel</Button><Button variant="danger" onClick={handleReject} loading={loading}>Confirm Rejection</Button></>}>
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">This action will notify the applicant of their rejection. Please provide a reason.</p>
          </div>
          <Textarea label="Reason for rejection *" value={rejReason} onChange={(e) => setRejReason(e.target.value)} placeholder="e.g., Incomplete requirements — missing Good Moral Certificate." rows={4} />
        </div>
      </Modal>
    </div>
  )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="text-xs font-medium text-slate-800">{value}</dd>
    </div>
  )
}
