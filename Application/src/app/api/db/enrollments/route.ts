import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const studentId = searchParams.get('studentId')
    const semesterId = searchParams.get('semesterId')
    const offeringId = searchParams.get('offeringId')
    const where: Record<string, unknown> = {}
    if (studentId) where.studentId = studentId
    if (semesterId) where.semesterId = semesterId
    if (offeringId) where.offeringId = offeringId
    const enrollments = await db.enrollment.findMany({
      where,
      include: {
        offering: { include: { subject: true } },
        student: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(enrollments)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const enrollment = await db.enrollment.create({ data: body })
    return NextResponse.json(enrollment, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }
}
