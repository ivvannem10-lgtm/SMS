'use client'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Video, Link2, Download, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MOCK_MODULES } from '@/lib/mock-data'

const TYPE_ICONS: Record<string, React.ElementType> = { PDF: FileText, VIDEO: Video, LINK: Link2, FILE: Download }
const TYPE_COLORS: Record<string, string> = { PDF: 'bg-red-50 text-red-600', VIDEO: 'bg-violet-50 text-violet-600', LINK: 'bg-blue-50 text-blue-600', FILE: 'bg-slate-100 text-slate-600' }

export default function StudentMaterialsPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const modules = MOCK_MODULES.filter((m) => m.offeringId === offeringId)
  const published = modules.filter((m) => m.isPublished)
  const draft = modules.filter((m) => !m.isPublished)

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/student/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Learning Materials</h1>
        <p className="text-sm text-slate-500">{published.length} modules available</p>
      </div>

      <div className="space-y-4">
        {published.map((module) => (
          <Card key={module.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">{module.order}</div>
              <div>
                <h3 className="font-semibold text-slate-900">{module.title}</h3>
                {module.description && <p className="text-xs text-slate-500">{module.description}</p>}
              </div>
            </div>
            <div className="space-y-2 ml-11">
              {(module.materials?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">No materials uploaded yet.</p>
              ) : (
                module.materials?.map((mat) => {
                  const MatIcon = TYPE_ICONS[mat.type] ?? FileText
                  return (
                    <a key={mat.id} href={mat.url ?? '#'} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-2.5 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${TYPE_COLORS[mat.type] ?? 'bg-slate-100 text-slate-600'}`}>
                        <MatIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">{mat.title}</p>
                        <p className="text-xs text-slate-400">{mat.type}{mat.size ? ` · ${mat.size}` : ''}</p>
                      </div>
                      <Download className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                    </a>
                  )
                })
              )}
            </div>
          </Card>
        ))}

        {draft.length > 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
            <Lock className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm">{draft.length} module{draft.length > 1 ? 's' : ''} not yet published</p>
          </div>
        )}
      </div>
    </div>
  )
}
