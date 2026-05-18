import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const status = searchParams.get('status')
    const visibility = searchParams.get('visibility')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (status) where.status = status
    if (visibility) where.visibility = visibility
    const forms = await db.institutionalForm.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(forms)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const form = await db.institutionalForm.create({ data: body })
    return NextResponse.json(form, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}
