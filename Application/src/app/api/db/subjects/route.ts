import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const subjects = await db.subject.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(subjects)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subject = await db.subject.create({ data: body })
    return NextResponse.json(subject, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}
