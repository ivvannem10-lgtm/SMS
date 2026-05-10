'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Star, Lock, Search, ChevronDown, ChevronUp, LayoutGrid, List, BookOpen, MapPin, Clock, User } from 'lucide-react'
import { SectionTitle } from '@/components/ui/Card'
import { MOCK_ENROLLMENTS, MOCK_STUDENTS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR } from '@/lib/utils'

const student = MOCK_STUDENTS[0]

const BANNER_COLORS = [
  { bg: 'from-brand-700 to-brand-500',     text: 'text-brand-200/30' },
  { bg: 'from-violet-700 to-violet-500',   text: 'text-violet-200/30' },
  { bg: 'from-emerald-700 to-emerald-500', text: 'text-emerald-200/30' },
  { bg: 'from-orange-600 to-orange-400',   text: 'text-orange-200/30' },
  { bg: 'from-teal-700 to-teal-500',       text: 'text-teal-200/30' },
  { bg: 'from-rose-700 to-rose-500',       text: 'text-rose-200/30' },
]

export default function StudentSubjectsPage() {
  const enrollments = MOCK_ENROLLMENTS.filter((e) => e.studentId === student.id)

  const [search, setSearch]       = useState('')
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())

  function toggleFav(id: string, e: React.MouseEvent) {
    e.preventDefault()
    setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleExpand(id: string, e: React.MouseEvent) {
    e.preventDefault()
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const filtered = enrollments.filter(e => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.offering?.subject?.name?.toLowerCase().includes(q) ||
      e.offering?.subject?.code?.toLowerCase().includes(q) ||
      e.offering?.section?.toLowerCase().includes(q)
    )
  })

  const isLocked = (status: string) => status !== 'ENROLLED'

  return (
    <div className="space-y-5 max-w-6xl">
      <SectionTitle description={`${enrollments.length} subject${enrollments.length !== 1 ? 's' : ''} enrolled this semester`}>
        My Courses
      </SectionTitle>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your courses…"
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 cursor-default">
          <span>1st Semester 2025–2026</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 gap-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            title="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            title="List view"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="text-xs text-slate-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <BookOpen className="h-10 w-10 text-slate-200" />
          <p className="text-sm text-slate-500">No courses match your search.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((enrollment, idx) => {
            const palette   = BANNER_COLORS[idx % BANNER_COLORS.length]
            const locked    = isLocked(enrollment.status)
            const faculty   = enrollment.offering?.assignments?.[0]?.faculty
            const isFav     = favorites.has(enrollment.id)
            const isOpen    = expanded.has(enrollment.id)
            const subj      = enrollment.offering?.subject
            const schedules = enrollment.offering?.schedules ?? []
            const room      = schedules[0]?.room?.name ?? null
            const codeAbbr  = subj?.code?.replace(/\s/g, '') ?? ''

            return (
              <div key={enrollment.id} className="flex flex-col rounded-2xl border border-[#e4ebf5] bg-white shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden">

                {/* Clickable banner + body */}
                <Link href={`/student/subjects/${enrollment.offeringId}`} className="group flex flex-col flex-1">

                  {/* Banner */}
                  <div className={`relative h-[96px] bg-gradient-to-br ${palette.bg} overflow-hidden flex items-end px-4 pb-3`}>
                    {/* Large watermark code */}
                    <span className={`absolute -right-2 -top-1 text-[52px] font-black leading-none select-none pointer-events-none ${palette.text}`}>
                      {codeAbbr}
                    </span>

                    {locked && (
                      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm px-2 py-1">
                        <Lock className="h-3 w-3 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wide">Payment Pending</span>
                      </div>
                    )}

                    {/* Favorite button */}
                    <button
                      onClick={(e) => toggleFav(enrollment.id, e)}
                      className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-white/80'}`} />
                    </button>

                    {/* Course code pill at bottom-left */}
                    <span className="relative z-10 rounded-md bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[11px] font-bold text-white font-mono tracking-wider">
                      {subj?.code}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 px-4 pt-3 pb-3 gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug line-clamp-2">
                      {subj?.name ?? '—'}
                    </h3>

                    <p className="text-[11px] text-slate-400 font-mono -mt-1">
                      Section {enrollment.offering?.section}
                    </p>

                    <hr className="border-slate-100" />

                    {/* Instructor */}
                    {faculty && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        <p className="text-[11px] text-slate-500 truncate">
                          {faculty.firstName} {faculty.lastName}
                        </p>
                      </div>
                    )}

                    {/* Schedule chips */}
                    {schedules.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {schedules.map(s => (
                          <span key={s.id}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <Clock className="h-2.5 w-2.5 text-slate-400" />
                            {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status + units */}
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        locked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {locked ? '🔒 Locked' : '● Active'}
                      </span>
                      <span className="text-[11px] text-slate-400">{subj?.units ?? 0} units</span>
                    </div>
                  </div>
                </Link>

                {/* More info toggle — outside the Link */}
                <div className="border-t border-slate-100">
                  <button
                    onClick={(e) => toggleExpand(enrollment.id, e)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <span>More info</span>
                    {isOpen
                      ? <ChevronUp className="h-3.5 w-3.5" />
                      : <ChevronDown className="h-3.5 w-3.5" />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2.5 text-[11px] text-slate-600 border-t border-slate-50 pt-3">
                      {/* Course ID */}
                      <div className="flex items-start gap-2">
                        <span className="w-[72px] shrink-0 text-slate-400 font-medium">Course ID</span>
                        <span className="font-mono text-slate-700">{subj?.code}.{enrollment.offering?.section}.1T.25.26</span>
                      </div>

                      {/* Instructor */}
                      {faculty && (
                        <div className="flex items-start gap-2">
                          <span className="w-[72px] shrink-0 text-slate-400 font-medium">Instructor</span>
                          <span>{faculty.firstName} {faculty.lastName}</span>
                        </div>
                      )}

                      {/* Room */}
                      {room && (
                        <div className="flex items-start gap-2">
                          <span className="w-[72px] shrink-0 text-slate-400 font-medium">Room</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {room}
                          </span>
                        </div>
                      )}

                      {/* Schedule detail */}
                      {schedules.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="w-[72px] shrink-0 text-slate-400 font-medium">Schedule</span>
                          <div className="space-y-0.5">
                            {schedules.map(s => (
                              <div key={s.id} className="text-slate-700">
                                {s.dayOfWeek.charAt(0) + s.dayOfWeek.slice(1).toLowerCase()}{' '}
                                {formatTime(s.startTime)}–{formatTime(s.endTime)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Units */}
                      <div className="flex items-start gap-2">
                        <span className="w-[72px] shrink-0 text-slate-400 font-medium">Units</span>
                        <span>{subj?.units ?? 0} credit unit{(subj?.units ?? 0) !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Enrollment status */}
                      <div className="flex items-start gap-2">
                        <span className="w-[72px] shrink-0 text-slate-400 font-medium">Status</span>
                        <span className={locked ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                          {enrollment.status.replace('_', ' ')}
                        </span>
                      </div>

                      <Link
                        href={`/student/subjects/${enrollment.offeringId}`}
                        className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand-50 px-3 py-1.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                      >
                        Go to course →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl border border-[#e4ebf5] bg-white overflow-hidden divide-y divide-slate-100">
          {filtered.map((enrollment, idx) => {
            const palette   = BANNER_COLORS[idx % BANNER_COLORS.length]
            const locked    = isLocked(enrollment.status)
            const faculty   = enrollment.offering?.assignments?.[0]?.faculty
            const isFav     = favorites.has(enrollment.id)
            const subj      = enrollment.offering?.subject
            const schedules = enrollment.offering?.schedules ?? []

            return (
              <Link key={enrollment.id} href={`/student/subjects/${enrollment.offeringId}`}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-brand-50/40 transition-colors">

                <div className={`h-12 w-1.5 rounded-full bg-gradient-to-b ${palette.bg} shrink-0`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {locked && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    <p className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">{subj?.name}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{subj?.code} · Section {enrollment.offering?.section}</p>
                </div>

                <div className="hidden sm:block min-w-[140px]">
                  <p className="text-xs text-slate-500 truncate">
                    {faculty ? `${faculty.firstName} ${faculty.lastName}` : '—'}
                  </p>
                </div>

                <div className="hidden md:flex flex-wrap gap-1 min-w-[140px]">
                  {schedules.slice(0, 2).map(s => (
                    <span key={s.id} className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      {DAY_ABBR[s.dayOfWeek]} {formatTime(s.startTime)}–{formatTime(s.endTime)}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    locked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {locked ? 'Locked' : 'Active'}
                  </span>
                  <button onClick={(e) => toggleFav(enrollment.id, e)}
                    className="rounded-full p-1.5 hover:bg-slate-100 transition-colors">
                    <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
