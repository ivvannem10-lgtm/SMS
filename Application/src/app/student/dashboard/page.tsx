'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Receipt, Bell, ArrowRight, Clock, GraduationCap } from 'lucide-react'
import { Card, SectionTitle, StatCard } from '@/components/ui/Card'
import { EnrollmentBadge, SOABadge, GradeBadge } from '@/components/ui/Badge'
import { ProcessFlow } from '@/components/shared/ProcessFlow'
import { MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_SOA, MOCK_NOTIFICATIONS, MOCK_GRADES } from '@/lib/mock-data'
import { fullName, formatDate, formatTime, DAY_ABBR, formatCurrency } from '@/lib/utils'

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.floor(eased * target))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setCount(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return count
}

const student = MOCK_STUDENTS[0]
const enrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === student.id)
const soa = MOCK_SOA.find((s) => s.studentId === student.id)
const unread = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length

export default function StudentDashboardPage() {
  const totalUnits = enrollments.reduce((s, e) => s + (e.offering?.subject?.units ?? 0), 0)
  const enrolledCount = useCountUp(enrollments.length)
  const unreadCount   = useCountUp(unread)

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionTitle description={`${student.program?.code} · ${student.yearLevel}${student.yearLevel === 1 ? 'st' : student.yearLevel === 2 ? 'nd' : student.yearLevel === 3 ? 'rd' : 'th'} Year`}>
        Welcome back, {student.firstName}! 👋
      </SectionTitle>

      {/* Pipeline status */}
      <div className="animate-slide-up" style={{ animationDelay: '40ms' }}>
        <Card>
          <p className="text-xs text-slate-400 mb-2 font-medium">Your Academic Journey</p>
          <ProcessFlow
            statuses={{ admissions: 'completed', registrar: 'completed', treasury: soa?.status === 'PAID' ? 'completed' : 'active', sis: 'completed', lms: 'active' }}
            sublabels={{ admissions: 'Accepted ✓', registrar: 'Enrolled ✓', treasury: soa?.status === 'PAID' ? 'Fully Paid ✓' : `₱${soa?.balance.toLocaleString()} balance`, sis: 'Active', lms: 'In Progress' }}
          />
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="animate-slide-up" style={{ animationDelay: '110ms' }}>
          <StatCard label="Enrolled Subjects" value={enrolledCount} sub={`${totalUnits} units total`} icon={BookOpen} color="bg-blue-50 text-blue-600" />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '180ms' }}>
          <StatCard label="SOA Balance" value={formatCurrency(soa?.balance ?? 0)} sub={soa?.status} icon={Receipt} color={soa?.balance === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <StatCard label="Student ID" value={student.studentId} icon={GraduationCap} color="bg-violet-50 text-violet-600" />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '320ms' }}>
          <StatCard label="Notifications" value={unreadCount} sub="unread" icon={Bell} color="bg-amber-50 text-amber-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Enrolled subjects */}
        <div className="animate-slide-up" style={{ animationDelay: '390ms' }}>
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold">Enrolled Subjects</h3>
            <Link href="/student/subjects" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {enrollments.map((e) => {
              const grade = MOCK_GRADES.find((g) => g.enrollmentId === e.id)
              return (
                <Link key={e.id} href={`/student/subjects/${e.offeringId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 shrink-0">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{e.offering?.subject?.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      {e.offering?.schedules?.slice(0, 1).map((s) => (
                        <span key={s.id} className="text-xs text-slate-400">{DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    {grade?.finalGrade ? (
                      <div>
                        <p className={`text-sm font-bold ${grade.finalGrade >= 75 ? 'text-emerald-700' : 'text-red-600'}`}>{grade.finalGrade}%</p>
                        <GradeBadge status={grade.status} />
                      </div>
                    ) : (
                      <EnrollmentBadge status={e.status} />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
        </div>

        {/* SOA summary + notifications */}
        <div className="animate-slide-up space-y-4" style={{ animationDelay: '460ms' }}>
          {/* SOA */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Statement of Account</h3>
              <Link href="/student/soa" className="text-xs font-medium text-blue-600 hover:text-blue-700">Full SOA</Link>
            </div>
            {soa ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center rounded-lg bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(soa.totalAmount)}</p>
                  </div>
                  <div className="text-center rounded-lg bg-emerald-50 p-2">
                    <p className="text-xs text-emerald-600">Paid</p>
                    <p className="text-sm font-bold text-emerald-700">{formatCurrency(soa.paidAmount)}</p>
                  </div>
                  <div className={`text-center rounded-lg p-2 ${soa.balance > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${soa.balance > 0 ? 'text-red-500' : 'text-slate-500'}`}>Balance</p>
                    <p className={`text-sm font-bold ${soa.balance > 0 ? 'text-red-700' : 'text-slate-700'}`}>{formatCurrency(soa.balance)}</p>
                  </div>
                </div>
                <SOABadge status={soa.status} />
              </>
            ) : <p className="text-sm text-slate-400">No SOA for this semester.</p>}
          </Card>

          {/* Notifications */}
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <Link href="/student/notifications" className="text-xs text-blue-600 font-medium">See all</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {MOCK_NOTIFICATIONS.slice(0, 3).map((notif) => (
                <div key={notif.id} className={`flex items-start gap-3 px-5 py-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  <div>
                    <p className="text-xs font-medium text-slate-900">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(notif.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
