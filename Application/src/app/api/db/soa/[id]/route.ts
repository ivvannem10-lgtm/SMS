import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const soa = await db.sOA.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    })
    if (!soa) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(soa)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch SOA' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const soa = await db.sOA.update({ where: { id: params.id }, data: body })
    return NextResponse.json(soa)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update SOA' }, { status: 500 })
  }
}
