import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const offeringId = searchParams.get('offeringId')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    if (offeringId) where.offeringId = offeringId
    const submissions = await db.gradeSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(submissions)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch grade submissions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const submission = await db.gradeSubmission.create({ data: body })
    return NextResponse.json(submission, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create grade submission' }, { status: 500 })
  }
}
