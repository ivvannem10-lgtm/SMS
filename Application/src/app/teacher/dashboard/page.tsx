'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Users, ClipboardList, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { MOCK_OFFERINGS, MOCK_FACULTY, MOCK_ENROLLMENTS, MOCK_SEMESTERS } from '@/lib/mock-data'
import { fullName, formatTime, DAY_ABBR } from '@/lib/utils'

const myFaculty  = MOCK_FACULTY[0]
const activeSem  = MOCK_SEMESTERS.find((s) => s.isActive)
const myOfferings = MOCK_OFFERINGS.filter(
  (o) => o.status === 'PUBLISHED'
    && o.semesterId === activeSem?.id
    && o.assignments?.some((a) => a.facultyId === myFaculty.id),
)

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

type ModalKey = 'subjects' | 'students' | 'grading' | null

export default function TeacherDashboardPage() {
  const [modal, setModal] = useState<ModalKey>(null)

  const totalStudents = myOfferings.reduce((s, o) => s + (o._count?.enrollments ?? 0), 0)

  // Students enrolled in my offerings (unique)
  const myStudentIds = new Set(
    MOCK_ENROLLMENTS
      .filter((e) => myOfferings.some((o) => o.id === e.offeringId) && e.status === 'ENROLLED')
      .map((e) => e.studentId),
  )
  const myEnrollments = MOCK_ENROLLMENTS.filter(
    (e) => myOfferings.some((o) => o.id === e.offeringId) && e.status === 'ENROLLED',
  )

  const hasPublished = myOfferings.length > 0

  const subjectsCount  = useCountUp(myOfferings.length)
  const studentsCount  = useCountUp(totalStudents)
  const gradingCount   = useCountUp(3)

  const stats = [
    {
      key:   'subjects' as ModalKey,
      label: 'My Subjects',
      value: myOfferings.length,
      icon:  BookOpen,
      color: 'bg-brand-50 text-brand-600',
      sub:   activeSem?.name ?? 'Current semester',
    },
    {
      key:   'students' as ModalKey,
      label: 'Total Students',
      value: totalStudents,
      icon:  Users,
      color: 'bg-blue-50 text-blue-600',
      sub:   `Across ${myOfferings.length} section${myOfferings.length !== 1 ? 's' : ''}`,
    },
    {
      key:   'grading' as ModalKey,
      label: 'Pending Grading',
      value: 3,
      icon:  ClipboardList,
      color: 'bg-amber-50 text-amber-600',
      sub:   'Submissions awaiting',
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <SectionTitle description={`Welcome back, ${myFaculty.position ?? 'Prof.'} ${myFaculty.lastName}`}>
        Faculty Dashboard
      </SectionTitle>

      {/* ── Clickable stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => {
          const animatedValue = s.key === 'subjects' ? subjectsCount : s.key === 'students' ? studentsCount : gradingCount
          return (
            <button
              key={s.key}
              onClick={() => setModal(s.key)}
              className="animate-slide-up text-left w-full rounded-xl border border-[#e4ebf5] bg-white p-4 shadow-card
                hover:shadow-card-md hover:border-brand-200 hover:-translate-y-0.5
                transition-all duration-150 cursor-pointer"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color} mb-3`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{animatedValue}</p>
              <p className="text-xs font-medium text-slate-700 mt-1">{s.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.sub}</p>
            </button>
          )
        })}
      </div>

      {/* ── Schedule reminder banner ──────────────────────────────────────── */}
      {hasPublished && (
        <div className="animate-slide-up flex items-center justify-between rounded-xl bg-brand-50 border border-brand-200 px-5 py-3.5" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-900">Set your room schedule</p>
              <p className="text-xs text-brand-600 mt-0.5">
                {myOfferings.filter((o) => !o.schedules?.length).length > 0
                  ? `${myOfferings.filter((o) => !o.schedules?.length).length} offering(s) still need a schedule.`
                  : 'All your offerings have schedules set.'}
              </p>
            </div>
          </div>
          <Link href="/teacher/schedule">
            <Button size="sm" variant="soft">Manage Schedule <ArrowRight className="h-3 w-3" /></Button>
          </Link>
        </div>
      )}

      {/* ── My subjects list ─────────────────────────────────────────────── */}
      <div className="animate-slide-up space-y-3" style={{ animationDelay: '340ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">My Subjects This Semester</h2>
          <Link href="/teacher/subjects" className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {myOfferings.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-slate-400 py-8">No published subjects assigned to you this semester.</p>
          </Card>
        ) : (
          myOfferings.map((offering) => (
            <Link key={offering.id} href={`/teacher/subjects/${offering.id}`}>
              <Card hover className="cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 shrink-0">
                    <BookOpen className="h-6 w-6 text-brand-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {offering.subject?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {offering.subject?.code} · Section {offering.section} · {offering.subject?.units} units
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {offering.schedules?.length ? offering.schedules.map((s) => (
                        <span key={s.id} className="inline-flex rounded-md bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 text-xs">
                          {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                          {s.room ? ` · ${s.room.name}` : ''}
                        </span>
                      )) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          No schedule set
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-slate-900">{offering._count?.enrollments}</p>
                    <p className="text-xs text-slate-400">students</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* ── Modal: My Subjects ───────────────────────────────────────────── */}
      <Modal open={modal === 'subjects'} onClose={() => setModal(null)} title="My Subjects" description={activeSem?.name} size="md"
        footer={<Button variant="outline" onClick={() => setModal(null)}>Close</Button>}
      >
        <div className="space-y-3">
          {myOfferings.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No subjects assigned this semester.</p>
          ) : myOfferings.map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-xl border border-[#e4ebf5] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                <BookOpen className="h-4 w-4 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{o.subject?.name}</p>
                <p className="text-xs text-slate-500">{o.subject?.code} · Section {o.section} · {o.subject?.units} units</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{o._count?.enrollments}</p>
                <p className="text-2xs text-slate-400">students</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Modal: Total Students ─────────────────────────────────────────── */}
      <Modal open={modal === 'students'} onClose={() => setModal(null)} title="Enrolled Students" description={`All sections · ${totalStudents} total`} size="lg"
        footer={<Button variant="outline" onClick={() => setModal(null)}>Close</Button>}
      >
        <div className="space-y-1">
          {myOfferings.map((offering) => {
            const offeringEnrs = myEnrollments.filter((e) => e.offeringId === offering.id)
            if (!offeringEnrs.length) return null
            return (
              <div key={offering.id} className="mb-4">
                <p className="text-xs font-bold text-brand-700 uppercase tracking-wide mb-2">
                  {offering.subject?.code} · Section {offering.section}
                </p>
                <div className="divide-y divide-[#f0f4fa]">
                  {offeringEnrs.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 py-2">
                      <Avatar name={e.student ? fullName(e.student) : 'Student'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {e.student ? fullName(e.student) : e.studentId}
                        </p>
                        <p className="text-xs text-slate-400">{e.student?.studentId}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Enrolled</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {myEnrollments.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No enrolled students found.</p>
          )}
        </div>
      </Modal>

      {/* ── Modal: Pending Grading ───────────────────────────────────────── */}
      <Modal open={modal === 'grading'} onClose={() => setModal(null)} title="Pending Grading" description="Submissions awaiting your review" size="md"
        footer={<Button variant="outline" onClick={() => setModal(null)}>Close</Button>}
      >
        <div className="space-y-3">
          {[
            { subject: 'CS101 · Introduction to Computing', type: 'Quiz 2',       students: 35, due: 'Aug 20, 2024' },
            { subject: 'CS102 · Computer Programming 1',   type: 'Lab Activity 3',students: 28, due: 'Aug 22, 2024' },
            { subject: 'CS101 · Introduction to Computing', type: 'Assignment 1', students: 35, due: 'Aug 24, 2024' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-[#e4ebf5] p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0">
                <ClipboardList className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.subject}</p>
                <p className="text-xs text-slate-400 mt-1">{item.students} submissions · Due {item.due}</p>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                Pending
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
