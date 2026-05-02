'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Video, Link2, Upload, Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MOCK_MODULES } from '@/lib/mock-data'

const TYPE_ICONS: Record<string, React.ElementType> = { PDF: FileText, VIDEO: Video, LINK: Link2, FILE: Upload }

export default function MaterialsPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const modules = MOCK_MODULES.filter((m) => m.offeringId === offeringId)
  const [addModule, setAddModule] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    setAddModule(false)
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Subject
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Learning Materials</h1>
          <p className="text-sm text-slate-500">{modules.length} modules</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddModule(true)}>Add Module</Button>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const Icon = module.isPublished ? Eye : EyeOff
          return (
            <Card key={module.id}>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700 shrink-0">
                  {module.order}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{module.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${module.isPublished ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <Icon className="h-3 w-3" />
                        {module.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  {module.description && <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>}
                </div>
              </div>

              <div className="space-y-2 ml-11">
                {(module.materials?.length ?? 0) === 0 ? (
                  <button className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    <Upload className="h-4 w-4" /> Add learning material…
                  </button>
                ) : (
                  module.materials?.map((mat) => {
                    const MatIcon = TYPE_ICONS[mat.type] ?? FileText
                    return (
                      <div key={mat.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${mat.type === 'PDF' ? 'bg-red-50 text-red-600' : mat.type === 'VIDEO' ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600'}`}>
                          <MatIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{mat.title}</p>
                          <p className="text-xs text-slate-400">{mat.type}{mat.size ? ` · ${mat.size}` : ''}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={addModule} onClose={() => setAddModule(false)} title="Add Module" size="md"
        footer={<><Button variant="outline" onClick={() => setAddModule(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save Module</Button></>}>
        <div className="space-y-4">
          <Input label="Module Title *" placeholder="e.g., Introduction to Computers" required />
          <Textarea label="Description" placeholder="Brief description of this module's content…" />
          <Select label="Publish Status">
            <option value="draft">Save as Draft</option>
            <option value="published">Publish Immediately</option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}
