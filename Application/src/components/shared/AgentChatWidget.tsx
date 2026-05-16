'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, CheckCircle2, ChevronDown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentChat, ChatMessage, AgentChatDept } from '@/types'

interface AgentChatWidgetProps {
  userId: string
  userName: string
  userRole: string
  portal: 'staff' | 'teacher' | 'student'
}

const DEPT_OPTIONS: { value: AgentChatDept; label: string; desc: string }[] = [
  { value: 'REGISTRAR',   label: 'Registrar',          desc: 'Records, enrollment, documents' },
  { value: 'FINANCE',     label: 'Finance / Treasury',  desc: 'Payments, SOA, billing' },
  { value: 'ACADEMIC',    label: 'Academic Affairs',    desc: 'Subjects, offerings, grades' },
  { value: 'ADMISSIONS',  label: 'Admissions',          desc: 'Application, requirements' },
  { value: 'HR',          label: 'Human Resources',     desc: 'Leave, employment concerns' },
  { value: 'ASSETS',      label: 'Asset Management',    desc: 'Equipment, borrow requests' },
  { value: 'PURCHASING',  label: 'Purchasing',          desc: 'Purchase requests, vendors' },
  { value: 'GENERAL',     label: 'General Inquiry',     desc: 'Other concerns' },
]

