import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json() as {
    senderType: string; senderId: string; senderName: string; content: string
    agentId?: string; agentName?: string
  }

  // auto-assign if staff replies to an OPEN chat
  const isAgent = body.senderType === 'AGENT'
  const chat = await db.agentChat.findUnique({ where: { id: params.id } })
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const shouldAssign = isAgent && chat.status === 'OPEN'

  const updated = await db.agentChat.update({
    where: { id: params.id },
    data: {
      updatedAt: new Date(),
      ...(shouldAssign && {
        status:    'ASSIGNED',
        agentId:   body.agentId   ?? body.senderId,
        agentName: body.agentName ?? body.senderName,
      }),
      messages: {
        create: [{
          senderType: body.senderType,
          senderId:   body.senderId,
          senderName: body.senderName,
          content:    body.content,
          isRead:     isAgent, // agent messages start read; user messages unread for staff
        }],
      },
    },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
  })

  return NextResponse.json(updated, { status: 201 })
}
