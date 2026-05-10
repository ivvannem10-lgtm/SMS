'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Megaphone, Pin, Trash2 } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { MOCK_LMS_ANNOUNCEMENTS, MOCK_OFFERINGS } from '@/lib/mock-data'
import type { LMSAnnouncement } from '@/types'

let _nextId = 1

export default function TeacherAnnouncementsPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const offering = MOCK_OFFERINGS.find(o => o.id === offeringId)
  const [announcements, setAnnouncements] = useState<LMSAnnouncement[]>(() =>
    [...MOCK_LMS_ANNOUNCEMENTS.filter(a => a.offeringId === offeringId)]
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  )
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pin, setPin] = useState(false)

  function save() {
    if (!title.trim() || !content.trim()) return
    const ann: LMSAnnouncement = {
      id: `ann_new_${_nextId++}`,
      offeringId,
      title: title.trim(),
      content: content.trim(),
      authorName: 'Prof. Roberto Santos',
      isPinned: pin,
      createdAt: new Date().toISOString(),
    }
    MOCK_LMS_ANNOUNCEMENTS.push(ann)
    setAnnouncements(prev => [ann, ...prev])
    setTitle('')
    setContent('')
    setPin(false)
    setCreating(false)
  }

  function del(id: string) {
    const idx = MOCK_LMS_ANNOUNCEMENTS.findIndex(a => a.id === id)
    if (idx !== -1) MOCK_LMS_ANNOUNCEMENTS.splice(idx, 1)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400'

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle description={`${offering?.subject?.name} — ${offering?.section}`}>Announcements</SectionTitle>
        <button onClick={() => setCreating(true)} className="shrink-0 flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
          <Plus className="h-3.5 w-3.5" /> New Announcement
        </button>
      </div>

      {creating && (
        <Card>
          <p className="text-sm font-bold text-slate-700 mb-3">New Announcement</p>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className={field} />
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Write your announcement…" className={`${field} resize-none`} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pin} onChange={e => setPin(e.target.checked)} className="accent-brand-500" />
              <span className="text-sm text-slate-600">Pin this announcement</span>
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCreating(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={save} className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">Post Announcement</button>
            </div>
          </div>
        </Card>
      )}

      {announcements.length === 0 && !creating ? (
        <Card><div className="py-12 text-center"><Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-200" /><p className="text-sm text-slate-500">No announcements posted yet.</p></div></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id}>
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.isPinned ? 'bg-red-100' : 'bg-slate-100'}`}>
                  {a.isPinned ? <Pin className="h-4 w-4 text-red-600" /> : <Megaphone className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{a.title}</p>
                    {a.isPinned && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase">Pinned</span>}
                  </div>
                  <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-sm text-slate-700 mt-2">{a.content}</p>
                </div>
                <button onClick={() => del(a.id)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
