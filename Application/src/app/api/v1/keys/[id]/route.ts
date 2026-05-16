import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_API_KEYS, API_ADMIN_ROLES } from '@/lib/mock-api-keys'
import { options } from '@/lib/api-middleware'
import type { SessionUser } from '@/types'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key',
}

export async function OPTIONS() {
  return options()
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401, headers: CORS })
  }
  if (!API_ADMIN_ROLES.includes(user.role as typeof API_ADMIN_ROLES[number])) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } }, { status: 403, headers: CORS })
  }

  const apiKey = MOCK_API_KEYS.find((k) => k.id === params.id)
  // Non-SUPER_ADMIN can only revoke their own keys
  if (apiKey && user.role !== 'SUPER_ADMIN' && apiKey.createdBy !== user.id) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only revoke your own API keys.' } }, { status: 403, headers: CORS })
  }
  if (!apiKey) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'API key not found.' } }, { status: 404, headers: CORS })
  }

  // Deactivate — soft delete
  apiKey.isActive = false

  return NextResponse.json(
    { success: true, data: { id: params.id, isActive: false, message: 'API key revoked.' } },
    { status: 200, headers: CORS },
  )
}
