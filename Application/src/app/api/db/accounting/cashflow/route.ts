import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const entries = await db.cashflowEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(entries)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch cashflow entries' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entry = await db.cashflowEntry.create({ data: body })
    return NextResponse.json(entry, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create cashflow entry' }, { status: 500 })
  }
}
