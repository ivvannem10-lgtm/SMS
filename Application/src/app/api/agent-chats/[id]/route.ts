import { NextRequest, NextResponse } from 'next/server'
import { MOCK_AGENT_CHATS } from '@/lib/mock-data'
import type { ChatMessage } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const chat = MOCK_AGENT_CHATS.find(c => c.id === params.id)
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...chat, messages: [...chat.messages] })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const chat = MOCK_AGENT_CHATS.find(c => c.id === params.id)
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as {
    status?: string; agentId?: string; agentName?: string; systemMessage?: string
  }

  if (body.status)    chat.status    = body.status as typeof chat.status
  if (body.agentId)   chat.agentId   = body.agentId
  if (body.agentName) chat.agentName = body.agentName
  chat.updatedAt = new Date().toISOString()

  if (body.systemMessage) {
    const sys: ChatMessage = {
      id: `cm_${Date.now()}_sys`, chatId: chat.id, senderType: 'SYSTEM',
      senderId: 'system', senderName: 'System',
      content: body.systemMessage,
      timestamp: chat.updatedAt, isRead: true,
    }
    chat.messages.push(sys)
  }

  return NextResponse.json({ ...chat, messages: [...chat.messages] })
}
