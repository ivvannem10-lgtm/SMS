export interface ApiKey {
  id: string
  name: string
  prefix: string       // e.g. "sis_live_ab"  (first 12 chars, for display only)
  hash: string         // SHA-256 of the full key
  scopes: ApiScope[]
  createdBy: string
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  isActive: boolean
  schoolId: string
}

export type ApiScope =
  | 'students:read'  | 'students:write'
  | 'staff:read'     | 'staff:write'
  | 'courses:read'   | 'courses:write'
  | 'grades:read'    | 'grades:write'
  | 'enrollments:read' | 'enrollments:write'
  | 'financial:read'

export const API_SCOPES: { value: ApiScope; label: string; description: string }[] = [
  { value: 'students:read',      label: 'Students — Read',      description: 'List and retrieve student records' },
  { value: 'students:write',     label: 'Students — Write',     description: 'Create, update, and delete students' },
  { value: 'staff:read',         label: 'Staff — Read',         description: 'List and retrieve staff members' },
  { value: 'staff:write',        label: 'Staff — Write',        description: 'Manage staff records' },
  { value: 'courses:read',       label: 'Courses — Read',       description: 'List and retrieve subject offerings' },
  { value: 'courses:write',      label: 'Courses — Write',      description: 'Create and update subject offerings' },
  { value: 'grades:read',        label: 'Grades — Read',        description: 'Read published grade submissions' },
  { value: 'grades:write',       label: 'Grades — Write',       description: 'Submit and manage grades' },
  { value: 'enrollments:read',   label: 'Enrollments — Read',   description: 'List and retrieve enrollments' },
  { value: 'enrollments:write',  label: 'Enrollments — Write',  description: 'Create and manage enrollments' },
  { value: 'financial:read',     label: 'Financial — Read',     description: 'Read financial records (SOA, payments)' },
]

// Roles that can access API management (all admin roles except teacher/student)
export const API_ADMIN_ROLES = [
  'SUPER_ADMIN', 'REGISTRAR', 'ACADEMIC_ADMIN', 'DEAN',
  'TREASURER', 'ACCOUNTING', 'HR_STAFF', 'AMO',
  'PURCHASING_OFFICER', 'ADMISSION_OFFICER',
] as const
export type ApiAdminRole = typeof API_ADMIN_ROLES[number]

// Default scopes pre-selected per role when opening the Generate Key modal
export const ROLE_DEFAULT_SCOPES: Partial<Record<ApiAdminRole, ApiScope[]>> = {
  REGISTRAR:          ['students:read', 'students:write', 'enrollments:read', 'enrollments:write', 'grades:read'],
  ACADEMIC_ADMIN:     ['courses:read', 'courses:write', 'grades:read', 'grades:write', 'enrollments:read'],
  DEAN:               ['students:read', 'grades:read', 'courses:read', 'enrollments:read'],
  TREASURER:          ['financial:read'],
  ACCOUNTING:         ['financial:read'],
  HR_STAFF:           ['staff:read', 'staff:write'],
  ADMISSION_OFFICER:  ['students:read', 'students:write'],
  PURCHASING_OFFICER: ['financial:read'],
  AMO:                ['staff:read'],
}

// Starts empty — keys are generated at runtime and live in memory.
export const MOCK_API_KEYS: ApiKey[] = []

let _keyCounter = 1
export function nextKeyId(): string {
  return `apikey_${String(_keyCounter++).padStart(4, '0')}`
}
