'use client'

import { useState, useId } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Settings, Plus, Trash2, CheckCircle2, Shuffle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { MOCK_GRADE_CRITERIA, MOCK_OFFERINGS } from '@/lib/mock-data'
import type { GradeCriteria, CustomGradeCategory } from '@/types'

// ── Color palette ──────────────────────────────────────────────────────────────
const PALETTE = [
  { bg: 'bg-violet-400', text: 'text-violet-700', bar: '#a78bfa', accent: 'accent-violet-500' },
  { bg: 'bg-blue-400',   text: 'text-blue-700',   bar: '#60a5fa', accent: 'accent-blue-500' },
  { bg: 'bg-orange-400', text: 'text-orange-700', bar: '#fb923c', accent: 'accent-orange-500' },
  { bg: 'bg-rose-400',   text: 'text-rose-700',   bar: '#fb7185', accent: 'accent-rose-500' },
  { bg: 'bg-teal-400',   text: 'text-teal-700',   bar: '#2dd4bf', accent: 'accent-teal-500' },
  { bg: 'bg-indigo-400', text: 'text-indigo-700', bar: '#818cf8', accent: 'accent-indigo-500' },
  { bg: 'bg-amber-400',  text: 'text-amber-700',  bar: '#fbbf24', accent: 'accent-amber-500' },
  { bg: 'bg-cyan-400',   text: 'text-cyan-700',   bar: '#22d3ee', accent: 'accent-cyan-500' },
  { bg: 'bg-purple-400', text: 'text-purple-700', bar: '#c084fc', accent: 'accent-purple-500' },
  { bg: 'bg-emerald-400',text: 'text-emerald-700',bar: '#34d399', accent: 'accent-emerald-500' },
]

interface Category {
  id: string
  label: string
  desc: string
  colorIdx: number
  isDefault: boolean
  enabled: boolean   // default categories can be toggled on/off
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'quiz',       label: 'Quiz Average',      desc: 'Average of all quiz scores',           colorIdx: 0, isDefault: true, enabled: true },
  { id: 'assignment', label: 'Assignment Average', desc: 'Average of all assignment grades',     colorIdx: 1, isDefault: true, enabled: true },
  { id: 'exam',       label: 'Exam',               desc: 'Midterm + Final exam (split equally)', colorIdx: 2, isDefault: true, enabled: true },
  { id: 'pt',         label: 'Performance Task',   desc: 'Rubric-based tasks & projects',        colorIdx: 3, isDefault: true, enabled: false },
]

function buildInitialCategories(existing?: GradeCriteria): Category[] {
  const savedDisabled: Set<string> = new Set(existing?.disabledDefaults ?? [])
  const defaults = DEFAULT_CATEGORIES.map(c => ({
    ...c,
    enabled: !savedDisabled.has(c.id),
  }))
  const custom: Category[] = (existing?.customCategories ?? []).map(c => ({
    id: c.id, label: c.label, desc: c.desc, colorIdx: c.colorIdx, isDefault: false, enabled: true,
  }))
  return [...defaults, ...custom]
}

function buildInitialWeights(existing?: GradeCriteria): Record<string, number> {
  const base: Record<string, number> = {
    quiz:       existing?.quizWeight            ?? 30,
    assignment: existing?.assignmentWeight      ?? 30,
    exam:       existing?.examWeight            ?? 40,
    pt:         existing?.performanceTaskWeight ?? 0,
  }
  for (const c of existing?.customCategories ?? []) base[c.id] = c.weight
  return base
}

// Toggle switch component
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        on ? 'bg-brand-600' : 'bg-slate-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        on ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  )
}

