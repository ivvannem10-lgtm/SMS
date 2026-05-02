import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_APPLICANTS } from '@/lib/mock-data'
import { generateReferenceNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const q = searchParams.get('q')?.toLowerCase()

  let results = [...MOCK_APPLICANTS]
  if (status && status !== 'ALL') results = results.filter((a) => a.status === status)
  if (q) results = results.filter((a) => `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.referenceNumber.toLowerCase().includes(q))

  return NextResponse.json({ data: results, total: results.length })
}

export async function POST(req: NextRequest) {
  // Public route — no auth required for applicants
  const body = await req.json()
  if (!body.firstName || !body.lastName || !body.email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const newApplicant = {
    id: `app_${Date.now()}`,
    referenceNumber: generateReferenceNumber(),
    ...body,
    status: 'PENDING',
    applicantType: body.applicantType ?? 'FRESHMAN',
    schoolId: 'school_1',
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json({ data: newApplicant, message: `Reference number: ${newApplicant.referenceNumber}` }, { status: 201 })
}
