import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const students = await db.student.findMany({
      where,
      include: { program: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(students)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const student = await db.student.create({ data: body })
    return NextResponse.json(student, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
}
