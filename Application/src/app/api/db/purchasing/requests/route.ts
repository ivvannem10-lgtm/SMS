import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function generatePRNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const last = await db.purchaseRequest.findFirst({
    where: { prNumber: { startsWith: `PR-${year}-` } },
    orderBy: { createdAt: 'desc' },
  })
  let seq = 1
  if (last) {
    const parts = last.prNumber.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  return `PR-${year}-${String(seq).padStart(4, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    const requests = await db.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch purchase requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prNumber = await generatePRNumber()
    const request = await db.purchaseRequest.create({ data: { ...body, prNumber } })
    return NextResponse.json(request, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create purchase request' }, { status: 500 })
  }
}
