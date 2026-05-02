import type { Role } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RegisteredFeature {
  id: string
  module: string
  feature: string
  route: string
  roles: Role[]
  addedAt: string       // ISO date — when this feature was added to the system
  lastModified: string  // ISO date — when this feature was last changed
}

export type MediaType = 'gif' | 'video'

export interface HelpEntry {
  id: string
  featureId: string
  title: string
  summary: string
  content: string
  steps?: string[]
  tips?: string[]
  roles: Role[]
  lastUpdated: string  // ISO date — when this documentation was last updated
  version: string
  status: 'PUBLISHED' | 'DRAFT'
  // ── Tutorial media (GIF or video) ──────────────────────────────────────────
  gifUrl?: string      // object URL or external URL — uploaded by Admin
  gifAlt?: string      // accessibility description of what the tutorial shows
  mediaType?: MediaType // 'gif' (default) | 'video' for mp4/webm
}

// ── Role shorthand constants ───────────────────────────────────────────────────

const ADM: Role[] = ['SUPER_ADMIN', 'ADMISSION_OFFICER']
const REG: Role[] = ['SUPER_ADMIN', 'REGISTRAR']
const TRS: Role[] = ['SUPER_ADMIN', 'TREASURER']
const ACA: Role[] = ['SUPER_ADMIN', 'ACADEMIC_ADMIN']
const DEN: Role[] = ['DEAN']
const ALL: Role[] = ['SUPER_ADMIN', 'ADMISSION_OFFICER', 'REGISTRAR', 'TREASURER', 'ACADEMIC_ADMIN', 'DEAN']

// ── Feature Registry — source of truth for every system feature ───────────────
// When you add or change a feature, update lastModified. If the matching
// HelpEntry.lastUpdated is older than lastModified, the admin panel flags it
// as OUTDATED automatically.

