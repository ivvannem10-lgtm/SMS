import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const leave = await db.hRLeaveRequest.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(leave)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 })
  }
}
