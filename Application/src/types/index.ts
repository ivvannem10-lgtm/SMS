// ─── Roles ────────────────────────────────────────────────────────────────────

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMISSION_OFFICER'
  | 'REGISTRAR'
  | 'TREASURER'
  | 'ACADEMIC_ADMIN'
  | 'DEAN'
  | 'TEACHER'
  | 'STUDENT'

export type ApplicantStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'
export type ApplicantType = 'FRESHMAN' | 'TRANSFEREE' | 'RETURNEE'
export type EnrollmentStatus = 'PRE_ENROLLED' | 'PAYMENT_PENDING' | 'ENROLLED' | 'DROPPED' | 'COMPLETED'
export type SOAStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID'
export type PaymentMethod = 'CASH' | 'ONLINE' | 'GCASH' | 'BANK'
export type PaymentStatus = 'PENDING' | 'VALIDATED' | 'VOIDED'
export type TreasuryTxType =
  | 'CHARGE_ADDED'
  | 'CHARGE_VOIDED'
  | 'PAYMENT_RECEIVED'
  | 'OVERPAYMENT_APPLIED'
  | 'REFUND_ISSUED'
export type OfferingStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type GradeStatus = 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'INC' | 'W'
export type RoomType = 'LECTURE' | 'LAB' | 'BOTH'
export type TeacherRole = 'LECTURE' | 'LAB' | 'BOTH'
export type MaterialType = 'PDF' | 'VIDEO' | 'LINK' | 'FILE'
export type QuizQuestionType = 'MCQ' | 'TRUE_FALSE' | 'ESSAY'
export type SemesterType = 'FIRST' | 'SECOND' | 'SUMMER'
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED'

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface School {
  id: string
  name: string
  slug: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  primaryColor: string
  plan: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string
  schoolId: string
  school?: School
}

export interface Department {
  id: string
  name: string
  code: string
  deanName?: string
  deanEmail?: string
  schoolId: string
  createdAt: string
}

export interface Program {
  id: string
  name: string
  code: string
  department?: string
  departmentId?: string
  schoolId: string
}

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  schoolId: string
  semesters?: Semester[]
}

export interface Semester {
  id: string
  name: string
  type: SemesterType
  isActive: boolean
  maxUnits: number
  startDate: string
  endDate: string
  enrollmentStart?: string
  enrollmentEnd?: string
  academicYearId: string
  academicYear?: AcademicYear
}

export interface Subject {
  id: string
  code: string
  name: string
  units: number
  labUnits: number
  description?: string
  type: string
  programId?: string
  program?: Program
  schoolId: string
  prerequisites?: SubjectPrerequisite[]
}

export interface SubjectPrerequisite {
  id: string
  subjectId: string
  prerequisiteId: string
  prerequisite?: Subject
}

export interface Room {
  id: string
  name: string
  building?: string
  floor?: string
  capacity: number
  type: RoomType
  schoolId: string
}

export interface Faculty {
  id: string
  facultyId: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  phone?: string
  department?: string
  position?: string
  status: string
  schoolId: string
  userId?: string
}

export interface Applicant {
  id: string
  referenceNumber: string
  // ── Personal info ──────────────────────────────────────────────────────────
  firstName: string
  lastName: string
  middleName?: string
  suffix?: string
  email: string
  phone?: string
  dateOfBirth?: string
  placeOfBirth?: string
  gender?: string
  civilStatus?: string
  nationality?: string
  religion?: string
  bloodType?: string
  address?: string
  photo?: string
  // ── Academic intent ────────────────────────────────────────────────────────
  programId?: string
  program?: Program
  applicantType: ApplicantType
  gwa?: string
  strand?: string
  // ── Status & review ────────────────────────────────────────────────────────
  status: ApplicantStatus
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  remarks?: string
  schoolId: string
  familyBackground?: FamilyBackground
  previousEducations?: PreviousEducation[]
  documents?: ApplicantDocument[]
  createdAt: string
  updatedAt: string
}

export interface FamilyBackground {
  id: string
  applicantId: string
  fatherName?: string
  fatherOccupation?: string
  fatherPhone?: string
  motherName?: string
  motherOccupation?: string
  motherPhone?: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  monthlyIncome?: string
  livingWith?: string
}

export interface PreviousEducation {
  id: string
  applicantId: string
  schoolName: string
  level: string
  yearFrom: number
  yearTo?: number
  honors?: string
  address?: string
}

export interface ApplicantDocument {
  id: string
  applicantId: string
  type: string
  filename: string
  url?: string
  verified: boolean
  createdAt: string
}

export interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  phone?: string
  photo?: string
  address?: string
  dateOfBirth?: string
  gender?: string
  status: StudentStatus
  programId?: string
  program?: Program
  yearLevel: number
  schoolId: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  applicantId?: string
  userId?: string
  enrollments?: Enrollment[]
  soa?: SOA[]
  createdAt: string
  updatedAt: string
}

export interface SubjectOffering {
  id: string
  maxStudents: number
  status: OfferingStatus
  section?: string
  subjectId: string
  subject?: Subject
  semesterId: string
  semester?: Semester
  schedules?: OfferingSchedule[]
  assignments?: TeacherAssignment[]
  enrollments?: Enrollment[]
  _count?: { enrollments: number }
  createdAt: string
}

export interface OfferingSchedule {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  offeringId: string
  roomId?: string
  room?: Room
}

export interface TeacherAssignment {
  id: string
  role: TeacherRole
  offeringId: string
  offering?: SubjectOffering
  facultyId: string
  faculty?: Faculty
}

export interface Enrollment {
  id: string
  status: EnrollmentStatus
  studentId: string
  student?: Student
  offeringId: string
  offering?: SubjectOffering
  semesterId: string
  semester?: Semester
  grade?: Grade
  confirmedAt?: string
  createdAt: string
  updatedAt: string
}

export interface FeeStructure {
  id: string
  name: string
  type: string
  amount: number
  description?: string
  isActive: boolean
  schoolId: string
}

export interface SOA {
  id: string
  totalAmount: number
  paidAmount: number
  balance: number
  overpayment: number
  status: SOAStatus
  studentId: string
  student?: Student
  semesterId: string
  semester?: Semester
  items?: SOAItem[]
  payments?: Payment[]
  createdAt: string
  updatedAt: string
}

export interface SOAItem {
  id: string
  description: string
  amount: number
  type: string
  soaId: string
  voided?: boolean
  voidReason?: string
  voidedBy?: string
  voidedAt?: string
  createdAt: string
}

export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  receiptNumber?: string
  referenceNumber?: string
  notes?: string
  validatedBy?: string
  validatedAt?: string
  soaId: string
  createdAt: string
}

export interface TreasuryTransaction {
  id: string
  type: TreasuryTxType
  amount: number
  description: string
  studentId: string
  studentName: string
  studentNo: string
  soaId?: string
  paymentId?: string
  itemId?: string
  cashier: string
  referenceNumber?: string
  notes?: string
  createdAt: string
}

export interface Module {
  id: string
  title: string
  description?: string
  order: number
  isPublished: boolean
  offeringId: string
  materials?: Material[]
  createdAt: string
}

export interface Material {
  id: string
  title: string
  type: MaterialType
  url?: string
  filename?: string
  size?: string
  moduleId: string
  createdAt: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  dueDate?: string
  totalPoints: number
  isPublished: boolean
  offeringId: string
  submissions?: AssignmentSubmission[]
  createdAt: string
}

export interface AssignmentSubmission {
  id: string
  content?: string
  fileUrl?: string
  filename?: string
  grade?: number
  feedback?: string
  isLate: boolean
  assignmentId: string
  studentId: string
  submittedAt: string
  gradedAt?: string
}

export interface Quiz {
  id: string
  title: string
  description?: string
  duration: number
  totalPoints: number
  startDate?: string
  endDate?: string
  isPublished: boolean
  offeringId: string
  questions?: QuizQuestion[]
  attempts?: QuizAttempt[]
  createdAt: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: QuizQuestionType
  options?: string[]
  answer?: string
  points: number
  order: number
  quizId: string
}

export interface QuizAttempt {
  id: string
  studentId: string
  score?: number
  maxScore?: number
  startedAt: string
  submittedAt?: string
  status: string
  quizId: string
}

export interface GradeCriteria {
  id: string
  offeringId: string
  quizWeight: number
  assignmentWeight: number
  examWeight: number
  passingGrade: number
}

export interface Grade {
  id: string
  quizAverage?: number
  assignmentAverage?: number
  midtermGrade?: number
  finalExamGrade?: number
  finalGrade?: number
  letterGrade?: string
  status: GradeStatus
  enrollmentId: string
  gradedBy?: string
  gradedAt?: string
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link?: string
  userId?: string
  studentId?: string
  schoolId: string
  createdAt: string
}

export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId?: string
  details?: string
  userId: string
  schoolId: string
  createdAt: string
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  schoolId: string
  schoolName: string
  schoolColor: string
  studentId?: string
  facultyId?: string
  // Deans only — strict department-scoped access
  deanDepartment?: string
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface PipelineStats {
  pendingApplicants: number
  acceptedApplicants: number
  enrolledStudents: number
  pendingPayments: number
  activeSubjects: number
  activeTeachers: number
}
