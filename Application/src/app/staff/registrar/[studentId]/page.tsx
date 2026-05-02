'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Edit2, Save, X, CheckCircle2,
  Plus, Check, Mail, Phone, MapPin, Trash2,
  BookOpen, User, Users, School, Camera, Heart,
  Paperclip, FileText,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_OFFERINGS, MOCK_GRADES, MOCK_SEMESTERS } from '@/lib/mock-data'
import { fullName, initials, formatDate, formatTime, DAY_ABBR, yearLevelLabel, GRADE_STATUS_COLORS } from '@/lib/utils'
import { GradeBadge } from '@/components/ui/Badge'

type Tab = 'personal' | 'family' | 'academic' | 'history'
type DocumentEntry  = { title: string; file: File | null }
type EducationRecord = { school: string; level: string; years: string; honors: string; documents: DocumentEntry[] }
type FamilyMember   = { name: string; relation: string; phone: string; email: string; occupation: string }

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info',     icon: User },
  { id: 'family',   label: 'Family Background', icon: Users },
  { id: 'academic', label: 'Academic Records',  icon: BookOpen },
  { id: 'history',  label: 'Education History', icon: School },
]

function statusBadgeClass(status: string) {
  switch (status) {
    case 'ACTIVE':    return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    case 'INACTIVE':  return 'bg-slate-100 text-slate-500 ring-slate-400/20'
    case 'DROPPED':   return 'bg-red-50 text-red-700 ring-red-600/20'
    case 'GRADUATED': return 'bg-cyan-50 text-cyan-700 ring-cyan-600/20'
    default:          return 'bg-slate-100 text-slate-500 ring-slate-400/20'
  }
}

