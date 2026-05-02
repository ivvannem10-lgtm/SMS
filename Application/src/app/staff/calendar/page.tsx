'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, CalendarDays, Trash2, ChevronLeft, ChevronRight, Flag, BookOpen, Banknote, Users, Star } from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

// ── Types ─────────────────────────────────────────────────────────────────────

type EventType = 'HOLIDAY' | 'ACADEMIC' | 'ENROLLMENT' | 'EXAM' | 'ACTIVITY' | 'ADMIN'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: EventType
  date: string       // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD (for multi-day)
  schoolYear: string
  createdBy: string
  createdAt: string
}

// ── Mock data — module-level mutable ─────────────────────────────────────────
const SCHOOL_EVENTS: CalendarEvent[] = [
  { id: 'ev_1', title: 'Start of 1st Semester', type: 'ACADEMIC',   date: '2025-08-11', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_2', title: 'Enrollment Period',      type: 'ENROLLMENT', date: '2025-06-01', endDate: '2025-08-08', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_3', title: 'Independence Day',       type: 'HOLIDAY',    date: '2025-06-12', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_4', title: 'National Heroes Day',    type: 'HOLIDAY',    date: '2025-08-25', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_5', title: 'Midterm Exams',          type: 'EXAM',       date: '2025-10-06', endDate: '2025-10-10', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_6', title: 'Foundation Day',         type: 'ACTIVITY',   date: '2025-10-22', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_7', title: 'All Saints Day',         type: 'HOLIDAY',    date: '2025-11-01', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_8', title: 'Final Exams',            type: 'EXAM',       date: '2025-12-08', endDate: '2025-12-12', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
  { id: 'ev_9', title: 'Christmas Break',        type: 'HOLIDAY',    date: '2025-12-20', endDate: '2026-01-04', schoolYear: '2025-2026', createdBy: 'Adam Academic', createdAt: '2025-07-01T00:00:00Z' },
]

const EVENT_META: Record<EventType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  HOLIDAY:    { label: 'Holiday',          color: 'text-red-700',     bg: 'bg-red-50 border-red-200',     icon: Flag },
  ACADEMIC:   { label: 'Academic',         color: 'text-brand-700',   bg: 'bg-brand-50 border-brand-200', icon: BookOpen },
  ENROLLMENT: { label: 'Enrollment',       color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200', icon: Users },
  EXAM:       { label: 'Exam',             color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200', icon: Star },
  ACTIVITY:   { label: 'Activity',         color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',   icon: CalendarDays },
  ADMIN:      { label: 'Admin',            color: 'text-slate-700',   bg: 'bg-slate-50 border-slate-200', icon: Banknote },
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatMonthYear(year: number, month: number) {
  return `${MONTHS[month]} ${year}`
}

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function isInRange(date: string, ev: CalendarEvent) {
  if (!ev.endDate) return ev.date === date
  return date >= ev.date && date <= ev.endDate
}

export default function CalendarPage() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? ''
  const userName = (session?.user as { name?: string })?.name ?? 'Staff'
  const canEdit  = role === 'ACADEMIC_ADMIN' || role === 'SUPER_ADMIN'

  const today    = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>(SCHOOL_EVENTS)

  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(
    new Set(Object.keys(EVENT_META) as EventType[])
  )
  function toggleFilter(type: EventType) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const [addOpen,  setAddOpen]  = useState(false)
  const [delTarget, setDelTarget] = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', type: 'ACADEMIC' as EventType,
    date: '', endDate: '', schoolYear: '2025-2026',
  })

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Grid for current view
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMo  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells     = Array.from({ length: firstDay + daysInMo }, (_, i) => i < firstDay ? null : i - firstDay + 1)

  // Events for current month
  const monthStart = dateStr(viewYear, viewMonth, 1)
  const monthEnd   = dateStr(viewYear, viewMonth, daysInMo)
  const monthEvents = useMemo(() => events.filter((ev) => {
    const start = ev.date
    const end   = ev.endDate ?? ev.date
    return start <= monthEnd && end >= monthStart && activeFilters.has(ev.type)
  }), [events, monthStart, monthEnd, activeFilters])

  function eventsForDay(d: number) {
    const ds = dateStr(viewYear, viewMonth, d)
    return monthEvents.filter((ev) => isInRange(ds, ev))
  }

  function handleAdd() {
    if (!form.title.trim() || !form.date) return
    const ev: CalendarEvent = {
      id: `ev_${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      date: form.date,
      endDate: form.endDate || undefined,
      schoolYear: form.schoolYear,
      createdBy: userName,
      createdAt: new Date().toISOString(),
    }
    setEvents((p) => [...p, ev])
    setAddOpen(false)
    setForm({ title: '', description: '', type: 'ACADEMIC', date: '', endDate: '', schoolYear: '2025-2026' })
  }

  function handleDelete() {
    if (!delTarget) return
    setEvents((p) => p.filter((ev) => ev.id !== delTarget.id))
    setDelTarget(null)
  }

  // Upcoming events (next 30 days)
  const upcoming = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10)
    const limit = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    return [...events]
      .filter((ev) => (ev.endDate ?? ev.date) >= now && ev.date <= limit && activeFilters.has(ev.type))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8)
  }, [events, activeFilters])

  return (
    <div className="space-y-6 max-w-7xl">
      <SectionTitle
        description="School-wide academic calendar — holidays, exams, key dates"
        actions={canEdit && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add Event</Button>
        )}
      >
        School Year Calendar
      </SectionTitle>

      {/* Filter toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-1">Filter:</span>
        {(Object.entries(EVENT_META) as [EventType, typeof EVENT_META[EventType]][]).map(([type, meta]) => {
          const active = activeFilters.has(type)
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                active ? `${meta.bg} ${meta.color}` : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <meta.icon className="h-3 w-3" />
              {meta.label}
              {!active && <span className="ml-0.5 opacity-50">×</span>}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Calendar grid ─────────────────────────────────────────────────── */}
        <Card className="lg:col-span-2" padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
            <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"><ChevronLeft className="h-4 w-4 text-slate-500" /></button>
            <h2 className="text-sm font-bold text-slate-900">{formatMonthYear(viewYear, viewMonth)}</h2>
            <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"><ChevronRight className="h-4 w-4 text-slate-500" /></button>
          </div>

          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} />
                const ds = dateStr(viewYear, viewMonth, day)
                const isToday = ds === today.toISOString().slice(0, 10)
                const dayEvs = eventsForDay(day)
                return (
                  <div
                    key={day}
                    className={`min-h-[72px] rounded-lg p-1.5 transition-colors ${isToday ? 'bg-brand-50 ring-1 ring-brand-300' : 'hover:bg-slate-50'}`}
                  >
                    <p className={`text-xs font-bold mb-1 ${isToday ? 'text-brand-600' : 'text-slate-500'}`}>{day}</p>
                    <div className="space-y-0.5">
                      {dayEvs.slice(0, 3).map((ev) => {
                        const meta = EVENT_META[ev.type]
                        return (
                          <div
                            key={ev.id}
                            title={ev.title}
                            className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight ${meta.bg} ${meta.color} cursor-default`}
                          >
                            {ev.title}
                          </div>
                        )
                      })}
                      {dayEvs.length > 3 && (
                        <p className="text-[9px] text-slate-400 font-medium">+{dayEvs.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* ── Upcoming events sidebar ───────────────────────────────────────── */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-[#e4ebf5]">
            <h3 className="text-sm font-bold text-slate-900">Upcoming (30 days)</h3>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No upcoming events</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4fa]">
              {upcoming.map((ev) => {
                const meta = EVENT_META[ev.type]
                const Icon = meta.icon
                return (
                  <div key={ev.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.bg} ${meta.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        {ev.endDate && ev.endDate !== ev.date && ` – ${new Date(ev.endDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setDelTarget(ev)}
                        className="shrink-0 rounded p-1 text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── All events table ───────────────────────────────────────────────── */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-[#e4ebf5] flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">All Events — 2025-2026</h3>
          <span className="text-xs text-slate-400">{events.filter(e => e.schoolYear === '2025-2026').length} events</span>
        </div>
        <div className="divide-y divide-[#f0f4fa]">
          {events.filter(e => e.schoolYear === '2025-2026').sort((a, b) => a.date.localeCompare(b.date)).map((ev) => {
            const meta = EVENT_META[ev.type]
            const Icon = meta.icon
            return (
              <div key={ev.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.bg} ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                  {ev.description && <p className="text-xs text-slate-400 truncate">{ev.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-700">
                    {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {ev.endDate && ev.endDate !== ev.date && (
                    <p className="text-[10px] text-slate-400">
                      to {new Date(ev.endDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.color}`}>{meta.label}</span>
                {canEdit && (
                  <button onClick={() => setDelTarget(ev)} className="shrink-0 rounded p-1 text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Add Event Modal ────────────────────────────────────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Calendar Event"
        description="Create a new school calendar event visible to all staff."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.title.trim() || !form.date}>Add Event</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Event Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Midterm Exams" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional details…" rows={2} />
          <Select label="Event Type *" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as EventType }))}>
            {(Object.entries(EVENT_META) as [EventType, typeof EVENT_META[EventType]][]).map(([type, meta]) => (
              <option key={type} value={type}>{meta.label}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date *" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} hint="Leave blank for single-day" />
          </div>
          <Select label="School Year" value={form.schoolYear} onChange={(e) => setForm((p) => ({ ...p, schoolYear: e.target.value }))}>
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
          </Select>
        </div>
      </Modal>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <Modal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        title="Delete Event"
        description={`Are you sure you want to delete "${delTarget?.title}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >{null}</Modal>
    </div>
  )
}
