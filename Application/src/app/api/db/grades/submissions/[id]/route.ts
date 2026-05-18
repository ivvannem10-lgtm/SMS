import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const now = new Date()
    const data: Record<string, unknown> = { ...body }

    if (body.status === 'CLOSED' && !body.closedAt) data.closedAt = now
    if (body.status === 'PUBLISHED' && !body.publishedAt) data.publishedAt = now
    if (body.status === 'RETURNED' && !body.returnedAt) data.returnedAt = now

    const submission = await db.gradeSubmission.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(submission)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update grade submission' }, { status: 500 })
  }
}
