import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const student = await db.student.findUnique({
      where: { id: params.id },
      include: { program: true, enrollments: true },
    })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(student)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const student = await db.student.update({ where: { id: params.id }, data: body })
    return NextResponse.json(student)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.student.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}