export default function RegistrarStudentPage({ params }: { params: { studentId: string } }) {
  const { studentId } = params
  const { data: session } = useSession()
  const role    = (session?.user as { role?: string })?.role
  const canEdit = role === 'REGISTRAR' || role === 'SUPER_ADMIN'

  const student     = MOCK_STUDENTS.find((s) => s.id === studentId)
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === studentId)

  const [tab,          setTab]          = useState<Tab>('personal')
  const [editMode,     setEditMode]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [assignModal,  setAssignModal]  = useState(false)
  const [selected,     setSelected]     = useState<string[]>(enrollments.map((e) => e.offeringId))
  const [assignSaving, setAssignSaving] = useState(false)

  const [photoUrl, setPhotoUrl] = useState<string | null>(student?.photo ?? null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [formErrors, setFormErrors] = useState<{ email?: string; phone?: string }>({})
  const isPhoneValid = (p: string) => /^(\+?63|0)9\d{9}$/.test(p.replace(/[\s\-]/g, ''))
  const [verified, setVerified] = useState({ email: true, phone: isPhoneValid(student?.phone ?? '') })

  // ── Education history (addable) ──────────────────────────────────────────
  const [history, setHistory] = useState<EducationRecord[]>([
    { school: 'Westfield National High School', level: 'Senior High School', years: '2019 – 2023', honors: 'With Honors', documents: [{ title: 'Form 138', file: null }] },
    { school: 'Mabini Elementary School',       level: 'Elementary',         years: '2013 – 2019', honors: '',            documents: [{ title: 'Diploma', file: null }] },
  ])

  // ── Family members (addable) ─────────────────────────────────────────────
  const initialFamily: FamilyMember[] = student?.guardianName
    ? [{ name: student.guardianName, relation: student.guardianRelation ?? '', phone: student.guardianPhone ?? '', email: '', occupation: '' }]
    : []
  const [family, setFamily] = useState<FamilyMember[]>(initialFamily)

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // identity
    firstName:    student?.firstName ?? '',
    lastName:     student?.lastName  ?? '',
    middleName:   student?.middleName ?? '',
    // contact
    email:        student?.email    ?? '',
    phone:        student?.phone    ?? '',
    address:      student?.address  ?? '',
    // personal details
    dateOfBirth:  student?.dateOfBirth?.slice(0, 10) ?? '',
    placeOfBirth: '',
    gender:       student?.gender  ?? '',
    civilStatus:  '',
    nationality:  'Filipino',
    religion:     '',
    bloodType:    '',
    // academic standing
    programId:    student?.programId ?? '',
    yearLevel:    String(student?.yearLevel ?? 1),
    status:       student?.status ?? 'ACTIVE',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUrl(URL.createObjectURL(file))
  }

  function handleCancel() {
    setForm({
      firstName: student?.firstName ?? '', lastName: student?.lastName ?? '',
      middleName: student?.middleName ?? '', email: student?.email ?? '',
      phone: student?.phone ?? '', address: student?.address ?? '',
      dateOfBirth: student?.dateOfBirth?.slice(0, 10) ?? '',
      placeOfBirth: '', gender: student?.gender ?? '',
      civilStatus: '', nationality: 'Filipino', religion: '', bloodType: '',
      programId: student?.programId ?? '', yearLevel: String(student?.yearLevel ?? 1),
      status: student?.status ?? 'ACTIVE',
    })
    setFormErrors({})
    setEditMode(false)
  }

  function validate() {
    const errors: { email?: string; phone?: string } = {}
    if (!form.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }
    if (!form.phone.trim()) {
      errors.phone = 'Mobile number is required.'
    } else if (!/^(\+?63|0)9\d{9}$/.test(form.phone.replace(/[\s\-]/g, ''))) {
      errors.phone = 'Enter a valid PH mobile number (e.g. 09171234567).'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    setEditMode(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
  }

  async function handleAssignSave() {
    setAssignSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setAssignSaving(false)
    setAssignModal(false)
  }

  // Education history helpers
  function addHistoryRow() { setHistory((p) => [...p, { school: '', level: '', years: '', honors: '', documents: [] }]) }
  function removeHistoryRow(i: number) { setHistory((p) => p.filter((_, idx) => idx !== i)) }
  function updateHistory(i: number, f: keyof Omit<EducationRecord, 'documents'>, v: string) {
    setHistory((p) => p.map((h, idx) => idx === i ? { ...h, [f]: v } : h))
  }
  function addDocumentRow(i: number) {
    setHistory((p) => p.map((h, idx) => idx === i ? { ...h, documents: [...h.documents, { title: '', file: null }] } : h))
  }
  function removeDocument(histIdx: number, docIdx: number) {
    setHistory((p) => p.map((h, idx) =>
      idx === histIdx ? { ...h, documents: h.documents.filter((_, di) => di !== docIdx) } : h,
    ))
  }
  function updateDocumentTitle(histIdx: number, docIdx: number, title: string) {
    setHistory((p) => p.map((h, idx) =>
      idx === histIdx
        ? { ...h, documents: h.documents.map((d, di) => di === docIdx ? { ...d, title } : d) }
        : h,
    ))
  }
  function setDocumentFile(histIdx: number, docIdx: number, file: File | null) {
    setHistory((p) => p.map((h, idx) =>
      idx === histIdx
        ? { ...h, documents: h.documents.map((d, di) => di === docIdx ? { ...d, file } : d) }
        : h,
    ))
  }

  // Family member helpers
  function addFamilyRow() { setFamily((p) => [...p, { name: '', relation: '', phone: '', email: '', occupation: '' }]) }
  function removeFamilyRow(i: number) { setFamily((p) => p.filter((_, idx) => idx !== i)) }
  function updateFamily(i: number, f: keyof FamilyMember, v: string) {
    setFamily((p) => p.map((m, idx) => idx === i ? { ...m, [f]: v } : m))
  }

  const totalUnits  = enrollments.reduce((s, e) => s + (e.offering?.subject?.units ?? 0), 0)
  const displayName = fullName(student ?? { firstName: '', lastName: '' })

  if (!student) {
    return (
      <div className="py-20 text-center text-slate-500">
        Student not found.{' '}
        <Link href="/staff/registrar" className="text-blue-600 hover:underline">Back to Registrar</Link>
      </div>
    )
  }

  const currentStatus = editMode ? form.status : student.status

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/staff/registrar" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Student Records
      </Link>

      {saved && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Changes saved successfully</p>
            <p className="text-xs text-emerald-700">Student record updated and logged to audit trail.</p>
          </div>
        </div>
      )}

      {/* ── Profile header ────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start gap-6 flex-wrap">
          {/* Photo */}
          <div className="relative shrink-0">
            <div className="h-64 w-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-50">
                  <span className="text-3xl font-bold text-blue-300">{initials(displayName)}</span>
                </div>
              )}
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-black/50 transition-opacity ${
                  editMode ? 'opacity-0 hover:opacity-100' : 'hidden'
                }`}
              >
                <Camera className="h-5 w-5 text-white" />
                <span className="text-[10px] font-semibold text-white">Change</span>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {editMode ? [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ') : displayName}
                </h1>
                <p className="text-sm text-slate-500">{student.program?.name}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusBadgeClass(currentStatus)}>{currentStatus}</Badge>
                {canEdit && !editMode && (
                  <Button size="sm" variant="outline" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => setEditMode(true)}>
                    Edit Record
                  </Button>
                )}
                {editMode && (
                  <>
                    <Button size="sm" variant="outline" icon={<X className="h-3.5 w-3.5" />} onClick={handleCancel}>Cancel</Button>
                    <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} loading={saving} onClick={handleSave}>Save Changes</Button>
                  </>
                )}
              </div>
            </div>

            {/* Key facts strip */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Fact label="Student ID"  value={student.studentId} mono />
              <div className="hidden sm:block w-px h-7 bg-slate-200" />
              <Fact label="Year Level"  value={yearLevelLabel(student.yearLevel)} />
              <div className="hidden sm:block w-px h-7 bg-slate-200" />
              <Fact label="Program"     value={student.program?.code ?? '—'} />
              <div className="hidden sm:block w-px h-7 bg-slate-200" />
              <Fact label="Total Units" value={`${totalUnits} units`} />
            </div>

            {/* Contact block */}
            {!editMode && (
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {student.email && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 whitespace-nowrap">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {student.email}
                      {verified.email && <VerifiedTag />}
                    </span>
                  )}
                  {student.phone && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 whitespace-nowrap">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {student.phone}
                      {verified.phone && <VerifiedTag />}
                    </span>
                  )}
                </div>
                {student.address && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {student.address}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Personal Info ────────────────────────────────────────────── */}
      {tab === 'personal' && (
        editMode ? (
          <div className="space-y-4">
            {/* Name & identity */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Name</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label="First Name"  value={form.firstName}  onChange={(e) => update('firstName',  e.target.value)} required />
                <Input label="Middle Name" value={form.middleName} onChange={(e) => update('middleName', e.target.value)} />
                <Input label="Last Name"   value={form.lastName}   onChange={(e) => update('lastName',   e.target.value)} required />
              </div>
            </Card>

            {/* Personal details */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Date of Birth"  type="date" value={form.dateOfBirth}  onChange={(e) => update('dateOfBirth',  e.target.value)} />
                <Input label="Place of Birth"            value={form.placeOfBirth} onChange={(e) => update('placeOfBirth', e.target.value)} placeholder="City, Province" />
                <Select label="Sex / Gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </Select>
                <Select label="Civil Status" value={form.civilStatus} onChange={(e) => update('civilStatus', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="SEPARATED">Separated</option>
                </Select>
                <Input label="Nationality"  value={form.nationality} onChange={(e) => update('nationality', e.target.value)} placeholder="e.g. Filipino" />
                <Input label="Religion"     value={form.religion}    onChange={(e) => update('religion',    e.target.value)} placeholder="e.g. Roman Catholic" />
                <Select label="Blood Type" value={form.bloodType} onChange={(e) => update('bloodType', e.target.value)}>
                  <option value="">Select…</option>
                  {['A+','A−','B+','B−','AB+','AB−','O+','O−'].map((t) => <option key={t}>{t}</option>)}
                </Select>
              </div>
            </Card>

            {/* Contact */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => { update('email', e.target.value); setFormErrors((p) => ({ ...p, email: undefined })) }}
                  error={formErrors.email}
                  required
                />
                <Input
                  label="Mobile Number"
                  value={form.phone}
                  onChange={(e) => { update('phone', e.target.value); setFormErrors((p) => ({ ...p, phone: undefined })) }}
                  placeholder="+63 9XX-XXX-XXXX"
                  error={formErrors.phone}
                />
                {/* Verification toggles */}
                <div className="flex items-center gap-6 sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={verified.email}
                      onChange={(e) => setVerified((p) => ({ ...p, email: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                    />
                    <span className="text-xs text-slate-600">Email verified</span>
                    {verified.email && <VerifiedTag />}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={verified.phone}
                      onChange={(e) => setVerified((p) => ({ ...p, phone: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                    />
                    <span className="text-xs text-slate-600">Mobile verified</span>
                    {verified.phone && <VerifiedTag />}
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <Textarea label="Home Address" value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} />
                </div>
              </div>
            </Card>

            {/* Standing */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Academic Standing</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DROPPED">Dropped</option>
                  <option value="GRADUATED">Graduated</option>
                </Select>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Personal Details</h3>
                <dl className="space-y-2.5">
                  <Row label="Full Name"      value={displayName} />
                  <Row label="Date of Birth"  value={formatDate(student.dateOfBirth)} />
                  <Row label="Place of Birth" value={form.placeOfBirth || '—'} />
                  <Row label="Sex / Gender"   value={student.gender?.toLowerCase() ?? '—'} capitalize />
                  <Row label="Civil Status"   value={form.civilStatus || '—'} capitalize />
                  <Row label="Nationality"    value={form.nationality || '—'} />
                  <Row label="Religion"       value={form.religion || '—'} />
                  <Row label="Blood Type"     value={form.bloodType || '—'} />
                </dl>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Information</h3>
                <dl className="space-y-2.5">
                  <Row label="Email"  value={student.email}      verified={verified.email} />
                  <Row label="Mobile" value={student.phone ?? '—'} verified={verified.phone} />
                  <Row label="Address" value={student.address ?? '—'} />
                  <Row label="Status"  value={student.status} />
                </dl>
              </Card>
            </div>
          </div>
        )
      )}

      {/* ── Tab: Family Background ────────────────────────────────────────── */}
      {tab === 'family' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Family Members &amp; Guardians</h3>
            {canEdit && editMode && (
              <Button size="sm" variant="outline" icon={<Plus className="h-3.5 w-3.5" />} onClick={addFamilyRow}>
                Add Member
              </Button>
            )}
          </div>

          {family.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No family members recorded.</p>
          )}

          <div className="space-y-3">
            {family.map((m, i) => (
              editMode ? (
                <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Full Name"    value={m.name}       onChange={(e) => updateFamily(i, 'name',       e.target.value)} placeholder="e.g. Maria Dela Cruz" />
                    <Select label="Relationship" value={m.relation}  onChange={(e) => updateFamily(i, 'relation',   e.target.value)}>
                      <option value="">Select…</option>
                      <option>Mother</option>
                      <option>Father</option>
                      <option>Stepmother</option>
                      <option>Stepfather</option>
                      <option>Grandparent</option>
                      <option>Sibling</option>
                      <option>Aunt / Uncle</option>
                      <option>Relative</option>
                      <option>Legal Guardian</option>
                    </Select>
                    <Input label="Phone Number"  value={m.phone}      onChange={(e) => updateFamily(i, 'phone',      e.target.value)} placeholder="+63 9XX-XXX-XXXX" />
                    <Input label="Email Address" type="email" value={m.email} onChange={(e) => updateFamily(i, 'email', e.target.value)} placeholder="optional" />
                    <Input label="Occupation"    value={m.occupation} onChange={(e) => updateFamily(i, 'occupation', e.target.value)} placeholder="e.g. Teacher" />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeFamilyRow(i)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 shrink-0">
                    <Heart className="h-4 w-4 text-pink-400" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.name || '—'}</p>
                      <p className="text-xs text-slate-500">{m.relation || 'Relationship not set'}</p>
                    </div>
                    <dl className="space-y-0.5">
                      {m.phone      && <Row label="Phone"      value={m.phone} />}
                      {m.email      && <Row label="Email"      value={m.email} />}
                      {m.occupation && <Row label="Occupation" value={m.occupation} />}
                    </dl>
                  </div>
                </div>
              )
            ))}
          </div>
        </Card>
      )}

      {/* ── Tab: Academic Records ─────────────────────────────────────────── */}
      {tab === 'academic' && (() => {
        // Build grade lookup
        const gradeByEnrollment = Object.fromEntries(MOCK_GRADES.map((g) => [g.enrollmentId, g]))

        // Group all student enrollments by semester (oldest first)
        const semOrder = MOCK_SEMESTERS.map((s) => s.id)
        const grouped = enrollments.reduce<Record<string, typeof enrollments>>((acc, e) => {
          const key = e.semesterId
          if (!acc[key]) acc[key] = []
          acc[key].push(e)
          return acc
        }, {})
        const sortedSemIds = Object.keys(grouped).sort(
          (a, b) => semOrder.indexOf(b) - semOrder.indexOf(a),
        )

        const totalEnrollments = enrollments.length
        const totalUnitsAll    = enrollments.reduce((s, e) => s + (e.offering?.subject?.units ?? 0), 0)

        return (
          <div className="space-y-4">
            {/* Academic Details — always visible */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Academic Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select
                  label="Year Level"
                  value={form.yearLevel}
                  onChange={(e) => update('yearLevel', e.target.value)}
                  disabled={!canEdit}
                >
                  {Array.from({ length: student.yearLevel }, (_, i) => i + 1).map((y) => (
                    <option key={y} value={y}>{yearLevelLabel(y)}</option>
                  ))}
                </Select>
              </div>
            </Card>

            {/* Summary bar */}
            <div className="flex items-center gap-6 rounded-xl border border-slate-200 bg-white px-5 py-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total Subjects</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{totalEnrollments}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total Units</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{totalUnitsAll}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Program</p>
                <p className="text-sm font-semibold text-slate-900">{student.program?.code ?? '—'}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Year Level</p>
                <p className="text-sm font-semibold text-slate-900">{yearLevelLabel(student.yearLevel)}</p>
              </div>
              {canEdit && (
                <div className="ml-auto">
                  <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAssignModal(true)}>
                    Assign Subjects
                  </Button>
                </div>
              )}
            </div>

            {/* Per-semester subject records */}
            {enrollments.length === 0 ? (
              <Card>
                <p className="text-center text-xs text-slate-400 py-8">No academic records found.</p>
              </Card>
            ) : (
              sortedSemIds.map((semId) => {
                const semEnrollments = grouped[semId]
                const sem = semEnrollments[0]?.semester ?? MOCK_SEMESTERS.find((s) => s.id === semId)
                return (
                  <Card key={semId} padding="none">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{sem?.name ?? semId}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {semEnrollments.length} subject{semEnrollments.length !== 1 ? 's' : ''} ·{' '}
                          {semEnrollments.reduce((s, e) => s + (e.offering?.subject?.units ?? 0), 0)} units
                        </p>
                      </div>
                      {sem?.isActive && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Current
                        </span>
                      )}
                    </div>
                    <Table>
                      <Thead>
                        <Th>Code</Th>
                        <Th>Subject</Th>
                        <Th>Units</Th>
                        <Th>Teacher</Th>
                        <Th>Quiz</Th>
                        <Th>Assign.</Th>
                        <Th>Final</Th>
                        <Th>Grade</Th>
                        <Th>Status</Th>
                      </Thead>
                      <Tbody>
                        {semEnrollments.map((e) => {
                          const grade   = gradeByEnrollment[e.id]
                          const teacher = e.offering?.assignments?.[0]?.faculty
                          return (
                            <Tr key={e.id}>
                              <Td>
                                <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-mono text-blue-700">
                                  {e.offering?.subject?.code}
                                </code>
                              </Td>
                              <Td className="font-medium text-slate-900 max-w-[180px] truncate">
                                {e.offering?.subject?.name}
                              </Td>
                              <Td className="text-xs text-slate-500">{e.offering?.subject?.units ?? '—'}</Td>
                              <Td className="text-xs text-slate-600">
                                {teacher ? fullName(teacher) : '—'}
                              </Td>
                              <Td className="text-xs text-slate-700 tabular-nums">
                                {grade?.quizAverage != null ? `${grade.quizAverage}%` : '—'}
                              </Td>
                              <Td className="text-xs text-slate-700 tabular-nums">
                                {grade?.assignmentAverage != null ? `${grade.assignmentAverage}%` : '—'}
                              </Td>
                              <Td className="text-xs text-slate-700 tabular-nums">
                                {grade?.finalGrade != null ? `${grade.finalGrade}%` : '—'}
                              </Td>
                              <Td>
                                {grade?.letterGrade
                                  ? <span className="text-sm font-bold text-slate-900">{grade.letterGrade}</span>
                                  : <span className="text-xs text-slate-400">—</span>}
                              </Td>
                              <Td>
                                {grade
                                  ? <GradeBadge status={grade.status} />
                                  : <span className="text-xs text-slate-400">—</span>}
                              </Td>
                            </Tr>
                          )
                        })}
                      </Tbody>
                    </Table>
                  </Card>
                )
              })
            )}
          </div>
        )
      })()}

      {/* ── Tab: Education History ────────────────────────────────────────── */}
      {tab === 'history' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Previous Education</h3>
            {canEdit && editMode && (
              <Button size="sm" variant="outline" icon={<Plus className="h-3.5 w-3.5" />} onClick={addHistoryRow}>
                Add School
              </Button>
            )}
          </div>

          {history.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No education history recorded.</p>
          )}

          <div className="space-y-3">
            {history.map((h, i) => (
              editMode ? (
                <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="School Name"  value={h.school} onChange={(e) => updateHistory(i, 'school', e.target.value)} placeholder="School name" />
                    <Select label="Level" value={h.level} onChange={(e) => updateHistory(i, 'level', e.target.value)}>
                      <option value="">Select level…</option>
                      <option>Elementary</option>
                      <option>Junior High School</option>
                      <option>Senior High School</option>
                      <option>College</option>
                      <option>Vocational / Technical</option>
                    </Select>
                    <Input label="Years Attended"             value={h.years}  onChange={(e) => updateHistory(i, 'years',  e.target.value)} placeholder="e.g. 2019 – 2023" />
                    <Input label="Honors / Awards (optional)" value={h.honors} onChange={(e) => updateHistory(i, 'honors', e.target.value)} placeholder="e.g. With Honors" />
                  </div>

                  {/* Document upload */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-700">
                        Required Documents <span className="text-slate-400 font-normal">(PDF only)</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => addDocumentRow(i)}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Document
                      </button>
                    </div>

                    {h.documents.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No documents added yet.</p>
                    )}

                    <div className="space-y-2">
                      {h.documents.map((doc, di) => (
                        <div key={di} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                          {/* Title row */}
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-red-500" />
                            <input
                              type="text"
                              value={doc.title}
                              onChange={(e) => updateDocumentTitle(i, di, e.target.value)}
                              placeholder="Document title (e.g. Form 138, Diploma)"
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button
                              type="button"
                              onClick={() => removeDocument(i, di)}
                              className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {/* File row */}
                          {doc.file ? (
                            <div className="flex items-center gap-2 pl-6">
                              <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="flex-1 text-xs text-slate-600 truncate">{doc.file.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{(doc.file.size / 1024).toFixed(0)} KB</span>
                              <button
                                type="button"
                                onClick={() => setDocumentFile(i, di, null)}
                                className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer items-center gap-2 pl-6 text-xs text-blue-600 hover:text-blue-700 transition-colors">
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              <span>Attach PDF file</span>
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => setDocumentFile(i, di, e.target.files?.[0] ?? null)}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeHistoryRow(i)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                    <School className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{h.school || '—'}</p>
                    <p className="text-xs text-slate-500">{h.level || '—'}{h.years ? ` · ${h.years}` : ''}</p>
                    {h.honors && (
                      <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {h.honors}
                      </span>
                    )}
                    {h.documents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {h.documents.map((doc, di) => (
                          <div key={di} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
                            <span className="font-medium">{doc.title || 'Untitled document'}</span>
                            {doc.file && <span className="text-slate-400">· {doc.file.name}</span>}
                            {!doc.file && <span className="text-amber-500 italic">· no file attached</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        </Card>
      )}

      {/* ── Edit mode action bar ──────────────────────────────────────────── */}
      {editMode && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-5 py-3">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Edit mode active.</span> Unsaved changes will be lost if you navigate away.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} loading={saving} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* ── Assign Subjects Modal ─────────────────────────────────────────── */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title="Assign Subjects"
        description="Select subjects to assign for the current semester."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssignSave} loading={assignSaving} icon={<Check className="h-4 w-4" />}>
              Save Assignments
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {MOCK_OFFERINGS.filter((o) => o.status === 'PUBLISHED').map((offering) => {
            const isSelected = selected.includes(offering.id)
            return (
              <div
                key={offering.id}
                onClick={() => setSelected((prev) =>
                  isSelected ? prev.filter((id) => id !== offering.id) : [...prev, offering.id],
                )}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                  isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{offering.subject?.name}</p>
                  <p className="text-xs text-slate-500">
                    {offering.subject?.code} · {offering.subject?.units} units · Section {offering.section}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {offering.schedules?.map((s) => (
                    <p key={s.id}>{DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}</p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">{label}</p>
      <p className={`text-sm font-semibold text-slate-900 leading-tight ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function VerifiedTag() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1 py-px text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <Check className="h-2 w-2" /> Verified
    </span>
  )
}

function Row({ label, value, capitalize, verified }: { label: string; value: string; capitalize?: boolean; verified?: boolean }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-xs text-slate-400">{label}</dt>
      <dd className={`flex items-center gap-1.5 text-xs font-medium text-slate-800 ${capitalize ? 'capitalize' : ''}`}>
        {value}
        {verified && <VerifiedTag />}
      </dd>
    </div>
  )
}
