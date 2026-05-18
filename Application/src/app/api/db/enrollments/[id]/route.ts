import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data: Record<string, unknown> = { ...body }
    if (body.status === 'ENROLLED' && !body.confirmedAt) {
      data.confirmedAt = new Date()
    }
    const enrollment = await db.enrollment.update({ where: { id: params.id }, data })
    return NextResponse.json(enrollment)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.enrollment.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 })
  }
}
