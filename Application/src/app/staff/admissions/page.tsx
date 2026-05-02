'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Eye, CheckCircle2, XCircle, UserPlus, AlertCircle,
  Plus, Trash2, ChevronRight, ChevronLeft, User, Users, School, BookOpen,
  FileText, ToggleLeft, ToggleRight, Upload, Paperclip, X, ExternalLink,
} from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { ApplicantBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { MOCK_APPLICANTS, MOCK_PROGRAMS, MOCK_DEPARTMENTS } from '@/lib/mock-data'
import { fullName, formatDate } from '@/lib/utils'
import type { Applicant, ApplicantStatus, PreviousEducation, FamilyBackground, ApplicantDocument } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────────
let nextAppSeq = 100
function generateRef() {
  return `APP-${new Date().getFullYear()}-${String(++nextAppSeq).padStart(6, '0')}`
}
let nextEduId  = 500
let nextDocId  = 800

const STEPS = [
  { id: 1, label: 'Personal',   icon: User },
  { id: 2, label: 'Family',     icon: Users },
  { id: 3, label: 'Education',  icon: School },
  { id: 4, label: 'Academic',   icon: BookOpen },
  { id: 5, label: 'Documents',  icon: FileText },
]

// Standard required documents — can be toggled received / verified
const REQUIRED_DOCS: { type: string; label: string; required: boolean; forType?: string[] }[] = [
  { type: 'FORM_137',             label: 'Form 137 (Transcript of Records)',       required: true },
  { type: 'PSA_BIRTH_CERT',       label: 'PSA / NSO Birth Certificate',             required: true },
  { type: 'GOOD_MORAL',           label: 'Certificate of Good Moral Character',     required: true },
  { type: 'REPORT_CARD',          label: 'Latest Report Card (Grade 12 / SHS)',     required: true },
  { type: 'MEDICAL_CERT',         label: 'Medical Certificate',                     required: false },
  { type: 'PHOTO_2X2',            label: '2×2 ID Photo (2 copies)',                 required: true },
  { type: 'HONORABLE_DISMISSAL',  label: 'Honorable Dismissal / Transfer Cred.',    required: false, forType: ['TRANSFEREE', 'RETURNEE'] },
  { type: 'BARANGAY_CLEARANCE',   label: 'Barangay Clearance',                      required: false },
  { type: 'MARRIAGE_CERT',        label: 'Marriage Certificate (if married)',        required: false },
]

type DocEntry = {
  type: string
  label: string
  received: boolean
  verified: boolean
  filename: string
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error'
  notes: string
  isCustom: boolean
}

const CIVIL_STATUS  = ['Single', 'Married', 'Widowed', 'Separated']
const BLOOD_TYPES   = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
const INCOME_RANGES = ['Below ₱10,000', '₱10,000–₱30,000', '₱30,000–₱50,000', '₱50,000–₱75,000', '₱75,000–₱100,000', 'Above ₱100,000']
const LIVING_WITH   = ['Both Parents', 'Father Only', 'Mother Only', 'Guardian', 'Alone', 'Other']
const EDU_LEVELS    = ['ELEMENTARY', 'HIGH_SCHOOL', 'JUNIOR_HIGH', 'SENIOR_HIGH', 'VOCATIONAL', 'COLLEGE']
const STATUS_TABS: { value: ApplicantStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
]

// ── Empty form state ───────────────────────────────────────────────────────────
function emptyForm() {
  return {
    // Personal
    firstName: '', lastName: '', middleName: '', suffix: '',
    email: '', phone: '',
    dateOfBirth: '', placeOfBirth: '',
    gender: 'MALE', civilStatus: 'Single',
    nationality: 'Filipino', religion: '', bloodType: '',
    address: '',
    // Family
    fatherName: '', fatherOccupation: '', fatherPhone: '', fatherEmail: '',
    motherName: '', motherOccupation: '', motherPhone: '', motherEmail: '',
    guardianName: '', guardianRelation: '', guardianPhone: '',
    monthlyIncome: '', livingWith: 'Both Parents',
    // Academic intent
    programId: '', applicantType: 'FRESHMAN',
    gwa: '', strand: '', remarks: '',
  }
}

// ── Applicant Quick-View Drawer ───────────────────────────────────────────────

function ApplicantDrawer({ app, canDecide, staffName, onClose, onAccept, onReject }: {
  app: Applicant
  canDecide: boolean
  staffName: string
  onClose: () => void
  onAccept: (app: Applicant) => void
  onReject: (app: Applicant) => void
}) {
  const [tab, setTab] = useState<'personal' | 'family' | 'education' | 'documents'>('personal')
  const canAct = canDecide && (app.status === 'PENDING' || app.status === 'UNDER_REVIEW')

  const TABS = [
    { id: 'personal'  as const, label: 'Personal',  icon: User },
    { id: 'family'    as const, label: 'Family',     icon: Users },
    { id: 'education' as const, label: 'Education',  icon: School },
    { id: 'documents' as const, label: 'Documents',  icon: FileText },
  ]

  function Row({ label, value }: { label: string; value?: string }) {
    return (
      <tr>
        <td className="py-2 pl-3 pr-2 w-32 text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#f8fafd] whitespace-nowrap">{label}</td>
        <td className="py-2 pl-2 pr-3 text-xs text-slate-800">{value || '—'}</td>
      </tr>
    )
  }

  function InfoTable({ rows }: { rows: { label: string; value?: string }[] }) {
    return (
      <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
        <table className="w-full"><tbody className="divide-y divide-[#f0f4fa]">
          {rows.map((r) => <Row key={r.label} {...r} />)}
        </tbody></table>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[25] bg-[#0c1e3d]/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[36] flex w-full max-w-[500px] flex-col bg-white border-l border-[#e4ebf5] shadow-2xl">

        {/* Header */}
        <div className="shrink-0 bg-[#0c1e3d] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={fullName(app)} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{fullName(app)}</p>
                <p className="text-xs text-blue-300 mt-0.5 truncate">{app.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <ApplicantBadge status={app.status} />
                  <code className="text-[10px] bg-white/10 text-blue-200 px-2 py-0.5 rounded font-mono">{app.referenceNumber}</code>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 hover:bg-white/10 transition-colors">
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[#e4ebf5] bg-white">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors relative ${tab === t.id ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <t.icon className="h-3.5 w-3.5" />{t.label}
              {tab === t.id && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafd]">

          {tab === 'personal' && (
            <>
              <InfoTable rows={[
                { label: 'Full Name',     value: [app.firstName, app.middleName, app.lastName, (app as {suffix?:string}).suffix].filter(Boolean).join(' ') },
                { label: 'Date of Birth', value: formatDate(app.dateOfBirth) },
                { label: 'Place of Birth',value: (app as {placeOfBirth?:string}).placeOfBirth },
                { label: 'Gender',        value: app.gender },
                { label: 'Civil Status',  value: (app as {civilStatus?:string}).civilStatus },
                { label: 'Nationality',   value: app.nationality },
                { label: 'Religion',      value: app.religion },
                { label: 'Blood Type',    value: app.bloodType },
              ]} />
              <InfoTable rows={[
                { label: 'Email',    value: app.email },
                { label: 'Phone',    value: app.phone },
                { label: 'Address',  value: app.address },
              ]} />
              <InfoTable rows={[
                { label: 'Program',        value: app.program?.name ?? app.program?.code },
                { label: 'Applicant Type', value: app.applicantType },
                { label: 'GWA',            value: (app as {gwa?:string}).gwa },
                { label: 'Strand / Track', value: (app as {strand?:string}).strand },
                { label: 'Applied',        value: formatDate(app.createdAt) },
                { label: 'Remarks',        value: (app as {remarks?:string}).remarks },
              ]} />
            </>
          )}

          {tab === 'family' && (
            <>
              {app.familyBackground ? (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Father</p>
                  <InfoTable rows={[
                    { label: 'Name',       value: app.familyBackground.fatherName },
                    { label: 'Occupation', value: app.familyBackground.fatherOccupation },
                    { label: 'Phone',      value: app.familyBackground.fatherPhone },
                  ]} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mother</p>
                  <InfoTable rows={[
                    { label: 'Name',       value: app.familyBackground.motherName },
                    { label: 'Occupation', value: app.familyBackground.motherOccupation },
                    { label: 'Phone',      value: app.familyBackground.motherPhone },
                  ]} />
                  {app.familyBackground.guardianName && (
                    <>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guardian</p>
                      <InfoTable rows={[
                        { label: 'Name',     value: app.familyBackground.guardianName },
                        { label: 'Relation', value: app.familyBackground.guardianRelation },
                        { label: 'Phone',    value: app.familyBackground.guardianPhone },
                      ]} />
                    </>
                  )}
                  <InfoTable rows={[
                    { label: 'Monthly Income', value: app.familyBackground.monthlyIncome },
                    { label: 'Living With',    value: app.familyBackground.livingWith },
                  ]} />
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-10">No family background on file.</p>
              )}
            </>
          )}

          {tab === 'education' && (
            <>
              {(app.previousEducations ?? []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No education history on file.</p>
              ) : (
                (app.previousEducations ?? []).map((edu, i) => (
                  <div key={i} className="rounded-xl border border-[#e4ebf5] overflow-hidden">
                    <div className="bg-brand-50 px-3 py-2 border-b border-[#e4ebf5]">
                      <p className="text-xs font-bold text-brand-700">{edu.schoolName}</p>
                    </div>
                    <table className="w-full"><tbody className="divide-y divide-[#f0f4fa]">
                      <tr><td className="py-2 pl-3 pr-2 w-24 text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#f8fafd]">Level</td><td className="py-2 pl-2 pr-3 text-xs text-slate-800">{edu.level?.replace('_', ' ')}</td></tr>
                      <tr><td className="py-2 pl-3 pr-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#f8fafd]">Years</td><td className="py-2 pl-2 pr-3 text-xs text-slate-800">{edu.yearFrom}{edu.yearTo ? `–${edu.yearTo}` : ''}</td></tr>
                      {edu.honors && <tr><td className="py-2 pl-3 pr-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#f8fafd]">Honors</td><td className="py-2 pl-2 pr-3 text-xs text-slate-800">{edu.honors}</td></tr>}
                    </tbody></table>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'documents' && (
            <>
              {(app.documents ?? []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {(app.documents ?? []).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-[#e4ebf5] bg-white px-3 py-2.5">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.filename}</p>
                        <p className="text-[10px] text-slate-400">{doc.type.replace(/_/g, ' ')}</p>
                      </div>
                      {doc.verified
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        : <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Pending</span>
                      }
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#e4ebf5] bg-white px-4 py-3 space-y-2">
          {canAct && (
            <div className="flex gap-2">
              <button onClick={() => onAccept(app)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors">
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept Application
              </button>
              <button onClick={() => onReject(app)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 text-red-600 py-2.5 text-xs font-bold hover:bg-red-50 transition-colors">
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
          <a href={`/staff/admissions/${app.id}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-[#e4ebf5] bg-slate-50 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Open Full Record
          </a>
        </div>
      </div>
    </>
  )
}

export default function AdmissionsPage() {
  const { data: session } = useSession()
  const role      = (session?.user as { role?: string })?.role ?? ''
  const canDecide = role === 'ADMISSION_OFFICER' || role === 'SUPER_ADMIN'
  const staffName = (session?.user as { name?: string })?.name ?? 'Admissions Staff'

  const [applicants, setApplicants] = useState<Applicant[]>([...MOCK_APPLICANTS])
  const [query,        setQuery]        = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | 'ALL'>('ALL')
  const [viewApp,      setViewApp]      = useState<Applicant | null>(null)

  // Rehydrate any applicants submitted via the public /apply form
  // (module-level MOCK_APPLICANTS resets on full-page navigation, but sessionStorage survives)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sis_pending_applicants')
      if (!raw) return
      const pending: Applicant[] = JSON.parse(raw)
      if (!pending.length) return
      let changed = false
      for (const app of pending) {
        if (!MOCK_APPLICANTS.find((a) => a.id === app.id)) {
          MOCK_APPLICANTS.push(app)
          changed = true
        }
      }
      if (changed) setApplicants([...MOCK_APPLICANTS])
    } catch { /* sessionStorage unavailable */ }
  }, [])

  // ── Add modal state ──────────────────────────────────────────────────────────
  const [addOpen, setAddOpen]   = useState(false)
  const [step,    setStep]      = useState(1)
  const [form,    setForm]      = useState(emptyForm())
  const [educations, setEducations] = useState<Omit<PreviousEducation, 'id' | 'applicantId'>[]>([])
  const [saving,  setSaving]    = useState(false)

  function initDocs(applicantType: string): DocEntry[] {
    return REQUIRED_DOCS
      .filter((d) => !d.forType || d.forType.includes(applicantType))
      .map((d) => ({ type: d.type, label: d.label, received: false, verified: false, filename: '', uploadStatus: 'idle', notes: '', isCustom: false }))
  }
  const [docs, setDocs] = useState<DocEntry[]>(initDocs('FRESHMAN'))
  const [docFiles, setDocFiles] = useState<(File | null)[]>(() => initDocs('FRESHMAN').map(() => null))

  function setDoc(i: number, field: keyof DocEntry, val: boolean | string) {
    setDocs((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: val } : d))
  }
  function addCustomDoc() {
    setDocs((prev) => [...prev, { type: `CUSTOM_${++nextDocId}`, label: '', received: false, verified: false, filename: '', uploadStatus: 'idle', notes: '', isCustom: true }])
    setDocFiles((prev) => [...prev, null])
  }
  function removeDoc(i: number) {
    setDocs((prev) => prev.filter((_, idx) => idx !== i))
    setDocFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleFileSelect(i: number, file: File) {
    setDoc(i, 'uploadStatus', 'uploading')
    setDoc(i, 'filename', file.name)
    await new Promise((r) => setTimeout(r, 600))
    setDocFiles((prev) => prev.map((f, idx) => idx === i ? file : f))
    setDoc(i, 'received', true)
    setDoc(i, 'uploadStatus', 'success')
  }

  function clearFile(i: number) {
    setDocFiles((prev) => prev.map((f, idx) => idx === i ? null : f))
    setDoc(i, 'filename', '')
    setDoc(i, 'uploadStatus', 'idle')
    setDoc(i, 'received', false)
    setDoc(i, 'verified', false)
  }

  // ── Decision modals ──────────────────────────────────────────────────────────
  const [acceptTarget, setAcceptTarget] = useState<Applicant | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Applicant | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deciding,     setDeciding]     = useState(false)

  const programOptions = MOCK_PROGRAMS.length > 0
    ? MOCK_PROGRAMS
    : MOCK_DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, code: d.code, department: d.name, schoolId: d.schoolId }))

  const filtered = applicants.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false
    const q = query.toLowerCase()
    return !q || fullName(a).toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.referenceNumber.toLowerCase().includes(q)
  })

  const counts = {
    ALL:          applicants.length,
    PENDING:      applicants.filter((a) => a.status === 'PENDING').length,
    UNDER_REVIEW: applicants.filter((a) => a.status === 'UNDER_REVIEW').length,
    ACCEPTED:     applicants.filter((a) => a.status === 'ACCEPTED').length,
    REJECTED:     applicants.filter((a) => a.status === 'REJECTED').length,
  }

  function f(key: keyof ReturnType<typeof emptyForm>, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  // ── Add education row ────────────────────────────────────────────────────────
  function addEdu() {
    setEducations((prev) => [...prev, { schoolName: '', level: 'SENIOR_HIGH', yearFrom: 2020, yearTo: undefined, honors: '', address: '' }])
  }
  function updateEdu(i: number, field: string, val: string | number | undefined) {
    setEducations((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }
  function removeEdu(i: number) {
    setEducations((prev) => prev.filter((_, idx) => idx !== i))
  }

  // ── Save applicant ───────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))

    const progOpt = programOptions.find((p) => p.id === form.programId)
    const appId   = `app_enc_${Date.now()}`

    const fb: FamilyBackground | undefined =
      (form.fatherName || form.motherName || form.guardianName)
        ? {
            id: `fb_${appId}`, applicantId: appId,
            fatherName:      form.fatherName  || undefined,
            fatherOccupation:form.fatherOccupation || undefined,
            fatherPhone:     form.fatherPhone  || undefined,
            motherName:      form.motherName   || undefined,
            motherOccupation:form.motherOccupation || undefined,
            motherPhone:     form.motherPhone  || undefined,
            guardianName:    form.guardianName || undefined,
            guardianRelation:form.guardianRelation || undefined,
            guardianPhone:   form.guardianPhone || undefined,
            monthlyIncome:   form.monthlyIncome || undefined,
            livingWith:      form.livingWith || undefined,
          }
        : undefined

    const eduRecords: PreviousEducation[] = educations
      .filter((e) => e.schoolName.trim())
      .map((e, i) => ({
        id:         `edu_${appId}_${++nextEduId}`,
        applicantId: appId,
        schoolName:  e.schoolName,
        level:       e.level,
        yearFrom:    Number(e.yearFrom),
        yearTo:      e.yearTo ? Number(e.yearTo) : undefined,
        honors:      e.honors || undefined,
        address:     e.address || undefined,
      }))

    const newApp: Applicant = {
      id: appId,
      referenceNumber: generateRef(),
      firstName:   form.firstName.trim(),
      lastName:    form.lastName.trim(),
      middleName:  form.middleName.trim()   || undefined,
      suffix:      form.suffix.trim()       || undefined,
      email:       form.email.trim(),
      phone:       form.phone.trim()        || undefined,
      dateOfBirth: form.dateOfBirth         || undefined,
      placeOfBirth:form.placeOfBirth.trim() || undefined,
      gender:      form.gender,
      civilStatus: form.civilStatus         || undefined,
      nationality: form.nationality.trim()  || undefined,
      religion:    form.religion.trim()     || undefined,
      bloodType:   form.bloodType           || undefined,
      address:     form.address.trim()      || undefined,
      programId:   form.programId           || undefined,
      program:     progOpt                  ? { id: progOpt.id, name: progOpt.name, code: progOpt.code, department: (progOpt as { department?: string }).department, schoolId: progOpt.schoolId } : undefined,
      applicantType: form.applicantType as Applicant['applicantType'],
      gwa:         form.gwa.trim()          || undefined,
      strand:      form.strand.trim()       || undefined,
      remarks:     form.remarks.trim()      || undefined,
      status:      'PENDING',
      schoolId:    'school_1',
      familyBackground:    fb,
      previousEducations:  eduRecords,
      documents:           [],
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    }

    const docRecords: ApplicantDocument[] = docs
      .filter((d) => d.received && (d.isCustom ? d.label.trim() : true))
      .map((d) => ({
        id:          `doc_${appId}_${++nextDocId}`,
        applicantId: appId,
        type:        d.type,
        filename:    d.filename.trim() || `${d.type.toLowerCase()}.pdf`,
        verified:    d.verified,
        createdAt:   new Date().toISOString(),
      }))

    newApp.documents = docRecords

    MOCK_APPLICANTS.push(newApp)
    setApplicants((prev) => [...prev, newApp])
    setAddOpen(false)
    setStep(1)
    setForm(emptyForm())
    setEducations([])
    const freshDocs = initDocs('FRESHMAN')
    setDocs(freshDocs)
    setDocFiles(freshDocs.map(() => null))
    setSaving(false)
  }

  // ── Accept / Reject ──────────────────────────────────────────────────────────
  async function handleAccept() {
    if (!acceptTarget) return
    setDeciding(true)
    await new Promise((r) => setTimeout(r, 600))
    const idx = MOCK_APPLICANTS.findIndex((a) => a.id === acceptTarget.id)
    if (idx >= 0) { MOCK_APPLICANTS[idx].status = 'ACCEPTED'; MOCK_APPLICANTS[idx].reviewedBy = staffName; MOCK_APPLICANTS[idx].reviewedAt = new Date().toISOString() }
    setApplicants((prev) => prev.map((a) => a.id === acceptTarget.id ? { ...a, status: 'ACCEPTED', reviewedBy: staffName, reviewedAt: new Date().toISOString() } : a))
    setAcceptTarget(null); setDeciding(false)
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return
    setDeciding(true)
    await new Promise((r) => setTimeout(r, 600))
    const idx = MOCK_APPLICANTS.findIndex((a) => a.id === rejectTarget.id)
    if (idx >= 0) { MOCK_APPLICANTS[idx].status = 'REJECTED'; MOCK_APPLICANTS[idx].rejectionReason = rejectReason.trim(); MOCK_APPLICANTS[idx].reviewedBy = staffName; MOCK_APPLICANTS[idx].reviewedAt = new Date().toISOString() }
    setApplicants((prev) => prev.map((a) => a.id === rejectTarget.id ? { ...a, status: 'REJECTED', rejectionReason: rejectReason.trim(), reviewedBy: staffName, reviewedAt: new Date().toISOString() } : a))
    setRejectTarget(null); setRejectReason(''); setDeciding(false)
  }

  const step1Valid = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.dateOfBirth

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle
        description={`${applicants.length} total · ${counts.PENDING + counts.UNDER_REVIEW} pending review`}
        actions={
          canDecide && (
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => { setForm(emptyForm()); setEducations([]); setDocs(initDocs('FRESHMAN')); setStep(1); setAddOpen(true) }}>
              Add Applicant
            </Button>
          )
        }
      >
        Admissions
      </SectionTitle>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-[#e4ebf5] bg-white p-1">
          {STATUS_TABS.map((t) => (
            <button key={t.value} onClick={() => setStatusFilter(t.value)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${statusFilter === t.value ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}{t.value !== 'ALL' && <span className="ml-1 opacity-60">({counts[t.value as ApplicantStatus]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <UserPlus className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">No applicants found</p>
            {canDecide && <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>Add Applicant</Button>}
          </div>
        ) : (
          <Table>
            <Thead>
              <Th>Applicant</Th><Th>Reference #</Th><Th>Program</Th><Th>Type</Th><Th>Applied</Th><Th>Status</Th>
              {canDecide && <Th>Actions</Th>}
              <Th />
            </Thead>
            <Tbody>
              {filtered.map((app) => {
                const canAct = canDecide && (app.status === 'PENDING' || app.status === 'UNDER_REVIEW')
                return (
                  <Tr key={app.id} onClick={() => setViewApp(app)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullName(app)} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{fullName(app)}</p>
                          <p className="text-xs text-slate-400">{app.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">{app.referenceNumber}</code></Td>
                    <Td className="text-xs text-slate-600">{app.program?.code ?? '—'}</Td>
                    <Td><span className="text-xs capitalize text-slate-600">{app.applicantType.toLowerCase()}</span></Td>
                    <Td className="text-xs text-slate-500">{formatDate(app.createdAt)}</Td>
                    <Td><ApplicantBadge status={app.status} /></Td>
                    {canDecide && (
                      <Td>
                        {canAct ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setAcceptTarget(app)} className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                              <CheckCircle2 className="h-3 w-3" /> Accept
                            </button>
                            <button onClick={() => { setRejectTarget(app); setRejectReason('') }} className="flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </Td>
                    )}
                    <Td>
                      <Link href={`/staff/admissions/${app.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* ══════════════ ADD APPLICANT MODAL ══════════════ */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Applicant"
        description={`Step ${step} of ${STEPS.length} — ${STEPS[step - 1].label}`}
        size="xl"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setAddOpen(false)} icon={step > 1 ? <ChevronLeft className="h-4 w-4" /> : undefined}>
              {step > 1 ? 'Back' : 'Cancel'}
            </Button>
            <div className="flex items-center gap-2">
              {step < STEPS.length ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !step1Valid} iconRight={<ChevronRight className="h-4 w-4" />}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSave} loading={saving} disabled={!step1Valid} icon={<CheckCircle2 className="h-4 w-4" />}>
                  Save Applicant
                </Button>
              )}
            </div>
          </div>
        }
      >
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-6 border-b border-[#e4ebf5] pb-4">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => s.id < step || (s.id === 1) || (s.id <= step) ? setStep(s.id) : undefined}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${step === s.id ? 'bg-brand-500 text-white' : step > s.id ? 'text-brand-600 bg-brand-50' : 'text-slate-400'}`}>
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 ml-1 opacity-40" />}
            </button>
          ))}
        </div>

        {/* ── Step 1: Personal Information ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1"><Input label="First Name *" value={form.firstName} onChange={(e) => f('firstName', e.target.value)} placeholder="Juan" /></div>
              <div className="col-span-1"><Input label="Last Name *"  value={form.lastName}  onChange={(e) => f('lastName', e.target.value)}  placeholder="Dela Cruz" /></div>
              <div className="col-span-1"><Input label="Middle Name"  value={form.middleName} onChange={(e) => f('middleName', e.target.value)} placeholder="Santos" /></div>
              <div className="col-span-1"><Input label="Suffix"       value={form.suffix}    onChange={(e) => f('suffix', e.target.value)}    placeholder="Jr., III…" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Email *"   type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="juan@email.com" />
              <Input label="Phone"     type="tel"   value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="09XXXXXXXXX" />
              <Input label="Address"               value={form.address} onChange={(e) => f('address', e.target.value)} placeholder="Street, City, Province" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={(e) => f('dateOfBirth', e.target.value)} />
              <Input label="Place of Birth"         value={form.placeOfBirth}  onChange={(e) => f('placeOfBirth', e.target.value)}  placeholder="City/Municipality" />
              <Select label="Gender" value={form.gender} onChange={(e) => f('gender', e.target.value)}>
                {['MALE','FEMALE','OTHER'].map((g) => <option key={g} value={g}>{g.charAt(0)+g.slice(1).toLowerCase()}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Select label="Civil Status" value={form.civilStatus} onChange={(e) => f('civilStatus', e.target.value)}>
                {CIVIL_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Input label="Nationality"  value={form.nationality} onChange={(e) => f('nationality', e.target.value)} placeholder="Filipino" />
              <Input label="Religion"     value={form.religion}    onChange={(e) => f('religion', e.target.value)}    placeholder="Catholic…" />
              <Select label="Blood Type"  value={form.bloodType}   onChange={(e) => f('bloodType', e.target.value)}>
                <option value="">Select…</option>
                {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
          </div>
        )}

        {/* ── Step 2: Family Background ── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Father */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Father's Information</p>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Full Name"   value={form.fatherName}       onChange={(e) => f('fatherName', e.target.value)}       placeholder="Juan Dela Cruz Sr." />
                <Input label="Occupation"  value={form.fatherOccupation} onChange={(e) => f('fatherOccupation', e.target.value)} placeholder="Engineer" />
                <Input label="Phone"       value={form.fatherPhone}      onChange={(e) => f('fatherPhone', e.target.value)}      placeholder="09XXXXXXXXX" />
              </div>
            </div>
            {/* Mother */}
            <div className="border-t border-[#f0f4fa] pt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Mother's Information</p>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Full Name (Maiden)" value={form.motherName}       onChange={(e) => f('motherName', e.target.value)}       placeholder="Maria Santos" />
                <Input label="Occupation"         value={form.motherOccupation} onChange={(e) => f('motherOccupation', e.target.value)} placeholder="Teacher" />
                <Input label="Phone"              value={form.motherPhone}      onChange={(e) => f('motherPhone', e.target.value)}      placeholder="09XXXXXXXXX" />
              </div>
            </div>
            {/* Guardian */}
            <div className="border-t border-[#f0f4fa] pt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Guardian (if applicable)</p>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Full Name"  value={form.guardianName}     onChange={(e) => f('guardianName', e.target.value)}     placeholder="Name" />
                <Input label="Relation"   value={form.guardianRelation} onChange={(e) => f('guardianRelation', e.target.value)} placeholder="Aunt, Uncle…" />
                <Input label="Phone"      value={form.guardianPhone}    onChange={(e) => f('guardianPhone', e.target.value)}    placeholder="09XXXXXXXXX" />
              </div>
            </div>
            {/* Household */}
            <div className="border-t border-[#f0f4fa] pt-4 grid grid-cols-2 gap-3">
              <Select label="Monthly Household Income" value={form.monthlyIncome} onChange={(e) => f('monthlyIncome', e.target.value)}>
                <option value="">Select range…</option>
                {INCOME_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
              <Select label="Living With" value={form.livingWith} onChange={(e) => f('livingWith', e.target.value)}>
                {LIVING_WITH.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </div>
          </div>
        )}

        {/* ── Step 3: Educational History ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Previous Schools</p>
              <Button size="xs" variant="soft" icon={<Plus className="h-3 w-3" />} onClick={addEdu}>Add School</Button>
            </div>
            {educations.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-[#e4ebf5] flex flex-col items-center gap-2 py-10">
                <School className="h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">No educational history added yet.</p>
                <Button size="sm" variant="soft" icon={<Plus className="h-3.5 w-3.5" />} onClick={addEdu}>Add First School</Button>
              </div>
            )}
            {educations.map((edu, i) => (
              <div key={i} className="rounded-xl border border-[#e4ebf5] bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">School #{i + 1}</p>
                  <button onClick={() => removeEdu(i)} className="rounded p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="School Name *" value={edu.schoolName} onChange={(e) => updateEdu(i, 'schoolName', e.target.value)} placeholder="School name" />
                  <Select label="Level" value={edu.level} onChange={(e) => updateEdu(i, 'level', e.target.value)}>
                    {EDU_LEVELS.map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <Input label="Year From" type="number" value={String(edu.yearFrom)} onChange={(e) => updateEdu(i, 'yearFrom', +e.target.value)} placeholder="2018" />
                  <Input label="Year To"   type="number" value={String(edu.yearTo ?? '')} onChange={(e) => updateEdu(i, 'yearTo', e.target.value ? +e.target.value : undefined)} placeholder="2022" />
                  <Input label="Honors / Awards" value={edu.honors ?? ''} onChange={(e) => updateEdu(i, 'honors', e.target.value)} placeholder="With Honors" />
                  <Input label="City / Province"  value={edu.address ?? ''} onChange={(e) => updateEdu(i, 'address', e.target.value)} placeholder="Quezon City" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 4: Academic Intent ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Program / Department" value={form.programId} onChange={(e) => f('programId', e.target.value)}>
                <option value="">Select program…</option>
                {programOptions.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </Select>
              <Select label="Applicant Type" value={form.applicantType} onChange={(e) => { f('applicantType', e.target.value); setDocs(initDocs(e.target.value)) }}>
                {['FRESHMAN','TRANSFEREE','RETURNEE'].map((t) => <option key={t} value={t}>{t.charAt(0)+t.slice(1).toLowerCase()}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="General Weighted Average (GWA)" type="number" step="0.01" min="0" max="100" value={form.gwa} onChange={(e) => f('gwa', e.target.value)} placeholder="e.g. 92.5" hint="From most recent school" />
              <Input label="Strand / Track (Senior High)" value={form.strand} onChange={(e) => f('strand', e.target.value)} placeholder="e.g. STEM, ABM, HUMSS" />
            </div>
            <Textarea label="Remarks / Additional Notes" value={form.remarks} onChange={(e) => f('remarks', e.target.value)} placeholder="Any notes about this applicant…" rows={3} />

            {/* Summary preview */}
            <div className="rounded-xl border border-[#e4ebf5] bg-slate-50 px-4 py-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Applicant Summary</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <div><span className="text-slate-400">Name: </span><span className="font-semibold text-slate-800">{[form.firstName, form.middleName, form.lastName, form.suffix].filter(Boolean).join(' ')}</span></div>
                <div><span className="text-slate-400">Email: </span><span className="font-semibold text-slate-800">{form.email}</span></div>
                <div><span className="text-slate-400">DOB: </span><span className="font-semibold text-slate-800">{form.dateOfBirth || '—'}</span></div>
                <div><span className="text-slate-400">Program: </span><span className="font-semibold text-slate-800">{programOptions.find((p) => p.id === form.programId)?.code ?? '—'}</span></div>
                <div><span className="text-slate-400">Type: </span><span className="font-semibold text-slate-800">{form.applicantType}</span></div>
                <div><span className="text-slate-400">Schools on file: </span><span className="font-semibold text-slate-800">{educations.filter((e) => e.schoolName).length}</span></div>
                <div><span className="text-slate-400">Family bg: </span><span className="font-semibold text-slate-800">{form.fatherName || form.motherName || form.guardianName ? 'Provided' : 'None'}</span></div>
                <div><span className="text-slate-400">GWA: </span><span className="font-semibold text-slate-800">{form.gwa || '—'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Documents ── */}
        {step === 5 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Required Documents</p>
              <Button size="xs" variant="soft" icon={<Plus className="h-3 w-3" />} onClick={addCustomDoc}>Add Custom</Button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 rounded-lg bg-slate-50 border border-[#e4ebf5] px-4 py-2.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-slate-300 inline-block" /> Not received</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400 inline-block" /> Received</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500 inline-block" /> Received &amp; Verified</span>
            </div>

            <div className="space-y-2">
              {docs.map((doc, i) => {
                const isRequired = REQUIRED_DOCS.find((r) => r.type === doc.type)?.required
                return (
                  <div
                    key={i}
                    className={`rounded-xl border px-4 py-3 transition-all ${
                      doc.verified ? 'border-emerald-200 bg-emerald-50/50'
                      : doc.received ? 'border-amber-200 bg-amber-50/40'
                      : 'border-[#e4ebf5] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Received toggle */}
                      <button
                        onClick={() => { setDoc(i, 'received', !doc.received); if (doc.received) setDoc(i, 'verified', false) }}
                        className="mt-0.5 shrink-0"
                        title={doc.received ? 'Mark as not received' : 'Mark as received'}
                      >
                        {doc.received
                          ? <ToggleRight className="h-5 w-5 text-amber-500" />
                          : <ToggleLeft  className="h-5 w-5 text-slate-300" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        {doc.isCustom ? (
                          <Input
                            placeholder="Document name…"
                            value={doc.label}
                            onChange={(e) => setDoc(i, 'label', e.target.value)}
                            className="text-sm h-7 py-0"
                          />
                        ) : (
                          <p className={`text-sm font-medium ${doc.received ? 'text-slate-800' : 'text-slate-500'}`}>
                            {doc.label}
                            {isRequired && <span className="ml-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wide">Required</span>}
                          </p>
                        )}

                        {/* File upload area */}
                        <div className="mt-2 space-y-2">
                          {doc.filename ? (
                            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                              doc.uploadStatus === 'success' ? 'border-emerald-200 bg-emerald-50' :
                              doc.uploadStatus === 'uploading' ? 'border-blue-200 bg-blue-50' :
                              'border-slate-200 bg-slate-50'
                            }`}>
                              <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="flex-1 truncate text-slate-700 font-medium">{doc.filename}</span>
                              {doc.uploadStatus === 'uploading' && (
                                <span className="text-blue-600 font-semibold shrink-0">Uploading…</span>
                              )}
                              {doc.uploadStatus === 'success' && (
                                <span className="text-emerald-600 font-semibold shrink-0 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Uploaded
                                </span>
                              )}
                              <button onClick={() => clearFile(i)} className="shrink-0 rounded p-0.5 text-slate-300 hover:text-red-500">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                              <Upload className="h-3.5 w-3.5 shrink-0" />
                              <span>Click to upload (PDF, JPG, PNG, DOC)</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(i, f) }}
                              />
                            </label>
                          )}
                          {doc.received && (
                            <Input
                              placeholder="Notes (optional)"
                              value={doc.notes}
                              onChange={(e) => setDoc(i, 'notes', e.target.value)}
                              className="text-xs h-7 py-0"
                            />
                          )}
                        </div>
                      </div>

                      {/* Verified toggle — only when received */}
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.received && (
                          <button
                            onClick={() => setDoc(i, 'verified', !doc.verified)}
                            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border transition-all ${
                              doc.verified
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-200'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {doc.verified ? 'Verified' : 'Mark Verified'}
                          </button>
                        )}
                        {doc.isCustom && (
                          <button onClick={() => removeDoc(i)} className="rounded p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Document summary */}
            <div className="rounded-xl border border-[#e4ebf5] bg-slate-50 px-4 py-3 flex items-center gap-6 text-xs">
              <div><span className="text-slate-400">Total: </span><span className="font-bold text-slate-800">{docs.length}</span></div>
              <div><span className="text-slate-400">Received: </span><span className="font-bold text-amber-600">{docs.filter((d) => d.received).length}</span></div>
              <div><span className="text-slate-400">Verified: </span><span className="font-bold text-emerald-600">{docs.filter((d) => d.verified).length}</span></div>
              <div><span className="text-slate-400">Missing: </span><span className="font-bold text-red-500">{docs.filter((d) => !d.received).length}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Accept Confirm ── */}
      <Modal open={!!acceptTarget} onClose={() => setAcceptTarget(null)} title="Accept Application" description={acceptTarget ? fullName(acceptTarget) : ''} size="sm"
        footer={<><Button variant="outline" onClick={() => setAcceptTarget(null)}>Cancel</Button><Button variant="success" onClick={handleAccept} loading={deciding} icon={<CheckCircle2 className="h-4 w-4" />}>Confirm Acceptance</Button></>}>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          <p className="font-semibold mb-1">This will:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            <li>Set status to <strong>Accepted</strong></li>
            <li>Record <strong>{staffName}</strong> as reviewing officer</li>
            <li>Move applicant to Registrar queue</li>
          </ul>
        </div>
      </Modal>

      {/* ── Reject Confirm ── */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason('') }} title="Reject Application" description={rejectTarget ? fullName(rejectTarget) : ''} size="sm"
        footer={<><Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleReject} loading={deciding} disabled={!rejectReason.trim()} icon={<XCircle className="h-4 w-4" />}>Confirm Rejection</Button></>}>
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">Provide a clear reason. This will be visible on the applicant's record.</p>
          </div>
          <Textarea label="Reason for rejection *" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Incomplete requirements — missing Good Moral Certificate." rows={3} />
        </div>
      </Modal>

      {/* ── Applicant quick-view drawer ── */}
      {viewApp && (
        <ApplicantDrawer
          app={viewApp}
          canDecide={canDecide}
          staffName={staffName}
          onClose={() => setViewApp(null)}
          onAccept={(app) => { setViewApp(null); setAcceptTarget(app) }}
          onReject={(app) => { setViewApp(null); setRejectTarget(app); setRejectReason('') }}
        />
      )}
    </div>
  )
}
