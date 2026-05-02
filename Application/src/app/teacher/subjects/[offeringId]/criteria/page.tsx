'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MOCK_GRADE_CRITERIA, MOCK_OFFERINGS } from '@/lib/mock-data'
import type { GradeCriteria } from '@/types'

const DEFAULT_CRITERIA = { quizWeight: 30, assignmentWeight: 30, examWeight: 40, passingGrade: 60 }

function weightBar({ quiz, assignment, exam }: { quiz: number; assignment: number; exam: number }) {
  return (
    <div className="h-3 w-full rounded-full overflow-hidden flex">
      <div className="bg-violet-400 transition-all" style={{ width: `${quiz}%` }} title={`Quiz ${quiz}%`} />
      <div className="bg-blue-400 transition-all" style={{ width: `${assignment}%` }} title={`Assignment ${assignment}%`} />
      <div className="bg-orange-400 transition-all" style={{ width: `${exam}%` }} title={`Exam ${exam}%`} />
    </div>
  )
}

export default function CriteriaPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const offering = MOCK_OFFERINGS.find((o) => o.id === offeringId)

  const existing = MOCK_GRADE_CRITERIA.find((c) => c.offeringId === offeringId)
  const [form, setForm] = useState({
    quizWeight:        existing?.quizWeight        ?? DEFAULT_CRITERIA.quizWeight,
    assignmentWeight:  existing?.assignmentWeight  ?? DEFAULT_CRITERIA.assignmentWeight,
    examWeight:        existing?.examWeight        ?? DEFAULT_CRITERIA.examWeight,
    passingGrade:      existing?.passingGrade      ?? DEFAULT_CRITERIA.passingGrade,
  })
  const [saved,  setSaved]  = useState(false)
  const [saving, setSaving] = useState(false)

  const total = form.quizWeight + form.assignmentWeight + form.examWeight
  const valid = total === 100 && form.passingGrade >= 50 && form.passingGrade <= 100

  function setWeight(key: keyof typeof form, raw: string) {
    const val = Math.max(0, Math.min(100, parseInt(raw) || 0))
    setForm((p) => ({ ...p, [key]: val }))
    setSaved(false)
  }

  async function handleSave() {
    if (!valid) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    const criteria: GradeCriteria = {
      id: existing?.id ?? `crit_${Date.now()}`,
      offeringId,
      quizWeight:       form.quizWeight,
      assignmentWeight: form.assignmentWeight,
      examWeight:       form.examWeight,
      passingGrade:     form.passingGrade,
    }
    const idx = MOCK_GRADE_CRITERIA.findIndex((c) => c.offeringId === offeringId)
    if (idx >= 0) MOCK_GRADE_CRITERIA[idx] = criteria
    else MOCK_GRADE_CRITERIA.push(criteria)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Grading Criteria</h1>
          <p className="text-sm text-slate-500 mt-0.5">{offering?.subject?.name} — {offering?.subject?.code} · Section {offering?.section}</p>
        </div>
        <Button icon={<Save className="h-4 w-4" />} onClick={handleSave} loading={saving} disabled={!valid}>
          {saved ? 'Saved!' : 'Save Criteria'}
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Settings className="h-4 w-4 text-brand-500" />
          <h2 className="text-sm font-bold text-slate-900">Grade Weight Distribution</h2>
          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${total === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            Total: {total}% {total === 100 ? '✓' : '(must equal 100%)'}
          </span>
        </div>

        {/* Weight bar */}
        <div className="mb-4">
          {weightBar({ quiz: form.quizWeight, assignment: form.assignmentWeight, exam: form.examWeight })}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400 inline-block" /> Quiz</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400 inline-block" /> Assignment</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-orange-400 inline-block" /> Exam</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'quizWeight'       as const, label: 'Quiz Average Weight',       color: 'text-violet-600', desc: 'Average of all quiz scores' },
            { key: 'assignmentWeight' as const, label: 'Assignment Average Weight', color: 'text-blue-600',   desc: 'Average of all assignment grades' },
            { key: 'examWeight'       as const, label: 'Exam Weight',               color: 'text-orange-600', desc: 'Midterm + Final exam (split equally)' },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4">
              <div className="flex-1">
                <p className={`text-sm font-semibold ${item.color}`}>{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={form[item.key]}
                  onChange={(e) => setWeight(item.key, e.target.value)}
                  className="w-28 accent-brand-500"
                />
                <div className="relative">
                  <input
                    type="number"
                    min={0} max={100}
                    value={form[item.key]}
                    onChange={(e) => setWeight(item.key, e.target.value)}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-bold text-slate-900 mb-4">Passing Grade Threshold</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-600">Minimum final grade to pass the course</p>
            <p className="text-xs text-slate-400 mt-0.5">Students below this grade will receive FAILED status</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="range"
              min={50} max={80} step={1}
              value={form.passingGrade}
              onChange={(e) => setWeight('passingGrade', e.target.value)}
              className="w-28 accent-emerald-500"
            />
            <div className="relative">
              <input
                type="number"
                min={50} max={100}
                value={form.passingGrade}
                onChange={(e) => setWeight('passingGrade', e.target.value)}
                className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grade formula preview */}
      <Card>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Grade Formula Preview</h2>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 font-mono text-sm text-slate-700 leading-relaxed">
          <p>Final Grade =</p>
          <p className="pl-4 text-violet-700">  (Quiz Average × {form.quizWeight}%)</p>
          <p className="pl-4 text-blue-700">+ (Assignment Average × {form.assignmentWeight}%)</p>
          <p className="pl-4 text-orange-700">+ (Exam Score × {form.examWeight}%)</p>
          <div className="mt-2 border-t border-slate-200 pt-2 text-emerald-700">
            Pass if Final Grade ≥ {form.passingGrade}%
          </div>
        </div>
        {total !== 100 && (
          <p className="mt-2 text-xs font-medium text-red-500">Weights must sum to exactly 100% before you can save.</p>
        )}
      </Card>
    </div>
  )
}
