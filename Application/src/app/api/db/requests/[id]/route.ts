import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const request = await db.universalRequest.findUnique({ where: { id: params.id } })
    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(request)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const request = await db.universalRequest.update({ where: { id: params.id }, data: body })
    return NextResponse.json(request)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
