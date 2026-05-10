'use client'
import Link from 'next/link'
import { ArrowLeft, Megaphone, Pin } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { MOCK_LMS_ANNOUNCEMENTS } from '@/lib/mock-data'

export default function StudentAnnouncementsPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const announcements = [...MOCK_LMS_ANNOUNCEMENTS.filter(a => a.offeringId === offeringId)]
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/student/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>
      <SectionTitle description="Announcements from your instructor — view only">Announcements</SectionTitle>

      {announcements.length === 0 ? (
        <Card><div className="py-12 text-center"><Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-200" /><p className="text-sm text-slate-500">No announcements yet.</p></div></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id}>
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.isPinned ? 'bg-red-100' : 'bg-slate-100'}`}>
                  {a.isPinned ? <Pin className="h-4 w-4 text-red-600" /> : <Megaphone className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900">{a.title}</p>
                    {a.isPinned && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wide">Pinned</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{a.authorName} · {new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">{a.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
