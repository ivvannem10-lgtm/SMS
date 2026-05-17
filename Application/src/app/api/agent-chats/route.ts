import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

let _chatSeq = 1

async function nextChatNumber() {
  const last = await db.agentChat.findFirst({ orderBy: { createdAt: 'desc' } })
  if (last) {
    const n = parseInt(last.chatNumber.replace('CHAT-', ''), 10)
    _chatSeq = n + 1
  }
  return `CHAT-${String(_chatSeq++).padStart(3, '0')}`
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const chats = await db.agentChat.findMany({
    where: userId ? { userId } : undefined,
    include: { messages: { orderBy: { timestamp: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(chats)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const now = new Date()
  const chatNumber = await nextChatNumber()

  const chat = await db.agentChat.create({
    data: {
      chatNumber,
      userId: body.userId,
      userName: body.userName,
      userRole: body.userRole,
      portal: body.portal,
      department: body.department,
      subject: body.subject,
      status: 'OPEN',
      messages: {
        create: [{
          senderType: 'SYSTEM',
          senderId: 'system',
          senderName: 'System',
          content: `Your message has been sent to the ${body.department} department. A staff member will respond shortly.`,
          isRead: true,
          timestamp: now,
        }],
      },
    },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
  })

  return NextResponse.json(chat, { status: 201 })
}
