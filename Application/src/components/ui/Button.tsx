'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'soft' | 'navy'
type Size    = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const base = [
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg select-none',
  'transition-all duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
].join(' ')

const variants: Record<Variant, string> = {
  // Navy — primary CTA, university-branded
  primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  // Navy gradient — more prominent version
  navy:      'bg-brand-gradient text-white hover:brightness-110 active:brightness-95 shadow-md',
  // Neutral secondary
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
  // Ghost — no background
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  // Destructive
  danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
  // Card-like outline
  outline:   'border border-[#e4ebf5] bg-white text-slate-700 hover:bg-surface hover:border-slate-300 shadow-inner',
  // Positive action
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
  // Soft brand tint
  soft:      'bg-brand-50 text-brand-600 hover:bg-brand-100 active:bg-brand-200 border border-brand-100',
}

const sizes: Record<Size, string> = {
  xs: 'h-6 px-2.5 text-xs rounded-md gap-1.5',
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <span className="shrink-0 leading-none">{icon}</span>
      ) : null}
      {children}
      {!loading && iconRight && <span className="shrink-0 leading-none">{iconRight}</span>}
    </button>
  ),
)
Button.displayName = 'Button'
