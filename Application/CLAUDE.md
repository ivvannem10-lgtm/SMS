# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A SaaS **School Management System** built as a "train system" — each module is a station in the academic lifecycle. The platform is branded per-school (school name shown in all sidebars from session). Tech stack: **Next.js 14 App Router · TypeScript · Tailwind CSS · Prisma (PostgreSQL/Supabase) · NextAuth.js · Recharts · pdf-lib · pdfjs-dist · @supabase/supabase-js**.

## Commands

```bash
npm run dev             # Start on http://localhost:3000
npm run dev:2           # Start on http://localhost:3001 (independent cookie jar in Chrome — for multi-role testing)
npm run dev:3           # Start on http://localhost:3002
npm run build           # Verify production build
npm run lint            # ESLint — react/no-unescaped-entities is OFF (apostrophes/quotes in JSX don't need escaping)

# Database
npm run db:push              # Apply Prisma schema to PostgreSQL without a migration file (dev shortcut)
npm run db:migrate           # prisma migrate dev — creates a migration file and applies it
npm run db:migrate:deploy    # prisma migrate deploy — apply migrations in CI/production
npm run db:seed              # Seed demo data via prisma/seed.ts (dotenv loaded inside seed.ts — no extra flags needed)
npm run db:studio            # Open Prisma GUI
npm run db:reset             # prisma migrate reset --force + re-seed
```

**Quick dev login** (no need to use the login form):
```
http://localhost:3000/dev                         # Visual panel — click any demo account
http://localhost:3000/api/dev/login?as=admin      # Auto-login as Super Admin
http://localhost:3000/api/dev/login?as=student    # Auto-login as Student
http://localhost:3000/api/dev/login?as=accounting # Auto-login as Accounting Officer
# Append &redirect=/path to land on a specific page
```

**First-time setup:**
```bash
cp .env.example .env   # Fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, and Supabase keys
npm install
npm run db:push && npm run db:seed
npm run dev
```

## Architecture

### The Train System (Pipeline)
```
① Admissions → ② Registrar → ③ Treasury → ④ Academic Admin → ⑤ Dean → ⑥ Teacher → ⑦ Student
```
Each station feeds into the next. `ProcessFlow` in `src/components/shared/ProcessFlow.tsx` renders this pipeline visually.

### Route groups and portals

| Group | Routes | Allowed roles |
|---|---|---|
| `(root)` | `/` | Anyone — shows `LandingPage` if unauthenticated, redirects to portal if authenticated |
| `(public)` | `/apply` | Anyone |
| `(auth)` | `/login` | Anyone |
| `staff/` | `/staff/*` | SUPER_ADMIN, ADMISSION_OFFICER, REGISTRAR, TREASURER, ACADEMIC_ADMIN, ACCOUNTING, DEAN, HR_STAFF, AMO |
| `teacher/` | `/teacher/*` | TEACHER |
| `student/` | `/student/*` | STUDENT |

`src/app/page.tsx` — if no session, renders `<LandingPage />` from `src/components/landing/LandingPage.tsx`. If session exists, redirects via `ROLE_PORTALS` from `src/lib/utils.ts`. Each portal layout calls `getServerSession` and redirects on role mismatch.

### Next.js 14 params — critical gotcha

Dynamic page components must use **plain object** params, not `Promise<>`:

```tsx
// ✅ Correct for Next.js 14
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params

// ❌ Wrong — Next.js 15 only, crashes in 14
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
```

### `useSearchParams` requires Suspense

Any page component using `useSearchParams()` must be wrapped in `<Suspense>` at the export level:

```tsx
export default function Page() {
  return <Suspense><PageInner /></Suspense>
}
function PageInner() {
  const searchParams = useSearchParams()
```

### Multi-tenancy
Every Prisma model has a `schoolId` foreign key. All API routes must scope queries to `(session.user as SessionUser).schoolId`.

### Database — Supabase / PostgreSQL
The database is **Supabase-hosted PostgreSQL**. Prisma schema uses `provider = "postgresql"` with both a pooled `DATABASE_URL` and a direct `DIRECT_URL` (required for migrations). The `.env` file (not `.env.local`) is read by the Prisma CLI and by `prisma/seed.ts` (which loads it via `dotenv/config`). Required env vars:
- `DATABASE_URL` — pooled connection string (PgBouncer)
- `DIRECT_URL` — direct (non-pooled) connection string for migrations
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formerly ANON_KEY — same key, renamed by Supabase)
- `SUPABASE_SERVICE_ROLE_KEY`

`src/lib/supabase.ts` exports two clients:
- `supabase` — public browser client (respects Row Level Security)
- `supabaseAdmin()` — server-only admin client (bypasses RLS; use only in API routes / server components)

### Mock data vs. database
`src/lib/mock-data.ts` is the live in-memory dataset for most modules. API routes for real-time features (Agent Chat) use Prisma directly via `src/lib/db.ts` (singleton `PrismaClient`). Commented Prisma calls in mock-backed routes show the eventual swap pattern.

**Current mock data state (reset for fresh testing):**
- Students: 1 demo account only (`st_demo` → `student@school.edu`)
- Applicants: 5 PENDING/UNDER_REVIEW applicants (app_1–app_5)
- Enrollments, SOA, Grades, Audit Logs: all empty
- Offerings: all 9 active-semester offerings set to `DRAFT` — no teacher assignments, no schedules
- Active semester: **1st Semester 2025-2026**

### Auth flow
- Demo users in `src/lib/auth.ts → DEMO_USERS` — plain-text `password` comparison (not bcrypt) to avoid blocking module load
- JWT carries: `id`, `role`, `schoolId`, `schoolName`, `schoolColor`, optionally `deanDepartment`
- 4 department Deans each have a `deanDepartment` field scoping their data access

### RBAC rules (enforced in UI)
- **Accept/Reject applicants**: ADMISSION_OFFICER + SUPER_ADMIN only (`canDecide` check in admissions detail page)
- **Edit student records**: REGISTRAR + SUPER_ADMIN only (`canEdit` check)
- **Registrar** sees all departments — no department filter on student data
- **Dean** is scoped to their `deanDepartment` college; sidebar shows Dean-only nav (`DEAN_NAV`)
- **Accounting** (`ACCOUNTING` role) portal: `/staff/accounting` — sees full Accounting nav (Dashboard, General Ledger, Journal Entries, Chart of Accounts, Cashflow, Expenses, Fee Management, Approvals, Payroll, Analytics, Reports). Does NOT see Cashier/Student Accounts/Transaction Logs (TREASURER only).
- **API Management** (`/staff/api`) — visible to all 10 admin roles (not TEACHER/STUDENT). SUPER_ADMIN sees all API keys; other admins see only keys they created. Revoking is own-keys-only for non-SUPER_ADMIN.
- **Treasurer** (`TREASURER` role) portal: `/staff/treasury` — sees Cashier, Student Accounts, Transaction Logs, Collections, Official Receipts. Does NOT see Accounting/Purchasing sections.
- **Purchasing Officer** (`PURCHASING_OFFICER` role) portal: `/staff/purchasing` — sees only the Purchasing nav group (Dashboard, Purchase Requests, Purchase Orders, Vendors).
- **HR_STAFF** sees only the Human Resources nav group (`/staff/hr/*`) — no access to admissions, registrar, treasury, or academic sections
- **AMO** sees only the Asset Management nav group (`/staff/ams/*`) — no access to other staff sections
- **Teacher schedule**: only visible for PUBLISHED offerings where the teacher is assigned

### Student status colors
| Status | Color |
|---|---|
| ACTIVE | emerald green |
| INACTIVE | grey |
| DROPPED | red |
| GRADUATED | cyan |

`StudentStatus` = `'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED'` — LOA removed.

### Dashboard → Registrar filter links
Stat cards link to `/staff/registrar?enroll=ENROLLED|NOT_ENROLLED|NEW`. The registrar page reads `useSearchParams` and initialises the filter dropdown from the URL param.

## Design System

### Color palette — university navy
The brand color is **navy blue** (`#1a4a8a`), not indigo. `tailwind.config.ts` has `darkMode: 'class'`.

| Token | Hex | Usage |
|---|---|---|
| `brand-500` | `#1a4a8a` | **Primary** — buttons, accents, active indicators |
| `brand-600` | `#163d73` | Hover |
| `brand-700` | `#11305c` | Active/pressed |
| `brand-900` | `#09182e` | Super Admin badge, modal backdrop |
| `gold-500` | `#c9a224` | Premium/institutional accent — use sparingly |
| `surface.dark` | `#0c1225` | Login page dark background |

Sidebar tokens (`sidebar-bg: #0c1e3d`, etc.) and gold palette are in `tailwind.config.ts`.
Surface background: `#f3f6fb` (barely blue-tinted).

### Typography
Three font families registered in `tailwind.config.ts`:
- `font-sans` → **Plus Jakarta Sans** (primary, all UI text)
- `font-serif` / `font-display` → **Playfair Display** (formal display contexts only, never dashboard UI)
- `font-mono` → JetBrains Mono / Fira Code (code chips, reference numbers)

### CSS custom property token system
`globals.css` is the **canonical token file** (mirrors `colors_and_type.css` from the design system). It defines:
- `--color-brand-*`, `--color-sidebar-*`, `--color-gold-*`, `--color-surface-*` (including `--color-surface-dark`)
- `--color-success/warning/danger/info` + their `-bg` and `-ring` composites (for badge backgrounds)
- `--font-sans`, `--font-display`, `--font-mono`
- `--font-size-2xs` through `--font-size-3xl` (base 15px)
- `--font-weight-light` through `--font-weight-extrabold`
- `--tracking-tight` through `--tracking-widest`
- `--space-*`, `--radius-*`, `--shadow-*` (card / card-md / card-lg / inner / glow), `--duration-*`, `--ease-default`
- `--nav-width: 220px`, `--header-height: 56px`

Use Tailwind classes in component JSX; use CSS vars only in custom CSS blocks.

### Key UI component conventions

- **`<SectionTitle>`** — page heading with a 3px navy left-accent bar. Props: `description`, `actions`.
- **`<Card padding="none">`** — wrap around `<Table>` for zero inner padding. Border is `#e4ebf5`.
- **`<Thead>`** — navy-tinted `#f0f4fa` bg + `#dce8f7` bottom border. Column labels: `text-brand-700 uppercase tracking-widest`.
- **`<Tr onClick={…}>`** — hover tint is `brand-50`.
- **`<Modal>`** — header has a 3px navy accent line beside the title. Backdrop: `brand-900/50`.
- **Status badges** — always use typed components: `ApplicantBadge`, `EnrollmentBadge`, `SOABadge`, `GradeBadge`, `PaymentBadge`, `RoleBadge`. Never use raw `<Badge>` with inline color strings.
- **`<Button variant>`** — `primary` (navy), `soft` (light navy tint), `navy` (gradient via `bg-brand-gradient`), `outline`, `ghost`, `success`, `danger`.
- **`<Input>` / `<Select>`** — focus ring: `brand-500/15` glow; border: `#dce8f7`. Both `shadow-inner` and `shadow-inner-sm` are valid Tailwind tokens (aliases).

### Sign-out confirmation pattern
All three sidebars (Staff, Teacher, Student) use a local `signOutOpen` state to render an inline confirmation dialog (`z-[200]`) instead of calling `signOut()` directly. Never restore the old one-click pattern.

### Dean dashboard patterns
`src/app/staff/dean/page.tsx` defines `AnimatedStatCard` and `useCountUp` locally — **do not extract**. Chart filter uses `SCHOOL_YEAR_OPTIONS` with per-semester offset arrays to simulate history.

