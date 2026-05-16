import { NextRequest, NextResponse } from 'next/server'
import { MOCK_AGENT_CHATS } from '@/lib/mock-data'
import type { ChatMessage, ChatSenderType } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const chat = MOCK_AGENT_CHATS.find(c => c.id === params.id)
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as {
    senderType: ChatSenderType; senderId: string; senderName: string; content: string
    agentId?: string; agentName?: string
  }

  const now = new Date().toISOString()
  const msg: ChatMessage = {
    id: `cm_${Date.now()}`, chatId: chat.id,
    senderType: body.senderType,
    senderId: body.senderId,
    senderName: body.senderName,
    content: body.content,
    timestamp: now,
    isRead: body.senderType === 'AGENT', // agent messages start as read; user messages start unread for staff
  }
  chat.messages.push(msg)
  chat.updatedAt = now

  // auto-assign if staff replies to an OPEN chat
  if (body.senderType === 'AGENT' && chat.status === 'OPEN') {
    chat.status    = 'ASSIGNED'
    chat.agentId   = body.agentId ?? body.senderId
    chat.agentName = body.agentName ?? body.senderName
  }

  return NextResponse.json({ ...chat, messages: [...chat.messages] }, { status: 201 })
}
