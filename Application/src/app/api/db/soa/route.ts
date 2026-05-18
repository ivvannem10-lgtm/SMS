import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const studentId = searchParams.get('studentId')
    const semesterId = searchParams.get('semesterId')
    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId
    if (semesterId) where.semesterId = semesterId
    const soas = await db.sOA.findMany({
      where,
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(soas)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch SOAs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, ...soaData } = body
    const soa = await db.sOA.create({
      data: {
        ...soaData,
        ...(items && items.length > 0 ? { items: { create: items } } : {}),
      },
      include: { items: true },
    })
    return NextResponse.json(soa, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create SOA' }, { status: 500 })
  }
}
