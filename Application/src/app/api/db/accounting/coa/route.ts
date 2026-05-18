import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const accounts = await db.chartOfAccount.findMany({
      where,
      orderBy: { code: 'asc' },
    })
    return NextResponse.json(accounts)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch chart of accounts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const account = await db.chartOfAccount.create({ data: body })
    return NextResponse.json(account, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
