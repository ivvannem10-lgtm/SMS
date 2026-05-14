import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  active?: boolean
}

const padMap = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

export function Card({ children, className, padding = 'md', hover, active }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#e4ebf5] shadow-card',
        padMap[padding],
        hover && 'transition-all duration-150 cursor-pointer hover:shadow-card-md hover:-translate-y-px hover:border-brand-200',
        active && 'ring-2 ring-brand-500 border-brand-300',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-800 tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function SectionTitle({
  children,
  description,
  actions,
  className,
}: {
  children: React.ReactNode
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('sticky top-14 z-[30] -mx-6 -mt-6 mb-6 flex items-center justify-between gap-4 border-b border-slate-100 bg-[#f3f6fb]/95 backdrop-blur-sm px-6 py-4', className)}>
      <div className="relative pl-3.5">
        {/* Navy left accent bar */}
        <span className="absolute left-0 top-0.5 bottom-0.5 w-[3px] rounded-full bg-brand-500" />
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">{children}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 font-normal">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: React.ElementType
  color?: string
  trend?: React.ReactNode
}) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums leading-none">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
          {trend && <div className="mt-2">{trend}</div>}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ml-3', color ?? 'bg-brand-50 text-brand-500')}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  )
}
