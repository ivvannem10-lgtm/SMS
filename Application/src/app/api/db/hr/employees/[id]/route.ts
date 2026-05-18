import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const employee = await db.hREmployee.findUnique({
      where: { id: params.id },
      include: { leaveRequests: true, onboarding: true },
    })
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(employee)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const employee = await db.hREmployee.update({ where: { id: params.id }, data: body })
    return NextResponse.json(employee)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.hREmployee.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
