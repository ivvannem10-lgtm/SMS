'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, ChevronDown, ChevronRight, Pin, Send } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { MOCK_LMS_DISCUSSIONS, MOCK_STUDENTS } from '@/lib/mock-data'

const student = MOCK_STUDENTS[0]

export default function StudentDiscussionsPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const posts = MOCK_LMS_DISCUSSIONS.filter(d => d.offeringId === offeringId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  const [expanded, setExpanded] = useState<Set<string>>(new Set(posts[0] ? [posts[0].id] : []))
  const [replies, setReplies] = useState<Record<string, string>>({})

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function postReply(postId: string) {
    const content = replies[postId]?.trim()
    if (!content) return
    const post = MOCK_LMS_DISCUSSIONS.find(p => p.id === postId)
    if (post) {
      post.replies.push({
        id: `rep_${Date.now()}`,
        postId,
        content,
        authorName: `${student.firstName} ${student.lastName}`,
        authorRole: 'STUDENT',
        createdAt: new Date().toISOString(),
      })
    }
    setReplies(prev => ({ ...prev, [postId]: '' }))
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/student/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>
      <SectionTitle description="Ask questions and engage with classmates and your instructor">Discussions</SectionTitle>

      {posts.length === 0 ? (
        <Card><div className="py-12 text-center"><MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-200" /><p className="text-sm text-slate-500">No discussion posts yet.</p></div></Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const isOpen = expanded.has(post.id)
            return (
              <Card key={post.id} padding="none">
                <button onClick={() => toggleExpand(post.id)} className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${post.authorRole === 'TEACHER' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                    {post.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{post.title}</p>
                      {post.isPinned && <Pin className="h-3 w-3 text-red-500" />}
                      {post.authorRole === 'TEACHER' && <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-600 uppercase">Instructor</span>}
                    </div>
                    <p className="text-xs text-slate-400">{post.authorName} · {new Date(post.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}</p>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-1" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />}
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
                    {post.replies.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                        {post.replies.map(r => (
                          <div key={r.id} className="flex gap-2">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${r.authorRole === 'TEACHER' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>{r.authorName.charAt(0)}</div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-800">{r.authorName}</span>
                                {r.authorRole === 'TEACHER' && <span className="rounded-full bg-brand-50 px-1.5 text-[9px] font-bold text-brand-600 uppercase">Instructor</span>}
                                <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              <p className="text-xs text-slate-700 mt-0.5">{r.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={replies[post.id] ?? ''}
                        onChange={e => setReplies(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a reply…"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postReply(post.id) } }}
                      />
                      <button
                        onClick={() => postReply(post.id)}
                        className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
