import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function generateORNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear()
  const last = await db.officialReceipt.findFirst({
    where: { schoolId, orNumber: { startsWith: `OR-${year}-` } },
    orderBy: { issuedAt: 'desc' },
  })
  let seq = 1
  if (last) {
    const parts = last.orNumber.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  return `OR-${year}-${String(seq).padStart(5, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const receipts = await db.officialReceipt.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
    })
    return NextResponse.json(receipts)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const orNumber = await generateORNumber(body.schoolId)
    const receipt = await db.officialReceipt.create({ data: { ...body, orNumber } })
    return NextResponse.json(receipt, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
  }
}
