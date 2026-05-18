import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const schoolId = searchParams.get('schoolId')
    const where = schoolId ? { schoolId } : {}
    const articles = await db.kBArticle.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    })
    return NextResponse.json(articles)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch KB articles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const article = await db.kBArticle.create({ data: body })
    return NextResponse.json(article, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create KB article' }, { status: 500 })
  }
}
