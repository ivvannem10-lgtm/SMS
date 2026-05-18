import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticket = await db.supportTicket.findUnique({ where: { id: params.id } })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const ticket = await db.supportTicket.update({ where: { id: params.id }, data: body })
    return NextResponse.json(ticket)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
