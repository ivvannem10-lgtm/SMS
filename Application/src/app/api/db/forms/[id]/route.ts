import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const form = await db.institutionalForm.findUnique({
      where: { id: params.id },
      include: { _count: { select: { submissions: true } } },
    })
    if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(form)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const form = await db.institutionalForm.update({ where: { id: params.id }, data: body })
    return NextResponse.json(form)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.institutionalForm.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