### Teacher schedule patterns
`src/app/teacher/schedule/page.tsx` uses local mutable state initialised from `MOCK_SCHEDULES` (empty after reset). Schedule slots added via modal persist only in component state (resets on navigation — intentional for mock-only mode). Room availability gates are enforced via `MOCK_ROOM_AVAILABILITY` from `mock-data.ts`.

## Key files

| File | Purpose |
|---|---|
| `src/types/index.ts` | All TypeScript interfaces — quiz types (`AssessmentType`, `QuizQuestionType`, `AttemptGradingMethod`, `TimerBehavior`, `NavigationMode`, `QuestionDisplayMode`, `FeedbackTiming`, `FeedbackLevel`, `QuizSecuritySettings`, `ConditionalRelease`), rubric types (`Rubric`, `RubricCriterion`, `RubricLevel`, `CriterionScore`, `PTSubmission`, `PerformanceTask`), grade types (`GradeCriteria` with `customCategories?`, `disabledDefaults?`; `CustomGradeCategory`), extended `Quiz` (20+ optional customization fields), HRIS types (`JobPosting`, `JobApplication`, `HREmployee`, `HRDocument`, `OnboardingTask`, `HROnboardingRecord`, `HRLeaveRequest` + 9 enum types), AMS types (`Asset`, `AssetDeployment`, `AssetHistory`, `Consumable`, `ConsumableTransaction`, `MaintenanceLog`, `AssetTagFormat`, `AssetInclusion`, `TagFormatComponent` + 9 enum types) |
| `src/lib/utils.ts` | `cn()`, `fullName()`, `initials()`, grade helpers, `ROLE_PORTALS`, `FACULTY_DEPT_TO_COLLEGE` |
| `src/lib/auth.ts` | NextAuth options, `DEMO_USERS` (plain-text pw), `deanDepartment` in JWT |
| `src/lib/mock-data.ts` | All in-memory data — applicants, students, offerings, rooms, faculty, `MOCK_ROOM_AVAILABILITY`, `MOCK_STAFF_MEMBERS` (Team Hub), `MOCK_GRADE_CRITERIA`, financial data, accounting data |
| `src/lib/api-keys.ts` | API key crypto helpers — `generateApiKey()`, `hashKey()`, `validateApiKey()` |
| `src/lib/mock-api-keys.ts` | API key store — `MOCK_API_KEYS`, `ApiScope`, `API_ADMIN_ROLES`, `ROLE_DEFAULT_SCOPES` |
| `src/lib/api-middleware.ts` | REST API request validation — `validateRequest(request, scope)`, response helpers `ok/err/created/options` |
| `src/lib/db.ts` | Singleton `PrismaClient` |
| `src/lib/supabase.ts` | Supabase client — `supabase` (public, browser-safe) + `supabaseAdmin()` (server-only, bypasses RLS) |
| `tailwind.config.ts` | Color tokens (navy brand, sidebar, gold, surface), font, shadows |
| `src/app/globals.css` | CSS custom property design tokens + font imports |
| `src/components/layout/StaffSidebar.tsx` | Role-aware staff nav; Dean shows `DEAN_NAV` only |
| `src/components/layout/TeacherSidebar.tsx` | Teacher nav: Dashboard, Courses, My Schedule, Calendar, Team Hub |
| `src/components/landing/LandingPage.tsx` | Public landing page for unauthenticated visitors — rendered by `src/app/page.tsx` |
| `src/app/(public)/terms/page.tsx` | Terms of Service — public, no auth. 13-section Legal Master Policy with sticky TOC, section cards, acceptance footer |
| `src/lib/import-templates.ts` | Excel/CSV import system — 5 template definitions, `downloadCSV()`, `parseImportCSV()` |
| `src/components/shared/ImportModal.tsx` | Reusable 3-step import modal — Download Template → Upload CSV → Review & Import |
| `src/app/staff/registrar/[studentId]/page.tsx` | Full student edit: 4 tabs, photo upload, verified tags, addable family/education |
| `src/app/staff/dean/page.tsx` | Dean dashboard with animated cards, Recharts chart, year-level accordion |
| `src/app/staff/dean/students/page.tsx` | Dean read-only student list with year/status/enrollment filters; `?year=N` pre-filters via `useSearchParams` |
| `src/app/staff/dean/assignments/page.tsx` | Dean teacher assignment module — Needs Teacher / Assigned tabs |
| `src/app/staff/dean/statistics/page.tsx` | Exists but removed from sidebar nav; accessible directly via URL |
| `src/app/staff/profile/page.tsx` | Staff profile page (linked from header avatar) |
| `src/app/staff/admissions/crm/page.tsx` | Admissions CRM — Kanban board, drag-and-drop, slide-over detail panel |
| `src/app/staff/registrar/documents/page.tsx` | Document Generator — full template customization engine + 3-step wizard |
| `src/app/staff/help/page.tsx` | Help module — User Manual, FAQ, Admin Panel tabs; GIF/canvas tutorials |
| `src/app/staff/profile/page.tsx` | Staff profile: editable nickname/phone/title/birthday/photo; localStorage |
| `src/app/staff/personalization/page.tsx` | Theme (light/dark) + accent color; uses `useTheme()` from providers.tsx |
| `src/app/staff/settings/page.tsx` | Password change + notification preference toggles |
| `src/lib/help-registry.ts` | Feature registry (34 features) + HelpEntry array + `computeEntryTags()`, `getFeatureDocStatus()` |
| `src/lib/tutorial-generator.ts` | Canvas frame renderer for auto-generated step animations; called each rAF tick |
| `src/app/teacher/schedule/page.tsx` | Teacher room schedule management — gated by PUBLISHED offering + assignment |
| `src/app/teacher/subjects/[offeringId]/quizzes/page.tsx` | Assessment list — type badges, stats, publish validation, create modal |
| `src/app/teacher/subjects/[offeringId]/quizzes/[quizId]/page.tsx` | 4-tab detail: Overview / Questions (with validation warnings) / Submissions / Analytics |
| `src/app/teacher/subjects/[offeringId]/quizzes/[quizId]/settings/page.tsx` | 8-panel customization: Attempts, Timing, Questions, Scoring, Behavior, Security, Feedback, Release + Clone |
| `src/app/teacher/subjects/[offeringId]/assignments/page.tsx` | Assignment list with submission expansion and publish/delete |
| `src/app/teacher/subjects/[offeringId]/performance-tasks/page.tsx` | PT list + 2-step create (basic info + rubric builder) |
| `src/app/teacher/subjects/[offeringId]/performance-tasks/[taskId]/page.tsx` | 3-tab PT detail: Overview / Rubric matrix / Submissions + grading modal |
| `src/app/student/subjects/page.tsx` | Blackboard-style course card grid with "More info" expand |
| `src/app/student/subjects/[offeringId]/quizzes/page.tsx` | Student quiz list — Open/Upcoming/Past sections with access gate |
| `src/app/student/subjects/[offeringId]/quizzes/[quizId]/page.tsx` | Quiz taking: timer, one-way nav, tab detection, auto-grade + gradebook push, confirmation modal |
| `src/app/student/subjects/[offeringId]/assignments/page.tsx` | Student assignment submission + grade/feedback view |
| `src/app/student/subjects/[offeringId]/performance-tasks/page.tsx` | PT view: rubric expand, submit modal, grade breakdown with weighted criterion scores |
| `src/app/staff/ams/page.tsx` | AMS Dashboard — stat cards, quick actions, activity feed, low stock + warranty alerts |
| `src/app/staff/ams/assets/page.tsx` | Asset Registry — table, filters, quick status-change popover |
| `src/app/staff/ams/assets/new/page.tsx` | Register Asset — 4-step mobile-friendly form, camera, auto tag gen, inclusions |
| `src/app/staff/ams/assets/[id]/page.tsx` | Asset Detail — 4 tabs: Info, Deployments (return modal), History timeline, Maintenance |
| `src/app/staff/ams/borrow/page.tsx` | Borrow & Deploy — deployment table, new request modal, return workflow |
| `src/app/staff/ams/consumables/page.tsx` | Consumables — inventory cards with stock bars, issue/restock, transaction log |
| `src/app/staff/ams/maintenance/page.tsx` | Maintenance Logs — log/complete/cancel, detail slide-over, asset status sync |
| `src/app/staff/ams/tag-builder/page.tsx` | Tag Builder — visual format builder, live preview, saved formats, set default |
| `src/app/staff/hr/page.tsx` | HR Dashboard — stat cards, quick actions, ATS pipeline summary |
| `src/app/staff/hr/jobs/page.tsx` | Job Postings — CRUD, filter tabs, create/edit modal |
| `src/app/staff/hr/recruitment/page.tsx` | ATS Kanban pipeline — 7 stages, slide-over detail, `useSearchParams` |
| `src/app/staff/hr/employees/page.tsx` | Employee directory — filters, table, Add Employee modal |
| `src/app/staff/hr/employees/[id]/page.tsx` | Employee detail — 4 tabs: Profile (editable), Documents, Leave History, Onboarding |
| `src/app/staff/hr/onboarding/page.tsx` | Onboarding checklists — accordion per employee, click-to-complete tasks |
| `src/app/staff/hr/leaves/page.tsx` | Leave requests — approve/reject review modal, File Leave Request modal |
| `src/components/shared/AgentChatWidget.tsx` | Floating teal "Talk to Agent" button rendered in all three portal layouts; polls `/api/agent-chats` every 2 s |
| `src/app/staff/agent-inbox/page.tsx` | Staff-side Agent Inbox — view and respond to all open chats; polls every 2 s |
| `src/app/staff/accounting/fees/page.tsx` | Fee Management — Accounting defines institutional fee structure synced to Treasury |
| `src/app/api/agent-chats/route.ts` | `GET` list / `POST` create a chat (Prisma → Supabase) |
| `src/app/api/agent-chats/[id]/route.ts` | `GET` single chat / `PATCH` update status or assign agent |
| `src/app/api/agent-chats/[id]/messages/route.ts` | `GET` messages / `POST` new message for a chat |
| `prisma/schema.prisma` | Full relational schema — 20+ models including `AgentChat` + `AgentChatMessage` |

## Registrar student detail — tab structure

| Tab | Edit capabilities |
|---|---|
| Personal Info | Name, DOB, place of birth, gender, civil status, nationality, religion, blood type, contact, address, status; email/phone validation + verified toggles |
| Family Background | Addable members (name, relation, phone, email, occupation); add/remove in edit mode |
| Academic Records | Always-visible Year Level dropdown; per-semester course table with quiz/assignment/final grades, `GradeBadge` |
| Education History | Addable school entries with title + PDF upload per entry; add/remove in edit mode |

## Demo accounts

| Role | Email |
|---|---|
| Super Admin | admin@school.edu |
| Admission Officer | admissions@school.edu |
| Registrar | registrar@school.edu |
| Treasurer | treasury@school.edu |
| Accounting | accounting@school.edu |
| Purchasing Officer | purchasing@school.edu |
| Academic Admin | academic@school.edu |
| Dean — Computing | dean.computing@school.edu |
| Dean — Business | dean.business@school.edu |
| Dean — Nursing | dean.nursing@school.edu |
| Dean — Arts | dean.arts@school.edu |
| HR Staff | hr@school.edu |
| Asset Management (AMO) | amo@school.edu |
| Teacher | prof.santos@school.edu |
| Student | student@school.edu |

All passwords: `password`. Public applicant form (no login): `/apply`.

## Full test flow (from clean state)

