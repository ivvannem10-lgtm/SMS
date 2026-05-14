import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { DEMO_USERS } from '@/lib/auth'

// Shorthand aliases → email
const ALIASES: Record<string, string> = {
  admin:            'admin@school.edu',
  superadmin:       'admin@school.edu',
  admissions:       'admissions@school.edu',
  registrar:        'registrar@school.edu',
  treasurer:        'treasury@school.edu',
  treasury:         'treasury@school.edu',
  accounting:       'accounting@school.edu',
  academic:         'academic@school.edu',
  dean:             'dean.computing@school.edu',
  'dean.computing': 'dean.computing@school.edu',
  'dean.business':  'dean.business@school.edu',
  'dean.nursing':   'dean.nursing@school.edu',
  'dean.arts':      'dean.arts@school.edu',
  hr:               'hr@school.edu',
  amo:              'amo@school.edu',
  purchasing:       'purchasing@school.edu',
  teacher:          'prof.santos@school.edu',
  student:          'student@school.edu',
}

const ROLE_PORTALS: Record<string, string> = {
  SUPER_ADMIN:       '/staff/dashboard',
  ADMISSION_OFFICER: '/staff/admissions',
  REGISTRAR:         '/staff/registrar',
  TREASURER:         '/staff/treasury',
  ACCOUNTING:        '/staff/accounting',
  PURCHASING_OFFICER:'/staff/purchasing',
  ACADEMIC_ADMIN:    '/staff/academic',
  DEAN:              '/staff/dean',
  HR_STAFF:          '/staff/hr',
  AMO:               '/staff/ams',
  TEACHER:           '/teacher/subjects',
  STUDENT:           '/student/dashboard',
}

export async function GET(request: NextRequest) {
  const as = (request.nextUrl.searchParams.get('as') ?? '').toLowerCase()
  const email = ALIASES[as] ?? as

  const user = DEMO_USERS.find(u => u.email === email)
  if (!user) {
    const list = Object.keys(ALIASES).join(', ')
    return new NextResponse(
      `Unknown demo user: "${as}".\n\nValid shortcuts: ${list}\nOr pass a full email directly.`,
      { status: 400, headers: { 'content-type': 'text/plain' } },
    )
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return new NextResponse('NEXTAUTH_SECRET is not set.', { status: 500 })
  }

  const token = await encode({
    token: {
      sub:            user.id,
      id:             user.id,
      email:          user.email,
      name:           user.name,
      role:           user.role,
      schoolId:       user.schoolId,
      schoolName:     user.schoolName,
      schoolColor:    user.schoolColor,
      deanDepartment: (user as Record<string, unknown>).deanDepartment as string | undefined,
      studentId:      (user as Record<string, unknown>).studentId as string | undefined,
      facultyId:      (user as Record<string, unknown>).facultyId as string | undefined,
    },
    secret,
  })

  const defaultPortal = ROLE_PORTALS[user.role] ?? '/'
  const redirectTo    = request.nextUrl.searchParams.get('redirect') ?? defaultPortal

  const isHttps    = request.headers.get('x-forwarded-proto') === 'https'
  const cookieName = isHttps ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure:   isHttps,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  })
  return response
}
