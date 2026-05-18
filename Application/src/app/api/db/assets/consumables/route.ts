import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const consumables = await db.consumable.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(consumables)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch consumables' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const consumable = await db.consumable.create({ data: body })
    return NextResponse.json(consumable, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create consumable' }, { status: 500 })
  }
}