export const FEATURE_REGISTRY: RegisteredFeature[] = [
  // Dashboard
  { id: 'feat_dashboard', module: 'Dashboard', feature: 'Overview & Statistics',
    route: '/staff/dashboard', roles: ['SUPER_ADMIN','ADMISSION_OFFICER','REGISTRAR','TREASURER','ACADEMIC_ADMIN'],
    addedAt: '2025-08-01', lastModified: '2025-08-01' },

  // Admissions
  { id: 'feat_adm_list',   module: 'Admissions', feature: 'View Applicant List',
    route: '/staff/admissions', roles: ADM, addedAt: '2025-08-01', lastModified: '2026-04-01' },
  { id: 'feat_adm_add',    module: 'Admissions', feature: 'Add New Applicant',
    route: '/staff/admissions', roles: ADM, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_adm_view',   module: 'Admissions', feature: 'View Applicant Detail Drawer',
    route: '/staff/admissions', roles: ADM, addedAt: '2026-04-01', lastModified: '2026-04-01' },
  { id: 'feat_adm_decide', module: 'Admissions', feature: 'Accept or Reject Application',
    route: '/staff/admissions', roles: ADM, addedAt: '2025-08-01', lastModified: '2025-08-01' },

  // CRM
  { id: 'feat_crm_board',    module: 'CRM', feature: 'Pipeline Kanban Board',
    route: '/staff/admissions/crm', roles: ADM, addedAt: '2025-09-01', lastModified: '2025-11-01' },
  { id: 'feat_crm_lead',     module: 'CRM', feature: 'Add New Lead',
    route: '/staff/admissions/crm', roles: ADM, addedAt: '2025-09-01', lastModified: '2025-09-01' },
  { id: 'feat_crm_move',     module: 'CRM', feature: 'Move Lead Across Stages',
    route: '/staff/admissions/crm', roles: ADM, addedAt: '2025-09-01', lastModified: '2025-09-01' },
  { id: 'feat_crm_followup', module: 'CRM', feature: 'Schedule Follow-ups',
    route: '/staff/admissions/crm', roles: ADM, addedAt: '2025-09-01', lastModified: '2026-03-01' },

  // Student Records
  { id: 'feat_reg_list',   module: 'Student Records', feature: 'View Student List',
    route: '/staff/registrar', roles: REG, addedAt: '2025-08-01', lastModified: '2026-04-01' },
  { id: 'feat_reg_edit',   module: 'Student Records', feature: 'Edit Student Information',
    route: '/staff/registrar/[studentId]', roles: REG, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_reg_enroll', module: 'Student Records', feature: 'Enroll Student in Subjects',
    route: '/staff/registrar/[studentId]', roles: REG, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_reg_grades', module: 'Student Records', feature: 'View Student Grades',
    route: '/staff/registrar/[studentId]', roles: REG, addedAt: '2025-08-01', lastModified: '2025-08-01' },

  // Document Generator (NEW — 2026-05-01)
  { id: 'feat_doc_templates', module: 'Document Generator', feature: 'Manage Document Templates',
    route: '/staff/registrar/documents', roles: REG, addedAt: '2026-05-01', lastModified: '2026-05-01' },
  { id: 'feat_doc_generate',  module: 'Document Generator', feature: 'Generate a Document (3-Step Wizard)',
    route: '/staff/registrar/documents', roles: REG, addedAt: '2026-05-01', lastModified: '2026-05-01' },
  { id: 'feat_doc_custom',    module: 'Document Generator', feature: 'Create Custom Template with Placeholders',
    route: '/staff/registrar/documents', roles: REG, addedAt: '2026-05-01', lastModified: '2026-05-01' },
  { id: 'feat_doc_history',   module: 'Document Generator', feature: 'View Document Generation History',
    route: '/staff/registrar/documents', roles: REG, addedAt: '2026-05-01', lastModified: '2026-05-01' },

  // Treasury
  { id: 'feat_trs_soa',      module: 'Treasury', feature: 'Generate Statement of Account',
    route: '/staff/treasury', roles: TRS, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_trs_payment',  module: 'Treasury', feature: 'Add Payment to SOA',
    route: '/staff/treasury', roles: TRS, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_trs_accounts', module: 'Treasury', feature: 'Student Accounts Overview',
    route: '/staff/treasury/accounts', roles: TRS, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_trs_logs',     module: 'Treasury', feature: 'Transaction Logs',
    route: '/staff/treasury/logs', roles: TRS, addedAt: '2025-08-01', lastModified: '2025-08-01' },

  // Academic
  { id: 'feat_acad_depts',     module: 'Academic', feature: 'Manage Departments',
    route: '/staff/academic/departments', roles: ACA, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_acad_subjects',  module: 'Academic', feature: 'Manage Subjects',
    route: '/staff/academic', roles: ACA, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_acad_rooms',     module: 'Academic', feature: 'Manage Rooms & Availability',
    route: '/staff/academic/rooms', roles: ACA, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_acad_offerings', module: 'Academic', feature: 'Publish Subject Offerings',
    route: '/staff/academic/offerings', roles: ACA, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_acad_calendar',  module: 'Academic', feature: 'Manage School Calendar Events',
    route: '/staff/calendar', roles: ACA, addedAt: '2025-08-01', lastModified: '2026-02-01' },

  // Dean
  { id: 'feat_dean_dashboard', module: 'Dean Portal', feature: 'Department Dashboard',
    route: '/staff/dean', roles: DEN, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_dean_programs',  module: 'Dean Portal', feature: 'View Programs',
    route: '/staff/dean/programs', roles: DEN, addedAt: '2025-08-01', lastModified: '2025-08-01' },
  { id: 'feat_dean_students',  module: 'Dean Portal', feature: 'View Department Students',
    route: '/staff/dean/students', roles: DEN, addedAt: '2026-04-01', lastModified: '2026-04-01' },
  { id: 'feat_dean_assign',    module: 'Dean Portal', feature: 'Assign Teacher to Offering',
    route: '/staff/dean/assignments', roles: DEN, addedAt: '2025-08-01', lastModified: '2025-08-01' },

  // People
  { id: 'feat_team',     module: 'People', feature: 'Team Hub — Staff Directory',
    route: '/staff/team', roles: ALL, addedAt: '2025-08-01', lastModified: '2026-03-01' },
  { id: 'feat_calendar', module: 'People', feature: 'School Calendar (View)',
    route: '/staff/calendar', roles: ALL, addedAt: '2025-08-01', lastModified: '2026-02-01' },

  // Account
  { id: 'feat_profile',         module: 'Account', feature: 'Edit Your Profile',
    route: '/staff/profile', roles: ALL, addedAt: '2026-03-01', lastModified: '2026-03-01' },
  { id: 'feat_personalization', module: 'Account', feature: 'Personalization (Theme & Accent)',
    route: '/staff/personalization', roles: ALL, addedAt: '2026-03-01', lastModified: '2026-03-01' },
  { id: 'feat_settings',        module: 'Account', feature: 'Account Settings & Password',
    route: '/staff/settings', roles: ALL, addedAt: '2026-03-01', lastModified: '2026-03-01' },
  { id: 'feat_help',            module: 'Account', feature: 'Help & User Manual',
    route: '/staff/help', roles: ALL, addedAt: '2025-08-01', lastModified: '2026-05-01' },
]

