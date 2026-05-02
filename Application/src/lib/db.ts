import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Prisma client is only available after `npm run db:push`.
// The dynamic import in auth.ts wraps this in try/catch so
// the app works with mock data even without a database.
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
