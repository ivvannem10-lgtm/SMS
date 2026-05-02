import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_APPLICANTS, MOCK_STUDENTS } from '@/lib/mock-data'
import { generateStudentId } from '@/lib/utils'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!['SUPER_ADMIN', 'ADMISSION_OFFICER'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const applicant = MOCK_APPLICANTS.find((a) => a.id === id)
  if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
  if (applicant.status === 'ACCEPTED') return NextResponse.json({ error: 'Already accepted' }, { status: 409 })

  const studentId = generateStudentId(MOCK_STUDENTS.length + 1)
  const user = session.user as { name?: string }

  const updatedApplicant = {
    ...applicant,
    status: 'ACCEPTED',
    reviewedBy: user.name,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const newStudent = {
    id: `st_${Date.now()}`,
    studentId,
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    middleName: applicant.middleName,
    email: applicant.email,
    phone: applicant.phone,
    programId: applicant.programId,
    program: applicant.program,
    yearLevel: 1,
    status: 'ACTIVE',
    schoolId: applicant.schoolId,
    applicantId: applicant.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json({
    data: { applicant: updatedApplicant, student: newStudent, studentId },
    message: `Applicant accepted. Student ID assigned: ${studentId}`,
  })
}
