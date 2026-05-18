# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

All application code lives in `Application/`. See [Application/CLAUDE.md](Application/CLAUDE.md) for the full guide: commands, architecture, design system, RBAC rules, data flows, and demo accounts.

## Quick start

```bash
cd Application
# Copy .env.example to .env and fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET,
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY
cp .env.example .env
npm install
npm run db:push && npm run db:seed
npm run dev                  # http://localhost:3000
```

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · Prisma (PostgreSQL/Supabase) · NextAuth.js · Recharts · react-hook-form + Zod · @supabase/supabase-js
