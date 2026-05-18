import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const isActiveParam = searchParams.get('isActive')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (isActiveParam !== null) where.isActive = isActiveParam === 'true'
    const fees = await db.feeStructure.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(fees)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fee = await db.feeStructure.create({ data: body })
    return NextResponse.json(fee, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create fee structure' }, { status: 500 })
  }
}
