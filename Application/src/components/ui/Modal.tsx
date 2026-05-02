'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean; onClose: () => void; title: string; description?: string
  children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; footer?: React.ReactNode
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className={cn(
        'relative w-full bg-white rounded-2xl shadow-card-lg flex flex-col max-h-[90vh] animate-slide-up',
        sizes[size],
      )}>
        {/* Header — navy left accent + clean layout */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#e4ebf5]">
          <div className="flex items-start gap-3">
            {/* Navy accent line */}
            <span className="mt-1 block w-[3px] h-5 rounded-full bg-brand-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e4ebf5] bg-surface/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmModal({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', loading, danger,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string
  description?: string; confirmLabel?: string; loading?: boolean; danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-slate-600 leading-relaxed">{description}</p>}
    </Modal>
  )
}