// ── Help Entries — mutable so Admin can edit at runtime ───────────────────────

export const HELP_ENTRIES: HelpEntry[] = [
  // ── Dashboard ──
  {
    id: 'he_dashboard', featureId: 'feat_dashboard',
    title: 'Using the Dashboard',
    summary: 'View school-wide stats and navigate quickly to key modules.',
    content: 'The Dashboard is your starting point. It shows real-time summaries of applicants, enrollments, financial status, and academic stats. Each stat card is clickable and takes you directly to the related module with a pre-applied filter.',
    steps: [
      'Log in — the Dashboard is the default landing page.',
      'Click any stat card to jump to that module with a filter pre-applied.',
      'The Pipeline strip at the bottom shows the full academic lifecycle.',
    ],
    tips: ['Stat cards animate on load — wait a moment for accurate numbers.'],
    roles: ['SUPER_ADMIN','ADMISSION_OFFICER','REGISTRAR','TREASURER','ACADEMIC_ADMIN'],
    lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },

  // ── Admissions ──
  {
    id: 'he_adm_list', featureId: 'feat_adm_list',
    title: 'Viewing the Applicant List',
    summary: 'Browse and filter all submitted applications from one place.',
    content: 'The Applicants page lists every submitted application. Filter by status using the tabs (All / Pending / Under Review / Accepted / Rejected). Click any row to open the detail drawer without leaving the list.',
    steps: [
      'Go to Admissions → Applicants.',
      'Use the status tabs to filter applications.',
      'Click any row to open the Applicant Detail Drawer on the right.',
    ],
    tips: ['Applications submitted via /apply appear here after login (they persist via sessionStorage so they survive the redirect).'],
    roles: ADM, lastUpdated: '2026-04-01', version: '1.2', status: 'PUBLISHED',
  },
  {
    id: 'he_adm_add', featureId: 'feat_adm_add',
    title: 'Adding a New Applicant',
    summary: 'Manually create an application record for walk-in applicants.',
    content: 'Staff can add applicants directly — useful for walk-ins or data migration — without requiring the public /apply form.',
    steps: [
      'Go to Admissions → Applicants.',
      'Click "Add Applicant" in the top right.',
      'Complete the 5-step form: Personal → Family → Education → Academic → Documents.',
      'Click Save on the final step.',
    ],
    tips: ['You can upload documents (PDF, JPG, PNG, DOC) in the Documents step.'],
    roles: ADM, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_adm_view', featureId: 'feat_adm_view',
    title: 'Viewing Applicant Details',
    summary: 'Click any applicant row to open their full detail panel.',
    content: 'Clicking a row opens a slide-over drawer showing all 4 tabs: Personal Info, Family Background, Education, and Documents. You can Accept or Reject from inside the drawer, or click "Open Full Record" to go to the dedicated page.',
    steps: [
      'Click any applicant row in the list.',
      'The drawer slides in from the right.',
      'Switch between tabs: Personal Info, Family, Education, Documents.',
      'Use the Accept / Reject buttons inside the drawer to act on the application.',
      'Click "Open Full Record & Edit" for the full detail page.',
    ],
    roles: ADM, lastUpdated: '2026-04-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_adm_decide', featureId: 'feat_adm_decide',
    title: 'Accepting or Rejecting an Application',
    summary: 'Review and make a final decision on a submitted application.',
    content: 'Only Admission Officers and Super Admins can accept or reject. Accepting an application automatically creates a Student record visible to the Registrar. Rejections require a reason.',
    steps: [
      'Open an applicant (from the list or via the drawer).',
      'Click "Accept" or "Reject".',
      'Confirm in the dialog.',
      'For rejections, enter a reason before confirming.',
      'Accepted applicants appear immediately in the Registrar\'s Student Records list.',
    ],
    tips: ['Accepted status cannot be reverted from the UI — contact Super Admin if needed.'],
    roles: ADM, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },

  // ── CRM ──
  {
    id: 'he_crm_board', featureId: 'feat_crm_board',
    title: 'CRM Pipeline Board',
    summary: 'Track all prospects through 8 stages of the admissions pipeline.',
    content: 'The CRM is a Kanban board with 8 stages: New Lead → Contacted → Interested → Applicant → For Interview → Accepted → Enrolled → Lost. Cards can be moved by dragging or using the stage pills inside the detail panel.',
    steps: [
      'Go to Admissions → CRM.',
      'Cards are organized by stage in horizontal columns.',
      'Click a card to open the detail panel (3 tabs: Profile, Timeline, Follow-ups).',
      'Drag a card to a new column to change its stage.',
    ],
    tips: ['Every stage change is auto-logged in the Timeline tab.', 'Leads synced from the Applicants module show an "Applicant" badge.'],
    roles: ADM, lastUpdated: '2025-11-01', version: '1.3', status: 'PUBLISHED',
  },
  {
    id: 'he_crm_lead', featureId: 'feat_crm_lead',
    title: 'Adding a New CRM Lead',
    summary: 'Create a new prospect record for someone not yet in the system.',
    content: 'Use this for inquiries, referrals, or walk-ins who have not submitted a formal application. New leads start in the "New Lead" stage.',
    steps: [
      'Go to Admissions → CRM.',
      'Click "Add Lead" in the top right.',
      'Fill in name, source, interest score, program of interest, and contact info.',
      'The lead is created and appears in the New Lead column.',
    ],
    roles: ADM, lastUpdated: '2025-09-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_crm_move', featureId: 'feat_crm_move',
    title: 'Moving a Lead Between Stages',
    summary: 'Advance or change a lead\'s stage using drag-and-drop or stage buttons.',
    content: 'Moving a lead is the core CRM action. Every stage change is timestamped and recorded in the Timeline automatically. Leads reaching "Accepted" are synced back to the Applicants module.',
    steps: [
      'Drag the lead card from one column and drop it on another column header.',
      'Or: click the card → Profile tab → click a stage pill button.',
      'The Timeline tab logs the change instantly.',
    ],
    tips: ['Moving a lead to "Lost" hides it from the active pipeline but keeps the record.'],
    roles: ADM, lastUpdated: '2025-09-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_crm_followup', featureId: 'feat_crm_followup',
    title: 'Scheduling CRM Follow-ups',
    summary: 'Set date-linked reminders for calls, emails, or interviews.',
    content: 'Follow-ups appear in the header bell icon when they are due today — visible on every page in the staff portal. You can mark them done directly from the bell dropdown or from the CRM detail panel.',
    steps: [
      'Click a lead card to open the detail panel.',
      'Go to the Follow-ups tab.',
      'Click "Add Reminder".',
      'Select type (Call, Email, Interview), due date, and optional note.',
      'Due-today reminders appear in the header bell notification on every page.',
      'Mark done by clicking the check button next to the follow-up.',
    ],
    tips: ['Check the bell icon in the top header without opening CRM to see today\'s follow-ups.'],
    roles: ADM, lastUpdated: '2026-03-01', version: '1.1', status: 'PUBLISHED',
  },

  // ── Student Records ──
  {
    id: 'he_reg_list', featureId: 'feat_reg_list',
    title: 'Browsing Student Records',
    summary: 'Filter and search all registered students by year, status, or enrollment.',
    content: 'The Registrar module shows all students accepted from Admissions. Filter by enrollment status (Enrolled / Not Enrolled / New), year level, and student status. Click any row to open the quick-view drawer.',
    steps: [
      'Go to Records → Student Records.',
      'Use the filter dropdowns to narrow results.',
      'Click any student row to open the detail drawer.',
      'Click "Open Full Record & Edit" to go to the 4-tab edit page.',
    ],
    tips: ['Dashboard stat cards link here with filters pre-applied (e.g. clicking "Enrolled" on the dashboard shows only enrolled students).'],
    roles: REG, lastUpdated: '2026-04-01', version: '1.2', status: 'PUBLISHED',
  },
  {
    id: 'he_reg_edit', featureId: 'feat_reg_edit',
    title: 'Editing Student Information',
    summary: 'Update personal info, family background, and education history.',
    content: 'The full student record has 4 tabs. Click Edit to unlock the fields. You can add or remove family members and education history entries. Save to commit changes.',
    steps: [
      'Open a student\'s full record.',
      'Click "Edit" in the top right.',
      'Update fields in Personal Info, Family Background, or Education History tabs.',
      'Use the + button to add family members or education entries.',
      'Click "Save" to confirm all changes.',
    ],
    tips: ['Phone and email fields have a "Verified" toggle — use it to confirm contact info has been validated with the student.'],
    roles: REG, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_reg_enroll', featureId: 'feat_reg_enroll',
    title: 'Enrolling a Student in Subjects',
    summary: 'Assign published subject offerings to a student for the current semester.',
    content: 'Enrollment links a student to subject offerings. Only PUBLISHED offerings in the active semester appear. After enrollment, Treasury can generate an SOA based on enrolled units.',
    steps: [
      'Open the student\'s full record.',
      'Click the "Enrollment" tab.',
      'Select subjects from the available offerings list.',
      'Click "Save Enrollment".',
      'The student\'s enrollment status updates and Treasury can now generate an SOA.',
    ],
    tips: ['Offerings must be Published by the Academic Admin before they appear here.'],
    roles: REG, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_reg_grades', featureId: 'feat_reg_grades',
    title: 'Viewing Student Grades',
    summary: 'Review per-subject grades and GWA in the Academic Records tab.',
    content: 'The Academic Records tab shows all semesters with subject grade breakdowns: Quiz (30%), Assignment (30%), Exam (40%). GWA is computed automatically using the Philippine grading scale.',
    steps: [
      'Open a student\'s full record.',
      'Click the "Academic Records" tab.',
      'Expand any semester to see the subject grade breakdown.',
    ],
    roles: REG, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },

  // ── Document Generator (NEW) ──
  {
    id: 'he_doc_templates', featureId: 'feat_doc_templates',
    title: 'Managing Document Templates',
    summary: 'View pre-built templates and create your own for official school documents.',
    content: 'The Templates tab shows 3 built-in templates (Transcript of Records, Certificate of Enrollment, Good Moral Certificate) plus any custom ones you have created. Built-in templates cannot be deleted. Click "Use Template" on any card to jump straight to the Generate flow.',
    steps: [
      'Go to Records → Doc Generator.',
      'The Templates tab is the default view.',
      'Click "Use Template" to start generating with that template.',
      'Click "Create Custom Template" to build your own.',
      'Refer to the Placeholder Reference table at the bottom for all available {{tokens}}.',
    ],
    roles: REG, lastUpdated: '2026-05-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_doc_generate', featureId: 'feat_doc_generate',
    title: 'Generating an Official Document',
    summary: 'Create a filled document for a student in 3 steps: template → student → print.',
    content: 'The Generate tab walks you through a 3-step wizard. Student data is automatically substituted into {{placeholder}} tokens in the template body. The final step shows a live preview and lets you print or save as PDF.',
    steps: [
      'Go to Records → Doc Generator → Generate tab.',
      'Step 1: Select a template from the grid.',
      'Step 2: Search a student by name, ID, or email. Click their row to select.',
      'Optionally enter the purpose of the document (e.g. "Scholarship application").',
      'Click "Generate Document".',
      'Step 3: Review the preview. Click "Print / Save PDF" to open the print window.',
      'In the print window, press Ctrl+P (or Cmd+P on Mac) and choose "Save as PDF".',
    ],
    tips: ['Every generated document is automatically logged in the History tab.', 'Use Ctrl+P in the print window to save as PDF — no external software needed.'],
    roles: REG, lastUpdated: '2026-05-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_doc_custom', featureId: 'feat_doc_custom',
    title: 'Creating a Custom Document Template',
    summary: 'Build your own template using HTML and {{placeholder}} tokens.',
    content: 'Custom templates let you define the full document body using HTML or plain text. Insert {{placeholder}} tokens anywhere — they are replaced with live student data at generation time. See the Placeholder Reference table in the Templates tab for all available tokens.',
    steps: [
      'Go to Records → Doc Generator → Templates tab.',
      'Click "Create Custom Template".',
      'Enter a name and optional description.',
      'Write the document body using HTML or plain text with {{placeholders}}.',
      'Click "Save Template".',
      'Your template now appears in the grid and can be used in the Generate flow.',
    ],
    tips: ['You can use HTML tags like <p>, <strong>, <table> for formatting.', 'Copy a built-in template\'s HTML as a starting point for your custom design.'],
    roles: REG, lastUpdated: '2026-05-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_doc_history', featureId: 'feat_doc_history',
    title: 'Document Generation History',
    summary: 'See a session log of all documents generated, with student and timestamp.',
    content: 'The History tab shows every document generated during the current session: template name, student, purpose, and generation timestamp. This log persists across navigations within the session but resets on hard page reload.',
    steps: [
      'Go to Records → Doc Generator → History tab.',
      'Each row shows: document type, student name & ID, purpose, and when it was generated.',
    ],
    tips: ['Connect to the database backend for permanent, cross-session history logs.'],
    roles: REG, lastUpdated: '2026-05-01', version: '1.0', status: 'PUBLISHED',
  },

  // ── Treasury ──
  {
    id: 'he_trs_soa', featureId: 'feat_trs_soa',
    title: 'Generating a Statement of Account',
    summary: 'Create an SOA for an enrolled student listing tuition and fees.',
    content: 'An SOA (Statement of Account) is generated per student per semester. It includes tuition and miscellaneous fees. After creation, add payments and track the balance.',
    steps: [
      'Go to Finance → Cashier.',
      'Find the student using the search.',
      'Click "Generate SOA".',
      'Review the line items (tuition, miscellaneous fees).',
      'Confirm to create the SOA.',
    ],
    roles: TRS, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_trs_payment', featureId: 'feat_trs_payment',
    title: 'Adding a Payment to an SOA',
    summary: 'Record a payment against a student\'s open statement of account.',
    content: 'Payments are added to an existing SOA. Full payment changes the enrollment status to ENROLLED. Partial payments are tracked as PARTIALLY_PAID.',
    steps: [
      'Open the student\'s SOA in Finance → Cashier.',
      'Click "Add Payment".',
      'Enter the amount and payment method (Cash, GCash, Bank Transfer).',
      'Click Save. The transaction appears in the Transaction Logs.',
    ],
    tips: ['Partial payments are supported — the SOA shows as PARTIALLY_PAID until fully settled.'],
    roles: TRS, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_trs_accounts', featureId: 'feat_trs_accounts',
    title: 'Student Accounts Overview',
    summary: 'View outstanding balances and payment status for all students.',
    content: 'The Student Accounts page provides a summary view of all students with open or partially-paid SOAs. Use it to identify who has outstanding balances.',
    steps: [
      'Go to Finance → Student Accounts.',
      'Browse accounts filtered by payment status.',
      'Click any student to open their SOA details.',
    ],
    roles: TRS, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_trs_logs', featureId: 'feat_trs_logs',
    title: 'Transaction Logs',
    summary: 'View a complete, append-only audit trail of all financial transactions.',
    content: 'Every SOA payment is recorded here with a timestamp, amount, method, and student reference. This log is read-only and cannot be modified or deleted.',
    steps: [
      'Go to Finance → Transaction Logs.',
      'Browse transactions in reverse chronological order.',
      'Use filters to narrow by date range, method, or student.',
    ],
    roles: TRS, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },

  // ── Academic ──
  {
    id: 'he_acad_depts', featureId: 'feat_acad_depts',
    title: 'Managing Departments',
    summary: 'Create and configure academic departments linked to Dean accounts.',
    content: 'Departments represent the colleges in the school. Each is linked to a Dean account. Subjects and offerings are organized under departments.',
    steps: [
      'Go to Academic → Departments.',
      'Click "Add Department" to create a new college.',
      'Set the department code and Dean email to link a Dean account.',
    ],
    roles: ACA, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_acad_subjects', featureId: 'feat_acad_subjects',
    title: 'Managing Subjects',
    summary: 'Create and organize the subjects offered by the school.',
    content: 'Subjects are the building blocks of the curriculum. Each has a code, name, unit count, and department. Published subjects are used to create semester Offerings.',
    steps: [
      'Go to Academic → Subjects.',
      'Click "Add Subject".',
      'Fill in subject code, name, units, and department.',
      'Publish subjects to make them available for offerings.',
    ],
    roles: ACA, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_acad_rooms', featureId: 'feat_acad_rooms',
    title: 'Managing Rooms & Availability',
    summary: 'Register classrooms and set time windows when they can be scheduled.',
    content: 'Room availability windows define when teachers may schedule classes. If a room\'s window is 8:00 AM–5:00 PM on weekdays, teachers cannot schedule outside that window. Double-booking is also prevented.',
    steps: [
      'Go to Academic → Rooms.',
      'Click "Add Room" to register a new room.',
      'Set capacity and availability (days + start/end times).',
      'Teachers use these windows when creating their schedules.',
    ],
    roles: ACA, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_acad_offerings', featureId: 'feat_acad_offerings',
    title: 'Publishing Subject Offerings',
    summary: 'Create section-based offerings for a semester and publish for enrollment.',
    content: 'An Offering is a semester section of a Subject. Publishing makes it available in the Registrar\'s enrollment panel and in the Dean\'s teacher assignment module. Keep it in DRAFT until all details are final.',
    steps: [
      'Go to Academic → Offerings.',
      'Click "Add Offering".',
      'Select subject, semester, section name, and max students.',
      'Click "Publish" when ready.',
      'Published offerings appear in Registrar (enrollment) and Dean (teacher assignment) modules.',
    ],
    tips: ['Offerings in DRAFT are invisible to other modules.'],
    roles: ACA, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_acad_calendar', featureId: 'feat_acad_calendar',
    title: 'Managing Calendar Events',
    summary: 'Add, edit, and remove school events visible to all staff.',
    content: 'Academic Admins can create and manage school events (Holidays, Exams, Activities, Deadlines). All other staff can view events but not edit them. Use the filter badges to show/hide event types.',
    steps: [
      'Go to People → Calendar.',
      'Click "Add Event" (visible to Academic Admin only).',
      'Set event name, date, type, and optional description.',
      'The event appears on the calendar for all staff.',
    ],
    roles: ACA, lastUpdated: '2026-02-01', version: '1.1', status: 'PUBLISHED',
  },

  // ── Dean Portal ──
  {
    id: 'he_dean_dashboard', featureId: 'feat_dean_dashboard',
    title: 'Dean Department Dashboard',
    summary: 'View department-scoped stats, enrollment trends, and year-level breakdown.',
    content: 'The Dean Dashboard shows data filtered to your department only. Animated stat cards, enrollment distribution chart, and year-level accordion give a full picture of your department\'s status.',
    steps: [
      'Log in as a Dean account.',
      'The dashboard is the default landing page.',
      'Use the year filter on the chart to see enrollment trends across academic years.',
      'Expand the year-level accordion to see student lists per year.',
    ],
    roles: DEN, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_dean_programs', featureId: 'feat_dean_programs',
    title: 'Viewing Department Programs',
    summary: 'Browse the degree programs offered by your department.',
    content: 'Programs (e.g. BSCS, BSIT) are the degree programs under your college. Each student is enrolled in one program. This view is read-only for Deans.',
    steps: [
      'Go to Department → Programs.',
      'View all programs listed under your college.',
    ],
    roles: DEN, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_dean_students', featureId: 'feat_dean_students',
    title: 'Viewing Department Students',
    summary: 'Browse students in your department with filters — read-only view.',
    content: 'The Dean\'s Student List is scoped to your department. You can filter by year level, status, and enrollment status. Click any row to see the student\'s details in a read-only drawer.',
    steps: [
      'Go to Department → Student List.',
      'Use the year/status filters to narrow the list.',
      'Click any row to open the read-only detail drawer.',
      'Editing is done by the Registrar — this view is read-only.',
    ],
    roles: DEN, lastUpdated: '2026-04-01', version: '1.1', status: 'PUBLISHED',
  },
  {
    id: 'he_dean_assign', featureId: 'feat_dean_assign',
    title: 'Assigning Teachers to Offerings',
    summary: 'Link faculty to published subject offerings so they can set schedules.',
    content: 'The Dean assigns teachers to published offerings. The "Needs Teacher" tab shows offerings without an assignment. Once assigned, the teacher sees the offering in their schedule module.',
    steps: [
      'Go to Department → Teacher Assignment.',
      'The "Needs Teacher" tab shows unassigned published offerings.',
      'Click "Assign Teacher" on an offering.',
      'Select a faculty member from the dropdown.',
      'The teacher now sees this offering in their My Schedule module.',
    ],
    roles: DEN, lastUpdated: '2025-08-01', version: '1.0', status: 'PUBLISHED',
  },

  // ── People ──
  {
    id: 'he_team', featureId: 'feat_team',
    title: 'Team Hub — Staff Directory',
    summary: 'Browse all school staff and view their contact details in a table.',
    content: 'The Team Hub lists all staff members in a table. Click any row to open a full profile modal showing contact details, role, and department. Your default department filter is pre-set based on your role.',
    steps: [
      'Go to People → Team Hub.',
      'Browse the staff table.',
      'Click any row to open the profile modal.',
    ],
    roles: ALL, lastUpdated: '2026-03-01', version: '1.1', status: 'PUBLISHED',
  },
  {
    id: 'he_calendar', featureId: 'feat_calendar',
    title: 'School Calendar',
    summary: 'View school events by month with toggle filters for event types.',
    content: 'The calendar shows school events organized by month. Click the colored legend badges to toggle which event types are visible. Academic Admins can add events; all other roles are view-only.',
    steps: [
      'Go to People → Calendar.',
      'Click the colored badges to show/hide event types (Holiday, Exam, Activity, Deadline).',
      'Click a day cell to see events for that day.',
      'Academic Admins: click "Add Event" to create a school event.',
    ],
    roles: ALL, lastUpdated: '2026-02-01', version: '1.1', status: 'PUBLISHED',
  },

  // ── Account ──
  {
    id: 'he_profile', featureId: 'feat_profile',
    title: 'Editing Your Profile',
    summary: 'Update your nickname, phone, job title, birthday, and profile photo.',
    content: 'Your profile lets you personalize your staff record. Changes are saved to localStorage and reflected immediately in the header avatar and dropdown.',
    steps: [
      'Click your avatar in the top right → Profile.',
      'Click "Edit".',
      'Update nickname, phone, job title, and birthday.',
      'Click the photo circle to upload a profile picture.',
      'Click "Save".',
    ],
    tips: ['Your name and email come from your account and cannot be changed here.'],
    roles: ALL, lastUpdated: '2026-03-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_personalization', featureId: 'feat_personalization',
    title: 'Personalization — Theme & Accent Color',
    summary: 'Switch between Light and Dark mode and choose a highlight accent color.',
    content: 'The Personalization page lets you choose your preferred theme and accent color. Theme changes apply instantly to all pages. Accent color changes take effect on the next page load.',
    steps: [
      'Click your avatar → Personalization.',
      'Click "Light" or "Dark" to change the theme (applies instantly).',
      'Click an accent color swatch to choose a highlight color.',
      'Preferences are saved automatically to localStorage.',
    ],
    roles: ALL, lastUpdated: '2026-03-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_settings', featureId: 'feat_settings',
    title: 'Account Settings',
    summary: 'Change your password and manage which notifications you receive.',
    content: 'Settings has two sections: Password Change and Notification Preferences. Notification preferences are saved to localStorage. The demo current password is "password".',
    steps: [
      'Click your avatar → Settings.',
      'To change password: enter current password, new password (min 6 chars), then confirm.',
      'Click "Update Password".',
      'Toggle notification preferences on or off.',
      'Click "Save Preferences" to save notification settings.',
    ],
    tips: ['Demo hint: the current password is "password".'],
    roles: ALL, lastUpdated: '2026-03-01', version: '1.0', status: 'PUBLISHED',
  },
  {
    id: 'he_help', featureId: 'feat_help',
    title: 'Help & User Manual',
    summary: 'Access role-filtered documentation, FAQ, and the admin documentation panel.',
    content: 'The Help module has 3 tabs: User Manual (role-filtered, searchable docs), FAQ (quick answers), and Admin Panel (Super Admin only — manage documentation coverage). Documentation is linked to system features and auto-tagged as NEW or UPDATED based on dates.',
    steps: [
      'Click your avatar → Help, or use People → Help in the sidebar.',
      'User Manual tab: search and browse docs filtered to your role.',
      'FAQ tab: quick answers to common questions.',
      'Admin Panel (Super Admin): view coverage stats, find missing docs, and edit entries.',
    ],
    roles: ALL, lastUpdated: '2026-05-01', version: '2.0', status: 'PUBLISHED',
  },
]

