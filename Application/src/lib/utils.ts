import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ApplicantStatus, EnrollmentStatus, SOAStatus, GradeStatus, PaymentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fullName(p: { firstName: string; lastName: string; middleName?: string | null }) {
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')
}

export function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function formatDate(date?: string | Date | null, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...opts })
}

export function formatDateTime(date?: string | Date | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}

export function generateStudentId(count: number, year = new Date().getFullYear()) {
  return `${year}-${String(count).padStart(5, '0')}`
}

export function generateReferenceNumber() {
  return `APP-${new Date().getFullYear()}-${Math.random().toString(36).toUpperCase().slice(2, 8)}`
}

export function generateReceiptNumber() {
  return `OR-${Date.now().toString().slice(-8)}`
}

export const DAY_ABBR: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

export const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export const APPLICANT_STATUS_COLORS: Record<ApplicantStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REJECTED: 'bg-red-50 text-red-700 ring-red-600/20',
}

export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  PRE_ENROLLED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PAYMENT_PENDING: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  ENROLLED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DROPPED: 'bg-red-50 text-red-700 ring-red-600/20',
  COMPLETED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

export const SOA_STATUS_COLORS: Record<SOAStatus, string> = {
  UNPAID:   'bg-red-50 text-red-700 ring-red-600/20',
  PARTIAL:  'bg-amber-50 text-amber-700 ring-amber-600/20',
  PAID:     'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  OVERPAID: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

export const GRADE_STATUS_COLORS: Record<GradeStatus, string> = {
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  PASSED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  FAILED: 'bg-red-50 text-red-700 ring-red-600/20',
  INC: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  W: 'bg-gray-100 text-gray-600 ring-gray-500/20',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  VALIDATED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  VOIDED: 'bg-red-50 text-red-700 ring-red-600/20',
}

// Module color system (train stations)
export const MODULE_COLORS = {
  admissions: { bg: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', ring: 'ring-violet-600/20' },
  registrar:  { bg: 'bg-blue-600',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   ring: 'ring-blue-600/20' },
  treasury:   { bg: 'bg-emerald-600',light: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',ring: 'ring-emerald-600/20' },
  sis:        { bg: 'bg-slate-700',  light: 'bg-slate-100', text: 'text-slate-700',  border: 'border-slate-200',  ring: 'ring-slate-500/20' },
  lms:        { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', ring: 'ring-orange-600/20' },
}

export function gradeToLetter(grade: number): string {
  if (grade >= 97) return '1.00'
  if (grade >= 93) return '1.25'
  if (grade >= 89) return '1.50'
  if (grade >= 85) return '1.75'
  if (grade >= 81) return '2.00'
  if (grade >= 77) return '2.25'
  if (grade >= 73) return '2.50'
  if (grade >= 69) return '2.75'
  if (grade >= 65) return '3.00'
  return '5.00'
}

export function computeFinalGrade(quiz: number, assignment: number, exam: number, weights: { quiz: number; assignment: number; exam: number }) {
  return Math.round(
    ((quiz * weights.quiz + assignment * weights.assignment + exam * weights.exam) / 100) * 100,
  ) / 100
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMISSION_OFFICER: 'Admission Officer',
  REGISTRAR: 'Registrar',
  TREASURER: 'Treasurer',
  ACADEMIC_ADMIN: 'Academic Admin',
  ACCOUNTING: 'Accounting',
  DEAN: 'Dean',
  HR_STAFF: 'HR Staff',
  AMO: 'Asset Management',
  PURCHASING_OFFICER: 'Purchasing Officer',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
}

// Maps faculty/subject department strings → Dean college name
export const FACULTY_DEPT_TO_COLLEGE: Record<string, string> = {
  'Computer Science': 'College of Computing',
  'Information Technology': 'College of Computing',
  'Mathematics': 'College of Computing',
  'Business Administration': 'College of Business',
  'Accountancy': 'College of Business',
  'Nursing': 'College of Nursing',
  'Medicine': 'College of Nursing',
  'Education': 'Arts & Sciences',
  'Communication': 'Arts & Sciences',
  'Arts': 'Arts & Sciences',
}

export const ROLE_PORTALS: Record<string, string> = {
  SUPER_ADMIN: '/staff/dashboard',
  ADMISSION_OFFICER: '/staff/admissions',
  REGISTRAR: '/staff/registrar',
  TREASURER: '/staff/treasury',
  ACADEMIC_ADMIN: '/staff/academic',
  ACCOUNTING: '/staff/accounting',
  DEAN: '/staff/dean',
  HR_STAFF: '/staff/hr',
  AMO: '/staff/ams',
  PURCHASING_OFFICER: '/staff/purchasing',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
}

export function yearLevelLabel(level: number): string {
  const map: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' }
  return map[level] ?? `Year ${level}`
}
