'use client'
import { useState, useReducer, useCallback } from 'react'
import {
  LifeBuoy, Plus, Search, ChevronRight, Star, ThumbsUp, ThumbsDown,
  Clock, AlertTriangle, CheckCircle2, XCircle, MessageSquare,
  ArrowLeft, Send, Lock, BookOpen, BarChart2, Inbox, LayoutDashboard,
  Tag, Eye, Filter, TrendingUp,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { MOCK_TICKETS, MOCK_KB_ARTICLES, nextTicketNumber } from '@/lib/mock-data'
import { formatDate, formatDateTime, initials } from '@/lib/utils'
import type {
  SupportTicket, TicketReply, TicketCategory, TicketDepartment,
  TicketStatus, TicketPriority, KBArticle,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportCenterProps {
  portal: 'staff' | 'teacher' | 'student'
  userId: string
  userName: string
  userRole: string
  agentDept?: TicketDepartment
}

// ─── Routing map ──────────────────────────────────────────────────────────────

const CATEGORY_ROUTING: Record<TicketCategory, { dept: TicketDepartment; agentRole: string; label: string }> = {
  ENROLLMENT_CONCERN:    { dept: 'REGISTRAR',   agentRole: 'REGISTRAR',           label: 'Enrollment Concern' },
  SUBJECT_CONCERN:       { dept: 'ACADEMIC',    agentRole: 'ACADEMIC_ADMIN',       label: 'Subject Concern' },
  GRADES_CONCERN:        { dept: 'ACADEMIC',    agentRole: 'ACADEMIC_ADMIN',       label: 'Grades Concern' },
  LMS_ACCESS_ISSUE:      { dept: 'ACADEMIC',    agentRole: 'ACADEMIC_ADMIN',       label: 'LMS Access Issue' },
  SCHEDULE_CONCERN:      { dept: 'ACADEMIC',    agentRole: 'ACADEMIC_ADMIN',       label: 'Schedule Concern' },
  TOR_INQUIRY:           { dept: 'REGISTRAR',   agentRole: 'REGISTRAR',           label: 'TOR Inquiry' },
  COR_CONCERN:           { dept: 'REGISTRAR',   agentRole: 'REGISTRAR',           label: 'COR Concern' },
  STUDENT_RECORDS:       { dept: 'REGISTRAR',   agentRole: 'REGISTRAR',           label: 'Student Records' },
  DOCUMENT_CONCERN:      { dept: 'REGISTRAR',   agentRole: 'REGISTRAR',           label: 'Document Concern' },
  PAYMENT_CONCERN:       { dept: 'TREASURY',    agentRole: 'TREASURER',           label: 'Payment Concern' },
  OR_INQUIRY:            { dept: 'TREASURY',    agentRole: 'TREASURER',           label: 'OR Inquiry' },
  BALANCE_CONCERN:       { dept: 'TREASURY',    agentRole: 'TREASURER',           label: 'Balance Concern' },
  LOGIN_ISSUE:           { dept: 'IT_SUPPORT',  agentRole: 'SUPER_ADMIN',         label: 'Login Issue' },
  PASSWORD_RESET:        { dept: 'IT_SUPPORT',  agentRole: 'SUPER_ADMIN',         label: 'Password Reset' },
  BUG_REPORT:            { dept: 'IT_SUPPORT',  agentRole: 'SUPER_ADMIN',         label: 'Bug Report' },
  TECHNICAL_ISSUE:       { dept: 'IT_SUPPORT',  agentRole: 'SUPER_ADMIN',         label: 'Technical Issue' },
  GENERAL_INQUIRY:       { dept: 'GENERAL',     agentRole: 'SUPER_ADMIN',         label: 'General Inquiry' },
  INSTITUTIONAL_CONCERN: { dept: 'GENERAL',     agentRole: 'SUPER_ADMIN',         label: 'Institutional Concern' },
  HR_CONCERN:            { dept: 'HR',          agentRole: 'HR_STAFF',            label: 'HR Concern' },
  ASSET_CONCERN:         { dept: 'AMO',         agentRole: 'AMO',                 label: 'Asset Concern' },
  PROCUREMENT_CONCERN:   { dept: 'PURCHASING',  agentRole: 'PURCHASING_OFFICER',  label: 'Procurement Concern' },
}

// ─── SLA helpers ──────────────────────────────────────────────────────────────

const SLA_HOURS: Record<TicketPriority, number> = { LOW: 48, MEDIUM: 24, HIGH: 8, CRITICAL: 1 }

function getSLAStatus(ticket: SupportTicket): 'ok' | 'warning' | 'breached' {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return 'ok'
  const deadline = new Date(ticket.slaDeadline).getTime()
  const now = Date.now()
  const remaining = deadline - now
  if (remaining < 0) return 'breached'
  if (remaining < SLA_HOURS[ticket.priority] * 3600000 * 0.25) return 'warning'
  return 'ok'
}

function getSLALabel(ticket: SupportTicket): string {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return 'SLA met'
  const deadline = new Date(ticket.slaDeadline).getTime()
  const now = Date.now()
  const remaining = deadline - now
  if (remaining < 0) {
    const hrs = Math.abs(Math.round(remaining / 3600000))
    return `BREACHED ${hrs}h ago`
  }
  const hrs = Math.round(remaining / 3600000)
  if (hrs < 1) return '< 1h left'
  return `${hrs}h left`
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN:             'bg-sky-50 text-sky-700 ring-sky-600/20',
  UNDER_REVIEW:     'bg-amber-50 text-amber-700 ring-amber-600/20',
  IN_PROGRESS:      'bg-violet-50 text-violet-700 ring-violet-600/20',
  WAITING_FOR_USER: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  ESCALATED:        'bg-red-50 text-red-700 ring-red-600/20',
  RESOLVED:         'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CLOSED:           'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open', UNDER_REVIEW: 'Under Review', IN_PROGRESS: 'In Progress',
  WAITING_FOR_USER: 'Waiting for User', ESCALATED: 'Escalated',
  RESOLVED: 'Resolved', CLOSED: 'Closed',
}

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  LOW:      'bg-slate-100 text-slate-600 ring-slate-500/20',
  MEDIUM:   'bg-blue-50 text-blue-700 ring-blue-600/20',
  HIGH:     'bg-amber-50 text-amber-700 ring-amber-600/20',
  CRITICAL: 'bg-red-50 text-red-700 ring-red-600/20',
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${PRIORITY_STYLES[priority]}`}>
      {priority}
    </span>
  )
}

function SLABadge({ ticket }: { ticket: SupportTicket }) {
  const status = getSLAStatus(ticket)
  const label = getSLALabel(ticket)
  if (status === 'ok' && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-500/20"><CheckCircle2 className="h-3 w-3" />{label}</span>
  }
  if (status === 'breached') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20"><XCircle className="h-3 w-3" />{label}</span>
  }
  if (status === 'warning') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"><AlertTriangle className="h-3 w-3" />{label}</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><Clock className="h-3 w-3" />{label}</span>
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e4ebf5] p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Category groups ──────────────────────────────────────────────────────────

const CATEGORY_GROUPS: { label: string; categories: TicketCategory[]; staffOnly?: boolean }[] = [
  {
    label: 'Student Support',
    categories: ['ENROLLMENT_CONCERN', 'SUBJECT_CONCERN', 'GRADES_CONCERN', 'LMS_ACCESS_ISSUE', 'SCHEDULE_CONCERN'],
  },
  {
    label: 'Registrar',
    categories: ['TOR_INQUIRY', 'COR_CONCERN', 'STUDENT_RECORDS', 'DOCUMENT_CONCERN'],
  },
  {
    label: 'Financial',
    categories: ['PAYMENT_CONCERN', 'OR_INQUIRY', 'BALANCE_CONCERN'],
  },
  {
    label: 'Technical',
    categories: ['LOGIN_ISSUE', 'PASSWORD_RESET', 'BUG_REPORT', 'TECHNICAL_ISSUE'],
  },
  {
    label: 'General',
    categories: ['GENERAL_INQUIRY', 'INSTITUTIONAL_CONCERN'],
  },
  {
    label: 'Internal',
    categories: ['HR_CONCERN', 'ASSET_CONCERN', 'PROCUREMENT_CONCERN'],
    staffOnly: true,
  },
]

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────

function TicketDetailModal({
  ticket,
  onClose,
  userId,
  userName,
  userRole,
  isAgent,
  forceUpdate,
}: {
  ticket: SupportTicket
  onClose: () => void
  userId: string
  userName: string
  userRole: string
  isAgent: boolean
  forceUpdate: () => void
}) {
  const [replyText, setReplyText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [satRating, setSatRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [satComment, setSatComment] = useState('')
  const [satSubmitted, setSatSubmitted] = useState(false)

  const isSubmitter = ticket.submittedBy === userId
  const canRate = isSubmitter && ticket.status === 'RESOLVED' && !ticket.satisfaction && !satSubmitted

  function sendReply() {
    if (!replyText.trim()) return
    const newReply: TicketReply = {
      id: `tr_${Date.now()}`,
      ticketId: ticket.id,
      authorId: userId,
      authorName: userName,
      authorRole: userRole,
      content: replyText.trim(),
      isInternal: isAgent ? isInternal : false,
      isStaff: isAgent,
      createdAt: new Date().toISOString(),
    }
    ticket.replies.push(newReply)
    if (isAgent && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date().toISOString()
    }
    ticket.updatedAt = new Date().toISOString()
    setReplyText('')
    setIsInternal(false)
    forceUpdate()
  }

  function changeStatus(newStatus: TicketStatus) {
    ticket.status = newStatus
    if (newStatus === 'RESOLVED') ticket.resolvedAt = new Date().toISOString()
    if (newStatus === 'CLOSED') ticket.closedAt = new Date().toISOString()
    ticket.updatedAt = new Date().toISOString()
    forceUpdate()
  }

  function submitSatisfaction() {
    if (!satRating) return
    ticket.satisfaction = {
      rating: satRating,
      comment: satComment.trim() || undefined,
      submittedAt: new Date().toISOString(),
    }
    setSatSubmitted(true)
    forceUpdate()
  }

  const visibleReplies = ticket.replies.filter(r => isAgent || !r.isInternal)

  const nextStatusActions: { label: string; status: TicketStatus; color: string }[] = (() => {
    if (!isAgent) return []
    switch (ticket.status) {
      case 'OPEN':
        return [{ label: 'Mark Under Review', status: 'UNDER_REVIEW', color: 'bg-amber-600 hover:bg-amber-700' }]
      case 'UNDER_REVIEW':
        return [
          { label: 'Mark In Progress', status: 'IN_PROGRESS', color: 'bg-violet-600 hover:bg-violet-700' },
          { label: 'Request More Info', status: 'WAITING_FOR_USER', color: 'bg-orange-600 hover:bg-orange-700' },
        ]
      case 'IN_PROGRESS':
        return [{ label: 'Mark Resolved', status: 'RESOLVED', color: 'bg-emerald-600 hover:bg-emerald-700' }]
      case 'WAITING_FOR_USER':
        return [{ label: 'Mark In Progress', status: 'IN_PROGRESS', color: 'bg-violet-600 hover:bg-violet-700' }]
      case 'ESCALATED':
        return [{ label: 'Mark In Progress', status: 'IN_PROGRESS', color: 'bg-violet-600 hover:bg-violet-700' }]
      case 'RESOLVED':
        return [{ label: 'Close Ticket', status: 'CLOSED', color: 'bg-slate-600 hover:bg-slate-700' }]
      default:
        return []
    }
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-brand-900/50 pt-6 pb-6 px-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-l-[3px] border-[#1a4a8a] px-6 py-4 flex items-start justify-between border-b border-[#e4ebf5] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-500">{ticket.ticketNumber}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-base font-bold text-slate-900">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="ml-4 text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left sidebar: metadata */}
          <div className="w-52 flex-shrink-0 border-r border-[#e4ebf5] p-4 overflow-y-auto space-y-3">
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-brand-700 mb-1">Department</p>
              <p className="text-xs text-slate-700">{ticket.department.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-brand-700 mb-1">Category</p>
              <p className="text-xs text-slate-700">{CATEGORY_ROUTING[ticket.category]?.label ?? ticket.category}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-brand-700 mb-1">Submitted By</p>
              <p className="text-xs text-slate-700">{ticket.submittedByName}</p>
              <p className="text-2xs text-slate-400">{ticket.submittedByRole}</p>
            </div>
            {ticket.assignedToName && (
              <div>
                <p className="text-2xs font-bold uppercase tracking-widest text-brand-700 mb-1">Assigned To</p>
                <p className="text-xs text-slate-700">{ticket.assignedToName}</p>
              </div>
            )}
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-brand-700 mb-1">Created</p>
              <p className="text-xs text-slate-700">{formatDateTime(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-widest text-brand-700 mb-1">SLA</p>
              <SLABadge ticket={ticket} />
            </div>
            {ticket.tags && ticket.tags.length > 0 && (
              <div>
                <p className="text-2xs font-bold uppercase tracking-widest text-brand-700 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {ticket.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-[#f0f4fa] px-1.5 py-0.5 text-2xs text-brand-700">
                      <Tag className="h-2.5 w-2.5" />{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main: conversation */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {visibleReplies.map((reply, idx) => {
                if (reply.isInternal) {
                  return (
                    <div key={reply.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lock className="h-3 w-3 text-amber-600" />
                        <span className="text-2xs font-bold text-amber-700">Internal Note</span>
                        <span className="ml-auto text-2xs text-amber-600">{formatDateTime(reply.createdAt)}</span>
                      </div>
                      <p className="text-xs text-amber-800">{reply.content}</p>
                      <p className="text-2xs text-amber-600 mt-1">{reply.authorName}</p>
                    </div>
                  )
                }
                const isOwnMessage = reply.authorId === userId
                return (
                  <div key={reply.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isOwnMessage && (
                      <div className="h-7 w-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 text-2xs font-bold text-white">
                        {initials(reply.authorName)}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      {!isOwnMessage && idx === 0 && (
                        <p className="text-2xs text-slate-500 px-1">{reply.authorName} · {reply.authorRole}</p>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isOwnMessage
                          ? 'bg-brand-500 text-white rounded-br-sm'
                          : 'bg-[#f3f6fb] text-slate-800 rounded-bl-sm border border-[#e4ebf5]'
                      }`}>
                        {reply.content}
                      </div>
                      <p className="text-2xs text-slate-400 px-1">{formatDateTime(reply.createdAt)}</p>
                    </div>
                  </div>
                )
              })}

              {/* Satisfaction rating */}
              {canRate && (
                <div className="border border-[#e4ebf5] rounded-xl p-4 bg-[#f3f6fb]">
                  <p className="text-sm font-semibold text-slate-700 mb-2">How was your experience?</p>
                  <div className="flex gap-1 mb-3">
                    {([1, 2, 3, 4, 5] as const).map(r => (
                      <button key={r} onClick={() => setSatRating(r)}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${satRating && satRating >= r ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}>
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={satComment}
                    onChange={e => setSatComment(e.target.value)}
                    placeholder="Optional comment..."
                    rows={2}
                    className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/15 mb-2"
                  />
                  <button onClick={submitSatisfaction} disabled={!satRating}
                    className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold disabled:opacity-40 hover:bg-brand-600 transition-colors">
                    Submit Rating
                  </button>
                </div>
              )}

              {satSubmitted && (
                <div className="text-center text-sm text-emerald-600 font-medium py-2">
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  Thank you for your feedback!
                </div>
              )}
            </div>

            {/* Reply box */}
            {ticket.status !== 'CLOSED' && (
              <div className="border-t border-[#e4ebf5] p-4 flex-shrink-0">
                {isAgent && (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="internal-note"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[#dce8f7] text-brand-500"
                    />
                    <label htmlFor="internal-note" className="text-xs text-slate-600 flex items-center gap-1">
                      <Lock className="h-3 w-3 text-amber-500" /> Internal note (not visible to submitter)
                    </label>
                  </div>
                )}
                <div className={`flex gap-2 ${isInternal ? 'bg-amber-50 rounded-xl p-2 border border-amber-200' : ''}`}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={isInternal ? 'Write an internal note…' : 'Write a reply…'}
                    rows={2}
                    className="flex-1 rounded-lg border border-[#dce8f7] px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                  />
                  <button onClick={sendReply} disabled={!replyText.trim()}
                    className="self-end px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold disabled:opacity-40 hover:bg-brand-600 transition-colors flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: agent actions */}
        {nextStatusActions.length > 0 && (
          <div className="border-t border-[#e4ebf5] px-6 py-3 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 mr-2">Actions:</span>
            {nextStatusActions.map(action => (
              <button
                key={action.status}
                onClick={() => changeStatus(action.status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${action.color}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── KB Article Modal ─────────────────────────────────────────────────────────

function KBArticleModal({ article, onClose }: { article: KBArticle; onClose: () => void }) {
  const [voted, setVoted] = useState<'helpful' | 'not' | null>(null)

  function vote(type: 'helpful' | 'not') {
    if (voted) return
    if (type === 'helpful') article.helpful++
    else article.notHelpful++
    article.views++
    setVoted(type)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-brand-900/50 pt-8 pb-8 px-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <div className="border-l-[3px] border-[#1a4a8a] px-6 py-4 flex items-start justify-between border-b border-[#e4ebf5]">
          <div>
            <span className="text-2xs font-bold uppercase tracking-widest text-brand-700 bg-[#f0f4fa] px-2 py-0.5 rounded-full">{article.category}</span>
            <h2 className="text-base font-bold text-slate-900 mt-1">{article.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Updated {formatDate(article.updatedAt)} · {article.views} views</p>
          </div>
          <button onClick={onClose} className="ml-4 text-slate-400 hover:text-slate-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{article.content}</div>
          <div className="mt-6 pt-4 border-t border-[#e4ebf5] flex items-center gap-4">
            <p className="text-xs text-slate-500">Was this helpful?</p>
            <button
              onClick={() => vote('helpful')}
              disabled={!!voted}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${voted === 'helpful' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-[#dce8f7] text-slate-600 hover:bg-[#f3f6fb]'}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" /> Yes ({article.helpful})
            </button>
            <button
              onClick={() => vote('not')}
              disabled={!!voted}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${voted === 'not' ? 'bg-red-50 border-red-300 text-red-700' : 'border-[#dce8f7] text-slate-600 hover:bg-[#f3f6fb]'}`}
            >
              <ThumbsDown className="h-3.5 w-3.5" /> No ({article.notHelpful})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SupportCenter({ portal, userId, userName, userRole, agentDept }: SupportCenterProps) {
  const isAgent = !!agentDept
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  // Tabs
  type TabId = 'dashboard' | 'kb' | 'my-tickets' | 'inbox' | 'create' | 'analytics'
  const studentTabs: TabId[] = ['dashboard', 'kb', 'my-tickets', 'create']
  const agentTabs: TabId[] = ['dashboard', 'my-tickets', 'inbox', 'create', 'kb', 'analytics']
  const teacherTabs: TabId[] = ['dashboard', 'my-tickets', 'create', 'kb']
  const tabs = portal === 'student' ? studentTabs : isAgent ? agentTabs : teacherTabs
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0])

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null)

  // Create ticket wizard
  const [createStep, setCreateStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null)
  const [createSubject, setCreateSubject] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createPriority, setCreatePriority] = useState<TicketPriority>('MEDIUM')
  const [newTicketNumber, setNewTicketNumber] = useState('')

  // Filter states (inbox)
  const [inboxStatus, setInboxStatus] = useState<TicketStatus | 'ALL'>('ALL')
  const [inboxPriority, setInboxPriority] = useState<TicketPriority | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // KB states
  const [kbSearch, setKbSearch] = useState('')
  const [kbCategory, setKbCategory] = useState<string>('All')

  const myTickets = MOCK_TICKETS.filter(t => t.submittedBy === userId)
  const deptTickets = agentDept ? MOCK_TICKETS.filter(t => t.department === agentDept) : []

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  // ── Tab Labels ────────────────────────────────────────────────────────────

  const TAB_META: Record<TabId, { label: string; icon: React.ElementType }> = {
    dashboard:    { label: 'Dashboard',      icon: LayoutDashboard },
    kb:           { label: 'Knowledge Base', icon: BookOpen },
    'my-tickets': { label: 'My Tickets',     icon: MessageSquare },
    inbox:        { label: 'Inbox',          icon: Inbox },
    create:       { label: 'Create Ticket',  icon: Plus },
    analytics:    { label: 'Analytics',      icon: BarChart2 },
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resetCreate = useCallback(() => {
    setCreateStep(1)
    setSelectedCategory(null)
    setCreateSubject('')
    setCreateDescription('')
    setCreatePriority('MEDIUM')
    setNewTicketNumber('')
  }, [])

  function submitTicket() {
    if (!selectedCategory) return
    const routing = CATEGORY_ROUTING[selectedCategory]
    const createdAt = new Date().toISOString()
    const tktNum = nextTicketNumber()
    const hours = SLA_HOURS[createPriority]
    const slaD = new Date(createdAt)
    slaD.setHours(slaD.getHours() + hours)

    const newTicket: SupportTicket = {
      id: `tkt_${Date.now()}`,
      ticketNumber: tktNum,
      subject: createSubject,
      description: createDescription,
      category: selectedCategory,
      department: routing.dept,
      status: 'OPEN',
      priority: createPriority,
      submittedBy: userId,
      submittedByName: userName,
      submittedByRole: userRole,
      portal,
      replies: [
        {
          id: `tr_${Date.now()}`,
          ticketId: `tkt_${Date.now()}`,
          authorId: userId,
          authorName: userName,
          authorRole: userRole,
          content: createDescription,
          isInternal: false,
          isStaff: isAgent,
          createdAt,
        },
      ],
      slaDeadline: slaD.toISOString(),
      schoolId: 'school_1',
      createdAt,
      updatedAt: createdAt,
    }

    MOCK_TICKETS.push(newTicket)
    setNewTicketNumber(tktNum)
    setCreateStep(3)
    forceUpdate()
  }

  // ── Filtered KB ───────────────────────────────────────────────────────────

  const kbCategories = ['All', ...Array.from(new Set(MOCK_KB_ARTICLES.map(a => a.category)))]
  const filteredArticles = MOCK_KB_ARTICLES.filter(a => {
    const matchCat = kbCategory === 'All' || a.category === kbCategory
    const matchSearch = !kbSearch || a.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(kbSearch.toLowerCase()))
    return matchCat && matchSearch
  })

  // ── Filtered inbox ────────────────────────────────────────────────────────

  const filteredInbox = deptTickets.filter(t => {
    const matchStatus = inboxStatus === 'ALL' || t.status === inboxStatus
    const matchPriority = inboxPriority === 'ALL' || t.priority === inboxPriority
    const matchSearch = !searchQuery || t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchPriority && matchSearch
  })

  // ── SLA breach alerts ─────────────────────────────────────────────────────

  const breachedTickets = deptTickets.filter(t => getSLAStatus(t) === 'breached')
  const criticalHighOpen = deptTickets.filter(t =>
    (t.priority === 'CRITICAL' || t.priority === 'HIGH') && (t.status === 'OPEN' || t.status === 'UNDER_REVIEW'))

  // ── Analytics data ────────────────────────────────────────────────────────

  const statusCounts: Record<string, number> = {}
  const deptCounts: Record<string, number> = {}
  MOCK_TICKETS.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
    deptCounts[t.department] = (deptCounts[t.department] || 0) + 1
  })

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status as TicketStatus] ?? status,
    count,
  }))

  const deptChartData = Object.entries(deptCounts).map(([dept, count]) => ({
    name: dept.replace('_', ' '),
    value: count,
  }))

  const PIE_COLORS = ['#1a4a8a', '#163d73', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff']

  const recentSatisfaction = MOCK_TICKETS.filter(t => t.satisfaction).slice(-5)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-brand-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Support Center</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isAgent ? `Managing ${agentDept?.replace('_', ' ')} tickets` : 'Submit and track your support tickets'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { resetCreate(); setActiveTab('create') }}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e4ebf5] pb-0">
        {tabs.map(tab => {
          const meta = TAB_META[tab]
          const Icon = meta.icon
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                active
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={isAgent ? 'Dept Open Tickets' : 'My Open Tickets'}
              value={(isAgent ? deptTickets : myTickets).filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'UNDER_REVIEW').length}
              icon={MessageSquare}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Pending Response"
              value={(isAgent ? deptTickets : myTickets).filter(t => t.status === 'WAITING_FOR_USER').length}
              icon={Clock}
              color="bg-amber-50 text-amber-600"
            />
            <StatCard
              label="Resolved This Month"
              value={(isAgent ? deptTickets : myTickets).filter(t => {
                if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false
                if (!t.resolvedAt) return false
                const d = new Date(t.resolvedAt)
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear
              }).length}
              icon={CheckCircle2}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Avg Response Time"
              value={(() => {
                const responded = (isAgent ? deptTickets : myTickets).filter(t => t.firstResponseAt)
                if (!responded.length) return 'N/A'
                const avgMs = responded.reduce((sum, t) => {
                  return sum + (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime())
                }, 0) / responded.length
                const hrs = Math.round(avgMs / 3600000)
                return `${hrs}h`
              })()}
              icon={TrendingUp}
              color="bg-violet-50 text-violet-600"
            />
          </div>

          {/* Agent: SLA breach alerts */}
          {isAgent && breachedTickets.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-bold text-red-700">SLA Breach Alerts ({breachedTickets.length})</span>
              </div>
              <div className="space-y-2">
                {breachedTickets.map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-200">
                    <div>
                      <span className="text-xs font-mono text-red-500">{t.ticketNumber}</span>
                      <span className="ml-2 text-xs font-medium text-slate-700">{t.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={t.priority} />
                      <button onClick={() => setSelectedTicket(t)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold">View →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent: Priority queue */}
          {isAgent && criticalHighOpen.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e4ebf5]">
              <div className="px-4 py-3 border-b border-[#dce8f7] bg-[#f0f4fa]">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Priority Queue — Critical & High</p>
              </div>
              <div className="divide-y divide-[#e4ebf5]">
                {criticalHighOpen.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f3f6fb] cursor-pointer" onClick={() => setSelectedTicket(t)}>
                    <PriorityBadge priority={t.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{t.subject}</p>
                      <p className="text-2xs text-slate-400">{t.ticketNumber} · {t.submittedByName}</p>
                    </div>
                    <SLABadge ticket={t} />
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User: recent tickets */}
          {!isAgent && (
            <div className="bg-white rounded-xl border border-[#e4ebf5]">
              <div className="px-4 py-3 border-b border-[#dce8f7] bg-[#f0f4fa] flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Recent Tickets</p>
                <button onClick={() => setActiveTab('my-tickets')} className="text-xs text-brand-600 hover:text-brand-800 font-semibold">View all →</button>
              </div>
              {myTickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No tickets yet. Create your first ticket.</div>
              ) : (
                <div className="divide-y divide-[#e4ebf5]">
                  {myTickets.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f3f6fb] cursor-pointer" onClick={() => setSelectedTicket(t)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{t.subject}</p>
                        <p className="text-2xs text-slate-400">{t.ticketNumber} · {formatDate(t.createdAt)}</p>
                      </div>
                      <StatusBadge status={t.status} />
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── KNOWLEDGE BASE ────────────────────────────────────────────────── */}
      {activeTab === 'kb' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={kbSearch}
                onChange={e => setKbSearch(e.target.value)}
                placeholder="Search knowledge base..."
                className="w-full rounded-xl border border-[#dce8f7] pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {kbCategories.map(cat => (
              <button key={cat} onClick={() => setKbCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${kbCategory === cat ? 'bg-brand-500 text-white' : 'bg-[#f0f4fa] text-brand-700 hover:bg-[#dce8f7]'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map(article => {
              const total = article.helpful + article.notHelpful
              const pct = total ? Math.round((article.helpful / total) * 100) : 0
              return (
                <div key={article.id} className="bg-white rounded-xl border border-[#e4ebf5] p-4 hover:border-brand-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xs font-bold uppercase tracking-widest text-brand-700 bg-[#f0f4fa] px-2 py-0.5 rounded-full">{article.category}</span>
                    <span className="text-2xs text-slate-400 flex items-center gap-1"><Eye className="h-3 w-3" />{article.views}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{article.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-2xs bg-[#f3f6fb] text-slate-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
                      <span>Helpful</span><span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => { article.views++; setSelectedArticle(article) }}
                    className="w-full rounded-lg border border-brand-500 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    Read Article
                  </button>
                </div>
              )
            })}
            {filteredArticles.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400 text-sm">No articles found.</div>
            )}
          </div>
        </div>
      )}

      {/* ── MY TICKETS ────────────────────────────────────────────────────── */}
      {activeTab === 'my-tickets' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search my tickets..."
              className="w-full rounded-xl border border-[#dce8f7] pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
          {myTickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e4ebf5] p-12 text-center">
              <LifeBuoy className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">No tickets yet</p>
              <p className="text-xs text-slate-400 mt-1">Create a ticket to get support from our team.</p>
              <button onClick={() => { resetCreate(); setActiveTab('create') }}
                className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
                Create Ticket
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e4ebf5] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">SLA</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4ebf5]">
                  {myTickets
                    .filter(t => !searchQuery || t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(t => (
                      <tr key={t.id} className="hover:bg-[#f3f6fb] cursor-pointer" onClick={() => setSelectedTicket(t)}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.ticketNumber}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-[200px] truncate">{t.subject}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><SLABadge ticket={t} /></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-slate-300" /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── INBOX (agent only) ────────────────────────────────────────────── */}
      {activeTab === 'inbox' && isAgent && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inbox..."
                className="w-full rounded-xl border border-[#dce8f7] pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={inboxStatus}
                onChange={e => setInboxStatus(e.target.value as TicketStatus | 'ALL')}
                className="rounded-xl border border-[#dce8f7] px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              >
                <option value="ALL">All Status</option>
                {(['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'WAITING_FOR_USER', 'ESCALATED', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <select
                value={inboxPriority}
                onChange={e => setInboxPriority(e.target.value as TicketPriority | 'ALL')}
                className="rounded-xl border border-[#dce8f7] px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              >
                <option value="ALL">All Priority</option>
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as TicketPriority[]).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredInbox.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e4ebf5] p-12 text-center text-sm text-slate-400">
              No tickets found for {agentDept?.replace('_', ' ')}.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e4ebf5] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Submitter</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">SLA</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4ebf5]">
                  {filteredInbox.map(t => (
                    <tr key={t.id} className="hover:bg-[#f3f6fb] cursor-pointer" onClick={() => setSelectedTicket(t)}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.ticketNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-[180px] truncate">{t.subject}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{t.submittedByName}</p>
                          <p className="text-2xs text-slate-400">{t.submittedByRole}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><SLABadge ticket={t} /></td>
                      <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-slate-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE TICKET ─────────────────────────────────────────────────── */}
      {activeTab === 'create' && (
        <div className="max-w-2xl">
          {createStep === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">Step 1 of 2 — Select a category</p>
                <p className="text-xs text-slate-500">Choose the topic that best describes your concern.</p>
              </div>
              {CATEGORY_GROUPS.filter(g => !g.staffOnly || portal !== 'student').map(group => (
                <div key={group.label}>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-700 mb-2">{group.label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setCreateStep(2) }}
                        className="flex items-center justify-between rounded-xl border border-[#e4ebf5] bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-brand-300 hover:bg-[#f3f6fb] transition-colors text-left"
                      >
                        <span>{CATEGORY_ROUTING[cat].label}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {createStep === 2 && selectedCategory && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button onClick={() => setCreateStep(1)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <span className="text-sm font-bold text-slate-700">Step 2 of 2 — Ticket Details</span>
              </div>
              <div className="bg-[#f0f4fa] rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs font-bold text-brand-700">Category:</span>
                <span className="text-xs text-slate-700">{CATEGORY_ROUTING[selectedCategory].label}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-xs font-bold text-brand-700">Dept:</span>
                <span className="text-xs text-slate-700">{CATEGORY_ROUTING[selectedCategory].dept.replace('_', ' ')}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
                <input
                  value={createSubject}
                  onChange={e => setCreateSubject(e.target.value)}
                  placeholder="Brief summary of your concern..."
                  className="w-full rounded-xl border border-[#dce8f7] px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  placeholder="Describe your concern in detail (minimum 20 characters)..."
                  rows={5}
                  className="w-full rounded-xl border border-[#dce8f7] px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none"
                />
                <p className="text-2xs text-slate-400 mt-1">{createDescription.length} / 20 characters minimum</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
                <select
                  value={createPriority}
                  onChange={e => setCreatePriority(e.target.value as TicketPriority)}
                  className="w-full rounded-xl border border-[#dce8f7] px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                >
                  <option value="LOW">Low — 48 hour SLA</option>
                  <option value="MEDIUM">Medium — 24 hour SLA</option>
                  <option value="HIGH">High — 8 hour SLA</option>
                  <option value="CRITICAL">Critical — 1 hour SLA</option>
                </select>
              </div>
              <div className="rounded-xl border border-[#e4ebf5] bg-[#f3f6fb] px-4 py-3">
                <p className="text-xs text-slate-500">Attachments: File upload will be available in a future update. For now, include links or describe the issue in the description field.</p>
              </div>
              <button
                onClick={submitTicket}
                disabled={!createSubject.trim() || createDescription.length < 20}
                className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors disabled:opacity-40"
              >
                Submit Ticket
              </button>
            </div>
          )}

          {createStep === 3 && (
            <div className="bg-white rounded-xl border border-[#e4ebf5] p-8 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Ticket Submitted!</h3>
              <p className="text-sm text-slate-500 mb-4">Your ticket has been received and routed to the appropriate department.</p>
              <div className="bg-[#f3f6fb] rounded-xl px-6 py-4 mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Ticket Number</span>
                  <span className="font-mono text-sm font-bold text-brand-700">{newTicketNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Priority</span>
                  <PriorityBadge priority={createPriority} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Est. Response</span>
                  <span className="text-xs font-semibold text-slate-700">Within {SLA_HOURS[createPriority]} hours</span>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { resetCreate(); setActiveTab('my-tickets') }}
                  className="px-4 py-2 rounded-xl border border-[#dce8f7] text-sm font-semibold text-slate-600 hover:bg-[#f3f6fb] transition-colors"
                >
                  View My Ticket
                </button>
                <button
                  onClick={resetCreate}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS (agent only) ────────────────────────────────────────── */}
      {activeTab === 'analytics' && isAgent && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status distribution */}
            <div className="bg-white rounded-xl border border-[#e4ebf5] p-5">
              <p className="text-sm font-bold text-slate-700 mb-4">Ticket Volume by Status</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a4a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Department distribution */}
            <div className="bg-white rounded-xl border border-[#e4ebf5] p-5">
              <p className="text-sm font-bold text-slate-700 mb-4">Tickets by Department</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deptChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {deptChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Satisfaction ratings */}
          <div className="bg-white rounded-xl border border-[#e4ebf5]">
            <div className="px-4 py-3 border-b border-[#dce8f7] bg-[#f0f4fa]">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Recent Satisfaction Ratings</p>
            </div>
            {recentSatisfaction.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No satisfaction ratings yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dce8f7]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Comment</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-brand-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4ebf5]">
                  {recentSatisfaction.map(t => (
                    <tr key={t.id} className="hover:bg-[#f3f6fb]">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.ticketNumber}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700 max-w-[150px] truncate">{t.subject}</td>
                      <td className="px-4 py-3">
                        <div className="flex">
                          {([1, 2, 3, 4, 5] as const).map(r => (
                            <Star key={r} className={`h-4 w-4 ${(t.satisfaction?.rating ?? 0) >= r ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{t.satisfaction?.comment ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.satisfaction?.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          userId={userId}
          userName={userName}
          userRole={userRole}
          isAgent={isAgent}
          forceUpdate={forceUpdate}
        />
      )}
      {selectedArticle && (
        <KBArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  )
}
