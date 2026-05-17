import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const chat = await db.agentChat.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
  })
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(chat)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json() as {
    status?: string; agentId?: string; agentName?: string; systemMessage?: string
  }

  const chat = await db.agentChat.update({
    where: { id: params.id },
    data: {
      ...(body.status    && { status:    body.status }),
      ...(body.agentId   && { agentId:   body.agentId }),
      ...(body.agentName && { agentName: body.agentName }),
      updatedAt: new Date(),
      ...(body.systemMessage && {
        messages: {
          create: [{
            senderType: 'SYSTEM',
            senderId: 'system',
            senderName: 'System',
            content: body.systemMessage,
            isRead: true,
          }],
        },
      }),
    },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
  })

  return NextResponse.json(chat)
}
