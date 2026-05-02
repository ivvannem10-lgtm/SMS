'use client'
import { useState } from 'react'
import { Bell, CreditCard, BookOpen, GraduationCap, Info } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import { formatDateTime } from '@/lib/utils'

const TYPE_ICONS: Record<string, React.ElementType> = { PAYMENT: CreditCard, ENROLLMENT: GraduationCap, GRADE: BookOpen, GENERAL: Info }
const TYPE_COLORS: Record<string, string> = { PAYMENT: 'bg-emerald-50 text-emerald-600', ENROLLMENT: 'bg-blue-50 text-blue-600', GRADE: 'bg-violet-50 text-violet-600', GENERAL: 'bg-slate-100 text-slate-600' }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const unread = notifications.filter((n) => !n.isRead).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="max-w-2xl space-y-5">
      <SectionTitle
        description={`${unread} unread notification${unread !== 1 ? 's' : ''}`}
        actions={unread > 0 ? <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Mark all as read</button> : undefined}
      >
        Notifications
      </SectionTitle>

      <div className="space-y-2">
        {notifications.map((notif) => {
          const Icon = TYPE_ICONS[notif.type] ?? Bell
          return (
            <div key={notif.id}
              onClick={() => setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n))}
              className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all ${!notif.isRead ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TYPE_COLORS[notif.type] ?? 'bg-slate-100 text-slate-600'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                  {!notif.isRead && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1.5">{formatDateTime(notif.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
