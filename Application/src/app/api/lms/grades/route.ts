import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_GRADES } from '@/lib/mock-data'
import { computeFinalGrade, gradeToLetter } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const enrollmentId = searchParams.get('enrollmentId')
  const offeringId = searchParams.get('offeringId')

  let grades = [...MOCK_GRADES]
  if (enrollmentId) grades = grades.filter((g) => g.enrollmentId === enrollmentId)

  return NextResponse.json({ data: grades })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!['SUPER_ADMIN', 'TEACHER', 'REGISTRAR'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { enrollmentId, quizAverage, assignmentAverage, midtermGrade, finalExamGrade } = body
  if (!enrollmentId) return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 })

  const existing = MOCK_GRADES.find((g) => g.enrollmentId === enrollmentId)
  const quiz = quizAverage ?? existing?.quizAverage
  const assign = assignmentAverage ?? existing?.assignmentAverage
  const midterm = midtermGrade ?? existing?.midtermGrade
  const finalExam = finalExamGrade ?? existing?.finalExamGrade

  let finalGrade: number | null = null
  let letterGrade: string | null = null
  let status = 'IN_PROGRESS'

  if (quiz !== null && assign !== null && finalExam !== null && quiz !== undefined && assign !== undefined && finalExam !== undefined) {
    finalGrade = computeFinalGrade(quiz, assign, finalExam, { quiz: 30, assignment: 30, exam: 40 })
    letterGrade = gradeToLetter(finalGrade)
    status = finalGrade >= 60 ? 'PASSED' : 'FAILED'
  }

  const user = session.user as { name?: string }
  const updated = {
    ...existing,
    enrollmentId,
    quizAverage: quiz,
    assignmentAverage: assign,
    midtermGrade: midterm,
    finalExamGrade: finalExam,
    finalGrade,
    letterGrade,
    status,
    gradedBy: user.name,
    gradedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json({ data: updated })
}
