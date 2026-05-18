import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const offering = await db.subjectOffering.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
        schedules: true,
        assignments: { include: { faculty: true } },
        enrollments: true,
      },
    })
    if (!offering) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(offering)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch offering' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const offering = await db.subjectOffering.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(offering)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update offering' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.subjectOffering.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete offering' }, { status: 500 })
  }
}
