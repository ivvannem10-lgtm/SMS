'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Mail, Phone, Cake, Building2, X, Camera, ZoomIn, ZoomOut, Upload } from 'lucide-react'
import { SectionTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { MOCK_STAFF_MEMBERS } from '@/lib/mock-data'
import type { StaffMember } from '@/lib/mock-data'

const ROLE_COLOR: Record<string, string> = {
  'Super Admin':       'bg-brand-900 text-white',
  'Admission Officer': 'bg-violet-100 text-violet-700',
  'Registrar':         'bg-blue-100 text-blue-700',
  'Treasurer':         'bg-emerald-100 text-emerald-700',
  'Academic Admin':    'bg-orange-100 text-orange-700',
  'Dean':              'bg-brand-100 text-brand-700',
  'Teacher':           'bg-teal-100 text-teal-700',
}

const ROLE_DEPT_MAP: Record<string, string> = {
  ADMISSION_OFFICER: 'Admissions Office',
  REGISTRAR:         'Registrar Office',
  TREASURER:         'Finance Office',
  ACADEMIC_ADMIN:    'Academic Affairs',
}

function formatBirthday(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ALL_DEPTS = ['All Departments', ...Array.from(new Set(MOCK_STAFF_MEMBERS.map((m) => m.department))).sort()]
const CANVAS_SIZE = 280

// ── Photo Crop Editor ─────────────────────────────────────────────────────────

function PhotoCropModal({ current, onSave, onClose }: {
  current?: string
  onSave: (dataUrl: string) => void
  onClose: () => void
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const dragRef    = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const [imgEl,   setImgEl]   = useState<HTMLImageElement | null>(null)
  const [zoom,    setZoom]    = useState(1)
  const [offset,  setOffset]  = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)

  // Minimum zoom: image covers the full crop circle
  const minZoom = imgEl
    ? Math.max(CANVAS_SIZE / imgEl.naturalWidth, CANVAS_SIZE / imgEl.naturalHeight)
    : 1

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setLoading(true)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const mz = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight)
      setImgEl(img)
      setZoom(mz)
      setOffset({ x: 0, y: 0 })
      setLoading(false)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  // Load existing photo on mount
  useEffect(() => {
    if (!current) return
    const img = new Image()
    img.onload = () => {
      setImgEl(img)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = current
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Draw canvas whenever image/zoom/offset change
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const sz = CANVAS_SIZE
    const cx = sz / 2, cy = sz / 2

    ctx.clearRect(0, 0, sz, sz)

    if (imgEl) {
      // Draw the image
      const w = imgEl.naturalWidth  * zoom
      const h = imgEl.naturalHeight * zoom
      ctx.drawImage(imgEl, cx - w / 2 + offset.x, cy - h / 2 + offset.y, w, h)
    } else {
      // Placeholder checkerboard
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(0, 0, sz, sz)
    }

    // Darken area outside the circle
    ctx.save()
    ctx.fillStyle = 'rgba(15,23,42,0.55)'
    ctx.beginPath()
    ctx.rect(0, 0, sz, sz)
    ctx.arc(cx, cy, sz / 2 - 3, 0, Math.PI * 2, true) // subtract circle (clockwise=false cuts hole)
    ctx.fill('evenodd')
    ctx.restore()

    // Circle border
    ctx.beginPath()
    ctx.arc(cx, cy, sz / 2 - 3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Crosshair guides
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke()
  }, [imgEl, zoom, offset])

  useEffect(() => { draw() }, [draw])

  // Mouse drag
  function onMouseDown(e: React.MouseEvent) {
    if (!imgEl) return
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.sx
    const dy = e.clientY - dragRef.current.sy
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy })
  }
  function onMouseUp() { dragRef.current = null }

  // Touch drag
  const touchRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    if (!imgEl || e.touches.length !== 1) return
    const t = e.touches[0]
    touchRef.current = { sx: t.clientX, sy: t.clientY, ox: offset.x, oy: offset.y }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touchRef.current || e.touches.length !== 1) return
    e.preventDefault()
    const t = e.touches[0]
    setOffset({ x: touchRef.current.ox + (t.clientX - touchRef.current.sx), y: touchRef.current.oy + (t.clientY - touchRef.current.sy) })
  }

  // Scroll-wheel zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => Math.max(minZoom, Math.min(5, z - e.deltaY * 0.003)))
  }

  function handleZoomSlider(v: number) {
    setZoom(Math.max(minZoom, Math.min(5, v)))
  }

  function save() {
    if (!imgEl) return
    const out = document.createElement('canvas')
    out.width = out.height = 200
    const ctx = out.getContext('2d')!
    const scale = 200 / CANVAS_SIZE
    const cx = 100, cy = 100
    ctx.beginPath()
    ctx.arc(cx, cy, 100, 0, Math.PI * 2)
    ctx.clip()
    const w = imgEl.naturalWidth  * zoom * scale
    const h = imgEl.naturalHeight * zoom * scale
    ctx.drawImage(imgEl, cx - w / 2 + offset.x * scale, cy - h / 2 + offset.y * scale, w, h)
    onSave(out.toDataURL('image/jpeg', 0.92))
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[360px] rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Edit Profile Photo</p>
            <p className="text-xs text-slate-400 mt-0.5">Drag to reposition · Scroll or slider to zoom</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex flex-col items-center gap-4 px-6 pt-5 pb-2">
          <div className="relative rounded-full overflow-hidden select-none shadow-lg border-2 border-brand-100"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, cursor: imgEl ? 'grab' : 'default' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { touchRef.current = null }}
            onWheel={onWheel}
          >
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
              className="block" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }} />
            {!imgEl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Upload className="h-8 w-8" />
                <span className="text-xs font-medium">Upload a photo</span>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Zoom slider */}
          {imgEl && (
            <div className="w-full flex items-center gap-2">
              <button onClick={() => handleZoomSlider(zoom - 0.1)} className="rounded-lg p-1 hover:bg-slate-100 transition-colors">
                <ZoomOut className="h-4 w-4 text-slate-400" />
              </button>
              <input type="range" min={minZoom} max={5} step={0.01} value={zoom}
                onChange={e => handleZoomSlider(parseFloat(e.target.value))}
                className="flex-1 accent-brand-500 h-1.5 rounded-full"
              />
              <button onClick={() => handleZoomSlider(zoom + 0.1)} className="rounded-lg p-1 hover:bg-slate-100 transition-colors">
                <ZoomIn className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 mt-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            {imgEl ? 'Change Photo' : 'Upload Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])}
          />
          <div className="flex-1" />
          <button onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={!imgEl}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors">
            Save Photo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profile Modal ─────────────────────────────────────────────────────────────

function ProfileModal({ member, avatarMap, onPhotoSaved, onClose }: {
  member: StaffMember
  avatarMap: Record<string, string>
  onPhotoSaved: (id: string, url: string) => void
  onClose: () => void
}) {
  const [cropOpen, setCropOpen] = useState(false)
  const photo = avatarMap[member.id] ?? member.avatar

  const rows = [
    { label: 'Full Name',   value: member.name },
    { label: 'Job Title',   value: member.role },
    { label: 'Department',  value: member.department },
    { label: 'Email',       value: member.email },
    { label: 'Phone',       value: member.phone ?? '—' },
    { label: 'Birthday',    value: formatBirthday(member.birthday) },
  ]

  return (
    <>
      <Modal open onClose={onClose} title="Team Member Profile" size="md"
        footer={
          <button onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <X className="h-4 w-4" /> Close
          </button>
        }
      >
        <div className="flex flex-col items-center gap-3 mb-5">
          {/* Avatar with edit overlay */}
          <div className="relative group cursor-pointer" onClick={() => setCropOpen(true)}>
            {photo ? (
              <img src={photo} alt={member.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-brand-100 shadow"
              />
            ) : (
              <Avatar name={member.name} size="xl" />
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-base font-bold text-slate-900">{member.name}</p>
            <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${ROLE_COLOR[member.role] ?? 'bg-slate-100 text-slate-600'}`}>
              {member.role}
            </span>
            <button onClick={() => setCropOpen(true)}
              className="mt-2 flex items-center gap-1 mx-auto rounded-lg px-2.5 py-1 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
              <Camera className="h-3 w-3" />
              {photo ? 'Edit Photo' : 'Add Photo'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-[#f0f4fa]">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="py-2.5 pl-4 pr-3 w-32 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-[#f8fafd]">{r.label}</td>
                  <td className="py-2.5 pl-3 pr-4 text-sm text-slate-900 font-medium">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {cropOpen && (
        <PhotoCropModal
          current={photo}
          onSave={(url) => { onPhotoSaved(member.id, url); setCropOpen(false) }}
          onClose={() => setCropOpen(false)}
        />
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamHubPage() {
  const { data: session } = useSession()
  const role     = (session?.user as { role?: string; deanDepartment?: string })?.role ?? ''
  const deanDept = (session?.user as { deanDepartment?: string })?.deanDepartment

  const [dept,           setDept]           = useState('All Departments')
  const [roleTab,        setRoleTab]        = useState<'ALL' | 'ADMIN' | 'DEAN' | 'TEACHER'>('ALL')
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)
  const [deptInit,       setDeptInit]       = useState(false)
  // Stores saved photos per member id — keeps cards in sync after photo edit
  const [avatarMap,      setAvatarMap]      = useState<Record<string, string>>({})

  useEffect(() => {
    if (!deptInit && session) {
      if (role === 'DEAN' && deanDept) setDept(deanDept)
      else if (ROLE_DEPT_MAP[role])    setDept(ROLE_DEPT_MAP[role])
      setDeptInit(true)
    }
  }, [session, role, deanDept, deptInit])

  const ADMIN_ROLES = useMemo(() => ['Super Admin', 'Admission Officer', 'Registrar', 'Treasurer', 'Academic Admin'], [])

  const filtered = useMemo(() => {
    return MOCK_STAFF_MEMBERS.filter((m) => {
      const matchDept = dept === 'All Departments' || m.department === dept
      const matchRole =
        roleTab === 'ALL'     ? true :
        roleTab === 'ADMIN'   ? ADMIN_ROLES.includes(m.role) :
        roleTab === 'DEAN'    ? m.role === 'Dean' :
        roleTab === 'TEACHER' ? m.role === 'Teacher' : true
      return matchDept && matchRole
    })
  }, [dept, roleTab, ADMIN_ROLES])

  function handlePhotoSaved(memberId: string, url: string) {
    // Update the in-memory member so it persists within the session
    const m = MOCK_STAFF_MEMBERS.find(s => s.id === memberId)
    if (m) m.avatar = url
    setAvatarMap(prev => ({ ...prev, [memberId]: url }))
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle description="School-wide employee directory — all staff and faculty">
        Team Hub
      </SectionTitle>

      {/* Role filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {([
          { tab: 'ALL'     as const, label: 'All' },
          { tab: 'ADMIN'   as const, label: 'Admin' },
          { tab: 'DEAN'    as const, label: 'Deans' },
          { tab: 'TEACHER' as const, label: 'Faculty' },
        ] as const).map((s) => (
          <button key={s.tab} onClick={() => setRoleTab(s.tab)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              roleTab === s.tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Department filter + count */}
      <div className="flex items-center gap-3">
        <select value={dept} onChange={(e) => setDept(e.target.value)}
          className="rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {ALL_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Users className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">No staff found</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((member) => {
            const initials = member.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            const photo    = avatarMap[member.id] ?? member.avatar
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="group flex flex-col rounded-2xl border border-[#e4ebf5] bg-white shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-150 overflow-hidden text-left"
              >
                {/* Avatar area */}
                <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-brand-50 to-white px-4 pt-8 pb-5">
                  {photo ? (
                    <img src={photo} alt={member.name}
                      className="h-20 w-20 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform duration-150 border border-brand-100"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-bold text-white shadow-md group-hover:scale-105 transition-transform duration-150">
                      {initials}
                    </div>
                  )}
                  <div className="text-center min-w-0 w-full">
                    <p className="text-sm font-bold text-slate-900 truncate leading-snug">{member.name}</p>
                    <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_COLOR[member.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Info area */}
                <div className="flex flex-col gap-1.5 px-4 pb-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="h-3 w-3 shrink-0 text-slate-300" />
                    <span className="text-[11px] text-slate-500 truncate">{member.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="h-3 w-3 shrink-0 text-slate-300" />
                    <span className="text-[11px] text-slate-500 truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Phone className="h-3 w-3 shrink-0 text-slate-300" />
                      <span className="text-[11px] text-slate-500 truncate">{member.phone}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedMember && (
        <ProfileModal
          member={selectedMember}
          avatarMap={avatarMap}
          onPhotoSaved={handlePhotoSaved}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}
