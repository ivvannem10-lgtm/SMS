import { NextRequest } from 'next/server'
import { DEMO_USERS } from '@/lib/auth'
import { validateRequest, ok, err, options } from '@/lib/api-middleware'

export async function OPTIONS() {
  return options()
}

export async function GET(request: NextRequest) {
  const auth = validateRequest(request, 'staff:read')
  if (!auth.valid) return err('UNAUTHORIZED', auth.error, auth.status)

  // Return all non-student demo users, excluding password fields
  const staff = DEMO_USERS
    .filter((u) => u.role !== 'STUDENT')
    .map(({ password: _pw, ...rest }) => {
      void _pw
      return rest
    })

  return ok(staff, { total: staff.length })
}
