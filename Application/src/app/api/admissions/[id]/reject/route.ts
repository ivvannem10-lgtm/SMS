import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_APPLICANTS } from '@/lib/mock-data'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!['SUPER_ADMIN', 'ADMISSION_OFFICER'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const applicant = MOCK_APPLICANTS.find((a) => a.id === id)
  if (!applicant) return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })

  const body = await req.json()
  const user = session.user as { name?: string }

  const updated = {
    ...applicant,
    status: 'REJECTED',
    rejectionReason: body.reason ?? 'Application did not meet requirements.',
    reviewedBy: user.name,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json({ data: updated, message: 'Application rejected.' })
}
