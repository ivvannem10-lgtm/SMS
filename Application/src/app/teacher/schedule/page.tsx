'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock, MapPin, CalendarDays, CheckCircle2, AlertCircle, BookOpen, Info } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import {
  MOCK_OFFERINGS, MOCK_FACULTY, MOCK_ROOMS,
  MOCK_SEMESTERS, MOCK_ROOM_AVAILABILITY,
} from '@/lib/mock-data'
import { formatTime, DAY_ABBR, DAYS_ORDER } from '@/lib/utils'
import type { OfferingSchedule } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────────
const myFaculty = MOCK_FACULTY[0]
const activeSem = MOCK_SEMESTERS.find((s) => s.isActive)

const TIME_OPTIONS = [
  '07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00',
]

const DAY_OPTIONS: { value: string; label: string }[] = [
  { value: 'MONDAY',    label: 'Monday' },
  { value: 'TUESDAY',   label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY',  label: 'Thursday' },
  { value: 'FRIDAY',    label: 'Friday' },
  { value: 'SATURDAY',  label: 'Saturday' },
]

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMin(aStart) < timeToMin(bEnd) && timeToMin(aEnd) > timeToMin(bStart)
}

// ── Initial schedule state (mutable copy from MOCK_SCHEDULES) ─────────────────
function initSchedules(): Record<string, OfferingSchedule[]> {
  const result: Record<string, OfferingSchedule[]> = {}
  MOCK_OFFERINGS.forEach((o) => {
    result[o.id] = (o.schedules ?? []).map((s) => ({ ...s }))
  })
  return result
}

let nextSchedId = 100

