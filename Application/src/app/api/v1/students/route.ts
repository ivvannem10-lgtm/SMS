import { NextRequest } from 'next/server'
import { MOCK_STUDENTS } from '@/lib/mock-data'
import { validateRequest, ok, err, created, options } from '@/lib/api-middleware'
import type { StudentStatus } from '@/types'

export async function OPTIONS() {
  return options()
}

export async function GET(request: NextRequest) {
  const auth = validateRequest(request, 'students:read')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  const { searchParams } = request.nextUrl
  const search   = searchParams.get('search')?.toLowerCase() ?? ''
  const status   = searchParams.get('status') as StudentStatus | null
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

  let results = [...MOCK_STUDENTS]

  if (search) {
    results = results.filter((s) =>
      s.firstName.toLowerCase().includes(search) ||
      s.lastName.toLowerCase().includes(search)  ||
      s.email.toLowerCase().includes(search)     ||
      s.studentId.toLowerCase().includes(search),
    )
  }

  if (status) {
    results = results.filter((s) => s.status === status)
  }

  const total = results.length
  const data  = results.slice((page - 1) * limit, page * limit).map(safeStudent)

  return ok(data, { total, page, limit, pages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = validateRequest(request, 'students:write')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return err('INVALID_JSON', 'Request body must be valid JSON.', 400)
  }

  const { firstName, lastName, email, program, yearLevel, status } = body as Record<string, string | number>

  if (!firstName || !lastName || !email) {
    return err('VALIDATION_ERROR', 'firstName, lastName, and email are required.', 400)
  }

  // Check email uniqueness
  if (MOCK_STUDENTS.some((s) => s.email === email)) {
    return err('DUPLICATE_EMAIL', 'A student with this email already exists.', 409)
  }

  const now = new Date().toISOString()
  const id  = `st_api_${Date.now()}`
  const newStudent = {
    id,
    studentId: `API-${Date.now().toString().slice(-6)}`,
    firstName:  String(firstName),
    lastName:   String(lastName),
    email:      String(email),
    programId:  program ? String(program) : undefined,
    yearLevel:  typeof yearLevel === 'number' ? yearLevel : 1,
    status:     (status ?? 'ACTIVE') as StudentStatus,
    schoolId:   'school_1',
    createdAt:  now,
    updatedAt:  now,
  }

  MOCK_STUDENTS.push(newStudent)

  return created(safeStudent(newStudent))
}

// Strip sensitive/circular fields
function safeStudent(s: (typeof MOCK_STUDENTS)[number]) {
  const { enrollments: _e, soa: _s, ...rest } = s as typeof s & { enrollments?: unknown; soa?: unknown }
  void _e; void _s
  return rest
}
