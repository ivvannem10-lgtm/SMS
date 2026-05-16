import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-keys'
import { MOCK_API_KEYS, type ApiKey, type ApiScope } from '@/lib/mock-api-keys'

// ─── Validate incoming request ────────────────────────────────────────────────

export type ValidationResult =
  | { valid: true;  apiKey: ApiKey }
  | { valid: false; error: string; status: number }

export function validateRequest(
  request: NextRequest,
  requiredScope: ApiScope,
): ValidationResult {
  // Extract raw key from Authorization header or x-api-key header
  const authHeader = request.headers.get('authorization') ?? ''
  const xApiKey    = request.headers.get('x-api-key') ?? ''

  let rawKey = ''
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    rawKey = authHeader.slice(7).trim()
  } else if (xApiKey) {
    rawKey = xApiKey.trim()
  }

  if (!rawKey) {
    return { valid: false, error: 'Missing API key. Provide Authorization: Bearer <key> or x-api-key header.', status: 401 }
  }

  const apiKey = validateApiKey(rawKey, MOCK_API_KEYS)
  if (!apiKey) {
    return { valid: false, error: 'Invalid or revoked API key.', status: 401 }
  }

  // Check expiry
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return { valid: false, error: 'API key has expired.', status: 401 }
  }

  // Check scope
  if (!apiKey.scopes.includes(requiredScope)) {
    return { valid: false, error: `Insufficient scope. Required: ${requiredScope}`, status: 403 }
  }

  // Update lastUsedAt in place (mock — persists for session)
  apiKey.lastUsedAt = new Date().toISOString()

  return { valid: true, apiKey }
}

// ─── Standard response helpers ────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key',
}

export function ok(data: unknown, meta?: object): NextResponse {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status: 200, headers: CORS_HEADERS },
  )
}

export function created(data: unknown): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status: 201, headers: CORS_HEADERS },
  )
}

export function err(code: string, message: string, status: number): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status, headers: CORS_HEADERS },
  )
}

export function options(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
