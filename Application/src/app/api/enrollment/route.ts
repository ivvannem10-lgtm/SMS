import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_ENROLLMENTS, MOCK_OFFERINGS, MOCK_SEMESTERS } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const studentId = searchParams.get('studentId')
  const semesterId = searchParams.get('semesterId') ?? MOCK_SEMESTERS.find((s) => s.isActive)?.id

  let results = [...MOCK_ENROLLMENTS]
  if (studentId) results = results.filter((e) => e.studentId === studentId)
  if (semesterId) results = results.filter((e) => e.semesterId === semesterId)

  return NextResponse.json({ data: results, total: results.length })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { studentId, offeringIds } = body

  if (!studentId || !offeringIds?.length) {
    return NextResponse.json({ error: 'studentId and offeringIds[] required' }, { status: 400 })
  }

  const activeSemester = MOCK_SEMESTERS.find((s) => s.isActive)
  if (!activeSemester) return NextResponse.json({ error: 'No active semester' }, { status: 409 })

  const totalUnits = offeringIds.reduce((sum: number, id: string) => {
    const offering = MOCK_OFFERINGS.find((o) => o.id === id)
    return sum + (offering?.subject?.units ?? 0)
  }, 0)

  if (totalUnits > activeSemester.maxUnits) {
    return NextResponse.json({ error: `Unit limit exceeded. Max ${activeSemester.maxUnits} units per semester.` }, { status: 400 })
  }

  const enrollments = offeringIds.map((offeringId: string) => ({
    id: `enr_${Date.now()}_${offeringId}`,
    status: 'PRE_ENROLLED',
    studentId,
    offeringId,
    semesterId: activeSemester.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  return NextResponse.json({ data: enrollments, totalUnits, message: 'Pre-enrollment submitted. Proceed to Treasury for payment.' }, { status: 201 })
}
