import { cn } from '@/lib/utils'
import type { ApplicantStatus, EnrollmentStatus, SOAStatus, GradeStatus, PaymentStatus } from '@/types'

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset',
      className,
    )}>
      {children}
    </span>
  )
}

// ─── Typed status badges ───────────────────────────────────────────────────────

export function ApplicantBadge({ status }: { status: ApplicantStatus }) {
  const map: Record<ApplicantStatus, { label: string; cls: string }> = {
    PENDING:      { label: 'Pending',      cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    UNDER_REVIEW: { label: 'Under Review', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    ACCEPTED:     { label: 'Accepted',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    REJECTED:     { label: 'Rejected',     cls: 'bg-red-50 text-red-700 ring-red-200' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return <Badge className={cls}>{label}</Badge>
}

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  const map: Record<EnrollmentStatus, { label: string; cls: string }> = {
    PRE_ENROLLED:    { label: 'Pre-enrolled',    cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    PAYMENT_PENDING: { label: 'Payment Pending', cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
    ENROLLED:        { label: 'Enrolled',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    DROPPED:         { label: 'Dropped',         cls: 'bg-red-50 text-red-700 ring-red-200' },
    COMPLETED:       { label: 'Completed',       cls: 'bg-brand-50 text-brand-600 ring-brand-200' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return <Badge className={cls}>{label}</Badge>
}

export function SOABadge({ status }: { status: SOAStatus }) {
  const map: Record<SOAStatus, { label: string; cls: string }> = {
    UNPAID:    { label: 'Unpaid',    cls: 'bg-red-50 text-red-700 ring-red-200' },
    PARTIAL:   { label: 'Partial',   cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    PAID:      { label: 'Paid',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    OVERPAID:  { label: 'Overpaid',  cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return <Badge className={cls}>{label}</Badge>
}

export function GradeBadge({ status }: { status: GradeStatus }) {
  const map: Record<GradeStatus, { label: string; cls: string }> = {
    IN_PROGRESS: { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    PASSED:      { label: 'Passed',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    FAILED:      { label: 'Failed',      cls: 'bg-red-50 text-red-700 ring-red-200' },
    INC:         { label: 'Incomplete',  cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    W:           { label: 'Withdrawn',   cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return <Badge className={cls}>{label}</Badge>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    PENDING:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    VALIDATED: { label: 'Validated', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    VOIDED:    { label: 'Voided',    cls: 'bg-red-50 text-red-700 ring-red-200' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return <Badge className={cls}>{label}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    SUPER_ADMIN:       'bg-brand-900 text-white ring-brand-800',
    ADMISSION_OFFICER: 'bg-violet-50 text-violet-700 ring-violet-200',
    REGISTRAR:         'bg-brand-50 text-brand-600 ring-brand-200',
    TREASURER:         'bg-emerald-50 text-emerald-700 ring-emerald-200',
    ACADEMIC_ADMIN:    'bg-cyan-50 text-cyan-700 ring-cyan-200',
    ACCOUNTING:        'bg-teal-50 text-teal-700 ring-teal-200',
    DEAN:              'bg-brand-100 text-brand-700 ring-brand-300',
    HR_STAFF:          'bg-pink-50 text-pink-700 ring-pink-200',
    TEACHER:           'bg-orange-50 text-orange-700 ring-orange-200',
    STUDENT:           'bg-slate-100 text-slate-600 ring-slate-200',
  }
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin', ADMISSION_OFFICER: 'Admission', REGISTRAR: 'Registrar',
    TREASURER: 'Treasurer', ACADEMIC_ADMIN: 'Academic Admin', ACCOUNTING: 'Accounting',
    DEAN: 'Dean', HR_STAFF: 'HR Staff', TEACHER: 'Teacher', STUDENT: 'Student',
  }
  return <Badge className={map[role] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}>{labels[role] ?? role}</Badge>
}
