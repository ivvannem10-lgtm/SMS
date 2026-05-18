import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    if (category) where.category = category
    const assets = await db.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(assets)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const asset = await db.asset.create({ data: body })
    return NextResponse.json(asset, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
