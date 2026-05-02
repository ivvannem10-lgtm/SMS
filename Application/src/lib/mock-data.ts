import type {
  School, Department, Program, AcademicYear, Semester, Subject, Room, Faculty,
  Applicant, Student, SubjectOffering, TeacherAssignment, Enrollment,
  SOA, SOAItem, Payment, TreasuryTransaction, Module, Material, Assignment, Quiz,
  Grade, Notification, AuditLog, FamilyBackground, PreviousEducation,
  OfferingSchedule, PipelineStats,
} from '@/types'

export const MOCK_SCHOOL: School = {
  id: 'school_1', name: 'St. Dominic College', slug: 'stdominic',
  address: '45 Rizal Ave, Quezon City', phone: '+63 2 8000-1234',
  email: 'info@stdominic.edu.ph', primaryColor: '#2563EB', plan: 'PROFESSIONAL',
  createdAt: '2024-01-01T00:00:00Z',
}

// ── Departments (each maps to a Dean account) ─────────────────────────────────
export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept_1', name: 'College of Computing',  code: 'COC', deanName: 'Dr. Maria Santos',  deanEmail: 'dean.computing@school.edu', schoolId: 'school_1', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'dept_2', name: 'College of Business',   code: 'COB', deanName: 'Dr. Jose Reyes',    deanEmail: 'dean.business@school.edu',  schoolId: 'school_1', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'dept_3', name: 'College of Nursing',    code: 'CON', deanName: 'Dr. Ana Garcia',    deanEmail: 'dean.nursing@school.edu',   schoolId: 'school_1', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'dept_4', name: 'Arts & Sciences',       code: 'CAS', deanName: 'Dr. Carlos Cruz',   deanEmail: 'dean.arts@school.edu',      schoolId: 'school_1', createdAt: '2025-01-01T00:00:00Z' },
]

export const MOCK_PROGRAMS: Program[] = []

export const MOCK_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'ay_1', name: '2025-2026', startDate: '2025-08-01', endDate: '2026-05-31', isActive: true, schoolId: 'school_1' },
  { id: 'ay_2', name: '2024-2025', startDate: '2024-08-01', endDate: '2025-05-31', isActive: false, schoolId: 'school_1' },
]

export const MOCK_SEMESTERS: Semester[] = [
  { id: 'sem_1', name: '1st Semester 2025-2026', type: 'FIRST', isActive: true, maxUnits: 24, startDate: '2025-08-11', endDate: '2025-12-19', enrollmentStart: '2025-06-01', enrollmentEnd: '2025-08-08', academicYearId: 'ay_1' },
  { id: 'sem_2', name: '1st Semester 2024-2025', type: 'FIRST', isActive: false, maxUnits: 24, startDate: '2024-08-12', endDate: '2024-12-20', academicYearId: 'ay_2' },
]

export const MOCK_SUBJECTS: Subject[] = []

export const MOCK_ROOMS: Room[] = []

export const MOCK_FACULTY: Faculty[] = [
  { id: 'f_1', facultyId: 'FAC-2024-001', firstName: 'Roberto', lastName: 'Santos', email: 'prof.santos@school.edu', phone: '09171234567', department: 'College of Computing', position: 'Professor', status: 'ACTIVE', schoolId: 'school_1', userId: 'u_teacher' },
  { id: 'f_2', facultyId: 'FAC-2024-002', firstName: 'Maria', lastName: 'Reyes', email: 'm.reyes@stdominic.edu.ph', department: 'College of Computing', position: 'Associate Professor', status: 'ACTIVE', schoolId: 'school_1' },
  { id: 'f_3', facultyId: 'FAC-2024-003', firstName: 'James', lastName: 'Cruz', email: 'j.cruz@stdominic.edu.ph', department: 'Mathematics', position: 'Professor', status: 'ACTIVE', schoolId: 'school_1' },
  { id: 'f_4', facultyId: 'FAC-2024-004', firstName: 'Anna', lastName: 'Garcia', email: 'a.garcia@stdominic.edu.ph', department: 'College of Computing', position: 'Instructor', status: 'ACTIVE', schoolId: 'school_1' },
]

// ── Team Hub — all school staff (admin + deans + faculty) ────────────────────
export interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  email: string
  birthday?: string
  phone?: string
  avatar?: string
}

