import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const runs = await db.payrollRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(runs)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch payroll runs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const run = await db.payrollRun.create({ data: body })
    return NextResponse.json(run, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create payroll run' }, { status: 500 })
  }
}
