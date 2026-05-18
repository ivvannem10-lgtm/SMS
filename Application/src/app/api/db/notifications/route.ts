import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const userId = searchParams.get('userId')
    const studentId = searchParams.get('studentId')
    const isReadParam = searchParams.get('isRead')
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (studentId) where.studentId = studentId
    if (isReadParam !== null) where.isRead = isReadParam === 'true'
    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(notifications)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const notification = await db.notification.create({ data: body })
    return NextResponse.json(notification, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 })
  }
}
