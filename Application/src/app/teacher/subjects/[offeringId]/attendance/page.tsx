'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, Save } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { MOCK_OFFERINGS, MOCK_ENROLLMENTS, MOCK_STUDENTS, MOCK_LMS_ATTENDANCE } from '@/lib/mock-data'
import type { AttendanceStatus } from '@/types'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string; btn: string }> = {
  PRESENT: { label: 'Present', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-300', btn: 'bg-emerald-500 text-white' },
  LATE:    { label: 'Late',    icon: Clock,         color: 'bg-amber-100 text-amber-700 border-amber-300',      btn: 'bg-amber-400 text-white' },
  ABSENT:  { label: 'Absent',  icon: XCircle,       color: 'bg-red-100 text-red-700 border-red-300',            btn: 'bg-red-500 text-white' },
  EXCUSED: { label: 'Excused', icon: AlertCircle,   color: 'bg-blue-100 text-blue-700 border-blue-300',         btn: 'bg-blue-500 text-white' },
}
const STATUSES = Object.keys(STATUS_CONFIG) as AttendanceStatus[]

export default function AttendancePage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const offering = MOCK_OFFERINGS.find(o => o.id === offeringId)
  const enrollments = MOCK_ENROLLMENTS.filter(e => e.offeringId === offeringId && e.status !== 'DROPPED')
  const students = enrollments.map(e => MOCK_STUDENTS.find(s => s.id === e.studentId)).filter((s): s is typeof MOCK_STUDENTS[0] => s !== undefined)

  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [tab, setTab] = useState<'record' | 'history'>('record')
  const [saved, setSaved] = useState(false)

  const attendanceForDate = useMemo(
    () => MOCK_LMS_ATTENDANCE.filter(a => a.offeringId === offeringId && a.date === selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offeringId, selectedDate]
  )

  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(() => {
    const m: Record<string, AttendanceStatus> = {}
    attendanceForDate.forEach(a => { m[a.studentId] = a.status })
    students.forEach(s => { if (!m[s.id]) m[s.id] = 'PRESENT' })
    return m
  })

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatusMap(prev => ({ ...prev, [studentId]: status }))
    setSaved(false)
  }

  function saveAttendance() {
    students.forEach(s => {
      const existing = MOCK_LMS_ATTENDANCE.find(a => a.offeringId === offeringId && a.date === selectedDate && a.studentId === s.id)
      if (existing) {
        existing.status = statusMap[s.id] ?? 'PRESENT'
      } else {
        MOCK_LMS_ATTENDANCE.push({
          id: `att_${Date.now()}_${s.id}`,
          offeringId,
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          date: selectedDate,
          status: statusMap[s.id] ?? 'PRESENT',
        })
      }
    })
    setSaved(true)
  }

  // History: all attendance records for this offering
  const allDates = [...new Set(MOCK_LMS_ATTENDANCE.filter(a => a.offeringId === offeringId).map(a => a.date))].sort().reverse()

  return (
    <div className="max-w-4xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>
      <SectionTitle description={`${offering?.subject?.name} — ${offering?.section}`}>Attendance</SectionTitle>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {([['record', 'Record Attendance'], ['history', 'Attendance History']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'record' && (
        <div className="space-y-4">
          {/* Date picker */}
          <Card>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm font-semibold text-slate-600 shrink-0">Session Date:</label>
              <input type="date" value={selectedDate} max={today}
                onChange={e => { setSelectedDate(e.target.value); setSaved(false) }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map(s => (
                  <span key={s} className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[s].color}`}>
                    {s[0]}: {Object.values(statusMap).filter(v => v === s).length}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Student list */}
          <Card padding="none">
            <div className="divide-y divide-slate-100">
              {students.map((s, i) => {
                const current = statusMap[s.id] ?? 'PRESENT'
                const cfg = STATUS_CONFIG[current]
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-slate-400 w-6 text-right shrink-0">{i + 1}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{s.firstName} {s.lastName}</p>
                      <p className="text-[11px] text-slate-400">{s.studentId}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {STATUSES.map(st => {
                        const c = STATUS_CONFIG[st]
                        return (
                          <button key={st} onClick={() => setStatus(s.id, st)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold border transition-all ${current === st ? `${cfg.btn} border-transparent shadow-sm` : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {students.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">No enrolled students found.</div>
              )}
            </div>
          </Card>

          <div className="flex items-center gap-3 justify-end">
            {saved && <span className="text-xs text-emerald-600 font-semibold">Saved successfully</span>}
            <button onClick={saveAttendance} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
              <Save className="h-4 w-4" /> Save Attendance
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <Card padding="none">
          {allDates.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No attendance records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-700 uppercase tracking-widest">Student</th>
                    {allDates.map(d => (
                      <th key={d} className="px-3 py-3 text-center text-xs font-bold text-brand-700 uppercase">
                        {new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-bold text-brand-700 uppercase tracking-widest">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => {
                    const sRecords = MOCK_LMS_ATTENDANCE.filter(a => a.offeringId === offeringId && a.studentId === s.id)
                    const presentLate = sRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
                    const rate = sRecords.length > 0 ? Math.round((presentLate / sRecords.length) * 100) : 100
                    return (
                      <tr key={s.id} className="hover:bg-brand-50/30">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{s.firstName} {s.lastName}</p>
                          <p className="text-[11px] text-slate-400">{s.studentId}</p>
                        </td>
                        {allDates.map(d => {
                          const rec = sRecords.find(a => a.date === d)
                          const st = rec?.status
                          const dot = !st ? 'bg-slate-200' : st === 'PRESENT' ? 'bg-emerald-500' : st === 'LATE' ? 'bg-amber-400' : st === 'EXCUSED' ? 'bg-blue-400' : 'bg-red-500'
                          return (
                            <td key={d} className="px-3 py-3 text-center">
                              <div className="flex justify-center" title={st ?? 'No record'}>
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
                              </div>
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${rate >= 90 ? 'text-emerald-600' : rate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
