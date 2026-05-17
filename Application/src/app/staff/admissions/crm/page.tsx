'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  UserPlus, X, FileText, Clock, CheckCircle2, XCircle,
  User, Mail, Phone, MessageSquare, GripVertical,
  AlertCircle, Flame, Minus, Snowflake, Globe, Facebook,
  Users, Bell, Search, ChevronRight, ArrowRight, Filter,
} from 'lucide-react'
import { SectionTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { MOCK_APPLICANTS, MOCK_STAFF_MEMBERS, CRM_FOLLOWUPS as SHARED_FOLLOWUPS } from '@/lib/mock-data'
import type { CrmFollowUp as SharedFollowUp } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadSource = 'WEBSITE' | 'FACEBOOK' | 'REFERRAL' | 'WALK_IN' | 'MANUAL'
type LeadScore  = 'HOT' | 'WARM' | 'COLD'
type CrmStage   =
  | 'NEW_LEAD' | 'CONTACTED' | 'INTERESTED' | 'APPLICANT'
  | 'FOR_INTERVIEW' | 'ACCEPTED' | 'ENROLLED' | 'LOST'

interface CrmLead {
  id: string
  firstName: string; lastName: string
  email: string; phone?: string; address?: string
  interestedProgram?: string
  source: LeadSource; score: LeadScore; stage: CrmStage
  assignedStaff?: string; applicantId?: string
  createdAt: string; updatedAt: string
}
interface LeadActivity {
  id: string; leadId: string
  type: 'NOTE' | 'STAGE_CHANGE' | 'CALL' | 'EMAIL' | 'DOCUMENT'
  text: string; by: string; at: string
}
type FollowUp = SharedFollowUp

// ─── Module-level data (persists across navigations) ─────────────────────────

const CRM_LEADS: CrmLead[] = []
const CRM_ACTIVITIES: LeadActivity[] = []
// Re-export shared store so local mutations stay in sync
const CRM_FOLLOWUPS = SHARED_FOLLOWUPS

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: { id: CrmStage; label: string; short: string; color: string; text: string; dot: string; ring: string }[] = [
  { id: 'NEW_LEAD',      label: 'New Lead',        short: 'New',       color: 'bg-slate-100 border-slate-300',    text: 'text-slate-700',   dot: 'bg-slate-400',   ring: 'ring-slate-300' },
  { id: 'CONTACTED',     label: 'Contacted',       short: 'Contacted', color: 'bg-blue-50 border-blue-200',       text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'ring-blue-300' },
  { id: 'INTERESTED',    label: 'Interested',      short: 'Interest',  color: 'bg-cyan-50 border-cyan-200',       text: 'text-cyan-700',    dot: 'bg-cyan-500',    ring: 'ring-cyan-300' },
  { id: 'APPLICANT',     label: 'Applicant',       short: 'Applicant', color: 'bg-violet-50 border-violet-200',   text: 'text-violet-700',  dot: 'bg-violet-500',  ring: 'ring-violet-300' },
  { id: 'FOR_INTERVIEW', label: 'For Interview',   short: 'Interview', color: 'bg-orange-50 border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-400',  ring: 'ring-orange-300' },
  { id: 'ACCEPTED',      label: 'Accepted',        short: 'Accepted',  color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-300' },
  { id: 'ENROLLED',      label: 'Enrolled',        short: 'Enrolled',  color: 'bg-teal-50 border-teal-200',       text: 'text-teal-700',    dot: 'bg-teal-500',    ring: 'ring-teal-300' },
  { id: 'LOST',          label: 'Lost / Rejected', short: 'Lost',      color: 'bg-red-50 border-red-200',         text: 'text-red-600',     dot: 'bg-red-400',     ring: 'ring-red-300' },
]

const SOURCE_META: Record<LeadSource, { label: string; icon: React.ElementType; badge: string }> = {
  WEBSITE:  { label: 'Website',  icon: Globe,    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  FACEBOOK: { label: 'Facebook', icon: Facebook, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  REFERRAL: { label: 'Referral', icon: Users,    badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  WALK_IN:  { label: 'Walk-in',  icon: User,     badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  MANUAL:   { label: 'Manual',   icon: UserPlus, badge: 'bg-slate-50 text-slate-600 border-slate-200' },
}

const SCORE_META: Record<LeadScore, { label: string; icon: React.ElementType; color: string }> = {
  HOT:  { label: 'Hot',  icon: Flame,     color: 'text-red-500' },
  WARM: { label: 'Warm', icon: Minus,     color: 'text-amber-500' },
  COLD: { label: 'Cold', icon: Snowflake, color: 'text-sky-400' },
}

const STAGE_ORDER: CrmStage[] = ['NEW_LEAD','CONTACTED','INTERESTED','APPLICANT','FOR_INTERVIEW','ACCEPTED','ENROLLED','LOST']

const ACT_STYLE: Record<LeadActivity['type'], { icon: React.ElementType; bg: string }> = {
  NOTE:         { icon: MessageSquare, bg: 'bg-slate-100' },
  STAGE_CHANGE: { icon: ArrowRight,    bg: 'bg-brand-50' },
  CALL:         { icon: Phone,         bg: 'bg-green-50' },
  EMAIL:        { icon: Mail,          bg: 'bg-blue-50' },
  DOCUMENT:     { icon: FileText,      bg: 'bg-violet-50' },
}

const ADMISSION_STAFF = MOCK_STAFF_MEMBERS
  .filter((m) => m.role === 'Admission Officer' || m.role === 'Super Admin')
  .map((m) => m.name)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function leadName(l: CrmLead) { return `${l.firstName} ${l.lastName}` }
function nextStage(cur: CrmStage): CrmStage | null {
  const i = STAGE_ORDER.indexOf(cur)
  return (i >= 0 && i < STAGE_ORDER.length - 2) ? STAGE_ORDER[i + 1] : null
}

let _leadSeq = 100, _actSeq = 200, _fuSeq = 300
function gLead() { return `lead_g${++_leadSeq}` }
function gAct()  { return `act_g${++_actSeq}` }
function gFu()   { return `fu_g${++_fuSeq}` }

// ─── Add Lead Modal ───────────────────────────────────────────────────────────

function AddLeadModal({ open, onClose, onAdd, defaultStaff }: {
  open: boolean; onClose: () => void; onAdd: (l: CrmLead) => void; defaultStaff: string
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    interestedProgram: '', source: 'WEBSITE' as LeadSource,
    score: 'WARM' as LeadScore, assignedStaff: defaultStaff,
  })
  function f(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return
    onAdd({
      id: gLead(), firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      email: form.email.trim(), phone: form.phone.trim() || undefined,
      interestedProgram: form.interestedProgram.trim() || undefined,
      source: form.source, score: form.score, stage: 'NEW_LEAD',
      assignedStaff: form.assignedStaff || defaultStaff,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    setForm({ firstName: '', lastName: '', email: '', phone: '', interestedProgram: '', source: 'WEBSITE', score: 'WARM', assignedStaff: defaultStaff })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Lead" description="Create a lead in the pipeline" size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()} icon={<UserPlus className="h-4 w-4" />}>Add Lead</Button></>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name *" value={form.firstName} onChange={(e) => f('firstName', e.target.value)} placeholder="Juan" />
          <Input label="Last Name *"  value={form.lastName}  onChange={(e) => f('lastName', e.target.value)}  placeholder="Dela Cruz" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email *" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="juan@email.com" />
          <Input label="Phone"              value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="09XXXXXXXXX" />
        </div>
        <Input label="Interested Program" value={form.interestedProgram} onChange={(e) => f('interestedProgram', e.target.value)} placeholder="e.g. BS Computer Science" />
        <div className="grid grid-cols-3 gap-3">
          <Select label="Lead Source" value={form.source} onChange={(e) => f('source', e.target.value as LeadSource)}>
            {(Object.keys(SOURCE_META) as LeadSource[]).map((s) => <option key={s} value={s}>{SOURCE_META[s].label}</option>)}
          </Select>
          <Select label="Lead Score" value={form.score} onChange={(e) => f('score', e.target.value as LeadScore)}>
            {(Object.keys(SCORE_META) as LeadScore[]).map((s) => <option key={s} value={s}>{SCORE_META[s].label}</option>)}
          </Select>
          <Select label="Assign To" value={form.assignedStaff} onChange={(e) => f('assignedStaff', e.target.value)}>
            {ADMISSION_STAFF.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>
    </Modal>
  )
}

// ─── Detail slide-over ────────────────────────────────────────────────────────

function DetailPanel({ lead, activities, followUps, staffName, onClose, onStageChange, onAddActivity, onAddFollowUp, onToggleFu }: {
  lead: CrmLead; activities: LeadActivity[]; followUps: FollowUp[]
  staffName: string; onClose: () => void
  onStageChange: (id: string, s: CrmStage) => void
  onAddActivity: (a: LeadActivity) => void
  onAddFollowUp: (f: FollowUp) => void
  onToggleFu: (id: string) => void
}) {
  const [tab, setTab]     = useState<'profile' | 'timeline' | 'followup'>('profile')
  const [note, setNote]   = useState('')
  const [noteType, setNoteType] = useState<LeadActivity['type']>('NOTE')
  const [fuType,    setFuType]    = useState<FollowUp['type']>('CALL')
  const [fuDate,    setFuDate]    = useState('')
  const [fuNote,    setFuNote]    = useState('')

  const stageInfo   = STAGES.find((s) => s.id === lead.stage)!
  const next        = nextStage(lead.stage)
  const myActs      = activities.filter((a) => a.leadId === lead.id).sort((a, b) => b.at.localeCompare(a.at))
  const myFus       = followUps.filter((f) => f.leadId === lead.id)
  const pendingFus  = myFus.filter((f) => !f.done).length
  const SourceIcon  = SOURCE_META[lead.source].icon
  const ScoreIcon   = SCORE_META[lead.score].icon

  function logActivity() {
    if (!note.trim()) return
    const a: LeadActivity = { id: gAct(), leadId: lead.id, type: noteType, text: note.trim(), by: staffName, at: new Date().toISOString() }
    onAddActivity(a)
    setNote('')
    setTab('timeline')
  }
  function schedFu() {
    if (!fuDate) return
    onAddFollowUp({ id: gFu(), leadId: lead.id, leadName: leadName(lead), type: fuType, dueDate: fuDate, note: fuNote.trim() || undefined, done: false })
    setFuDate(''); setFuNote('')
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="fixed inset-y-0 right-0 z-[36] flex w-full max-w-[440px] flex-col bg-white border-l border-[#e4ebf5] shadow-2xl">

      {/* ── Dark header ── */}
      <div className="shrink-0 bg-[#0c1e3d] px-5 py-4">
        {/* Name row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={leadName(lead)} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-snug">{leadName(lead)}</p>
              <p className="text-xs text-blue-300 truncate mt-0.5">{lead.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${SOURCE_META[lead.source].badge}`}>
                  <SourceIcon className="h-2.5 w-2.5" />{SOURCE_META[lead.source].label}
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-bold ${SCORE_META[lead.score].color}`}>
                  <ScoreIcon className="h-3 w-3" />{SCORE_META[lead.score].label}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${stageInfo.color} ${stageInfo.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${stageInfo.dot}`} />{stageInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 hover:bg-white/10 transition-colors mt-0.5">
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        {/* Stage pipeline — scrollable row */}
        <div className="overflow-x-auto -mx-1 px-1 pb-0.5">
          <div className="flex gap-1 min-w-max">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => onStageChange(lead.id, s.id)}
                title={s.label}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold whitespace-nowrap transition-all ${
                  lead.stage === s.id
                    ? 'bg-white text-[#0c1e3d] shadow-sm'
                    : 'text-white/60 hover:bg-white/10'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
                {s.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="shrink-0 flex border-b border-[#e4ebf5] bg-white">
        {(['profile', 'timeline', 'followup'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors relative ${tab === t ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'followup' ? 'Follow-ups' : t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-500 rounded-full" />}
            {t === 'followup' && pendingFus > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{pendingFus}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafd]">

        {/* Profile */}
        {tab === 'profile' && (
          <div className="p-4 space-y-4">
            <InfoTable title="Personal Information" rows={[
              { label: 'Full Name', value: leadName(lead) },
              { label: 'Email',     value: lead.email },
              { label: 'Phone',     value: lead.phone ?? '—' },
              { label: 'Address',   value: lead.address ?? '—' },
              { label: 'Program',   value: lead.interestedProgram ?? '—' },
            ]} />
            <InfoTable title="Lead Information" rows={[
              { label: 'Source',   value: SOURCE_META[lead.source].label },
              { label: 'Score',    value: `${SCORE_META[lead.score].label} Lead` },
              { label: 'Stage',    value: stageInfo.label },
              { label: 'Assigned', value: lead.assignedStaff ?? '—' },
              { label: 'Created',  value: formatDate(lead.createdAt) },
            ]} />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Log Activity</p>
              <div className="rounded-xl border border-[#e4ebf5] bg-white p-3 space-y-2">
                <div className="flex gap-1.5">
                  {(['NOTE','CALL','EMAIL'] as LeadActivity['type'][]).map((t) => (
                    <button key={t} onClick={() => setNoteType(t)}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-colors ${noteType === t ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >{t}</button>
                  ))}
                </div>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={`${noteType === 'CALL' ? 'Log a call…' : noteType === 'EMAIL' ? 'Log an email…' : 'Write a note…'}`} rows={2} />
                <Button size="sm" variant="soft" onClick={logActivity} disabled={!note.trim()} icon={<MessageSquare className="h-3.5 w-3.5" />}>
                  Save {noteType === 'NOTE' ? 'Note' : noteType === 'CALL' ? 'Call' : 'Email'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {tab === 'timeline' && (
          <div className="p-4">
            {myActs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16">
                <Clock className="h-8 w-8 text-slate-200" />
                <p className="text-xs text-slate-400">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myActs.map((act) => {
                  const meta = ACT_STYLE[act.type]
                  const Icon = meta.icon
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                        <Icon className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0 rounded-xl border border-[#e4ebf5] bg-white px-3 py-2">
                        <p className="text-xs text-slate-800 leading-relaxed">{act.text}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{act.by} · {formatDate(act.at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Follow-ups */}
        {tab === 'followup' && (
          <div className="p-4 space-y-4">
            <div className="rounded-xl border border-[#e4ebf5] bg-white p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule Reminder</p>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Type" value={fuType} onChange={(e) => setFuType(e.target.value as FollowUp['type'])}>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="INTERVIEW">Interview</option>
                </Select>
                <Input label="Due Date" type="date" value={fuDate} onChange={(e) => setFuDate(e.target.value)} />
              </div>
              <Input label="Note" value={fuNote} onChange={(e) => setFuNote(e.target.value)} placeholder="Optional note…" />
              <Button size="sm" onClick={schedFu} disabled={!fuDate} icon={<Bell className="h-3.5 w-3.5" />}>Add Reminder</Button>
            </div>

            <div className="space-y-2">
              {myFus.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No follow-ups scheduled</p>}
              {myFus.map((fu) => {
                const overdue = !fu.done && fu.dueDate < today
                const dueToday = fu.dueDate === today && !fu.done
                return (
                  <div key={fu.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 bg-white ${fu.done ? 'opacity-50' : overdue ? 'border-red-200' : dueToday ? 'border-amber-200' : 'border-[#e4ebf5]'}`}>
                    <button onClick={() => onToggleFu(fu.id)} className="mt-0.5 shrink-0">
                      {fu.done
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <div className="h-4 w-4 rounded-full border-2 border-slate-300 hover:border-brand-500 transition-colors" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-800">{fu.type}</p>
                        {dueToday && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded-full uppercase">Today</span>}
                        {overdue  && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 rounded-full uppercase">Overdue</span>}
                      </div>
                      <p className="text-[10px] text-slate-400">{fu.dueDate}{fu.note ? ` — ${fu.note}` : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="shrink-0 border-t border-[#e4ebf5] bg-white px-4 py-3 space-y-2">
        {next && (
          <button onClick={() => onStageChange(lead.id, next)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Move to {STAGES.find((s) => s.id === next)?.label}
          </button>
        )}
        <div className="flex gap-2">
          {lead.stage !== 'ACCEPTED' && lead.stage !== 'ENROLLED' && lead.stage !== 'LOST' && (
            <button onClick={() => onStageChange(lead.id, 'ACCEPTED')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
            ><CheckCircle2 className="h-3.5 w-3.5" />Accept</button>
          )}
          {lead.stage === 'ACCEPTED' && (
            <button onClick={() => onStageChange(lead.id, 'ENROLLED')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 py-2 text-xs font-bold text-white hover:bg-teal-600 transition-colors"
            ><CheckCircle2 className="h-3.5 w-3.5" />Convert to Enrolled</button>
          )}
          {lead.stage !== 'LOST' && (
            <button onClick={() => onStageChange(lead.id, 'LOST')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 text-red-600 py-2 text-xs font-bold hover:bg-red-50 transition-colors"
            ><XCircle className="h-3.5 w-3.5" />Mark Lost</button>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoTable({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="rounded-xl border border-[#e4ebf5] overflow-hidden bg-white">
        <table className="w-full">
          <tbody className="divide-y divide-[#f0f4fa]">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="py-2 pl-3 pr-2 w-24 text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-[#f8fafd] whitespace-nowrap">{r.label}</td>
                <td className="py-2 pl-2 pr-3 text-xs text-slate-800">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Lead card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, onClick, onDragStart }: {
  lead: CrmLead; onClick: () => void; onDragStart: (e: React.DragEvent) => void
}) {
  const src   = SOURCE_META[lead.source]
  const score = SCORE_META[lead.score]
  const SrcIcon   = src.icon
  const ScoreIcon = score.icon

  return (
    <div
      draggable onDragStart={onDragStart} onClick={onClick}
      className="group rounded-xl border border-[#e4ebf5] bg-white p-3 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-pointer select-none"
    >
      {/* Name + score + grip */}
      <div className="flex items-start justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={leadName(lead)} size="xs" />
          <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">{leadName(lead)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ScoreIcon className={`h-3.5 w-3.5 ${score.color}`} />
          <GripVertical className="h-3.5 w-3.5 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Contact */}
      <p className="text-[11px] text-slate-500 truncate mb-1">{lead.email}</p>
      {lead.phone && <p className="text-[11px] text-slate-400 truncate mb-1">{lead.phone}</p>}

      {/* Program */}
      {lead.interestedProgram && (
        <p className="text-[10px] font-semibold text-brand-600 bg-brand-50 rounded px-1.5 py-0.5 inline-block mb-2 max-w-full truncate">
          {lead.interestedProgram}
        </p>
      )}

      {/* Source + date */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold shrink-0 ${src.badge}`}>
          <SrcIcon className="h-2.5 w-2.5" />{src.label}
        </span>
        <span className="text-[10px] text-slate-400 shrink-0">{formatDate(lead.createdAt)}</span>
      </div>

      {/* Assigned */}
      {lead.assignedStaff && (
        <p className="mt-1.5 text-[10px] text-slate-400 truncate flex items-center gap-1">
          <User className="h-2.5 w-2.5 shrink-0" />{lead.assignedStaff}
        </p>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdmissionsCRMPage() {
  const { data: session } = useSession()
  const staffName = (session?.user as { name?: string })?.name ?? 'Staff'

  const [leads,      setLeads]      = useState<CrmLead[]>([...CRM_LEADS])
  const [activities, setActivities] = useState<LeadActivity[]>([...CRM_ACTIVITIES])
  const [followUps,  setFollowUps]  = useState<FollowUp[]>([...CRM_FOLLOWUPS])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropCol,    setDropCol]    = useState<CrmStage | null>(null)
  const [selected,   setSelected]   = useState<CrmLead | null>(null)
  const [addOpen,    setAddOpen]    = useState(false)

  // Filters
  const [search,       setSearch]       = useState('')
  const [fStage,       setFStage]       = useState<CrmStage | 'ALL'>('ALL')
  const [fSource,      setFSource]      = useState<LeadSource | 'ALL'>('ALL')
  const [fScore,       setFScore]       = useState<LeadScore | 'ALL'>('ALL')
  const [fStaff,       setFStaff]       = useState('ALL')
  const [showFilters,  setShowFilters]  = useState(false)

  // Auto-sync new applicants from apply form
  useEffect(() => {
    const knownAppIds = new Set(leads.filter((l) => l.applicantId).map((l) => l.applicantId!))
    const fresh: CrmLead[] = []
    for (const app of MOCK_APPLICANTS) {
      if (knownAppIds.has(app.id)) continue
      const l: CrmLead = {
        id: `lead_app_${app.id}`,
        firstName: app.firstName, lastName: app.lastName,
        email: app.email, phone: app.phone,
        interestedProgram: app.program?.name ?? app.program?.code,
        source: 'WEBSITE', score: 'WARM',
        assignedStaff: staffName, applicantId: app.id,
        stage: app.status === 'ACCEPTED' ? 'ACCEPTED' : app.status === 'REJECTED' ? 'LOST' : 'APPLICANT',
        createdAt: app.createdAt, updatedAt: app.updatedAt,
      }
      CRM_LEADS.push(l)
      fresh.push(l)
    }
    if (fresh.length > 0) setLeads((prev) => [...prev, ...fresh])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilters = [fStage, fSource, fScore, fStaff].filter((v) => v !== 'ALL').length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter((l) => {
      if (fStage  !== 'ALL' && l.stage  !== fStage)  return false
      if (fSource !== 'ALL' && l.source !== fSource) return false
      if (fScore  !== 'ALL' && l.score  !== fScore)  return false
      if (fStaff  !== 'ALL' && l.assignedStaff !== fStaff) return false
      if (q && !leadName(l).toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [leads, search, fStage, fSource, fScore, fStaff])

  function forStage(s: CrmStage) { return filtered.filter((l) => l.stage === s) }

  function moveTo(id: string, newStage: CrmStage) {
    const prev = leads.find((l) => l.id === id)
    setLeads((ls) => ls.map((l) => l.id === id ? { ...l, stage: newStage } : l))
    setSelected((sl) => sl?.id === id ? { ...sl, stage: newStage } : sl)

    const act: LeadActivity = {
      id: gAct(), leadId: id, type: 'STAGE_CHANGE',
      text: `Moved: ${STAGES.find((s) => s.id === prev?.stage)?.label} → ${STAGES.find((s) => s.id === newStage)?.label}`,
      by: staffName, at: new Date().toISOString(),
    }
    CRM_ACTIVITIES.push(act)
    setActivities((a) => [...a, act])

    const idx = CRM_LEADS.findIndex((l) => l.id === id)
    if (idx >= 0) CRM_LEADS[idx].stage = newStage

    // Sync back to MOCK_APPLICANTS if linked
    const lead = leads.find((l) => l.id === id)
    if (lead?.applicantId) {
      const ai = MOCK_APPLICANTS.findIndex((a) => a.id === lead.applicantId)
      if (ai >= 0) {
        if (newStage === 'ACCEPTED') MOCK_APPLICANTS[ai].status = 'ACCEPTED'
        else if (newStage === 'LOST') MOCK_APPLICANTS[ai].status = 'REJECTED'
        else MOCK_APPLICANTS[ai].status = 'UNDER_REVIEW'
      }
    }
  }

  function addLead(l: CrmLead) {
    CRM_LEADS.push(l)
    setLeads((prev) => [...prev, l])
    const act: LeadActivity = { id: gAct(), leadId: l.id, type: 'STAGE_CHANGE', text: 'Lead created', by: staffName, at: new Date().toISOString() }
    CRM_ACTIVITIES.push(act)
    setActivities((a) => [...a, act])
  }

  function addActivity(a: LeadActivity) { CRM_ACTIVITIES.push(a); setActivities((prev) => [...prev, a]) }
  function addFu(f: FollowUp)           { CRM_FOLLOWUPS.push(f); setFollowUps((prev) => [...prev, f]) }
  function toggleFu(id: string) {
    setFollowUps((prev) => prev.map((f) => f.id === id ? { ...f, done: !f.done } : f))
    const i = SHARED_FOLLOWUPS.findIndex((f) => f.id === id)
    if (i >= 0) SHARED_FOLLOWUPS[i].done = !SHARED_FOLLOWUPS[i].done
  }

  function handleDrop(e: React.DragEvent, stage: CrmStage) {
    e.preventDefault()
    if (draggingId) moveTo(draggingId, stage)
    setDraggingId(null); setDropCol(null)
  }

  const today       = new Date().toISOString().slice(0, 10)
  const totalLeads  = leads.length
  const active      = leads.filter((l) => l.stage !== 'LOST' && l.stage !== 'ENROLLED').length
  const applicants  = leads.filter((l) => l.stage === 'APPLICANT' || l.stage === 'FOR_INTERVIEW').length
  const accepted    = leads.filter((l) => l.stage === 'ACCEPTED').length
  const enrolled    = leads.filter((l) => l.stage === 'ENROLLED').length
  const convRate    = totalLeads > 0 ? Math.round((enrolled / totalLeads) * 100) : 0
  const uniqueStaff = Array.from(new Set(leads.map((l) => l.assignedStaff).filter(Boolean))) as string[]

  return (
    <div className="space-y-4 max-w-none">

      {/* ── Header ── */}
      <SectionTitle
        description={`${totalLeads} leads · ${convRate}% conversion rate`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads…"
                className="rounded-lg border border-[#dce8f7] bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-44"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${showFilters || activeFilters > 0 ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-[#dce8f7] bg-white text-slate-600 hover:border-brand-300'}`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilters > 0 && <span className="ml-0.5 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">{activeFilters}</span>}
            </button>
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add Lead</Button>
          </div>
        }
      >
        Admissions CRM
      </SectionTitle>

      {/* ── Stats strip ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Total',      value: totalLeads, bg: 'bg-white border-[#e4ebf5]',         text: 'text-slate-800' },
          { label: 'Active',     value: active,     bg: 'bg-blue-50 border-blue-200',         text: 'text-blue-700' },
          { label: 'Applicants', value: applicants, bg: 'bg-violet-50 border-violet-200',     text: 'text-violet-700' },
          { label: 'Accepted',   value: accepted,   bg: 'bg-emerald-50 border-emerald-200',   text: 'text-emerald-700' },
          { label: 'Enrolled',   value: enrolled,   bg: 'bg-teal-50 border-teal-200',         text: 'text-teal-700' },
          { label: 'Conversion', value: `${convRate}%`, bg: 'bg-brand-50 border-brand-200',  text: 'text-brand-700' },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${s.bg}`}>
            <span className={`text-lg font-bold tabular-nums ${s.text}`}>{s.value}</span>
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-[#e4ebf5] bg-[#f8fafd]">
          {[
            { label: 'Stage',  value: fStage,  set: setFStage,  opts: [['ALL','All Stages'], ...STAGES.map((s) => [s.id, s.label])] },
            { label: 'Source', value: fSource, set: setFSource, opts: [['ALL','All Sources'], ...(Object.keys(SOURCE_META) as LeadSource[]).map((s) => [s, SOURCE_META[s].label])] },
            { label: 'Score',  value: fScore,  set: setFScore,  opts: [['ALL','All Scores'], ...(Object.keys(SCORE_META) as LeadScore[]).map((s) => [s, SCORE_META[s].label])] },
            { label: 'Staff',  value: fStaff,  set: setFStaff,  opts: [['ALL','All Staff'], ...uniqueStaff.map((s) => [s, s])] },
          ].map((f) => (
            <select key={f.label} value={f.value} onChange={(e) => (f.set as (v: string) => void)(e.target.value)}
              className="rounded-lg border border-[#dce8f7] bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-400"
            >
              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          {activeFilters > 0 && (
            <button onClick={() => { setFStage('ALL'); setFSource('ALL'); setFScore('ALL'); setFStaff('ALL') }}
              className="text-xs text-red-500 hover:text-red-700 font-semibold ml-1"
            >Clear all</button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} lead{filtered.length !== 1 ? 's' : ''} shown</span>
        </div>
      )}


      {/* ── Kanban board ── */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-3 min-w-max pb-4">
          {STAGES.map((col) => {
            const colLeads  = forStage(col.id)
            const isDragOver = dropCol === col.id
            return (
              <div key={col.id} className="flex flex-col w-60 shrink-0"
                onDragOver={(e) => { e.preventDefault(); setDropCol(col.id) }}
                onDragLeave={() => setDropCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column header */}
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2 mb-2 ${col.color}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${col.dot}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-wide truncate ${col.text}`}>{col.label}</span>
                  </div>
                  <span className={`ml-1.5 shrink-0 text-[11px] font-bold tabular-nums ${col.text}`}>{colLeads.length}</span>
                </div>

                {/* Card drop zone */}
                <div className={`flex-1 space-y-2 rounded-xl p-1.5 min-h-[200px] max-h-[calc(100vh-440px)] overflow-y-auto transition-all ${isDragOver ? 'bg-brand-50 ring-2 ring-brand-300 ring-dashed rounded-xl' : ''}`}>
                  {colLeads.length === 0 && !isDragOver && (
                    <div className="flex flex-col items-center gap-1.5 py-10">
                      <AlertCircle className="h-5 w-5 text-slate-200" />
                      <p className="text-[10px] text-slate-300">No leads here</p>
                    </div>
                  )}
                  {colLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead}
                      onClick={() => setSelected(lead)}
                      onDragStart={(e) => { setDraggingId(lead.id); e.dataTransfer.effectAllowed = 'move' }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Add lead modal ── */}
      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addLead} defaultStaff={staffName} />

      {/* ── Detail panel ── */}
      {selected && (
        <>
          <div className="fixed inset-0 z-[25] bg-[#0c1e3d]/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <DetailPanel
            lead={selected} activities={activities} followUps={followUps} staffName={staffName}
            onClose={() => setSelected(null)}
            onStageChange={moveTo}
            onAddActivity={addActivity}
            onAddFollowUp={addFu}
            onToggleFu={toggleFu}
          />
        </>
      )}
    </div>
  )
}
