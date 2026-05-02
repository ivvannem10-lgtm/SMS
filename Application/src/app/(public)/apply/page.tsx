'use client'
import { useState } from 'react'
import { School, CheckCircle2, ChevronRight, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { MOCK_PROGRAMS, MOCK_APPLICANTS } from '@/lib/mock-data'
import { generateReferenceNumber } from '@/lib/utils'
import type { Applicant } from '@/types'

type Step = 1 | 2 | 3 | 4

const STEP_LABELS = ['Personal Info', 'Family Background', 'Previous Education', 'Requirements']

export default function ApplyPage() {
  const [step, setStep] = useState<Step>(1)
  const [submitted, setSubmitted] = useState(false)
  const [refNo, setRefNo] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '', email: '', phone: '',
    dateOfBirth: '', gender: '', address: '', programId: '', applicantType: 'FRESHMAN',
    fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '',
    guardianName: '', guardianRelation: '', guardianPhone: '', monthlyIncome: '', livingWith: '',
    prevSchool: '', prevLevel: 'SENIOR_HIGH', prevYearFrom: '', prevYearTo: '', prevHonors: '',
  })

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    const ref   = generateReferenceNumber()
    const appId = `app_pub_${Date.now()}`
    const prog  = MOCK_PROGRAMS.find((p) => p.id === form.programId)

    const newApp: Applicant = {
      id:              appId,
      referenceNumber: ref,
      firstName:       form.firstName.trim(),
      lastName:        form.lastName.trim(),
      middleName:      form.middleName.trim() || undefined,
      email:           form.email.trim(),
      phone:           form.phone.trim() || undefined,
      dateOfBirth:     form.dateOfBirth || undefined,
      gender:          form.gender || undefined,
      address:         form.address.trim() || undefined,
      programId:       form.programId || undefined,
      program:         prog ? { id: prog.id, name: prog.name, code: prog.code, department: (prog as { department?: string }).department, schoolId: prog.schoolId } : undefined,
      applicantType:   form.applicantType as Applicant['applicantType'],
      status:          'PENDING',
      schoolId:        'school_1',
      familyBackground: (form.fatherName || form.motherName || form.guardianName) ? {
        id: `fb_${appId}`, applicantId: appId,
        fatherName:      form.fatherName || undefined,
        fatherOccupation:form.fatherOccupation || undefined,
        motherName:      form.motherName || undefined,
        motherOccupation:form.motherOccupation || undefined,
        guardianName:    form.guardianName || undefined,
        guardianRelation:form.guardianRelation || undefined,
        guardianPhone:   form.guardianPhone || undefined,
        monthlyIncome:   form.monthlyIncome || undefined,
        livingWith:      form.livingWith || undefined,
      } : undefined,
      previousEducations: form.prevSchool.trim() ? [{
        id: `edu_${appId}`, applicantId: appId,
        schoolName: form.prevSchool.trim(),
        level:      form.prevLevel,
        yearFrom:   Number(form.prevYearFrom) || new Date().getFullYear() - 4,
        yearTo:     form.prevYearTo ? Number(form.prevYearTo) : undefined,
        honors:     form.prevHonors.trim() || undefined,
      }] : [],
      documents:  [],
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    }

    MOCK_APPLICANTS.push(newApp)

    // Persist to sessionStorage so the data survives the login page redirect
    try {
      const existing: Applicant[] = JSON.parse(sessionStorage.getItem('sis_pending_applicants') ?? '[]')
      existing.push(newApp)
      sessionStorage.setItem('sis_pending_applicants', JSON.stringify(existing))
    } catch { /* sessionStorage unavailable */ }

    setRefNo(ref)
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h1>
          <p className="text-slate-600 mb-6">Your application has been received. Keep your reference number for tracking.</p>
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
            <p className="text-xs text-slate-500 mb-1">Reference Number</p>
            <p className="text-xl font-mono font-bold text-blue-600">{refNo}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-800 mb-6">
            <p className="font-semibold mb-1">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Wait for email confirmation (1-3 business days)</li>
              <li>Submit original documents to the Admissions Office</li>
              <li>Take the entrance examination (schedule will be sent)</li>
              <li>Wait for acceptance decision</li>
            </ol>
          </div>
          <a href="/login" className="text-sm text-blue-600 hover:underline">Back to Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-md">
            <School className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">St. Dominic College</h1>
            <p className="text-xs text-violet-600 font-medium">Online Application Form · AY 2024-2025</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as Step
            const done = step > s
            const active = step === s
            return (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {done ? '✓' : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Personal */}
        {step === 1 && (
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-5">Personal Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First Name *" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Juan" required />
              <Input label="Last Name *" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Dela Cruz" required />
              <Input label="Middle Name" value={form.middleName} onChange={(e) => update('middleName', e.target.value)} placeholder="Optional" />
              <Input label="Email Address *" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="juan@email.com" required />
              <Input label="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="09XX-XXX-XXXX" />
              <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
              <Select label="Gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / Prefer not to say</option>
              </Select>
              <Select label="Applicant Type *" value={form.applicantType} onChange={(e) => update('applicantType', e.target.value)}>
                <option value="FRESHMAN">Freshman</option>
                <option value="TRANSFEREE">Transferee</option>
                <option value="RETURNEE">Returnee</option>
              </Select>
              <div className="sm:col-span-2">
                <Select label="Program Applying For *" value={form.programId} onChange={(e) => update('programId', e.target.value)}>
                  <option value="">Select program...</option>
                  {MOCK_PROGRAMS.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Textarea label="Home Address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Complete home address" />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => setStep(2)}>Next: Family Background <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {/* Step 2: Family */}
        {step === 2 && (
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-5">Family Background</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Father's Name" value={form.fatherName} onChange={(e) => update('fatherName', e.target.value)} />
              <Input label="Father's Occupation" value={form.fatherOccupation} onChange={(e) => update('fatherOccupation', e.target.value)} />
              <Input label="Mother's Name" value={form.motherName} onChange={(e) => update('motherName', e.target.value)} />
              <Input label="Mother's Occupation" value={form.motherOccupation} onChange={(e) => update('motherOccupation', e.target.value)} />
              <div className="sm:col-span-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Guardian (if different from parents)</p>
              </div>
              <Input label="Guardian's Name" value={form.guardianName} onChange={(e) => update('guardianName', e.target.value)} />
              <Select label="Relationship" value={form.guardianRelation} onChange={(e) => update('guardianRelation', e.target.value)}>
                <option value="">Select...</option>
                <option>Mother</option><option>Father</option><option>Grandparent</option><option>Sibling</option><option>Relative</option><option>Other</option>
              </Select>
              <Input label="Guardian's Phone" value={form.guardianPhone} onChange={(e) => update('guardianPhone', e.target.value)} />
              <Select label="Monthly Family Income" value={form.monthlyIncome} onChange={(e) => update('monthlyIncome', e.target.value)}>
                <option value="">Select range...</option>
                <option>Below ₱10,000</option><option>₱10,000–₱20,000</option><option>₱20,000–₱30,000</option><option>₱30,000–₱50,000</option><option>₱50,000–₱75,000</option><option>Above ₱75,000</option>
              </Select>
              <Select label="Living With" value={form.livingWith} onChange={(e) => update('livingWith', e.target.value)}>
                <option value="">Select...</option>
                <option>Both Parents</option><option>Mother only</option><option>Father only</option><option>Guardian</option><option>Relatives</option><option>Alone</option>
              </Select>
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next: Education History <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {/* Step 3: Previous Education */}
        {step === 3 && (
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-5">Previous Education</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="School Name *" value={form.prevSchool} onChange={(e) => update('prevSchool', e.target.value)} placeholder="Name of last school attended" required />
              </div>
              <Select label="Level" value={form.prevLevel} onChange={(e) => update('prevLevel', e.target.value)}>
                <option value="ELEMENTARY">Elementary</option>
                <option value="HIGH_SCHOOL">High School</option>
                <option value="SENIOR_HIGH">Senior High School</option>
                <option value="COLLEGE">College</option>
              </Select>
              <Input label="Honors / Awards" value={form.prevHonors} onChange={(e) => update('prevHonors', e.target.value)} placeholder="e.g., With Honors, Valedictorian" />
              <Input label="Year Started" type="number" value={form.prevYearFrom} onChange={(e) => update('prevYearFrom', e.target.value)} placeholder="2018" />
              <Input label="Year Graduated / Last Attended" type="number" value={form.prevYearTo} onChange={(e) => update('prevYearTo', e.target.value)} placeholder="2022" />
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next: Requirements <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </Card>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Document Requirements</h2>
            <p className="text-sm text-slate-500 mb-5">Upload digital copies of your documents. Original documents must be presented upon admission.</p>
            <div className="space-y-3">
              {[
                { id: 'form137', label: 'Form 137 / Transcript of Records', required: true },
                { id: 'birth_cert', label: 'PSA Birth Certificate', required: true },
                { id: 'good_moral', label: 'Certificate of Good Moral Character', required: true },
                { id: 'id_photo', label: '2x2 ID Picture (white background)', required: true },
                { id: 'transferee_docs', label: 'Honorable Dismissal (Transferees only)', required: false },
              ].map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                    <p className="text-xs text-slate-400">{doc.required ? 'Required' : 'Optional'}</p>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    <Upload className="h-3 w-3" /> Upload
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-semibold">Before submitting:</p>
              <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                <li>Verify all personal information is accurate</li>
                <li>Ensure all required documents are uploaded</li>
                <li>Your reference number will be emailed to you</li>
              </ul>
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} loading={loading} variant="success">Submit Application</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
