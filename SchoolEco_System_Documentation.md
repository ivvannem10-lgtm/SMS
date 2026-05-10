# SchoolEco — School Management System
## Complete System Documentation

**Version:** 1.0  
**Institution:** St. Dominic College  
**Platform URL:** http://localhost:3000  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [The Train System Pipeline](#2-the-train-system-pipeline)
3. [User Roles & Access](#3-user-roles--access)
4. [Demo Accounts](#4-demo-accounts)
5. [Public Modules](#5-public-modules)
6. [Admissions Module](#6-admissions-module)
7. [Registrar Module](#7-registrar-module)
8. [Treasury Module](#8-treasury-module)
9. [Accounting / Budget Module](#9-accounting--budget-module)
10. [Academic Admin Module](#10-academic-admin-module)
11. [Dean Module](#11-dean-module)
12. [Teacher / Faculty Module](#12-teacher--faculty-module)
13. [LMS — Learning Management System](#13-lms--learning-management-system)
14. [Student Portal](#14-student-portal)
15. [Grade Finalization Room](#15-grade-finalization-room)
16. [Document Automation System](#16-document-automation-system)
17. [User Management](#17-user-management)
18. [Budget Management](#18-budget-management)
19. [Team Hub](#19-team-hub)
20. [School Year Calendar](#20-school-year-calendar)
21. [Audit Logs](#21-audit-logs)
22. [Notifications](#22-notifications)
23. [Profile & Personalization](#23-profile--personalization)
24. [Complete Data Flow Reference](#24-complete-data-flow-reference)
25. [Technical Architecture](#25-technical-architecture)

---

## 1. System Overview

SchoolEco is a **SaaS School Management System** designed as a connected "train system" where each administrative module is a station in a student's academic lifecycle. The system is built on the principle that data flows in one direction — from Admissions, through Registrar, Treasury, Academic Admin, Dean, Teacher, and finally to the Student — with each station dependent on the previous.

### Core Philosophy

- **Single source of truth** — Each module owns its data. No duplication.
- **Sequential workflow** — A student cannot access the LMS until Treasury validates payment.
- **Role-based access** — Every user sees only what their role permits.
- **Non-breaking extensions** — New features are additive and never modify existing data flows.

### What SchoolEco Manages

| Domain | Scope |
|--------|-------|
| Admissions | Lead tracking, applicant intake, acceptance/rejection |
| Student Records | Personal data, academic history, enrollment status |
| Finance | Statement of Account, payments, cashier validation |
| Budget | Departmental budget allocation and tracking |
| Curriculum | Subjects, programs, course offerings, rooms |
| Faculty | Teacher accounts, subject assignments, schedules |
| LMS | Modules, assignments, quizzes, attendance, discussions |
| Grades | Grade entry, finalization pipeline, official records |
| Documents | Automated TOR, certificates, diploma generation |

---

## 2. The Train System Pipeline

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  ① ADMISSIONS │──▶│ ② REGISTRAR  │──▶│ ③ TREASURY   │──▶│④ ACADEMIC    │
│              │   │              │   │              │   │   ADMIN      │
│ Lead → Apply │   │ Enroll in    │   │ Generate SOA │   │ Publish      │
│ Review       │   │ Subjects     │   │ Validate     │   │ Offerings    │
│ Accept/Reject│   │ Manage       │   │ Payment      │   │ Configure    │
└──────────────┘   │ Records      │   └──────────────┘   └──────────────┘
                   └──────────────┘                              │
                                                                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  ⑦ STUDENT   │◀──│  ⑥ TEACHER  │◀──│   ⑤ DEAN    │◀──│  LMS ACCESS  │
│              │   │              │   │              │   │   UNLOCKED   │
│ View Courses │   │ Manage LMS   │   │ Assign       │   │ (After ③    │
│ Submit Work  │   │ Grade Book   │   │ Teachers     │   │  validates)  │
│ View Grades  │   │ Attendance   │   │ Oversee Dept │   └──────────────┘
└──────────────┘   └──────────────┘   └──────────────┘
```

### The Full Sequential Flow

1. **Admissions Officer** reviews an applicant and marks them **Accepted**
2. **Registrar** creates the official student record and **enrolls** the student in subjects
3. **Treasury** generates a Statement of Account and **validates payment**
4. **Academic Admin** publishes subject offerings and configures rooms
5. **Dean** reviews department and **assigns teachers** to published offerings
6. **Teacher** sets up their schedule, creates LMS content (modules, assignments, quizzes)
7. **Student** gains LMS access to enrolled subjects only after payment validation
8. **Teacher** grades submissions → **Grade Finalization Room** → **Registrar approves** → Official records updated

---

## 3. User Roles & Access

### Role Hierarchy

```
SUPER_ADMIN
    ├── ADMISSION_OFFICER
    ├── REGISTRAR
    ├── TREASURER
    ├── ACCOUNTING
    ├── ACADEMIC_ADMIN
    ├── DEAN (4 departments)
    ├── TEACHER
    └── STUDENT
```

### Role Permissions Matrix

| Feature | Super Admin | Admission | Registrar | Treasurer | Accounting | Academic | Dean | Teacher | Student |
|---------|:-----------:|:---------:|:---------:|:---------:|:----------:|:--------:|:----:|:-------:|:-------:|
| Accept/Reject Applicants | ✓ | ✓ | — | — | — | — | — | — | — |
| CRM Lead Management | ✓ | ✓ | — | — | — | — | — | — | — |
| Edit Student Records | ✓ | — | ✓ | — | — | — | — | — | — |
| Enroll Students | ✓ | — | ✓ | — | — | — | — | — | — |
| Generate/Validate SOA | ✓ | — | — | ✓ | — | — | — | — | — |
| Create Budget | ✓ | — | — | — | ✓ | — | — | — | — |
| View Dept Budget | ✓ | — | — | — | ✓ | — | ✓ (own) | — | — |
| Create Subjects/Offerings | ✓ | — | — | — | — | ✓ | — | — | — |
| Assign Teachers | ✓ | — | — | — | — | — | ✓ | — | — |
| Manage LMS Content | ✓ | — | — | — | — | — | — | ✓ (own) | — |
| Submit Grades | ✓ | — | — | — | — | — | — | ✓ | — |
| Approve Grades | ✓ | — | ✓ | — | — | — | — | — | — |
| View Own Grades | — | — | — | — | — | — | — | — | ✓ |
| Generate Documents | ✓ | — | ✓ | — | — | — | — | — | — |
| Manage Custom Roles | ✓ | — | — | — | — | — | — | — | — |
| View Audit Logs | ✓ | — | — | — | — | — | — | — | — |
| Team Hub | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Calendar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |

---

## 4. Demo Accounts

All demo passwords: **`password`**

| Role | Email | Portal |
|------|-------|--------|
| Super Admin | admin@school.edu | /staff/dashboard |
| Admission Officer | admissions@school.edu | /staff/admissions |
| Registrar | registrar@school.edu | /staff/registrar |
| Treasurer | treasury@school.edu | /staff/treasury |
| Accounting | accounting@school.edu | /staff/treasury/budget |
| Academic Admin | academic@school.edu | /staff/academic |
| Dean — Computing | dean.computing@school.edu | /staff/dean |
| Dean — Business | dean.business@school.edu | /staff/dean |
| Dean — Nursing | dean.nursing@school.edu | /staff/dean |
| Dean — Arts | dean.arts@school.edu | /staff/dean |
| Teacher (Prof. Santos) | prof.santos@school.edu | /teacher/dashboard |
| Student (Ethan Dela Cruz) | student@school.edu | /student/dashboard |

> **Public access:** The applicant form at `/apply` requires no login.

---

## 5. Public Modules

### 5.1 Landing Page (`/`)

The root URL shows the public landing page for unauthenticated visitors. It includes:
- Hero section with system overview
- Pipeline cards showing the school management workflow
- Features grid
- Call-to-action to apply or contact the school
- Navigation links to Login and Apply

Authenticated users are automatically redirected to their portal.

### 5.2 Applicant Form (`/apply`)

Any prospective student can submit an application without logging in. Fields:

**Personal Information**
- First Name, Last Name, Middle Name
- Date of Birth, Gender
- Nationality, Religion
- Email Address, Phone Number
- Home Address

**Academic Information**
- Application Type: Freshman / Transferee / Returnee
- Previous School
- Previous Program (for transferees)
- Academic Year applying for

**Supporting Documents**
- Upload: Form 138 / Transcript, Birth Certificate, ID Photo
- File types: PDF, JPG, PNG, DOC, DOCX
- Simulated upload with 600ms progress indicator

**Submission Flow:**
1. Student fills out and submits form
2. Application is saved to `sessionStorage` (survives page reload during login)
3. Admissions officer finds the application in their queue with status **PENDING**

---

## 6. Admissions Module

**Access:** ADMISSION_OFFICER, SUPER_ADMIN  
**URL:** `/staff/admissions`

### 6.1 Applicant List

Displays all applicants with real-time status filtering:
- **All** — full list
- **Pending** — awaiting review
- **Under Review** — actively being assessed
- **Accepted** — approved for enrollment
- **Rejected** — not admitted

Features:
- Search is not exposed on the list; filtering is by status tab
- Clicking a row opens the full applicant detail page
- New applicants submitted via `/apply` appear automatically (rehydrated from `sessionStorage`)

### 6.2 Applicant Detail Page

Shows full applicant record with tabs:

**Profile Tab**
- All personal information from the application form
- Status badge with history
- Decision buttons: Accept / Reject (only ADMISSION_OFFICER and SUPER_ADMIN can decide)

**Documents Tab**
- Each required document shown as a row
- Upload functionality with status indicators (idle → uploading → success/error)
- Accepted file types: PDF, JPG, PNG, DOC, DOCX

**Workflow**
1. Admission Officer reviews the application
2. Clicks **Accept** → applicant status becomes ACCEPTED; a student record is created in the Registrar module
3. Clicks **Reject** → applicant status becomes REJECTED; a rejection reason is recorded

### 6.3 Admissions CRM (`/staff/admissions/crm`)

A full Kanban-style lead pipeline for prospective students who have not yet applied.

**Pipeline Stages (left to right):**
1. **New Lead** — Initial contact
2. **Contacted** — First outreach made
3. **Interested** — Expressed intent to apply
4. **Applicant** — Has submitted a formal application
5. **For Interview** — Invited for entrance interview
6. **Accepted** — Admitted to the school
7. **Enrolled** — Now an official student
8. **Lost** — No longer pursuing enrollment

**CRM Features:**
- Drag-and-drop cards between stages
- Slide-over detail panel with 3 tabs:
  - **Profile** — lead information
  - **Timeline** — activity log (auto-logged on stage change)
  - **Follow-ups** — scheduled calls, emails, interviews
- Log Activity button creates timeline entries
- Follow-up scheduler with due dates
- Auto-import of accepted applicants from the main admissions system

---

## 7. Registrar Module

**Access:** REGISTRAR, SUPER_ADMIN  
**URL:** `/staff/registrar`

### 7.1 Student Records List

Displays all students in a table with:
- **Square avatar** showing student initials
- Student name and email
- Student ID (monospaced)
- Program code and name
- Year level
- Enrollment badge (ENROLLED, PRE_ENROLLED, etc.)
- Status badge (ACTIVE, INACTIVE, DROPPED, GRADUATED)
- "Manage →" link to the full record

**Filters:**
- Text search by name, ID, email, or program code
- Status filter pills: All / Active / Inactive / Graduated / Dropped
- Enrollment dropdown: All / Enrolled Only / Not Enrolled / Newly Added

**Quick Drawer:**  
Clicking any student row opens a slide-over drawer showing:
- Large square photo area with initials (110×130px navy block)
- Name, email, student ID, status
- Personal Information table (name, DOB, gender, phone, address)
- Academic Information (program, year level, status)
- Current Enrollment (subjects enrolled this semester)
- **Account Balance** section:
  - If no SOA: greyed note
  - If fully paid: green confirmation with total
  - If balance pending: **red clickable card** showing balance amount and "Partial" badge
  - Clicking opens the **Balance Breakdown Modal**

**Balance Breakdown Modal:**
- Three-column summary: Total / Paid / Balance
- Itemized fee table (Tuition, Miscellaneous, Laboratory, etc.)
- Payment history with method, receipt number, and date
- Red outstanding balance callout

### 7.2 Student Detail Page (`/staff/registrar/[studentId]`)

Four-tab record editor:

**Tab 1: Personal Information**
- All personal fields: Name, DOB, Place of Birth, Gender, Civil Status, Nationality, Religion, Blood Type
- Contact: Email (with verified toggle), Phone (with verified toggle)
- Address
- Student Status dropdown
- Edit mode toggle — non-editable fields are read-only for non-registrar roles

**Tab 2: Family Background**
- Addable family members: Name, Relation, Phone, Email, Occupation
- Add/remove rows only in edit mode

**Tab 3: Academic Records**
- Year Level dropdown (always visible, always editable by Registrar)
- Per-semester course table:
  - Subject code and name
  - Quiz Average, Assignment Average, Final Grade
  - Grade Badge (PASSED, FAILED, INCOMPLETE, etc.)

**Tab 4: Education History**
- Previous schools with title, dates, and document upload
- Each entry supports a PDF/image upload
- Add/remove entries in edit mode

### 7.3 Document Automation System (`/staff/registrar/documents`)

See [Section 16](#16-document-automation-system) for full documentation.

### 7.4 Grade Finalization Room (`/staff/grades`)

See [Section 15](#15-grade-finalization-room) for full documentation.

---

## 8. Treasury Module

**Access:** TREASURER, SUPER_ADMIN  
**URL:** `/staff/treasury`

### 8.1 Cashier (`/staff/treasury`)

The primary cashier interface for processing student payments.

**Features:**
- Search student by name or ID
- View current Statement of Account (SOA)
- Record payment: amount, method (Cash / GCash / Online / Bank), reference number
- Print/download receipt
- SOA status updates automatically: UNPAID → PARTIAL → PAID

### 8.2 Student Accounts (`/staff/treasury/accounts`)

Overview of all student financial accounts:
- SOA status per student
- Total balance outstanding
- Payment history

### 8.3 Transaction Logs (`/staff/treasury/logs`)

Append-only log of all financial transactions:
- Payment date, amount, method
- Receipt/reference numbers
- Validated by (staff name)
- SOA linked

### 8.4 Statement of Account (SOA) Generation

When a student is enrolled, the Registrar triggers SOA generation:
1. Treasury creates SOA items based on the program's fee schedule
2. Items include: Tuition Fee, Miscellaneous Fee, Laboratory Fee, Registration Fee, ID Fee, NSTP Fee
3. SOA status begins as **UNPAID**
4. As payments are recorded and validated, status moves to **PARTIAL** then **PAID**
5. **PAID** status triggers automatic LMS access for the student

**SOA Statuses:**
| Status | Meaning |
|--------|---------|
| UNPAID | No payment recorded |
| PARTIAL | Some payment made, balance remains |
| PAID | Fully settled |
| OVERPAID | Payment exceeds total (refund may be needed) |

---

## 9. Accounting / Budget Module

**Access:** ACCOUNTING, SUPER_ADMIN  
**URL:** `/staff/treasury/budget`

See [Section 18](#18-budget-management) for full documentation.

---

## 10. Academic Admin Module

**Access:** ACADEMIC_ADMIN, SUPER_ADMIN  
**URL:** `/staff/academic`

### 10.1 Subject Master List (`/staff/academic`)

Manages the school's subject catalog.

**Fields per subject:**
- Subject Code (e.g., CS101)
- Subject Name
- Lecture Units
- Lab Units
- Total Hours (auto-calculated: (Lecture + Lab) × 18)
- Type (Core, Elective, GE, etc.)
- Description
- Eligibility Conditions (optional, collapsible):
  - Prerequisite subjects
  - Minimum units completed
  - Year level requirement
  - Minimum grade from previous subject
  - Program restriction

### 10.2 Subject Offerings (`/staff/academic/offerings`)

Manages which subjects are offered each semester.

**Fields per offering:**
- Subject (from master list)
- Section code (e.g., BSCS-1A)
- Semester
- Capacity
- Status: DRAFT → PUBLISHED → ARCHIVED

**Workflow:**
1. Academic Admin creates an offering for the active semester
2. Offering starts as DRAFT — no teacher assigned, no schedule
3. Dean assigns a teacher → offering moves toward PUBLISHED
4. Teacher sets schedule → offering is fully PUBLISHED
5. Students can be enrolled in PUBLISHED offerings only

**Note:** Start Time / End Time are NOT set in the offering. Schedule is set by the teacher after the Dean assigns them.

### 10.3 Departments (`/staff/academic/departments`)

Manages academic departments and their programs:
- Department name and code
- College affiliation
- Programs list (e.g., BSCS, BSIT under Computing)

### 10.4 Rooms (`/staff/academic/rooms`)

Manages physical spaces:
- Room name and capacity
- Room type (Lecture, Laboratory, etc.)
- Availability windows (set by Academic Admin; teachers schedule within these windows)

### 10.5 School Year Calendar (`/staff/calendar`)

See [Section 20](#20-school-year-calendar) for full documentation.

---

## 11. Dean Module

**Access:** DEAN (scoped to their department), SUPER_ADMIN  
**URL:** `/staff/dean`

Each Dean account has a `deanDepartment` field (e.g., "College of Computing") that scopes all data they can see.

### 11.1 Dean Dashboard

Animated statistics dashboard showing:
- Enrollment count for the department
- Active students by year level
- Recharts bar chart of enrollment trends with school year filter
- Year-level accordion breakdown

### 11.2 Programs (`/staff/dean/programs`)

Read-only view of the department's programs:
- Program code and name
- Number of enrolled students per program

### 11.3 Student List (`/staff/dean/students`)

Read-only list of all students in the department:
- Filter by year level and enrollment status
- `?year=N` URL parameter pre-filters to a specific year
- Cannot edit student records (Registrar only)

### 11.4 Teacher Assignment (`/staff/dean/assignments`)

**This is the most critical Dean function.**

Two tabs:
- **Needs Teacher** — Published offerings with no teacher assigned
- **Assigned** — Offerings with confirmed teacher assignments

**Assignment workflow:**
1. Dean sees a published offering in "Needs Teacher"
2. Selects a faculty member from the department
3. Clicks Assign → `TeacherAssignment` record created
4. Offering now appears in teacher's "My Courses" page
5. Teacher can now set their schedule for this offering

### 11.5 Department Budget (`/staff/dean/budget`)

**Read-only.** Shows:
- Summary cards: Total Allocated / Total Used / Remaining
- Per-budget health card with progress bar
- Itemized expense list per budget
- Deans cannot create or edit budgets

---

## 12. Teacher / Faculty Module

**Access:** TEACHER  
**URL:** `/teacher/dashboard`

### 12.1 Teacher Dashboard

Overview showing:
- Assigned courses count
- Pending submissions count
- Pending grading count
- Quick links to active courses

### 12.2 My Courses (`/teacher/subjects`)

Card grid of all assigned and published offerings:
- Subject name and code
- Section and semester
- Enrollment count
- Schedule days/times
- Quick links to sub-pages

### 12.3 Course Detail Page (`/teacher/subjects/[offeringId]`)

Nine navigation cards leading to all LMS management areas:

| Card | Purpose |
|------|---------|
| Learning Materials | Upload modules, PDFs, videos, links |
| Assignments | Create, publish, grade assignments |
| Quizzes & Exams | Create, schedule, auto-grade quizzes |
| Grade Book | Compute and submit final grades |
| Attendance | Record and track class attendance |
| Announcements | Post course-wide announcements |
| Discussions | Monitor and respond to discussions |
| Grading Criteria | Set grade weights and passing threshold |
| Student List | View enrolled students |

### 12.4 Schedule Management (`/teacher/schedule`)

**Access gate:** Only shows offerings that are PUBLISHED and assigned to this teacher.

- View available time slots
- Add schedule entries for assigned offerings
- Room selection (validated against `MOCK_ROOM_AVAILABILITY`)
- Conflict detection: same room, overlapping time → error

### 12.5 Grade Finalization Flow

1. Teacher records grades in the Grade Book
2. Clicks "Finalize Grades" → creates `GradeSubmission` → offering is locked
3. Registrar reviews in the Grade Finalization Room
4. On approval: grades become official records, students can see them
5. On rejection: lock removed, teacher corrects and resubmits

---

## 13. LMS — Learning Management System

The LMS is not a separate application. It is an **academic extension** of SchoolEco, consuming and synchronizing data from existing modules. It does not create its own student, faculty, or subject records.

### 13.1 LMS Access Control

A student gains LMS access to a subject only if **all three conditions are true**:
1. The student is **officially enrolled** in the offering
2. The enrollment status is **ENROLLED** (Treasury has validated payment)
3. The subject offering is **PUBLISHED**

If payment is pending (`PRE_ENROLLED` status), the student sees a **locked screen** explaining that access is pending payment validation.

### 13.2 Auto-Synchronization

| Source Module | Data Synchronized to LMS |
|---------------|--------------------------|
| Registrar + Enrollment | Student name, ID, enrolled subjects |
| Academic Admin | Subject code, name, units, section |
| Dean Module | Faculty assignment to each offering |
| Treasury | Payment status → LMS access unlock |

**No manual account creation.** LMS users are the same users from the existing authentication system.

### 13.3 Student LMS Experience

**Subject List (`/student/subjects`)**
- Shows all enrolled subjects as cards
- Each card shows subject name, code, schedule, and enrollment status badge
- Links to individual course pages

**Course Page (`/student/subjects/[offeringId]`)**
- **Access Gate:** If not ENROLLED → full-screen lock explaining payment pending
- **Pinned Announcement Banner** — shows the instructor's most recent pinned announcement
- **Upcoming Deadlines Row** — assignments and quizzes due within the semester
- **7-Card Navigation Grid:**
  - Announcements (with count)
  - Learning Materials (with file count)
  - Assignments (with submission status)
  - Quizzes & Exams (with attempt count)
  - Discussions (with reply count)
  - My Attendance (shows attendance percentage, color-coded)
  - Grade Summary (shows current final grade)
- **Grade Summary Card** — quiz avg, assignment avg, midterm, final grade
- **Attendance Summary** — Present / Late / Absent / Excused counts with progress bar and warning if below 75%

**Announcements (`/student/subjects/[offeringId]/announcements`)**
- Read-only list sorted pinned-first, then by date
- Pinned announcements show a pin icon
- Teacher name and date shown per announcement

**Discussions (`/student/subjects/[offeringId]/discussions`)**
- Accordion-style thread list
- Click to expand and see all replies
- Students can post replies (inline input, Enter to submit)
- Teacher replies are marked with an "Instructor" badge
- Pinned posts appear first

**Learning Materials (`/student/subjects/[offeringId]/materials`)**
- Organized by modules
- Supports: PDF, Video, Link, File
- Module title and description shown
- Published modules only (draft modules hidden)

**Assignments (`/student/subjects/[offeringId]/assignments`)**
- List of published assignments with due dates
- Submit via text input or file upload
- Submission status: Not Submitted / Submitted / Graded
- Grade and feedback shown after grading

**Quizzes (`/student/subjects/[offeringId]/quizzes`)**
- Shows available quizzes with time window
- Attempt history and score
- Supports MCQ, True/False, Essay questions

### 13.4 Teacher LMS Management

**Learning Materials (`/teacher/subjects/[offeringId]/materials`)**
- Create and publish modules
- Add materials to each module (PDF, Video, Link, File)
- Toggle module publish/draft status
- Materials only visible to students when module is published

**Assignments**
- Create assignments with title, description, due date, total points
- Publish/unpublish control
- View all student submissions
- Grade with numeric score and written feedback

**Quizzes & Exams**
- Create quizzes with time limit and date window
- Add questions: MCQ (up to 4 options), True/False, Essay
- Set points per question
- View attempt results per student

**Grade Book (`/teacher/subjects/[offeringId]/grades`)**
- Table of all enrolled students
- Enter: Quiz Average, Assignment Average, Midterm Grade, Final Grade
- Grade formula displayed (based on Grading Criteria)
- "Finalize Grades" button → submits to Grade Finalization Room
- After finalization: offering is LOCKED (editing disabled unless rejected)

**Grading Criteria (`/teacher/subjects/[offeringId]/criteria`)**
- Range sliders + number inputs for grade weights
- Components: Quiz, Assignment, Midterm Exam, Final Exam
- Weights must sum to 100%
- Passing grade threshold setting (default: 75)
- Live formula preview
- Saved to `MOCK_GRADE_CRITERIA`

**Attendance (`/teacher/subjects/[offeringId]/attendance`)**

*Record Tab:*
- Date selector (defaults to today, max = today)
- Student list with per-student status buttons: Present / Late / Absent / Excused
- Running totals shown (P: X, L: X, A: X)
- "Save Attendance" button confirms to database

*History Tab:*
- Dot-matrix table: each column = a date, each row = a student
- Color dots: Green = Present, Amber = Late, Red = Absent, Blue = Excused, Grey = No record
- Attendance rate % per student (color-coded)

**Announcements (`/teacher/subjects/[offeringId]/announcements`)**
- Create announcement with title, content, optional pin
- Pinned announcements appear first and are highlighted in red
- Delete any announcement
- Students see all announcements in real-time

**Discussions (`/teacher/subjects/[offeringId]/discussions`)**
- View all student-created and teacher-created posts
- Pin/unpin posts for prominence
- Reply to any post with "Instructor" badge
- Monitor and moderate all discussion activity

### 13.5 LMS Grade Flow (Critical Path)

```
Teacher Grade Book → Finalize Grades
         ↓
Grade Submission Created (status: PENDING)
Offering LOCKED — teacher cannot edit grades
         ↓
Grade Finalization Room (Registrar reviews)
         ↓
    ┌────┴────┐
  APPROVE   REJECT
    ↓          ↓
Grades pushed  Lock removed
to official    Teacher corrects
records        and resubmits
    ↓
Student can see grades in /student/grades
```

**Grades inside the LMS are NOT automatically official.** They only become part of the student's permanent record after the Registrar approves them in the Grade Finalization Room.

---

## 14. Student Portal

**Access:** STUDENT  
**URL:** `/student/dashboard`

### 14.1 Dashboard

Overview of the student's current semester:
- Enrollment status
- Subjects enrolled this semester
- SOA balance and payment status
- Recent grades
- Notifications

### 14.2 Enrollment (`/student/enrollment`)

Read-only view of enrolled subjects:
- Subject name, code, units
- Section and schedule
- Faculty name
- Enrollment status badge per subject

### 14.3 My Subjects (`/student/subjects`)

Card-style list of all enrolled subjects linking to individual LMS course pages. Each card shows:
- Subject name and code
- Schedule (day/time)
- Faculty name
- Enrollment status badge

### 14.4 My Grades (`/student/grades`)

**Only shows grades from APPROVED submissions** — pending or rejected submissions are never displayed.

Table columns:
- Subject name and code
- Units
- Final Grade (numeric)
- Rating (letter grade)
- Status badge (PASSED / FAILED)
- Approval date

Empty state shown if no grades have been officially approved yet.

### 14.5 Statement of Account (`/student/soa`)

Detailed financial view:
- SOA status (UNPAID / PARTIAL / PAID / OVERPAID)
- Itemized fee breakdown
- Payment history with receipt numbers
- Outstanding balance

### 14.6 Notifications (`/student/notifications`)

System-generated notifications for:
- New assignments posted
- Grades released
- Upcoming deadlines
- LMS announcements
- Payment confirmations

### 14.7 My Profile (`/student/profile`)

Student can view (but not edit) their profile information. Photo can be changed using the crop editor.

---

## 15. Grade Finalization Room

**Access:** REGISTRAR, ACADEMIC_ADMIN, SUPER_ADMIN  
**URL:** `/staff/grades`

This is the official grade approval workflow.

### 15.1 Three Tabs

**Pending Tab**
- Lists all grade submissions awaiting review
- Shows: offering name, section, faculty, submission date, number of students
- Click "Review" to open the detailed grade table

**Approved Tab**
- Historical log of approved grade batches
- Shows approval date and approving staff

**Rejected Tab**
- Grade batches returned to the teacher
- Shows rejection reason and return date

### 15.2 Review Modal

When reviewing a grade submission:
- Full table of all students with their numeric grades
- Grade status per student (PASSED / FAILED)
- Two actions:
  - **Approve** → grades are pushed to `MOCK_GRADES` (official records), audit log created, student notification sent
  - **Reject** → reason is required, teacher receives notification, offering is unlocked for correction

### 15.3 Audit Trail

Every grade finalization action (approve or reject) creates an entry in the audit log with:
- Action type
- Actor (who approved/rejected)
- Timestamp
- Subject offering and semester

---

## 16. Document Automation System

**Access:** REGISTRAR, SUPER_ADMIN  
**URL:** `/staff/registrar/documents`

A full document generation engine supporting three template modes.

### 16.1 Three Template Types

**1. SmartDocs Builder (DOCX from scratch)**
- Rich text editor canvas
- Right-side Fields Panel with:
  - Personal fields (Full Name, Student ID, DOB, etc.)
  - Academic fields (Program, Year Level, GWA, Units)
  - Auto-fill Tables (subjects loop)
  - Show/Hide Conditions (based on student data)
- Drag-and-drop field insertion
- Smart Table Builder: choose loop type (all subjects / current / completed) and columns
- Conditional blocks: `{{#if is_graduated}}...{{/if}}`

**2. DOCX Field Mapping (Upload existing DOCX)**
- Upload any Word document
- Click text areas to map them to student fields
- Click table rows to configure as data loops
- Preview with actual student data

**3. PDF Overlay Editor (Upload PDF form)**
- Upload a PDF template (e.g., official form, certificate)
- Visual canvas with the PDF rendered as a background image (via pdf-lib/pdfjs)
- Tool modes: Select, Text, Number, Date, Image, Table
- Click to place field overlays anywhere on the PDF
- Drag to move, corner-handle to resize
- Right panel: map overlay to student field, set font size, bold, color, alignment
- Preview generated PDF with real student data

### 16.2 Template Engine Pipeline

When generating a document, the system processes templates in this order:

1. **Loop expansion** — `<tr data-loop-type="subjects">` rows cloned per subject
2. **Special tokens** — condition and placeholder spans converted to raw `{{tokens}}`
3. **Conditional blocks** — `{{#if cond}}...{{else}}...{{/if}}` evaluated per student
4. **Filtered tokens** — `{{key | filter}}` processed (uppercase, lowercase, date format, etc.)
5. **Simple substitution** — remaining `{{key}}` replaced with student data

**Supported Conditions:**
`is_graduated`, `is_active`, `is_dropped`, `is_honor_student`, `is_male`, `is_female`, `has_subjects`, `has_gwa`

**Supported Filters:**
`uppercase`, `lowercase`, `title`, `or` (fallback), `number` (decimals), `format` (date)

### 16.3 Generate Tab (3-Step Wizard)

**Step 1:** Select a template  
**Step 2:** Select student(s) — searchable table, selected student panel shown above  
**Step 3:** Preview the generated document  
**Step 4:** Download or batch generate  
**Step 5:** Document is logged in History tab

### 16.4 Document History

All generated documents are logged with:
- Template name
- Student name
- Generated by (staff)
- Date and time
- Download link

---

## 17. User Management

**Access:** SUPER_ADMIN only  
**URL:** `/staff/users`

### 17.1 Users Tab

Read-only table of all system accounts:
- Name with square avatar
- Email address
- Role badge (color-coded per role)
- Status (Active / Inactive)
- Account type: "System / Locked" for built-in accounts

### 17.2 Role Management Tab

**System Roles (Read-Only)**

Eight locked roles displayed as cards with a padlock icon:
- Super Admin, Admission Officer, Registrar, Treasurer, Accounting, Academic Admin, Dean, Teacher, Student
- Cannot be edited, deleted, or modified

**Custom Roles (Editable)**

Super Admin can create unlimited custom roles:

*Create Role Modal:*
- Role Name (required)
- Description (optional)
- Permission Matrix: 7 modules × 4 permission levels

| Module | View | Create | Edit | Delete |
|--------|------|--------|------|--------|
| Admissions | ☐ | ☐ | ☐ | ☐ |
| Academic Admin | ☐ | ☐ | ☐ | ☐ |
| Registrar | ☐ | ☐ | ☐ | ☐ |
| Treasury | ☐ | ☐ | ☐ | ☐ |
| LMS | ☐ | ☐ | ☐ | ☐ |
| Reports | ☐ | ☐ | ☐ | ☐ |
| User Management | ☐ | ☐ | ☐ | ☐ |

- Enabling Create / Edit / Delete automatically enables View
- Clicking the module name toggles all four permissions at once
- Custom roles can be edited or deleted anytime
- Deleted roles do not affect existing users (display fallback)

---

## 18. Budget Management

**Access:** ACCOUNTING (create/edit), SUPER_ADMIN (full), DEAN (view-own, read-only)  
**Accounting URL:** `/staff/treasury/budget`  
**Dean URL:** `/staff/dean/budget`

### 18.1 Key Principle

The Budget Management module is **completely isolated** from Treasury. It does not touch SOA, payments, or student billing. It tracks departmental operational budgets only.

### 18.2 Departments

Budgets are allocated to the four academic colleges:
- College of Computing
- College of Business
- College of Nursing
- Arts & Sciences

### 18.3 Overview Tab

- **4 Summary Cards:** Total Allocated / Total Used / Total Remaining / Budget Alerts
- **Budget Health Cards** (one per filtered department):
  - Budget name and department
  - Health indicator icon (✓ On Track / ⚠ Near Limit / ✗ Depleted)
  - Three amount boxes: Total / Used / Remaining
  - Progress bar (green < 80%, amber 80–99%, red ≥ 100%)
  - Period type and date range
  - Edit and delete buttons

### 18.4 Budgets Tab

Table view of all budgets with:
- Budget name
- Department
- Total, Used, Remaining amounts
- Period type badge (Monthly / Quarterly / Yearly)
- Inline progress bar with percentage
- Edit / Delete actions

### 18.5 Create Budget Form

| Field | Required | Notes |
|-------|----------|-------|
| Budget Name | Yes | Free text |
| Department | Yes | Dropdown: 4 colleges |
| Budget Amount (₱) | Yes | Must be > 0 |
| Period Type | Yes | Monthly / Quarterly / Yearly |
| Start Date | Yes | |
| End Date | Yes | Must be after Start Date |

### 18.6 Expenses Tab

Chronological log of all recorded expenses:
- Description
- Department
- Linked budget name
- Amount (shown as negative / deducted)
- Date
- Recorded by (staff name)

### 18.7 Record Expense Form

| Field | Required | Notes |
|-------|----------|-------|
| Budget | Yes | Dropdown showing remaining balance live |
| Description | Yes | Free text |
| Amount (₱) | Yes | Cannot exceed remaining balance |
| Date | Yes | |

### 18.8 Department Budget View (Dean)

Deans see a read-only version for their own college:
- Summary cards
- Per-budget card with itemized expenses
- Progress bars with health indicator
- Clear warning messages when near limit or depleted
- No create, edit, or delete buttons

### 18.9 Budget Health Rules

| Usage | Status | Color |
|-------|--------|-------|
| 0–79% | On Track | Green |
| 80–99% | Near Limit | Amber + warning message |
| ≥ 100% | Depleted | Red + critical message |

---

## 19. Team Hub

**Access:** All staff and teacher roles  
**URL:** `/staff/team`, `/teacher/team`

### 19.1 Card Grid View

All school staff displayed as square cards in a responsive grid (2 → 5 columns):
- **Square photo** (80×80px, rounded-xl): Shows uploaded photo or initials
- Role badge (color-coded)
- Department, email, phone

### 19.2 Filters

- **Role Tabs:** All / Admin / Deans / Faculty (pill buttons, no stat counts)
- **Department Dropdown:** Filter by specific department

### 19.3 Profile Card Modal

Clicking any staff card opens a modal with:
- Profile photo (clickable to trigger photo editor)
- Full Name, Role badge
- "Add Photo" / "Edit Photo" button
- Details table: Full Name, Job Title, Department, Email, Phone, Birthday

### 19.4 Photo Upload & Crop Editor

A canvas-based photo editor appears when editing a profile photo:

**Features:**
- **280×280 circular crop canvas** — dark overlay shows exactly what gets saved
- **Drag to pan** — mouse or touch to reposition the image within the crop circle
- **Zoom controls:**
  - Scroll wheel (on desktop)
  - Pinch gesture (on mobile)
  - Range slider (explicit control)
  - +/− buttons
- **Minimum zoom** — image always covers the full crop circle (no gaps)
- **Upload Photo** button — opens file picker (accepts all image formats)
- **Save Photo** — exports a 200×200 JPEG, saves to member record
- Photo appears immediately on the card grid after saving

---

## 20. School Year Calendar

**Access:** All staff and teacher roles (view); ACADEMIC_ADMIN + SUPER_ADMIN (create/edit/delete)  
**URL:** `/staff/calendar`, `/teacher/calendar`

### 20.1 Calendar Views

- **Monthly Grid** — standard calendar grid showing all events
- **Upcoming Events Sidebar** — chronological list of next 5 events
- **Full Event Table** — all events in a sortable table

### 20.2 Event Types and Colors

| Type | Description | Color |
|------|-------------|-------|
| HOLIDAY | School-wide non-working days | Red |
| ACADEMIC | Semester dates, academic milestones | Blue |
| ENROLLMENT | Enrollment periods | Green |
| EXAM | Midterm and final exam periods | Amber |
| ACTIVITY | School events, activities, sports fests | Purple |
| ADMIN | Administrative deadlines | Slate |

### 20.3 Legend / Filter Toggles

Clicking a legend badge toggles that event type on/off in both the grid and upcoming sidebar.

### 20.4 Event Management (Academic Admin / Super Admin only)

- **Add Event** button → modal with: title, date range, type, description
- **Edit** (pencil icon on event) → same modal pre-filled
- **Delete** (trash icon) → confirmation dialog

---

## 21. Audit Logs

**Access:** SUPER_ADMIN only  
**URL:** `/staff/audit`

Append-only log of all significant system actions:
- Grade submissions, approvals, rejections
- Student status changes
- Document generation
- Payment validations

Each entry shows:
- Timestamp
- Actor (who performed the action)
- Action type
- Affected entity (student name, subject, etc.)
- Details

Logs are read-only and cannot be deleted.

---

## 22. Notifications

### 22.1 System-Generated Notifications

| Trigger | Recipients |
|---------|-----------|
| Grade submission | Registrar |
| Grade approved | Teacher + Students |
| Grade rejected | Teacher |
| New assignment posted | Students (enrolled in that offering) |
| Payment validated | Student |
| New announcement | Students (enrolled in that offering) |

### 22.2 Notification Bell (Header)

- Bell icon in the top header shows unread count badge
- Clicking opens a notification dropdown
- Notifications are marked read on view

---

## 23. Profile & Personalization

### 23.1 My Profile (`/staff/profile`, `/teacher/subjects`)

Editable staff profile:
- Profile photo (upload from device)
- Nickname / Display Name
- Phone number
- Job Title
- Birthday
- All saved to `localStorage` (persists across sessions)

### 23.2 Personalization (`/staff/personalization`)

- **Theme toggle:** Light / Dark mode
- **Accent color:** Choose from preset brand colors
- Saved to `localStorage`

### 23.3 Settings (`/staff/settings`)

- Password change form
- Notification preferences (toggle per notification type)

---

## 24. Complete Data Flow Reference

### Student Lifecycle

```
APPLICANT SUBMITTED
    ↓
status: PENDING
    ↓ (Admission Officer reviews)
status: ACCEPTED
    ↓ (Registrar creates student record)
Student record: ACTIVE
    ↓ (Registrar enrolls in subjects)
Enrollment: PRE_ENROLLED
    ↓ (Treasury generates SOA)
SOA: UNPAID
    ↓ (Student pays)
SOA: PARTIAL or PAID
    ↓ (Treasury validates)
Enrollment: ENROLLED (if PAID)
    ↓ (LMS access unlocked)
Student can access LMS courses
    ↓ (Teacher grades, finalizes)
GradeSubmission: PENDING
    ↓ (Registrar approves)
Grades: OFFICIAL RECORD
```

### Grade Flow

```
Teacher enters grades in Grade Book
    ↓
Teacher clicks "Finalize Grades"
    ↓
GradeSubmission created (status: PENDING)
Offering LOCKED (teacher cannot edit)
    ↓
Registrar sees in Grade Finalization Room
    ↓
       APPROVE                   REJECT
         ↓                          ↓
Grades pushed to               Rejection reason set
MOCK_GRADES (official)        Lock removed
Audit log created             Teacher notified
Students notified             Teacher corrects and resubmits
Students can see grades
```

### Module Dependency Map

```
MOCK_SUBJECTS ─────────────────────────────────────┐
     │                                              │
MOCK_OFFERINGS (references subjects)                │
     │                                              ▼
     ├─▶ MOCK_ENROLLMENTS (student ↔ offering)   MOCK_MODULES
     │         │                                 MOCK_ASSIGNMENTS
     │         ▼                                 MOCK_QUIZZES
     │   MOCK_SOA (financial per enrollment)     MOCK_LMS_ANNOUNCEMENTS
     │         │                                 MOCK_LMS_ATTENDANCE
     │         ▼                                 MOCK_LMS_DISCUSSIONS
     │   Enrollment.status: ENROLLED
     │   (only when SOA is PAID)
     │
     ├─▶ MOCK_GRADE_SUBMISSIONS
     │         │
     │         ▼
     │   Grade Finalization Room
     │         │
     │         ▼
     └─▶ MOCK_GRADES (official, approved only)
```

---

## 25. Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database ORM | Prisma (SQLite in dev) |
| Authentication | NextAuth.js (JWT strategy) |
| Charts | Recharts |
| PDF Generation | pdf-lib |
| PDF Rendering | pdfjs-dist |
| Form Handling | react-hook-form + Zod |
| Icons | Lucide React |

### Project Structure

```
Application/
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Login page
│   │   ├── (public)/apply/       # Applicant form
│   │   ├── staff/                # All staff portals
│   │   │   ├── admissions/       # + /crm
│   │   │   ├── registrar/        # + /[studentId] + /documents + /grades
│   │   │   ├── treasury/         # + /accounts + /logs + /budget
│   │   │   ├── academic/         # + /departments + /rooms + /offerings
│   │   │   ├── dean/             # + /programs + /students + /assignments + /budget
│   │   │   ├── grades/           # Grade Finalization Room
│   │   │   ├── users/            # User Management
│   │   │   ├── team/             # Team Hub
│   │   │   ├── calendar/         # School Year Calendar
│   │   │   ├── audit/            # Audit Logs
│   │   │   ├── profile/          # Staff Profile
│   │   │   ├── personalization/  # Theme/Accent
│   │   │   ├── settings/         # Password/Notifications
│   │   │   └── help/             # Help Module
│   │   ├── teacher/
│   │   │   ├── dashboard/
│   │   │   ├── subjects/[offeringId]/
│   │   │   │   ├── materials/
│   │   │   │   ├── assignments/
│   │   │   │   ├── quizzes/
│   │   │   │   ├── grades/
│   │   │   │   ├── attendance/
│   │   │   │   ├── announcements/
│   │   │   │   ├── discussions/
│   │   │   │   ├── criteria/
│   │   │   │   └── students/
│   │   │   ├── schedule/
│   │   │   ├── team/
│   │   │   └── calendar/
│   │   └── student/
│   │       ├── dashboard/
│   │       ├── subjects/[offeringId]/
│   │       │   ├── materials/
│   │       │   ├── assignments/
│   │       │   ├── quizzes/
│   │       │   ├── announcements/
│   │       │   └── discussions/
│   │       ├── grades/
│   │       ├── soa/
│   │       ├── enrollment/
│   │       ├── notifications/
│   │       └── profile/
│   ├── components/
│   │   ├── layout/               # Sidebars, Header
│   │   ├── ui/                   # Badge, Button, Card, Table, Modal, Input, Avatar
│   │   ├── landing/              # Public landing page
│   │   └── shared/               # ProcessFlow, etc.
│   ├── lib/
│   │   ├── auth.ts               # NextAuth options + DEMO_USERS
│   │   ├── mock-data.ts          # All in-memory data + LMS seed
│   │   ├── utils.ts              # Helpers: cn(), fullName(), ROLE_LABELS, ROLE_PORTALS
│   │   ├── db.ts                 # Prisma client singleton
│   │   └── help-registry.ts      # Help module feature registry
│   └── types/index.ts            # All TypeScript interfaces
├── prisma/
│   ├── schema.prisma             # Full relational schema (20+ models)
│   └── seed.ts                   # Database seed script
└── CLAUDE.md                     # Developer guide
```

### Authentication & Session

- **Auth provider:** NextAuth.js with Credentials provider
- **Session strategy:** JWT
- **Demo accounts:** Plain-text password comparison (not bcrypt) for fast load
- **JWT payload:** `id`, `role`, `schoolId`, `schoolName`, `schoolColor`, `deanDepartment` (Dean only), `facultyId` (Teacher only), `studentId` (Student only)
- **Session validation:** Each layout (`staff/layout.tsx`, `teacher/layout.tsx`, `student/layout.tsx`) calls `getServerSession` and redirects on mismatch

### Design System

**Primary Color:** Navy Blue (`#1a4a8a` = `brand-500`)
**Font:** Plus Jakarta Sans (primary), Playfair Display (formal/display), JetBrains Mono (code/IDs)

**Color Tokens:**
| Token | Hex | Usage |
|-------|-----|-------|
| brand-500 | #1a4a8a | Primary buttons, active states |
| brand-600 | #163d73 | Hover |
| brand-900 | #09182e | Super Admin badge, dark headers |
| gold-500 | #c9a224 | Premium accents |
| sidebar-bg | #0c1e3d | All sidebar backgrounds |

**Component Conventions:**
- `<SectionTitle>` — page heading with 3px navy accent bar
- `<Card padding="none">` — wrap tables with zero inner padding
- `<Badge>` — always use typed variants (RoleBadge, EnrollmentBadge, etc.)
- `<Modal>` — consistent header + footer structure
- Sign-out confirmation — all 3 sidebars show a confirmation dialog (never one-click)

### Data Persistence Model

| Scope | Mechanism | Resets On |
|-------|-----------|-----------|
| Applicant form → Admissions | `sessionStorage` | Browser close |
| LMS seed data (offerings, modules, etc.) | Module-level IIFE in mock-data.ts | Hard reload |
| Budget data | Module-level arrays | Hard reload |
| Document templates and history | Module-level arrays in documents/page.tsx | Hard reload |
| Custom roles | `MOCK_CUSTOM_ROLES` array | Hard reload |
| Team Hub photos | `member.avatar` mutation | Hard reload |
| User Profile / Theme | `localStorage` | Never |
| All other mock data | Module-level arrays | Hard reload |

### z-Index Hierarchy

| Element | z-index |
|---------|---------|
| Header (sticky) | 35 |
| CRM detail slide-over | 36 |
| Sidebars | 40 |
| Modal backdrop + dialog | 50 |
| Sign-out confirmation | 200 |
| Balance breakdown (stacked) | 300 |

---

## Appendix: Full Test Walkthrough

To test the complete end-to-end workflow from a fresh state:

### Step 1: Submit Application (Anonymous)
1. Go to `/apply` (no login needed)
2. Fill out applicant form and submit
3. Application saved with status PENDING

### Step 2: Admissions Review
1. Login as `admissions@school.edu`
2. Go to Applicants list — find the new application
3. Click to review full profile
4. Click **Accept** → student record created

### Step 3: Registrar Enrollment
1. Login as `registrar@school.edu`
2. Find the new student in Student Records
3. Open their record → enroll in subjects (CS101, CS201)
4. Enrollment status: PRE_ENROLLED

### Step 4: Treasury Payment
1. Login as `treasury@school.edu`
2. Find student in Cashier
3. Generate SOA → items appear (Tuition, Fees, etc.)
4. Record payment → validate → SOA status: PAID
5. Enrollment status automatically updates to ENROLLED

### Step 5: Academic Admin Setup
1. Login as `academic@school.edu`
2. Verify offerings are PUBLISHED
3. Configure rooms if needed

### Step 6: Dean Assigns Teacher
1. Login as `dean.computing@school.edu`
2. Go to Teacher Assignment
3. Assign Prof. Santos to the offerings

### Step 7: Teacher Prepares LMS
1. Login as `prof.santos@school.edu`
2. Go to My Courses → click the offering
3. Add module with materials
4. Create assignment and quiz
5. Post announcement

### Step 8: Student Accesses LMS
1. Login as `student@school.edu`
2. Go to My Subjects → click CS101
3. LMS is now active (payment validated)
4. View materials, submit assignment, take quiz

### Step 9: Teacher Grades and Finalizes
1. Login as `prof.santos@school.edu`
2. Go to Grade Book → enter grades
3. Click "Finalize Grades" → offering is locked

### Step 10: Registrar Approves Grades
1. Login as `registrar@school.edu`
2. Go to Grade Finalization Room → Pending tab
3. Review grade table → click Approve
4. Grades are now official

### Step 11: Student Sees Official Grades
1. Login as `student@school.edu`
2. Go to My Grades
3. Official approved grades are now visible

---

*Documentation generated for SchoolEco School Management System v1.0*  
*St. Dominic College · 2025–2026 Academic Year*
