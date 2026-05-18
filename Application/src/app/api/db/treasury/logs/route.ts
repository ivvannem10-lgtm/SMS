import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const studentId = searchParams.get('studentId')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (studentId) where.studentId = studentId
    const logs = await db.treasuryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(logs)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch treasury logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const log = await db.treasuryLog.create({ data: body })
    return NextResponse.json(log, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create treasury log' }, { status: 500 })
  }
}