export default function CriteriaPage({ params }: { params: { offeringId: string } }) {
  const { offeringId } = params
  const offering = MOCK_OFFERINGS.find(o => o.id === offeringId)
  const existing = MOCK_GRADE_CRITERIA.find(c => c.offeringId === offeringId)

  const uid = useId()

  const [categories, setCategories] = useState<Category[]>(() => buildInitialCategories(existing))
  const [weights, setWeights]       = useState<Record<string, number>>(() => buildInitialWeights(existing))
  const [passingGrade, setPassing]  = useState(existing?.passingGrade ?? 60)
  const [saved,  setSaved]          = useState(false)
  const [saving, setSaving]         = useState(false)

  // ── Manage modal ──────────────────────────────────────────────────────────────
  const [manageOpen, setManageOpen] = useState(false)
  const [draft,      setDraft]      = useState<Category[]>([])
  const [newLabel,   setNewLabel]   = useState('')
  const [newDesc,    setNewDesc]    = useState('')

  function openManage() {
    setDraft(categories.map(c => ({ ...c })))
    setNewLabel('')
    setNewDesc('')
    setManageOpen(true)
  }

  function toggleDraftEnabled(id: string) {
    setDraft(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
  }

  function addToDraft() {
    if (!newLabel.trim()) return
    const usedIdx = draft.map(c => c.colorIdx)
    const free = PALETTE.findIndex((_, i) => !usedIdx.includes(i))
    const colorIdx = free === -1 ? draft.length % PALETTE.length : free
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
    setDraft(prev => [...prev, { id, label: newLabel.trim(), desc: newDesc.trim(), colorIdx, isDefault: false, enabled: true }])
    setNewLabel('')
    setNewDesc('')
  }

  function removeDraft(id: string) {
    setDraft(prev => prev.filter(c => c.id !== id))
  }

  function applyManage() {
    const existingIds = new Set(categories.map(c => c.id))
    const nextWeights = { ...weights }
    draft.forEach(c => { if (!existingIds.has(c.id)) nextWeights[c.id] = 0 })
    const keptIds = new Set(draft.map(c => c.id))
    Object.keys(nextWeights).forEach(k => { if (!keptIds.has(k)) delete nextWeights[k] })
    // Zero-out disabled defaults so they don't affect total
    draft.forEach(c => { if (c.isDefault && !c.enabled) nextWeights[c.id] = 0 })
    setCategories(draft)
    setWeights(nextWeights)
    setManageOpen(false)
    setSaved(false)
  }

  function autoDistribute() {
    const active = categories.filter(c => c.enabled)
    if (active.length === 0) return
    const base  = Math.floor(100 / active.length)
    const extra = 100 - base * active.length
    const next  = { ...weights }
    categories.forEach(c => { next[c.id] = 0 })
    active.forEach((c, i) => { next[c.id] = base + (i === 0 ? extra : 0) })
    setWeights(next)
    setSaved(false)
  }

  function setWeight(id: string, raw: string) {
    const val = Math.max(0, Math.min(100, parseInt(raw) || 0))
    setWeights(prev => ({ ...prev, [id]: val }))
    setSaved(false)
  }

  const activeCategories = categories.filter(c => c.enabled)
  const total = activeCategories.reduce((s, c) => s + (weights[c.id] ?? 0), 0)
  const valid = total === 100 && passingGrade >= 50 && passingGrade <= 100

  async function handleSave() {
    if (!valid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))

    const customCats: CustomGradeCategory[] = categories
      .filter(c => !c.isDefault)
      .map(c => ({ id: c.id, label: c.label, desc: c.desc, colorIdx: c.colorIdx, weight: weights[c.id] ?? 0 }))

    const disabledDefaults = categories.filter(c => c.isDefault && !c.enabled).map(c => c.id)

    const criteria: GradeCriteria = {
      id:                    existing?.id ?? `crit_${Date.now()}`,
      offeringId,
      quizWeight:            weights['quiz']       ?? 0,
      assignmentWeight:      weights['assignment'] ?? 0,
      examWeight:            weights['exam']       ?? 0,
      performanceTaskWeight: weights['pt']         ?? 0,
      passingGrade,
      customCategories:      customCats,
      disabledDefaults,
    }
    const idx = MOCK_GRADE_CRITERIA.findIndex(c => c.offeringId === offeringId)
    if (idx >= 0) MOCK_GRADE_CRITERIA[idx] = criteria
    else MOCK_GRADE_CRITERIA.push(criteria)
    setSaving(false)
    setSaved(true)
  }

  const nextColorIdx = (() => {
    const used = draft.map(c => c.colorIdx)
    const free = PALETTE.findIndex((_, i) => !used.includes(i))
    return free === -1 ? draft.length % PALETTE.length : free
  })()

  return (
    <div className="max-w-2xl space-y-5">
      <Link href={`/teacher/subjects/${offeringId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Grading Criteria</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {offering?.subject?.name} — {offering?.subject?.code} · Section {offering?.section}
          </p>
        </div>
        <Button
          icon={saved ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
          onClick={handleSave} loading={saving} disabled={!valid}
        >
          {saved ? 'Saved!' : 'Save Criteria'}
        </Button>
      </div>

      {/* ── Grade Weight Distribution ────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={openManage}
            className="flex items-center justify-center h-7 w-7 rounded-lg bg-brand-50 border border-brand-200 text-brand-600 hover:bg-brand-100 active:scale-95 transition-all"
            title="Manage grade categories"
          >
            <Settings className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-bold text-slate-900">Grade Weight Distribution</h2>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={autoDistribute}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              title="Distribute weights evenly across active categories"
            >
              <Shuffle className="h-3 w-3" /> Auto
            </button>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              total === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              {total}% {total === 100 ? '✓' : '≠ 100%'}
            </span>
          </div>
        </div>

        {/* Weight bar — only active categories */}
        <div className="mb-5">
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
            {activeCategories.map(c => (
              <div
                key={c.id}
                className="transition-all duration-300"
                style={{ width: `${weights[c.id] ?? 0}%`, backgroundColor: PALETTE[c.colorIdx]?.bar ?? '#94a3b8' }}
                title={`${c.label}: ${weights[c.id] ?? 0}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {activeCategories.map(c => (
              <span key={c.id} className="flex items-center gap-1 text-xs text-slate-500">
                <span className={`h-2.5 w-2.5 rounded-sm inline-block ${PALETTE[c.colorIdx]?.bg ?? 'bg-slate-400'}`} />
                {c.label}
              </span>
            ))}
            {categories.filter(c => !c.enabled).map(c => (
              <span key={c.id} className="flex items-center gap-1 text-xs text-slate-400 line-through">
                <span className="h-2.5 w-2.5 rounded-sm inline-block bg-slate-300" />
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sliders — only active */}
        <div className="space-y-5">
          {activeCategories.map(c => {
            const pal = PALETTE[c.colorIdx] ?? PALETTE[0]
            return (
              <div key={c.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-semibold ${pal.text}`}>{c.label}</p>
                    {!c.isDefault && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Custom</span>
                    )}
                  </div>
                  {c.desc && <p className="text-xs text-slate-400 truncate">{c.desc}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range" min={0} max={100} step={5}
                    value={weights[c.id] ?? 0}
                    onChange={e => setWeight(c.id, e.target.value)}
                    className={`w-28 ${pal.accent}`}
                  />
                  <div className="relative">
                    <input
                      id={`${uid}-${c.id}`}
                      type="number" min={0} max={100}
                      value={weights[c.id] ?? 0}
                      onChange={e => setWeight(c.id, e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            )
          })}

          {activeCategories.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4 italic">
              No active categories. Enable at least one in the settings.
            </p>
          )}
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Click <Settings className="h-3 w-3 inline-block mx-0.5 text-brand-500" /> to enable/disable categories or add custom ones.
        </p>
      </Card>

      {/* ── Passing Grade Threshold ──────────────────────────────────────────── */}
      <Card>
        <h2 className="text-sm font-bold text-slate-900 mb-4">Passing Grade Threshold</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-600">Minimum final grade to pass the course</p>
            <p className="text-xs text-slate-400 mt-0.5">Students below this grade will receive FAILED status</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="range" min={50} max={80} step={1}
              value={passingGrade}
              onChange={e => { setPassing(parseInt(e.target.value)); setSaved(false) }}
              className="w-28 accent-emerald-500"
            />
            <div className="relative">
              <input
                type="number" min={50} max={100}
                value={passingGrade}
                onChange={e => { setPassing(parseInt(e.target.value) || 60); setSaved(false) }}
                className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Grade Formula Preview ────────────────────────────────────────────── */}
      <Card>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Grade Formula Preview</h2>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 font-mono text-sm text-slate-700 leading-relaxed">
          <p>Final Grade =</p>
          {activeCategories.length === 0 ? (
            <p className="pl-4 text-slate-400 italic text-xs">No active categories</p>
          ) : (
            activeCategories.map((c, i) => {
              const pal = PALETTE[c.colorIdx] ?? PALETTE[0]
              return (
                <p key={c.id} className={`pl-4 ${pal.text}`}>
                  {i === 0 ? '  ' : '+ '}({c.label} × {weights[c.id] ?? 0}%)
                </p>
              )
            })
          )}
          <div className="mt-2 border-t border-slate-200 pt-2 text-emerald-700">
            Pass if Final Grade ≥ {passingGrade}%
          </div>
        </div>
        {total !== 100 && activeCategories.length > 0 && (
          <p className="mt-2 text-xs font-medium text-red-500">
            Weights must sum to exactly 100% before saving. Current: {total}%.
          </p>
        )}
      </Card>

      {/* ── Manage Grade Categories Modal ────────────────────────────────────── */}
      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Manage Grade Categories"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setManageOpen(false)}>Cancel</Button>
            <Button onClick={applyManage} icon={<CheckCircle2 className="h-4 w-4" />}>Apply Changes</Button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Toggle default categories on or off. Add custom categories for components like Laboratory or Recitation.
          </p>

          {/* ── Default categories (toggleable) ──────────────────────────────── */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Default Categories</p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {draft.filter(c => c.isDefault).map(cat => {
                const pal = PALETTE[cat.colorIdx] ?? PALETTE[0]
                return (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-3 px-3 py-3 transition-colors ${
                      cat.enabled ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    {/* Color swatch */}
                    <span className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center transition-opacity ${pal.bg} ${cat.enabled ? 'opacity-100' : 'opacity-30'}`}>
                      <span className="text-white text-[10px] font-bold">{cat.label.charAt(0)}</span>
                    </span>

                    {/* Info */}
                    <div className={`flex-1 min-w-0 transition-opacity ${cat.enabled ? 'opacity-100' : 'opacity-40'}`}>
                      <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                      {cat.desc && <p className="text-[11px] text-slate-400">{cat.desc}</p>}
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium ${cat.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {cat.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <Toggle
                        on={cat.enabled}
                        onToggle={() => toggleDraftEnabled(cat.id)}
                        label={`Toggle ${cat.label}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Custom categories ────────────────────────────────────────────── */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Categories</p>
            {draft.filter(c => !c.isDefault).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No custom categories yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {draft.filter(c => !c.isDefault).map(cat => {
                  const pal = PALETTE[cat.colorIdx] ?? PALETTE[0]
                  return (
                    <div key={cat.id} className="flex items-center gap-3 bg-white px-3 py-3">
                      <span className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${pal.bg}`}>
                        <span className="text-white text-[10px] font-bold">{cat.label.charAt(0)}</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                        {cat.desc && <p className="text-[11px] text-slate-400">{cat.desc}</p>}
                      </div>
                      <button
                        onClick={() => removeDraft(cat.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Add new category ─────────────────────────────────────────────── */}
          <div className="rounded-xl border border-dashed border-brand-300 bg-brand-50/40 p-4 space-y-3">
            <p className="text-xs font-semibold text-brand-700">+ Add Custom Category</p>
            <Input
              label="Category Name *"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') addToDraft() }}
              placeholder="e.g., Laboratory, Recitation, Portfolio…"
            />
            <Input
              label="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Brief description"
            />
            {newLabel.trim() && (
              <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2">
                <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${PALETTE[nextColorIdx]?.bg ?? 'bg-slate-400'}`}>
                  <span className="text-white text-[10px] font-bold">{newLabel.charAt(0).toUpperCase()}</span>
                </span>
                <span className={`text-sm font-semibold ${PALETTE[nextColorIdx]?.text ?? 'text-slate-700'}`}>{newLabel}</span>
              </div>
            )}
            <Button
              variant="soft" size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={addToDraft}
              disabled={!newLabel.trim()}
              className="w-full justify-center"
            >
              Add Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