1. **`/apply`** — submit a new application
2. **Admissions** (`admissions@school.edu`) — review, accept/reject applicants (5 pre-loaded as PENDING)
3. **Registrar** (`registrar@school.edu`) — find accepted student, enroll in subjects
4. **Treasury** (`treasury@school.edu`) — generate SOA, validate payment → student status becomes ENROLLED
5. **Academic Admin** (`academic@school.edu`) — publish offering(s), configure room availability
6. **Dean** (`dean.computing@school.edu`) — view department students, assign teacher to published offering
7. **Teacher** (`prof.santos@school.edu`) — go to My Schedule, add room slots for assigned published offering
8. **Student** (`student@school.edu`) — view enrollment, LMS content

## Key data flows

**Admission → Student creation**
`POST /api/admissions/[id]/accept` — ADMISSION_OFFICER / SUPER_ADMIN only. Updates applicant to ACCEPTED, generates `studentId` via `generateStudentId()`.

**Enrollment flow**
`POST /api/enrollment` — `{ studentId, offeringIds[] }`. Creates `Enrollment` rows with `PRE_ENROLLED`. Treasury confirmation flips to `ENROLLED`.

**Grade computation**
`computeFinal(row, weights)` in grades page — Quiz + Assignment + Midterm + Final + PT (5 components, all weighted by `GradeCriteria`). Default: Quiz 30% + Assignment 30% + Midterm 20% + Final 20% + PT 0%. Exam weight is split equally between Midterm and Final. PT column only appears when `performanceTaskWeight > 0`. "Sync from LMS" button pulls computed averages from `MOCK_QUIZZES` attempts, `MOCK_ASSIGNMENTS` submissions, and `MOCK_PERFORMANCE_TASKS` submissions. `gradeToLetter()` → Philippine numerical scale — both in `src/lib/utils.ts`.

**Teacher schedule gate**
`src/app/teacher/schedule/page.tsx` filters `MOCK_OFFERINGS` to `status === 'PUBLISHED' && semesterId === activeSem.id && assignments.some(a => a.facultyId === myFaculty.id)`. Slot validation checks `MOCK_ROOM_AVAILABILITY[roomId]` for day/time window, then scans all offering schedules for conflicts.

**Newer modules (mock-only, no DB routes yet)**
- **Admissions CRM** (`/staff/admissions/crm`) — Full lead-pipeline Kanban with 8 stages (New Lead → Contacted → Interested → Applicant → For Interview → Accepted → Enrolled → Lost). Own `CrmLead` type separate from `Applicant`. Module-level stores: `CRM_LEADS`, `CRM_ACTIVITIES`, `CRM_FOLLOWUPS`. Drag-and-drop between columns. Slide-over detail panel has 3 tabs (Profile / Timeline / Follow-ups), stage pills, log-activity buttons, follow-up scheduler, footer action buttons. `moveToStage` auto-logs to timeline and syncs back to `MOCK_APPLICANTS` when lead has `applicantId`. On mount, auto-imports any new `MOCK_APPLICANTS` entries as Applicant-stage leads. Sidebar: SUPER_ADMIN + ADMISSION_OFFICER only.
- **Team Hub** (`/staff/team`, `/teacher/team`) — Employee directory rendered as a **square card grid** (2–5 columns responsive). Data comes from `MOCK_STAFF_MEMBERS: StaffMember[]`. Filter tabs: All / Admin / Deans / Faculty — simple pill bar, no stat counts. Clicking a card opens `ProfileModal`. Profile photo upload/crop: clicking the avatar in the modal opens `PhotoCropModal` — a canvas-based editor (280×280, circular crop preview, drag-to-pan, scroll-wheel + slider zoom, `pdfjs`-style off-screen canvas save). Saved photo stored as JPEG data URL in `member.avatar` (mutates the mock array) and `avatarMap` state keeps cards in sync without full re-render. The teacher portal re-exports the same page at `/teacher/team`.
- **School Year Calendar** (`/staff/calendar`, `/teacher/calendar`) — Academic Admin (+ Super Admin) can add/delete events; all other roles are read-only. Events stored in a module-level `SCHOOL_EVENTS` array inside the page component (not in `mock-data.ts`). Legend badges are clickable filter toggles; `activeFilters: Set<EventType>` controls which types show in the grid and upcoming sidebar. The teacher portal re-exports the page at `/teacher/calendar`. Six `EventType` values: `HOLIDAY`, `ACADEMIC`, `ENROLLMENT`, `EXAM`, `ACTIVITY`, `ADMIN`.
- **Grading Criteria** (`/teacher/subjects/[offeringId]/criteria`) — Dynamic category-based grade weight system. Gear icon (⚙) opens **Manage Grade Categories** modal. **Default categories** (Quiz, Assignment, Exam, Performance Task) have a toggle switch — when disabled they disappear from the sliders and are excluded from the 100% total. **Custom categories** (e.g., Laboratory, Recitation) can be added with a name, optional description, and auto-assigned color from a 10-color palette; removed via trash icon. **Auto** button distributes 100% evenly across all currently active categories. Changes persist to `MOCK_GRADE_CRITERIA` via `customCategories?: CustomGradeCategory[]` and `disabledDefaults?: string[]` on the `GradeCriteria` type. The weight bar, legend, sliders, and formula preview all render only the active (enabled) set.
- **Teacher subject detail** (`/teacher/subjects/[offeringId]`) — Sidebar label is "Courses" (not "My Subjects"). 10 sub-pages: materials, assignments, quizzes, **performance-tasks**, grades, attendance, announcements, discussions, criteria, students. Quick stats row shows 4 counts (modules, assignments, quizzes, PTs).
- **Offerings — no start/end time** — The Add Offering modal no longer includes Start Time / End Time fields. Schedule is set by the teacher after the Dean assigns them. `MOCK_OFFERINGS` entries always have `schedules: []` on creation from this modal.
- **Subjects — total hours auto-calc** — In the Add Subject modal, `totalHours` auto-updates to `(lectureUnits + labUnits) × 18` whenever either unit field changes. The field is no longer a separate manual input.
- **Document Generator** (`/staff/registrar/documents`) — REGISTRAR + SUPER_ADMIN only. Full DocAutomator-level template engine. Three page tabs: Templates, Generate (3-step wizard), History. When editing, the editor takes over the full content area via `-mx-6 -mt-6 -mb-6` with `height: calc(100vh - 56px)` — no z-index conflict with sidebar/header.

  **Template engine pipeline** (applied in this order in `processTemplate` / `previewTemplate`):
  1. Expand `data-loop-type` table rows — a `<tr data-loop-type="subjects">` row is cloned once per subject from `DEMO_RECORDS[studentId]`. Loop types: `subjects` (all), `current_subjects`, `completed_subjects`, `failed_subjects`.
  2. Convert special spans to raw markers — condition spans (`data-if`, `data-else`, `data-endif`) and pill spans (`data-ph`) become raw `{{tokens}}`.
  3. Process conditionals — `{{#if cond}}...{{else}}...{{/if}}` blocks are evaluated with `evaluateCondition()`. Supported conditions: `is_graduated`, `is_active`, `is_dropped`, `is_honor_student`, `is_male`, `is_female`, `has_subjects`, `has_gwa`.
  4. Process filtered tokens — `{{key | filter}}` or `{{key | filter: "arg"}}`. Supported filters: `uppercase`, `lowercase`, `title`, `or` (fallback), `number` (decimal places), `format` (date format e.g. `"MMMM DD, YYYY"`).
  5. Replace remaining `{{simple_key}}` tokens with `getSimpleValue(key, student)`.

  **Span encoding** (all survive innerHTML round-trips via inline `style=` — no CSS classes):
  - Placeholder pills: `data-ph="key"` — violet background, `contenteditable="false"`, `draggable="true"`
  - Condition start: `data-if="cond"` — green background
  - Else: `data-else="true"` — amber background
  - End if: `data-endif="true"` — pink background
  - Loop template row: `data-loop-type="subjects"` on `<tr>` — green dashed border
  
  **`tokensToPills(html)`** — converts raw `{{key}}` to pill spans and `{{#if cond}}` / `{{else}}` / `{{/if}}` to condition spans when loading a template into the editor. Protects already-converted spans using `￾N￾` sentinels.
  
  **`validateTemplate(body)`** — scans for unknown `{{field}}` tokens not in `KNOWN_KEYS`, unknown `{{#if cond}}` conditions not in `CONDITION_KEYS`, and unbalanced `{{#if}}`/`{{/if}}` counts. Returns `ValidationError[]`.
  
  **Mock academic data** — `DEMO_RECORDS['st_demo']` in `documents/page.tsx` has 23 subjects across 5 semesters (1st Year through 3rd Year ongoing) with grades and remarks. `calcGWA(studentId)` and `totalUnits(studentId)` compute from this. The built-in TOR template uses `{{#if is_graduated}}...{{else}}...{{/if}}` and `{{#if is_honor_student}}` conditionals.
  
  **Three editor modes** — each has its own full-screen component that replaces the page body:
  - `TemplateEditor` — SmartDocs builder (DOCX from scratch / built-in templates)
  - `MappingEditor` — Upload DOCX, click to map text → field (DOCX mapping mode)
  - `PdfOverlayEditor` — Upload PDF, visually place fields on canvas, generate via pdf-lib

  **PDF Overlay System (`isPdfOverlay: true`)**: `PdfOverlayEditor` renders the uploaded PDF's first page to an off-screen `<canvas>` using **pdfjs-dist** (worker at `/public/pdf.worker.min.mjs`, set via `GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'`), then displays it as an `<img>` that fills the container exactly — no browser PDF-viewer chrome. The container uses CSS `aspect-ratio` derived from the actual PDF dimensions, **not** a hardcoded `paddingTop: '129.41%'` (critical: `paddingTop` percentages are relative to the *parent's* width, not the element's own width, which inflates `r.height` and corrupts stored % coordinates). Fields are stored as `PdfFieldOverlay[]` with x/y/width/height as percentages of the container; click coordinates use `getBoundingClientRect()` on the container ref. Tool modes: select, text, number, date, image, table. `generatePdfWithOverlays(pdfUrl, overlays, student)` dynamically imports `pdf-lib`, loads the PDF, and draws fields at positions converted from percentages to PDF points (PDF origin is bottom-left: `pdfY = height - (y/100)*height - fontSize`). **Critical font order**: embed Helvetica/Times/Courier standard fonts FIRST, then call `pdfDoc.registerFontkit()` — reversing this order silently breaks all font embedding. Field type rendering: **text** → `getSimpleValue(fieldKey, student)`; **number/date** → `ov.staticValue` (user-entered); **image** → `ov.imageDataUrl` embedded via `embedPng`/`embedJpg`; **table** → draws a static grid of `ov.tableRows × ov.tableCols` cells using `drawLine` (no dynamic data — replaced the old subjects-loop table). Output is a Blob object URL. In GenerateTab, all pages are rendered to canvas images via pdfjs-dist (same worker setup as the editor preview) and displayed as scrollable `<img>` tags in a dark-themed panel — no browser PDF viewer chrome. A Download PDF button is always shown alongside the rendered images.

  **SmartDocs Builder (TemplateEditor)**: Fields display as friendly chips `[Full Name]` (not `{{full_name}}`). Right-side **Fields Panel** always visible with Personal/Academic sections, Auto-fill Tables, and Show/Hide Conditions. `FieldItem` component is draggable — `onDragStart` puts pill HTML in `dataTransfer`; `onEditorDrop` on the canvas div positions caret at drop point via `document.caretRangeFromPoint`. **Smart Table Builder modal** triggered from the panel: choose loop type (subjects/current/completed), select columns → `insertSmartTable()` builds the `<tr data-loop-type>` row with pill spans directly. Step indicator (Choose→Add Fields→Preview→Save) is visual-only.

  **Template Mapping System (MappingEditor)**: Triggered when a DOCX is uploaded via "Upload & Map Template". mammoth.js converts DOCX → HTML (browser-side via dynamic import). `MappingEditor` shows the document as a non-editable viewer. `handleMouseUp` detects text selections → shows a field-picker popup → `mapField()` wraps selected range in `<span data-mapped="key" style="${MAPPED_SPAN_STYLE}">`. `handleClick` detects clicks on `<tbody tr>` rows → opens **Table Configuration modal** where user selects loop type and maps each column to a field key via dropdowns → `applyTableMapping()` sets `data-loop-type` on the row and wraps each cell in a `data-mapped` span. `processMappedTemplate()` / `previewMappedTemplate()` process these templates: expand loop rows via `processMappedRowTokens()` (which replaces `data-mapped` spans with subject row values), then replace remaining `data-mapped` spans with `getSimpleValue()`. The `isMapped: true` flag on `DocTemplate` distinguishes mapped templates; `GenerateTab` routes to `processMappedTemplate` when this flag is set. Right panel shows live mapping status (which fields are mapped, whether a table is configured).

  All module-level arrays (`BUILT_IN_TEMPLATES`, `CUSTOM_TEMPLATES`, `DOC_HISTORY`) persist across navigations within a session; reset on hard reload.
- **Help Module** (`/staff/help`) — Three tabs: **User Manual** (role-filtered, searchable, grouped by module), **FAQ**, **Admin Panel** (SUPER_ADMIN only). Data lives in `src/lib/help-registry.ts`: `FEATURE_REGISTRY` (34 registered features with `addedAt` / `lastModified` dates) and `HELP_ENTRIES` (mutable array — admin edits update it in-place). `computeEntryTags()` returns `'NEW'` if feature added ≤30 days ago, `'UPDATED'` if docs updated ≤14 days ago. `getFeatureDocStatus()` returns `'MISSING'` | `'OUTDATED'` | `'OK'` by comparing `feature.lastModified` vs `entry.lastUpdated`. **Auto-generated canvas tutorials**: every help entry with steps automatically shows an `AnimatedTutorialPlayer` — a `requestAnimationFrame` loop that calls `drawStepFrame()` from `tutorial-generator.ts` on a 640×360 canvas. Animation is time-based (ms elapsed), frame-rate independent, with slide transitions between steps. Admin can replace any auto-generated tutorial with an uploaded GIF or video (stored as an object URL). Coverage stats (uploaded vs auto vs missing) shown in ManualTab and AdminPanel.
- **User Profile system** — Header avatar dropdown links to Profile, Personalization, Settings, Help. `providers.tsx` exports `ThemeProvider` + `useTheme()` hook that applies `dark` class to `<html>`. Theme and accent saved to `localStorage`. Profile photo stored as base64 in `localStorage` via `loadProfile()`/`saveProfile()` helpers in `providers.tsx`.

**Admissions page details**
- Documents tab uses real `<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">` with simulated upload (600 ms delay → success). Each doc row tracks `uploadStatus: 'idle' | 'uploading' | 'success' | 'error'` and a parallel `docFiles: (File | null)[]` array.
- The status stat cards (Pending / Under Review / Accepted / Rejected) were **removed** from the top of the admissions list page. The status filter tab row remains.
- Search input removed from the filter bar; status-tab filter remains.
- `/apply` public form pushes to `MOCK_APPLICANTS` AND writes to `sessionStorage['sis_pending_applicants']` (JSON array). The admissions page rehydrates from `sessionStorage` on mount so submissions survive the full-page reload that happens during login. De-duplicates by `id`.
- Admissions dashboard (`ADMISSION_OFFICER` role) shows a Quick Actions row: Add Applicant, Review Applicants, Admissions CRM.
- **Dashboard stat scoping**: `ADMISSION_OFFICER` sees only 3 stats (Pending Applicants, Accepted, Enrolled Students). `REGISTRAR` sees the 4-card registrar view. Other staff see the full 5-card view. `ADMISSION_OFFICER` also has Quick Actions billing shortcuts hidden. The Recent Activity panel has been removed from all dashboard views.
- **TemplateEditor pipeline**: The settings/overview panel inside TemplateEditor previously showed 6 numbered step cards. Steps 3–6 (Data Field Mapping summary, Document Generation Options, Actions After Document Generation, Generate Document) have been removed — only Steps 1 (Data Source) and 2 (Template Design) remain visible.

