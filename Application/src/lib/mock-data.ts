import type {
  School, Department, Program, AcademicYear, Semester, Subject, Room, Faculty,
  Applicant, Student, SubjectOffering, TeacherAssignment, Enrollment,
  SOA, SOAItem, Payment, TreasuryTransaction, Module, Material, Assignment, Quiz,
  Grade, Notification, AuditLog, FamilyBackground, PreviousEducation,
  OfferingSchedule, PipelineStats, GradeSubmission, CustomRole, SystemUser,
  Budget, BudgetExpense, LMSAnnouncement, LMSAttendance, LMSDiscussionPost,
  JobPosting, JobApplication, HREmployee, HROnboardingRecord, HRLeaveRequest,
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

export const MOCK_GRADES: Grade[] = []

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

// ─── Grade Finalization ───────────────────────────────────────────────────────
// Submissions created by faculty; approved by Registrar.
// Grades are pushed to MOCK_GRADES only on approval.
export const MOCK_GRADE_SUBMISSIONS: GradeSubmission[] = []
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
