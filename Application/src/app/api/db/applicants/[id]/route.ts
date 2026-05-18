import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicant = await db.applicant.findUnique({
      where: { id: params.id },
      include: {
        familyBackground: true,
        previousEducations: true,
        documents: true,
      },
    })
    if (!applicant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(applicant)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch applicant' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const applicant = await db.applicant.update({ where: { id: params.id }, data: body })
    return NextResponse.json(applicant)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.applicant.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete applicant' }, { status: 500 })
  }
}