**Z-index hierarchy (important — do not break)**
| Element | z-index |
|---|---|
| CRM backdrop overlay | `z-[25]` |
| Header (sticky) | `z-[35]` |
| CRM detail slide-over | `z-[36]` |
| Sidebars (all) | `z-40` |
| Modal backdrop + dialog | `z-50` |
| Sign-out confirmation | `z-[200]` |

**Logout button** — All three sidebars (Staff / Teacher / Student) have a visible "Sign Out" row at the bottom of the user footer. It was previously `opacity-0 group-hover:opacity-100` (invisible). Do not restore the hidden pattern.

**Dev server / stale `.next` — important operational note**
If the UI renders as unstyled HTML (no CSS), a stale production `.next` build is conflicting with the dev server's CSS generation. Fix: kill the dev server, `rm -rf .next`, restart `npm run dev`. Never run `npm run build` while `npm run dev` is running. The CSS file path `/_next/static/css/app/layout.css` is served dynamically in dev — it is NOT present as a static file in `.next/static/css/app/` until a production build. Any HTTP 404 for that path in dev means the server started against a stale `.next`.

**Persistence model — important**

| Scope | Mechanism | Resets on |
|---|---|---|
| Agent chats + messages | Supabase (PostgreSQL via Prisma) | Never — persisted in DB |
| Apply form → Admissions | `sessionStorage['sis_pending_applicants']` | Browser close |
| User profile / theme / notif prefs | `localStorage` | Never (until cleared) |
| CRM leads, activities, follow-ups | Module-level arrays in `crm/page.tsx` + `mock-data.ts` | Hard reload / server restart |
| Document Generator templates & history | Module-level arrays in `documents/page.tsx` | Hard reload |
| Budget data (budgets + expenses) | `MOCK_BUDGETS`, `MOCK_BUDGET_EXPENSES` in `mock-data.ts` | Hard reload |
| Custom roles | `MOCK_CUSTOM_ROLES` in `mock-data.ts` | Hard reload |
| Team Hub photos | `member.avatar` mutation + `avatarMap` state | Hard reload |
| Help entry edits & GIF uploads (object URLs) | `HELP_ENTRIES` array in `help-registry.ts` | Hard reload |
| Quiz attempts + student answers | `quiz.attempts` array mutated in-place inside `MOCK_QUIZZES` | Hard reload |
| Assignment submissions | `asgn.submissions` array mutated in-place inside `MOCK_ASSIGNMENTS` | Hard reload |
| PT submissions + criterion scores | `task.submissions` mutated in-place inside `MOCK_PERFORMANCE_TASKS` | Hard reload |
| Quiz settings customization | Fields mutated on `quiz` object in `MOCK_QUIZZES` (in-place) | Hard reload |
| HRIS (employees, applications, leaves, onboarding) | `MOCK_HR_EMPLOYEES`, `MOCK_JOB_APPLICATIONS`, `MOCK_HR_LEAVES`, `MOCK_HR_ONBOARDING` in `mock-data.ts` | Hard reload |
| AMS (assets, deployments, history, consumables, maintenance) | `MOCK_ASSETS`, `MOCK_ASSET_DEPLOYMENTS`, `MOCK_ASSET_HISTORY`, `MOCK_CONSUMABLES`, `MOCK_CONSUMABLE_TRANSACTIONS`, `MOCK_MAINTENANCE_LOGS`, `MOCK_ASSET_TAG_FORMATS` in `mock-data.ts` | Hard reload |
| Accounting (CoA, journal entries, approvals, payroll) | `MOCK_CHART_OF_ACCOUNTS`, `MOCK_JOURNAL_ENTRIES`, `MOCK_FIN_APPROVALS`, `MOCK_PAYROLL_RUNS` in `mock-data.ts` | Hard reload |
| API keys | `MOCK_API_KEYS` in `mock-api-keys.ts` | Hard reload |
| Forms & submissions | `MOCK_FORMS`, `MOCK_FORM_SUBMISSIONS` in `mock-data.ts` | Hard reload |
| Everything else (students, SOA, grades) | Module-level arrays in `mock-data.ts` | Hard reload |

- **User Management** (`/staff/users`) — SUPER_ADMIN only. Two tabs: **Users** (searchable table of all system accounts, read-only) and **Role Management**. Role Management shows the 8 system roles as read-only cards (lock icon, cannot be edited/deleted) plus a custom-role table with Create/Edit/Delete. Create-role modal has a 7-module × 4-permission (view/create/edit/delete) matrix; enabling create/edit/delete auto-enables view. Custom roles stored in `MOCK_CUSTOM_ROLES: CustomRole[]` (mutable). Types: `ModuleKey`, `ModulePermission`, `CustomRole`, `SystemUser` in `types/index.ts`.

- **Budget Management** (`/staff/treasury/budget`) — ACCOUNTING + SUPER_ADMIN only. Three tabs: **Overview** (summary cards + per-department budget health cards), **Budgets** (table with inline progress bars, edit/delete), **Expenses** (expense log). Budget health: green < 80%, amber 80–99%, red ≥ 100%. `Create Budget` modal: name, department (4 colleges), amount, period type (Monthly/Quarterly/Yearly), start/end dates. `Record Expense` modal: selects a budget, validates amount ≤ remaining balance, auto-deducts. All budget data isolated from Treasury — does NOT touch SOA/payment arrays. Types: `Budget`, `BudgetExpense`, `BudgetPeriod` in `types/index.ts`. Mock data: `MOCK_BUDGETS` (4 pre-loaded Q1 2025 quarterly budgets), `MOCK_BUDGET_EXPENSES` (10 sample expenses), `BUDGET_DEPARTMENTS` const in `mock-data.ts`. **Dean budget view** (`/staff/dean/budget`) — read-only, scoped to `deanDepartment`; shows summary cards + per-budget progress cards with itemized expense table. Deans cannot edit.