// ── Small timetable preview per offering ──────────────────────────────────────
function WeekPreview({
  schedules,
  allSchedules,
}: {
  schedules: OfferingSchedule[]
  allSchedules: Record<string, OfferingSchedule[]>
}) {
  if (!schedules.length) return null
  return (
    <div className="mt-3 grid grid-cols-6 gap-1">
      {DAYS_ORDER.slice(0, 6).map((day) => {
        const slots = schedules.filter((s) => s.dayOfWeek === day)
        return (
          <div key={day} className="text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{DAY_ABBR[day]}</p>
            {slots.length ? slots.map((s) => (
              <div key={s.id} className="rounded bg-brand-500 px-1 py-0.5 text-[9px] text-white font-medium truncate mb-0.5">
                {formatTime(s.startTime)}
              </div>
            )) : (
              <div className="rounded bg-slate-100 h-5" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function TeacherSchedulePage() {
  // All schedules in local state — starts with existing mock data
  const [schedules, setSchedules] = useState<Record<string, OfferingSchedule[]>>(initSchedules)

  // Add-slot modal state
  const [addModal,   setAddModal]    = useState<string | null>(null)   // offeringId
  const [day,        setDay]         = useState('MONDAY')
  const [roomId,     setRoomId]      = useState('')
  const [startTime,  setStartTime]   = useState('08:00')
  const [endTime,    setEndTime]     = useState('09:30')
  const [saving,     setSaving]      = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ offeringId: string; schedId: string } | null>(null)

  // My published offerings for active semester where I'm assigned
  const myOfferings = MOCK_OFFERINGS.filter(
    (o) => o.status === 'PUBLISHED'
      && o.semesterId === activeSem?.id
      && o.assignments?.some((a) => a.facultyId === myFaculty.id),
  )

  // Conflict detection: check if any OTHER offering already uses this room/day/time
  function getConflicts(offeringId: string): string[] {
    if (!roomId || !day || !startTime || !endTime) return []
    const issues: string[] = []

    // Check room availability window
    const avail = MOCK_ROOM_AVAILABILITY[roomId]
    if (avail) {
      if (!avail.days.includes(day)) {
        issues.push(`Room not available on ${DAY_OPTIONS.find((d) => d.value === day)?.label}.`)
      } else if (
        timeToMin(startTime) < timeToMin(avail.startTime) ||
        timeToMin(endTime) > timeToMin(avail.endTime)
      ) {
        issues.push(`Room available only ${formatTime(avail.startTime)}–${formatTime(avail.endTime)}.`)
      }
    }

    if (timeToMin(endTime) <= timeToMin(startTime)) {
      issues.push('End time must be after start time.')
    }

    // Check room conflicts across all offering schedules
    Object.entries(schedules).forEach(([oid, slots]) => {
      slots.forEach((s) => {
        if (s.roomId === roomId && s.dayOfWeek === day && overlaps(startTime, endTime, s.startTime, s.endTime)) {
          const offering = MOCK_OFFERINGS.find((o) => o.id === oid)
          issues.push(`Conflicts with ${offering?.subject?.code ?? oid} Section ${offering?.section} (${formatTime(s.startTime)}–${formatTime(s.endTime)}).`)
        }
      })
    })

    return issues
  }

  const selectedOffering = MOCK_OFFERINGS.find((o) => o.id === addModal)
  const conflicts = addModal ? getConflicts(addModal) : []
  const availRoom = roomId ? MOCK_ROOM_AVAILABILITY[roomId] : null

  async function handleAddSlot() {
    if (!addModal || !roomId || conflicts.length) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    const room = MOCK_ROOMS.find((r) => r.id === roomId)
    const newSlot: OfferingSchedule = {
      id:         `sched_new_${++nextSchedId}`,
      dayOfWeek:  day,
      startTime,
      endTime,
      offeringId: addModal,
      roomId,
      room,
    }
    setSchedules((prev) => ({
      ...prev,
      [addModal]: [...(prev[addModal] ?? []), newSlot],
    }))
    setSaving(false)
    setAddModal(null)
    setRoomId('')
    setDay('MONDAY')
    setStartTime('08:00')
    setEndTime('09:30')
  }

  function handleDelete() {
    if (!deleteTarget) return
    setSchedules((prev) => ({
      ...prev,
      [deleteTarget.offeringId]: (prev[deleteTarget.offeringId] ?? []).filter((s) => s.id !== deleteTarget.schedId),
    }))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionTitle description={`${activeSem?.name ?? 'Current Semester'} · Set your room schedule for published offerings`}>
        My Schedule
      </SectionTitle>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-200 px-5 py-3.5">
        <Info className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
        <p className="text-xs text-brand-700 leading-relaxed">
          You can set room schedules for offerings that have been <strong>published</strong> by the Academic Admin and where you have been <strong>assigned as teacher</strong>.
          Schedules must be within the room's available hours set by the Academic Admin.
        </p>
      </div>

      {/* No offerings state */}
      {myOfferings.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12">
            <CalendarDays className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No Published Offerings Assigned</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Once the Academic Admin publishes subject offerings and the Dean assigns you as teacher, you can set your schedule here.
            </p>
          </div>
        </Card>
      )}

      {/* Offering cards */}
      {myOfferings.map((offering) => {
        const slots          = schedules[offering.id] ?? []
        const hasSchedule    = slots.length > 0
        const totalHrs       = (offering.subject?.units ?? 0) * 18

        return (
          <Card key={offering.id} className="space-y-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 shrink-0">
                  <BookOpen className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{offering.subject?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {offering.subject?.code} · Section {offering.section}
                    {' · '}{offering.subject?.units} units
                    {' · '}{offering.subject?.type?.replace('_', ' + ')}
                  </p>
                  {hasSchedule ? (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Schedule set
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-600">
                      <AlertCircle className="h-3 w-3" /> No schedule yet
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="soft"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => { setAddModal(offering.id); setRoomId(''); setDay('MONDAY'); setStartTime('08:00'); setEndTime('09:30') }}
              >
                Add Slot
              </Button>
            </div>

            {/* Existing schedule slots */}
            {slots.length > 0 && (
              <div className="mt-4 space-y-2">
                {slots.map((s) => {
                  const room = MOCK_ROOMS.find((r) => r.id === s.roomId) ?? s.room
                  const durationMin = timeToMin(s.endTime) - timeToMin(s.startTime)
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg bg-slate-50 border border-[#e4ebf5] px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CalendarDays className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{DAY_OPTIONS.find((d) => d.value === s.dayOfWeek)?.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        <span className="text-slate-400">({durationMin} min)</span>
                      </div>
                      {room && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                          {room.name}
                          <span className="text-slate-400">· {room.building}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setDeleteTarget({ offeringId: offering.id, schedId: s.id })}
                        className="ml-auto rounded p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove slot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Week preview mini-grid */}
            <WeekPreview schedules={slots} allSchedules={schedules} />

            {/* Hours info */}
            <div className="mt-3 flex items-center gap-2 pt-3 border-t border-[#f0f4fa]">
              <span className="text-xs text-slate-400">Required hours this semester:</span>
              <span className="text-xs font-semibold text-slate-700">{totalHrs} hrs</span>
              {slots.length > 0 && (() => {
                const weeklyMins = slots.reduce((sum, s) => sum + timeToMin(s.endTime) - timeToMin(s.startTime), 0)
                const weeksNeeded = totalHrs > 0 ? Math.ceil((totalHrs * 60) / weeklyMins) : 0
                return (
                  <span className="text-xs text-brand-600 ml-1">
                    · ~{weeksNeeded} weeks at current schedule
                  </span>
                )
              })()}
            </div>
          </Card>
        )
      })}

      {/* ── Add Slot Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={!!addModal}
        onClose={() => { setAddModal(null); setRoomId('') }}
        title="Add Schedule Slot"
        description={selectedOffering ? `${selectedOffering.subject?.name} · Section ${selectedOffering.section}` : ''}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setAddModal(null); setRoomId('') }}>Cancel</Button>
            <Button
              onClick={handleAddSlot}
              loading={saving}
              disabled={!roomId || conflicts.length > 0 || timeToMin(endTime) <= timeToMin(startTime)}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Save Slot
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Room picker */}
          <Select
            label="Room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">Select a room…</option>
            {MOCK_ROOMS.map((room) => {
              const avail = MOCK_ROOM_AVAILABILITY[room.id]
              return (
                <option key={room.id} value={room.id}>
                  {room.name} — {room.building} (cap {room.capacity}) · {avail ? `${formatTime(avail.startTime)}–${formatTime(avail.endTime)}` : 'No availability set'}
                </option>
              )
            })}
          </Select>

          {/* Room availability info */}
          {availRoom && (
            <div className="rounded-lg bg-brand-50 border border-brand-100 px-4 py-2.5 text-xs text-brand-700 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Available {formatTime(availRoom.startTime)} – {formatTime(availRoom.endTime)} on{' '}
              {availRoom.days.map((d) => DAY_ABBR[d]).join(', ')}
            </div>
          )}

          <Select
            label="Day of Week"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}
                disabled={availRoom ? !availRoom.days.includes(d.value) : false}
              >
                {d.label}{availRoom && !availRoom.days.includes(d.value) ? ' (unavailable)' : ''}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {TIME_OPTIONS.filter((t) => !availRoom || timeToMin(t) >= timeToMin(availRoom.startTime)).map((t) => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </Select>
            <Select
              label="End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {TIME_OPTIONS.filter((t) => timeToMin(t) > timeToMin(startTime) && (!availRoom || timeToMin(t) <= timeToMin(availRoom.endTime))).map((t) => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </Select>
          </div>

          {/* Duration summary */}
          {startTime && endTime && timeToMin(endTime) > timeToMin(startTime) && (
            <div className="rounded-lg bg-slate-50 border border-[#e4ebf5] px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
              <span>Duration</span>
              <span className="font-bold text-slate-800">
                {timeToMin(endTime) - timeToMin(startTime)} minutes
              </span>
            </div>
          )}

          {/* Conflict warnings */}
          {conflicts.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 space-y-1">
              <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Conflicts detected
              </p>
              {conflicts.map((c, i) => (
                <p key={i} className="text-xs text-red-600">{c}</p>
              ))}
            </div>
          )}

          {/* All clear */}
          {conflicts.length === 0 && roomId && timeToMin(endTime) > timeToMin(startTime) && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> No conflicts — slot is available.
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Schedule Slot"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="h-4 w-4" />}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to remove this schedule slot? This cannot be undone.</p>
      </Modal>
    </div>
  )
}
