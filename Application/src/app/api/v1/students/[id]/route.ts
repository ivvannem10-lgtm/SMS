import { NextRequest } from 'next/server'
import { MOCK_STUDENTS } from '@/lib/mock-data'
import { validateRequest, ok, err, options } from '@/lib/api-middleware'
import type { StudentStatus } from '@/types'

export async function OPTIONS() {
  return options()
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = validateRequest(request, 'students:read')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  const student = MOCK_STUDENTS.find((s) => s.id === params.id || s.studentId === params.id)
  if (!student) return err('NOT_FOUND', 'Student not found.', 404)

  return ok(safeStudent(student))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = validateRequest(request, 'students:write')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  const idx = MOCK_STUDENTS.findIndex((s) => s.id === params.id || s.studentId === params.id)
  if (idx === -1) return err('NOT_FOUND', 'Student not found.', 404)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return err('INVALID_JSON', 'Request body must be valid JSON.', 400)
  }

  // Whitelist patchable fields
  const allowed: (keyof typeof MOCK_STUDENTS[number])[] = [
    'firstName', 'lastName', 'middleName', 'email', 'phone',
    'address', 'dateOfBirth', 'gender', 'status', 'yearLevel',
    'programId', 'guardianName', 'guardianRelation', 'guardianPhone',
  ]

  const student = MOCK_STUDENTS[idx]
  for (const key of allowed) {
    if (key in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(student as any)[key] = body[key]
    }
  }

  if ('status' in body && !['ACTIVE', 'INACTIVE', 'GRADUATED', 'DROPPED'].includes(String(body.status))) {
    return err('VALIDATION_ERROR', 'Invalid status value.', 400)
  }

  student.status   = (body.status as StudentStatus) ?? student.status
  student.updatedAt = new Date().toISOString()

  return ok(safeStudent(student))
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = validateRequest(request, 'students:write')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  const idx = MOCK_STUDENTS.findIndex((s) => s.id === params.id || s.studentId === params.id)
  if (idx === -1) return err('NOT_FOUND', 'Student not found.', 404)

  MOCK_STUDENTS.splice(idx, 1)
  return ok({ id: params.id, deleted: true })
}

function safeStudent(s: (typeof MOCK_STUDENTS)[number]) {
  const { enrollments: _e, soa: _s, ...rest } = s as typeof s & { enrollments?: unknown; soa?: unknown }
  void _e; void _s
  return rest
}
