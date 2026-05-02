import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const studentId = searchParams.get('studentId')

  let notifications = [...MOCK_NOTIFICATIONS]
  if (studentId) notifications = notifications.filter((n) => n.studentId === studentId)

  const unread = notifications.filter((n) => !n.isRead).length
  return NextResponse.json({ data: notifications, unread })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { notificationId, markAllRead } = body

  if (markAllRead) {
    return NextResponse.json({ message: 'All notifications marked as read' })
  }

  if (!notificationId) return NextResponse.json({ error: 'notificationId or markAllRead required' }, { status: 400 })
  const notif = MOCK_NOTIFICATIONS.find((n) => n.id === notificationId)
  if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: { ...notif, isRead: true } })
}
