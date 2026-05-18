import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const enrollmentId = searchParams.get('enrollmentId')
    const offeringId = searchParams.get('offeringId')
    const where: Record<string, unknown> = {}
    if (enrollmentId) where.enrollmentId = enrollmentId
    if (offeringId) where.enrollment = { offeringId }
    const grades = await db.grade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(grades)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { enrollmentId, ...data } = body
    const grade = await db.grade.upsert({
      where: { enrollmentId },
      create: { enrollmentId, ...data },
      update: data,
    })
    return NextResponse.json(grade, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to upsert grade' }, { status: 500 })
  }
}
