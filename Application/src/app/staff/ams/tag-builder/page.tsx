'use client'
import { useState } from 'react'
import {
  Tag, ChevronUp, ChevronDown, Trash2, Plus, Star, Info,
  Check, X, ChevronDown as Caret,
} from 'lucide-react'
import { MOCK_ASSET_TAG_FORMATS } from '@/lib/mock-data'
import { SectionTitle } from '@/components/ui/Card'
import { cn, formatDate } from '@/lib/utils'
import type { AssetTagFormat, TagFormatComponent, TagComponentType } from '@/types'

const COMPONENT_COLORS: Record<TagComponentType, { bg: string; text: string; ring: string; label: string }> = {
  PREFIX:    { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200',    label: 'Prefix' },
  DEPT_CODE: { bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200',  label: 'Dept Code' },
  CATEGORY:  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Category' },
  YEAR:      { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200',   label: 'Year' },
  SEQUENCE:  { bg: 'bg-orange-50',  text: 'text-orange-700',  ring: 'ring-orange-200',  label: 'Sequence' },
  SUFFIX:    { bg: 'bg-teal-50',    text: 'text-teal-700',    ring: 'ring-teal-200',    label: 'Suffix' },
  CUSTOM:    { bg: 'bg-slate-100',  text: 'text-slate-700',   ring: 'ring-slate-200',   label: 'Custom Text' },
}

const ADD_COMPONENT_OPTIONS: { type: TagComponentType; label: string }[] = [
  { type: 'PREFIX',    label: 'Prefix' },
  { type: 'DEPT_CODE', label: 'Department Code' },
  { type: 'CATEGORY',  label: 'Category' },
  { type: 'YEAR',      label: 'Year' },
  { type: 'SEQUENCE',  label: 'Sequence Number' },
  { type: 'SUFFIX',    label: 'Suffix' },
  { type: 'CUSTOM',    label: 'Custom Text' },
]

const SEPARATORS = ['-', '.', '/', '_']

function renderComponentExample(comp: TagFormatComponent): string {
  switch (comp.type) {
    case 'PREFIX':    return comp.value ?? 'PREFIX'
    case 'DEPT_CODE': return 'COC'
    case 'CATEGORY':  return 'LAPTOP'
    case 'YEAR':      return String(new Date().getFullYear())
    case 'SEQUENCE':  return '0'.repeat((comp.width ?? 4) - 1) + '1'
    case 'SUFFIX':    return comp.value ?? 'SUFFIX'
    case 'CUSTOM':    return comp.value ?? 'TEXT'
    default:          return ''
  }
}

function buildPreview(components: TagFormatComponent[], separator: string): string {
  return components.map(renderComponentExample).filter(Boolean).join(separator)
}

interface AddComponentDropdownProps {
  onAdd: (type: TagComponentType) => void
}

function AddComponentDropdown({ onAdd }: AddComponentDropdownProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 text-brand-600 hover:bg-brand-50 px-3.5 py-2 text-sm font-semibold transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Component <Caret className="h-3.5 w-3.5 ml-0.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-20 w-52 rounded-xl bg-white border border-[#e4ebf5] shadow-card-md overflow-hidden">
          {ADD_COMPONENT_OPTIONS.map((opt) => {
            const { bg, text, ring } = COMPONENT_COLORS[opt.type]
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => { onAdd(opt.type); setOpen(false) }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
              >
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', bg, text, ring)}>
                  {COMPONENT_COLORS[opt.type].label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ComponentChip({
  comp, index, total,
  onChange, onMoveUp, onMoveDown, onDelete,
}: {
  comp: TagFormatComponent
  index: number
  total: number
  onChange: (c: TagFormatComponent) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const { bg, text, ring, label } = COMPONENT_COLORS[comp.type]
  const showValue = comp.type === 'PREFIX' || comp.type === 'SUFFIX' || comp.type === 'CUSTOM'
  const showWidth = comp.type === 'SEQUENCE'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e4ebf5] bg-white px-4 py-3">
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset shrink-0', bg, text, ring)}>
        {label}
      </span>

      {showValue && (
        <input
          type="text"
          value={comp.value ?? ''}
          onChange={(e) => onChange({ ...comp, value: e.target.value })}
          placeholder={comp.type === 'CUSTOM' ? 'Custom text…' : `${label} value…`}
          className="flex-1 min-w-0 rounded-lg border border-[#dce8f7] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
        />
      )}

      {showWidth && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Padding:</span>
          <select
            value={comp.width ?? 4}
            onChange={(e) => onChange({ ...comp, width: Number(e.target.value) })}
            className="rounded-lg border border-[#dce8f7] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 bg-white"
          >
            {[3, 4, 5, 6].map((w) => <option key={w} value={w}>{w} digits</option>)}
          </select>
          <span className="text-xs text-slate-400 font-mono">→ {'0'.repeat((comp.width ?? 4) - 1)}1</span>
        </div>
      )}

      {!showValue && !showWidth && (
        <span className="flex-1 text-xs text-slate-400 italic">Auto-filled at tag generation</span>
      )}

      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <button
          type="button" onClick={onMoveUp} disabled={index === 0}
          className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button" onClick={onMoveDown} disabled={index === total - 1}
          className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button" onClick={onDelete} disabled={total <= 1}
          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

interface Toast {
  id: number
  message: string
}

export default function TagBuilderPage() {
  const [formats, setFormats] = useState<AssetTagFormat[]>(MOCK_ASSET_TAG_FORMATS)
  const [name, setName] = useState('')
  const [separator, setSeparator] = useState('-')
  const [components, setComponents] = useState<TagFormatComponent[]>([
    { type: 'PREFIX', value: 'IT' },
    { type: 'CATEGORY' },
    { type: 'YEAR' },
    { type: 'SEQUENCE', width: 4 },
  ])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const preview = buildPreview(components, separator)

  function addToast(message: string) {
    const id = Date.now()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }

  function updateComponent(index: number, updated: TagFormatComponent) {
    setComponents((prev) => prev.map((c, i) => (i === index ? updated : c)))
  }

  function moveUp(index: number) {
    if (index === 0) return
    setComponents((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index: number) {
    setComponents((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function deleteComponent(index: number) {
    if (components.length <= 1) return
    setComponents((prev) => prev.filter((_, i) => i !== index))
  }

  function addComponent(type: TagComponentType) {
    const defaults: Partial<TagFormatComponent> = {}
    if (type === 'SEQUENCE') defaults.width = 4
    setComponents((prev) => [...prev, { type, ...defaults }])
  }

  function handleSave() {
    if (!name.trim()) {
      addToast('Please enter a format name.')
      return
    }
    if (components.length === 0) {
      addToast('Add at least one component.')
      return
    }
    const built = buildPreview(components, separator)
    const newFmt: AssetTagFormat = {
      id: `fmt_${Date.now()}`,
      name: name.trim(),
      components: components.map((c) => ({ ...c })),
      separator,
      preview: built,
      isDefault: formats.length === 0,
      createdAt: new Date().toISOString(),
    }
    MOCK_ASSET_TAG_FORMATS.push(newFmt)
    setFormats([...MOCK_ASSET_TAG_FORMATS])
    setName('')
    addToast('Format saved successfully.')
  }

  function setDefault(id: string) {
    const idx = MOCK_ASSET_TAG_FORMATS.findIndex((f) => f.id === id)
    if (idx < 0) return
    MOCK_ASSET_TAG_FORMATS.forEach((f, i) => { MOCK_ASSET_TAG_FORMATS[i].isDefault = i === idx })
    setFormats([...MOCK_ASSET_TAG_FORMATS])
  }

  function handleDelete(id: string) {
    const idx = MOCK_ASSET_TAG_FORMATS.findIndex((f) => f.id === id)
    if (idx >= 0) MOCK_ASSET_TAG_FORMATS.splice(idx, 1)
    setFormats([...MOCK_ASSET_TAG_FORMATS])
    setDeleteConfirm(null)
    addToast('Format deleted.')
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <SectionTitle description="Customize how asset tags are auto-generated.">
        Asset Tag Builder
      </SectionTitle>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-[3] min-w-0 space-y-5">
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5 space-y-5">
            <h2 className="text-sm font-bold text-slate-800">Format Builder</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Format Name <span className="text-red-500">*</span></label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Default IT Format"
                className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Separator</label>
              <div className="flex items-center gap-2 flex-wrap">
                {SEPARATORS.map((sep) => (
                  <button
                    key={sep} type="button"
                    onClick={() => setSeparator(sep)}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-colors',
                      separator === sep
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-slate-600 border-[#dce8f7] hover:border-brand-300 hover:text-brand-600',
                    )}
                  >
                    {sep}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Components</label>
              <div className="space-y-2">
                {components.map((comp, i) => (
                  <ComponentChip
                    key={i}
                    comp={comp}
                    index={i}
                    total={components.length}
                    onChange={(updated) => updateComponent(i, updated)}
                    onMoveUp={() => moveUp(i)}
                    onMoveDown={() => moveDown(i)}
                    onDelete={() => deleteComponent(i)}
                  />
                ))}
              </div>
              <div className="mt-3">
                <AddComponentDropdown onAdd={addComponent} />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e4ebf5]">
              <button
                type="button" onClick={handleSave}
                className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 text-white py-2.5 text-sm font-semibold transition-colors"
              >
                Save Format
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-1">Sequential Numbering</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                The system auto-increments the sequence number for each new asset registered.
                Numbers are padded to the configured width (e.g., width 4 → 0001, 0002, …).
              </p>
            </div>
          </div>
        </div>

        <div className="flex-[2] min-w-0 space-y-4">
          <div className="rounded-2xl bg-white border border-[#e4ebf5] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Live Preview</h2>
            <div className="rounded-xl bg-[#f0f4fa] border border-[#dce8f7] flex flex-col items-center justify-center gap-3 px-6 py-8">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-widest">
                <Tag className="h-3.5 w-3.5" /> Generated Tag
              </div>
              <p className="font-mono text-2xl font-bold text-slate-900 tracking-wider break-all text-center">
                {preview || <span className="text-slate-300">—</span>}
              </p>
              <p className="text-xs text-slate-400">Separator: <span className="font-mono font-semibold text-slate-600">{separator}</span></p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {components.map((comp, i) => {
                const { bg, text, ring, label } = COMPONENT_COLORS[comp.type]
                return (
                  <span key={i} className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', bg, text, ring)}>
                    {label}{comp.value ? `: ${comp.value}` : ''}{comp.width ? ` (×${comp.width})` : ''}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#e4ebf5] bg-[#f0f4fa]">
              <h2 className="text-xs font-bold text-brand-700 uppercase tracking-widest">Saved Formats</h2>
            </div>
            {formats.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No formats saved yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e4ebf5]">
                {formats.map((fmt) => (
                  <div key={fmt.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">{fmt.name}</span>
                          {fmt.isDefault && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 text-xs font-semibold">
                              <Star className="h-3 w-3" /> Default
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-sm text-slate-700 mt-1 font-semibold">{fmt.preview}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(fmt.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!fmt.isDefault && (
                        <button
                          type="button" onClick={() => setDefault(fmt.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 border border-brand-200 hover:border-brand-400 rounded-lg px-2.5 py-1 transition-colors"
                        >
                          <Star className="h-3 w-3" /> Set as Default
                        </button>
                      )}
                      {!fmt.isDefault && (
                        deleteConfirm === fmt.id ? (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-xs text-slate-500">Confirm?</span>
                            <button
                              type="button" onClick={() => handleDelete(fmt.id)}
                              className="flex items-center gap-0.5 text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 rounded-lg px-2 py-1 transition-colors"
                            >
                              <Check className="h-3 w-3" /> Yes
                            </button>
                            <button
                              type="button" onClick={() => setDeleteConfirm(null)}
                              className="flex items-center gap-0.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-[#dce8f7] rounded-lg px-2 py-1 transition-colors"
                            >
                              <X className="h-3 w-3" /> No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button" onClick={() => setDeleteConfirm(fmt.id)}
                            className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 hover:border-red-200 border border-[#dce8f7] rounded-lg px-2.5 py-1 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl text-sm font-medium pointer-events-auto animate-in fade-in slide-in-from-bottom-3">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
