import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_API_KEYS, nextKeyId, API_ADMIN_ROLES, type ApiScope } from '@/lib/mock-api-keys'
import { generateApiKey } from '@/lib/api-keys'
import { options } from '@/lib/api-middleware'
import type { SessionUser } from '@/types'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key',
}

export async function OPTIONS() {
  return options()
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401, headers: CORS })
  }
  if (!API_ADMIN_ROLES.includes(user.role as typeof API_ADMIN_ROLES[number])) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } }, { status: 403, headers: CORS })
  }

  // SUPER_ADMIN sees all keys; other admins see only their own
  const visible = user.role === 'SUPER_ADMIN'
    ? MOCK_API_KEYS
    : MOCK_API_KEYS.filter(k => k.createdBy === user.id)

  // Never return hash; mask the key — only return prefix
  const safeKeys = visible.map(({ hash: _h, ...rest }) => {
    void _h
    return rest
  })

  return NextResponse.json({ success: true, data: safeKeys }, { status: 200, headers: CORS })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401, headers: CORS })
  }
  if (!API_ADMIN_ROLES.includes(user.role as typeof API_ADMIN_ROLES[number])) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } }, { status: 403, headers: CORS })
  }

  let body: { name?: string; scopes?: ApiScope[]; expiresAt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } }, { status: 400, headers: CORS })
  }

  const { name, scopes, expiresAt } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required.' } }, { status: 400, headers: CORS })
  }
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'scopes[] must be a non-empty array.' } }, { status: 400, headers: CORS })
  }

  const { key, prefix, hash } = generateApiKey()

  const apiKey = {
    id:        nextKeyId(),
    name:      name.trim(),
    prefix,
    hash,
    scopes,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    isActive:  true,
    schoolId:  user.schoolId,
    ...(expiresAt ? { expiresAt } : {}),
  }

  MOCK_API_KEYS.push(apiKey)

  // Return full key ONE TIME — never again after this response
  const { hash: _h, ...safeApiKey } = apiKey
  void _h

  return NextResponse.json(
    { success: true, data: { ...safeApiKey, key } },
    { status: 201, headers: CORS },
  )
}
