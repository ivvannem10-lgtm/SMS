import { cn, initials } from '@/lib/utils'

const sizes = { xs: 'h-6 w-6 text-xs', sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-10 w-10 text-sm', xl: 'h-14 w-14 text-base' }
const colors = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700']

function colorFor(name: string) {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

export function Avatar({ name, src, size = 'md', className }: { name: string; src?: string | null; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  return (
    <div className={cn('flex items-center justify-center rounded-full font-semibold shrink-0', sizes[size], colorFor(name), className)} aria-label={name}>
      {initials(name)}
    </div>
  )
}
