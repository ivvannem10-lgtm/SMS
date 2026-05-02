'use client'
import { useState, useMemo } from 'react'
import { Plus, Users, CalendarDays, GraduationCap, BookOpen } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { MOCK_ROOMS, MOCK_OFFERINGS, MOCK_SEMESTERS, MOCK_ACADEMIC_YEARS } from '@/lib/mock-data'
import { formatTime, DAY_ABBR, DAYS_ORDER, fullName } from '@/lib/utils'
import type { Room } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────
// Each room has one available time range per day (from–to), or nothing if not set
type RoomAvailRange = { startTime: string; endTime: string }
type RoomAvailability = Record<string, RoomAvailRange> // roomId → range

const GRID_DAYS  = DAYS_ORDER
const GRID_HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function hourInRange(hour: string, start: string, end: string) {
  return timeToMin(hour) >= timeToMin(start) && timeToMin(hour) < timeToMin(end)
}

type TakenInfo = { subjectName: string; section: string; teacher: string; hrs: number }

// ── Timetable grid ─────────────────────────────────────────────────────────────
function TimetableGrid({
  roomId, availRange, semId,
}: {
  roomId: string
  availRange: RoomAvailRange | undefined
  semId: string
}) {
  const takenMap = useMemo(() => {
    const map: Record<string, TakenInfo> = {}
    MOCK_OFFERINGS
      .filter((o) => o.semesterId === semId)
      .forEach((o) => {
        ;(o.schedules ?? [])
          .filter((s) => s.roomId === roomId)
          .forEach((s) => {
            GRID_HOURS.forEach((h) => {
              if (hourInRange(h, s.startTime, s.endTime)) {
                const key     = `${s.dayOfWeek}_${h}`
                const teacher = o.assignments?.[0]?.faculty
                map[key] = {
                  subjectName: o.subject?.name ?? '—',
                  section:     o.section ?? '',
                  teacher:     teacher ? fullName(teacher) : 'No teacher',
                  hrs:         (o.subject?.units ?? 0) * 18,
                }
              }
            })
          })
      })
    return map
  }, [roomId, semId])

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr>
            <th className="w-14 border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-left text-slate-400 font-medium sticky left-0 z-10">
              Time
            </th>
            {GRID_DAYS.map((d) => (
              <th key={d} className="border border-slate-200 bg-slate-50 px-1 py-1.5 text-center text-slate-600 font-semibold min-w-[90px]">
                {DAY_ABBR[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRID_HOURS.map((h) => {
            const inRange = availRange ? hourInRange(h, availRange.startTime, availRange.endTime) : true
            return (
              <tr key={h}>
                <td className="border border-slate-200 bg-slate-50 px-1.5 py-1 text-slate-400 font-mono whitespace-nowrap sticky left-0 z-10">
                  {formatTime(h)}
                </td>
                {GRID_DAYS.map((d) => {
                  const key   = `${d}_${h}`
                  const taken = takenMap[key]

                  if (taken) {
                    return (
                      <td
                        key={d}
                        title={`${taken.subjectName} (${taken.section})\nTeacher: ${taken.teacher}\nRequired: ${taken.hrs} hrs/sem`}
                        className="border border-red-200 bg-red-50 px-1 py-1 text-center align-middle"
                      >
                        <span className="block text-[10px] text-red-700 font-medium leading-tight truncate max-w-[86px]">
                          {taken.subjectName.length > 14 ? taken.subjectName.slice(0, 14) + '…' : taken.subjectName}
                        </span>
                        <span className="block text-[9px] text-red-500 truncate">{taken.teacher.split(' ').slice(-1)[0]}</span>
                      </td>
                    )
                  }

                  if (inRange) {
                    return (
                      <td key={d} className="border border-emerald-100 bg-emerald-50 px-1 py-1 text-center align-middle">
                        <span className="block w-2 h-2 rounded-full bg-emerald-300 mx-auto" />
                      </td>
                    )
                  }

                  return <td key={d} className="border border-slate-100 bg-white px-1 py-1" />
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-300" />Available</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-100 border border-red-300" />Taken</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RoomsPage() {
  const [rooms,        setRooms]        = useState<Room[]>(MOCK_ROOMS)
  const [availability, setAvailability] = useState<RoomAvailability>({})
  const [addModal,     setAddModal]     = useState(false)
  const [detailRoom,   setDetailRoom]   = useState<Room | null>(null)
  const [filterType,   setFilterType]   = useState<'ALL' | 'LECTURE' | 'LAB' | 'BOTH'>('ALL')
  const [filterBldg,   setFilterBldg]   = useState('ALL')
  const [detailSemId,  setDetailSemId]  = useState(
    MOCK_SEMESTERS.find((s) => s.isActive)?.id ?? MOCK_SEMESTERS[0]?.id,
  )

  const [newRoom, setNewRoom] = useState({
    name: '', building: '', floor: '', capacity: '40', type: 'LECTURE' as 'LECTURE' | 'LAB' | 'BOTH',
  })

  // Per-room available time range (from–to)
  const [rangeForm, setRangeForm] = useState({ startTime: '07:00', endTime: '21:00' })

  const buildings = useMemo(() => {
    const set = new Set(rooms.map((r) => r.building).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [rooms])

  const filteredRooms = rooms.filter((r) => {
    if (filterType !== 'ALL' && r.type !== filterType) return false
    if (filterBldg !== 'ALL' && r.building !== filterBldg) return false
    return true
  })

  function handleAddRoom() {
    if (!newRoom.name.trim()) return
    const r: Room = {
      id: `room_${Date.now()}`, name: newRoom.name, building: newRoom.building,
      floor: newRoom.floor || undefined, capacity: parseInt(newRoom.capacity) || 40,
      type: newRoom.type, schoolId: 'school_1',
    }
    setRooms((p) => [...p, r])
    setNewRoom({ name: '', building: '', floor: '', capacity: '40', type: 'LECTURE' })
    setAddModal(false)
  }

  function saveRange(roomId: string) {
    setAvailability((p) => ({ ...p, [roomId]: { startTime: rangeForm.startTime, endTime: rangeForm.endTime } }))
  }

  function roomSchedules(roomId: string, semId?: string) {
    return MOCK_OFFERINGS
      .filter((o) => !semId || o.semesterId === semId)
      .flatMap((o) =>
        (o.schedules ?? [])
          .filter((s) => s.roomId === roomId)
          .map((s) => ({ offering: o, schedule: s })),
      )
  }

  const openDetail = (room: Room) => {
    setDetailRoom(room)
    const existing = availability[room.id]
    setRangeForm(existing ? { ...existing } : { startTime: '07:00', endTime: '21:00' })
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <SectionTitle
        description="Manage lecture halls, laboratories and their weekly availability"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddModal(true)}>Add Room</Button>}
      >
        Room Management
      </SectionTitle>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(['ALL', 'LECTURE', 'LAB', 'BOTH'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${filterType === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'ALL' ? 'All Types' : f}
            </button>
          ))}
        </div>
        <Select value={filterBldg} onChange={(e) => setFilterBldg(e.target.value)} className="w-48 text-sm">
          {buildings.map((b) => <option key={b} value={b}>{b === 'ALL' ? 'All Buildings' : b}</option>)}
        </Select>
      </div>

      {/* Room cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => {
          const range  = availability[room.id]
          const scheds = roomSchedules(room.id)
          return (
            <button key={room.id} onClick={() => openDetail(room)} className="text-left w-full">
              <Card hover className="h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{room.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{room.building}{room.floor ? ` · ${room.floor} Floor` : ''}</p>
                  </div>
                  <Badge className={
                    room.type === 'LAB'  ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                    room.type === 'BOTH' ? 'bg-violet-50 text-violet-700 ring-violet-600/20' :
                                          'bg-blue-50 text-blue-700 ring-blue-600/20'
                  }>{room.type}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{room.capacity} seats</span>
                  {range && (
                    <span className="text-emerald-600 font-medium">{formatTime(range.startTime)} – {formatTime(range.endTime)}</span>
                  )}
                </div>
                <div className="mt-3">
                  {scheds.length > 0 ? (
                    <>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${Math.min(scheds.length * 15, 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{scheds.length} slot{scheds.length !== 1 ? 's' : ''} scheduled</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">No classes scheduled</p>
                  )}
                </div>
              </Card>
            </button>
          )
        })}
        {filteredRooms.length === 0 && (
          <p className="col-span-3 text-center text-sm text-slate-400 py-8">No rooms match the selected filters.</p>
        )}
      </div>

      {/* ── Add Room Modal ─────────────────────────────────────────────────── */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Room" description="Register a new room or laboratory."
        footer={<><Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button><Button onClick={handleAddRoom}>Save Room</Button></>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Room Name"  value={newRoom.name}     onChange={(e) => setNewRoom((p) => ({ ...p, name:     e.target.value }))} placeholder="e.g. Room 401" />
          <Input label="Building"   value={newRoom.building} onChange={(e) => setNewRoom((p) => ({ ...p, building: e.target.value }))} placeholder="e.g. Main Building" />
          <Input label="Floor"      value={newRoom.floor}    onChange={(e) => setNewRoom((p) => ({ ...p, floor:    e.target.value }))} placeholder="e.g. 4th" />
          <Input label="Capacity"   type="number" value={newRoom.capacity} onChange={(e) => setNewRoom((p) => ({ ...p, capacity: e.target.value }))} />
          <Select label="Type" value={newRoom.type} onChange={(e) => setNewRoom((p) => ({ ...p, type: e.target.value as typeof newRoom.type }))}>
            <option value="LECTURE">Lecture</option>
            <option value="LAB">Laboratory</option>
            <option value="BOTH">Lecture & Lab</option>
          </Select>
        </div>
      </Modal>

      {/* ── Room Detail Modal ──────────────────────────────────────────────── */}
      {detailRoom && (
        <Modal
          open={!!detailRoom}
          onClose={() => setDetailRoom(null)}
          title={detailRoom.name}
          description={`${detailRoom.building}${detailRoom.floor ? ` · ${detailRoom.floor} Floor` : ''} · Capacity ${detailRoom.capacity}`}
          size="lg"
          footer={<Button variant="outline" onClick={() => setDetailRoom(null)}>Close</Button>}
        >
          <div className="space-y-6">

            {/* Semester + school year selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={detailSemId} onChange={(e) => setDetailSemId(e.target.value)} className="w-56 text-sm">
                {MOCK_SEMESTERS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              {MOCK_SEMESTERS.find((s) => s.id === detailSemId)?.isActive && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Current</span>
              )}
              <span className="text-xs text-slate-400">
                {MOCK_ACADEMIC_YEARS.find((ay) => ay.id === MOCK_SEMESTERS.find((s) => s.id === detailSemId)?.academicYearId)?.name}
              </span>
            </div>

            {/* Available hours setting */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">Room Available Hours</p>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 whitespace-nowrap">From</label>
                  <Input type="time" value={rangeForm.startTime} onChange={(e) => setRangeForm((p) => ({ ...p, startTime: e.target.value }))} className="w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
                  <Input type="time" value={rangeForm.endTime}   onChange={(e) => setRangeForm((p) => ({ ...p, endTime:   e.target.value }))} className="w-32" />
                </div>
                <Button size="sm" onClick={() => saveRange(detailRoom.id)}>
                  Set Hours
                </Button>
              </div>
              {availability[detailRoom.id] && (
                <p className="mt-2 text-xs text-emerald-600 font-medium">
                  Currently set: {formatTime(availability[detailRoom.id].startTime)} – {formatTime(availability[detailRoom.id].endTime)} · All days
                </p>
              )}
            </div>

            {/* Timetable grid */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                Weekly Schedule Grid
              </p>
              <TimetableGrid
                roomId={detailRoom.id}
                availRange={availability[detailRoom.id]}
                semId={detailSemId}
              />
            </div>

            {/* Schedule list — with teachers and subject hours */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                Current Schedule
              </p>
              {roomSchedules(detailRoom.id, detailSemId).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No subjects scheduled in this room for the selected semester.</p>
              ) : (
                <div className="space-y-2">
                  {roomSchedules(detailRoom.id, detailSemId).map(({ offering, schedule }, idx) => {
                    const teacher = offering.assignments?.[0]?.faculty
                    const hrs     = (offering.subject?.units ?? 0) * 18
                    return (
                      <div key={idx} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {offering.subject?.name}
                              <span className="ml-2 text-xs font-normal text-slate-400">({offering.section})</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {offering.subject?.code} · {offering.subject?.units} units · {hrs} hrs/semester
                            </p>
                          </div>
                          <span className="text-xs text-slate-600 shrink-0 font-medium">
                            {DAY_ABBR[schedule.dayOfWeek]} {formatTime(schedule.startTime)}–{formatTime(schedule.endTime)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                          {teacher
                            ? fullName(teacher)
                            : <span className="italic text-amber-500">No teacher assigned</span>
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </Modal>
      )}
    </div>
  )
}
