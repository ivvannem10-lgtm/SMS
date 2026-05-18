import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    const applicants = await db.applicant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(applicants)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const applicant = await db.applicant.create({ data: body })
    return NextResponse.json(applicant, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create applicant' }, { status: 500 })
  }
}
