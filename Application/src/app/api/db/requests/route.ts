import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function generateRequestNumber(): Promise<string> {
  const last = await db.universalRequest.findFirst({
    orderBy: { createdAt: 'desc' },
  })
  let seq = 1
  if (last) {
    const parts = last.requestNumber.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  return `REQ-${String(seq).padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const submittedBy = searchParams.get('submittedBy')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    if (submittedBy) where.submittedBy = submittedBy
    const requests = await db.universalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const requestNumber = await generateRequestNumber()
    const request = await db.universalRequest.create({ data: { ...body, requestNumber } })
    return NextResponse.json(request, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
