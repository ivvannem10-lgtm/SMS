import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submissions = await db.formSubmission.findMany({
      where: { formId: params.id },
      orderBy: { submittedAt: 'desc' },
    })
    return NextResponse.json(submissions)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const [submission] = await db.$transaction([
      db.formSubmission.create({ data: { ...body, formId: params.id } }),
      db.institutionalForm.update({
        where: { id: params.id },
        data: { submissionCount: { increment: 1 } },
      }),
    ])
    return NextResponse.json(submission, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
