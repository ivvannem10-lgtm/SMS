import { createHash, randomBytes } from 'crypto'

/**
 * Generates a new API key.
 * key    = "sis_live_" + 32 random hex chars (total 41 chars)
 * prefix = first 12 chars of key (for display only)
 * hash   = SHA-256 of the full key (stored in DB)
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const random = randomBytes(16).toString('hex') // 32 hex chars
  const key = `sis_live_${random}`
  const prefix = key.slice(0, 12)
  const hash = hashKey(key)
  return { key, prefix, hash }
}

/** SHA-256 hash of a raw API key. */
export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/** Find the matching active ApiKey by comparing SHA-256 hashes. */
export function validateApiKey(
  raw: string,
  storedKeys: import('@/lib/mock-api-keys').ApiKey[],
): import('@/lib/mock-api-keys').ApiKey | null {
  const h = hashKey(raw)
  return (
    storedKeys.find((k) => k.isActive && k.hash === h) ?? null
  )
}
