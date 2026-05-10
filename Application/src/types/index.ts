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

export type GradeSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

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
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
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

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface PipelineStats {
  pendingApplicants: number
  acceptedApplicants: number
  enrolledStudents: number
  pendingPayments: number
  activeSubjects: number
  activeTeachers: number
}
