// ─── Roles ────────────────────────────────────────────────────────────────────

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMISSION_OFFICER'
  | 'REGISTRAR'
  | 'TREASURER'
  | 'ACADEMIC_ADMIN'
  | 'ACCOUNTING'
  | 'DEAN'
  | 'HR_STAFF'
  | 'AMO'
  | 'PURCHASING_OFFICER'
  | 'TEACHER'
  | 'STUDENT'

// ─── Custom Role / User Management ───────────────────────────────────────────
export type ModuleKey =
  | 'admissions'
  | 'academic'
  | 'registrar'
  | 'treasury'
  | 'lms'
  | 'reports'
  | 'user_management'

export interface ModulePermission {
  module: ModuleKey
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

// ─── Budget Management ────────────────────────────────────────────────────────
export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface Budget {
  id: string
  name: string
  department: string
  amount: number
  periodType: BudgetPeriod
  startDate: string
  endDate: string
  createdAt: string
}

export interface BudgetExpense {
  id: string
  budgetId: string
  department: string
  description: string
  amount: number
  date: string
  recordedBy: string
}

export interface CustomRole {
  id: string
  name: string
  description: string
  permissions: ModulePermission[]
  createdAt: string
}

export interface SystemUser {
  id: string
  name: string
  email: string
  role: string
  status: 'ACTIVE' | 'INACTIVE'
}

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
export type QuizQuestionType = 'MCQ' | 'TRUE_FALSE' | 'ESSAY' | 'LONG_RESPONSE' | 'CODING' | 'IDENTIFICATION' | 'FILL_IN_BLANK' | 'MATCHING'
export type AssessmentType = 'QUIZ' | 'LONG_QUIZ' | 'PRACTICAL_EXAM' | 'MIDTERM_EXAM' | 'FINAL_EXAM' | 'ASSIGNMENT_EXAM' | 'ORAL_ASSESSMENT' | 'LABORATORY'
export type AssessmentVisibility = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'SCHEDULED' | 'CONDITIONAL'
export type AttemptStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'TIMED_OUT'
export type AttemptGradingMethod = 'HIGHEST' | 'LATEST' | 'AVERAGE'
export type TimerBehavior = 'AUTO_SUBMIT' | 'ALLOW_OVERTIME'
export type NavigationMode = 'FREE' | 'ONE_WAY'
export type QuestionDisplayMode = 'ONE_PER_PAGE' | 'ALL_AT_ONCE'
export type FeedbackTiming = 'IMMEDIATELY' | 'AFTER_DUE_DATE' | 'MANUAL_RELEASE'
export type FeedbackLevel = 'SCORE_ONLY' | 'SCORE_AND_ANSWERS' | 'FULL_FEEDBACK'
export type SemesterType = 'FIRST' | 'SECOND' | 'SUMMER'
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'DROPPED'

export interface QuizSecuritySettings {
  fullscreenMode: boolean
  disableCopyPaste: boolean
  tabSwitchDetection: boolean
  tabSwitchLimit?: number    // max tab switches before auto-submit; 0 = unlimited
  ipTracking: boolean
  browserLock: boolean
}

export interface ConditionalRelease {
  type: 'PASSED_QUIZ' | 'COMPLETED_LESSON' | 'SPECIFIC_DATE'
  quizId?: string
  moduleId?: string
  date?: string
  passingScore?: number
}

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

export interface StudentAnswer {
  questionId: string
  answer?: string
  score?: number
  maxScore?: number
  feedback?: string
}

export interface Quiz {
  id: string
  title: string
  description?: string
  instructions?: string
  assessmentType?: AssessmentType
  duration: number                        // minutes
  totalPoints: number
  passingScore?: number
  startDate?: string
  endDate?: string
  scheduledReleaseDate?: string
  isPublished: boolean
  visibility?: AssessmentVisibility
  isTemplate?: boolean

  // ── Attempt settings ──
  maxAttempts?: number
  gradingMethod?: AttemptGradingMethod    // HIGHEST | LATEST | AVERAGE
  allowResume?: boolean

  // ── Timing ──
  timerBehavior?: TimerBehavior           // AUTO_SUBMIT | ALLOW_OVERTIME
  overtimePenaltyPerMin?: number          // points deducted per minute over

  // ── Question settings ──
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  questionDisplayMode?: QuestionDisplayMode  // ONE_PER_PAGE | ALL_AT_ONCE
  randomPoolSize?: number                 // pick N random questions from pool

