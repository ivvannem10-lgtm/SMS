'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AlertTriangle, Trash2, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConfirmVariant = 'danger' | 'warning' | 'success' | 'info'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

// ── Context ───────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false))

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open,    setOpen]    = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' })
  const resolveRef = useRef<(value: boolean) => void>(() => {})

  const confirm: ConfirmFn = useCallback((opts) => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function handleConfirm() { setOpen(false); resolveRef.current(true)  }
  function handleCancel()  { setOpen(false); resolveRef.current(false) }

  const VARIANT_CONFIG: Record<ConfirmVariant, {
    icon: React.ElementType; iconCls: string; borderCls: string; btnCls: string; defaultLabel: string
  }> = {
    danger:  { icon: Trash2,         iconCls: 'bg-red-100 text-red-600',     borderCls: 'border-red-500',    btnCls: 'bg-red-500 hover:bg-red-600',       defaultLabel: 'Delete'  },
    warning: { icon: AlertTriangle,  iconCls: 'bg-amber-100 text-amber-600', borderCls: 'border-amber-500',  btnCls: 'bg-amber-500 hover:bg-amber-600',   defaultLabel: 'Proceed' },
    success: { icon: CheckCircle,    iconCls: 'bg-emerald-100 text-emerald-600', borderCls: 'border-emerald-500', btnCls: 'bg-emerald-500 hover:bg-emerald-600', defaultLabel: 'Confirm' },
    info:    { icon: Info,           iconCls: 'bg-brand-100 text-brand-600',  borderCls: 'border-brand-500',  btnCls: 'bg-brand-500 hover:bg-brand-600',   defaultLabel: 'Confirm' },
  }

  const v = VARIANT_CONFIG[options.variant ?? 'info']
  const Icon = v.icon

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative w-[400px] rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Accent bar + header */}
            <div className={cn('border-l-[3px] px-5 py-4 flex items-start gap-3', v.borderCls)}>
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5', v.iconCls)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{options.title}</p>
                {options.message && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{options.message}</p>
                )}
              </div>
              <button onClick={handleCancel} className="rounded-lg p-1 hover:bg-slate-100 shrink-0 transition-colors">
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={cn('rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors', v.btnCls)}
              >
                {options.confirmLabel ?? v.defaultLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
