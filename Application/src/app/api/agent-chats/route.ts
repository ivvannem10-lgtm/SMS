import { NextRequest, NextResponse } from 'next/server'
import { MOCK_AGENT_CHATS, nextChatNumber } from '@/lib/mock-data'
import type { AgentChat, ChatMessage, AgentChatDept } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const chats = userId
    ? MOCK_AGENT_CHATS.filter(c => c.userId === userId)
    : [...MOCK_AGENT_CHATS]
  return NextResponse.json(chats)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    userId: string; userName: string; userRole: string
    portal: 'staff' | 'teacher' | 'student'
    department: AgentChatDept; subject: string
  }
  const now = new Date().toISOString()
  const id  = `chat_${Date.now()}`
  const systemMsg: ChatMessage = {
    id: `cm_${Date.now()}_s`, chatId: id, senderType: 'SYSTEM',
    senderId: 'system', senderName: 'System',
    content: `Your message has been sent. A staff member will respond shortly.`,
    timestamp: now, isRead: true,
  }
  const chat: AgentChat = {
    id,
    chatNumber: nextChatNumber(),
    userId: body.userId,
    userName: body.userName,
    userRole: body.userRole,
    portal: body.portal,
    department: body.department,
    subject: body.subject,
    status: 'OPEN',
    messages: [systemMsg],
    createdAt: now,
    updatedAt: now,
  }
  MOCK_AGENT_CHATS.push(chat)
  return NextResponse.json(chat, { status: 201 })
}
