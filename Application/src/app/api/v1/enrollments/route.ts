import { NextRequest } from 'next/server'
import { MOCK_ENROLLMENTS, MOCK_OFFERINGS, MOCK_SEMESTERS, MOCK_STUDENTS } from '@/lib/mock-data'
import { validateRequest, ok, err, created, options } from '@/lib/api-middleware'
import type { EnrollmentStatus } from '@/types'

export async function OPTIONS() {
  return options()
}

export async function GET(request: NextRequest) {
  const auth = validateRequest(request, 'enrollments:read')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  const { searchParams } = request.nextUrl
  const studentId = searchParams.get('studentId')
  const status    = searchParams.get('status') as EnrollmentStatus | null
  const semester  = searchParams.get('semester')

  let results = [...MOCK_ENROLLMENTS]

  if (studentId) results = results.filter((e) => e.studentId === studentId)
  if (status)    results = results.filter((e) => e.status === status)
  if (semester)  results = results.filter((e) => e.semesterId === semester)

  return ok(results, { total: results.length })
}

export async function POST(request: NextRequest) {
  const auth = validateRequest(request, 'enrollments:write')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  let body: { studentId?: string; offeringIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return err('INVALID_JSON', 'Request body must be valid JSON.', 400)
  }

  const { studentId, offeringIds } = body
  if (!studentId || !Array.isArray(offeringIds) || offeringIds.length === 0) {
    return err('VALIDATION_ERROR', 'studentId and offeringIds[] are required.', 400)
  }

  // Validate student exists
  const student = MOCK_STUDENTS.find((s) => s.id === studentId)
  if (!student) return err('NOT_FOUND', 'Student not found.', 404)

  const activeSemester = MOCK_SEMESTERS.find((s) => s.isActive)
  if (!activeSemester) return err('NO_ACTIVE_SEMESTER', 'No active semester found.', 409)

  // Validate offerings exist
  const invalidOfferings = offeringIds.filter((id) => !MOCK_OFFERINGS.find((o) => o.id === id))
  if (invalidOfferings.length > 0) {
    return err('INVALID_OFFERINGS', `Offerings not found: ${invalidOfferings.join(', ')}`, 400)
  }

  const now = new Date().toISOString()
  const enrollments = offeringIds.map((offeringId) => ({
    id:          `enr_api_${Date.now()}_${offeringId}`,
    status:      'PRE_ENROLLED' as EnrollmentStatus,
    studentId,
    offeringId,
    semesterId:  activeSemester.id,
    createdAt:   now,
    updatedAt:   now,
  }))

  MOCK_ENROLLMENTS.push(...enrollments)

  return created({
    enrollments,
    message: 'Pre-enrollment submitted. Proceed to Treasury for payment.',
  })
}