- **Financial Operations Suite** — Complete enterprise financial ecosystem. Three portals, one role each.

  **Treasury Office** (`TREASURER`):
  - `/staff/treasury/collections` — Record payments, issue OR numbers, daily collection stats, filter by date/type.
  - `/staff/treasury/receipts` — Official Receipt log: search, print (`window.print()`), void with reason modal. OR numbers auto-generated via `nextORNumber()` in `mock-data.ts` (format `OR-2025-NNNNN`).

  **Accounting Office** (`ACCOUNTING`):
  - `/staff/accounting` — Dashboard: cashflow stat cards (total inflow, outflow, net, reserved), Recharts BarChart monthly trend, department budget utilization bars, recent expenses, pending PRs needing approval.
  - `/staff/accounting/cashflow` — Cashflow ledger: INFLOW (green) / OUTFLOW (red) badges, running balance column, record entry modal, month filter.
  - `/staff/accounting/expenses` — Expense management: approve/reject PENDING expenses, record expense modal, filter by category/status/department.
  - `/staff/accounting/reports` — 4 tabs: Cashflow / Budget Utilization / Expense Summary / Collection Summary, each with Recharts BarChart or PieChart + print export.

  **Purchasing Office** (`PURCHASING_OFFICER`):
  - `/staff/purchasing` — Dashboard: stat cards, recent PRs, active POs with delivery dates.
  - `/staff/purchasing/requests` — PR management: filter tabs by status, PR cards with approval chain timeline, create PR with real-time budget validation, approve/reject per role (ACCOUNTING = step 1, PURCHASING_OFFICER = step 2).
  - `/staff/purchasing/orders` — PO management: create PO from approved PR, vendor assignment, mark delivered.
  - `/staff/purchasing/vendors` — Vendor registry: 3-col card grid, add/edit modal, activate/deactivate.

  **Budget reservation system**: When a PR is submitted → `MOCK_BUDGET_RESERVATIONS` entry created with `status: 'ACTIVE'` → available balance = `budget.amount − sum(expenses) − sum(ACTIVE reservations)`. If amount > remaining, submission is blocked with "Insufficient Department Budget" error. On PR approval → reservation becomes `CONVERTED`, expense recorded. On rejection/cancellation → reservation `RELEASED`, balance restored.

  **New types** (all in `types/index.ts`): `PRStatus` (8 values), `PRPriority`, `POStatus`, `VendorStatus`, `VendorCategory`, `ExpenseCategory`, `ExpenseStatus`, `ReservationStatus`, `PRItem`, `PRApproval`, `PurchaseRequest`, `POItem`, `PurchaseOrder`, `Vendor`, `OfficialReceipt`, `CashflowEntry`, `FinancialExpense`, `BudgetReservation`.

  **Mock data** (in `mock-data.ts`): `MOCK_VENDORS` (5), `MOCK_PURCHASE_REQUESTS` (5 across all statuses), `MOCK_PURCHASE_ORDERS` (2), `MOCK_OFFICIAL_RECEIPTS` (5), `MOCK_CASHFLOW` (8 entries), `MOCK_FIN_EXPENSES` (5), `MOCK_BUDGET_RESERVATIONS` (4), `nextORNumber()` sequence helper.

  **Approval chain**: PRApproval array on each PR — step 1 = ACCOUNTING, step 2 = PURCHASING_OFFICER. SUPER_ADMIN can approve both. Status per step: `PENDING | APPROVED | REJECTED`.

- **Universal Request Center** — `/staff/requests`, `/teacher/requests`, `/student/requests`. All three are thin wrappers around the shared `src/components/shared/RequestCenter.tsx` component. Props: `portal`, `userId`, `userName`, `userRole`, `championDept?` (if the user is a department champion). **Request categories and automatic routing**: LEAVE → HR, PURCHASE → PURCHASING, ASSET → AMO, GENERAL → ADMIN. Users never manually select a department — routing is automatic. **Champion dept map** (in staff wrapper): HR_STAFF→HR, PURCHASING_OFFICER→PURCHASING, AMO→AMO, SUPER_ADMIN→ADMIN. Champions see an **Incoming Requests** tab filtered to their department. Create Request flow is 2-step: type selector grid → dynamic form per category. **Status flow**: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → REJECTED → PROCESSING → COMPLETED → CANCELLED. **Types**: `RequestCategory`, `RequestType` (16 values), `RequestStatus`, `RequestPriority`, `ChampionDept`, `RequestActivity`, `UniversalRequest` in `types/index.ts`. **Mock data**: `MOCK_REQUESTS` (5 seeded), `nextReqNumber()` in `mock-data.ts`. Sidebar: `Inbox` icon, visible to all roles in all three portals.

- **Institutional Ticketing / Support Center** — `/staff/support`, `/teacher/support`, `/student/support`. All three wrap shared `src/components/shared/SupportCenter.tsx`. Props: `portal`, `userId`, `userName`, `userRole`, `agentDept?`. **Ticket auto-routing**: category → department → champion role, defined in `CATEGORY_ROUTING` inside the component (user never sees department assignment). **SLA timers**: LOW=48h, MEDIUM=24h, HIGH=8h, CRITICAL=1h. SLA badge colors: green=ok, amber=warning (<25% remaining), red=breached. **Status flow**: OPEN → UNDER_REVIEW → IN_PROGRESS → WAITING_FOR_USER → ESCALATED → RESOLVED → CLOSED. **Conversation thread**: user messages right-aligned (brand bubble), staff left-aligned (white bubble with avatar); internal notes shown only to agents (amber background, lock icon). **Agent actions per status**: OPEN→Close/Return; IN_PROGRESS→Resolved; RESOLVED→Close. Post-resolution satisfaction rating (1–5 stars). **Knowledge Base tab**: `MOCK_KB_ARTICLES` (6 articles), searchable, category filter pills, helpful/not-helpful voting. **Analytics tab** (agents only): Recharts BarChart status distribution + PieChart department distribution. **Student portal**: KB is second tab; no Inbox or Analytics tabs. **Types**: `TicketStatus`, `TicketPriority`, `TicketDepartment`, `TicketCategory`, `TicketReply`, `TicketSatisfaction`, `SupportTicket`, `KBArticle` in `types/index.ts`. **Mock data**: `MOCK_TICKETS` (5), `MOCK_KB_ARTICLES` (6), `nextTicketNumber()` in `mock-data.ts`. Sidebar: `LifeBuoy` icon, all portals.

- **AI Assistant (Floating)** — `src/components/shared/AIAssistant.tsx`. Rendered in all three portal layouts (`staff/layout.tsx`, `teacher/layout.tsx`, `student/layout.tsx`) via server component passing `user.role` and `user.name` from `getServerSession`. Fixed `bottom-24px right-24px z-[999]` — above header/sidebar, below modals. 56×56px navy gradient button, `Sparkles` icon when closed / `X` when open, pulsing unread dot badge. Chat panel: 360×520px, slides up from `origin-bottom-right`. **Greeting** on first open is personalized per portal. **Response engine**: `getAIResponse(message, role, portal)` — comprehensive keyword-matching covering all 11 role branches (Student, Teacher, Registrar, Treasurer, Accounting, HR_STAFF, AMO, Purchasing, Academic Admin, Dean, Super Admin). Responses include navigation paths and tips specific to what each role can actually do. **Typing simulation**: 800–1400ms random delay before each AI response. **Suggested prompts**: role-specific chips shown after every AI response. No external API — fully rule-based.

- **AMS Enhancements**:
  - **Stat cards clickable** (`/staff/ams/page.tsx`): each card is a `Link` — Total→assets, Available→assets?status=AVAILABLE, Deployed→assets?status=DEPLOYED, Borrowed→borrow, Maintenance→maintenance, Overdue→borrow?tab=overdue. Hover: border highlight + icon scale.
  - **Mass Register via Excel** (`/staff/ams/assets/page.tsx`): "Mass Register" button opens a 3-step inline modal. Step 1: Download `SchoolEco_Asset_Template.xlsx` (2-sheet .xlsx — "Assets" sheet with header row + sample row + empty rows, "Instructions" sheet with column guide). Step 2: Drag-drop upload area. Step 3: Summary counts + error list + preview table + "Register N Assets" button. Template generated by `downloadAssetExcel()` in `import-templates.ts`; parsed by `parseAssetExcel(file)` which skips blank rows and the sample row (detected by asset name "Dell Inspiron 15").
  - **Low-stock bell notification** (`/staff/ams/consumables/page.tsx`): `useEffect` on mount pushes/updates a `MOCK_NOTIFICATIONS` entry (`id: 'ams_low_stock'`) listing all low-stock items with a link to `/staff/ams/consumables`.

- **Student Dashboard** — `Student ID` and `Notifications` stat cards removed from the student dashboard page.

