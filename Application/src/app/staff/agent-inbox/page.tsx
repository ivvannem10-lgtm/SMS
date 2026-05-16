'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, CheckCircle2, Clock, User, Circle, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { MOCK_AGENTS } from '@/lib/mock-data'
import type { AgentChat, AgentChatStatus, AgentAvailability } from '@/types'

const STATUS_TABS: { value: AgentChatStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',      label: 'All' },
  { value: 'OPEN',     label: 'Open' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED',   label: 'Closed' },
]

function availabilityColor(a: AgentAvailability) {
  if (a === 'ONLINE') return 'bg-emerald-400'
  if (a === 'AWAY')   return 'bg-amber-400'
  return 'bg-slate-400'
}

function statusBadge(s: AgentChatStatus) {
  const map: Record<AgentChatStatus, string> = {
    OPEN:     'bg-blue-100 text-blue-700',
    ASSIGNED: 'bg-teal-100 text-teal-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    CLOSED:   'bg-slate-100 text-slate-600',
  }
  return map[s] ?? 'bg-slate-100 text-slate-600'
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function timestamp(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AgentInboxPage() {
  const { data: session } = useSession()
  const user   = session?.user as { id?: string; name?: string; role?: string } | undefined
  const myId   = user?.id   ?? 'u_superadmin'
  const myName = user?.name ?? 'Agent'

  const [tab, setTab]           = useState<AgentChatStatus | 'ALL'>('ALL')
  const [allChats, setAllChats] = useState<AgentChat[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<AgentChat | null>(null)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [myAvail, setMyAvail]   = useState<AgentAvailability>('ONLINE')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedIdRef  = useRef<string | null>(null)

  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  // ── Poll the API every 2 s ────────────────────────────────────────────────
  const pollAll = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-chats', { cache: 'no-store' })
      if (!res.ok) return
      const chats: AgentChat[] = await res.json()
      setAllChats(chats)

      // sync selected chat if messages or status changed
      const selId = selectedIdRef.current
      if (selId) {
        const live = chats.find(c => c.id === selId)
        if (live) {
          setSelected(prev => {
            if (
              prev?.messages.length === live.messages.length &&
              prev?.status === live.status &&
              prev?.agentName === live.agentName
            ) return prev
            return { ...live, messages: [...live.messages] }
          })
        }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    pollAll() // initial load
    const t = setInterval(pollAll, 2000)
    return () => clearInterval(t)
  }, [pollAll])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages.length])

  const myAgent = MOCK_AGENTS.find(a => a.id === myId)

  const chats = allChats.filter(c => tab === 'ALL' ? true : c.status === tab)
  const unreadCount = allChats.filter(c =>
    c.messages.some(m => !m.isRead && m.senderType !== 'AGENT')
  ).length

  async function selectChat(chat: AgentChat) {
    setSelectedId(chat.id)
    setSelected({ ...chat, messages: [...chat.messages] })
  }

  async function claimChat() {
    if (!selected) return
    const res = await fetch(`/api/agent-chats/${selected.id}`, {
      method: 'PATCH', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ASSIGNED', agentId: myId, agentName: myName,
        systemMessage: `Chat claimed by ${myName}.`,
      }),
    })
    if (!res.ok) return
    const updated: AgentChat = await res.json()
    setSelected(updated)
    await pollAll()
  }

  async function resolveChat() {
    if (!selected) return
    const res = await fetch(`/api/agent-chats/${selected.id}`, {
      method: 'PATCH', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'RESOLVED',
        systemMessage: 'This conversation has been marked as resolved.',
      }),
    })
    if (!res.ok) return
    const updated: AgentChat = await res.json()
    setSelected(updated)
    await pollAll()
  }

  async function closeChat() {
    if (!selected) return
    const res = await fetch(`/api/agent-chats/${selected.id}`, {
      method: 'PATCH', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CLOSED',
        systemMessage: 'This conversation has been closed.',
      }),
    })
    if (!res.ok) return
    const updated: AgentChat = await res.json()
    setSelected(updated)
    await pollAll()
  }

  async function sendReply() {
    if (!input.trim() || !selected || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`/api/agent-chats/${selected.id}/messages`, {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'AGENT', senderId: myId, senderName: myName,
          content: text, agentId: myId, agentName: myName,
        }),
      })
      if (!res.ok) return
      const updated: AgentChat = await res.json()
      setSelected(updated)
      await pollAll()
    } finally {
      setSending(false)
    }
  }

  function toggleAvailability() {
    const cycle: AgentAvailability[] = ['ONLINE', 'AWAY', 'OFFLINE']
    const next = cycle[(cycle.indexOf(myAvail) + 1) % 3]
    setMyAvail(next)
    if (myAgent) myAgent.availability = next
  }

  return (
    <div className="flex h-[calc(100vh-56px)] -m-6 overflow-hidden">

      {/* ── Left panel: chat list ─────────────────────────────────────────────── */}
      <div className="w-[320px] shrink-0 flex flex-col border-r border-slate-200 bg-white">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Agent Inbox</p>
            <p className="text-xs text-slate-500">{unreadCount} unread · {allChats.length} total</p>
          </div>
          <button
            onClick={toggleAvailability}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <div className={cn('w-2 h-2 rounded-full', availabilityColor(myAvail))} />
            {myAvail}
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-slate-100 px-2 pt-2 gap-0.5 overflow-x-auto">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors',
                tab === t.value
                  ? 'bg-teal-50 text-teal-700 border border-b-white border-teal-200'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {chats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">No conversations</p>
            </div>
          )}
          {chats.map(chat => {
            const lastMsg   = [...chat.messages].reverse().find(m => m.senderType !== 'SYSTEM')
            const hasUnread = chat.messages.some(m => !m.isRead && m.senderType !== 'AGENT')
            const isSel     = selectedId === chat.id
            return (
              <button
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={cn(
                  'w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors',
                  isSel && 'bg-teal-50 border-r-2 border-teal-500',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700 shrink-0">
                    {chat.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn('text-sm truncate', hasUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
                        {chat.userName}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">{relativeTime(chat.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{chat.subject}</p>
                    {lastMsg && (
                      <p className={cn('text-xs truncate mt-0.5', hasUnread ? 'text-slate-700 font-medium' : 'text-slate-400')}>
                        {lastMsg.senderType === 'USER' ? '' : 'You: '}{lastMsg.content}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', statusBadge(chat.status))}>
                        {chat.status}
                      </span>
                      <span className="text-[10px] text-slate-400">{chat.department}</span>
                      {hasUnread && <div className="ml-auto w-2 h-2 rounded-full bg-teal-500" />}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right panel: conversation ─────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-white min-w-0">

          {/* Conversation header */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800">{selected.userName}</p>
                <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold', statusBadge(selected.status))}>
                  {selected.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">{selected.chatNumber}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{selected.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              {selected.status === 'OPEN' && (
                <button onClick={claimChat}
                  className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                  Claim Chat
                </button>
              )}
              {selected.status === 'ASSIGNED' && (
                <button onClick={resolveChat}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                </button>
              )}
              {selected.status === 'RESOLVED' && (
                <button onClick={closeChat}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Info strip */}
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-500 shrink-0 flex-wrap">
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selected.userRole}</span>
            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> {selected.portal} portal</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selected.createdAt).toLocaleString()}</span>
            {selected.agentName && (
              <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> {selected.agentName}</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {selected.messages.map(msg => {
              if (msg.senderType === 'SYSTEM') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{msg.content}</span>
                  </div>
                )
              }
              const isAgent = msg.senderType === 'AGENT'
              return (
                <div key={msg.id} className={cn('flex gap-3', isAgent ? 'justify-end' : 'justify-start')}>
                  {!isAgent && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0 mt-0.5">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}
                  <div className={cn('max-w-[65%] space-y-1', isAgent && 'items-end flex flex-col')}>
                    <p className="text-[11px] text-slate-400 px-1">{msg.senderName}</p>
                    <div className={cn(
                      'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isAgent ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm',
                    )}>
                      {msg.content}
                    </div>
                    <p className={cn('text-[10px] text-slate-400 px-1', isAgent && 'text-right')}>{timestamp(msg.timestamp)}</p>
                  </div>
                  {isAgent && (
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700 shrink-0 mt-0.5">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input */}
          {(selected.status === 'OPEN' || selected.status === 'ASSIGNED') && (
            <div className="border-t border-slate-100 p-4 flex gap-3 shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Type a reply…"
                disabled={sending}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={sendReply}
                disabled={!input.trim() || sending}
                className="w-10 h-10 flex items-center justify-center bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
          <MessageCircle className="w-12 h-12 mb-3" />
          <p className="text-base font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose a chat from the list to view and reply</p>
        </div>
      )}
    </div>
  )
}
