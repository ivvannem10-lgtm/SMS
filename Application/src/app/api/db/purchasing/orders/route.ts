import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const orders = await db.purchaseOrder.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const order = await db.purchaseOrder.create({ data: body })
    return NextResponse.json(order, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}
