import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function generateTicketNumber(): Promise<string> {
  const last = await db.supportTicket.findFirst({
    orderBy: { createdAt: 'desc' },
  })
  let seq = 1
  if (last) {
    const parts = last.ticketNumber.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  return `TKT-${String(seq).padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const portal = searchParams.get('portal')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    if (portal) where.portal = portal
    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tickets)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ticketNumber = await generateTicketNumber()
    const ticket = await db.supportTicket.create({ data: { ...body, ticketNumber } })
    return NextResponse.json(ticket, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
