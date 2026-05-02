import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

export type FlowStage = {
  id: string
  label: string
  sublabel?: string
  status: 'completed' | 'active' | 'pending' | 'blocked'
  color: string
  lightColor: string
  textColor: string
}

const PIPELINE_STAGES: Omit<FlowStage, 'status' | 'sublabel'>[] = [
  { id: 'admissions', label: 'Admissions',  color: 'bg-violet-600', lightColor: 'bg-violet-50',  textColor: 'text-violet-700' },
  { id: 'registrar',  label: 'Registrar',   color: 'bg-blue-600',   lightColor: 'bg-blue-50',    textColor: 'text-blue-700' },
  { id: 'treasury',   label: 'Treasury',    color: 'bg-emerald-600',lightColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
  { id: 'sis',        label: 'SIS Created', color: 'bg-slate-700',  lightColor: 'bg-slate-100',  textColor: 'text-slate-700' },
  { id: 'lms',        label: 'LMS Active',  color: 'bg-orange-500', lightColor: 'bg-orange-50',  textColor: 'text-orange-700' },
]

interface ProcessFlowProps {
  activeStage?: string
  statuses?: Partial<Record<string, 'completed' | 'active' | 'pending' | 'blocked'>>
  sublabels?: Partial<Record<string, string>>
  className?: string
}

export function ProcessFlow({ activeStage, statuses, sublabels, className }: ProcessFlowProps) {
  return (
    <div className={cn('flex items-center gap-0 overflow-x-auto', className)}>
      {PIPELINE_STAGES.map((stage, i) => {
        const status = statuses?.[stage.id] ?? (stage.id === activeStage ? 'active' : 'pending')
        const sublabel = sublabels?.[stage.id]
        const isLast = i === PIPELINE_STAGES.length - 1

        return (
          <div key={stage.id} className="flex items-center">
            {/* Station */}
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 transition-all',
                status === 'completed' && `${stage.lightColor} ${stage.textColor}`,
                status === 'active' && `${stage.color} text-white shadow-md`,
                status === 'pending' && 'bg-slate-100 text-slate-400',
                status === 'blocked' && 'bg-red-50 text-red-400',
              )}>
                {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                {status === 'active' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
                {status === 'pending' && <Circle className="h-3.5 w-3.5 shrink-0" />}
                {status === 'blocked' && <Circle className="h-3.5 w-3.5 shrink-0" />}
                <span className="text-xs font-semibold whitespace-nowrap">{stage.label}</span>
              </div>
              {sublabel && (
                <span className={cn('text-[10px] font-medium', status === 'active' ? stage.textColor : 'text-slate-400')}>
                  {sublabel}
                </span>
              )}
            </div>

            {/* Connector rail */}
            {!isLast && (
              <div className={cn(
                'h-0.5 w-8 mx-1 shrink-0 rounded-full transition-all',
                status === 'completed' ? 'bg-emerald-300' : 'bg-slate-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Compact badge version for student/staff views
export function StageBadge({ stage }: { stage: string }) {
  const s = PIPELINE_STAGES.find((p) => p.id === stage)
  if (!s) return null
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', s.lightColor, s.textColor)}>
      {s.label}
    </span>
  )
}
