import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const semesterId = searchParams.get('semesterId')
    const where = semesterId ? { semesterId } : {}
    const offerings = await db.subjectOffering.findMany({
      where,
      include: {
        subject: true,
        schedules: true,
        assignments: { include: { faculty: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(offerings)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch offerings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { schedules, ...offeringData } = body
    const offering = await db.subjectOffering.create({
      data: {
        ...offeringData,
        ...(schedules && schedules.length > 0
          ? { schedules: { create: schedules } }
          : {}),
      },
      include: { schedules: true },
    })
    return NextResponse.json(offering, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create offering' }, { status: 500 })
  }
}
