import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const jobPostingId = searchParams.get('jobPostingId')
    const where = jobPostingId ? { jobPostingId } : {}
    const applications = await db.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(applications)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const application = await db.jobApplication.create({ data: body })
    return NextResponse.json(application, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
