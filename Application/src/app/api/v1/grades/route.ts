import { NextRequest } from 'next/server'
import { MOCK_GRADE_SUBMISSIONS } from '@/lib/mock-data'
import { validateRequest, ok, err, options } from '@/lib/api-middleware'

export async function OPTIONS() {
  return options()
}

export async function GET(request: NextRequest) {
  const auth = validateRequest(request, 'grades:read')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  const { searchParams } = request.nextUrl
  const studentId  = searchParams.get('studentId')
  const offeringId = searchParams.get('offeringId')
  const semester   = searchParams.get('semester')

  // Only expose PUBLISHED submissions
  let results = MOCK_GRADE_SUBMISSIONS.filter((gs) => gs.status === 'PUBLISHED')

  if (offeringId) {
    results = results.filter((gs) => gs.offeringId === offeringId)
  }

  if (semester) {
    results = results.filter((gs) => gs.semesterId === semester)
  }

  if (studentId) {
    // Filter down to only entries for this student
    results = results
      .map((gs) => ({
        ...gs,
        entries: gs.entries.filter((e) => e.studentId === studentId),
      }))
      .filter((gs) => gs.entries.length > 0)
  }

  return ok(results, { total: results.length })
}
