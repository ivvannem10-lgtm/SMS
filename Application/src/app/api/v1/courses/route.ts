import { NextRequest } from 'next/server'
import { MOCK_OFFERINGS, MOCK_SEMESTERS } from '@/lib/mock-data'
import { validateRequest, ok, err, options } from '@/lib/api-middleware'
import type { OfferingStatus } from '@/types'

export async function OPTIONS() {
  return options()
}

export async function GET(request: NextRequest) {
  const auth = validateRequest(request, 'courses:read')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  const { searchParams } = request.nextUrl
  const status    = searchParams.get('status') as OfferingStatus | null
  const semester  = searchParams.get('semester')
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

  let results = [...MOCK_OFFERINGS]

  if (status) {
    results = results.filter((o) => o.status === status)
  }

  if (semester) {
    // Match by semesterId or semester name/type
    results = results.filter((o) => {
      const sem = MOCK_SEMESTERS.find((s) => s.id === o.semesterId)
      return o.semesterId === semester || sem?.name === semester || sem?.type === semester
    })
  }

  const total = results.length
  const data  = results.slice((page - 1) * limit, page * limit).map((o) => ({
    id:         o.id,
    status:     o.status,
    section:    o.section,
    maxStudents: o.maxStudents,
    semesterId: o.semesterId,
    semester:   MOCK_SEMESTERS.find((s) => s.id === o.semesterId),
    subject:    o.subject,
    subjectId:  o.subjectId,
    schedules:  o.schedules ?? [],
    enrollmentCount: o._count?.enrollments ?? (o.enrollments?.length ?? 0),
    createdAt:  o.createdAt,
  }))

  return ok(data, { total, page, limit, pages: Math.ceil(total / limit) })
}
