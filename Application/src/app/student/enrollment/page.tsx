'use client'
import { useState } from 'react'
import { Check, AlertCircle, BookOpen } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MOCK_OFFERINGS, MOCK_ENROLLMENTS, MOCK_STUDENTS, MOCK_SEMESTERS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR, formatCurrency } from '@/lib/utils'
import { fullName } from '@/lib/utils'

const student = MOCK_STUDENTS[0]
const activeSemester = MOCK_SEMESTERS.find((s) => s.isActive)
const currentEnrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === student.id)

const FEE_PER_UNIT = 1500
const MISC_FEE = 2500

export default function EnrollmentPage() {
  const [selected, setSelected] = useState<string[]>(currentEnrollments.map((e) => e.offeringId))
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select')

  const publishedOfferings = MOCK_OFFERINGS.filter((o) => o.status === 'PUBLISHED')
  const selectedOfferings = publishedOfferings.filter((o) => selected.includes(o.id))
  const totalUnits = selectedOfferings.reduce((s, o) => s + (o.subject?.units ?? 0), 0)
  const tuitionFee = totalUnits * FEE_PER_UNIT
  const totalFee = tuitionFee + MISC_FEE
  const maxUnits = activeSemester?.maxUnits ?? 24
  const overLimit = totalUnits > maxUnits

  function toggle(offeringId: string) {
    setSelected((prev) => prev.includes(offeringId) ? prev.filter((id) => id !== offeringId) : [...prev, offeringId])
  }

  if (step === 'done') {
    return (
      <div className="max-w-2xl">
        <SectionTitle>Enrollment</SectionTitle>
        <Card className="text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Pre-Enrollment Submitted!</h2>
          <p className="text-sm text-slate-500 mb-4">Please proceed to the Treasury to settle your payment.</p>
          <div className="inline-block bg-slate-50 rounded-xl px-6 py-3 text-left">
            <p className="text-xs text-slate-500">Pre-Enrollment SOA</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalFee)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{totalUnits} units · {selectedOfferings.length} subjects</p>
          </div>
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded-lg px-4 py-2 inline-block">
            ⚠ Enrollment is PENDING until payment is validated by Treasury
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-5">
      <SectionTitle description={`${activeSemester?.name} · Max ${maxUnits} units per semester`}>
        Subject Enrollment
      </SectionTitle>

      {step === 'select' && (
        <>
          {overLimit && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">You've exceeded the maximum of {maxUnits} units. Please deselect some subjects.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              {publishedOfferings.map((offering) => {
                const isSelected = selected.includes(offering.id)
                const alreadyEnrolled = currentEnrollments.some((e) => e.offeringId === offering.id && e.status === 'ENROLLED')
                return (
                  <div
                    key={offering.id}
                    onClick={() => !alreadyEnrolled && toggle(offering.id)}
                    className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${alreadyEnrolled ? 'border-emerald-200 bg-emerald-50 cursor-default' : isSelected ? 'border-blue-400 bg-blue-50 cursor-pointer' : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'}`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-0.5 transition-all ${alreadyEnrolled ? 'border-emerald-600 bg-emerald-600' : isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                      {(isSelected || alreadyEnrolled) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{offering.subject?.name}</p>
                          <p className="text-xs text-slate-500">{offering.subject?.code} · {offering.subject?.units} units · Section {offering.section}</p>
                        </div>
                        {alreadyEnrolled && <span className="text-xs font-semibold text-emerald-700">Enrolled ✓</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {offering.schedules?.map((s) => (
                          <span key={s.id} className="inline-flex rounded-md bg-white/80 px-2 py-0.5 text-xs text-slate-600 border border-slate-200">
                            {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}{s.room ? ` · ${s.room.name}` : ''}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                        <span>Teacher: {offering.assignments?.[0]?.faculty ? fullName(offering.assignments[0].faculty) : 'TBA'}</span>
                        <span>·</span>
                        <span>{offering._count?.enrollments}/{offering.maxStudents} slots</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency((offering.subject?.units ?? 0) * FEE_PER_UNIT)}</p>
                      <p className="text-xs text-slate-400">{offering.subject?.units} units</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-6 space-y-3 self-start">
              <Card>
                <h3 className="text-sm font-semibold mb-3">Enrollment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subjects</span>
                    <span className="font-medium">{selectedOfferings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Units</span>
                    <span className={`font-medium ${overLimit ? 'text-red-600' : ''}`}>{totalUnits} / {maxUnits}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Tuition ({totalUnits} × ₱1,500)</span>
                      <span>{formatCurrency(tuitionFee)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Miscellaneous</span>
                      <span>{formatCurrency(MISC_FEE)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-blue-700">{formatCurrency(totalFee)}</span>
                  </div>
                </div>
                <Button className="w-full justify-center mt-4" disabled={overLimit || selectedOfferings.length === 0} onClick={() => setStep('confirm')}>
                  Pre-Enroll Now
                </Button>
              </Card>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Unit limit: max {maxUnits} units/semester</li>
                  <li>Prerequisites are enforced</li>
                  <li>Payment required for official enrollment</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {step === 'confirm' && (
        <div className="max-w-lg space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Confirm Pre-Enrollment</h3>
            <div className="space-y-2">
              {selectedOfferings.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{o.subject?.name}</span>
                  <span className="text-slate-500">{o.subject?.units} units</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between font-bold">
              <span>Total Due</span>
              <span className="text-blue-700">{formatCurrency(totalFee)}</span>
            </div>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
            <Button className="flex-1 justify-center" onClick={() => setStep('done')}>Confirm Pre-Enrollment</Button>
          </div>
        </div>
      )}
    </div>
  )
}
