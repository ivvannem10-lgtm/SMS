import type {
  School, Department, Program, AcademicYear, Semester, Subject, Room, Faculty,
  Applicant, Student, SubjectOffering, TeacherAssignment, Enrollment,
  SOA, SOAItem, Payment, TreasuryTransaction, Module, Material, Assignment, Quiz,
  Grade, Notification, AuditLog, FamilyBackground, PreviousEducation,
  OfferingSchedule, PipelineStats, GradeSubmission, CustomRole, SystemUser,
  Budget, BudgetExpense, LMSAnnouncement, LMSAttendance, LMSDiscussionPost,
  JobPosting, JobApplication, HREmployee, HROnboardingRecord, HRLeaveRequest,
  Asset, AssetDeployment, AssetHistory, Consumable, ConsumableTransaction,
  MaintenanceLog, AssetTagFormat,
  Vendor, PurchaseRequest, PurchaseOrder, OfficialReceipt, CashflowEntry,
  FinancialExpense, BudgetReservation,
  UniversalRequest,
  SupportTicket, KBArticle, TicketPriority,
  InstitutionalForm, FormSubmission, FormSettings,
  ChartOfAccount, JournalEntry, JournalLine, JournalEntryStatus, FinancialApproval, FinApprovalStep, PayrollRun, PayrollItem, FinancialPeriod,
  AgentInfo, AgentChat,
  FeeStructure,
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
  { id: 'tm_1',  name: 'Alex Administrator',  role: 'Super Admin',          department: 'Administration',       email: 'admin@school.edu',          birthday: '1980-03-15' },
  { id: 'tm_2',  name: 'Ana Admissions',       role: 'Admission Officer',    department: 'Admissions Office',    email: 'admissions@school.edu',     birthday: '1990-07-22' },
  { id: 'tm_3',  name: 'Rosa Registrar',       role: 'Registrar',            department: 'Registrar Office',     email: 'registrar@school.edu',      birthday: '1985-11-04' },
  { id: 'tm_4',  name: 'Thomas Treasury',      role: 'Treasurer',            department: 'Finance Office',       email: 'treasury@school.edu',       birthday: '1988-05-30' },
  { id: 'tm_5',  name: 'Clara Accounting',     role: 'Accounting',           department: 'Accounting Office',    email: 'accounting@school.edu',     birthday: '1986-08-14' },
  { id: 'tm_6',  name: 'Peter Purchasing',     role: 'Purchasing Officer',   department: 'Procurement Office',   email: 'purchasing@school.edu',     birthday: '1989-04-03' },
  { id: 'tm_7',  name: 'Adam Academic',        role: 'Academic Admin',       department: 'Academic Affairs',     email: 'academic@school.edu',       birthday: '1983-09-18' },
  { id: 'tm_8',  name: 'Dr. Maria Santos',     role: 'Dean',                 department: 'College of Computing', email: 'dean.computing@school.edu', birthday: '1975-02-10' },
  { id: 'tm_9',  name: 'Dr. Jose Reyes',       role: 'Dean',                 department: 'College of Business',  email: 'dean.business@school.edu',  birthday: '1972-06-25' },
  { id: 'tm_10', name: 'Dr. Ana Garcia',       role: 'Dean',                 department: 'College of Nursing',   email: 'dean.nursing@school.edu',   birthday: '1978-12-03' },
  { id: 'tm_11', name: 'Dr. Carlos Cruz',      role: 'Dean',                 department: 'Arts & Sciences',      email: 'dean.arts@school.edu',      birthday: '1976-08-14' },
  { id: 'tm_12', name: 'Helen HR',             role: 'HR Staff',             department: 'Human Resources',      email: 'hr@school.edu',             birthday: '1991-11-22' },
  { id: 'tm_13', name: 'Arnold AMO',           role: 'Asset Management',     department: 'Asset Management',     email: 'amo@school.edu',            birthday: '1984-06-09' },
  { id: 'tm_14', name: 'Prof. Roberto Santos', role: 'Teacher',              department: 'College of Computing', email: 'prof.santos@school.edu',    birthday: '1987-04-07', phone: '09171234567' },
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
    firstName: 'Ethan', lastName: 'Dela Cruz',
    email: 'student@school.edu', phone: '09000000000',
    dateOfBirth: '2005-01-01', gender: 'MALE', address: 'St. Dominic College',
    status: 'ACTIVE', programId: undefined, program: undefined,
    yearLevel: 1, schoolId: 'school_1', userId: 'u_student',
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  },
  { id: 'st_001', studentId: '2025-00001', firstName: 'Angela', lastName: 'Reyes', middleName: 'Marie', email: 'a.reyes@student.edu', phone: '09171000001', dateOfBirth: '2004-03-12', gender: 'FEMALE', address: 'Quezon City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_002', studentId: '2025-00002', firstName: 'Marco', lastName: 'Santos', middleName: 'Jose', email: 'm.santos@student.edu', phone: '09171000002', dateOfBirth: '2004-07-22', gender: 'MALE', address: 'Caloocan City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_003', studentId: '2025-00003', firstName: 'Bianca', lastName: 'Garcia', middleName: 'Rose', email: 'b.garcia@student.edu', phone: '09171000003', dateOfBirth: '2004-11-05', gender: 'FEMALE', address: 'Marikina City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_004', studentId: '2025-00004', firstName: 'Joshua', lastName: 'Cruz', middleName: 'Carlos', email: 'j.cruz@student.edu', phone: '09171000004', dateOfBirth: '2004-01-18', gender: 'MALE', address: 'Pasig City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_005', studentId: '2025-00005', firstName: 'Katrina', lastName: 'Villanueva', middleName: 'Anne', email: 'k.villanueva@student.edu', phone: '09171000005', dateOfBirth: '2003-09-30', gender: 'FEMALE', address: 'Taguig City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_006', studentId: '2025-00006', firstName: 'Rafael', lastName: 'Mendoza', middleName: 'Luis', email: 'r.mendoza@student.edu', phone: '09171000006', dateOfBirth: '2003-06-14', gender: 'MALE', address: 'Mandaluyong City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_007', studentId: '2025-00007', firstName: 'Sophia', lastName: 'Torres', middleName: 'Joy', email: 's.torres@student.edu', phone: '09171000007', dateOfBirth: '2003-04-28', gender: 'FEMALE', address: 'San Juan City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_008', studentId: '2025-00008', firstName: 'Gabriel', lastName: 'Ramos', middleName: 'David', email: 'g.ramos@student.edu', phone: '09171000008', dateOfBirth: '2002-12-03', gender: 'MALE', address: 'Parañaque City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_009', studentId: '2025-00009', firstName: 'Isabella', lastName: 'Lim', middleName: 'Grace', email: 'i.lim@student.edu', phone: '09171000009', dateOfBirth: '2002-08-17', gender: 'FEMALE', address: 'Las Piñas City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_010', studentId: '2025-00010', firstName: 'Miguel', lastName: 'Flores', middleName: 'Antonio', email: 'm.flores@student.edu', phone: '09171000010', dateOfBirth: '2001-02-25', gender: 'MALE', address: 'Muntinlupa City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_011', studentId: '2025-00011', firstName: 'Camille', lastName: 'Bautista', middleName: 'Faith', email: 'c.bautista@student.edu', phone: '09171000011', dateOfBirth: '2004-05-09', gender: 'FEMALE', address: 'Valenzuela City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_012', studentId: '2025-00012', firstName: 'Daniel', lastName: 'Aquino', middleName: 'Mark', email: 'd.aquino@student.edu', phone: '09171000012', dateOfBirth: '2004-10-20', gender: 'MALE', address: 'Navotas City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_013', studentId: '2025-00013', firstName: 'Patricia', lastName: 'Fernandez', middleName: 'Claire', email: 'p.fernandez@student.edu', phone: '09171000013', dateOfBirth: '2003-07-16', gender: 'FEMALE', address: 'Malabon City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_014', studentId: '2025-00014', firstName: 'Christian', lastName: 'Soriano', middleName: 'Paul', email: 'c.soriano@student.edu', phone: '09171000014', dateOfBirth: '2003-02-11', gender: 'MALE', address: 'Makati City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_015', studentId: '2025-00015', firstName: 'Alexis', lastName: 'Dela Torre', middleName: 'Nicole', email: 'a.delatorre@student.edu', phone: '09171000015', dateOfBirth: '2002-11-08', gender: 'FEMALE', address: 'Pasay City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_016', studentId: '2025-00016', firstName: 'John Paul', lastName: 'Gutierrez', middleName: 'Rey', email: 'jp.gutierrez@student.edu', phone: '09171000016', dateOfBirth: '2003-04-04', gender: 'MALE', address: 'Caloocan City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_017', studentId: '2025-00017', firstName: 'Lorraine', lastName: 'Navarro', middleName: 'Mae', email: 'l.navarro@student.edu', phone: '09171000017', dateOfBirth: '2004-08-27', gender: 'FEMALE', address: 'Quezon City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_018', studentId: '2025-00018', firstName: 'Reginald', lastName: 'Castillo', middleName: 'Ian', email: 'r.castillo@student.edu', phone: '09171000018', dateOfBirth: '2001-05-19', gender: 'MALE', address: 'Marikina City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_019', studentId: '2025-00019', firstName: 'Giselle', lastName: 'Aguilar', middleName: 'Faye', email: 'g.aguilar@student.edu', phone: '09171000019', dateOfBirth: '2004-12-31', gender: 'FEMALE', address: 'Taguig City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_020', studentId: '2025-00020', firstName: 'Aaron', lastName: 'Miranda', middleName: 'James', email: 'a.miranda@student.edu', phone: '09171000020', dateOfBirth: '2003-09-07', gender: 'MALE', address: 'Pasig City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_021', studentId: '2025-00021', firstName: 'Nicole', lastName: 'Ocampo', middleName: 'Ann', email: 'n.ocampo@student.edu', phone: '09171000021', dateOfBirth: '2004-06-15', gender: 'FEMALE', address: 'Mandaluyong City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_022', studentId: '2025-00022', firstName: 'Lance', lastName: 'Dimaculangan', middleName: 'Gabriel', email: 'l.dimaculangan@student.edu', phone: '09171000022', dateOfBirth: '2002-03-23', gender: 'MALE', address: 'Parañaque City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_023', studentId: '2025-00023', firstName: 'Francesca', lastName: 'Pascual', middleName: 'Liz', email: 'f.pascual@student.edu', phone: '09171000023', dateOfBirth: '2001-10-10', gender: 'FEMALE', address: 'Las Piñas City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_024', studentId: '2025-00024', firstName: 'Kevin', lastName: 'Santiago', middleName: 'Nico', email: 'k.santiago@student.edu', phone: '09171000024', dateOfBirth: '2004-02-14', gender: 'MALE', address: 'Muntinlupa City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_025', studentId: '2025-00025', firstName: 'Trisha', lastName: 'Evangelista', middleName: 'Joy', email: 't.evangelista@student.edu', phone: '09171000025', dateOfBirth: '2003-08-01', gender: 'FEMALE', address: 'Valenzuela City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_026', studentId: '2025-00026', firstName: 'Carlo', lastName: 'Tolentino', middleName: 'Brent', email: 'c.tolentino@student.edu', phone: '09171000026', dateOfBirth: '2003-01-27', gender: 'MALE', address: 'Navotas City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_027', studentId: '2025-00027', firstName: 'Mikhaela', lastName: 'Rosales', middleName: 'Faith', email: 'm.rosales@student.edu', phone: '09171000027', dateOfBirth: '2004-09-19', gender: 'FEMALE', address: 'Malabon City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_028', studentId: '2025-00028', firstName: 'Anton', lastName: 'Bernardo', middleName: 'Luis', email: 'a.bernardo@student.edu', phone: '09171000028', dateOfBirth: '2002-07-06', gender: 'MALE', address: 'Makati City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_029', studentId: '2025-00029', firstName: 'Janelle', lastName: 'Magno', middleName: 'Rose', email: 'j.magno@student.edu', phone: '09171000029', dateOfBirth: '2001-04-13', gender: 'FEMALE', address: 'Pasay City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_030', studentId: '2025-00030', firstName: 'Nico', lastName: 'De Leon', middleName: 'Martin', email: 'n.deleon@student.edu', phone: '09171000030', dateOfBirth: '2004-04-22', gender: 'MALE', address: 'Caloocan City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_031', studentId: '2025-00031', firstName: 'Alyssa', lastName: 'Perez', middleName: 'Kate', email: 'a.perez@student.edu', phone: '09171000031', dateOfBirth: '2003-11-30', gender: 'FEMALE', address: 'Quezon City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_032', studentId: '2025-00032', firstName: 'Hansel', lastName: 'Dela Cruz', middleName: 'Rey', email: 'h.delacruz@student.edu', phone: '09171000032', dateOfBirth: '2002-06-17', gender: 'MALE', address: 'Marikina City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_033', studentId: '2025-00033', firstName: 'Maricel', lastName: 'Abad', middleName: 'Luz', email: 'mc.abad@student.edu', phone: '09171000033', dateOfBirth: '2001-08-24', gender: 'FEMALE', address: 'Taguig City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_034', studentId: '2025-00034', firstName: 'Franz', lastName: 'Salazar', middleName: 'Hugo', email: 'f.salazar@student.edu', phone: '09171000034', dateOfBirth: '2004-01-08', gender: 'MALE', address: 'Pasig City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_035', studentId: '2025-00035', firstName: 'Clarisse', lastName: 'Medina', middleName: 'Sofia', email: 'cl.medina@student.edu', phone: '09171000035', dateOfBirth: '2003-05-05', gender: 'FEMALE', address: 'Mandaluyong City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_036', studentId: '2025-00036', firstName: 'Edgar', lastName: 'Chua', middleName: 'Victor', email: 'e.chua@student.edu', phone: '09171000036', dateOfBirth: '2002-10-29', gender: 'MALE', address: 'San Juan City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_037', studentId: '2025-00037', firstName: 'Jennica', lastName: 'Montes', middleName: 'Bea', email: 'j.montes@student.edu', phone: '09171000037', dateOfBirth: '2004-07-11', gender: 'FEMALE', address: 'Parañaque City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_038', studentId: '2025-00038', firstName: 'Aldrin', lastName: 'Velasco', middleName: 'Max', email: 'al.velasco@student.edu', phone: '09171000038', dateOfBirth: '2001-03-16', gender: 'MALE', address: 'Las Piñas City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_039', studentId: '2025-00039', firstName: 'Jasmine', lastName: 'Dizon', middleName: 'Pearl', email: 'ja.dizon@student.edu', phone: '09171000039', dateOfBirth: '2003-12-20', gender: 'FEMALE', address: 'Muntinlupa City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_040', studentId: '2025-00040', firstName: 'Oliver', lastName: 'Tan', middleName: 'Philip', email: 'o.tan@student.edu', phone: '09171000040', dateOfBirth: '2004-03-03', gender: 'MALE', address: 'Valenzuela City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_041', studentId: '2025-00041', firstName: 'Sheena', lastName: 'Alcantara', middleName: 'May', email: 'sh.alcantara@student.edu', phone: '09171000041', dateOfBirth: '2002-09-14', gender: 'FEMALE', address: 'Navotas City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_042', studentId: '2025-00042', firstName: 'Ronaldo', lastName: 'Buenaventura', middleName: 'Eric', email: 'r.buenaventura@student.edu', phone: '09171000042', dateOfBirth: '2003-06-28', gender: 'MALE', address: 'Malabon City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_043', studentId: '2025-00043', firstName: 'Maricris', lastName: 'Enriquez', middleName: 'Cel', email: 'mc.enriquez@student.edu', phone: '09171000043', dateOfBirth: '2001-01-30', gender: 'FEMALE', address: 'Makati City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_044', studentId: '2025-00044', firstName: 'Noel', lastName: 'Reyes', middleName: 'Andres', email: 'no.reyes@student.edu', phone: '09171000044', dateOfBirth: '2004-11-25', gender: 'MALE', address: 'Pasay City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_045', studentId: '2025-00045', firstName: 'Pauline', lastName: 'Sarmiento', middleName: 'Ann', email: 'p.sarmiento@student.edu', phone: '09171000045', dateOfBirth: '2003-03-18', gender: 'FEMALE', address: 'Caloocan City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_046', studentId: '2025-00046', firstName: 'Erwin', lastName: 'Panganiban', middleName: 'Neil', email: 'e.panganiban@student.edu', phone: '09171000046', dateOfBirth: '2002-05-07', gender: 'MALE', address: 'Quezon City', status: 'ACTIVE', yearLevel: 3, schoolId: 'school_1', createdAt: '2023-08-15T00:00:00Z', updatedAt: '2023-08-15T00:00:00Z' },
  { id: 'st_047', studentId: '2025-00047', firstName: 'Regine', lastName: 'Manaloto', middleName: 'Grace', email: 'reg.manaloto@student.edu', phone: '09171000047', dateOfBirth: '2004-08-13', gender: 'FEMALE', address: 'Marikina City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
  { id: 'st_048', studentId: '2025-00048', firstName: 'Benedicto', lastName: 'Lacson', middleName: 'Cruz', email: 'b.lacson@student.edu', phone: '09171000048', dateOfBirth: '2001-07-21', gender: 'MALE', address: 'Taguig City', status: 'ACTIVE', yearLevel: 4, schoolId: 'school_1', createdAt: '2022-08-15T00:00:00Z', updatedAt: '2022-08-15T00:00:00Z' },
  { id: 'st_049', studentId: '2025-00049', firstName: 'Cristine', lastName: 'Uy', middleName: 'Mae', email: 'c.uy@student.edu', phone: '09171000049', dateOfBirth: '2003-10-04', gender: 'FEMALE', address: 'Pasig City', status: 'ACTIVE', yearLevel: 2, schoolId: 'school_1', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z' },
  { id: 'st_050', studentId: '2025-00050', firstName: 'Jerome', lastName: 'Del Rosario', middleName: 'Francis', email: 'j.delrosario@student.edu', phone: '09171000050', dateOfBirth: '2004-02-28', gender: 'MALE', address: 'Mandaluyong City', status: 'ACTIVE', yearLevel: 1, schoolId: 'school_1', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
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

export const MOCK_SOA: SOA[] = [
  {
    id: 'soa_001', studentId: 'st_001', semesterId: 'sem_1',
    totalAmount: 28500, paidAmount: 0, balance: 28500, overpayment: 0,
    status: 'UNPAID', createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z',
    items: [
      { id: 'si_001a', soaId: 'soa_001', description: 'Tuition Fee',       amount: 21000, type: 'TUITION',  createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_001b', soaId: 'soa_001', description: 'Miscellaneous Fee', amount: 3500,  type: 'MISC',     createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_001c', soaId: 'soa_001', description: 'Laboratory Fee',    amount: 2500,  type: 'LAB',      createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_001d', soaId: 'soa_001', description: 'Registration Fee',  amount: 1000,  type: 'REG',      createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_001e', soaId: 'soa_001', description: 'ID Fee',            amount: 500,   type: 'OTHER',    createdAt: '2025-08-12T00:00:00Z' },
    ],
    payments: [],
  },
  {
    id: 'soa_002', studentId: 'st_002', semesterId: 'sem_1',
    totalAmount: 24000, paidAmount: 10000, balance: 14000, overpayment: 0,
    status: 'PARTIAL', createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-09-01T00:00:00Z',
    items: [
      { id: 'si_002a', soaId: 'soa_002', description: 'Tuition Fee',       amount: 18000, type: 'TUITION',  createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_002b', soaId: 'soa_002', description: 'Miscellaneous Fee', amount: 3200,  type: 'MISC',     createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_002c', soaId: 'soa_002', description: 'Laboratory Fee',    amount: 1800,  type: 'LAB',      createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_002d', soaId: 'soa_002', description: 'NSTP Fee',          amount: 600,   type: 'OTHER',    createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_002e', soaId: 'soa_002', description: 'Registration Fee',  amount: 400,   type: 'REG',      createdAt: '2025-08-12T00:00:00Z' },
    ],
    payments: [
      { id: 'pay_002a', soaId: 'soa_002', amount: 10000, method: 'GCASH', status: 'VALIDATED', receiptNumber: 'OR-2025-0041', validatedBy: 'Thomas Treasury', validatedAt: '2025-09-01T10:30:00Z', createdAt: '2025-09-01T10:00:00Z' },
    ],
  },
  {
    id: 'soa_003', studentId: 'st_003', semesterId: 'sem_1',
    totalAmount: 31000, paidAmount: 15500, balance: 15500, overpayment: 0,
    status: 'PARTIAL', createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-09-10T00:00:00Z',
    items: [
      { id: 'si_003a', soaId: 'soa_003', description: 'Tuition Fee',       amount: 24000, type: 'TUITION',  createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_003b', soaId: 'soa_003', description: 'Miscellaneous Fee', amount: 3800,  type: 'MISC',     createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_003c', soaId: 'soa_003', description: 'Laboratory Fee',    amount: 2700,  type: 'LAB',      createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_003d', soaId: 'soa_003', description: 'Registration Fee',  amount: 500,   type: 'REG',      createdAt: '2025-08-12T00:00:00Z' },
    ],
    payments: [
      { id: 'pay_003a', soaId: 'soa_003', amount: 15500, method: 'CASH', status: 'VALIDATED', receiptNumber: 'OR-2025-0038', validatedBy: 'Thomas Treasury', validatedAt: '2025-08-20T09:00:00Z', createdAt: '2025-08-20T09:00:00Z' },
    ],
  },
  {
    id: 'soa_004', studentId: 'st_004', semesterId: 'sem_1',
    totalAmount: 19500, paidAmount: 0, balance: 19500, overpayment: 0,
    status: 'UNPAID', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z',
    items: [
      { id: 'si_004a', soaId: 'soa_004', description: 'Tuition Fee',       amount: 15000, type: 'TUITION',  createdAt: '2025-08-15T00:00:00Z' },
      { id: 'si_004b', soaId: 'soa_004', description: 'Miscellaneous Fee', amount: 2800,  type: 'MISC',     createdAt: '2025-08-15T00:00:00Z' },
      { id: 'si_004c', soaId: 'soa_004', description: 'Registration Fee',  amount: 1200,  type: 'REG',      createdAt: '2025-08-15T00:00:00Z' },
      { id: 'si_004d', soaId: 'soa_004', description: 'ID Fee',            amount: 500,   type: 'OTHER',    createdAt: '2025-08-15T00:00:00Z' },
    ],
    payments: [],
  },
  {
    id: 'soa_005', studentId: 'st_005', semesterId: 'sem_1',
    totalAmount: 22000, paidAmount: 22000, balance: 0, overpayment: 0,
    status: 'PAID', createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-18T00:00:00Z',
    items: [
      { id: 'si_005a', soaId: 'soa_005', description: 'Tuition Fee',       amount: 17000, type: 'TUITION',  createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_005b', soaId: 'soa_005', description: 'Miscellaneous Fee', amount: 3000,  type: 'MISC',     createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_005c', soaId: 'soa_005', description: 'Laboratory Fee',    amount: 1500,  type: 'LAB',      createdAt: '2025-08-12T00:00:00Z' },
      { id: 'si_005d', soaId: 'soa_005', description: 'Registration Fee',  amount: 500,   type: 'REG',      createdAt: '2025-08-12T00:00:00Z' },
    ],
    payments: [
      { id: 'pay_005a', soaId: 'soa_005', amount: 22000, method: 'BANK', status: 'VALIDATED', receiptNumber: 'OR-2025-0029', validatedBy: 'Thomas Treasury', validatedAt: '2025-08-18T14:00:00Z', createdAt: '2025-08-18T14:00:00Z' },
    ],
  },
]

// ── Treasury transaction log — append-only, never clear ───────────────────────
// Module-level mutable array: persists across page navigations within a session.
export const MOCK_TREASURY_LOGS: TreasuryTransaction[] = []

// ─── LMS ─────────────────────────────────────────────────────────────────────

export const MOCK_MODULES: Module[] = []

export const MOCK_ASSIGNMENTS: Assignment[] = []

export const MOCK_QUIZZES: Quiz[] = []

export const MOCK_GRADES: Grade[] = [
  // Demo student (Ethan Dela Cruz) — CS101 (enr_d1), PUBLISHED grade
  {
    id: 'grade_d1', enrollmentId: 'enr_d1',
    quizAverage: 85, assignmentAverage: 88, midtermGrade: 82, finalExamGrade: 87,
    finalGrade: 85.7, letterGrade: '1.50', status: 'PASSED',
    gradedBy: 'Prof. Roberto Santos', gradedAt: '2025-11-15T10:00:00Z',
    createdAt: '2025-08-12T00:00:00Z',
  },
  // Other CS101 students (enr_01–enr_04)
  { id: 'grade_01', enrollmentId: 'enr_01', quizAverage: 78, assignmentAverage: 82, midtermGrade: 75, finalExamGrade: 80, finalGrade: 78.9, letterGrade: '2.00', status: 'PASSED', createdAt: '2025-08-12T00:00:00Z' },
  { id: 'grade_02', enrollmentId: 'enr_02', quizAverage: 92, assignmentAverage: 90, midtermGrade: 88, finalExamGrade: 91, finalGrade: 90.5, letterGrade: '1.00', status: 'PASSED', createdAt: '2025-08-12T00:00:00Z' },
  { id: 'grade_03', enrollmentId: 'enr_03', quizAverage: 65, assignmentAverage: 70, midtermGrade: 68, finalExamGrade: 72, finalGrade: 68.6, letterGrade: '3.00', status: 'PASSED', createdAt: '2025-08-12T00:00:00Z' },
  { id: 'grade_04', enrollmentId: 'enr_04', quizAverage: 55, assignmentAverage: 60, midtermGrade: 58, finalExamGrade: 62, finalGrade: 58.6, letterGrade: '5.00', status: 'FAILED', createdAt: '2025-08-12T00:00:00Z' },
]

// Default grade criteria per offering — teacher can customize weights
export const MOCK_GRADE_CRITERIA: import('@/types').GradeCriteria[] = []

export const MOCK_RUBRICS: import('@/types').Rubric[] = []

export const MOCK_PERFORMANCE_TASKS: import('@/types').PerformanceTask[] = []

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

export const CRM_FOLLOWUPS: CrmFollowUp[] = []

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

// ─── Grade Finalization ───────────────────────────────────────────────────────
// Submissions created by faculty; approved by Registrar.
// Grades are pushed to MOCK_GRADES only on approval.
export const MOCK_GRADE_SUBMISSIONS: GradeSubmission[] = [
  {
    id: 'gsub_1', offeringId: 'off_1', semesterId: 'sem_1',
    facultyId: 'f_1', facultyName: 'Prof. Roberto Santos',
    subjectCode: 'CS101', subjectName: 'Introduction to Programming', section: 'BSCS-1A',
    status: 'PUBLISHED',
    entries: [
      { enrollmentId: 'enr_d1', studentId: 'st_demo', studentName: 'Ethan Dela Cruz', studentNo: '2025-00000', quizAverage: 85, assignmentAverage: 88, midtermGrade: 82, finalExamGrade: 87, finalGrade: 85.7, letterGrade: '1.50', gradeStatus: 'PASSED' },
      { enrollmentId: 'enr_01', studentId: 'st_001', studentName: 'Angela Reyes',      studentNo: '2025-00001', quizAverage: 78, assignmentAverage: 82, midtermGrade: 75, finalExamGrade: 80, finalGrade: 78.9, letterGrade: '2.00', gradeStatus: 'PASSED' },
      { enrollmentId: 'enr_02', studentId: 'st_002', studentName: 'Marco Santos',      studentNo: '2025-00002', quizAverage: 92, assignmentAverage: 90, midtermGrade: 88, finalExamGrade: 91, finalGrade: 90.5, letterGrade: '1.00', gradeStatus: 'PASSED' },
      { enrollmentId: 'enr_03', studentId: 'st_003', studentName: 'Bianca Garcia',     studentNo: '2025-00003', quizAverage: 65, assignmentAverage: 70, midtermGrade: 68, finalExamGrade: 72, finalGrade: 68.6, letterGrade: '3.00', gradeStatus: 'PASSED' },
      { enrollmentId: 'enr_04', studentId: 'st_004', studentName: 'Joshua Cruz',       studentNo: '2025-00004', quizAverage: 55, assignmentAverage: 60, midtermGrade: 58, finalExamGrade: 62, finalGrade: 58.6, letterGrade: '5.00', gradeStatus: 'FAILED' },
    ],
    submittedAt: '2025-11-14T09:00:00Z',
    closedAt:    '2025-11-14T14:00:00Z', closedBy: 'Rosa Registrar',
    publishedAt: '2025-11-15T10:00:00Z', publishedBy: 'Rosa Registrar',
  },
]
// offeringIds whose grades have been submitted (locked from editing)
export const LOCKED_OFFERINGS = new Set<string>()

// Alias used by Header search — same data as MOCK_SUBJECTS
export const MOCK_COURSES = MOCK_SUBJECTS

// ─── User Management ──────────────────────────────────────────────────────────
// System users mirror the demo accounts in auth.ts — display only, no auth impact
export const MOCK_SYSTEM_USERS: SystemUser[] = [
  { id: 'u_1',  name: 'System Administrator',    email: 'admin@school.edu',              role: 'SUPER_ADMIN',       status: 'ACTIVE' },
  { id: 'u_2',  name: 'Maria Santos',             email: 'admissions@school.edu',         role: 'ADMISSION_OFFICER', status: 'ACTIVE' },
  { id: 'u_3',  name: 'Juan Dela Cruz',           email: 'registrar@school.edu',          role: 'REGISTRAR',         status: 'ACTIVE' },
  { id: 'u_4',  name: 'Ana Reyes',                email: 'treasury@school.edu',           role: 'TREASURER',         status: 'ACTIVE' },
  { id: 'u_4b', name: 'Clara Accounting',         email: 'accounting@school.edu',         role: 'ACCOUNTING',        status: 'ACTIVE' },
  { id: 'u_5',  name: 'Carlos Mendoza',           email: 'academic@school.edu',           role: 'ACADEMIC_ADMIN',    status: 'ACTIVE' },
  { id: 'u_6',  name: 'Dr. Elena Cruz',           email: 'dean.computing@school.edu',     role: 'DEAN',              status: 'ACTIVE' },
  { id: 'u_7',  name: 'Dr. Roberto Tan',          email: 'dean.business@school.edu',      role: 'DEAN',              status: 'ACTIVE' },
  { id: 'u_8',  name: 'Dr. Luz Villanueva',       email: 'dean.nursing@school.edu',       role: 'DEAN',              status: 'ACTIVE' },
  { id: 'u_9',  name: 'Dr. Amelia Garcia',        email: 'dean.arts@school.edu',          role: 'DEAN',              status: 'ACTIVE' },
  { id: 'u_10', name: 'Prof. Antonio Santos',     email: 'prof.santos@school.edu',        role: 'TEACHER',           status: 'ACTIVE' },
  { id: 'u_11', name: 'Ethan Dela Cruz',          email: 'student@school.edu',            role: 'STUDENT',           status: 'ACTIVE' },
]

// Custom roles created by Super Admin — mutable, persists within session
export const MOCK_CUSTOM_ROLES: CustomRole[] = []

// ─── Budget Management ────────────────────────────────────────────────────────
export const BUDGET_DEPARTMENTS = [
  'College of Computing',
  'College of Business',
  'College of Nursing',
  'Arts & Sciences',
] as const

export const MOCK_BUDGETS: Budget[] = [
  { id: 'bud_1', name: 'Q1 2025 — Computing',  department: 'College of Computing', amount: 250000, periodType: 'QUARTERLY', startDate: '2025-01-01', endDate: '2025-03-31', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'bud_2', name: 'Q1 2025 — Business',   department: 'College of Business',  amount: 180000, periodType: 'QUARTERLY', startDate: '2025-01-01', endDate: '2025-03-31', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'bud_3', name: 'Q1 2025 — Nursing',    department: 'College of Nursing',   amount: 320000, periodType: 'QUARTERLY', startDate: '2025-01-01', endDate: '2025-03-31', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'bud_4', name: 'Q1 2025 — Arts',       department: 'Arts & Sciences',      amount: 150000, periodType: 'QUARTERLY', startDate: '2025-01-01', endDate: '2025-03-31', createdAt: '2025-01-01T00:00:00Z' },
]

export const MOCK_BUDGET_EXPENSES: BudgetExpense[] = [
  { id: 'bex_1', budgetId: 'bud_1', department: 'College of Computing', description: 'Lab Equipment Purchase',      amount: 85000,  date: '2025-01-15', recordedBy: 'Clara Accounting' },
  { id: 'bex_2', budgetId: 'bud_1', department: 'College of Computing', description: 'Software Licenses',           amount: 45000,  date: '2025-02-01', recordedBy: 'Clara Accounting' },
  { id: 'bex_3', budgetId: 'bud_1', department: 'College of Computing', description: 'Network Upgrade',             amount: 62000,  date: '2025-02-18', recordedBy: 'Clara Accounting' },
  { id: 'bex_4', budgetId: 'bud_2', department: 'College of Business',  description: 'Conference Materials',        amount: 28000,  date: '2025-01-20', recordedBy: 'Clara Accounting' },
  { id: 'bex_5', budgetId: 'bud_2', department: 'College of Business',  description: 'Case Study Subscriptions',    amount: 12000,  date: '2025-02-05', recordedBy: 'Clara Accounting' },
  { id: 'bex_6', budgetId: 'bud_3', department: 'College of Nursing',   description: 'Medical Supplies Q1',         amount: 120000, date: '2025-01-25', recordedBy: 'Clara Accounting' },
  { id: 'bex_7', budgetId: 'bud_3', department: 'College of Nursing',   description: 'Clinical Simulation Kit',     amount: 98000,  date: '2025-02-10', recordedBy: 'Clara Accounting' },
  { id: 'bex_8', budgetId: 'bud_3', department: 'College of Nursing',   description: 'PPE Restock',                 amount: 45000,  date: '2025-03-01', recordedBy: 'Clara Accounting' },
  { id: 'bex_9', budgetId: 'bud_4', department: 'Arts & Sciences',      description: 'Art Supplies & Materials',    amount: 35000,  date: '2025-01-30', recordedBy: 'Clara Accounting' },
  { id: 'bex_10',budgetId: 'bud_4', department: 'Arts & Sciences',      description: 'Theater Production Props',    amount: 52000,  date: '2025-02-20', recordedBy: 'Clara Accounting' },
]

// ─── LMS Seed Data ────────────────────────────────────────────────────────────
// Seeds programs, subjects, offerings, enrollments, and LMS content for demo.
;(function seedLMS() {
  // Programs
  if (MOCK_PROGRAMS.length === 0) {
    MOCK_PROGRAMS.push(
      { id: 'prog_cs', code: 'BSCS', name: 'Bachelor of Science in Computer Science', departmentId: 'dept_1', schoolId: 'school_1' },
      { id: 'prog_it', code: 'BSIT', name: 'Bachelor of Science in Information Technology', departmentId: 'dept_1', schoolId: 'school_1' },
    )
  }

  // Subjects (Subject type: id, code, name, units, labUnits, type, schoolId)
  if (MOCK_SUBJECTS.length === 0) {
    MOCK_SUBJECTS.push(
      { id: 'subj_1', code: 'CS101', name: 'Introduction to Programming', units: 3, labUnits: 1, type: 'LECTURE', schoolId: 'school_1' },
      { id: 'subj_2', code: 'CS201', name: 'Data Structures and Algorithms', units: 3, labUnits: 1, type: 'LECTURE', schoolId: 'school_1' },
      { id: 'subj_3', code: 'CS301', name: 'Web Development', units: 3, labUnits: 1, type: 'LECTURE', schoolId: 'school_1' },
      { id: 'subj_4', code: 'MATH101', name: 'Calculus I', units: 3, labUnits: 0, type: 'LECTURE', schoolId: 'school_1' },
      { id: 'subj_5', code: 'GE101', name: 'Purposive Communication', units: 3, labUnits: 0, type: 'LECTURE', schoolId: 'school_1' },
    )
  }

  // Offerings (published, with faculty and schedules embedded)
  if (MOCK_OFFERINGS.length === 0) {
    const f1 = MOCK_FACULTY.find(f => f.id === 'f_1')!
    const f2 = MOCK_FACULTY.find(f => f.id === 'f_2')!
    const f3 = MOCK_FACULTY.find(f => f.id === 'f_3')!
    MOCK_OFFERINGS.push(
      {
        id: 'off_1', section: 'BSCS-1A', status: 'PUBLISHED', maxStudents: 35, semesterId: 'sem_1', subjectId: 'subj_1',
        subject: MOCK_SUBJECTS[0],
        schedules: [
          { id: 'sch_1a', dayOfWeek: 'MON', startTime: '08:00', endTime: '10:00', offeringId: 'off_1' },
          { id: 'sch_1b', dayOfWeek: 'WED', startTime: '08:00', endTime: '10:00', offeringId: 'off_1' },
        ],
        assignments: [{ id: 'ta_1', role: 'BOTH', offeringId: 'off_1', facultyId: 'f_1', faculty: f1 }],
        _count: { enrollments: 28 },
        createdAt: '2025-08-01T00:00:00Z',
      },
      {
        id: 'off_2', section: 'BSCS-2A', status: 'PUBLISHED', maxStudents: 30, semesterId: 'sem_1', subjectId: 'subj_2',
        subject: MOCK_SUBJECTS[1],
        schedules: [
          { id: 'sch_2a', dayOfWeek: 'TUE', startTime: '10:00', endTime: '12:00', offeringId: 'off_2' },
          { id: 'sch_2b', dayOfWeek: 'THU', startTime: '10:00', endTime: '12:00', offeringId: 'off_2' },
        ],
        assignments: [{ id: 'ta_2', role: 'BOTH', offeringId: 'off_2', facultyId: 'f_1', faculty: f1 }],
        _count: { enrollments: 25 },
        createdAt: '2025-08-01T00:00:00Z',
      },
      {
        id: 'off_3', section: 'BSCS-3A', status: 'PUBLISHED', maxStudents: 30, semesterId: 'sem_1', subjectId: 'subj_3',
        subject: MOCK_SUBJECTS[2],
        schedules: [
          { id: 'sch_3a', dayOfWeek: 'FRI', startTime: '13:00', endTime: '17:00', offeringId: 'off_3' },
        ],
        assignments: [{ id: 'ta_3', role: 'BOTH', offeringId: 'off_3', facultyId: 'f_2', faculty: f2 }],
        _count: { enrollments: 22 },
        createdAt: '2025-08-01T00:00:00Z',
      },
      {
        id: 'off_4', section: 'BSCS-1B', status: 'PUBLISHED', maxStudents: 35, semesterId: 'sem_1', subjectId: 'subj_4',
        subject: MOCK_SUBJECTS[3],
        schedules: [{ id: 'sch_4a', dayOfWeek: 'TUE', startTime: '07:00', endTime: '10:00', offeringId: 'off_4' }],
        assignments: [{ id: 'ta_4', role: 'BOTH', offeringId: 'off_4', facultyId: 'f_3', faculty: f3 }],
        _count: { enrollments: 30 },
        createdAt: '2025-08-01T00:00:00Z',
      },
    )
  }

  // Enrollments for demo student
  if (MOCK_ENROLLMENTS.length === 0) {
    MOCK_ENROLLMENTS.push(
      // Demo student — ENROLLED in CS101, PRE_ENROLLED (payment pending) in CS201
      { id: 'enr_d1', studentId: 'st_demo', offeringId: 'off_1', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[0], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_d2', studentId: 'st_demo', offeringId: 'off_2', semesterId: 'sem_1', status: 'PRE_ENROLLED', offering: MOCK_OFFERINGS[1], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      // Other students in off_1 (CS101)
      { id: 'enr_01', studentId: 'st_001', offeringId: 'off_1', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[0], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_02', studentId: 'st_002', offeringId: 'off_1', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[0], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_03', studentId: 'st_003', offeringId: 'off_1', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[0], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_04', studentId: 'st_004', offeringId: 'off_1', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[0], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_05', studentId: 'st_005', offeringId: 'off_1', semesterId: 'sem_1', status: 'DROPPED', offering: MOCK_OFFERINGS[0], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      // Off_2 (CS201)
      { id: 'enr_06', studentId: 'st_006', offeringId: 'off_2', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[1], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_07', studentId: 'st_007', offeringId: 'off_2', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[1], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_08', studentId: 'st_008', offeringId: 'off_2', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[1], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      // Off_3 (CS301)
      { id: 'enr_09', studentId: 'st_009', offeringId: 'off_3', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[2], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
      { id: 'enr_10', studentId: 'st_010', offeringId: 'off_3', semesterId: 'sem_1', status: 'ENROLLED', offering: MOCK_OFFERINGS[2], createdAt: '2025-08-12T00:00:00Z', updatedAt: '2025-08-12T00:00:00Z' },
    )
  }

  // Modules
  if (MOCK_MODULES.length === 0) {
    MOCK_MODULES.push(
      // CS101 modules
      {
        id: 'mod_1', offeringId: 'off_1', title: 'Module 1: Introduction to Programming', description: 'Overview of programming concepts, history, and setup.', order: 1, isPublished: true, createdAt: '2025-08-15T00:00:00Z',
        materials: [
          { id: 'mat_1a', moduleId: 'mod_1', title: 'Course Syllabus', type: 'PDF', filename: 'CS101_Syllabus.pdf', size: '245 KB', createdAt: '2025-08-15T00:00:00Z' },
          { id: 'mat_1b', moduleId: 'mod_1', title: 'Introduction Slides', type: 'PDF', filename: 'Lecture1_Intro.pdf', size: '1.2 MB', createdAt: '2025-08-15T00:00:00Z' },
          { id: 'mat_1c', moduleId: 'mod_1', title: 'Python Installation Guide', type: 'LINK', url: 'https://python.org/downloads', createdAt: '2025-08-15T00:00:00Z' },
        ],
      },
      {
        id: 'mod_2', offeringId: 'off_1', title: 'Module 2: Variables, Data Types & Operators', description: 'Learn about variables, primitive types, and basic operators.', order: 2, isPublished: true, createdAt: '2025-08-22T00:00:00Z',
        materials: [
          { id: 'mat_2a', moduleId: 'mod_2', title: 'Lecture Notes: Variables', type: 'PDF', filename: 'Lecture2_Variables.pdf', size: '890 KB', createdAt: '2025-08-22T00:00:00Z' },
          { id: 'mat_2b', moduleId: 'mod_2', title: 'Practice Exercises', type: 'FILE', filename: 'Module2_Exercises.docx', size: '340 KB', createdAt: '2025-08-22T00:00:00Z' },
        ],
      },
      {
        id: 'mod_3', offeringId: 'off_1', title: 'Module 3: Control Structures', description: 'If-else statements, loops, and flow control.', order: 3, isPublished: false, createdAt: '2025-09-01T00:00:00Z',
        materials: [],
      },
      // CS201 modules
      {
        id: 'mod_4', offeringId: 'off_2', title: 'Module 1: Introduction to Data Structures', description: 'What are data structures and why they matter.', order: 1, isPublished: true, createdAt: '2025-08-15T00:00:00Z',
        materials: [
          { id: 'mat_4a', moduleId: 'mod_4', title: 'DS Overview Slides', type: 'PDF', filename: 'DS_Intro.pdf', size: '1.5 MB', createdAt: '2025-08-15T00:00:00Z' },
        ],
      },
      {
        id: 'mod_5', offeringId: 'off_2', title: 'Module 2: Arrays and Linked Lists', description: 'Implementation and comparison of arrays vs linked lists.', order: 2, isPublished: true, createdAt: '2025-08-22T00:00:00Z',
        materials: [
          { id: 'mat_5a', moduleId: 'mod_5', title: 'Arrays Reference Sheet', type: 'PDF', filename: 'Arrays_Reference.pdf', size: '420 KB', createdAt: '2025-08-22T00:00:00Z' },
          { id: 'mat_5b', moduleId: 'mod_5', title: 'Linked List Visualization', type: 'LINK', url: 'https://visualgo.net/en/list', createdAt: '2025-08-22T00:00:00Z' },
        ],
      },
      // CS301 modules
      {
        id: 'mod_6', offeringId: 'off_3', title: 'Module 1: HTML & CSS Foundations', description: 'Building blocks of the web.', order: 1, isPublished: true, createdAt: '2025-08-15T00:00:00Z',
        materials: [
          { id: 'mat_6a', moduleId: 'mod_6', title: 'HTML Cheatsheet', type: 'PDF', filename: 'HTML_Cheatsheet.pdf', size: '380 KB', createdAt: '2025-08-15T00:00:00Z' },
        ],
      },
    )
  }

  // Assignments
  if (MOCK_ASSIGNMENTS.length === 0) {
    MOCK_ASSIGNMENTS.push(
      {
        id: 'asgn_1', offeringId: 'off_1', title: 'Hello World Program', description: 'Write a Python program that prints "Hello, World!" and your name.', dueDate: '2025-08-25T23:59:00Z', totalPoints: 50, isPublished: true, createdAt: '2025-08-15T00:00:00Z',
        submissions: [
          { id: 'sub_1a', assignmentId: 'asgn_1', studentId: 'st_demo', content: 'print("Hello, World!")\nprint("Ethan Dela Cruz")', isLate: false, grade: 48, feedback: 'Excellent work! Clean and correct.', submittedAt: '2025-08-24T10:30:00Z', gradedAt: '2025-08-26T09:00:00Z' },
          { id: 'sub_1b', assignmentId: 'asgn_1', studentId: 'st_001', content: 'print("Hello World")', isLate: false, grade: 45, submittedAt: '2025-08-25T20:00:00Z', gradedAt: '2025-08-26T09:30:00Z' },
          { id: 'sub_1c', assignmentId: 'asgn_1', studentId: 'st_002', content: 'print("Hello, World!")\nprint("Marco Santos")', isLate: true, grade: 40, feedback: 'Late submission.', submittedAt: '2025-08-26T08:00:00Z', gradedAt: '2025-08-27T10:00:00Z' },
        ],
      },
      {
        id: 'asgn_2', offeringId: 'off_1', title: 'Simple Calculator', description: 'Create a Python calculator that handles add, subtract, multiply, divide.', dueDate: '2025-09-10T23:59:00Z', totalPoints: 100, isPublished: true, createdAt: '2025-08-28T00:00:00Z',
        submissions: [
          { id: 'sub_2a', assignmentId: 'asgn_2', studentId: 'st_001', content: 'def add(a, b): return a + b', isLate: false, submittedAt: '2025-09-09T15:00:00Z' },
        ],
      },
      {
        id: 'asgn_3', offeringId: 'off_2', title: 'Array Implementation', description: 'Implement a dynamic array class in Python.', dueDate: '2025-09-01T23:59:00Z', totalPoints: 80, isPublished: true, createdAt: '2025-08-20T00:00:00Z',
        submissions: [
          { id: 'sub_3a', assignmentId: 'asgn_3', studentId: 'st_006', content: 'class DynamicArray: ...', isLate: false, grade: 72, submittedAt: '2025-08-31T18:00:00Z', gradedAt: '2025-09-02T09:00:00Z' },
        ],
      },
      {
        id: 'asgn_4', offeringId: 'off_3', title: 'Personal Portfolio Page', description: 'Build a personal portfolio using HTML and CSS.', dueDate: '2025-09-15T23:59:00Z', totalPoints: 100, isPublished: true, createdAt: '2025-08-20T00:00:00Z',
        submissions: [],
      },
    )
  }

  // Quizzes
  if (MOCK_QUIZZES.length === 0) {
    MOCK_QUIZZES.push(
      {
        id: 'quiz_1', offeringId: 'off_1',
        title: 'Quiz 1: Programming Fundamentals',
        description: 'Covers basic programming concepts including syntax, data types, and control flow.',
        instructions: 'Read each question carefully. All questions are auto-graded. You have 30 minutes. Do not refresh the page during the exam.',
        assessmentType: 'QUIZ',
        duration: 30, totalPoints: 30, passingScore: 18,
        startDate: '2025-08-20T08:00:00Z', endDate: '2025-08-20T12:00:00Z',
        isPublished: true, visibility: 'PUBLISHED',
        maxAttempts: 1, shuffleQuestions: false, shuffleOptions: true,
        showResultsImmediately: true, showCorrectAnswers: false,
        createdAt: '2025-08-18T00:00:00Z',
        questions: [
          { id: 'q_1a', quizId: 'quiz_1', question: 'What is the output of print(2 + 3)?', type: 'MCQ', options: ['A. 2', 'B. 3', 'C. 5', 'D. 23'], answer: 'C. 5', points: 5, order: 1 },
          { id: 'q_1b', quizId: 'quiz_1', question: 'Python is a compiled language.', type: 'TRUE_FALSE', answer: 'False', points: 5, order: 2 },
          { id: 'q_1c', quizId: 'quiz_1', question: 'What keyword is used to define a function in Python?', type: 'MCQ', options: ['A. function', 'B. def', 'C. func', 'D. define'], answer: 'B. def', points: 5, order: 3 },
          { id: 'q_1d', quizId: 'quiz_1', question: 'What is the correct syntax to print "Hello, World!" in Python?', type: 'IDENTIFICATION', answer: 'print("Hello, World!")', points: 5, order: 4 },
          { id: 'q_1e', quizId: 'quiz_1', question: 'A variable in Python must be declared with a type before use.', type: 'TRUE_FALSE', answer: 'False', points: 5, order: 5 },
          { id: 'q_1f', quizId: 'quiz_1', question: 'Explain what a variable is in programming and give an example in Python.', type: 'ESSAY', points: 5, order: 6 },
        ],
        attempts: [
          {
            id: 'att_1a', quizId: 'quiz_1', studentId: 'st_demo', studentName: 'Ethan Dela Cruz',
            score: 20, maxScore: 30, startedAt: '2025-08-20T08:05:00Z', submittedAt: '2025-08-20T08:28:00Z',
            timeTakenSeconds: 1380, status: 'SUBMITTED', isFullyGraded: false,
            answers: [
              { questionId: 'q_1a', answer: 'C. 5', score: 5, maxScore: 5 },
              { questionId: 'q_1b', answer: 'False', score: 5, maxScore: 5 },
              { questionId: 'q_1c', answer: 'B. def', score: 5, maxScore: 5 },
              { questionId: 'q_1d', answer: 'print("Hello World")', score: 0, maxScore: 5 },
              { questionId: 'q_1e', answer: 'True', score: 0, maxScore: 5 },
              { questionId: 'q_1f', answer: 'A variable is a container that stores a value. Example: x = 10', score: undefined, maxScore: 5 },
            ],
          },
          {
            id: 'att_1b', quizId: 'quiz_1', studentId: 'st_001', studentName: 'Maria Santos',
            score: 20, maxScore: 30, startedAt: '2025-08-20T08:10:00Z', submittedAt: '2025-08-20T08:35:00Z',
            timeTakenSeconds: 1500, status: 'SUBMITTED', isFullyGraded: false,
            answers: [
              { questionId: 'q_1a', answer: 'C. 5', score: 5, maxScore: 5 },
              { questionId: 'q_1b', answer: 'True', score: 0, maxScore: 5 },
              { questionId: 'q_1c', answer: 'B. def', score: 5, maxScore: 5 },
              { questionId: 'q_1d', answer: 'print("Hello, World!")', score: 5, maxScore: 5 },
              { questionId: 'q_1e', answer: 'False', score: 5, maxScore: 5 },
              { questionId: 'q_1f', answer: 'Variables hold data. x = 5 is a variable named x.', score: undefined, maxScore: 5 },
            ],
          },
        ],
      },
      {
        id: 'quiz_2', offeringId: 'off_1',
        title: 'Midterm Exam: Python Programming',
        description: 'Comprehensive midterm covering Modules 1–3: variables, control flow, functions, and OOP basics.',
        instructions: 'Answer all questions. Essay questions will be manually graded by the instructor. You have 90 minutes. No collaboration allowed.',
        assessmentType: 'MIDTERM_EXAM',
        duration: 90, totalPoints: 100, passingScore: 60,
        startDate: '2026-06-15T08:00:00Z', endDate: '2026-06-15T23:59:00Z',
        isPublished: true, visibility: 'PUBLISHED',
        maxAttempts: 1, shuffleQuestions: false, shuffleOptions: false,
        showResultsImmediately: false, showCorrectAnswers: false,
        createdAt: '2025-09-10T00:00:00Z',
        questions: [
          { id: 'q_2a', quizId: 'quiz_2', question: 'Which of the following is the correct way to declare a list in Python?', type: 'MCQ', options: ['A. list = (1, 2, 3)', 'B. list = [1, 2, 3]', 'C. list = {1, 2, 3}', 'D. list = <1, 2, 3>'], answer: 'B. list = [1, 2, 3]', points: 5, order: 1 },
          { id: 'q_2b', quizId: 'quiz_2', question: 'In Python, indentation is used to define code blocks.', type: 'TRUE_FALSE', answer: 'True', points: 5, order: 2 },
          { id: 'q_2c', quizId: 'quiz_2', question: 'What does the len() function return?', type: 'MCQ', options: ['A. The last element', 'B. The data type', 'C. The number of items', 'D. The memory address'], answer: 'C. The number of items', points: 5, order: 3 },
          { id: 'q_2d', quizId: 'quiz_2', question: 'What Python keyword is used to handle exceptions?', type: 'IDENTIFICATION', answer: 'try', points: 10, order: 4 },
          { id: 'q_2e', quizId: 'quiz_2', question: 'The range() function in Python generates a sequence starting from 1 by default.', type: 'TRUE_FALSE', answer: 'False', points: 5, order: 5 },
          { id: 'q_2f', quizId: 'quiz_2', question: 'Write a Python function that takes two numbers and returns their sum. Explain what each line does.', type: 'ESSAY', points: 30, order: 6 },
          { id: 'q_2g', quizId: 'quiz_2', question: 'Explain the concept of Object-Oriented Programming (OOP) and its four pillars. Provide a brief Python example of a class.', type: 'LONG_RESPONSE', points: 40, order: 7 },
        ],
        attempts: [],
      },
      {
        id: 'quiz_3', offeringId: 'off_2',
        title: 'Quiz 1: Data Structure Basics',
        description: 'MCQ on fundamental data structure concepts — arrays, linked lists, stacks, queues.',
        instructions: 'Choose the best answer for each question. 30 minutes time limit.',
        assessmentType: 'QUIZ',
        duration: 30, totalPoints: 25, passingScore: 15,
        startDate: '2025-08-25T10:00:00Z', endDate: '2025-08-25T14:00:00Z',
        isPublished: true, visibility: 'PUBLISHED',
        maxAttempts: 1, shuffleQuestions: false, shuffleOptions: false,
        showResultsImmediately: true, showCorrectAnswers: true,
        createdAt: '2025-08-22T00:00:00Z',
        questions: [
          { id: 'q_3a', quizId: 'quiz_3', question: 'Which data structure operates on a Last-In-First-Out (LIFO) basis?', type: 'MCQ', options: ['A. Queue', 'B. Stack', 'C. Array', 'D. Tree'], answer: 'B. Stack', points: 5, order: 1 },
          { id: 'q_3b', quizId: 'quiz_3', question: 'A linked list has O(1) access time for any element.', type: 'TRUE_FALSE', answer: 'False', points: 5, order: 2 },
          { id: 'q_3c', quizId: 'quiz_3', question: 'What is the time complexity of accessing an element in an array by index?', type: 'MCQ', options: ['A. O(n)', 'B. O(log n)', 'C. O(1)', 'D. O(n²)'], answer: 'C. O(1)', points: 5, order: 3 },
          { id: 'q_3d', quizId: 'quiz_3', question: 'What operation removes the front element of a Queue?', type: 'IDENTIFICATION', answer: 'dequeue', points: 5, order: 4 },
          { id: 'q_3e', quizId: 'quiz_3', question: 'Arrays in most languages are stored in contiguous memory locations.', type: 'TRUE_FALSE', answer: 'True', points: 5, order: 5 },
        ],
        attempts: [
          {
            id: 'att_3a', quizId: 'quiz_3', studentId: 'st_006', studentName: 'Jasmine Reyes',
            score: 22, maxScore: 25, startedAt: '2025-08-25T10:02:00Z', submittedAt: '2025-08-25T10:25:00Z',
            timeTakenSeconds: 1380, status: 'GRADED', isFullyGraded: true,
            answers: [
              { questionId: 'q_3a', answer: 'B. Stack', score: 5, maxScore: 5 },
              { questionId: 'q_3b', answer: 'False', score: 5, maxScore: 5 },
              { questionId: 'q_3c', answer: 'C. O(1)', score: 5, maxScore: 5 },
              { questionId: 'q_3d', answer: 'pop', score: 0, maxScore: 5 },
              { questionId: 'q_3e', answer: 'True', score: 5, maxScore: 5 },
            ],
          },
        ],
      },
    )
  }

  // Rubrics
  if (MOCK_RUBRICS.length === 0) {
    MOCK_RUBRICS.push(
      {
        id: 'rubric_1', title: 'Research Paper Rubric', offeringId: 'off_1',
        description: 'Standard rubric for evaluating research papers in CS courses.',
        createdAt: '2025-09-01T00:00:00Z',
        criteria: [
          {
            id: 'crit_r1a', name: 'Content & Accuracy', weight: 40,
            description: 'Accuracy, depth, and relevance of information presented.',
            levels: [
              { id: 'lvl_r1a1', label: 'Excellent', score: 100, description: 'All facts are accurate, thorough, and well-supported.' },
              { id: 'lvl_r1a2', label: 'Good',      score: 85,  description: 'Most facts are accurate with minor gaps.' },
              { id: 'lvl_r1a3', label: 'Fair',      score: 70,  description: 'Some inaccuracies or shallow coverage.' },
              { id: 'lvl_r1a4', label: 'Poor',      score: 50,  description: 'Significant errors or very thin content.' },
            ],
          },
          {
            id: 'crit_r1b', name: 'Creativity & Originality', weight: 30,
            description: 'Originality of ideas and creative approach to the topic.',
            levels: [
              { id: 'lvl_r1b1', label: 'Excellent', score: 100, description: 'Highly original with unique insights.' },
              { id: 'lvl_r1b2', label: 'Good',      score: 85,  description: 'Shows some original thinking.' },
              { id: 'lvl_r1b3', label: 'Fair',      score: 70,  description: 'Mostly derivative with limited originality.' },
              { id: 'lvl_r1b4', label: 'Poor',      score: 50,  description: 'No original contribution.' },
            ],
          },
          {
            id: 'crit_r1c', name: 'Presentation & Format', weight: 30,
            description: 'Organization, clarity, and adherence to format guidelines.',
            levels: [
              { id: 'lvl_r1c1', label: 'Excellent', score: 100, description: 'Exceptionally clear, well-organized, correct format.' },
              { id: 'lvl_r1c2', label: 'Good',      score: 85,  description: 'Well-organized with minor format issues.' },
              { id: 'lvl_r1c3', label: 'Fair',      score: 70,  description: 'Somewhat disorganized or format errors.' },
              { id: 'lvl_r1c4', label: 'Poor',      score: 50,  description: 'Poorly organized, major format issues.' },
            ],
          },
        ],
      },
      {
        id: 'rubric_2', title: 'Programming Project Rubric', offeringId: 'off_1',
        description: 'Rubric for evaluating coding projects and system demonstrations.',
        createdAt: '2025-09-05T00:00:00Z',
        criteria: [
          {
            id: 'crit_r2a', name: 'Functionality', weight: 50,
            description: 'Does the program work correctly and meet all requirements?',
            levels: [
              { id: 'lvl_r2a1', label: 'Excellent', score: 100, description: 'All features work perfectly.' },
              { id: 'lvl_r2a2', label: 'Good',      score: 85,  description: 'Core features work, minor bugs.' },
              { id: 'lvl_r2a3', label: 'Fair',      score: 70,  description: 'Partial functionality, some crashes.' },
              { id: 'lvl_r2a4', label: 'Poor',      score: 50,  description: 'Major features broken or non-functional.' },
            ],
          },
          {
            id: 'crit_r2b', name: 'Code Quality', weight: 30,
            description: 'Readability, structure, comments, and best practices.',
            levels: [
              { id: 'lvl_r2b1', label: 'Excellent', score: 100, description: 'Clean, well-structured, fully commented.' },
              { id: 'lvl_r2b2', label: 'Good',      score: 85,  description: 'Readable with minor quality issues.' },
              { id: 'lvl_r2b3', label: 'Fair',      score: 70,  description: 'Hard to read, inconsistent structure.' },
              { id: 'lvl_r2b4', label: 'Poor',      score: 50,  description: 'Unreadable or very poor quality.' },
            ],
          },
          {
            id: 'crit_r2c', name: 'Documentation', weight: 20,
            description: 'README, user guide, and inline documentation quality.',
            levels: [
              { id: 'lvl_r2c1', label: 'Excellent', score: 100, description: 'Comprehensive documentation.' },
              { id: 'lvl_r2c2', label: 'Good',      score: 85,  description: 'Adequate documentation.' },
              { id: 'lvl_r2c3', label: 'Fair',      score: 70,  description: 'Minimal documentation.' },
              { id: 'lvl_r2c4', label: 'Poor',      score: 50,  description: 'No meaningful documentation.' },
            ],
          },
        ],
      },
    )
  }

  // Performance Tasks
  if (MOCK_PERFORMANCE_TASKS.length === 0) {
    MOCK_PERFORMANCE_TASKS.push(
      {
        id: 'pt_1', offeringId: 'off_1',
        title: 'Research Paper: Evolution of Programming Languages',
        description: 'Write an in-depth research paper tracing the history and evolution of programming languages from assembly to modern-day languages.',
        instructions: 'Minimum 5 pages (double-spaced, 12pt font). Include at least 3 peer-reviewed references. Submit as PDF. Use APA format.',
        rubricId: 'rubric_1',
        rubric: MOCK_RUBRICS[0],
        totalPoints: 100,
        dueDate: '2025-10-15T23:59:00Z',
        isPublished: true,
        createdAt: '2025-09-15T00:00:00Z',
        submissions: [
          {
            id: 'pts_1a', taskId: 'pt_1', studentId: 'st_demo', studentName: 'Ethan Dela Cruz',
            content: 'My research paper covers the evolution from FORTRAN to Python, focusing on the paradigm shifts that defined each era...',
            submittedAt: '2025-10-14T20:00:00Z', isLate: false,
            gradedAt: '2025-10-16T10:00:00Z', gradedBy: 'Prof. Roberto Santos',
            criteriaScores: [
              { criterionId: 'crit_r1a', levelId: 'lvl_r1a2', score: 85,  weight: 40, weightedScore: 34   },
              { criterionId: 'crit_r1b', levelId: 'lvl_r1b1', score: 100, weight: 30, weightedScore: 30   },
              { criterionId: 'crit_r1c', levelId: 'lvl_r1c2', score: 85,  weight: 30, weightedScore: 25.5 },
            ],
            finalScore: 89.5,
            feedback: 'Excellent research with creative insights. Minor formatting issues noted. Strong originality.',
          },
          {
            id: 'pts_1b', taskId: 'pt_1', studentId: 'st_001', studentName: 'Maria Santos',
            content: 'This paper examines programming language paradigms from a historical perspective...',
            submittedAt: '2025-10-16T08:00:00Z', isLate: true,
          },
        ],
      },
      {
        id: 'pt_2', offeringId: 'off_1',
        title: 'Programming Project: Simple Calculator App',
        description: 'Build a functional calculator application using Python with a graphical user interface.',
        instructions: 'Must support basic operations (+, -, ×, ÷). Include error handling for division by zero. Submit source code as a .zip file.',
        rubricId: 'rubric_2',
        rubric: MOCK_RUBRICS[1],
        totalPoints: 100,
        dueDate: '2026-11-30T23:59:00Z',
        isPublished: true,
        createdAt: '2025-10-01T00:00:00Z',
        submissions: [],
      },
    )
  }
})()

// ─── LMS Data Arrays ──────────────────────────────────────────────────────────

export const MOCK_LMS_ANNOUNCEMENTS: LMSAnnouncement[] = [
  { id: 'ann_1', offeringId: 'off_1', title: 'Welcome to CS101!', content: 'Welcome everyone! Please review the syllabus attached in Module 1. Our first lab session will be next week. Make sure Python is installed on your machine before then.', authorName: 'Prof. Roberto Santos', isPinned: true, createdAt: '2025-08-12T08:00:00Z' },
  { id: 'ann_2', offeringId: 'off_1', title: 'Quiz 1 Schedule', content: 'Quiz 1 covering Module 1 will be held on August 20 during class hours (8:00–8:30 AM). Open your LMS at exactly 8:00. No late access will be granted.', authorName: 'Prof. Roberto Santos', isPinned: false, createdAt: '2025-08-18T10:00:00Z' },
  { id: 'ann_3', offeringId: 'off_1', title: 'Assignment 1 Grades Released', content: 'Grades for Assignment 1 (Hello World Program) have been posted. Please check your gradebook. If you have questions, visit during consultation hours: MWF 2:00–4:00 PM.', authorName: 'Prof. Roberto Santos', isPinned: false, createdAt: '2025-08-26T10:00:00Z' },
  { id: 'ann_4', offeringId: 'off_2', title: 'Welcome to CS201!', content: 'This semester we will cover essential data structures that every programmer must know. Please review prerequisite topics in Python before our second meeting.', authorName: 'Prof. Roberto Santos', isPinned: true, createdAt: '2025-08-12T09:00:00Z' },
  { id: 'ann_5', offeringId: 'off_3', title: 'Welcome to Web Development!', content: 'Welcome! We will use VS Code as our primary editor. Please install it along with the Live Server extension. See you on Friday!', authorName: 'Maria Reyes', isPinned: true, createdAt: '2025-08-12T09:30:00Z' },
]

export const MOCK_LMS_ATTENDANCE: LMSAttendance[] = [
  // CS101 attendance
  { id: 'att_a1', offeringId: 'off_1', studentId: 'st_demo', studentName: 'Ethan Dela Cruz', date: '2025-08-18', status: 'PRESENT' },
  { id: 'att_a2', offeringId: 'off_1', studentId: 'st_demo', studentName: 'Ethan Dela Cruz', date: '2025-08-20', status: 'PRESENT' },
  { id: 'att_a3', offeringId: 'off_1', studentId: 'st_demo', studentName: 'Ethan Dela Cruz', date: '2025-08-25', status: 'LATE', remarks: 'Arrived 15 minutes late' },
  { id: 'att_a4', offeringId: 'off_1', studentId: 'st_demo', studentName: 'Ethan Dela Cruz', date: '2025-08-27', status: 'PRESENT' },
  { id: 'att_a5', offeringId: 'off_1', studentId: 'st_001', studentName: 'Angela Marie Reyes', date: '2025-08-18', status: 'PRESENT' },
  { id: 'att_a6', offeringId: 'off_1', studentId: 'st_001', studentName: 'Angela Marie Reyes', date: '2025-08-20', status: 'ABSENT' },
  { id: 'att_a7', offeringId: 'off_1', studentId: 'st_002', studentName: 'Marco Jose Santos', date: '2025-08-18', status: 'PRESENT' },
  { id: 'att_a8', offeringId: 'off_1', studentId: 'st_002', studentName: 'Marco Jose Santos', date: '2025-08-20', status: 'PRESENT' },
  { id: 'att_a9', offeringId: 'off_1', studentId: 'st_003', studentName: 'Bianca Rose Garcia', date: '2025-08-18', status: 'EXCUSED', remarks: 'Medical certificate submitted' },
  { id: 'att_a10', offeringId: 'off_1', studentId: 'st_003', studentName: 'Bianca Rose Garcia', date: '2025-08-20', status: 'PRESENT' },
  { id: 'att_a11', offeringId: 'off_1', studentId: 'st_004', studentName: 'Joshua Carlos Cruz', date: '2025-08-18', status: 'PRESENT' },
  { id: 'att_a12', offeringId: 'off_1', studentId: 'st_004', studentName: 'Joshua Carlos Cruz', date: '2025-08-20', status: 'LATE', remarks: 'Traffic' },
]

export const MOCK_LMS_DISCUSSIONS: LMSDiscussionPost[] = [
  {
    id: 'disc_1', offeringId: 'off_1', title: 'General Q&A — Module 1', content: 'Use this thread to ask questions about Module 1: Introduction to Programming. I will respond within 24 hours on weekdays.', authorName: 'Prof. Roberto Santos', authorRole: 'TEACHER', isPinned: true, createdAt: '2025-08-15T09:00:00Z',
    replies: [
      { id: 'rep_1a', postId: 'disc_1', content: 'Prof, can we use any Python version or specifically 3.x?', authorName: 'Angela Reyes', authorRole: 'STUDENT', createdAt: '2025-08-16T14:00:00Z' },
      { id: 'rep_1b', postId: 'disc_1', content: 'Please use Python 3.10 or higher. Check the installation guide in Module 1 materials.', authorName: 'Prof. Roberto Santos', authorRole: 'TEACHER', createdAt: '2025-08-16T16:30:00Z' },
      { id: 'rep_1c', postId: 'disc_1', content: 'Thank you, Prof!', authorName: 'Angela Reyes', authorRole: 'STUDENT', createdAt: '2025-08-16T17:00:00Z' },
    ],
  },
  {
    id: 'disc_2', offeringId: 'off_1', title: 'Assignment 1 Clarification', content: 'For Assignment 1, should we submit a .py file or paste the code directly in the text box?', authorName: 'Marco Santos', authorRole: 'STUDENT', isPinned: false, createdAt: '2025-08-20T11:00:00Z',
    replies: [
      { id: 'rep_2a', postId: 'disc_2', content: 'Please paste the code directly in the submission text box. No file upload needed for this one.', authorName: 'Prof. Roberto Santos', authorRole: 'TEACHER', createdAt: '2025-08-20T14:00:00Z' },
    ],
  },
  {
    id: 'disc_3', offeringId: 'off_2', title: 'Welcome & Introductions', content: 'Introduce yourself! Share your background in programming and what you hope to learn in Data Structures.', authorName: 'Prof. Roberto Santos', authorRole: 'TEACHER', isPinned: true, createdAt: '2025-08-12T10:00:00Z',
    replies: [
      { id: 'rep_3a', postId: 'disc_3', content: 'Hi! I am Carlo Tolentino. I am comfortable with Python basics. Excited to learn linked lists!', authorName: 'Carlo Tolentino', authorRole: 'STUDENT', createdAt: '2025-08-12T15:00:00Z' },
    ],
  },
]

// ─── HRIS ─────────────────────────────────────────────────────────────────────

export const MOCK_JOB_POSTINGS: JobPosting[] = [
  {
    id: 'job_1', title: 'Computer Science Instructor', department: 'College of Computing',
    employmentType: 'FULL_TIME', workSetup: 'ON_SITE', location: 'Main Campus',
    salaryMin: 28000, salaryMax: 40000,
    description: 'We are looking for a passionate Computer Science Instructor to join our computing department and help shape the next generation of software developers.',
    requirements: '• Master\'s degree in Computer Science or related field\n• At least 2 years of teaching experience\n• Strong background in programming (Python, Java, or C++)\n• Good communication and classroom management skills',
    responsibilities: '• Prepare and deliver engaging lectures and lab sessions\n• Develop syllabi and course materials\n• Assess student performance through exams and projects\n• Participate in department meetings and curriculum reviews',
    openings: 2, status: 'OPEN', postedAt: '2025-09-01T00:00:00Z', closingDate: '2025-10-31T00:00:00Z', createdBy: 'Hannah Rodriguez',
  },
  {
    id: 'job_2', title: 'Administrative Assistant', department: 'Office of the Registrar',
    employmentType: 'FULL_TIME', workSetup: 'ON_SITE', location: 'Main Campus',
    salaryMin: 18000, salaryMax: 24000,
    description: 'Support the Registrar\'s Office in managing student records, document processing, and day-to-day administrative tasks.',
    requirements: '• Bachelor\'s degree in Business Administration or related field\n• Proficient in MS Office Suite\n• Strong attention to detail and organizational skills\n• Prior experience in academic administration is a plus',
    responsibilities: '• Process student enrollment, transfer, and graduation documents\n• Maintain and update student records\n• Assist in scheduling and room assignments\n• Respond to student and faculty inquiries',
    openings: 1, status: 'OPEN', postedAt: '2025-09-10T00:00:00Z', closingDate: '2025-10-15T00:00:00Z', createdBy: 'Hannah Rodriguez',
  },
  {
    id: 'job_3', title: 'Nursing Clinical Instructor', department: 'College of Nursing',
    employmentType: 'PART_TIME', workSetup: 'ON_SITE', location: 'Main Campus + Affiliate Hospitals',
    salaryMin: 20000, salaryMax: 30000,
    description: 'Supervise and guide nursing students during clinical rotations in partner hospitals and simulate nursing procedures in the skills laboratory.',
    requirements: '• Registered Nurse with active PRC license\n• At least 1 year clinical experience\n• Clinical Instructor certificate is an advantage\n• Strong patient care and teaching skills',
    responsibilities: '• Supervise students during clinical duty\n• Evaluate student clinical performance\n• Coordinate with hospital partners\n• Conduct return demonstrations in skills lab',
    openings: 3, status: 'OPEN', postedAt: '2025-08-20T00:00:00Z', closingDate: '2025-09-30T00:00:00Z', createdBy: 'Hannah Rodriguez',
  },
  {
    id: 'job_4', title: 'IT Systems Administrator', department: 'IT Services',
    employmentType: 'FULL_TIME', workSetup: 'HYBRID', location: 'Main Campus',
    salaryMin: 32000, salaryMax: 45000,
    description: 'Manage and maintain the college\'s IT infrastructure including servers, networks, and enterprise software systems.',
    requirements: '• Bachelor\'s degree in IT, Computer Science, or related field\n• 3+ years experience in system administration\n• Knowledge of Linux/Windows Server environments\n• Network security and troubleshooting skills',
    responsibilities: '• Maintain server infrastructure and network systems\n• Implement security protocols and backups\n• Provide technical support to faculty and staff\n• Manage cloud services and enterprise applications',
    openings: 1, status: 'FILLED', postedAt: '2025-07-01T00:00:00Z', closingDate: '2025-08-15T00:00:00Z', createdBy: 'Hannah Rodriguez',
  },
  {
    id: 'job_5', title: 'Guidance Counselor', department: 'Student Services',
    employmentType: 'FULL_TIME', workSetup: 'ON_SITE', location: 'Main Campus',
    salaryMin: 22000, salaryMax: 30000,
    description: 'Provide academic, career, and personal counseling services to students to support their overall well-being and academic success.',
    requirements: '• Master\'s degree in Guidance and Counseling\n• Licensed Professional Counselor (LPC) or Registered Guidance Counselor\n• Excellent interpersonal and communication skills\n• Experience with student mental health programs',
    responsibilities: '• Conduct individual and group counseling sessions\n• Develop student wellness and mental health programs\n• Coordinate with faculty regarding at-risk students\n• Maintain confidential student counseling records',
    openings: 1, status: 'DRAFT', postedAt: '2025-10-01T00:00:00Z', createdBy: 'Hannah Rodriguez',
  },
]

export const MOCK_JOB_APPLICATIONS: JobApplication[] = [
  // CS Instructor applicants (job_1)
  { id: 'app_hr_1', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Carlos Mendoza', email: 'c.mendoza@email.com', phone: '09171234567', stage: 'HIRED', appliedAt: '2025-09-05T10:00:00Z', updatedAt: '2025-10-10T09:00:00Z', rating: 5, notes: 'Exceptional candidate. PhD in Computer Science, 5 years teaching experience.', offeredSalary: 38000 },
  { id: 'app_hr_2', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Liza Tamayo', email: 'l.tamayo@email.com', phone: '09187654321', stage: 'FINAL_EVALUATION', appliedAt: '2025-09-06T11:00:00Z', updatedAt: '2025-10-08T14:00:00Z', rating: 4, notes: 'Strong Python background. Demo teaching was very engaging.' },
  { id: 'app_hr_3', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Ramon Villanueva', email: 'r.villanueva@email.com', phone: '09199990001', stage: 'INTERVIEW_COMPLETED', appliedAt: '2025-09-08T09:00:00Z', updatedAt: '2025-10-05T16:00:00Z', rating: 3, interviewDate: '2025-10-05T10:00:00Z', interviewType: 'PANEL', interviewNotes: 'Good technical skills but needs improvement in classroom management.' },
  { id: 'app_hr_4', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Angela Reyes', email: 'a.reyes@email.com', phone: '09151112233', stage: 'INTERVIEW_SCHEDULED', appliedAt: '2025-09-10T08:00:00Z', updatedAt: '2025-09-20T10:00:00Z', rating: 4, interviewDate: '2025-10-15T14:00:00Z', interviewType: 'PANEL', interviewLink: 'https://meet.google.com/abc-123' },
  { id: 'app_hr_5', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Jose Dela Cruz', email: 'j.delacruz@email.com', phone: '09162223344', stage: 'SHORTLISTED', appliedAt: '2025-09-12T15:00:00Z', updatedAt: '2025-09-18T11:00:00Z', rating: 4, notes: 'Master\'s in Software Engineering. Thesis on Machine Learning.' },
  { id: 'app_hr_6', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Maria Santos', email: 'm.santos@email.com', phone: '09173334455', stage: 'SCREENING', appliedAt: '2025-09-14T12:00:00Z', updatedAt: '2025-09-15T09:00:00Z' },
  { id: 'app_hr_7', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Paolo Gonzales', email: 'p.gonzales@email.com', phone: '09184445566', stage: 'NEW', appliedAt: '2025-09-20T10:00:00Z', updatedAt: '2025-09-20T10:00:00Z' },
  { id: 'app_hr_8', jobId: 'job_1', jobTitle: 'Computer Science Instructor', applicantName: 'Diana Cruz', email: 'd.cruz@email.com', phone: '09195556677', stage: 'REJECTED', appliedAt: '2025-09-07T13:00:00Z', updatedAt: '2025-09-16T10:00:00Z', rejectionReason: 'Does not meet minimum educational requirement (BS degree only).' },
  // Admin Assistant applicants (job_2)
  { id: 'app_hr_9',  jobId: 'job_2', jobTitle: 'Administrative Assistant', applicantName: 'Rowena Flores', email: 'r.flores@email.com', phone: '09201234568', stage: 'SHORTLISTED', appliedAt: '2025-09-12T09:00:00Z', updatedAt: '2025-09-22T14:00:00Z', rating: 4 },
  { id: 'app_hr_10', jobId: 'job_2', jobTitle: 'Administrative Assistant', applicantName: 'Kevin Tan', email: 'k.tan@email.com', phone: '09212345679', stage: 'SCREENING', appliedAt: '2025-09-15T11:00:00Z', updatedAt: '2025-09-16T09:00:00Z' },
  { id: 'app_hr_11', jobId: 'job_2', jobTitle: 'Administrative Assistant', applicantName: 'Grace Abad', email: 'g.abad@email.com', phone: '09223456780', stage: 'NEW', appliedAt: '2025-09-18T08:00:00Z', updatedAt: '2025-09-18T08:00:00Z' },
  // Nursing applicants (job_3)
  { id: 'app_hr_12', jobId: 'job_3', jobTitle: 'Nursing Clinical Instructor', applicantName: 'Nurse Ana Lim', email: 'a.lim@email.com', phone: '09231234560', stage: 'HIRED', appliedAt: '2025-08-22T08:00:00Z', updatedAt: '2025-09-20T10:00:00Z', rating: 5, offeredSalary: 28000 },
  { id: 'app_hr_13', jobId: 'job_3', jobTitle: 'Nursing Clinical Instructor', applicantName: 'John Bautista', email: 'j.bautista@email.com', phone: '09242345671', stage: 'INTERVIEW_COMPLETED', appliedAt: '2025-08-25T10:00:00Z', updatedAt: '2025-09-15T09:00:00Z', rating: 3, interviewDate: '2025-09-15T10:00:00Z', interviewType: 'ONSITE' },
]

export const MOCK_HR_EMPLOYEES: HREmployee[] = [
  {
    id: 'emp_1', employeeNo: 'EMP-2023-001',
    firstName: 'Roberto', lastName: 'Santos', middleName: 'Juan',
    email: 'prof.santos@school.edu', phone: '09171234567',
    position: 'Computer Science Instructor', department: 'College of Computing',
    employmentType: 'FULL_TIME', workSetup: 'ON_SITE', status: 'ACTIVE',
    startDate: '2023-06-01', salary: 35000,
    address: '123 Quezon Ave, Quezon City', birthday: '1985-04-15', gender: 'Male',
    sssNo: '33-1234567-8', philhealthNo: '01-123456789-0', pagibigNo: '1234-5678-9012', tinNo: '123-456-789-000',
    emergencyContactName: 'Maria Santos', emergencyContactPhone: '09181234567', emergencyContactRelation: 'Spouse',
    documents: [
      { id: 'doc_e1a', type: 'Resume', filename: 'santos_cv.pdf', uploadedAt: '2023-05-15T00:00:00Z', verified: true },
      { id: 'doc_e1b', type: 'TOR', filename: 'santos_tor.pdf', uploadedAt: '2023-05-15T00:00:00Z', verified: true },
      { id: 'doc_e1c', type: 'PRC License', filename: 'santos_prc.pdf', uploadedAt: '2023-05-16T00:00:00Z', verified: true },
    ],
    notes: 'Excellent faculty member. Published 3 research papers in 2024.',
    createdAt: '2023-06-01T00:00:00Z',
  },
  {
    id: 'emp_2', employeeNo: 'EMP-2022-015',
    firstName: 'Hannah', lastName: 'Rodriguez', middleName: 'Grace',
    email: 'hr@school.edu', phone: '09182345678',
    position: 'HR Manager', department: 'Human Resources',
    employmentType: 'FULL_TIME', workSetup: 'HYBRID', status: 'ACTIVE',
    startDate: '2022-03-15', salary: 42000,
    address: '456 Commonwealth Ave, QC', birthday: '1988-11-02', gender: 'Female',
    sssNo: '33-2345678-9', philhealthNo: '01-234567890-1', pagibigNo: '2345-6789-0123', tinNo: '234-567-890-001',
    emergencyContactName: 'Pedro Rodriguez', emergencyContactPhone: '09192345678', emergencyContactRelation: 'Husband',
    documents: [
      { id: 'doc_e2a', type: 'Resume', filename: 'rodriguez_cv.pdf', uploadedAt: '2022-03-01T00:00:00Z', verified: true },
    ],
    createdAt: '2022-03-15T00:00:00Z',
  },
  {
    id: 'emp_3', employeeNo: 'EMP-2024-008',
    firstName: 'Carlos', lastName: 'Mendoza', middleName: 'Eduardo',
    email: 'c.mendoza@school.edu', phone: '09193456789',
    position: 'Computer Science Instructor', department: 'College of Computing',
    employmentType: 'FULL_TIME', workSetup: 'ON_SITE', status: 'ACTIVE',
    startDate: '2025-11-01', salary: 38000,
    address: '789 Katipunan Ave, QC', birthday: '1990-07-20', gender: 'Male',
    sssNo: '33-3456789-0', philhealthNo: '01-345678901-2', pagibigNo: '3456-7890-1234', tinNo: '345-678-901-002',
    emergencyContactName: 'Lucia Mendoza', emergencyContactPhone: '09203456789', emergencyContactRelation: 'Mother',
    documents: [
      { id: 'doc_e3a', type: 'Resume', filename: 'mendoza_cv.pdf', uploadedAt: '2025-10-05T00:00:00Z', verified: true },
      { id: 'doc_e3b', type: 'Diploma', filename: 'mendoza_diploma.pdf', uploadedAt: '2025-10-05T00:00:00Z', verified: false },
    ],
    jobId: 'job_1',
    notes: 'Recently hired. PhD in Computer Science from UP Diliman.',
    createdAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'emp_4', employeeNo: 'EMP-2021-003',
    firstName: 'Rosa', lastName: 'Registrar', middleName: 'Mae',
    email: 'registrar@school.edu', phone: '09204567890',
    position: 'University Registrar', department: 'Office of the Registrar',
    employmentType: 'FULL_TIME', workSetup: 'ON_SITE', status: 'ACTIVE',
    startDate: '2021-01-10', salary: 38000,
    address: '321 Mindanao Ave, QC', birthday: '1982-02-28', gender: 'Female',
    sssNo: '33-4567890-1', philhealthNo: '01-456789012-3', pagibigNo: '4567-8901-2345', tinNo: '456-789-012-003',
    emergencyContactName: 'Fernando Registrar', emergencyContactPhone: '09214567890', emergencyContactRelation: 'Spouse',
    documents: [
      { id: 'doc_e4a', type: 'Resume', filename: 'registrar_cv.pdf', uploadedAt: '2020-12-15T00:00:00Z', verified: true },
    ],
    createdAt: '2021-01-10T00:00:00Z',
  },
  {
    id: 'emp_5', employeeNo: 'EMP-2020-007',
    firstName: 'Ana', lastName: 'Lim', middleName: 'Beatriz',
    email: 'a.lim@school.edu', phone: '09215678901',
    position: 'Nursing Clinical Instructor', department: 'College of Nursing',
    employmentType: 'PART_TIME', workSetup: 'ON_SITE', status: 'ON_LEAVE',
    startDate: '2020-08-01', salary: 28000,
    address: '654 España Blvd, Manila', birthday: '1991-05-14', gender: 'Female',
    sssNo: '33-5678901-2', philhealthNo: '01-567890123-4', pagibigNo: '5678-9012-3456', tinNo: '567-890-123-004',
    emergencyContactName: 'Jose Lim', emergencyContactPhone: '09225678901', emergencyContactRelation: 'Father',
    documents: [
      { id: 'doc_e5a', type: 'PRC License', filename: 'lim_prc.pdf', uploadedAt: '2020-07-20T00:00:00Z', verified: true },
    ],
    jobId: 'job_3',
    createdAt: '2020-08-01T00:00:00Z',
  },
]

export const MOCK_HR_ONBOARDING: HROnboardingRecord[] = [
  {
    id: 'onboard_1', employeeId: 'emp_3', employeeName: 'Carlos Mendoza', startDate: '2025-11-01',
    status: 'IN_PROGRESS', completedTasksCount: 5, totalTasksCount: 10,
    tasks: [
      { id: 'task_1a', title: 'Submit Government IDs (SSS, PhilHealth, Pag-IBIG, TIN)', category: 'Documents', isCompleted: true, completedAt: '2025-10-28T10:00:00Z', dueDate: '2025-10-31T00:00:00Z' },
      { id: 'task_1b', title: 'Submit NBI Clearance', category: 'Documents', isCompleted: true, completedAt: '2025-10-29T14:00:00Z', dueDate: '2025-10-31T00:00:00Z' },
      { id: 'task_1c', title: 'Submit Diploma and TOR', category: 'Documents', isCompleted: false, dueDate: '2025-11-07T00:00:00Z' },
      { id: 'task_1d', title: 'Submit Medical Certificate (from accredited clinic)', category: 'Documents', isCompleted: true, completedAt: '2025-10-30T09:00:00Z', dueDate: '2025-11-07T00:00:00Z' },
      { id: 'task_1e', title: 'IT Account Setup (email, SIS access, LMS)', category: 'System Access', isCompleted: true, completedAt: '2025-11-01T08:00:00Z', dueDate: '2025-11-01T00:00:00Z', assignedTo: 'IT Services' },
      { id: 'task_1f', title: 'Biometrics Enrollment', category: 'System Access', isCompleted: true, completedAt: '2025-11-01T09:00:00Z', dueDate: '2025-11-01T00:00:00Z', assignedTo: 'HR' },
      { id: 'task_1g', title: 'Faculty Orientation (Academic Policies, LMS Training)', category: 'Orientation', isCompleted: false, dueDate: '2025-11-08T00:00:00Z', assignedTo: 'Academic Admin' },
      { id: 'task_1h', title: 'Department Briefing with Dean', category: 'Orientation', isCompleted: false, dueDate: '2025-11-08T00:00:00Z', assignedTo: 'Dean – College of Computing' },
      { id: 'task_1i', title: 'Sign Employment Contract', category: 'HR & Legal', isCompleted: true, completedAt: '2025-10-25T14:00:00Z', dueDate: '2025-10-31T00:00:00Z' },
      { id: 'task_1j', title: 'Enroll in School Benefits (HMO, SSS, PhilHealth)', category: 'HR & Legal', isCompleted: false, dueDate: '2025-11-15T00:00:00Z', assignedTo: 'HR' },
    ],
  },
]

export const MOCK_HR_LEAVES: HRLeaveRequest[] = [
  { id: 'leave_1', employeeId: 'emp_1', employeeName: 'Roberto Santos', employeeNo: 'EMP-2023-001', department: 'College of Computing', leaveType: 'SICK', startDate: '2025-09-10', endDate: '2025-09-11', totalDays: 2, reason: 'Flu and fever. Medical certificate attached.', status: 'APPROVED', reviewedBy: 'Hannah Rodriguez', reviewedAt: '2025-09-09T15:00:00Z', appliedAt: '2025-09-09T08:00:00Z' },
  { id: 'leave_2', employeeId: 'emp_1', employeeName: 'Roberto Santos', employeeNo: 'EMP-2023-001', department: 'College of Computing', leaveType: 'VACATION', startDate: '2025-12-26', endDate: '2025-12-30', totalDays: 5, reason: 'Family vacation during Christmas break.', status: 'PENDING', appliedAt: '2025-11-15T10:00:00Z' },
  { id: 'leave_3', employeeId: 'emp_4', employeeName: 'Rosa Registrar', employeeNo: 'EMP-2021-003', department: 'Office of the Registrar', leaveType: 'SICK', startDate: '2025-10-20', endDate: '2025-10-20', totalDays: 1, reason: 'Doctor\'s appointment.', status: 'APPROVED', reviewedBy: 'Hannah Rodriguez', reviewedAt: '2025-10-19T16:00:00Z', appliedAt: '2025-10-19T09:00:00Z' },
  { id: 'leave_4', employeeId: 'emp_5', employeeName: 'Ana Lim', employeeNo: 'EMP-2020-007', department: 'College of Nursing', leaveType: 'MATERNITY', startDate: '2025-10-01', endDate: '2026-01-06', totalDays: 97, reason: 'Maternity leave as per RA 11210 (105-Day Expanded Maternity Leave Act).', status: 'APPROVED', reviewedBy: 'Hannah Rodriguez', reviewedAt: '2025-09-25T10:00:00Z', appliedAt: '2025-09-20T14:00:00Z' },
  { id: 'leave_5', employeeId: 'emp_2', employeeName: 'Hannah Rodriguez', employeeNo: 'EMP-2022-015', department: 'Human Resources', leaveType: 'VACATION', startDate: '2025-11-03', endDate: '2025-11-07', totalDays: 5, reason: 'Personal travel.', status: 'PENDING', appliedAt: '2025-10-25T11:00:00Z' },
  { id: 'leave_6', employeeId: 'emp_3', employeeName: 'Carlos Mendoza', employeeNo: 'EMP-2024-008', department: 'College of Computing', leaveType: 'EMERGENCY', startDate: '2025-11-05', endDate: '2025-11-05', totalDays: 1, reason: 'Family emergency — father hospitalized.', status: 'APPROVED', reviewedBy: 'Hannah Rodriguez', reviewedAt: '2025-11-05T07:30:00Z', appliedAt: '2025-11-05T06:00:00Z' },
  { id: 'leave_7', employeeId: 'emp_4', employeeName: 'Rosa Registrar', employeeNo: 'EMP-2021-003', department: 'Office of the Registrar', leaveType: 'VACATION', startDate: '2025-12-22', endDate: '2025-12-25', totalDays: 4, reason: 'Christmas holiday with family.', status: 'REJECTED', reviewedBy: 'Hannah Rodriguez', reviewedAt: '2025-12-01T10:00:00Z', rejectionReason: 'All-hands required during enrollment period. Please refile for a different date.', appliedAt: '2025-11-20T09:00:00Z' },
]

// ─── AMS (Asset Management System) ───────────────────────────────────────────

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'ast_1', assetTag: 'IT-LAPTOP-2026-0001', name: 'Dell Latitude 5420',
    category: 'LAPTOP', brand: 'Dell', model: 'Latitude 5420', serialNumber: 'DL542026001',
    description: '14-inch laptop, Intel Core i5-1135G7, 8GB RAM, 256GB SSD',
    status: 'AVAILABLE', department: 'College of Computing',
    custodianType: 'DEPARTMENT', custodianName: 'IT Services',
    purchaseDate: '2026-01-15', supplier: 'Dell Philippines', purchaseCost: 65000,
    warrantyExpiry: '2029-01-15', campus: 'Main Campus', building: 'IT Building', room: '101',
    inclusions: [
      { id: 'inc_1a', name: 'Charger/Adapter', quantity: 1 },
      { id: 'inc_1b', name: 'Laptop Bag', quantity: 1 },
    ],
    createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-01-20T08:00:00Z',
  },
  {
    id: 'ast_2', assetTag: 'IT-LAPTOP-2026-0002', name: 'Lenovo ThinkPad X1 Carbon',
    category: 'LAPTOP', brand: 'Lenovo', model: 'ThinkPad X1 Carbon Gen 10', serialNumber: 'LN1C26002',
    description: '14-inch ultrabook, Intel Core i7-1260P, 16GB RAM, 512GB SSD',
    status: 'DEPLOYED', department: 'College of Computing',
    custodianType: 'INDIVIDUAL', custodianName: 'Prof. Roberto Santos',
    purchaseDate: '2026-01-15', supplier: 'Lenovo Philippines', purchaseCost: 95000,
    warrantyExpiry: '2029-01-15', campus: 'Main Campus', building: 'IT Building', room: '102',
    inclusions: [
      { id: 'inc_2a', name: 'Charger/Adapter', quantity: 1 },
      { id: 'inc_2b', name: 'USB-C Hub', quantity: 1 },
      { id: 'inc_2c', name: 'Mouse', quantity: 1 },
    ],
    createdAt: '2026-01-20T09:00:00Z', updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'ast_3', assetTag: 'IT-PROJ-2026-0001', name: 'Epson EB-X51 Projector',
    category: 'PROJECTOR', brand: 'Epson', model: 'EB-X51', serialNumber: 'EP51X26001',
    description: '3800 lumens XGA projector for classroom/conference use',
    status: 'BORROWED', department: 'College of Business',
    custodianType: 'DEPARTMENT', custodianName: 'AV Equipment Room',
    purchaseDate: '2025-06-01', supplier: 'Epson Philippines', purchaseCost: 32000,
    warrantyExpiry: '2028-06-01', campus: 'Main Campus', building: 'Business Hall', room: 'AV Room',
    inclusions: [
      { id: 'inc_3a', name: 'Power Cable', quantity: 1 },
      { id: 'inc_3b', name: 'VGA Cable', quantity: 1 },
      { id: 'inc_3c', name: 'HDMI Cable', quantity: 1 },
      { id: 'inc_3d', name: 'Remote Control', quantity: 1 },
      { id: 'inc_3e', name: 'Carrying Case', quantity: 1 },
    ],
    createdAt: '2025-06-05T08:00:00Z', updatedAt: '2026-02-10T09:00:00Z',
  },
  {
    id: 'ast_4', assetTag: 'IT-PRINT-2026-0001', name: 'Canon LBP2900B Printer',
    category: 'PRINTER', brand: 'Canon', model: 'LBP2900B', serialNumber: 'CN29B26001',
    description: 'Monochrome laser printer, 12ppm, USB connectivity',
    status: 'AVAILABLE', department: 'Office of the Registrar',
    custodianType: 'DEPARTMENT', custodianName: 'Registrar Office',
    purchaseDate: '2025-03-10', supplier: 'Canon Philippines', purchaseCost: 8500,
    warrantyExpiry: '2027-03-10', campus: 'Main Campus', building: 'Admin Building', room: 'Registrar Office',
    inclusions: [
      { id: 'inc_4a', name: 'Power Cable', quantity: 1 },
      { id: 'inc_4b', name: 'USB Cable', quantity: 1 },
      { id: 'inc_4c', name: 'Toner Cartridge (starter)', quantity: 1 },
    ],
    createdAt: '2025-03-15T08:00:00Z', updatedAt: '2025-03-15T08:00:00Z',
  },
  {
    id: 'ast_5', assetTag: 'IT-DESK-2025-0001', name: 'HP EliteDesk 800 G6',
    category: 'DESKTOP', brand: 'HP', model: 'EliteDesk 800 G6', serialNumber: 'HP800G625001',
    description: 'Mini desktop PC, Intel Core i5-10500, 8GB RAM, 256GB SSD',
    status: 'IN_USE', department: 'College of Nursing',
    custodianType: 'DEPARTMENT', custodianName: 'Nursing Simulation Lab',
    purchaseDate: '2025-01-20', supplier: 'HP Philippines', purchaseCost: 45000,
    warrantyExpiry: '2028-01-20', campus: 'Main Campus', building: 'Nursing Building', room: 'Sim Lab 1',
    inclusions: [
      { id: 'inc_5a', name: 'Monitor', quantity: 1 },
      { id: 'inc_5b', name: 'Keyboard', quantity: 1 },
      { id: 'inc_5c', name: 'Mouse', quantity: 1 },
      { id: 'inc_5d', name: 'Power Cable', quantity: 1 },
    ],
    createdAt: '2025-01-25T08:00:00Z', updatedAt: '2025-01-25T08:00:00Z',
  },
  {
    id: 'ast_6', assetTag: 'IT-MON-2026-0001', name: 'LG 24MK430H Monitor',
    category: 'MONITOR', brand: 'LG', model: '24MK430H', serialNumber: 'LG24M26001',
    description: '24-inch Full HD IPS monitor, HDMI & VGA inputs',
    status: 'AVAILABLE', department: 'IT Services',
    custodianType: 'DEPARTMENT', custodianName: 'IT Storage Room',
    purchaseDate: '2026-01-15', supplier: 'LG Philippines', purchaseCost: 12000,
    warrantyExpiry: '2029-01-15', campus: 'Main Campus', building: 'IT Building', storageArea: 'Storage Room A',
    inclusions: [
      { id: 'inc_6a', name: 'Power Cable', quantity: 1 },
      { id: 'inc_6b', name: 'HDMI Cable', quantity: 1 },
    ],
    createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'ast_7', assetTag: 'IT-TAB-2026-0001', name: 'Apple iPad Air 5th Gen',
    category: 'TABLET', brand: 'Apple', model: 'iPad Air 5 (M1)', serialNumber: 'AP1A526001',
    description: '10.9-inch iPad Air with M1 chip, 64GB WiFi',
    status: 'UNDER_MAINTENANCE', department: 'Dean\'s Office',
    custodianType: 'INDIVIDUAL', custodianName: 'Dr. Maria Santos',
    purchaseDate: '2025-08-01', supplier: 'Apple Premium Reseller', purchaseCost: 42000,
    warrantyExpiry: '2027-08-01', campus: 'Main Campus', building: 'Admin Building', room: 'Dean\'s Office',
    inclusions: [
      { id: 'inc_7a', name: 'USB-C Charger', quantity: 1 },
      { id: 'inc_7b', name: 'Apple Pencil', quantity: 1 },
      { id: 'inc_7c', name: 'Smart Folio Case', quantity: 1 },
    ],
    createdAt: '2025-08-05T08:00:00Z', updatedAt: '2026-02-08T09:00:00Z',
  },
  {
    id: 'ast_8', assetTag: 'IT-ROUT-2025-0001', name: 'Cisco RV340 Router',
    category: 'ROUTER', brand: 'Cisco', model: 'RV340', serialNumber: 'CSRV34025001',
    description: 'Dual WAN Gigabit VPN router, supports up to 100 VPN tunnels',
    status: 'AVAILABLE', department: 'IT Services',
    custodianType: 'DEPARTMENT', custodianName: 'Network Infrastructure Team',
    purchaseDate: '2025-05-10', supplier: 'Cisco Philippines', purchaseCost: 18500,
    warrantyExpiry: '2028-05-10', campus: 'Main Campus', building: 'IT Building', room: 'Server Room',
    inclusions: [
      { id: 'inc_8a', name: 'Power Adapter', quantity: 1 },
      { id: 'inc_8b', name: 'Ethernet Cable', quantity: 2 },
    ],
    createdAt: '2025-05-15T08:00:00Z', updatedAt: '2025-05-15T08:00:00Z',
  },
]

export const MOCK_ASSET_DEPLOYMENTS: AssetDeployment[] = [
  {
    id: 'dep_1', assetId: 'ast_3', assetTag: 'IT-PROJ-2026-0001', assetName: 'Epson EB-X51 Projector',
    borrowerName: 'Juan Santos', borrowerDepartment: 'College of Business',
    custodian: 'Prof. Maria Reyes', deploymentType: 'TEMPORARY_BORROW',
    startDate: '2026-02-10', startTime: '08:00',
    expectedReturnDate: '2026-02-14', expectedReturnTime: '17:00',
    purpose: 'Business presentation for annual faculty summit and department review.',
    status: 'ACTIVE', createdAt: '2026-02-09T14:00:00Z',
  },
  {
    id: 'dep_2', assetId: 'ast_2', assetTag: 'IT-LAPTOP-2026-0002', assetName: 'Lenovo ThinkPad X1 Carbon',
    borrowerName: 'Prof. Roberto Santos', borrowerDepartment: 'College of Computing',
    custodian: 'Prof. Roberto Santos', deploymentType: 'LONG_TERM_DEPLOYMENT',
    startDate: '2026-02-01', startTime: '08:00',
    purpose: 'Assigned as primary teaching laptop for Prof. Santos for the 1st Semester 2025-2026.',
    status: 'ACTIVE', createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'dep_3', assetId: 'ast_1', assetTag: 'IT-LAPTOP-2026-0001', assetName: 'Dell Latitude 5420',
    borrowerName: 'Angela Reyes', borrowerDepartment: 'Admissions Office',
    custodian: 'Ana Admissions', deploymentType: 'TEMPORARY_BORROW',
    startDate: '2026-01-25', startTime: '09:00',
    expectedReturnDate: '2026-01-30', expectedReturnTime: '17:00',
    purpose: 'Used for applicant processing during enrollment period.',
    status: 'RETURNED',
    returnDate: '2026-01-30', returnTime: '16:30',
    returnedBy: 'Angela Reyes', receivedBy: 'Marco Dela Cruz',
    conditionOnReturn: 'Good', inspectionNotes: 'All accessories complete. Minor scratch on lid noted.',
    createdAt: '2026-01-24T10:00:00Z',
  },
]

export const MOCK_ASSET_HISTORY: AssetHistory[] = [
  // IT-LAPTOP-2026-0001
  { id: 'hist_1', assetId: 'ast_1', assetTag: 'IT-LAPTOP-2026-0001', assetName: 'Dell Latitude 5420', activityType: 'REGISTERED', user: 'Marco Dela Cruz', department: 'Asset Management', custodian: 'IT Services', startDate: '2026-01-20', status: 'AVAILABLE', remarks: 'Asset registered and tagged. All inclusions verified.', createdAt: '2026-01-20T08:00:00Z' },
  { id: 'hist_2', assetId: 'ast_1', assetTag: 'IT-LAPTOP-2026-0001', assetName: 'Dell Latitude 5420', activityType: 'BORROWED', user: 'Angela Reyes', department: 'Admissions Office', custodian: 'Ana Admissions', startDate: '2026-01-25', endDate: '2026-01-30', duration: '5 days', location: 'Admissions Office', status: 'BORROWED', remarks: 'Borrowed for enrollment period processing.', createdAt: '2026-01-25T09:00:00Z' },
  { id: 'hist_3', assetId: 'ast_1', assetTag: 'IT-LAPTOP-2026-0001', assetName: 'Dell Latitude 5420', activityType: 'RETURNED', user: 'Angela Reyes', department: 'Admissions Office', custodian: 'Marco Dela Cruz', startDate: '2026-01-30', status: 'AVAILABLE', remarks: 'Returned in good condition. Minor scratch on lid noted.', createdAt: '2026-01-30T16:30:00Z' },
  // IT-LAPTOP-2026-0002
  { id: 'hist_4', assetId: 'ast_2', assetTag: 'IT-LAPTOP-2026-0002', assetName: 'Lenovo ThinkPad X1 Carbon', activityType: 'REGISTERED', user: 'Marco Dela Cruz', department: 'Asset Management', custodian: 'IT Services', startDate: '2026-01-20', status: 'AVAILABLE', remarks: 'Asset registered and tagged.', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'hist_5', assetId: 'ast_2', assetTag: 'IT-LAPTOP-2026-0002', assetName: 'Lenovo ThinkPad X1 Carbon', activityType: 'DEPLOYED', user: 'Prof. Roberto Santos', department: 'College of Computing', custodian: 'Prof. Roberto Santos', startDate: '2026-02-01', location: 'IT Building Room 102', status: 'DEPLOYED', remarks: 'Long-term deployment as primary teaching laptop.', createdAt: '2026-02-01T08:00:00Z' },
  // IT-PROJ-2026-0001
  { id: 'hist_6', assetId: 'ast_3', assetTag: 'IT-PROJ-2026-0001', assetName: 'Epson EB-X51 Projector', activityType: 'REGISTERED', user: 'Marco Dela Cruz', department: 'Asset Management', custodian: 'AV Equipment Room', startDate: '2025-06-05', status: 'AVAILABLE', remarks: 'Projector registered with all accessories.', createdAt: '2025-06-05T08:00:00Z' },
  { id: 'hist_7', assetId: 'ast_3', assetTag: 'IT-PROJ-2026-0001', assetName: 'Epson EB-X51 Projector', activityType: 'BORROWED', user: 'Juan Santos', department: 'College of Business', custodian: 'Prof. Maria Reyes', startDate: '2026-02-10', location: 'Business Hall Conference Room', status: 'BORROWED', remarks: 'Borrowed for faculty summit presentation.', createdAt: '2026-02-09T14:00:00Z' },
  // IT-TAB-2026-0001
  { id: 'hist_8', assetId: 'ast_7', assetTag: 'IT-TAB-2026-0001', assetName: 'Apple iPad Air 5th Gen', activityType: 'REGISTERED', user: 'Marco Dela Cruz', department: 'Asset Management', custodian: 'Dr. Maria Santos', startDate: '2025-08-05', status: 'AVAILABLE', remarks: 'iPad registered with Apple Pencil and Smart Folio.', createdAt: '2025-08-05T08:00:00Z' },
  { id: 'hist_9', assetId: 'ast_7', assetTag: 'IT-TAB-2026-0001', assetName: 'Apple iPad Air 5th Gen', activityType: 'MAINTENANCE_STARTED', user: 'Marco Dela Cruz', department: 'Asset Management', custodian: 'IT Services', startDate: '2026-02-08', location: 'IT Services Repair Center', status: 'UNDER_MAINTENANCE', remarks: 'Battery swelling reported by Dr. Maria Santos. Sent for battery replacement.', createdAt: '2026-02-08T09:00:00Z' },
]

export const MOCK_CONSUMABLES: Consumable[] = [
  {
    id: 'cons_1', name: 'Bond Paper (Short)', category: 'Office Supplies',
    description: 'Short bond paper, 70gsm, 500 sheets per ream',
    unit: 'REAM', quantity: 18, lowStockThreshold: 20, overstockThreshold: 200,
    purchaseDate: '2026-01-10', supplier: 'National Bookstore', cost: 280,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cons_2', name: 'Bond Paper (A4)', category: 'Office Supplies',
    description: 'A4 bond paper, 80gsm, 500 sheets per ream',
    unit: 'REAM', quantity: 45, lowStockThreshold: 20, overstockThreshold: 150,
    purchaseDate: '2026-01-10', supplier: 'National Bookstore', cost: 300,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cons_3', name: 'Printer Ink (Black)', category: 'Printer Supplies',
    description: 'Compatible ink cartridge for Canon LBP2900B — black toner',
    unit: 'PIECE', quantity: 4, lowStockThreshold: 5, overstockThreshold: 30,
    purchaseDate: '2026-01-15', supplier: 'Canon Service Center', cost: 2200,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'cons_4', name: 'Ballpen (Black)', category: 'Office Supplies',
    description: 'Ballpen black ink, 0.7mm, box of 12 pieces',
    unit: 'BOX', quantity: 8, lowStockThreshold: 5, overstockThreshold: 50,
    purchaseDate: '2026-01-10', supplier: 'School Supplies Store', cost: 85,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cons_5', name: 'Disinfectant Spray', category: 'Cleaning Materials',
    description: 'Multi-surface disinfectant spray, 500ml bottle',
    unit: 'BOTTLE', quantity: 12, lowStockThreshold: 10, overstockThreshold: 60,
    purchaseDate: '2026-01-20', supplier: 'Cleaning Supplies Depot', cost: 180,
    createdAt: '2026-01-20T08:00:00Z',
  },
]

export const MOCK_CONSUMABLE_TRANSACTIONS: ConsumableTransaction[] = [
  { id: 'ctx_1', consumableId: 'cons_1', consumableName: 'Bond Paper (Short)', type: 'ISSUE', quantity: 5, requestedBy: 'Rosa Registrar', department: 'Office of the Registrar', purpose: 'Document printing for enrollment period', balanceBefore: 23, balanceAfter: 18, createdAt: '2026-02-05T09:00:00Z' },
  { id: 'ctx_2', consumableId: 'cons_3', consumableName: 'Printer Ink (Black)', type: 'ISSUE', quantity: 1, requestedBy: 'Rosa Registrar', department: 'Office of the Registrar', purpose: 'Replacement for depleted toner', balanceBefore: 5, balanceAfter: 4, createdAt: '2026-02-03T10:00:00Z' },
  { id: 'ctx_3', consumableId: 'cons_2', consumableName: 'Bond Paper (A4)', type: 'RESTOCK', quantity: 20, requestedBy: 'Marco Dela Cruz', department: 'Asset Management', purpose: 'Monthly restocking from procurement', balanceBefore: 25, balanceAfter: 45, createdAt: '2026-02-01T08:00:00Z' },
  { id: 'ctx_4', consumableId: 'cons_4', consumableName: 'Ballpen (Black)', type: 'ISSUE', quantity: 2, requestedBy: 'Ana Admissions', department: 'Admissions Office', purpose: 'Applicant registration desk', balanceBefore: 10, balanceAfter: 8, createdAt: '2026-01-28T13:00:00Z' },
  { id: 'ctx_5', consumableId: 'cons_1', consumableName: 'Bond Paper (Short)', type: 'ISSUE', quantity: 3, requestedBy: 'Hannah Rodriguez', department: 'Human Resources', purpose: 'Employee contract printing', balanceBefore: 26, balanceAfter: 23, createdAt: '2026-01-25T14:00:00Z' },
  { id: 'ctx_6', consumableId: 'cons_5', consumableName: 'Disinfectant Spray', type: 'ISSUE', quantity: 3, requestedBy: 'Marco Dela Cruz', department: 'Asset Management', purpose: 'Laboratory and classroom cleaning', balanceBefore: 15, balanceAfter: 12, createdAt: '2026-01-22T09:00:00Z' },
]

export const MOCK_MAINTENANCE_LOGS: MaintenanceLog[] = [
  {
    id: 'mnt_1', assetId: 'ast_7', assetTag: 'IT-TAB-2026-0001', assetName: 'Apple iPad Air 5th Gen',
    maintenanceType: 'REPAIR', status: 'IN_PROGRESS',
    description: 'Battery swelling reported. Screen shows slight distortion near bottom. Requires battery replacement.',
    reportedBy: 'Dr. Maria Santos', assignedTo: 'Apple Authorized Service',
    startDate: '2026-02-08', cost: 4500,
    notes: 'Unit sent to Apple Premium Service Center — Quezon City branch. ETA: 7-10 business days.',
    createdAt: '2026-02-08T09:00:00Z',
  },
  {
    id: 'mnt_2', assetId: 'ast_4', assetTag: 'IT-PRINT-2026-0001', assetName: 'Canon LBP2900B Printer',
    maintenanceType: 'REPAIR', status: 'COMPLETED',
    description: 'Paper jam occurring frequently. Paper feed roller needs cleaning and replacement.',
    reportedBy: 'Rosa Registrar', assignedTo: 'Canon Service Center',
    startDate: '2025-11-10', completionDate: '2025-11-14', cost: 850,
    notes: 'Paper feed roller replaced. Drum unit cleaned. Test prints confirmed normal operation.',
    createdAt: '2025-11-10T10:00:00Z',
  },
  {
    id: 'mnt_3', assetId: 'ast_1', assetTag: 'IT-LAPTOP-2026-0001', assetName: 'Dell Latitude 5420',
    maintenanceType: 'PREVENTIVE', status: 'COMPLETED',
    description: 'Scheduled preventive maintenance — dust cleaning, thermal paste replacement, software updates.',
    reportedBy: 'Marco Dela Cruz', assignedTo: 'IT Services',
    startDate: '2026-02-05', completionDate: '2026-02-05', cost: 0,
    notes: 'Internal cleaning completed. Thermal paste replaced. All drivers and OS updated. Fan noise resolved.',
    createdAt: '2026-02-05T08:00:00Z',
  },
]

export const MOCK_ASSET_TAG_FORMATS: AssetTagFormat[] = [
  {
    id: 'fmt_1', name: 'Default IT Format',
    components: [
      { type: 'PREFIX', value: 'IT' },
      { type: 'CATEGORY' },
      { type: 'YEAR' },
      { type: 'SEQUENCE', width: 4 },
    ],
    separator: '-', preview: 'IT-LAPTOP-2026-0001', isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'fmt_2', name: 'Department Code Format',
    components: [
      { type: 'DEPT_CODE' },
      { type: 'CATEGORY' },
      { type: 'YEAR' },
      { type: 'SEQUENCE', width: 4 },
    ],
    separator: '-', preview: 'COC-LAPTOP-2026-0001', isDefault: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

// ─── Financial Operations Suite ───────────────────────────────────────────────

export const MOCK_VENDORS: Vendor[] = [
  { id:'v_1', name:'TechSupply Philippines', contactPerson:'Jose Reyes', phone:'09171234567', email:'sales@techsupply.ph', address:'Quezon City', category:'IT', status:'ACTIVE', tin:'123-456-789', schoolId:'school_1', createdAt:'2024-01-15T00:00:00Z' },
  { id:'v_2', name:'MediSource Corp', contactPerson:'Maria Santos', phone:'09182345678', email:'orders@medisource.com', address:'Makati City', category:'MEDICAL', status:'ACTIVE', tin:'234-567-890', schoolId:'school_1', createdAt:'2024-02-01T00:00:00Z' },
  { id:'v_3', name:'OfficePlus Inc', contactPerson:'Pedro Cruz', phone:'09193456789', email:'pedro@officeplus.com', address:'Mandaluyong', category:'SUPPLIES', status:'ACTIVE', tin:'345-678-901', schoolId:'school_1', createdAt:'2024-01-20T00:00:00Z' },
  { id:'v_4', name:'BuildRight Construction', contactPerson:'Ana Villanueva', phone:'09204567890', email:'ana@buildright.ph', address:'Pasig City', category:'CONSTRUCTION', status:'ACTIVE', tin:'456-789-012', schoolId:'school_1', createdAt:'2024-03-10T00:00:00Z' },
  { id:'v_5', name:'FoodPro Catering', contactPerson:'Lito Mendoza', phone:'09215678901', email:'lito@foodpro.ph', address:'Taguig City', category:'FOOD', status:'INACTIVE', tin:'567-890-123', schoolId:'school_1', createdAt:'2024-04-05T00:00:00Z' },
]

export const MOCK_PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id:'pr_1', prNumber:'PR-2025-00001', title:'Laboratory Equipment Procurement',
    department:'College of Computing', requestedBy:'u_dean_computing', requestedByName:'Dean Computing',
    items:[
      { id:'pri_1a', name:'Desktop Computer (Core i7)', quantity:10, unit:'unit', estimatedCost:45000, description:'For computer lab upgrade' },
      { id:'pri_1b', name:'24" Monitor', quantity:10, unit:'unit', estimatedCost:8500, description:'Full HD monitors' },
    ],
    totalAmount:535000, purpose:'Upgrade computer laboratory for AY 2025-2026',
    priority:'HIGH', status:'APPROVED',
    budgetId:'bud_1', reservationId:'br_1',
    approvalChain:[
      { step:1, role:'ACCOUNTING', approverName:'Clara Accounting', status:'APPROVED', timestamp:'2025-01-10T09:00:00Z' },
      { step:2, role:'PURCHASING_OFFICER', approverName:'Mark Purchasing', status:'APPROVED', timestamp:'2025-01-11T10:00:00Z' },
    ],
    purchaseOrderId:'po_1',
    schoolId:'school_1', createdAt:'2025-01-08T00:00:00Z', updatedAt:'2025-01-11T00:00:00Z',
    submittedAt:'2025-01-08T08:00:00Z', approvedAt:'2025-01-11T10:00:00Z',
  },
  {
    id:'pr_2', prNumber:'PR-2025-00002', title:'Medical Supplies Restock',
    department:'College of Nursing', requestedBy:'u_dean_nursing', requestedByName:'Dean Nursing',
    items:[
      { id:'pri_2a', name:'Surgical Gloves (Box)', quantity:100, unit:'box', estimatedCost:250, description:'Latex-free' },
      { id:'pri_2b', name:'Face Mask N95', quantity:200, unit:'box', estimatedCost:800, description:'NIOSH certified' },
      { id:'pri_2c', name:'Simulation Manikin', quantity:2, unit:'unit', estimatedCost:45000, description:'For clinical skills lab' },
    ],
    totalAmount:251000, purpose:'Clinical lab supplies for 1st Semester 2025-2026',
    priority:'URGENT', status:'PROCUREMENT_ONGOING',
    budgetId:'bud_3', reservationId:'br_2',
    approvalChain:[
      { step:1, role:'ACCOUNTING', approverName:'Clara Accounting', status:'APPROVED', timestamp:'2025-02-05T09:00:00Z' },
      { step:2, role:'PURCHASING_OFFICER', approverName:'Mark Purchasing', status:'APPROVED', timestamp:'2025-02-06T10:00:00Z' },
    ],
    purchaseOrderId:'po_2',
    schoolId:'school_1', createdAt:'2025-02-03T00:00:00Z', updatedAt:'2025-02-06T00:00:00Z',
    submittedAt:'2025-02-03T08:00:00Z', approvedAt:'2025-02-06T10:00:00Z',
  },
  {
    id:'pr_3', prNumber:'PR-2025-00003', title:'Office Supplies — Business Dept',
    department:'College of Business', requestedBy:'u_dean_business', requestedByName:'Dean Business',
    items:[
      { id:'pri_3a', name:'Bond Paper (Ream)', quantity:50, unit:'ream', estimatedCost:280, description:'A4, 80gsm' },
      { id:'pri_3b', name:'Printer Ink Set', quantity:5, unit:'set', estimatedCost:1200, description:'For department printers' },
    ],
    totalAmount:20000, purpose:'Monthly office supplies for department operations',
    priority:'NORMAL', status:'SUBMITTED',
    budgetId:'bud_2', reservationId:'br_3',
    approvalChain:[
      { step:1, role:'ACCOUNTING', status:'PENDING' },
      { step:2, role:'PURCHASING_OFFICER', status:'PENDING' },
    ],
    schoolId:'school_1', createdAt:'2025-03-01T00:00:00Z', updatedAt:'2025-03-01T00:00:00Z',
    submittedAt:'2025-03-01T08:00:00Z',
  },
  {
    id:'pr_4', prNumber:'PR-2025-00004', title:'Theater Equipment — Arts Dept',
    department:'Arts & Sciences', requestedBy:'u_dean_arts', requestedByName:'Dean Arts',
    items:[
      { id:'pri_4a', name:'Stage Lighting Kit', quantity:1, unit:'set', estimatedCost:35000, description:'LED stage lights' },
    ],
    totalAmount:35000, purpose:'Theater production upgrade for performing arts program',
    priority:'LOW', status:'UNDER_REVIEW',
    budgetId:'bud_4', reservationId:'br_4',
    approvalChain:[
      { step:1, role:'ACCOUNTING', approverName:'Clara Accounting', status:'APPROVED', timestamp:'2025-03-05T09:00:00Z' },
      { step:2, role:'PURCHASING_OFFICER', status:'PENDING' },
    ],
    schoolId:'school_1', createdAt:'2025-03-03T00:00:00Z', updatedAt:'2025-03-05T00:00:00Z',
    submittedAt:'2025-03-03T08:00:00Z',
  },
  {
    id:'pr_5', prNumber:'PR-2025-00005', title:'Network Infrastructure Upgrade',
    department:'College of Computing', requestedBy:'u_dean_computing', requestedByName:'Dean Computing',
    items:[
      { id:'pri_5a', name:'Managed Switch 48-port', quantity:3, unit:'unit', estimatedCost:28000, description:'Cisco Catalyst' },
      { id:'pri_5b', name:'CAT6 Cable (Box)', quantity:5, unit:'box', estimatedCost:3500, description:'305m per box' },
    ],
    totalAmount:101500, purpose:'Upgrade campus network infrastructure',
    priority:'HIGH', status:'REJECTED',
    budgetId:'bud_1',
    approvalChain:[
      { step:1, role:'ACCOUNTING', approverName:'Clara Accounting', status:'REJECTED', comments:'Exceeds remaining Q1 budget allocation', timestamp:'2025-03-10T09:00:00Z' },
    ],
    rejectionReason:'Exceeds remaining Q1 budget allocation. Please resubmit in Q2.',
    rejectedAt:'2025-03-10T09:00:00Z',
    schoolId:'school_1', createdAt:'2025-03-08T00:00:00Z', updatedAt:'2025-03-10T00:00:00Z',
    submittedAt:'2025-03-08T08:00:00Z',
  },
]

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id:'po_1', poNumber:'PO-2025-00001', prId:'pr_1', vendorId:'v_1', vendorName:'TechSupply Philippines',
    items:[
      { id:'poi_1a', name:'Desktop Computer (Core i7)', quantity:10, unit:'unit', unitPrice:45000, total:450000 },
      { id:'poi_1b', name:'24" Monitor', quantity:10, unit:'unit', unitPrice:8500, total:85000 },
    ],
    totalAmount:535000, status:'DELIVERED', deliveryDate:'2025-02-15', deliveredAt:'2025-02-14T14:00:00Z',
    terms:'Net 30 days', notes:'All items received in good condition.',
    createdBy:'Mark Purchasing', schoolId:'school_1', createdAt:'2025-01-15T00:00:00Z', updatedAt:'2025-02-14T00:00:00Z',
  },
  {
    id:'po_2', poNumber:'PO-2025-00002', prId:'pr_2', vendorId:'v_2', vendorName:'MediSource Corp',
    items:[
      { id:'poi_2a', name:'Surgical Gloves (Box)', quantity:100, unit:'box', unitPrice:250, total:25000 },
      { id:'poi_2b', name:'Face Mask N95', quantity:200, unit:'box', unitPrice:800, total:160000 },
      { id:'poi_2c', name:'Simulation Manikin', quantity:2, unit:'unit', unitPrice:45000, total:90000 },
    ],
    totalAmount:275000, status:'CONFIRMED', deliveryDate:'2025-03-20',
    terms:'50% downpayment, 50% on delivery',
    createdBy:'Mark Purchasing', schoolId:'school_1', createdAt:'2025-02-10T00:00:00Z', updatedAt:'2025-02-10T00:00:00Z',
  },
]

export const MOCK_OFFICIAL_RECEIPTS: OfficialReceipt[] = [
  { id:'or_1', orNumber:'OR-2025-00001', studentId:'st_001', studentName:'Angela Reyes', studentNo:'2025-00001', amount:28500, paymentType:'Tuition Fee', semesterId:'sem_1', soaId:'soa_001', issuedBy:'Treasury Staff', issuedAt:'2025-08-20T10:00:00Z', schoolId:'school_1' },
  { id:'or_2', orNumber:'OR-2025-00002', studentId:'st_002', studentName:'Marco Santos', studentNo:'2025-00002', amount:28500, paymentType:'Tuition Fee', semesterId:'sem_1', issuedBy:'Treasury Staff', issuedAt:'2025-08-21T09:30:00Z', schoolId:'school_1' },
  { id:'or_3', orNumber:'OR-2025-00003', studentId:'st_003', studentName:'Bianca Garcia', studentNo:'2025-00003', amount:15000, paymentType:'Partial Payment', semesterId:'sem_1', issuedBy:'Treasury Staff', issuedAt:'2025-08-21T11:00:00Z', schoolId:'school_1' },
  { id:'or_4', orNumber:'OR-2025-00004', studentId:'st_004', studentName:'Joshua Cruz', studentNo:'2025-00004', amount:28500, paymentType:'Tuition Fee', semesterId:'sem_1', issuedBy:'Treasury Staff', issuedAt:'2025-08-22T08:45:00Z', schoolId:'school_1' },
  { id:'or_5', orNumber:'OR-2025-00005', studentId:'st_005', studentName:'Katrina Villanueva', studentNo:'2025-00005', amount:5000, paymentType:'Miscellaneous Fee', semesterId:'sem_1', issuedBy:'Treasury Staff', issuedAt:'2025-08-22T14:20:00Z', schoolId:'school_1' },
]

let _orSeq = 6
export function nextORNumber(): string { return `OR-2025-${String(_orSeq++).padStart(5,'0')}` }

export const MOCK_CASHFLOW: CashflowEntry[] = [
  { id:'cf_1', type:'INFLOW', amount:285000, description:'Tuition collection batch — August 20', reference:'OR-2025-00001', category:'Tuition', date:'2025-08-20', schoolId:'school_1', createdAt:'2025-08-20T18:00:00Z' },
  { id:'cf_2', type:'OUTFLOW', amount:85000, description:'Lab equipment — Computing Dept', reference:'PO-2025-00001', category:'Procurement', date:'2025-01-15', schoolId:'school_1', createdAt:'2025-01-15T18:00:00Z' },
  { id:'cf_3', type:'INFLOW', amount:142500, description:'Tuition collection batch — August 21', reference:'OR-2025-00002', category:'Tuition', date:'2025-08-21', schoolId:'school_1', createdAt:'2025-08-21T18:00:00Z' },
  { id:'cf_4', type:'OUTFLOW', amount:120000, description:'Medical supplies — Nursing Dept', reference:'PO-2025-00002', category:'Procurement', date:'2025-02-10', schoolId:'school_1', createdAt:'2025-02-10T18:00:00Z' },
  { id:'cf_5', type:'OUTFLOW', amount:380000, description:'Faculty payroll — January 2025', reference:'PAY-2025-01', category:'Payroll', date:'2025-01-31', schoolId:'school_1', createdAt:'2025-01-31T18:00:00Z' },
  { id:'cf_6', type:'INFLOW', amount:95000, description:'Miscellaneous fees collection', reference:'OR-2025-00005', category:'Miscellaneous', date:'2025-08-22', schoolId:'school_1', createdAt:'2025-08-22T18:00:00Z' },
  { id:'cf_7', type:'OUTFLOW', amount:45000, description:'Utilities — February 2025', reference:'UTIL-2025-02', category:'Utilities', date:'2025-02-28', schoolId:'school_1', createdAt:'2025-02-28T18:00:00Z' },
  { id:'cf_8', type:'OUTFLOW', amount:380000, description:'Faculty payroll — February 2025', reference:'PAY-2025-02', category:'Payroll', date:'2025-02-28', schoolId:'school_1', createdAt:'2025-02-28T18:00:00Z' },
]

export const MOCK_FIN_EXPENSES: FinancialExpense[] = [
  { id:'fe_1', title:'Lab Equipment Purchase', category:'PROCUREMENT', department:'College of Computing', amount:535000, vendor:'TechSupply Philippines', date:'2025-01-15', description:'Computer lab upgrade — 10 desktops + monitors', prId:'pr_1', poId:'po_1', status:'PAID', approvedBy:'Clara Accounting', approvedAt:'2025-01-11T10:00:00Z', schoolId:'school_1', createdAt:'2025-01-15T00:00:00Z', createdBy:'Mark Purchasing' },
  { id:'fe_2', title:'Medical Supplies Procurement', category:'PROCUREMENT', department:'College of Nursing', amount:275000, vendor:'MediSource Corp', date:'2025-02-10', description:'Clinical lab supplies and simulation manikins', prId:'pr_2', poId:'po_2', status:'APPROVED', approvedBy:'Clara Accounting', approvedAt:'2025-02-06T10:00:00Z', schoolId:'school_1', createdAt:'2025-02-10T00:00:00Z', createdBy:'Mark Purchasing' },
  { id:'fe_3', title:'Faculty Payroll — January 2025', category:'PAYROLL', amount:380000, date:'2025-01-31', description:'Monthly faculty and staff payroll', status:'PAID', approvedBy:'Clara Accounting', approvedAt:'2025-01-30T09:00:00Z', schoolId:'school_1', createdAt:'2025-01-31T00:00:00Z', createdBy:'Clara Accounting' },
  { id:'fe_4', title:'Utilities — February 2025', category:'UTILITIES', amount:45000, date:'2025-02-28', description:'Electricity, water, internet', status:'PAID', approvedBy:'Clara Accounting', approvedAt:'2025-02-27T09:00:00Z', schoolId:'school_1', createdAt:'2025-02-28T00:00:00Z', createdBy:'Clara Accounting' },
  { id:'fe_5', title:'Office Supplies — Q1', category:'OPERATIONAL', department:'Administration', amount:18500, vendor:'OfficePlus Inc', date:'2025-01-10', description:'Stationery, paper, toner', status:'PAID', approvedBy:'Clara Accounting', approvedAt:'2025-01-09T09:00:00Z', schoolId:'school_1', createdAt:'2025-01-10T00:00:00Z', createdBy:'Clara Accounting' },
]

export const MOCK_BUDGET_RESERVATIONS: BudgetReservation[] = [
  { id:'br_1', budgetId:'bud_1', prId:'pr_1', prNumber:'PR-2025-00001', department:'College of Computing', amount:535000, status:'CONVERTED', createdAt:'2025-01-08T08:00:00Z', convertedAt:'2025-01-15T00:00:00Z' },
  { id:'br_2', budgetId:'bud_3', prId:'pr_2', prNumber:'PR-2025-00002', department:'College of Nursing', amount:275000, status:'ACTIVE', createdAt:'2025-02-03T08:00:00Z' },
  { id:'br_3', budgetId:'bud_2', prId:'pr_3', prNumber:'PR-2025-00003', department:'College of Business', amount:20000, status:'ACTIVE', createdAt:'2025-03-01T08:00:00Z' },
  { id:'br_4', budgetId:'bud_4', prId:'pr_4', prNumber:'PR-2025-00004', department:'Arts & Sciences', amount:35000, status:'ACTIVE', createdAt:'2025-03-03T08:00:00Z' },
]

// ─── Universal Requests ───────────────────────────────────────────────────────

export const MOCK_REQUESTS: UniversalRequest[] = [
  {
    id: 'req_1', reqNumber: 'REQ-2025-00001', category: 'LEAVE', type: 'VACATION_LEAVE',
    title: 'Vacation Leave — May 20–22', status: 'APPROVED', priority: 'NORMAL',
    submittedBy: 'u_teacher', submittedByName: 'Prof. Santos', submittedByRole: 'TEACHER', portal: 'teacher',
    championDept: 'HR', assignedToName: 'HR Staff',
    formData: { leaveType: 'VACATION_LEAVE', startDate: '2025-05-20', endDate: '2025-05-22', reason: 'Family vacation', emergencyContact: '09171234567' },
    activities: [
      { id: 'ra_1a', action: 'Request Submitted', performedBy: 'Prof. Santos', performedByRole: 'TEACHER', timestamp: '2025-05-10T09:00:00Z' },
      { id: 'ra_1b', action: 'Under Review by HR', performedBy: 'HR Staff', performedByRole: 'HR_STAFF', timestamp: '2025-05-11T10:00:00Z' },
      { id: 'ra_1c', action: 'Approved', performedBy: 'HR Staff', performedByRole: 'HR_STAFF', timestamp: '2025-05-12T09:30:00Z', remarks: 'Approved. Enjoy your leave.' },
    ],
    schoolId: 'school_1', createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-12T09:30:00Z',
    submittedAt: '2025-05-10T09:00:00Z',
  },
  {
    id: 'req_2', reqNumber: 'REQ-2025-00002', category: 'ASSET', type: 'LAPTOP_REQUEST',
    title: 'Laptop Request for Online Teaching', status: 'SUBMITTED', priority: 'HIGH',
    submittedBy: 'u_teacher', submittedByName: 'Prof. Santos', submittedByRole: 'TEACHER', portal: 'teacher',
    championDept: 'AMO', assignedToName: 'Asset Management',
    formData: { assetType: 'Laptop', purpose: 'Online teaching and grading', deploymentDate: '2025-06-01', returnDate: '2025-12-31', department: 'College of Computing', justification: 'Current unit is malfunctioning' },
    activities: [
      { id: 'ra_2a', action: 'Request Submitted', performedBy: 'Prof. Santos', performedByRole: 'TEACHER', timestamp: '2025-05-13T08:00:00Z' },
    ],
    schoolId: 'school_1', createdAt: '2025-05-13T08:00:00Z', updatedAt: '2025-05-13T08:00:00Z',
    submittedAt: '2025-05-13T08:00:00Z',
  },
  {
    id: 'req_3', reqNumber: 'REQ-2025-00003', category: 'LEAVE', type: 'SICK_LEAVE',
    title: 'Sick Leave — May 15', status: 'UNDER_REVIEW', priority: 'NORMAL',
    submittedBy: 'u_hr', submittedByName: 'HR Staff', submittedByRole: 'HR_STAFF', portal: 'staff',
    championDept: 'HR', assignedToName: 'HR Staff',
    formData: { leaveType: 'SICK_LEAVE', startDate: '2025-05-15', endDate: '2025-05-15', reason: 'Fever and flu', emergencyContact: '09182345678' },
    activities: [
      { id: 'ra_3a', action: 'Request Submitted', performedBy: 'HR Staff', performedByRole: 'HR_STAFF', timestamp: '2025-05-14T07:30:00Z' },
      { id: 'ra_3b', action: 'Under Review', performedBy: 'Admin', performedByRole: 'SUPER_ADMIN', timestamp: '2025-05-14T09:00:00Z' },
    ],
    schoolId: 'school_1', createdAt: '2025-05-14T07:30:00Z', updatedAt: '2025-05-14T09:00:00Z',
    submittedAt: '2025-05-14T07:30:00Z',
  },
  {
    id: 'req_4', reqNumber: 'REQ-2025-00004', category: 'ASSET', type: 'PC_REQUEST',
    title: 'Desktop PC for Online Classes', status: 'SUBMITTED', priority: 'NORMAL',
    submittedBy: 'u_student', submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT', portal: 'student',
    championDept: 'AMO', assignedToName: 'Asset Management',
    formData: { assetType: 'Desktop PC', purpose: 'Online classes and research', deploymentDate: '2025-05-20', returnDate: '2025-08-31', department: 'College of Computing', justification: 'No personal computer for online classes' },
    activities: [
      { id: 'ra_4a', action: 'Request Submitted', performedBy: 'Ethan Dela Cruz', performedByRole: 'STUDENT', timestamp: '2025-05-13T14:00:00Z' },
    ],
    schoolId: 'school_1', createdAt: '2025-05-13T14:00:00Z', updatedAt: '2025-05-13T14:00:00Z',
    submittedAt: '2025-05-13T14:00:00Z',
  },
  {
    id: 'req_5', reqNumber: 'REQ-2025-00005', category: 'PURCHASE', type: 'SUPPLY_REQUEST',
    title: 'Whiteboard Markers & Supplies', status: 'COMPLETED', priority: 'LOW',
    submittedBy: 'u_registrar', submittedByName: 'Registrar', submittedByRole: 'REGISTRAR', portal: 'staff',
    championDept: 'PURCHASING', assignedToName: 'Purchasing Officer',
    formData: { itemName: 'Whiteboard Markers (Box)', quantity: '10', estimatedCost: '2500', purpose: 'Daily classroom use', priority: 'LOW' },
    activities: [
      { id: 'ra_5a', action: 'Request Submitted', performedBy: 'Registrar', performedByRole: 'REGISTRAR', timestamp: '2025-04-01T08:00:00Z' },
      { id: 'ra_5b', action: 'Approved by Purchasing', performedBy: 'Mark Purchasing', performedByRole: 'PURCHASING_OFFICER', timestamp: '2025-04-02T09:00:00Z' },
      { id: 'ra_5c', action: 'Completed — Items Delivered', performedBy: 'Mark Purchasing', performedByRole: 'PURCHASING_OFFICER', timestamp: '2025-04-05T14:00:00Z', remarks: 'All items delivered and signed for.' },
    ],
    schoolId: 'school_1', createdAt: '2025-04-01T08:00:00Z', updatedAt: '2025-04-05T14:00:00Z',
    submittedAt: '2025-04-01T08:00:00Z', completedAt: '2025-04-05T14:00:00Z',
  },
]

let _reqSeq = 6
export function nextReqNumber(): string { return `REQ-2025-${String(_reqSeq++).padStart(5, '0')}` }

// ─── Support Center ───────────────────────────────────────────────────────────

function slaDeadline(createdAt: string, priority: TicketPriority): string {
  const hours = { LOW: 48, MEDIUM: 24, HIGH: 8, CRITICAL: 1 }
  const d = new Date(createdAt)
  d.setHours(d.getHours() + hours[priority])
  return d.toISOString()
}

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_1', ticketNumber: 'TKT-2025-00001',
    subject: 'Cannot access LMS — Quiz not loading',
    description: 'I am unable to access my quiz in CS101. The page shows a blank screen after clicking the quiz link. This has been happening since yesterday and the quiz deadline is tomorrow.',
    category: 'LMS_ACCESS_ISSUE', department: 'ACADEMIC', status: 'IN_PROGRESS',
    priority: 'HIGH',
    submittedBy: 'u_student', submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT', portal: 'student',
    assignedTo: 'u_academic', assignedToName: 'Academic Admin',
    replies: [
      { id: 'tr_1a', ticketId: 'tkt_1', authorId: 'u_student', authorName: 'Ethan Dela Cruz', authorRole: 'STUDENT', content: 'I am unable to access my quiz in CS101. The page shows a blank screen after clicking the quiz link. This has been happening since yesterday and the quiz deadline is tomorrow.', isInternal: false, isStaff: false, createdAt: '2025-05-10T09:00:00Z' },
      { id: 'tr_1b', ticketId: 'tkt_1', authorId: 'u_academic', authorName: 'Academic Admin', authorRole: 'ACADEMIC_ADMIN', content: 'Thank you for reaching out. We have received your concern and are investigating the issue with the LMS quiz loading. We will update you within the next few hours.', isInternal: false, isStaff: true, createdAt: '2025-05-10T10:30:00Z' },
      { id: 'tr_1c', ticketId: 'tkt_1', authorId: 'u_academic', authorName: 'Academic Admin', authorRole: 'ACADEMIC_ADMIN', content: 'Internal: Checking with Prof. Santos if the quiz was published correctly. Possible browser cache issue.', isInternal: true, isStaff: true, createdAt: '2025-05-10T10:35:00Z' },
    ],
    slaDeadline: slaDeadline('2025-05-10T09:00:00Z', 'HIGH'),
    firstResponseAt: '2025-05-10T10:30:00Z',
    schoolId: 'school_1', createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-10T10:35:00Z',
    tags: ['LMS', 'quiz', 'access'],
  },
  {
    id: 'tkt_2', ticketNumber: 'TKT-2025-00002',
    subject: 'Request for Official Transcript of Records',
    description: 'I would like to request a copy of my Official Transcript of Records (TOR) for job application purposes. Please let me know the requirements and processing time.',
    category: 'TOR_INQUIRY', department: 'REGISTRAR', status: 'OPEN',
    priority: 'MEDIUM',
    submittedBy: 'u_student', submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT', portal: 'student',
    replies: [
      { id: 'tr_2a', ticketId: 'tkt_2', authorId: 'u_student', authorName: 'Ethan Dela Cruz', authorRole: 'STUDENT', content: 'I would like to request a copy of my Official Transcript of Records (TOR) for job application purposes.', isInternal: false, isStaff: false, createdAt: '2025-05-12T14:00:00Z' },
    ],
    slaDeadline: slaDeadline('2025-05-12T14:00:00Z', 'MEDIUM'),
    schoolId: 'school_1', createdAt: '2025-05-12T14:00:00Z', updatedAt: '2025-05-12T14:00:00Z',
    tags: ['TOR', 'documents'],
  },
  {
    id: 'tkt_3', ticketNumber: 'TKT-2025-00003',
    subject: 'Discrepancy in Final Grade — CS201',
    description: 'My final grade in CS201 shows 72 (FAILED) but based on my computation using the grade criteria, I should have passed with a grade of 76. I am requesting a grade review.',
    category: 'GRADES_CONCERN', department: 'ACADEMIC', status: 'UNDER_REVIEW',
    priority: 'HIGH',
    submittedBy: 'u_student', submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT', portal: 'student',
    assignedTo: 'u_academic', assignedToName: 'Academic Admin',
    replies: [
      { id: 'tr_3a', ticketId: 'tkt_3', authorId: 'u_student', authorName: 'Ethan Dela Cruz', authorRole: 'STUDENT', content: 'My final grade shows 72 but based on my computation I should have passed with 76.', isInternal: false, isStaff: false, createdAt: '2025-05-08T08:00:00Z' },
      { id: 'tr_3b', ticketId: 'tkt_3', authorId: 'u_academic', authorName: 'Academic Admin', authorRole: 'ACADEMIC_ADMIN', content: 'We have received your grade concern and have forwarded it to Prof. Santos for review. Please allow 3-5 business days for a response.', isInternal: false, isStaff: true, createdAt: '2025-05-08T09:00:00Z' },
    ],
    slaDeadline: slaDeadline('2025-05-08T08:00:00Z', 'HIGH'),
    firstResponseAt: '2025-05-08T09:00:00Z',
    schoolId: 'school_1', createdAt: '2025-05-08T08:00:00Z', updatedAt: '2025-05-08T09:00:00Z',
    tags: ['grades', 'review', 'CS201'],
  },
  {
    id: 'tkt_4', ticketNumber: 'TKT-2025-00004',
    subject: 'Payment Not Reflected in Account',
    description: 'I paid my tuition fee last May 5, 2025 via GCash (Reference: GC20250505XXXX) but it is still not reflected in my student account. Please check the status.',
    category: 'PAYMENT_CONCERN', department: 'TREASURY', status: 'RESOLVED',
    priority: 'MEDIUM',
    submittedBy: 'u_student', submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT', portal: 'student',
    assignedTo: 'u_treasury', assignedToName: 'Treasury Office',
    replies: [
      { id: 'tr_4a', ticketId: 'tkt_4', authorId: 'u_student', authorName: 'Ethan Dela Cruz', authorRole: 'STUDENT', content: 'Payment via GCash (Ref: GC20250505XXXX) not yet reflected in my account.', isInternal: false, isStaff: false, createdAt: '2025-05-06T10:00:00Z' },
      { id: 'tr_4b', ticketId: 'tkt_4', authorId: 'u_treasury', authorName: 'Treasury Staff', authorRole: 'TREASURER', content: 'Thank you for the reference number. We have verified your payment and it has now been posted to your account. OR No. OR-2025-00006 has been issued.', isInternal: false, isStaff: true, createdAt: '2025-05-06T14:00:00Z' },
    ],
    slaDeadline: slaDeadline('2025-05-06T10:00:00Z', 'MEDIUM'),
    firstResponseAt: '2025-05-06T14:00:00Z',
    resolvedAt: '2025-05-06T14:00:00Z',
    satisfaction: { rating: 5, comment: 'Very fast resolution! Thank you.', submittedAt: '2025-05-06T15:00:00Z' },
    schoolId: 'school_1', createdAt: '2025-05-06T10:00:00Z', updatedAt: '2025-05-06T14:00:00Z',
    tags: ['payment', 'GCash'],
  },
  {
    id: 'tkt_5', ticketNumber: 'TKT-2025-00005',
    subject: 'Cannot login to portal — account locked',
    description: 'I am unable to login to my teacher portal account. The system says my account is locked. I have not changed my password recently.',
    category: 'LOGIN_ISSUE', department: 'IT_SUPPORT', status: 'OPEN',
    priority: 'HIGH',
    submittedBy: 'u_teacher', submittedByName: 'Prof. Santos', submittedByRole: 'TEACHER', portal: 'teacher',
    replies: [
      { id: 'tr_5a', ticketId: 'tkt_5', authorId: 'u_teacher', authorName: 'Prof. Santos', authorRole: 'TEACHER', content: 'I cannot login. Account shows as locked.', isInternal: false, isStaff: false, createdAt: '2025-05-13T07:00:00Z' },
    ],
    slaDeadline: slaDeadline('2025-05-13T07:00:00Z', 'HIGH'),
    schoolId: 'school_1', createdAt: '2025-05-13T07:00:00Z', updatedAt: '2025-05-13T07:00:00Z',
    tags: ['login', 'account'],
  },
]

let _tktSeq = 6
export function nextTicketNumber(): string { return `TKT-2025-${String(_tktSeq++).padStart(5, '0')}` }

export const MOCK_KB_ARTICLES: KBArticle[] = [
  {
    id: 'kb_1', title: 'How to Access Your LMS Courses', slug: 'lms-access-guide',
    category: 'LMS', tags: ['LMS', 'courses', 'access'],
    content: 'To access your courses:\n1. Log in to SchoolEco at your school portal.\n2. Click "My Subjects" in the left sidebar.\n3. Click any course card to enter the course.\n4. Access quizzes, assignments, and materials from the course page.\n\nIf you see a blank screen, try clearing your browser cache (Ctrl+Shift+Delete) and refreshing.',
    views: 342, helpful: 87, notHelpful: 4, publishedAt: '2025-01-10T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z',
  },
  {
    id: 'kb_2', title: 'How to Request Official Documents (TOR, COR, Good Moral)', slug: 'official-documents-request',
    category: 'Registrar', tags: ['TOR', 'COR', 'documents', 'registrar'],
    content: 'To request official documents:\n1. Submit a ticket via Support Center → "TOR / Document Inquiry" category.\n2. Provide your Student ID and purpose of request.\n3. Processing time: 3–5 business days.\n4. Pick up at the Registrar\'s Office or request email delivery.\n\nRequired information: Full name, Student ID, purpose, date needed.',
    views: 215, helpful: 71, notHelpful: 2, publishedAt: '2025-01-15T00:00:00Z', updatedAt: '2025-03-20T00:00:00Z',
  },
  {
    id: 'kb_3', title: 'How to View and Pay Your Statement of Account', slug: 'soa-payment-guide',
    category: 'Treasury', tags: ['SOA', 'payment', 'tuition'],
    content: 'To view your Statement of Account:\n1. Go to Student Portal → "SOA" in the sidebar.\n2. Your current balance and payment history are shown.\n3. Accepted payment methods: Cash (Treasury Office), GCash, Online Banking.\n4. After payment, submit your proof of payment as a support ticket under "Payment Concern" for immediate posting.\n\nPayments are typically reflected within 24 hours.',
    views: 189, helpful: 64, notHelpful: 1, publishedAt: '2025-02-01T00:00:00Z', updatedAt: '2025-04-10T00:00:00Z',
  },
  {
    id: 'kb_4', title: 'How to Submit a Quiz or Assignment', slug: 'lms-submission-guide',
    category: 'LMS', tags: ['quiz', 'assignment', 'LMS', 'submission'],
    content: 'To take a quiz:\n1. Go to My Subjects → select your course.\n2. Click "Quizzes" in the course sidebar.\n3. Click "Take Assessment" on an open quiz.\n4. Answer all questions before the timer ends.\n5. Click "Submit Exam" to finalize.\n\nFor assignments:\n1. Go to Assignments in your course.\n2. Click "Submit" on an open assignment.\n3. Enter your answer or upload your file.\n4. Click Submit.',
    views: 421, helpful: 156, notHelpful: 8, publishedAt: '2025-01-20T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'kb_5', title: 'Password Reset and Account Recovery', slug: 'password-reset',
    category: 'Technical', tags: ['password', 'login', 'account', 'reset'],
    content: 'If you cannot log in:\n1. Contact IT Support by submitting a ticket under "Login Issue" category.\n2. Provide your full name, email address, and employee/student ID.\n3. IT Support will reset your account within 1–2 hours during business hours.\n\nFor security, passwords cannot be reset via email automatically. All resets are done manually by IT staff.',
    views: 178, helpful: 52, notHelpful: 3, publishedAt: '2025-02-10T00:00:00Z', updatedAt: '2025-04-05T00:00:00Z',
  },
  {
    id: 'kb_6', title: 'How to Check Your Grades', slug: 'check-grades',
    category: 'Academic', tags: ['grades', 'student', 'academic'],
    content: 'To check your grades:\n1. Log in to the Student Portal.\n2. Click "My Grades" in the sidebar.\n3. Only officially published grades are shown.\n4. Grades appear after your professor submits and the Registrar publishes them.\n\nIf you believe there is a grade error, submit a support ticket under "Grades Concern" with your subject code and computation details.',
    views: 267, helpful: 89, notHelpful: 5, publishedAt: '2025-01-25T00:00:00Z', updatedAt: '2025-04-20T00:00:00Z',
  },
]

// ─── Form Builder ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: FormSettings = {
  oneSubmissionPerUser: false, allowAnonymous: false,
  autoCloseOnDeadline: false, showProgressBar: true,
  successMessage: 'Your response has been submitted successfully. Thank you!'
}

export const MOCK_FORMS: InstitutionalForm[] = [
  {
    id: 'form_1', title: 'Faculty Leave Request Form',
    description: 'Submit your leave requests through this form. HR will review within 1-2 business days.',
    department: 'Human Resources', createdBy: 'u_hr', createdByName: 'HR Staff',
    status: 'PUBLISHED', visibility: 'STAFF_ONLY', category: 'Request',
    tags: ['leave', 'HR', 'faculty'],
    fields: [
      { id: 'f1_1', type: 'SHORT_TEXT', label: 'Full Name', required: true, autoFillKey: 'full_name' },
      { id: 'f1_2', type: 'EMAIL', label: 'Email Address', required: true, autoFillKey: 'email' },
      { id: 'f1_3', type: 'DROPDOWN', label: 'Leave Type', required: true, options: ['Vacation Leave','Sick Leave','Maternity Leave','Paternity Leave','Emergency Leave','Official Business Leave'] },
      { id: 'f1_4', type: 'DATE', label: 'Start Date', required: true },
      { id: 'f1_5', type: 'DATE', label: 'End Date', required: true },
      { id: 'f1_6', type: 'LONG_TEXT', label: 'Reason for Leave', required: true, placeholder: 'Please provide details about your leave request...' },
      { id: 'f1_7', type: 'FILE_UPLOAD', label: 'Medical Certificate', required: false, acceptedFiles: ['.pdf','.jpg','.png'], condition: { fieldId: 'f1_3', operator: 'equals', value: 'Sick Leave' } },
      { id: 'f1_8', type: 'SHORT_TEXT', label: 'Emergency Contact Number', required: true },
    ],
    settings: { ...DEFAULT_SETTINGS, oneSubmissionPerUser: false, routeToDept: 'HR', successMessage: 'Leave request submitted. HR will review and respond within 1–2 business days.' },
    submissionCount: 7, schoolId: 'school_1', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z', publishedAt: '2025-04-01T00:00:00Z',
  },
  {
    id: 'form_2', title: 'Equipment Borrow Request',
    description: 'Request to borrow school equipment for academic or official purposes.',
    department: 'Asset Management', createdBy: 'u_amo', createdByName: 'AMO Staff',
    status: 'PUBLISHED', visibility: 'PUBLIC_INTERNAL', category: 'Request',
    tags: ['equipment', 'borrow', 'AMO'],
    fields: [
      { id: 'f2_1', type: 'SHORT_TEXT', label: 'Requestor Name', required: true, autoFillKey: 'full_name' },
      { id: 'f2_2', type: 'SHORT_TEXT', label: 'Department / Section', required: true, autoFillKey: 'department' },
      { id: 'f2_3', type: 'DROPDOWN', label: 'Equipment Type', required: true, options: ['Laptop','Desktop PC','Projector','Printer','Camera','Tablet','Router','Other'] },
      { id: 'f2_4', type: 'SHORT_TEXT', label: 'Specific Equipment / Model', required: false, placeholder: 'e.g. Dell Inspiron 15, Epson Projector' },
      { id: 'f2_5', type: 'DATE', label: 'Borrow Date', required: true },
      { id: 'f2_6', type: 'DATE', label: 'Return Date', required: true },
      { id: 'f2_7', type: 'LONG_TEXT', label: 'Purpose / Justification', required: true },
      { id: 'f2_8', type: 'RATING', label: 'How urgent is this request?', required: true, maxRating: 5 },
    ],
    settings: { ...DEFAULT_SETTINGS, routeToDept: 'AMO', successMessage: 'Equipment request submitted. AMO will check availability and respond shortly.' },
    submissionCount: 3, schoolId: 'school_1', createdAt: '2025-04-05T00:00:00Z', updatedAt: '2025-04-05T00:00:00Z', publishedAt: '2025-04-05T00:00:00Z',
  },
  {
    id: 'form_3', title: 'Student Feedback Form — 1st Semester 2025-2026',
    description: 'Share your feedback about your courses and learning experience this semester.',
    department: 'Academic Affairs', createdBy: 'u_academic', createdByName: 'Academic Admin',
    status: 'PUBLISHED', visibility: 'STUDENT_ONLY', category: 'Feedback',
    tags: ['feedback', 'student', 'academic'],
    fields: [
      { id: 'f3_1', type: 'DROPDOWN', label: 'Subject', required: true, options: ['CS101 - Intro to Programming','CS201 - Data Structures','MATH101 - Calculus I','GE101 - Purposive Communication','CS301 - Web Development'] },
      { id: 'f3_2', type: 'RATING', label: 'Overall course satisfaction', required: true, maxRating: 5 },
      { id: 'f3_3', type: 'RATING', label: 'Teaching quality', required: true, maxRating: 5 },
      { id: 'f3_4', type: 'RATING', label: 'Course materials & resources', required: true, maxRating: 5 },
      { id: 'f3_5', type: 'RADIO', label: 'Would you recommend this subject to others?', required: true, options: ['Definitely yes','Probably yes','Probably not','Definitely not'] },
      { id: 'f3_6', type: 'LONG_TEXT', label: 'What did you like most about this course?', required: false },
      { id: 'f3_7', type: 'LONG_TEXT', label: 'What can be improved?', required: false },
    ],
    settings: { ...DEFAULT_SETTINGS, allowAnonymous: true, successMessage: 'Thank you for your feedback! Your responses help us improve the learning experience.' },
    submissionCount: 12, schoolId: 'school_1', createdAt: '2025-05-01T00:00:00Z', updatedAt: '2025-05-01T00:00:00Z', publishedAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'form_4', title: 'Incident Report Form',
    description: 'Report any incident, accident, or concern that occurred on campus.',
    department: 'Administration', createdBy: 'u_admin', createdByName: 'Super Admin',
    status: 'PUBLISHED', visibility: 'PUBLIC_INTERNAL', category: 'Incident Report',
    tags: ['incident', 'safety', 'admin'],
    fields: [
      { id: 'f4_1', type: 'SHORT_TEXT', label: 'Reporter Name', required: true, autoFillKey: 'full_name' },
      { id: 'f4_2', type: 'DATE', label: 'Date of Incident', required: true },
      { id: 'f4_3', type: 'TIME', label: 'Time of Incident', required: true },
      { id: 'f4_4', type: 'SHORT_TEXT', label: 'Location / Area', required: true },
      { id: 'f4_5', type: 'DROPDOWN', label: 'Incident Type', required: true, options: ['Accident / Injury','Property Damage','Security Concern','Health Emergency','Fire / Hazard','Theft','Other'] },
      { id: 'f4_6', type: 'LONG_TEXT', label: 'Detailed Description of Incident', required: true },
      { id: 'f4_7', type: 'LONG_TEXT', label: 'Immediate Actions Taken', required: false },
      { id: 'f4_8', type: 'FILE_UPLOAD', label: 'Supporting Documents / Photos', required: false, acceptedFiles: ['.pdf','.jpg','.jpeg','.png'] },
    ],
    settings: { ...DEFAULT_SETTINGS, allowAnonymous: true, routeToDept: 'ADMIN', successMessage: 'Incident report submitted. Administration will follow up within 24 hours.' },
    submissionCount: 2, schoolId: 'school_1', createdAt: '2025-03-15T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z', publishedAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 'form_5', title: 'New Employee IT Access Request',
    description: 'Request IT system access and credentials for new employees.',
    department: 'Human Resources', createdBy: 'u_hr', createdByName: 'HR Staff',
    status: 'DRAFT', visibility: 'STAFF_ONLY', category: 'Request',
    tags: ['IT', 'HR', 'access', 'onboarding'],
    fields: [
      { id: 'f5_1', type: 'SHORT_TEXT', label: 'Employee Full Name', required: true },
      { id: 'f5_2', type: 'EMAIL', label: 'Personal Email (for account setup)', required: true },
      { id: 'f5_3', type: 'DROPDOWN', label: 'Position / Role', required: true, options: ['Faculty','Administrative Staff','Dean','Department Head','IT Staff','Support Staff'] },
      { id: 'f5_4', type: 'SHORT_TEXT', label: 'Department', required: true },
      { id: 'f5_5', type: 'DATE', label: 'Start Date', required: true },
      { id: 'f5_6', type: 'MULTI_SELECT', label: 'Required System Access', required: true, options: ['Student Information System','LMS','Email','Payroll','Document Management','HR Portal','Finance System'] },
    ],
    settings: { ...DEFAULT_SETTINGS, routeToDept: 'IT_SUPPORT', successMessage: 'Access request submitted. IT will set up accounts within 24–48 hours.' },
    submissionCount: 0, schoolId: 'school_1', createdAt: '2025-05-10T00:00:00Z', updatedAt: '2025-05-10T00:00:00Z',
  },
]

export const MOCK_FORM_SUBMISSIONS: FormSubmission[] = [
  {
    id: 'fsub_1', formId: 'form_1', formTitle: 'Faculty Leave Request Form',
    submittedBy: 'u_teacher', submittedByName: 'Prof. Santos', submittedByRole: 'TEACHER',
    responses: { f1_1:'Prof. Santos', f1_2:'prof.santos@school.edu', f1_3:'Vacation Leave', f1_4:'2025-05-20', f1_5:'2025-05-22', f1_6:'Family vacation planned months ago.', f1_8:'09171234567' },
    status: 'APPROVED', schoolId: 'school_1', submittedAt: '2025-05-10T09:00:00Z', reviewedAt: '2025-05-11T09:00:00Z', reviewedBy: 'HR Staff',
  },
  {
    id: 'fsub_2', formId: 'form_2', formTitle: 'Equipment Borrow Request',
    submittedBy: 'u_teacher', submittedByName: 'Prof. Santos', submittedByRole: 'TEACHER',
    responses: { f2_1:'Prof. Santos', f2_2:'College of Computing', f2_3:'Projector', f2_5:'2025-05-15', f2_6:'2025-05-15', f2_7:'Needed for thesis defense presentation.', f2_8:4 },
    status: 'SUBMITTED', schoolId: 'school_1', submittedAt: '2025-05-13T08:00:00Z',
  },
  {
    id: 'fsub_3', formId: 'form_3', formTitle: 'Student Feedback Form',
    submittedBy: 'u_student', submittedByName: 'Ethan Dela Cruz', submittedByRole: 'STUDENT',
    responses: { f3_1:'CS101 - Intro to Programming', f3_2:5, f3_3:4, f3_4:4, f3_5:'Definitely yes', f3_6:'Very engaging lectures and practical labs.', f3_7:'More practice problems would help.' },
    status: 'COMPLETED', schoolId: 'school_1', submittedAt: '2025-05-05T14:00:00Z',
  },
]

let _formSeq = 6
export function nextFormId(): string { return `form_${_formSeq++}` }
let _fsubSeq = 4
export function nextFsubId(): string { return `fsub_${_fsubSeq++}` }

// ─── Chart of Accounts ────────────────────────────────────────────────────────
export const MOCK_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // ASSETS
  { id:'coa_1000', code:'1000', name:'Current Assets',        type:'ASSET',     isActive:true, balance:0,          description:'Current asset accounts', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_1001', code:'1001', name:'Cash on Hand',          type:'ASSET', parentCode:'1000', isActive:true, balance:485000,     description:'Physical cash in custody', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_1002', code:'1002', name:'Cash in Bank',          type:'ASSET', parentCode:'1000', isActive:true, balance:2150000,    description:'Bank deposit accounts', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_1003', code:'1003', name:'Tuition Receivable',    type:'ASSET', parentCode:'1000', isActive:true, balance:320000,     description:'Outstanding tuition fees', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_1004', code:'1004', name:'Other Receivables',     type:'ASSET', parentCode:'1000', isActive:true, balance:45000,      description:'Miscellaneous receivables', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_1500', code:'1500', name:'Non-Current Assets',    type:'ASSET',     isActive:true, balance:0,          description:'Long-term assets', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_1501', code:'1501', name:'Property & Equipment',  type:'ASSET', parentCode:'1500', isActive:true, balance:8500000,    description:'Buildings, land, equipment', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_1502', code:'1502', name:'Accumulated Depreciation', type:'ASSET', parentCode:'1500', isActive:true, balance:-1200000, description:'Contra-asset for depreciation', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  // LIABILITIES
  { id:'coa_2000', code:'2000', name:'Current Liabilities',   type:'LIABILITY', isActive:true, balance:0,          description:'Short-term obligations', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_2001', code:'2001', name:'Accounts Payable',      type:'LIABILITY', parentCode:'2000', isActive:true, balance:125000,  description:'Amounts owed to suppliers', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_2002', code:'2002', name:'Accrued Expenses',      type:'LIABILITY', parentCode:'2000', isActive:true, balance:68000,   description:'Incurred but unpaid expenses', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_2003', code:'2003', name:'Deferred Revenue',      type:'LIABILITY', parentCode:'2000', isActive:true, balance:95000,   description:'Advance payments received', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  // EQUITY
  { id:'coa_3000', code:'3000', name:'Institutional Fund',    type:'EQUITY',    isActive:true, balance:9450000,    description:'Net institutional assets', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_3001', code:'3001', name:'Retained Surplus',      type:'EQUITY', parentCode:'3000', isActive:true, balance:1220000,   description:'Accumulated surplus from operations', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  // REVENUE
  { id:'coa_4000', code:'4000', name:'Revenue',               type:'REVENUE',   isActive:true, balance:0,          description:'All revenue accounts', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_4001', code:'4001', name:'Tuition Fees',          type:'REVENUE', parentCode:'4000', isActive:true, balance:3850000,  description:'Regular tuition collections', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_4002', code:'4002', name:'Miscellaneous Fees',    type:'REVENUE', parentCode:'4000', isActive:true, balance:285000,   description:'Lab, ID, misc fees', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_4003', code:'4003', name:'Examination Fees',      type:'REVENUE', parentCode:'4000', isActive:true, balance:112000,   description:'Exam and certification fees', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_4004', code:'4004', name:'Other Income',          type:'REVENUE', parentCode:'4000', isActive:true, balance:48000,    description:'Canteen, rentals, other', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  // EXPENSES
  { id:'coa_5000', code:'5000', name:'Operating Expenses',    type:'EXPENSE',   isActive:true, balance:0,          description:'All operating expense accounts', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5001', code:'5001', name:'Salaries & Wages',      type:'EXPENSE', parentCode:'5000', isActive:true, balance:1850000,  description:'Employee compensation', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5002', code:'5002', name:'Procurement Expenses',  type:'EXPENSE', parentCode:'5000', isActive:true, balance:425000,   description:'Goods and materials purchased', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5003', code:'5003', name:'Utilities',             type:'EXPENSE', parentCode:'5000', isActive:true, balance:185000,   description:'Electricity, water, internet', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5004', code:'5004', name:'Maintenance & Repairs', type:'EXPENSE', parentCode:'5000', isActive:true, balance:96000,    description:'Building and equipment maintenance', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5005', code:'5005', name:'Supplies & Materials',  type:'EXPENSE', parentCode:'5000', isActive:true, balance:78000,    description:'Office and classroom supplies', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5006', code:'5006', name:'Capital Expenditures',  type:'EXPENSE', parentCode:'5000', isActive:true, balance:320000,   description:'Asset and equipment purchases', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5007', code:'5007', name:'Professional Fees',     type:'EXPENSE', parentCode:'5000', isActive:true, balance:45000,    description:'Consultancy, legal, audit fees', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
  { id:'coa_5008', code:'5008', name:'Other Expenses',        type:'EXPENSE', parentCode:'5000', isActive:true, balance:32000,    description:'Miscellaneous operating expenses', schoolId:'school_1', createdAt:'2025-01-01T00:00:00Z' },
]

// ─── Journal Entries ──────────────────────────────────────────────────────────
export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id:'je_001', entryNumber:'JE-2025-0001', date:'2025-04-01',
    description:'Tuition fee collection — April batch',
    reference:'OR-2025-00112', sourceModule:'TREASURY', sourceDept:'Treasury',
    lines:[
      { id:'jl_001a', accountId:'coa_1002', accountCode:'1002', accountName:'Cash in Bank',    debit:185000, credit:0, description:'Deposit per OR-00112' },
      { id:'jl_001b', accountId:'coa_4001', accountCode:'4001', accountName:'Tuition Fees',    debit:0, credit:185000, description:'Tuition revenue recognized' },
    ],
    totalDebit:185000, totalCredit:185000, status:'POSTED',
    postedBy:'Clara Accounting', postedAt:'2025-04-01T09:00:00Z',
    schoolId:'school_1', createdBy:'u_accounting', createdAt:'2025-04-01T08:45:00Z',
  },
  {
    id:'je_002', entryNumber:'JE-2025-0002', date:'2025-04-03',
    description:'Procurement expense — Office supplies PR-2025-0001',
    reference:'PO-2025-001', sourceModule:'PURCHASING', sourceDept:'Purchasing',
    lines:[
      { id:'jl_002a', accountId:'coa_5005', accountCode:'5005', accountName:'Supplies & Materials', debit:12500, credit:0 },
      { id:'jl_002b', accountId:'coa_2001', accountCode:'2001', accountName:'Accounts Payable',      debit:0, credit:12500 },
    ],
    totalDebit:12500, totalCredit:12500, status:'POSTED',
    postedBy:'Clara Accounting', postedAt:'2025-04-03T10:30:00Z',
    schoolId:'school_1', createdBy:'u_accounting', createdAt:'2025-04-03T10:00:00Z',
  },
  {
    id:'je_003', entryNumber:'JE-2025-0003', date:'2025-04-05',
    description:'Monthly utilities expense — electricity & water',
    sourceModule:'MANUAL', sourceDept:'Administration',
    lines:[
      { id:'jl_003a', accountId:'coa_5003', accountCode:'5003', accountName:'Utilities',       debit:28500, credit:0 },
      { id:'jl_003b', accountId:'coa_1001', accountCode:'1001', accountName:'Cash on Hand',    debit:0, credit:28500 },
    ],
    totalDebit:28500, totalCredit:28500, status:'POSTED',
    postedBy:'Clara Accounting', postedAt:'2025-04-05T14:00:00Z',
    schoolId:'school_1', createdBy:'u_accounting', createdAt:'2025-04-05T13:30:00Z',
  },
  {
    id:'je_004', entryNumber:'JE-2025-0004', date:'2025-04-10',
    description:'April payroll — teaching faculty',
    sourceModule:'PAYROLL', sourceDept:'Human Resources',
    lines:[
      { id:'jl_004a', accountId:'coa_5001', accountCode:'5001', accountName:'Salaries & Wages', debit:485000, credit:0 },
      { id:'jl_004b', accountId:'coa_1002', accountCode:'1002', accountName:'Cash in Bank',     debit:0, credit:432000, description:'Net pay disbursed' },
      { id:'jl_004c', accountId:'coa_2002', accountCode:'2002', accountName:'Accrued Expenses', debit:0, credit:53000, description:'Withheld taxes & deductions' },
    ],
    totalDebit:485000, totalCredit:485000, status:'POSTED',
    postedBy:'Clara Accounting', postedAt:'2025-04-10T16:00:00Z',
    schoolId:'school_1', createdBy:'u_accounting', createdAt:'2025-04-10T15:00:00Z',
  },
  {
    id:'je_005', entryNumber:'JE-2025-0005', date:'2025-04-15',
    description:'Miscellaneous fees collection',
    reference:'OR-2025-00118', sourceModule:'TREASURY', sourceDept:'Treasury',
    lines:[
      { id:'jl_005a', accountId:'coa_1002', accountCode:'1002', accountName:'Cash in Bank',       debit:45000, credit:0 },
      { id:'jl_005b', accountId:'coa_4002', accountCode:'4002', accountName:'Miscellaneous Fees', debit:0, credit:45000 },
    ],
    totalDebit:45000, totalCredit:45000, status:'POSTED',
    postedBy:'Clara Accounting', postedAt:'2025-04-15T11:00:00Z',
    schoolId:'school_1', createdBy:'u_accounting', createdAt:'2025-04-15T10:30:00Z',
  },
  {
    id:'je_006', entryNumber:'JE-2025-0006', date:'2025-04-20',
    description:'Lab equipment purchase — College of Computing',
    reference:'PO-2025-002', sourceModule:'AMS', sourceDept:'Asset Management',
    lines:[
      { id:'jl_006a', accountId:'coa_5006', accountCode:'5006', accountName:'Capital Expenditures', debit:95000, credit:0 },
      { id:'jl_006b', accountId:'coa_1501', accountCode:'1501', accountName:'Property & Equipment', debit:0, credit:0, description:'See note' },
      { id:'jl_006c', accountId:'coa_2001', accountCode:'2001', accountName:'Accounts Payable',     debit:0, credit:95000 },
    ],
    totalDebit:95000, totalCredit:95000, status:'DRAFT',
    schoolId:'school_1', createdBy:'u_accounting', createdAt:'2025-04-20T09:00:00Z',
  },
  {
    id:'je_007', entryNumber:'JE-2025-0007', date:'2025-04-22',
    description:'Building maintenance — roof repair',
    sourceModule:'MANUAL', sourceDept:'Administration',
    lines:[
      { id:'jl_007a', accountId:'coa_5004', accountCode:'5004', accountName:'Maintenance & Repairs', debit:32000, credit:0 },
      { id:'jl_007b', accountId:'coa_1002', accountCode:'1002', accountName:'Cash in Bank',          debit:0, credit:32000 },
    ],
    totalDebit:32000, totalCredit:32000, status:'POSTED',
    postedBy:'Clara Accounting', postedAt:'2025-04-22T14:00:00Z',
    schoolId:'school_1', createdBy:'u_accounting', createdAt:'2025-04-22T13:00:00Z',
  },
]

// ─── Financial Approvals ──────────────────────────────────────────────────────
export const MOCK_FIN_APPROVALS: FinancialApproval[] = [
  {
    id:'fa_001', approvalNumber:'FA-2025-0001',
    type:'EXPENSE', title:'IT Equipment Purchase — 10 Laptops',
    amount:185000, department:'College of Computing',
    requestedBy:'u_amo', requestedByName:'Marco Dela Cruz',
    requestedAt:'2025-04-18T09:00:00Z',
    steps:[
      { id:'fas_001a', level:1, approverRole:'ACCOUNTING', status:'PENDING' },
      { id:'fas_001b', level:2, approverRole:'SUPER_ADMIN', status:'PENDING' },
    ],
    currentStep:1, status:'PENDING',
    schoolId:'school_1', createdAt:'2025-04-18T09:00:00Z', updatedAt:'2025-04-18T09:00:00Z',
  },
  {
    id:'fa_002', approvalNumber:'FA-2025-0002',
    type:'BUDGET_ADJUSTMENT', title:'Q2 Budget Increase — HR Department',
    amount:50000, department:'Human Resources',
    requestedBy:'u_hr', requestedByName:'Hannah Rodriguez',
    requestedAt:'2025-04-15T10:30:00Z',
    steps:[
      { id:'fas_002a', level:1, approverRole:'ACCOUNTING', approverName:'Clara Accounting', status:'APPROVED', comment:'Justified by additional headcount.', actionAt:'2025-04-15T14:00:00Z' },
      { id:'fas_002b', level:2, approverRole:'SUPER_ADMIN', status:'PENDING' },
    ],
    currentStep:2, status:'PENDING',
    schoolId:'school_1', createdAt:'2025-04-15T10:30:00Z', updatedAt:'2025-04-15T14:00:00Z',
  },
  {
    id:'fa_003', approvalNumber:'FA-2025-0003',
    type:'EXPENSE', title:'Annual Software Licenses — Microsoft 365',
    amount:62000, department:'Administration',
    requestedBy:'u_superadmin', requestedByName:'Alex Administrator',
    requestedAt:'2025-04-10T08:00:00Z',
    steps:[
      { id:'fas_003a', level:1, approverRole:'ACCOUNTING', approverName:'Clara Accounting', status:'APPROVED', comment:'Budget available.', actionAt:'2025-04-10T10:00:00Z' },
      { id:'fas_003b', level:2, approverRole:'SUPER_ADMIN', approverName:'Alex Administrator', status:'APPROVED', actionAt:'2025-04-11T09:00:00Z' },
    ],
    currentStep:2, status:'APPROVED',
    schoolId:'school_1', createdAt:'2025-04-10T08:00:00Z', updatedAt:'2025-04-11T09:00:00Z',
  },
]

// ─── Payroll Runs ─────────────────────────────────────────────────────────────
export const MOCK_PAYROLL_RUNS: PayrollRun[] = [
  {
    id:'pr_run_001', runNumber:'PRRUN-2025-04', period:'April 2025',
    periodStart:'2025-04-01', periodEnd:'2025-04-30',
    items:[
      { id:'pri_001', employeeId:'u_teacher',   employeeName:'Prof. Roberto Santos', department:'College of Computing', position:'Associate Professor', basicPay:45000, allowances:5000, deductions:8500, netPay:41500, taxWithheld:2500 },
      { id:'pri_002', employeeId:'u_hr',         employeeName:'Hannah Rodriguez',     department:'Human Resources',      position:'HR Officer',          basicPay:38000, allowances:3000, deductions:7200, netPay:33800, taxWithheld:2000 },
      { id:'pri_003', employeeId:'u_amo',        employeeName:'Marco Dela Cruz',      department:'Asset Management',     position:'AMO Officer',         basicPay:36000, allowances:2500, deductions:6800, netPay:31700, taxWithheld:1800 },
      { id:'pri_004', employeeId:'u_registrar',  employeeName:'Rosa Registrar',       department:'Registrar',            position:'Registrar',           basicPay:42000, allowances:4000, deductions:8000, netPay:38000, taxWithheld:2200 },
      { id:'pri_005', employeeId:'u_accounting', employeeName:'Clara Accounting',     department:'Finance',              position:'Accounting Officer',  basicPay:40000, allowances:3500, deductions:7600, netPay:35900, taxWithheld:2100 },
    ],
    totalGross:206500, totalDeductions:38100, totalNet:180900,
    status:'PAID', processedBy:'Clara Accounting', processedAt:'2025-04-10T15:00:00Z',
    approvedBy:'Alex Administrator', paidAt:'2025-04-10T16:00:00Z', journalEntryId:'je_004',
    schoolId:'school_1', createdAt:'2025-04-08T09:00:00Z',
  },
  {
    id:'pr_run_002', runNumber:'PRRUN-2025-05', period:'May 2025',
    periodStart:'2025-05-01', periodEnd:'2025-05-31',
    items:[
      { id:'pri_006', employeeId:'u_teacher',   employeeName:'Prof. Roberto Santos', department:'College of Computing', position:'Associate Professor', basicPay:45000, allowances:5000, deductions:8500, netPay:41500, taxWithheld:2500 },
      { id:'pri_007', employeeId:'u_hr',         employeeName:'Hannah Rodriguez',     department:'Human Resources',      position:'HR Officer',          basicPay:38000, allowances:3000, deductions:7200, netPay:33800, taxWithheld:2000 },
      { id:'pri_008', employeeId:'u_amo',        employeeName:'Marco Dela Cruz',      department:'Asset Management',     position:'AMO Officer',         basicPay:36000, allowances:2500, deductions:6800, netPay:31700, taxWithheld:1800 },
      { id:'pri_009', employeeId:'u_registrar',  employeeName:'Rosa Registrar',       department:'Registrar',            position:'Registrar',           basicPay:42000, allowances:4000, deductions:8000, netPay:38000, taxWithheld:2200 },
      { id:'pri_010', employeeId:'u_accounting', employeeName:'Clara Accounting',     department:'Finance',              position:'Accounting Officer',  basicPay:40000, allowances:3500, deductions:7600, netPay:35900, taxWithheld:2100 },
    ],
    totalGross:206500, totalDeductions:38100, totalNet:180900,
    status:'FOR_APPROVAL', processedBy:'Clara Accounting', processedAt:'2025-05-08T10:00:00Z',
    schoolId:'school_1', createdAt:'2025-05-08T09:00:00Z',
  },
]

let _jeSeq = 8
export function nextJENumber(): string { return `JE-2025-${String(_jeSeq++).padStart(4,'0')}` }
let _faSeq = 4
export function nextFANumber(): string { return `FA-2025-${String(_faSeq++).padStart(4,'0')}` }
let _prRunSeq = 3
export function nextPRRunNumber(): string { return `PRRUN-${new Date().getFullYear()}-${String(_prRunSeq++).padStart(2,'0')}` }

// ─── Agent Chat ───────────────────────────────────────────────────────────────
export const MOCK_AGENTS: AgentInfo[] = [
  { id:'u_superadmin', name:'Alex Administrator', role:'SUPER_ADMIN',         department:'Administration',    availability:'ONLINE',  activeChats:2 },
  { id:'u_registrar',  name:'Rosa Registrar',     role:'REGISTRAR',           department:'Registrar',         availability:'ONLINE',  activeChats:1 },
  { id:'u_accounting', name:'Clara Accounting',   role:'ACCOUNTING',          department:'Finance',           availability:'ONLINE',  activeChats:3 },
  { id:'u_hr',         name:'Hannah Rodriguez',   role:'HR_STAFF',            department:'Human Resources',   availability:'AWAY',    activeChats:0 },
  { id:'u_amo',        name:'Marco Dela Cruz',    role:'AMO',                 department:'Asset Management',  availability:'OFFLINE', activeChats:0 },
  { id:'u_admissions', name:'Admin Admissions',   role:'ADMISSION_OFFICER',   department:'Admissions',        availability:'ONLINE',  activeChats:1 },
]

export const MOCK_AGENT_CHATS: AgentChat[] = [
  {
    id:'chat_001', chatNumber:'CHAT-001',
    userId:'st_demo', userName:'Juan dela Cruz', userRole:'STUDENT', portal:'student',
    department:'REGISTRAR', subject:'Question about my Transcript of Records',
    status:'ASSIGNED', agentId:'u_registrar', agentName:'Rosa Registrar',
    messages:[
      { id:'cm_001a', chatId:'chat_001', senderType:'USER',   senderId:'st_demo',      senderName:'Juan dela Cruz',  content:'Hi, I need to request my TOR for a scholarship application. How long does it take?', timestamp:'2025-05-14T09:00:00Z', isRead:true },
      { id:'cm_001b', chatId:'chat_001', senderType:'SYSTEM', senderId:'system',       senderName:'System',          content:'Chat assigned to Rosa Registrar (Registrar Office)', timestamp:'2025-05-14T09:01:00Z', isRead:true },
      { id:'cm_001c', chatId:'chat_001', senderType:'AGENT',  senderId:'u_registrar',  senderName:'Rosa Registrar',  content:'Hello Juan! TOR requests are processed within 3–5 business days. Please bring your student ID and a completed request form to the Registrar\'s Office, or you can file a request via the Support Center.', timestamp:'2025-05-14T09:05:00Z', isRead:true },
      { id:'cm_001d', chatId:'chat_001', senderType:'USER',   senderId:'st_demo',      senderName:'Juan dela Cruz',  content:'Thank you! Can I have it delivered by email instead?', timestamp:'2025-05-14T09:08:00Z', isRead:false },
    ],
    createdAt:'2025-05-14T09:00:00Z', updatedAt:'2025-05-14T09:08:00Z',
  },
  {
    id:'chat_002', chatNumber:'CHAT-002',
    userId:'u_teacher', userName:'Prof. Roberto Santos', userRole:'TEACHER', portal:'teacher',
    department:'HR', subject:'Leave application inquiry',
    status:'RESOLVED', agentId:'u_hr', agentName:'Hannah Rodriguez',
    messages:[
      { id:'cm_002a', chatId:'chat_002', senderType:'USER',   senderId:'u_teacher',  senderName:'Prof. Roberto Santos', content:'I filed a leave request last week but haven\'t received a response. Can you check the status?', timestamp:'2025-05-13T10:00:00Z', isRead:true },
      { id:'cm_002b', chatId:'chat_002', senderType:'SYSTEM', senderId:'system',     senderName:'System',               content:'Chat assigned to Hannah Rodriguez (HR)', timestamp:'2025-05-13T10:02:00Z', isRead:true },
      { id:'cm_002c', chatId:'chat_002', senderType:'AGENT',  senderId:'u_hr',       senderName:'Hannah Rodriguez',     content:'Hi Prof. Santos! I can see your request — it\'s currently under review. The department head needs to approve it first. I\'ll follow up and get back to you by EOD.', timestamp:'2025-05-13T10:15:00Z', isRead:true },
      { id:'cm_002d', chatId:'chat_002', senderType:'AGENT',  senderId:'u_hr',       senderName:'Hannah Rodriguez',     content:'Good news! Your leave request has been approved. You\'ll receive an email confirmation shortly.', timestamp:'2025-05-13T14:30:00Z', isRead:true },
      { id:'cm_002e', chatId:'chat_002', senderType:'USER',   senderId:'u_teacher',  senderName:'Prof. Roberto Santos', content:'Thank you so much, Hannah!', timestamp:'2025-05-13T14:45:00Z', isRead:true },
    ],
    createdAt:'2025-05-13T10:00:00Z', updatedAt:'2025-05-13T14:45:00Z',
  },
  {
    id:'chat_003', chatNumber:'CHAT-003',
    userId:'u_purchasing', userName:'Perry Purchasing', userRole:'PURCHASING_OFFICER', portal:'staff',
    department:'FINANCE', subject:'Budget availability for Q2 IT equipment',
    status:'OPEN',
    messages:[
      { id:'cm_003a', chatId:'chat_003', senderType:'USER',   senderId:'u_purchasing', senderName:'Perry Purchasing', content:'Hi, we have a pending purchase request for laptops worth ₱185,000. Can you confirm if the IT budget still has availability for Q2?', timestamp:'2025-05-15T08:30:00Z', isRead:false },
      { id:'cm_003b', chatId:'chat_003', senderType:'SYSTEM', senderId:'system',       senderName:'System',           content:'Chat is open and waiting for an agent to respond.', timestamp:'2025-05-15T08:30:00Z', isRead:false },
    ],
    createdAt:'2025-05-15T08:30:00Z', updatedAt:'2025-05-15T08:30:00Z',
  },
]

let _chatSeq = 4
export function nextChatNumber(): string { return `CHAT-${String(_chatSeq++).padStart(3,'0')}` }

// ─── Fee Structure (managed by Accounting, used by Treasury) ─────────────────
export const MOCK_FEE_STRUCTURES: FeeStructure[] = [
  { id:'fee_1', name:'Tuition Fee',          category:'TUITION', amount:1500,  applicability:'PER_UNIT',         isActive:true,  schoolId:'school_1', description:'Per unit rate for lecture and laboratory subjects', createdBy:'Clara Accounting', createdAt:'2025-01-10T08:00:00Z' },
  { id:'fee_2', name:'Miscellaneous Fee',     category:'MISC',    amount:3500,  applicability:'ALL_STUDENTS',      isActive:true,  schoolId:'school_1', description:'Student services, facilities, and technology fee', createdBy:'Clara Accounting', createdAt:'2025-01-10T08:00:00Z' },
  { id:'fee_3', name:'Laboratory Fee',        category:'LAB',     amount:2500,  applicability:'ALL_STUDENTS',      isActive:true,  schoolId:'school_1', description:'Laboratory equipment and consumables fee per semester', createdBy:'Clara Accounting', createdAt:'2025-01-10T08:00:00Z' },
  { id:'fee_4', name:'Registration Fee',      category:'REG',     amount:1000,  applicability:'ALL_STUDENTS',      isActive:true,  schoolId:'school_1', description:'Enrollment and registration processing fee', createdBy:'Clara Accounting', createdAt:'2025-01-10T08:00:00Z' },
  { id:'fee_5', name:'Student ID Fee',        category:'OTHER',   amount:500,   applicability:'NEW_STUDENTS_ONLY', isActive:true,  schoolId:'school_1', description:'ID card issuance for new and transferee students', createdBy:'Clara Accounting', createdAt:'2025-01-10T08:00:00Z' },
  { id:'fee_6', name:'NSTP Fee',              category:'OTHER',   amount:750,   applicability:'NEW_STUDENTS_ONLY', isActive:true,  schoolId:'school_1', description:'National Service Training Program fee', createdBy:'Clara Accounting', createdAt:'2025-01-10T08:00:00Z' },
  { id:'fee_7', name:'Athletic Fee',          category:'MISC',    amount:600,   applicability:'ALL_STUDENTS',      isActive:true,  schoolId:'school_1', description:'Sports and physical fitness facilities', createdBy:'Clara Accounting', createdAt:'2025-01-15T08:00:00Z' },
  { id:'fee_8', name:'Library Fee',           category:'MISC',    amount:400,   applicability:'ALL_STUDENTS',      isActive:true,  schoolId:'school_1', description:'Library resources and digital access fee', createdBy:'Clara Accounting', createdAt:'2025-01-15T08:00:00Z' },
  { id:'fee_9', name:'Graduation Fee',        category:'OTHER',   amount:3500,  applicability:'OPTIONAL',          isActive:false, schoolId:'school_1', description:'Graduation ceremony and diploma processing fee', createdBy:'Clara Accounting', createdAt:'2025-02-01T08:00:00Z' },
]

let _feeSeq = 10
export function nextFeeId(): string { return `fee_${_feeSeq++}` }
