import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { ROLE_PORTALS } from './utils'

// Demo users use plain-text passwords for fast comparison.
// Real database users go through bcrypt in the Prisma branch below.
export const DEMO_USERS = [
  { id: 'u_superadmin',     email: 'admin@school.edu',          password: 'password', name: 'Alex Administrator', role: 'SUPER_ADMIN',       schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_admission',      email: 'admissions@school.edu',     password: 'password', name: 'Ana Admissions',     role: 'ADMISSION_OFFICER', schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_registrar',      email: 'registrar@school.edu',      password: 'password', name: 'Rosa Registrar',     role: 'REGISTRAR',         schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_treasurer',      email: 'treasury@school.edu',       password: 'password', name: 'Thomas Treasury',    role: 'TREASURER',         schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_accounting',     email: 'accounting@school.edu',     password: 'password', name: 'Clara Accounting',   role: 'ACCOUNTING',        schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_academic',       email: 'academic@school.edu',       password: 'password', name: 'Adam Academic',      role: 'ACADEMIC_ADMIN',    schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_dean_computing', email: 'dean.computing@school.edu', password: 'password', name: 'Dr. Maria Santos',   role: 'DEAN', deanDepartment: 'College of Computing',  schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_dean_business',  email: 'dean.business@school.edu',  password: 'password', name: 'Dr. Jose Reyes',     role: 'DEAN', deanDepartment: 'College of Business',   schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_dean_nursing',   email: 'dean.nursing@school.edu',   password: 'password', name: 'Dr. Ana Garcia',     role: 'DEAN', deanDepartment: 'College of Nursing',    schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_dean_arts',      email: 'dean.arts@school.edu',      password: 'password', name: 'Dr. Carlos Cruz',    role: 'DEAN', deanDepartment: 'Arts & Sciences',       schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_hr',             email: 'hr@school.edu',             password: 'password', name: 'Hannah Rodriguez',   role: 'HR_STAFF',          schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_amo',            email: 'amo@school.edu',             password: 'password', name: 'Marco Dela Cruz',    role: 'AMO',               schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_purchasing',    email: 'purchasing@school.edu',      password: 'password', name: 'Mark Purchasing',    role: 'PURCHASING_OFFICER', schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB' },
  { id: 'u_teacher',        email: 'prof.santos@school.edu',    password: 'password', name: 'Prof. Roberto Santos', role: 'TEACHER',          schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB', facultyId: 'f_1' },
  { id: 'u_student',        email: 'student@school.edu',        password: 'password', name: 'Ethan Dela Cruz',    role: 'STUDENT',           schoolId: 'school_1', schoolName: 'St. Dominic College', schoolColor: '#2563EB', studentId: 'st_1' },
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo user — plain-text comparison, no bcrypt overhead
        const demo = DEMO_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password,
        )
        if (demo) return { ...demo } as unknown as import('next-auth').User

        // Real database user — bcrypt comparison
        try {
          const { db } = await import('./db')
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { school: true },
          })
          if (!user || !(await bcrypt.compare(credentials.password, user.password))) return null
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: user.schoolId,
            schoolName: user.school.name,
            schoolColor: user.school.primaryColor,
          } as unknown as import('next-auth').User
        } catch {
          // Database not configured — only demo users are available
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) Object.assign(token, user)
      return token
    },
    session({ session, token }) {
      Object.assign(session.user as Record<string, unknown>, {
        id: token.id,
        role: token.role,
        schoolId: token.schoolId,
        schoolName: token.schoolName,
        schoolColor: token.schoolColor,
        studentId: token.studentId,
        facultyId: token.facultyId,
        deanDepartment: token.deanDepartment,
      })
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}

export function getPortal(role: string) {
  return ROLE_PORTALS[role] ?? '/login'
}
