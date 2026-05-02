'use client'

import { Sun, Moon, CheckCircle2 } from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { useTheme } from '@/app/providers'
import type { AccentColor } from '@/app/providers'

const ACCENT_OPTIONS: { id: AccentColor; label: string; hex: string; ring: string; bg: string }[] = [
  { id: 'brand',   label: 'Navy Blue',  hex: '#1a4a8a', ring: 'ring-[#1a4a8a]',   bg: 'bg-[#1a4a8a]' },
  { id: 'violet',  label: 'Violet',     hex: '#7c3aed', ring: 'ring-violet-600',   bg: 'bg-violet-600' },
  { id: 'emerald', label: 'Emerald',    hex: '#059669', ring: 'ring-emerald-600',  bg: 'bg-emerald-600' },
  { id: 'orange',  label: 'Orange',     hex: '#ea580c', ring: 'ring-orange-600',   bg: 'bg-orange-600' },
  { id: 'rose',    label: 'Rose',       hex: '#e11d48', ring: 'ring-rose-600',     bg: 'bg-rose-600' },
]

export default function PersonalizationPage() {
  const { theme, accent, setTheme, setAccent } = useTheme()

  return (
    <div className="max-w-xl space-y-5">
      <SectionTitle description="Customize how the system looks and feels">
        Personalization
      </SectionTitle>

      {/* Theme */}
      <Card>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Light */}
          <button
            onClick={() => setTheme('light')}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${theme === 'light' ? 'border-brand-500 bg-brand-50' : 'border-[#e4ebf5] bg-white hover:border-brand-200'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <Sun className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-slate-900">Light</p>
            </div>
            {/* Mini preview */}
            <div className="rounded-lg overflow-hidden border border-slate-200 text-[0px]">
              <div className="h-4 bg-white border-b border-slate-100" />
              <div className="h-12 bg-[#f3f6fb] flex gap-1 p-1">
                <div className="w-8 bg-[#0c1e3d] rounded" />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="h-2 bg-white rounded" />
                  <div className="h-2 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
            {theme === 'light' && (
              <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </button>

          {/* Dark */}
          <button
            onClick={() => setTheme('dark')}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${theme === 'dark' ? 'border-brand-500 bg-brand-50' : 'border-[#e4ebf5] bg-white hover:border-brand-200'}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                <Moon className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900">Dark</p>
            </div>
            {/* Mini preview */}
            <div className="rounded-lg overflow-hidden border border-slate-700 text-[0px]">
              <div className="h-4 bg-slate-900 border-b border-slate-800" />
              <div className="h-12 bg-slate-950 flex gap-1 p-1">
                <div className="w-8 bg-[#0c1e3d] rounded" />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="h-2 bg-slate-800 rounded" />
                  <div className="h-2 w-2/3 bg-slate-700 rounded" />
                </div>
              </div>
            </div>
            {theme === 'dark' && (
              <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Your preference is saved automatically and applied on every page.</p>
      </Card>

      {/* Accent color */}
      <Card>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Accent Color</h3>
        <p className="text-xs text-slate-400 mb-4">Sets the highlight color for active elements and buttons.</p>
        <div className="flex items-center gap-3 flex-wrap">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAccent(opt.id)}
              title={opt.label}
              className={`flex flex-col items-center gap-2 group`}
            >
              <div className={`h-9 w-9 rounded-full ${opt.bg} transition-all ${accent === opt.id ? `ring-2 ring-offset-2 ${opt.ring} scale-110` : 'opacity-70 hover:opacity-100 hover:scale-105'}`} />
              <span className={`text-[10px] font-semibold ${accent === opt.id ? 'text-slate-800' : 'text-slate-400'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">Note: Accent color changes take effect on next page load.</p>
      </Card>

      {/* Current settings summary */}
      <Card>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Current Settings</h3>
        <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-[#f0f4fa]">
              <tr>
                <td className="py-2.5 pl-4 pr-3 w-32 text-xs font-semibold text-slate-500 bg-[#f8fafd] uppercase tracking-wide">Theme</td>
                <td className="py-2.5 pl-3 pr-4 text-sm font-medium text-slate-800 capitalize">{theme}</td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-xs font-semibold text-slate-500 bg-[#f8fafd] uppercase tracking-wide">Accent</td>
                <td className="py-2.5 pl-3 pr-4 text-sm font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`h-3.5 w-3.5 rounded-full ${ACCENT_OPTIONS.find((o) => o.id === accent)?.bg}`} />
                    {ACCENT_OPTIONS.find((o) => o.id === accent)?.label}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
