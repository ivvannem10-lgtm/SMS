import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_SOA } from '@/lib/mock-data'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const studentId = searchParams.get('studentId')
  const semesterId = searchParams.get('semesterId')

  let results = [...MOCK_SOA]
  if (studentId) results = results.filter((s) => s.studentId === studentId)
  if (semesterId) results = results.filter((s) => s.semesterId === semesterId)

  return NextResponse.json({ data: results, total: results.length })
}
