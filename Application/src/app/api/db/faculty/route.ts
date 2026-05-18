import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const faculty = await db.faculty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(faculty)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const faculty = await db.faculty.create({ data: body })
    return NextResponse.json(faculty, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create faculty' }, { status: 500 })
  }
}
