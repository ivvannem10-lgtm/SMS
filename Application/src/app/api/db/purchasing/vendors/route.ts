import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const vendors = await db.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vendors)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const vendor = await db.vendor.create({ data: body })
    return NextResponse.json(vendor, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}