  // ── Scoring ──
  partialCreditEnabled?: boolean
  negativeMarkingEnabled?: boolean
  negativeMarkingPenalty?: number         // % deducted per wrong answer

  // ── Behavior ──
  navigationMode?: NavigationMode         // FREE | ONE_WAY
  autoSaveInterval?: number               // seconds between auto-saves

  // ── Security ──
  security?: QuizSecuritySettings

  // ── Feedback ──
  feedbackTiming?: FeedbackTiming         // IMMEDIATELY | AFTER_DUE_DATE | MANUAL_RELEASE
  feedbackLevel?: FeedbackLevel           // SCORE_ONLY | SCORE_AND_ANSWERS | FULL_FEEDBACK
  showResultsImmediately?: boolean        // kept for backward compat
  showCorrectAnswers?: boolean            // kept for backward compat

  // ── Conditional release ──
  conditionalRelease?: ConditionalRelease

  // ── Grade weight ──
  gradeWeight?: number                    // % contribution to final grade
  allowScoreOverride?: boolean

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
  answers?: string[]
  matchingPairs?: { id: string; left: string; right: string }[]
  points: number
  order: number
  quizId: string
  explanation?: string
}

export interface QuizAttempt {
  id: string
  studentId: string
  studentName?: string
  score?: number
  maxScore?: number
  startedAt: string
  submittedAt?: string
  timeTakenSeconds?: number
  status: AttemptStatus | string
  quizId: string
  answers?: StudentAnswer[]
  isFullyGraded?: boolean
  manualGradeComment?: string
}

export interface CustomGradeCategory {
  id: string
  label: string
  desc: string
  colorIdx: number
  weight: number
}

export interface GradeCriteria {
  id: string
  offeringId: string
  quizWeight: number
  assignmentWeight: number
  examWeight: number
  performanceTaskWeight?: number
  passingGrade: number
  customCategories?: CustomGradeCategory[]
  disabledDefaults?: string[]   // ids of default categories toggled off
}

// ─── Rubric / Performance Task ────────────────────────────────────────────────

export interface RubricLevel {
  id: string
  label: string   // 'Excellent', 'Good', 'Fair', 'Poor'
  score: number   // 0–100
  description?: string
}

export interface RubricCriterion {
  id: string
  name: string
  weight: number       // % — all criteria must sum to 100
  description?: string
  levels: RubricLevel[]
}

export interface Rubric {
  id: string
  title: string
  description?: string
  offeringId?: string
  criteria: RubricCriterion[]
  createdAt: string
}

export interface CriterionScore {
  criterionId: string
  levelId: string
  score: number         // level score (e.g. 85)
  weight: number        // criterion weight (e.g. 40)
  weightedScore: number // score × weight / 100 (e.g. 34)
}

export interface PTSubmission {
  id: string
  taskId: string
  studentId: string
  studentName?: string
  content?: string
  fileUrl?: string
  submittedAt: string
  isLate: boolean
  gradedAt?: string
  gradedBy?: string
  criteriaScores?: CriterionScore[]
  finalScore?: number   // auto-computed: Σ weightedScore
  feedback?: string
}

export interface PerformanceTask {
  id: string
  title: string
  description?: string
  instructions?: string
  rubricId: string
  rubric?: Rubric
  totalPoints: number   // always 100 (percentage-based)
  dueDate?: string
  isPublished: boolean
  offeringId: string
  submissions?: PTSubmission[]
  createdAt: string
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

// ─── Grade Finalization ───────────────────────────────────────────────────────

// SUBMITTED → teacher sent grades for review (grade book locked)
// CLOSED    → registrar locked/closed submission (still locked, under registrar review)
// RETURNED  → registrar returned to teacher for corrections (grade book unlocked)
// PUBLISHED → registrar published to student records (permanently locked, visible to students)
export type GradeSubmissionStatus = 'SUBMITTED' | 'CLOSED' | 'RETURNED' | 'PUBLISHED'

export interface GradeSubmissionEntry {
  enrollmentId: string
  studentId: string
  studentName: string
  studentNo: string
  quizAverage?: number
  assignmentAverage?: number
  midtermGrade?: number
  finalExamGrade?: number
  finalGrade?: number
  letterGrade?: string
  gradeStatus: GradeStatus
}

export interface GradeSubmission {
  id: string
  offeringId: string
  semesterId: string
  facultyId: string
  facultyName: string
  subjectCode: string
  subjectName: string
  section?: string
  status: GradeSubmissionStatus
  entries: GradeSubmissionEntry[]
  submittedAt: string
  closedAt?: string
  closedBy?: string
  publishedAt?: string
  publishedBy?: string
  returnedAt?: string
  returnedBy?: string
  returnReason?: string
}

// ─── LMS ─────────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'

export interface LMSAnnouncement {
  id: string
  title: string
  content: string
  offeringId: string
  authorName: string
  isPinned: boolean
  createdAt: string
}

export interface LMSAttendance {
  id: string
  offeringId: string
  studentId: string
  studentName: string
  date: string
  status: AttendanceStatus
  remarks?: string
}

export interface LMSDiscussionPost {
  id: string
  offeringId: string
  title: string
  content: string
  authorName: string
  authorRole: 'TEACHER' | 'STUDENT'
  replies: LMSDiscussionReply[]
  isPinned: boolean
  createdAt: string
}

export interface LMSDiscussionReply {
  id: string
  postId: string
  content: string
  authorName: string
  authorRole: 'TEACHER' | 'STUDENT'
  createdAt: string
}

// ─── HRIS ─────────────────────────────────────────────────────────────────────

export type EmploymentType    = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'PROBATIONARY' | 'CASUAL'
export type HREmploymentStatus= 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'RETIRED'
export type WorkSetup         = 'ON_SITE' | 'HYBRID' | 'REMOTE'
export type JobPostingStatus  = 'OPEN' | 'CLOSED' | 'DRAFT' | 'FILLED'
export type AtsStage          = 'NEW' | 'SCREENING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'FINAL_EVALUATION' | 'HIRED' | 'REJECTED'
export type InterviewType     = 'PHONE' | 'VIDEO' | 'ONSITE' | 'PANEL'
export type HRLeaveType       = 'SICK' | 'VACATION' | 'EMERGENCY' | 'MATERNITY' | 'PATERNITY'
export type HRLeaveStatus     = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type HROnboardingStatus= 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface JobPosting {
  id: string
  title: string
  department: string
  employmentType: EmploymentType
  workSetup: WorkSetup
  location: string
  salaryMin?: number
  salaryMax?: number
  description: string
  requirements: string
  responsibilities: string
  openings: number
  status: JobPostingStatus
  postedAt: string
  closingDate?: string
  createdBy: string
}

export interface JobApplication {
  id: string
  jobId: string
  jobTitle?: string
  applicantName: string
  email: string
  phone?: string
  resumeUrl?: string
  coverLetter?: string
  stage: AtsStage
  appliedAt: string
  updatedAt: string
  rating?: number               // 1–5 stars
  notes?: string
  interviewDate?: string
  interviewType?: InterviewType
  interviewLink?: string
  interviewNotes?: string
  rejectionReason?: string
  offeredSalary?: number
}

export interface HRDocument {
  id: string
  type: string
  filename: string
  uploadedAt: string
  verified: boolean
}

export interface OnboardingTask {
  id: string
  title: string
  description?: string
  category: string
  isCompleted: boolean
  completedAt?: string
  dueDate?: string
  assignedTo?: string
}

export interface HROnboardingRecord {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  status: HROnboardingStatus
  tasks: OnboardingTask[]
  completedTasksCount: number
  totalTasksCount: number
}

export interface HREmployee {
  id: string
  employeeNo: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  phone?: string
  position: string
  department: string
  employmentType: EmploymentType
  workSetup: WorkSetup
  status: HREmploymentStatus
  startDate: string
  endDate?: string
  salary?: number
  avatar?: string
  address?: string
  birthday?: string
  gender?: string
  sssNo?: string
  philhealthNo?: string
  pagibigNo?: string
  tinNo?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  documents?: HRDocument[]
  jobId?: string             // job posting they were hired from
  managerId?: string
  notes?: string
  createdAt: string
}

export interface HRLeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeNo: string
  department: string
  leaveType: HRLeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: HRLeaveStatus
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  appliedAt: string
}

// ─── AMS (Asset Management System) ──────────────────────────────────────────

export type AssetCategory =
  | 'LAPTOP' | 'DESKTOP' | 'MONITOR' | 'PRINTER' | 'PROJECTOR'
  | 'ROUTER' | 'LAB_EQUIPMENT' | 'TABLET' | 'SERVER' | 'OTHER_FIXED'

export type AssetStatus =
  | 'AVAILABLE' | 'BORROWED' | 'DEPLOYED' | 'IN_USE'
  | 'UNDER_MAINTENANCE' | 'DAMAGED' | 'LOST' | 'RETIRED' | 'OVERDUE'

export type DeploymentType =
  | 'TEMPORARY_BORROW' | 'LONG_TERM_DEPLOYMENT' | 'PERMANENT_ASSIGNMENT'

export type AssetDeploymentStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE'

export type AssetActivityType =
  | 'REGISTERED' | 'BORROWED' | 'RETURNED' | 'DEPLOYED'
  | 'MAINTENANCE_STARTED' | 'MAINTENANCE_COMPLETED'
  | 'STATUS_CHANGED' | 'CUSTODIAN_CHANGED' | 'DAMAGED' | 'LOST' | 'RETIRED'

export type ConsumableUnit =
  | 'PIECE' | 'REAM' | 'BOX' | 'BOTTLE' | 'SET' | 'PACK' | 'LITER' | 'KILOGRAM'

export type StockStatus = 'LOW' | 'NORMAL' | 'OVERSTOCK'

export type MaintenanceType =
  | 'REPAIR' | 'PREVENTIVE' | 'WARRANTY_CLAIM' | 'INSPECTION'

export type MaintenanceStatus =
  | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type ConsumableTransactionType = 'ISSUE' | 'RESTOCK' | 'ADJUSTMENT'

export type TagComponentType =
  | 'PREFIX' | 'DEPT_CODE' | 'CATEGORY' | 'YEAR' | 'SEQUENCE' | 'SUFFIX' | 'CUSTOM'

export interface AssetInclusion {
  id: string
  name: string
  quantity: number
  photo?: string
}

export interface Asset {
  id: string
  assetTag: string
  name: string
  category: AssetCategory
  brand?: string
  model?: string
  serialNumber?: string
  description?: string
  status: AssetStatus
  department: string
  custodianType: 'INDIVIDUAL' | 'DEPARTMENT'
  custodianId?: string
  custodianName?: string
  purchaseDate?: string
  supplier?: string
  purchaseCost?: number
  warrantyExpiry?: string
  campus?: string
  building?: string
  room?: string
  storageArea?: string
  photo?: string
  inclusions?: AssetInclusion[]
  createdAt: string
  updatedAt: string
}

export interface AssetDeployment {
  id: string
  assetId: string
  assetTag: string
  assetName: string
  borrowerName: string
  borrowerDepartment: string
  custodian?: string
  deploymentType: DeploymentType
  startDate: string
  startTime?: string
  expectedReturnDate?: string
  expectedReturnTime?: string
  purpose: string
  status: AssetDeploymentStatus
  returnDate?: string
  returnTime?: string
  returnedBy?: string
  receivedBy?: string
  conditionOnReturn?: string
  inspectionNotes?: string
  missingAccessories?: string[]
  damageReport?: string
  createdAt: string
}

export interface AssetHistory {
  id: string
  assetId: string
  assetTag: string
  assetName: string
  activityType: AssetActivityType
  user?: string
  department?: string
  custodian?: string
  startDate: string
  endDate?: string
  duration?: string
  location?: string
  status: AssetStatus
  remarks?: string
  createdAt: string
}

export interface Consumable {
  id: string
  name: string
  description?: string
  category: string
  unit: ConsumableUnit
  quantity: number
  lowStockThreshold: number
  overstockThreshold: number
  purchaseDate?: string
  supplier?: string
  cost?: number
  createdAt: string
}

export interface ConsumableTransaction {
  id: string
  consumableId: string
  consumableName: string
  type: ConsumableTransactionType
  quantity: number
  requestedBy: string
  department: string
  purpose?: string
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

export interface MaintenanceLog {
  id: string
  assetId: string
  assetTag: string
  assetName: string
  maintenanceType: MaintenanceType
  status: MaintenanceStatus
  description: string
  reportedBy: string
  assignedTo?: string
  startDate: string
  completionDate?: string
  cost?: number
  notes?: string
  createdAt: string
}

export interface TagFormatComponent {
  type: TagComponentType
  value?: string
  width?: number
}

export interface AssetTagFormat {
  id: string
  name: string
  components: TagFormatComponent[]
  separator: string
  preview: string
  isDefault: boolean
  createdAt: string
}

// ─── Financial Operations Suite ───────────────────────────────────────────────

export type PRStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCUREMENT_ONGOING' | 'DELIVERED' | 'CLOSED' | 'CANCELLED'
export type PRPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type POStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'DELIVERED' | 'CLOSED' | 'CANCELLED'
export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED'
export type VendorCategory = 'SUPPLIES' | 'EQUIPMENT' | 'SERVICES' | 'CONSTRUCTION' | 'IT' | 'FOOD' | 'MEDICAL' | 'OTHER'
export type ExpenseCategory = 'OPERATIONAL' | 'PROCUREMENT' | 'PAYROLL' | 'MAINTENANCE' | 'UTILITIES' | 'EQUIPMENT' | 'OTHER'
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
export type ReservationStatus = 'ACTIVE' | 'RELEASED' | 'CONVERTED'

export interface PRItem { id: string; name: string; quantity: number; unit: string; estimatedCost: number; description?: string }

export interface PRApproval { step: number; role: string; approverName?: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; comments?: string; timestamp?: string }

export interface PurchaseRequest {
  id: string; prNumber: string; title: string; department: string
  requestedBy: string; requestedByName: string
  items: PRItem[]; totalAmount: number; purpose: string; priority: PRPriority
  status: PRStatus; budgetId?: string; reservationId?: string
  notes?: string; approvalChain: PRApproval[]; purchaseOrderId?: string
  schoolId: string; createdAt: string; updatedAt: string
  submittedAt?: string; approvedAt?: string; closedAt?: string; rejectedAt?: string; rejectionReason?: string
}

export interface POItem { id: string; name: string; quantity: number; unit: string; unitPrice: number; total: number }

export interface PurchaseOrder {
  id: string; poNumber: string; prId: string; vendorId: string; vendorName: string
  items: POItem[]; totalAmount: number; status: POStatus
  deliveryDate?: string; deliveredAt?: string; terms?: string; notes?: string
  createdBy: string; schoolId: string; createdAt: string; updatedAt: string
}

export interface Vendor {
  id: string; name: string; contactPerson?: string; phone?: string; email?: string
  address?: string; category: VendorCategory; status: VendorStatus; tin?: string; notes?: string
  schoolId: string; createdAt: string
}

export interface OfficialReceipt {
  id: string; orNumber: string; studentId: string; studentName: string; studentNo: string
  amount: number; paymentType: string; semesterId: string; soaId?: string
  issuedBy: string; issuedAt: string; schoolId: string
  voidedAt?: string; voidedBy?: string; voidReason?: string
}

export interface CashflowEntry {
  id: string; type: 'INFLOW' | 'OUTFLOW'; amount: number; description: string
  reference?: string; category: string; date: string; schoolId: string; createdAt: string
}

export interface FinancialExpense {
  id: string; title: string; category: ExpenseCategory; department?: string
  amount: number; vendor?: string; date: string; description?: string
  prId?: string; poId?: string; status: ExpenseStatus
  approvedBy?: string; approvedAt?: string; schoolId: string; createdAt: string; createdBy: string
}

export interface BudgetReservation {
  id: string; budgetId: string; prId: string; prNumber: string; department: string
  amount: number; status: ReservationStatus; createdAt: string
  releasedAt?: string; convertedAt?: string
}

// ─── Universal Request Center ─────────────────────────────────────────────────

export type RequestCategory = 'LEAVE' | 'PURCHASE' | 'ASSET' | 'GENERAL'

export type RequestType =
  | 'VACATION_LEAVE' | 'SICK_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE'
  | 'EMERGENCY_LEAVE' | 'OFFICIAL_BUSINESS_LEAVE'
  | 'PURCHASE_REQUEST' | 'PROCUREMENT_REQUEST' | 'SUPPLY_REQUEST' | 'EQUIPMENT_PURCHASE'
  | 'PC_REQUEST' | 'LAPTOP_REQUEST' | 'EQUIPMENT_BORROW' | 'DEVICE_DEPLOYMENT' | 'ASSET_RETURN'
  | 'GENERAL_REQUEST'

export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'

export type RequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type ChampionDept = 'HR' | 'PURCHASING' | 'AMO' | 'ADMIN'

export interface RequestActivity {
  id: string
  action: string
  performedBy: string
  performedByRole?: string
  timestamp: string
  remarks?: string
}

export interface UniversalRequest {
  id: string
  reqNumber: string
  category: RequestCategory
  type: RequestType
  title: string
  status: RequestStatus
  priority: RequestPriority
  submittedBy: string
  submittedByName: string
  submittedByRole: string
  portal: 'staff' | 'teacher' | 'student'
  championDept: ChampionDept
  assignedToName?: string
  formData: Record<string, string | number | undefined>
  activities: RequestActivity[]
  schoolId: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  completedAt?: string
  remarks?: string
}

// ─── Support Center / Ticketing ───────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type TicketDepartment = 'REGISTRAR' | 'ACADEMIC' | 'TREASURY' | 'HR' | 'AMO' | 'PURCHASING' | 'IT_SUPPORT' | 'GENERAL'

export type TicketCategory =
  | 'ENROLLMENT_CONCERN' | 'SUBJECT_CONCERN' | 'GRADES_CONCERN' | 'LMS_ACCESS_ISSUE' | 'SCHEDULE_CONCERN'
  | 'TOR_INQUIRY' | 'COR_CONCERN' | 'STUDENT_RECORDS' | 'DOCUMENT_CONCERN'
  | 'PAYMENT_CONCERN' | 'OR_INQUIRY' | 'BALANCE_CONCERN'
  | 'LOGIN_ISSUE' | 'PASSWORD_RESET' | 'BUG_REPORT' | 'TECHNICAL_ISSUE'
  | 'GENERAL_INQUIRY' | 'INSTITUTIONAL_CONCERN'
  | 'HR_CONCERN' | 'ASSET_CONCERN' | 'PROCUREMENT_CONCERN'

export interface TicketReply {
  id: string
  ticketId: string
  authorId: string
  authorName: string
  authorRole: string
  content: string
  isInternal: boolean
  isStaff: boolean
  attachments?: string[]
  createdAt: string
}

export interface TicketSatisfaction {
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  submittedAt: string
}

export interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  category: TicketCategory
  department: TicketDepartment
  status: TicketStatus
  priority: TicketPriority
  submittedBy: string
  submittedByName: string
  submittedByRole: string
  portal: 'staff' | 'teacher' | 'student'
  assignedTo?: string
  assignedToName?: string
  replies: TicketReply[]
  slaDeadline: string
  firstResponseAt?: string
  resolvedAt?: string
  closedAt?: string
  satisfaction?: TicketSatisfaction
  schoolId: string
  createdAt: string
  updatedAt: string
  tags?: string[]
}

export interface KBArticle {
  id: string
  title: string
  slug: string
  category: string
  content: string
  tags: string[]
  views: number
  helpful: number
  notHelpful: number
  publishedAt: string
  updatedAt: string
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

// ─── Universal Form Builder ───────────────────────────────────────────────────

export type FormFieldType =
  | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'DATE' | 'TIME'
  | 'DROPDOWN' | 'MULTI_SELECT' | 'CHECKBOX' | 'RADIO' | 'FILE_UPLOAD'
  | 'RATING' | 'SECTION_DIVIDER' | 'RICH_TEXT'

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED'
export type FormVisibility = 'PUBLIC_INTERNAL' | 'DEPARTMENT_ONLY' | 'STUDENT_ONLY' | 'STAFF_ONLY' | 'CUSTOM'
export type FormSubmissionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

export interface FormCondition {
  fieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty'
  value: string
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  options?: string[]         // for DROPDOWN, MULTI_SELECT, RADIO, CHECKBOX
  maxRating?: number         // for RATING (default 5)
  acceptedFiles?: string[]   // for FILE_UPLOAD
  autoFillKey?: string       // 'student_name' | 'student_id' | 'email' | 'department' | 'faculty_name'
  condition?: FormCondition  // show this field only if condition is true
  width?: 'full' | 'half'    // layout width
}

export interface FormSettings {
  oneSubmissionPerUser: boolean
  allowAnonymous: boolean
  deadlineDate?: string
  autoCloseOnDeadline: boolean
  showProgressBar: boolean
  successMessage: string
  routeToDept?: string       // department to notify on submission
}

export interface InstitutionalForm {
  id: string
  title: string
  description?: string
  department: string
  createdBy: string
  createdByName: string
  status: FormStatus
  visibility: FormVisibility
  visibilityDepts?: string[]  // for DEPARTMENT_ONLY / CUSTOM
  fields: FormField[]
  settings: FormSettings
  category: string            // 'Request' | 'Survey' | 'Evaluation' | 'Registration' | 'Feedback' | 'Other'
  tags?: string[]
  submissionCount: number
  schoolId: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  closedAt?: string
}

export interface FormSubmission {
  id: string
  formId: string
  formTitle: string
  submittedBy: string
  submittedByName: string
  submittedByRole: string
  responses: Record<string, string | string[] | number>
  status: FormSubmissionStatus
  notes?: string
  schoolId: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}