- **Student "My Courses"** (`/student/subjects`) — Blackboard-style card grid. Six `BANNER_COLORS` gradient palettes cycle per card. Banner shows large watermark course code + frosted pill badge. "More info" toggle (outside the Link so it doesn't navigate) expands: course ID in structured format `{code}.{section}.1T.25.26`, instructor, room, full schedule, units, enrollment status, "Go to course →" CTA. Grid/list toggle. Favorites (star) state is local. Locked cards (PRE_ENROLLED) show amber badge with Lock icon.

- **LMS Assessment Engine** — Full exam/quiz workflow built on top of `MOCK_QUIZZES` and `MOCK_ASSIGNMENTS`. No new data stores — extends the existing arrays.

  **Assessment types** (`AssessmentType`): QUIZ, LONG_QUIZ, PRACTICAL_EXAM, MIDTERM_EXAM, FINAL_EXAM, ASSIGNMENT_EXAM, ORAL_ASSESSMENT, LABORATORY.

  **Question types** (`QuizQuestionType`): MCQ, TRUE_FALSE, MATCHING, IDENTIFICATION, FILL_IN_BLANK, ENUMERATION, ESSAY, LONG_RESPONSE, FILE_UPLOAD, CODING.

  **Faculty side:**
  - `teacher/subjects/[offeringId]/quizzes/page.tsx` — Assessment list with type-badge color coding, stats row (published / total submissions / pending grading), "Manage →" links, publish toggle, delete with confirm. Create modal includes all 8 types, passing score, per-question result-release flag.
  - `teacher/subjects/[offeringId]/quizzes/[quizId]/page.tsx` — 4-tab detail page:
    - **Overview**: metadata card (type badge, duration, points, date window, attempt limit, visibility), quick stats (submissions, graded, avg score, pass rate), publish toggle, edit-settings modal.
    - **Questions**: question builder — MCQ shows options with correct answer highlighted green; T/F shows answer key; Essay/Coding shows "manual grading" badge; Identification/Fill-in-blank shows answer key. Add/edit/delete. Saved to `quiz.questions` array directly.
    - **Submissions**: all attempts in a table (student, status badge, score, timestamp, time taken). Grade button opens grading modal: auto-graded items show ✓/✗ + awarded score; manual items (Essay/Coding/Long Response) show score input + feedback textarea per question. Saves back to `attempt.answers` and sets `isFullyGraded: true`.
    - **Analytics**: avg/high/low/pass rate stats, horizontal score-distribution bar chart (4 ranges: 0–59%, 60–74%, 75–89%, 90–100%), per-question correct-rate bars for auto-graded questions.
  - `teacher/subjects/[offeringId]/assignments/page.tsx` — Assignment list with submission count (submitted vs. graded), expandable submission detail per student, publish/delete controls.

  **Student side:**
  - `student/subjects/[offeringId]/quizzes/page.tsx` — Three sections: **Open Now** (pulsing dot), **Upcoming**, **Past**. Per-card: type badge, status (Open/Upcoming/Closed/Submitted/Graded), duration, points, close time. "Take Assessment" → taking page; "View Result" → same page in result mode.
  - `student/subjects/[offeringId]/quizzes/[quizId]/page.tsx` — State machine: `start → taking → submitted → result`.
    - **start**: instructions card, rules list, attempt-limit display; Start button disabled if no questions.
    - **taking**: sticky header with countdown timer (turns `text-red-600` < 5 min, auto-submits on timeout); left sidebar navigation grid (answered=navy, flagged=amber+ring, current=ring); question panel with type-appropriate input (MCQ radio, T/F big buttons, text input for IDENTIFICATION/FILL_IN_BLANK, textarea for ESSAY, dark monospace for CODING). Auto-save on each keystroke updates local state. Flag-for-review toggle.
    - **submitted**: confirmation with auto-graded score preview; manual items shown as "awaiting instructor grading."
    - **result**: score, percentage, Pass/Fail badge (vs `passingScore`); per-question review if `showCorrectAnswers` enabled.
    - **Scoring on submit**: MCQ/T/F = exact match; IDENTIFICATION/FILL_IN_BLANK = case-insensitive trimmed match; ESSAY/LONG_RESPONSE/CODING = `score: undefined` (manual). Attempt pushed directly to `quiz.attempts`.
  - `student/subjects/[offeringId]/assignments/page.tsx` — Stats strip (Pending/Submitted/Graded), assignment cards with status badge, submit modal (text answer), expandable submission detail with instructor feedback + final grade.

  **Access gate** (both student quiz/assignment pages): enrollment must be `ENROLLED`, assessment must be `isPublished`, current time must be within `startDate`–`endDate` window.

  **Publish validation** — `togglePublish` on the quiz list page runs validation before publishing: no questions → blocked; any auto-graded question (MCQ/T/F/Identification/Fill-in-Blank) missing `q.answer` → blocked; any question with `q.points <= 0` → blocked. Blocked = validation modal lists every issue with "Go to Question Builder" CTA. Questions tab shows amber ring + warning label strip on each invalid question.

  **Submission confirmation modal** — "Yes, Submit Exam" / "No, Review Again" buttons. Shows 3-column summary: Answered / Unanswered (red) / Flagged (amber). Lists specific unanswered question numbers ("Q2, Q4, Q7 — will receive 0 points") and flagged numbers. All-good state shows green checkmark. Timer auto-submit bypasses the modal.

  **Gradebook auto-push** — On submit, if all questions are auto-graded (`noManualQuestions = true`), the submission handler immediately upserts a `MOCK_GRADES` record for the student's enrollment with the recomputed quiz average (percentage across all quiz attempts in this offering). Manual-graded submissions (Essay/Coding) do NOT auto-push — teacher must grade first.

  **Quiz/Exam Customization Settings** (`/teacher/subjects/[offeringId]/quizzes/[quizId]/settings`) — dedicated settings page linked from "Advanced Settings →" in the Overview tab. Sticky left sidebar + 8 scrollable sections:
  - **Attempts**: max attempts (1/2/3/5/Unlimited=99), grading method (Highest/Latest/Average), allow resume
  - **Timing**: duration, timer behavior (Auto-submit / Allow overtime), overtime penalty pts/min
  - **Questions**: shuffle questions/options toggles, display mode (One-per-page / All-at-once), random pool size
  - **Scoring**: partial credit toggle, negative marking toggle + penalty %, info note
  - **Behavior**: navigation mode (Free / One-way), auto-save interval (10/15/30/60s)
  - **Security**: fullscreen, disable copy/paste, tab switch detection + limit, IP tracking, browser lock
  - **Feedback**: timing (Immediately / After due date / Manual), level (Score only / +Answers / Full), grade weight
  - **Release**: visibility (Draft / Published / Scheduled + datetime), allow score override
  - **Clone Assessment** button — copies quiz with "Copy of" prefix, empty attempts, unpublished, pushes to MOCK_QUIZZES

  **Behavioral enforcement in student taking page** — Settings from the customization panel actively change the exam UX:
  - `navigationMode: 'ONE_WAY'` → Previous button replaced with "One-way navigation" label
  - `timerBehavior: 'ALLOW_OVERTIME'` → timer shows amber "+overtime" text after reaching zero instead of auto-submitting
  - `security.tabSwitchDetection` → `visibilitychange` listener counts switches, shows red banner with count/limit; auto-submits at limit
  - `security.disableCopyPaste` → `onCopy/onCut/onPaste` preventDefault + `userSelect: none` on question panel
  - `feedbackLevel` / `feedbackTiming` → derived as `resolvedFeedbackLevel` / `releaseImmediately`; control per-question review visibility and score release timing
  - New types: `AttemptGradingMethod`, `TimerBehavior`, `NavigationMode`, `QuestionDisplayMode`, `FeedbackTiming`, `FeedbackLevel`, `QuizSecuritySettings`, `ConditionalRelease` — all in `types/index.ts`; `Quiz` extended with 20+ optional fields (all backward-compatible)

- **Performance Task (Rubric-Based Assessment)** — Third assessment type alongside Quiz and Assignment.

  **Data model**: `Rubric` (criteria + levels), `RubricCriterion` (name, weight, description, levels array), `RubricLevel` (label, score, description), `CriterionScore` (weighted calculation), `PTSubmission`, `PerformanceTask` — all in `types/index.ts`. Mock data: `MOCK_RUBRICS` (2 pre-built), `MOCK_PERFORMANCE_TASKS` (2 seeded with rubrics embedded).

  **Faculty side:**
  - `teacher/subjects/[offeringId]/performance-tasks/page.tsx` — Task list with stats row, 2-step create modal (basic info → rubric builder with default criteria Content/Creativity/Presentation at 40/30/30%; each criterion has 4 levels Excellent/Good/Fair/Poor at 100/85/70/50; weight validation; nested level editor modal). Publish/delete controls.
  - `teacher/subjects/[offeringId]/performance-tasks/[taskId]/page.tsx` — 3-tab detail: **Overview** (info + stats), **Rubric** (scoring matrix per criterion → levels as color-coded cards: emerald/blue/amber/red; edit modal with weight validation), **Submissions** (all enrolled students including not-submitted rows; Grade modal shows student content + level button strip per criterion → weighted score auto-computed live as `score × weight% = pts`; saves `criteriaScores + finalScore`).

  **Student side:**
  - `student/subjects/[offeringId]/performance-tasks/page.tsx` — Enrollment access gate, stats strip (Pending/Submitted/Graded), task cards with rubric toggle (Criterion/Weight/Excellent/Good/Fair/Poor matrix with selected level highlighted post-grade), grade breakdown (per-criterion level + weighted contribution + instructor feedback), submit modal.

  **Grade Book integration**: PT weight is a 4th slider in Criteria page (rose color). Grade book "Sync from LMS" pulls `MOCK_PERFORMANCE_TASKS` PT averages alongside quiz/assignment averages. PT column (rose border) visible only when `performanceTaskWeight > 0` in criteria.

  **Grading Criteria page** (`/teacher/subjects/[offeringId]/criteria`) — all four default categories (Quiz/Assignment/Exam/PT) plus any custom categories; only enabled ones count toward the 100% requirement and appear in the grade book formula.

  **Print SOA** — Both treasury SOA page (`/staff/treasury/soa/[studentId]`) and student SOA page (`/student/soa`) have functional "Print SOA" / "Print / Download" buttons. `handlePrint()` opens a new window with formatted HTML (school name header, student info, billing breakdown by type, totals, payment history, signature lines) and calls `window.print()` on it. Styled for A4 with `@media print` margins.

- **Grade Finalization Room** — four-status pipeline: Teacher → Registrar closes → Registrar publishes → Student sees.
  - **`GradeSubmissionStatus`**: `'SUBMITTED' | 'CLOSED' | 'RETURNED' | 'PUBLISHED'` (NOT the old `PENDING/APPROVED/REJECTED`).
  - **Teacher flow** (`/teacher/grades` + `/teacher/subjects/[id]/grades`): "Submit Grades" creates a `GradeSubmission` with status `SUBMITTED` and adds offering to `LOCKED_OFFERINGS`. If returned, teacher can re-edit and resubmit. Status banners on the grade book detail page reflect each status.
  - **Finalization Room** (`/staff/grades`): REGISTRAR + SUPER_ADMIN. Four tabs: Submitted / Closed / Published / Returned. Actions per status — on **SUBMITTED**: "Close Submission" (→ `CLOSED`, stays locked) or "Return to Teacher" (→ `RETURNED`, unlocks offering, requires reason). On **CLOSED**: "Reopen" (→ `RETURNED`, unlocks) or "Publish to Students" (→ `PUBLISHED`, pushes entries to `MOCK_GRADES`).
  - **Student view** (`/student/grades`): reads only `PUBLISHED` submissions — nothing shown until Registrar explicitly publishes.
  - **`GradeSubmission` fields**: `closedAt/closedBy`, `publishedAt/publishedBy`, `returnedAt/returnedBy`, `returnReason` (replaces old `rejectionReason`/`reviewedAt`/`reviewedBy`).
  - **Mock data**: `MOCK_GRADE_SUBMISSIONS: GradeSubmission[]` and `LOCKED_OFFERINGS: Set<string>` in `src/lib/mock-data.ts`.

- **AMS Module** (`/staff/ams`) — AMO role + SUPER_ADMIN only. Complete asset lifecycle management.
  - **AMS Dashboard** (`/staff/ams`) — 6 stat cards (total/available/deployed+in-use/borrowed/maintenance/overdue), 4 quick-action cards, recent activity feed (last 5 `MOCK_ASSET_HISTORY`), active deployments panel with overdue highlighting, low-stock consumables bar chart, warranty expiry alerts (180-day window with red/amber/green badges).
  - **Asset Registry** (`/staff/ams/assets`) — full table with search/category/status/department filters. Status badge is clickable — opens a 9-option popover to change status in place. View → detail, Edit → status change.
  - **Register Asset** (`/staff/ams/assets/new`) — 4-step mobile-first wizard: (1) Basic Info with camera photo capture (`capture="environment"`), category, brand/model, serial, status selector; (2) Ownership — department, custodian type (Individual/Department), custodian name; (3) Purchase — date, supplier, cost, warranty; (4) Location + Inclusions builder. Auto-generates asset tag using the default `AssetTagFormat` from `MOCK_ASSET_TAG_FORMATS`.
  - **Asset Detail** (`/staff/ams/assets/[id]`) — header card with navy banner, category icon avatar, asset tag/name/status/category, info pills. 4 tabs: **Info** (Basic Info, Location, Purchase Details with warranty warning, Inclusions), **Deployments** (table, Return Asset modal with missing-accessory multi-checkbox and conditional damage report), **History** (vertical timeline with colored dots per activity type, activity type filter), **Maintenance** (table, Add Maintenance modal that sets asset status to UNDER_MAINTENANCE and logs MAINTENANCE_STARTED history).
  - **Borrow & Deploy** (`/staff/ams/borrow`) — 4 stat cards, filter tabs (All/Active/Returned/Overdue), deployment table. New Borrow/Deploy modal: asset select (AVAILABLE only), borrower info, deployment type radio (Temporary/Long-term/Permanent), date/time, purpose, terms note. Return modal: same fields as Asset Detail return flow. All mutations update asset status + push to `MOCK_ASSET_HISTORY`.
  - **Consumables** (`/staff/ams/consumables`) — pill tabs toggle Inventory / Transaction Log. Inventory: 2-col card grid with progress bar + threshold marker, stock status badge (LOW/NORMAL/OVERSTOCK), three-dot menu (Issue/Restock/Edit/Delete). Issue Stock modal deducts from `MOCK_CONSUMABLES` + pushes `ConsumableTransaction`. Transaction Log table sorted desc by date.
  - **Maintenance** (`/staff/ams/maintenance`) — table with type/status badges. Complete modal: completion date, cost, notes → sets status COMPLETED + sets asset AVAILABLE + pushes MAINTENANCE_COMPLETED history. Cancel → sets CANCELLED + restores asset status. Log Maintenance modal creates new `MaintenanceLog` + sets asset UNDER_MAINTENANCE.
  - **Tag Builder** (`/staff/ams/tag-builder`) — 60/40 split: builder panel (name, separator radio, component chip list with ↑↓ reorder + delete, Add Component dropdown with 7 types), preview panel (live mono tag using example values, saved formats list with Set Default / Delete). Saves to `MOCK_ASSET_TAG_FORMATS`. Auto-dismiss toast notifications.

  **AMS types** (all in `src/types/index.ts`): `AssetCategory` (10 values), `AssetStatus` (9 values), `DeploymentType`, `AssetDeploymentStatus`, `AssetActivityType` (11 values), `ConsumableUnit`, `StockStatus`, `MaintenanceType`, `MaintenanceStatus`, `ConsumableTransactionType`, `TagComponentType` (7 values), `Asset`, `AssetInclusion`, `AssetDeployment`, `AssetHistory`, `Consumable`, `ConsumableTransaction`, `MaintenanceLog`, `TagFormatComponent`, `AssetTagFormat`.

  **Mock data** (in `src/lib/mock-data.ts`): `MOCK_ASSETS` (8 assets), `MOCK_ASSET_DEPLOYMENTS` (3), `MOCK_ASSET_HISTORY` (9), `MOCK_CONSUMABLES` (5), `MOCK_CONSUMABLE_TRANSACTIONS` (6), `MOCK_MAINTENANCE_LOGS` (3), `MOCK_ASSET_TAG_FORMATS` (2).

  **Demo account**: `amo@school.edu` / `password` → portal: `/staff/ams`.

  **Asset tag generation**: `generateTag(category)` in `assets/new/page.tsx` reads the default format from `MOCK_ASSET_TAG_FORMATS` and builds `IT-{CAT_ABBR}-{YEAR}-{SEQUENCE}`. The `CAT_ABBR` map converts each `AssetCategory` to a short string.

- **HRIS Module** (`/staff/hr`) — HR_STAFF role + SUPER_ADMIN only. Complete employee lifecycle management.
  - **HR Dashboard** (`/staff/hr`) — stat cards (total/active employees, open jobs, pending leaves), quick-action cards linking to sub-pages, recent job postings, pending leaves list, ATS pipeline summary (applicant counts per stage).
  - **Job Postings** (`/staff/hr/jobs`) — CRUD for job postings. Status tabs (All/Open/Draft/Closed/Filled). Job cards with applicant count, employment type/work-setup badges, salary range, "View Applications →" link. Create/Edit modal with full form (13 fields). Three-dot menu: Edit, Close/Reopen, Delete.
  - **Recruitment / ATS** (`/staff/hr/recruitment`) — Kanban pipeline with 7 active columns (NEW → SCREENING → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED → FINAL_EVALUATION → HIRED). "Move to next stage" button per card. Right-side slide-over for full detail: star rating, stage dropdown, notes, interview scheduling (date/type/link/notes), salary offer (HIRED), rejection reason. Rejected section collapsible at bottom. Job filter via `?jobId=`. Uses `useSearchParams` → wrapped in `<Suspense>`.
  - **Employee Records** (`/staff/hr/employees`) — Directory with 4 stat cards, search/department/status/type filters, table with avatar+name+employeeNo, status/type/worksetup badges, salary, "View" link. Add Employee modal pushes to `MOCK_HR_EMPLOYEES`.
  - **Employee Detail** (`/staff/hr/employees/[id]`) — 4 tabs: Profile (personal info + employment details + government IDs + emergency contact, fully editable), Documents (list with verified status), Leave History (table), Onboarding (progress bar + task checklist by category). Inline edit mode saves back to `MOCK_HR_EMPLOYEES`.
  - **Onboarding** (`/staff/hr/onboarding`) — Accordion cards per employee. Progress bar (completedTasks/totalTasks %). Tasks grouped by category (Documents / System Access / Orientation / HR & Legal). Click task to toggle completion (mutates `MOCK_HR_ONBOARDING`). Add Task inline form. Start Onboarding modal creates a new record with 5 default tasks.
  - **Leave Requests** (`/staff/hr/leaves`) — 4 stat cards (total/pending/approved/rejected). Filter by status/type/search. Table with employee avatar, leave type badge, period, days, status. Review modal (pending leaves): shows details, rejection reason textarea, Approve/Reject buttons. File Leave Request modal for HR-initiated requests. Both approve and reject mutate `MOCK_HR_LEAVES` in place.

  **HRIS types** (all in `src/types/index.ts`): `EmploymentType`, `HREmploymentStatus`, `WorkSetup`, `JobPostingStatus`, `AtsStage`, `InterviewType`, `HRLeaveType`, `HRLeaveStatus`, `HROnboardingStatus`, `JobPosting`, `JobApplication`, `HRDocument`, `OnboardingTask`, `HROnboardingRecord`, `HREmployee`, `HRLeaveRequest`.

  **Mock data** (in `src/lib/mock-data.ts`): `MOCK_JOB_POSTINGS` (5 postings), `MOCK_JOB_APPLICATIONS` (13 applicants across 3 jobs), `MOCK_HR_EMPLOYEES` (5 employees), `MOCK_HR_ONBOARDING` (1 record with 10 tasks), `MOCK_HR_LEAVES` (7 requests).

  **Demo account**: `hr@school.edu` / `password` → portal: `/staff/hr`.

- **Terms of Service** (`/terms`) — Public route (no auth). Accessible to all users. Based on the 13-section SMS Legal Master Policy Framework (effective May 10, 2026, v1.0). Layout: sticky top nav, hero section with version/date badges, amber notice banner, sticky left TOC (desktop), 13 numbered section cards (each with section code badge), acceptance card in navy gradient. Section anchors: `#section-01` through `#section-13`. Linked from: login page (agreement checkbox), landing page footer, settings page Terms & Legal card.

  **Login page ToS agreement** — A full-width toggle button above the Sign In button. Before clicking: ghost button "I Agree to the Terms of Service". After clicking: solid emerald button with checkmark "Agreed — Terms Accepted". The Sign In button (`disabled={!agreed}`) is blocked until the user clicks agree. The Terms link inside the button opens in a new tab without toggling the checkbox (`e.stopPropagation()`). State: `const [agreed, setAgreed] = useState(false)`.

  **Settings page Terms section** — "Terms & Legal" card at the bottom of `/staff/settings`. Contains: full ToS link (opens new tab), acknowledgement notice (quotes Section 9 audit logging), 3 quick-access shortcut cards for Data Governance (§03), Acceptable Use (§06), and Audit & Monitoring (§09) linking directly to anchors.

- **Excel / CSV Import System** — Bulk import for 5 modules. Two shared files:
  - `src/lib/import-templates.ts` — `IMPORT_TEMPLATES` record with 5 template definitions (`students`, `employees`, `assets`, `consumables`, `subjects`). Each template has `columns: TemplateColumn[]` (key, label, required, hint, example) and `sampleRows`. `downloadCSV(templateId)` generates and downloads a `.csv` with 4 header rows (keys / friendly labels / hints / examples) + 2 sample data rows — opens natively in Excel/Google Sheets. `parseImportCSV(content, templateId)` splits CSV, skips hint/example rows by detecting first-cell content, validates required fields, returns `ParseResult { rows, totalRows, validRows, errorRows }`.
  - `src/components/shared/ImportModal.tsx` — 3-tab modal: **Step 1 Download Template** (column reference table, Download .CSV button); **Step 2 Upload File** (drag-and-drop + file picker, accepts `.csv`); **Step 3 Review & Import** (3 summary cards total/valid/errors, scrollable row preview table with ✓ OK or error detail per row, Re-upload button, Import N Records emerald button disabled if 0 valid rows). Shows success state after import completes.

  **Import buttons** added to 5 pages — each wires `onImport` callback to push rows to the corresponding mock array and call `setState` to re-render:
  | Page | Template | Target array |
  |---|---|---|
  | `/staff/registrar` | `students` | `MOCK_STUDENTS` |
  | `/staff/academic` | `subjects` | `MOCK_SUBJECTS` |
  | `/staff/hr/employees` | `employees` | `MOCK_HR_EMPLOYEES` |
  | `/staff/ams/assets` | `assets` | `MOCK_ASSETS` |
  | `/staff/ams/consumables` | `consumables` | `MOCK_CONSUMABLES` |

- **Universal Form Builder & Publishing System** — `/staff/forms`, `/staff/forms/[id]/builder`, `/staff/forms/[id]/submissions`, `/staff/forms/center`, `/teacher/forms`, `/student/forms`. Shared component: `src/components/shared/FormsCenter.tsx`.
  - **Form Builder list** (`/staff/forms`) — Stats (Total Forms, Published, Total Submissions, Drafts), status filter tabs, search, form card grid with left-border color coding (emerald=PUBLISHED, slate=DRAFT, amber=CLOSED). Actions per card: Edit, Submissions, Publish/Unpublish, Duplicate, Archive. Create modal: title, description, category, department, visibility (PUBLIC_INTERNAL / STAFF_ONLY / STUDENT_ONLY / DEPARTMENT_ONLY / CUSTOM). On create → redirects to builder page.
  - **Form Builder** (`/staff/forms/[id]/builder`) — 3-panel: left palette (field types), center canvas (drag-to-reorder), right editor (field properties). Field types: text, textarea, number, email, phone, date, select, radio, checkbox, file, rating, signature. Conditional logic: show/hide fields based on other field values. Autosave. Preview modal.
  - **Submissions inbox** (`/staff/forms/[id]/submissions`) — Table of submissions, review modal with field-by-field answers.
  - **FormsCenter** (shared) — Browse Forms + My Submissions tabs. Visibility filtering: staff sees ALL published forms (including STUDENT_ONLY); students see only PUBLIC_INTERNAL + STUDENT_ONLY; teachers see PUBLIC_INTERNAL + STAFF_ONLY. Draft forms never shown in browse. Staff sees a "N draft forms" notice pointing to Form Builder tab. Form fill modal with conditional logic, auto-fill, required validation.
  - **Request Center integration** — `RequestCenter.tsx` embeds both a **Forms** tab (`<FormsCenter>`) and a **Form Builder** tab (`<FormBuilderTab>`) directly. Both share the parent's `forceUpdate` via `onRefresh` prop so publish/submission changes are immediately reflected across tabs. `FORM_BUILDER_ROLES` gates the builder tab to authorized staff roles. Staff portal: Form Builder visible to SUPER_ADMIN, REGISTRAR, HR_STAFF, ACCOUNTING, ACADEMIC_ADMIN, PURCHASING_OFFICER, AMO, DEAN.
  - **Types** (in `types/index.ts`): `FormFieldType`, `FormStatus`, `FormVisibility`, `FormSubmissionStatus`, `FormCondition`, `FormField`, `FormSettings`, `InstitutionalForm`, `FormSubmission`.
  - **Mock data**: `MOCK_FORMS` (5 forms), `MOCK_FORM_SUBMISSIONS` (3 submissions), `nextFormId()`, `nextFsubId()` in `mock-data.ts`.

- **Institutional Accounting Ecosystem** (`/staff/accounting`) — ACCOUNTING + SUPER_ADMIN only. Complete enterprise financial platform integrated with Treasury, Purchasing, HRIS, AMS, and Budget systems.

  **Accounting ≠ Treasury distinction**: Treasury handles student payments, OR generation, cash receiving. Accounting handles financial records, budget allocation, expense tracking, cashflow, reporting, procurement expenses, payroll-ready records.

  **Accounting nav group** (11 items): Dashboard, General Ledger, Journal Entries, Chart of Accounts, Cashflow, Expenses, Fee Management, Approvals, Payroll, Analytics, Reports.

  **Dashboard** (`/staff/accounting`) — Rebuilt with 6 stat cards (Total Institutional Funds, Revenue YTD, Expenses YTD, Net Cashflow, Budget Utilization %, Pending Approvals). Integration sync row showing Treasury/Purchasing/AMS/HRIS record counts. Monthly cashflow AreaChart. Expense breakdown PieChart. Department budget progress bars. Recent journal entries list. Pending approvals list. Quick-action buttons to key sub-pages.

  **Chart of Accounts** (`/staff/accounting/chart-of-accounts`) — Configurable financial account structure. Accounts grouped by type (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE) with color-coded headers. Account hierarchy: parent accounts (bold, no balance) + sub-accounts (indented). Columns: Code, Name, Balance, Status. Add/Edit modal with code, name, type, parentCode (sub-account selector), description. Data: `MOCK_CHART_OF_ACCOUNTS` (28 pre-loaded accounts covering all 5 types). Types: `AccountType`, `ChartOfAccount` in `types/index.ts`.

  **General Ledger** (`/staff/accounting/ledger`) — Complete transaction history from `MOCK_JOURNAL_ENTRIES`. Filters: account selector, date range, source module, search. Entry table: JE# (monospace), Date, Description, Source Module badge, Reference, Debit (green), Credit (red), Status badge, View. Slide-over detail panel: full journal lines in debit/credit columns with totals row. Source module badges: TREASURY=blue, PURCHASING=violet, AMS=amber, HRIS=pink, PAYROLL=teal, MANUAL=slate.

  **Journal Entries** (`/staff/accounting/journal`) — Create and manage journal entries. New entry modal: date, description, reference, source module, dynamic journal lines (account selector, debit, credit, description per line), running totals, imbalance warning. "Save as Draft" or "Post Entry" — Post blocked if debit ≠ credit. Void posted entries (requires reason). Data: `MOCK_JOURNAL_ENTRIES` (7 seeded entries across TREASURY/PURCHASING/HRIS/AMS/PAYROLL/MANUAL sources). Types: `JournalEntryStatus`, `JournalLine`, `JournalEntry`. Sequence helper: `nextJENumber()` → `JE-2025-NNNN`.

  **Approvals** (`/staff/accounting/approvals`) — Multi-step financial approval workflow. Approval types: EXPENSE, BUDGET_ADJUSTMENT, JOURNAL_ENTRY, PAYROLL. Card layout (not table): each card shows approval #, type badge, title, amount, department, requester, step timeline (level dots with role + status icons). ACCOUNTING role approves step 1; SUPER_ADMIN approves step 2. Approve modal (comment); Reject modal (reason required). On full approval → status APPROVED. Data: `MOCK_FIN_APPROVALS` (3 seeded). Types: `FinApprovalType`, `FinApprovalStatus`, `FinApproverRole`, `FinApprovalStep`, `FinancialApproval`. Sequence: `nextFANumber()` → `FA-2025-NNNN`.

  **Payroll** (`/staff/accounting/payroll`) — Payroll-ready module connected to HRIS employees. Payroll run cards showing period, status, gross/deductions/net totals, employee count. Actions: Process (DRAFT→FOR_APPROVAL), Approve (FOR_APPROVAL→APPROVED), Mark as Paid (APPROVED→PAID) + generates journal entry. View Details modal: per-employee table (Basic Pay, Allowances, Deductions, Tax, Net Pay) + totals. New Payroll Run modal: auto-populates from `MOCK_HR_EMPLOYEES`. Data: `MOCK_PAYROLL_RUNS` (2 runs: April PAID + May FOR_APPROVAL). Types: `PayrollStatus`, `PayrollItem`, `PayrollRun`. Sequence: `nextPRRunNumber()`.

  **Analytics** (`/staff/accounting/analytics`) — Financial analytics dashboard. Period filter (Month/Quarter/Year). Stat cards: Total Revenue, Total Expenses, Net Surplus/Deficit (green/red), Budget Utilization %. Monthly Revenue vs Expenses BarChart (6 months). Expense Breakdown PieChart by category. Department Budget Utilization horizontal bar chart (green<80%, amber 80-99%, red≥100%). Revenue Sources PieChart from COA revenue accounts. Top Spending Departments table with utilization % and trend arrows. Financial Health Indicators: Liquidity Ratio, Debt Ratio, Revenue Growth %, Operating Margin %.

  **Mock data additions** (all in `mock-data.ts`): `MOCK_CHART_OF_ACCOUNTS` (28 accounts), `MOCK_JOURNAL_ENTRIES` (7 entries), `MOCK_FIN_APPROVALS` (3 approvals), `MOCK_PAYROLL_RUNS` (2 runs). Persistence: same as all mock data — resets on hard reload.

- **Talk to Agent (AgentChatWidget)** — `src/components/shared/AgentChatWidget.tsx`. A floating teal button (`bottom-6 right-6 z-[998]`, below modals but above header/sidebar) rendered in all three portal layouts (`staff/layout.tsx`, `teacher/layout.tsx`, `student/layout.tsx`). Opens a chat panel where users can start or continue a support conversation with a live staff agent. State is persisted in **Supabase via Prisma** — not mock data. Polls `GET /api/agent-chats` every 2 seconds to surface new messages. Chat number format: `CHAT-NNNNNN`.

  **Agent Chat data model** (in `prisma/schema.prisma`):
  - `AgentChat` — `id`, `chatNumber` (unique), `userId`, `userName`, `userRole`, `portal`, `department`, `subject`, `status` (`OPEN | ASSIGNED | RESOLVED | CLOSED`), optional `agentId`/`agentName`, timestamps.
  - `AgentChatMessage` — `id`, `chatId` (FK → AgentChat, cascade delete), `senderType` (`USER | AGENT | SYSTEM`), `senderId`, `senderName`, `content`, `isRead`, `timestamp`.

  **API routes** (all use Prisma, no mock data):
  - `GET /api/agent-chats` — list chats for the current user (or all chats for staff agents)
  - `POST /api/agent-chats` — create a new chat
  - `GET /api/agent-chats/[id]` — fetch a single chat with messages
  - `PATCH /api/agent-chats/[id]` — update status or assign agent
  - `GET /api/agent-chats/[id]/messages` — fetch messages for a chat
  - `POST /api/agent-chats/[id]/messages` — post a new message

- **Agent Inbox** (`/staff/agent-inbox`) — Staff-side interface for managing all incoming user chats. Visible to staff roles in the sidebar. Shows a list of all chats grouped by status; clicking a chat opens the conversation thread. Agents can reply, change status, and assign chats. Polls `/api/agent-chats` every 2 seconds for new activity.

- **Fee Management** (`/staff/accounting/fees`) — ACCOUNTING + SUPER_ADMIN only. Accounting defines the institutional fee structure (tuition rates, miscellaneous fees, lab fees, etc.) which is then synced/referenced by Treasury when generating Student Accounts (SOA). Part of the Accounting nav group. Fee records are scoped to `schoolId`.

- **REST API v1** (`/api/v1/`) — External-facing REST API with API key authentication. Accessible to all admin roles via `/staff/api` (Code2 icon in sidebar).

  **Authentication**: `Authorization: Bearer sis_live_XXXX` or `x-api-key: sis_live_XXXX` header. All CORS headers included on every route.

  **Endpoints**:
  | Method | Path | Scope |
  |---|---|---|
  | GET | `/api/v1/health` | Public |
  | GET/POST | `/api/v1/students` | `students:read/write` |
  | GET/PATCH/DELETE | `/api/v1/students/:id` | `students:read/write` |
  | GET | `/api/v1/courses` | `courses:read` |
  | GET | `/api/v1/grades` | `grades:read` (PUBLISHED only) |
  | GET/POST | `/api/v1/enrollments` | `enrollments:read/write` |
  | GET | `/api/v1/staff` | `staff:read` (no passwords) |
  | GET/POST | `/api/v1/keys` | NextAuth session (admin roles) |
  | DELETE | `/api/v1/keys/:id` | NextAuth session (own keys only for non-SUPER_ADMIN) |

  **API key libraries**:
  - `src/lib/api-keys.ts` — `generateApiKey()` (returns `{ key, prefix, hash }`), `hashKey()` (SHA-256), `validateApiKey(raw, storedKeys)`
  - `src/lib/mock-api-keys.ts` — `ApiKey`, `ApiScope` (11 values), `API_SCOPES`, `API_ADMIN_ROLES` (10 admin roles), `ROLE_DEFAULT_SCOPES` (per-role scope presets for Generate modal), `MOCK_API_KEYS` (starts empty)
  - `src/lib/api-middleware.ts` — `validateRequest(request, requiredScope)` → updates `lastUsedAt` on hit; `ok()`, `created()`, `err()`, `options()` response helpers

  **API Management Dashboard** (`/staff/api`) — Three tabs: **API Keys** (stat cards, paginated table with prefix/scopes/dates/status, Revoke with confirm, Generate Key modal with scope checkboxes), **API Reference** (collapsible endpoint groups, method badges, scope requirements, query param tables, dark code blocks), **Try It Out** (live endpoint tester with API key input, JSON body editor, response viewer). SUPER_ADMIN sees all keys system-wide; other admins see only their own. Role-based scope presets auto-selected when opening Generate modal (e.g., TREASURER → `financial:read`, HR_STAFF → `staff:read/write`).

  **Key format**: `sis_live_` + 32 random hex chars. Stored as SHA-256 hash — never recoverable after generation. Full key shown **once** on creation.

- **Dev Testing System** — Developer-only tools for rapid multi-role testing.
  - **Dev Testing Panel** (`/dev`) — Dark-themed page listing all 15 demo accounts grouped by role category. Each account has: colored avatar, label, email, **Login** button (instant `signIn()`), **Copy URL** button (copies auto-login URL to clipboard). Tip section explains Chrome Incognito / Profiles / different browsers for simultaneous multi-role testing.
  - **Auto-login API** (`/api/dev/login?as=ROLE`) — GET route that creates a NextAuth JWT for the specified demo user and sets the session cookie, then redirects to the role's portal. Accepts role shorthand (`admin`, `student`, `teacher`, `hr`, `amo`, `registrar`, `treasurer`, `accounting`, `academic`, `dean`, `purchasing`) or full email. Optional `&redirect=/path` param. Uses `encode` from `next-auth/jwt` and `DEMO_USERS` from `src/lib/auth.ts` (now exported).
  - **Login page one-click** — Demo account buttons now call `signIn()` directly (not just fill the form). `loginAsDemo(email)` auto-sets `agreed=true` and submits. Per-button spinner during login.
  - **Multi-port scripts**: `npm run dev:2` (`-p 3001`), `npm run dev:3` (`-p 3002`) — in Chrome, `localhost:3000` and `localhost:3001` have independent cookie jars, enabling true simultaneous multi-session testing.
  - `DEMO_USERS` is now **exported** from `src/lib/auth.ts` (used by the auto-login API route).

**Not yet built**
- `POST /api/schedules` — persist schedule to DB with conflict detection
- `PATCH /api/enrollment/[id]/confirm` — Treasury → ENROLLED status flip
- Persist CRM stage/lead overrides to DB (currently module-level only; resets on server restart)
- Persist Help entry edits and uploaded GIF URLs to DB
- Persist Document Generator custom templates and history to DB
- Accounting: Chart of Accounts balance auto-update from journal entries (balances are static mock values)
- Accounting: Financial period close workflow (types exist: `FinancialPeriod`, no UI yet)
- LMS: file upload for assignments/PTs (submit modal accepts text only; UI shows placeholder note)
- LMS: real-time auto-save to server (currently saves to local React state only)
- LMS: quiz question MATCHING type full UI (type exists in data model, not in question builder yet)
- LMS: question bank browse/reuse UI (types exist: `QuestionBankItem`, no page yet)
- LMS: quiz settings `gradingMethod` (Highest/Latest/Average) not yet applied when multiple attempts exist — currently always uses the latest attempt
- LMS: `security.fullscreenMode` and `security.browserLock` are UI toggles only — client-side enforcement not implemented (requires Fullscreen API integration)
- LMS: `security.ipTracking` is a stored flag only — no actual IP logging without server-side middleware
- LMS: `conditionalRelease` stored in type but no evaluation logic implemented
- API v1: persist API keys to DB (currently `MOCK_API_KEYS` resets on server restart)

## PostgreSQL / Supabase — already active

The database has been migrated from SQLite to Supabase-hosted PostgreSQL. `prisma/schema.prisma` already uses `provider = "postgresql"` with `directUrl`. The `.env` file (not `.env.local`) is what Prisma CLI and `seed.ts` read — keep secrets there. `npm run db:migrate` creates and applies a migration file; `npm run db:push` applies schema changes without a file (useful for rapid dev iteration).