function timestamp(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AgentChatWidget({ userId, userName, userRole, portal }: AgentChatWidgetProps) {
  const [open, setOpen]           = useState(false)
  const [phase, setPhase]         = useState<'select' | 'chat'>('select')
  const [dept, setDept]           = useState<AgentChatDept | null>(null)
  const [subject, setSubject]     = useState('')
  const [input, setInput]         = useState('')
  const [chatId, setChatId]       = useState<string | null>(null)
  const [chat, setChat]           = useState<AgentChat | null>(null)
  const [unread, setUnread]       = useState(0)
  const [sending, setSending]     = useState(false)
  const messagesEndRef            = useRef<HTMLDivElement>(null)
  const prevMsgCount              = useRef(0)

  // ── Poll the API for the current chat every 2 s ───────────────────────────
  const pollChat = useCallback(async (id: string, panelOpen: boolean) => {
    try {
      const res  = await fetch(`/api/agent-chats/${id}`, { cache: 'no-store' })
      if (!res.ok) return
      const live: AgentChat = await res.json()
      setChat(live)
      const agentMsgs = live.messages.filter(m => m.senderType === 'AGENT' && !m.isRead).length
      if (!panelOpen && agentMsgs > 0) setUnread(agentMsgs)
    } catch { /* ignore network errors */ }
  }, [])

  useEffect(() => {
    if (!chatId) return
    const t = setInterval(() => pollChat(chatId, open), 2000)
    return () => clearInterval(t)
  }, [chatId, open, pollChat])

  // scroll when new messages arrive
  useEffect(() => {
    const count = chat?.messages.length ?? 0
    if (count !== prevMsgCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      prevMsgCount.current = count
    }
  }, [chat?.messages.length])

  // clear badge when panel opens
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  async function startChat() {
    if (!dept || !subject.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/agent-chats', {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, userRole, portal, department: dept, subject: subject.trim() }),
      })
      if (!res.ok) return
      const newChat: AgentChat = await res.json()
      setChat(newChat)
      setChatId(newChat.id)
      setPhase('chat')
    } finally {
      setSending(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || !chatId || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`/api/agent-chats/${chatId}/messages`, {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType: 'USER', senderId: userId, senderName: userName, content: text }),
      })
      if (!res.ok) return
      const updated: AgentChat = await res.json()
      setChat(updated)
    } finally {
      setSending(false)
    }
  }

  function newChat() {
    setChatId(null)
    setChat(null)
    setPhase('select')
    setDept(null)
    setSubject('')
    setInput('')
  }

  const deptSelected = DEPT_OPTIONS.find(d => d.value === dept)
  const messages     = chat?.messages ?? []
  const chatStatus   = chat?.status ?? 'OPEN'

  return (
    <div className="fixed bottom-6 right-[88px] z-[998]">

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute bottom-[72px] right-0 w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: 520 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-teal-600 text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Talk to a Staff Member</p>
              <p className="text-xs text-teal-200 truncate">
                {chat?.agentName
                  ? `Connected with ${chat.agentName}`
                  : phase === 'chat'
                    ? 'Waiting for a staff member…'
                    : 'Select a department to begin'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-teal-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Phase: Department selection ── */}
          {phase === 'select' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Which department can help you?</p>
              <div className="space-y-1.5">
                {DEPT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDept(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                      dept === opt.value
                        ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-400'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50',
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full shrink-0', dept === opt.value ? 'bg-teal-500' : 'bg-slate-300')} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500 truncate">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {dept && (
                <div className="pt-2 space-y-2">
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startChat()}
                    placeholder="Briefly describe your concern…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                  <button
                    onClick={startChat}
                    disabled={!subject.trim() || sending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? 'Connecting…' : `Send to ${deptSelected?.label ?? 'Staff'}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Phase: Chat thread ── */}
          {phase === 'chat' && (
            <>
              {/* Subject bar */}
              <div className="px-4 py-2 bg-teal-50 border-b border-teal-100 shrink-0 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-teal-700 font-medium truncate max-w-[240px]">{subject}</p>
                  <p className="text-[10px] text-teal-500 font-mono">{chat?.chatNumber}</p>
                </div>
                {chatStatus !== 'RESOLVED' && chatStatus !== 'CLOSED' && (
                  <button onClick={newChat} className="text-xs text-teal-500 hover:text-teal-700 flex items-center gap-1 shrink-0 ml-2">
                    <ChevronDown className="w-3 h-3" /> New chat
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg: ChatMessage) => {
                  if (msg.senderType === 'SYSTEM') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full text-center">{msg.content}</span>
                      </div>
                    )
                  }
                  const isUser = msg.senderType === 'USER'
                  return (
                    <div key={msg.id} className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700 shrink-0 mt-0.5">
                          {msg.senderName.charAt(0)}
                        </div>
                      )}
                      <div className={cn('max-w-[75%] space-y-0.5', isUser && 'items-end flex flex-col')}>
                        {!isUser && <p className="text-[10px] text-slate-400 px-1">{msg.senderName}</p>}
                        <div className={cn(
                          'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                          isUser ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm',
                        )}>
                          {msg.content}
                        </div>
                        <p className={cn('text-[10px] text-slate-400 px-1', isUser && 'text-right')}>
                          {timestamp(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {chatStatus === 'OPEN' && messages.every((m: ChatMessage) => m.senderType !== 'AGENT') && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-xs">Waiting for a staff member to respond…</p>
                  </div>
                )}

                {(chatStatus === 'RESOLVED' || chatStatus === 'CLOSED') && (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <CheckCircle2 className="w-8 h-8 text-teal-500" />
                    <p className="text-sm font-semibold text-slate-700">
                      Conversation {chatStatus === 'RESOLVED' ? 'Resolved' : 'Closed'}
                    </p>
                    <button onClick={newChat} className="text-xs text-teal-600 hover:underline">Start a new conversation</button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {chatStatus !== 'RESOLVED' && chatStatus !== 'CLOSED' && (
                <div className="border-t border-slate-100 p-3 flex items-center gap-2 shrink-0">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type a message…"
                    disabled={sending}
                    className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="w-9 h-9 flex items-center justify-center bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Floating button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 relative group',
          open ? 'bg-teal-700 scale-95' : 'bg-teal-600 hover:bg-teal-700 hover:scale-105',
        )}
        title="Talk to a Staff Member"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <span className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Talk to a Staff Member
        </span>
      </button>
    </div>
  )
}
