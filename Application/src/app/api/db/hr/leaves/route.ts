import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const employeeId = searchParams.get('employeeId')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (employeeId) where.employeeId = employeeId
    const leaves = await db.hRLeaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(leaves)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const leave = await db.hRLeaveRequest.create({ data: body })
    return NextResponse.json(leave, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 })
  }
}
