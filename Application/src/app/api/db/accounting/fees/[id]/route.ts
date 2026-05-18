import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const fee = await db.feeStructure.update({ where: { id: params.id }, data: body })
    return NextResponse.json(fee)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update fee structure' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.feeStructure.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete fee structure' }, { status: 500 })
  }
}
