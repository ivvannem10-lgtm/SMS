import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    const expenses = await db.financialExpense.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const expense = await db.financialExpense.create({ data: body })
    return NextResponse.json(expense, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