export const MOCK_STAFF_MEMBERS: StaffMember[] = [
  { id: 'tm_1', name: 'Alex Administrator',    role: 'Super Admin',         department: 'Administration',      email: 'admin@school.edu',          birthday: '1980-03-15' },
  { id: 'tm_2', name: 'Ana Admissions',         role: 'Admission Officer',   department: 'Admissions Office',   email: 'admissions@school.edu',     birthday: '1990-07-22' },
  { id: 'tm_3', name: 'Rosa Registrar',         role: 'Registrar',           department: 'Registrar Office',    email: 'registrar@school.edu',      birthday: '1985-11-04' },
  { id: 'tm_4', name: 'Thomas Treasury',        role: 'Treasurer',           department: 'Finance Office',      email: 'treasury@school.edu',       birthday: '1988-05-30' },
  { id: 'tm_5', name: 'Adam Academic',          role: 'Academic Admin',      department: 'Academic Affairs',    email: 'academic@school.edu',       birthday: '1983-09-18' },
  { id: 'tm_6', name: 'Dr. Maria Santos',       role: 'Dean',                department: 'College of Computing', email: 'dean.computing@school.edu', birthday: '1975-02-10' },
  { id: 'tm_7', name: 'Dr. Jose Reyes',         role: 'Dean',                department: 'College of Business',  email: 'dean.business@school.edu',  birthday: '1972-06-25' },
  { id: 'tm_8', name: 'Dr. Ana Garcia',         role: 'Dean',                department: 'College of Nursing',   email: 'dean.nursing@school.edu',   birthday: '1978-12-03' },
  { id: 'tm_9', name: 'Dr. Carlos Cruz',        role: 'Dean',                department: 'Arts & Sciences',      email: 'dean.arts@school.edu',      birthday: '1976-08-14' },
  { id: 'tm_10', name: 'Prof. Roberto Santos', role: 'Teacher',             department: 'College of Computing', email: 'prof.santos@school.edu',    birthday: '1987-04-07', phone: '09171234567' },
  { id: 'tm_11', name: 'Maria Reyes',          role: 'Teacher',             department: 'College of Computing', email: 'm.reyes@stdominic.edu.ph',  birthday: '1992-01-19' },
  { id: 'tm_12', name: 'James Cruz',           role: 'Teacher',             department: 'Mathematics',          email: 'j.cruz@stdominic.edu.ph',   birthday: '1984-10-28' },
  { id: 'tm_13', name: 'Anna Garcia',          role: 'Teacher',             department: 'College of Computing', email: 'a.garcia@stdominic.edu.ph', birthday: '1995-03-22' },
]

// ─── Applicants ──────────────────────────────────────────────────────────────

export const MOCK_FAMILY_BACKGROUNDS: Record<string, FamilyBackground> = {}

export const MOCK_PREVIOUS_EDUCATIONS: Record<string, PreviousEducation[]> = {}

export const MOCK_APPLICANTS: Applicant[] = []

// ─── Students ─────────────────────────────────────────────────────────────────
// Cleared for fresh testing — students are created when applicants are accepted.

export const MOCK_STUDENTS: Student[] = [
  {
    // Keeps student@school.edu functional — all data shows as empty (no enrollments, no SOA)
    id: 'st_demo', studentId: '2025-00000',
    firstName: 'Demo', lastName: 'Student',
    email: 'student@school.edu', phone: '09000000000',
    dateOfBirth: '2005-01-01', gender: 'MALE', address: 'St. Dominic College',
    status: 'ACTIVE', programId: 'prog_1', program: MOCK_PROGRAMS[0],
    yearLevel: 1, schoolId: 'school_1', userId: 'u_student',
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  },
]

// ─── Offerings ────────────────────────────────────────────────────────────────

// Cleared — Academic Admin publishes offerings; teachers set schedules after Dean assigns them
export const MOCK_SCHEDULES: Record<string, OfferingSchedule[]> = {}

export const MOCK_TEACHER_ASSIGNMENTS: Record<string, TeacherAssignment[]> = {}

// ── Room availability set by Academic Admin ───────────────────────────────────
// Each entry is the allowed usage window for the room (start–end each day).
// Teachers may only schedule within these windows.
export const MOCK_ROOM_AVAILABILITY: Record<string, { startTime: string; endTime: string; days: string[] }> = {}

// Cleared — Academic Admin creates and publishes offerings from scratch
export const MOCK_OFFERINGS: SubjectOffering[] = []

// ─── Enrollments ──────────────────────────────────────────────────────────────

export const MOCK_ENROLLMENTS: Enrollment[] = []

// ─── SOA ─────────────────────────────────────────────────────────────────────

export const MOCK_SOA: SOA[] = []

// ── Treasury transaction log — append-only, never clear ───────────────────────
// Module-level mutable array: persists across page navigations within a session.
export const MOCK_TREASURY_LOGS: TreasuryTransaction[] = []

// ─── LMS ─────────────────────────────────────────────────────────────────────

export const MOCK_MODULES: Module[] = []

export const MOCK_ASSIGNMENTS: Assignment[] = []

export const MOCK_QUIZZES: Quiz[] = []

export const MOCK_GRADES: Grade[] = []

// Default grade criteria per offering — teacher can customize weights
export const MOCK_GRADE_CRITERIA: import('@/types').GradeCriteria[] = []

// ─── CRM Follow-ups (shared so Header can read them on every page) ───────────

export interface CrmFollowUp {
  id: string
  leadId: string
  leadName: string
  type: 'CALL' | 'EMAIL' | 'INTERVIEW'
  dueDate: string
  note?: string
  done: boolean
}

const _today = new Date().toISOString().slice(0, 10)
export const CRM_FOLLOWUPS: CrmFollowUp[] = [
  { id: 'fu_1', leadId: 'lead_1', leadName: 'Maria Santos',   type: 'CALL',  dueDate: _today, note: 'Follow up on application status', done: false },
  { id: 'fu_2', leadId: 'lead_2', leadName: 'Juan Dela Cruz', type: 'EMAIL', dueDate: _today, note: 'Send program brochure',            done: false },
]

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = []

export const MOCK_AUDIT_LOGS: AuditLog[] = []

export const MOCK_PIPELINE_STATS: PipelineStats = {
  pendingApplicants: 0,
  acceptedApplicants: 0,
  enrolledStudents: 0,
  pendingPayments: 0,
  activeSubjects: 6,
  activeTeachers: 4,
}

// Alias used by Header search — same data as MOCK_SUBJECTS
export const MOCK_COURSES = MOCK_SUBJECTS
