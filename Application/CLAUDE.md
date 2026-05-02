# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**School Eco (School Ecosystem)** — a SaaS School Management System built as a "train system" — each module is a station in the academic lifecycle. Tech stack: **Next.js 14 App Router · TypeScript · Tailwind CSS · Prisma (SQLite) · NextAuth.js · Recharts**.

## Commands

```bash
npm run dev             # Start on http://localhost:3000
npm run build           # Verify production build
npm run lint

# Database
npm run db:push         # Apply Prisma schema to SQLite (no migration file)
npm run db:seed         # Seed demo data via prisma/seed.ts
npm run db:studio       # Open Prisma GUI
npm run db:reset        # prisma migrate reset --force + re-seed
```

**First-time setup:**
```bash
cp .env.example .env.local   # set NEXTAUTH_SECRET
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
| `(public)` | `/apply` | Anyone |
| `(auth)` | `/login` | Anyone |
| `staff/` | `/staff/*` | SUPER_ADMIN, ADMISSION_OFFICER, REGISTRAR, TREASURER, ACADEMIC_ADMIN, DEAN |
| `teacher/` | `/teacher/*` | TEACHER |
| `student/` | `/student/*` | STUDENT |

`src/app/page.tsx` redirects via `ROLE_PORTALS` from `src/lib/utils.ts`. Each layout calls `getServerSession` and redirects on role mismatch.

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

### Mock data vs. database
`src/lib/mock-data.ts` is the live in-memory dataset. API routes read from it; commented Prisma calls show the eventual swap pattern. `src/lib/db.ts` exports the singleton `PrismaClient`.

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
The brand color is **navy blue** (`#1a4a8a`), not indigo. All `brand-*` tokens:

| Token | Hex | Usage |
|---|---|---|
| `brand-50` | `#eef3fb` | Soft background tints |
| `brand-100` | `#dce8f7` | Card tints, table header bg |
| `brand-200` | `#b9d1ef` | Borders on brand elements |
| `brand-500` | `#1a4a8a` | **Primary** — buttons, accents, active indicators |
| `brand-600` | `#163d73` | Hover |
| `brand-700` | `#11305c` | Active/pressed |
| `brand-900` | `#09182e` | Super Admin badge, modal backdrop |

Sidebar tokens (`sidebar-bg: #0c1e3d`, etc.) are defined separately in `tailwind.config.ts`.
Surface background: `#f3f6fb` (barely blue-tinted, not grey).

### Typography
Primary font: **Plus Jakarta Sans** (loaded via Google Fonts in `globals.css`). Fallback: Inter.
Formal display only: **Playfair Display** via `font-serif`.

### CSS custom property token system
`globals.css` defines a full design token system under `:root` — `--color-brand-*`, `--font-size-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--duration-*`. Use Tailwind classes in component code; use CSS vars only in custom CSS blocks.

### Key UI component conventions

- **`<SectionTitle>`** — page heading with a 3px navy left-accent bar. Props: `description`, `actions`.
- **`<Card padding="none">`** — wrap around `<Table>` for zero inner padding. Border is `#e4ebf5`.
- **`<Thead>`** — navy-tinted `#f0f4fa` bg + `#dce8f7` bottom border. Column labels: `text-brand-700 uppercase tracking-widest`.
- **`<Tr onClick={…}>`** — hover tint is `brand-50`.
- **`<Modal>`** — header has a 3px navy accent line beside the title. Backdrop: `brand-900/50`.
- **Status badges** — always use typed components: `ApplicantBadge`, `EnrollmentBadge`, `SOABadge`, `GradeBadge`, `PaymentBadge`, `RoleBadge`. Never use raw `<Badge>` with inline color strings.
- **`<Button variant="primary">`** — navy `#1a4a8a`. Additional variants: `"soft"` (light navy tint + border), `"navy"` (gradient).
- **`<Input>` / `<Select>`** — focus ring: `brand-500/15` glow; border: `#dce8f7`.

### Dean dashboard patterns
`src/app/staff/dean/page.tsx` defines `AnimatedStatCard` and `useCountUp` locally — **do not extract**. Chart filter uses `SCHOOL_YEAR_OPTIONS` with per-semester offset arrays to simulate history.

### Teacher schedule patterns
`src/app/teacher/schedule/page.tsx` uses local mutable state initialised from `MOCK_SCHEDULES` (empty after reset). Schedule slots added via modal persist only in component state (resets on navigation — intentional for mock-only mode). Room availability gates are enforced via `MOCK_ROOM_AVAILABILITY` from `mock-data.ts`.

## Key files

| File | Purpose |
|---|---|
| `src/types/index.ts` | All TypeScript interfaces |
| `src/lib/utils.ts` | `cn()`, `fullName()`, `initials()`, grade helpers, `ROLE_PORTALS`, `FACULTY_DEPT_TO_COLLEGE` |
| `src/lib/auth.ts` | NextAuth options, `DEMO_USERS` (plain-text pw), `deanDepartment` in JWT |
| `src/lib/mock-data.ts` | All in-memory data — applicants, students, offerings, rooms, faculty, `MOCK_ROOM_AVAILABILITY` |
| `src/lib/db.ts` | Singleton `PrismaClient` |
| `tailwind.config.ts` | Color tokens (navy brand, sidebar, gold, surface), font, shadows |
| `src/app/globals.css` | CSS custom property design tokens + font imports |
| `src/components/layout/StaffSidebar.tsx` | Role-aware staff nav; Dean shows `DEAN_NAV` only |
| `src/components/layout/TeacherSidebar.tsx` | Teacher nav: Dashboard, My Subjects, My Schedule |
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
| `prisma/schema.prisma` | Full relational schema — 20+ models |

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
| Academic Admin | academic@school.edu |
| Dean — Computing | dean.computing@school.edu |
| Dean — Business | dean.business@school.edu |
| Dean — Nursing | dean.nursing@school.edu |
| Dean — Arts | dean.arts@school.edu |
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
`computeFinalGrade()` (Quiz 30% + Assignment 30% + Exam 40%) → `gradeToLetter()` → Philippine numerical scale. Both in `src/lib/utils.ts`.

**Teacher schedule gate**
`src/app/teacher/schedule/page.tsx` filters `MOCK_OFFERINGS` to `status === 'PUBLISHED' && semesterId === activeSem.id && assignments.some(a => a.facultyId === myFaculty.id)`. Slot validation checks `MOCK_ROOM_AVAILABILITY[roomId]` for day/time window, then scans all offering schedules for conflicts.

**Newer modules (mock-only, no DB routes yet)**
- **Admissions CRM** (`/staff/admissions/crm`) — Full lead-pipeline Kanban with 8 stages (New Lead → Contacted → Interested → Applicant → For Interview → Accepted → Enrolled → Lost). Own `CrmLead` type separate from `Applicant`. Module-level stores: `CRM_LEADS`, `CRM_ACTIVITIES`, `CRM_FOLLOWUPS`. Drag-and-drop between columns. Slide-over detail panel has 3 tabs (Profile / Timeline / Follow-ups), stage pills, log-activity buttons, follow-up scheduler, footer action buttons. `moveToStage` auto-logs to timeline and syncs back to `MOCK_APPLICANTS` when lead has `applicantId`. On mount, auto-imports any new `MOCK_APPLICANTS` entries as Applicant-stage leads. Sidebar: SUPER_ADMIN + ADMISSION_OFFICER only.
- **Team Hub** (`/staff/team`) — table layout (not cards); clicking a row opens a table-format profile `Modal`. Role-based default department on load via `ROLE_DEPT_MAP` + `deanDepartment` from session.
- **School Year Calendar** (`/staff/calendar`) — legend badges are clickable filter toggles; `activeFilters: Set<EventType>` controls which event types appear in the grid and the upcoming sidebar.
- **Teacher subject detail** (`/teacher/subjects/[offeringId]`) — tabbed LMS view: materials, grading criteria, grade entry per enrolled student.
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
  
  **Editor UX**: clicking a pill or condition span → shows action bar with Remove button and "drag to move" hint. `data-loop-type` rows highlighted green in the editor so users know they repeat. Toolbar uses `onMouseDown + e.preventDefault()` on all buttons to keep editor focus. Insert Placeholder picker has 3 tabs (Personal, Academic, Loop Fields) + a Subject Table insertion section. Print output via `window.open()` — no PDF library.
  
  All module-level arrays (`BUILT_IN_TEMPLATES`, `CUSTOM_TEMPLATES`, `DOC_HISTORY`) persist across navigations within a session; reset on hard reload.
- **Help Module** (`/staff/help`) — Three tabs: **User Manual** (role-filtered, searchable, grouped by module), **FAQ**, **Admin Panel** (SUPER_ADMIN only). Data lives in `src/lib/help-registry.ts`: `FEATURE_REGISTRY` (34 registered features with `addedAt` / `lastModified` dates) and `HELP_ENTRIES` (mutable array — admin edits update it in-place). `computeEntryTags()` returns `'NEW'` if feature added ≤30 days ago, `'UPDATED'` if docs updated ≤14 days ago. `getFeatureDocStatus()` returns `'MISSING'` | `'OUTDATED'` | `'OK'` by comparing `feature.lastModified` vs `entry.lastUpdated`. **Auto-generated canvas tutorials**: every help entry with steps automatically shows an `AnimatedTutorialPlayer` — a `requestAnimationFrame` loop that calls `drawStepFrame()` from `tutorial-generator.ts` on a 640×360 canvas. Animation is time-based (ms elapsed), frame-rate independent, with slide transitions between steps. Admin can replace any auto-generated tutorial with an uploaded GIF or video (stored as an object URL). Coverage stats (uploaded vs auto vs missing) shown in ManualTab and AdminPanel.
- **User Profile system** — Header avatar dropdown links to Profile, Personalization, Settings, Help. `providers.tsx` exports `ThemeProvider` + `useTheme()` hook that applies `dark` class to `<html>`. Theme and accent saved to `localStorage`. Profile photo stored as base64 in `localStorage` via `loadProfile()`/`saveProfile()` helpers in `providers.tsx`.

**Admissions page details**
- Documents tab uses real `<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">` with simulated upload (600 ms delay → success). Each doc row tracks `uploadStatus: 'idle' | 'uploading' | 'success' | 'error'` and a parallel `docFiles: (File | null)[]` array.
- Search input removed from the filter bar; status-tab filter remains.
- `/apply` public form pushes to `MOCK_APPLICANTS` AND writes to `sessionStorage['sis_pending_applicants']` (JSON array). The admissions page rehydrates from `sessionStorage` on mount so submissions survive the full-page reload that happens during login. De-duplicates by `id`.
- Admissions dashboard (`ADMISSION_OFFICER` role) shows a Quick Actions row: Add Applicant, Review Applicants, Admissions CRM.

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

**Persistence model — important**

| Scope | Mechanism | Resets on |
|---|---|---|
| Apply form → Admissions | `sessionStorage['sis_pending_applicants']` | Browser close |
| User profile / theme / notif prefs | `localStorage` | Never (until cleared) |
| CRM leads, activities, follow-ups | Module-level arrays in `crm/page.tsx` + `mock-data.ts` | Hard reload / server restart |
| Document Generator templates & history | Module-level arrays in `documents/page.tsx` | Hard reload |
| Help entry edits & GIF uploads (object URLs) | `HELP_ENTRIES` array in `help-registry.ts` | Hard reload |
| Everything else (students, SOA, grades) | Module-level arrays in `mock-data.ts` | Hard reload |

**Not yet built**
- `POST /api/schedules` — persist schedule to DB with conflict detection
- `POST /api/lms/assignments`, `POST /api/lms/quizzes` — submission endpoints
- `PATCH /api/enrollment/[id]/confirm` — Treasury → ENROLLED status flip
- Persist CRM stage/lead overrides to DB (currently module-level only; resets on server restart)
- Persist Help entry edits and uploaded GIF URLs to DB
- Persist Document Generator custom templates and history to DB

## Switching to PostgreSQL

1. `DATABASE_URL=postgresql://…` in `.env.local`
2. `provider = "postgresql"` in `prisma/schema.prisma`
3. `npx prisma migrate dev --name init` instead of `db:push`
