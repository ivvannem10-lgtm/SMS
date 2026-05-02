'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GradeBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { MOCK_ENROLLMENTS, MOCK_GRADES } from '@/lib/mock-data'
import { fullName, gradeToLetter } from '@/lib/utils'

export default function GradesPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.offeringId === offeringId)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
  }

  return (
    <div className="max-w-4xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Grade Book</h1>
          <p className="text-sm text-slate-500">{enrollments.length} students · Grade weights: Quiz 30% · Assignment 30% · Exam 40%</p>
        </div>
        <Button icon={<Save className="h-4 w-4" />} onClick={handleSave} loading={saving}>Save Grades</Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-violet-600 uppercase">Quiz Avg<br /><span className="font-normal normal-case">30%</span></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase">Assignment Avg<br /><span className="font-normal normal-case">30%</span></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-orange-600 uppercase">Midterm<br /><span className="font-normal normal-case">20%</span></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase">Final Exam<br /><span className="font-normal normal-case">20%</span></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Final Grade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((enrollment) => {
                const grade = MOCK_GRADES.find((g) => g.enrollmentId === enrollment.id)
                return (
                  <tr key={enrollment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={enrollment.student ? fullName(enrollment.student) : 'S'} size="xs" />
                        <div>
                          <p className="font-medium text-slate-900">{enrollment.student ? fullName(enrollment.student) : '—'}</p>
                          <p className="text-xs text-slate-400">{enrollment.student?.studentId}</p>
                        </div>
                      </div>
                    </td>
                    {[grade?.quizAverage, grade?.assignmentAverage, grade?.midtermGrade, grade?.finalExamGrade].map((val, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min="0" max="100" step="0.5"
                          defaultValue={val ?? ''}
                          placeholder="—"
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <div>
                        <p className={`text-lg font-bold ${grade?.finalGrade ? (grade.finalGrade >= 75 ? 'text-emerald-700' : 'text-red-600') : 'text-slate-300'}`}>
                          {grade?.finalGrade ?? '—'}
                        </p>
                        <p className="text-xs font-mono text-slate-500">{grade?.finalGrade ? gradeToLetter(grade.finalGrade) : ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GradeBadge status={grade?.status ?? 'IN_PROGRESS'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
