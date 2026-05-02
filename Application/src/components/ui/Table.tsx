import { cn } from '@/lib/utils'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full">{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead style={{ background: '#f0f4fa', borderBottom: '1px solid #dce8f7' }}>
      <tr>{children}</tr>
    </thead>
  )
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-2xs font-bold text-brand-700 uppercase tracking-widest whitespace-nowrap select-none',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-[#f0f4fa]">{children}</tbody>
  )
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'group transition-colors duration-100 bg-white',
        onClick && 'cursor-pointer hover:bg-brand-50',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn('px-4 py-3 text-sm text-slate-700 whitespace-nowrap', className)}
    >
      {children}
    </td>
  )
}