// ── Computed helpers ───────────────────────────────────────────────────────────

export function computeEntryTags(entry: HelpEntry): Array<'NEW' | 'UPDATED'> {
  const feature = FEATURE_REGISTRY.find((f) => f.id === entry.featureId)
  if (!feature) return []
  const today = new Date()
  const msDay = 86_400_000
  const daysSinceAdded   = (today.getTime() - new Date(feature.addedAt).getTime()) / msDay
  const daysSinceUpdated = (today.getTime() - new Date(entry.lastUpdated).getTime()) / msDay
  // NEW: feature added within last 30 days (from actual system clock)
  if (daysSinceAdded >= 0 && daysSinceAdded <= 30) return ['NEW']
  // UPDATED: docs updated within last 14 days (and not NEW)
  if (daysSinceUpdated >= 0 && daysSinceUpdated <= 14) return ['UPDATED']
  return []
}

export type DocStatus = 'OK' | 'MISSING' | 'OUTDATED'

export function getFeatureDocStatus(featureId: string): DocStatus {
  const feature = FEATURE_REGISTRY.find((f) => f.id === featureId)
  if (!feature) return 'MISSING'
  const entry = HELP_ENTRIES.find((e) => e.featureId === featureId && e.status === 'PUBLISHED')
  if (!entry) return 'MISSING'
  if (feature.lastModified > entry.lastUpdated) return 'OUTDATED'
  return 'OK'
}

// Groups the feature registry by module name
export function getModuleGroups(): { module: string; features: RegisteredFeature[] }[] {
  const map = new Map<string, RegisteredFeature[]>()
  for (const f of FEATURE_REGISTRY) {
    if (!map.has(f.module)) map.set(f.module, [])
    map.get(f.module)!.push(f)
  }
  return Array.from(map.entries()).map(([module, features]) => ({ module, features }))
}
