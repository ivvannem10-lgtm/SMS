/**
 * Cross-module sync utility.
 * All functions mutate the shared in-memory mock arrays directly.
 * Call syncAll() to run every sync in sequence.
 */
import {
  MOCK_STAFF_MEMBERS,
  MOCK_HR_EMPLOYEES,
  MOCK_HR_LEAVES,
  MOCK_GRADE_SUBMISSIONS,
  MOCK_GRADES,
  MOCK_NOTIFICATIONS,
  MOCK_AUDIT_LOGS,
  MOCK_ENROLLMENTS,
  MOCK_STUDENTS,
  MOCK_ASSET_DEPLOYMENTS,
  MOCK_ASSETS,
  MOCK_ASSET_HISTORY,
} from './mock-data'

// ─── 1. HRIS → Team Hub ───────────────────────────────────────────────────────
// Ensures every MOCK_HR_EMPLOYEES entry appears in MOCK_STAFF_MEMBERS.

export function syncHRISToTeamHub() {
  MOCK_HR_EMPLOYEES.forEach((emp) => {
    const existing = MOCK_STAFF_MEMBERS.find((m) => m.email === emp.email)
    if (existing) {
      existing.name       = `${emp.firstName} ${emp.lastName}`
      existing.role       = emp.position
      existing.department = emp.department
      existing.phone      = emp.phone
    } else {
      MOCK_STAFF_MEMBERS.push({
        id:         `tm_hr_${emp.id}`,
        name:       `${emp.firstName} ${emp.lastName}`,
        role:       emp.position,
        department: emp.department,
        email:      emp.email,
        phone:      emp.phone,
        birthday:   emp.birthday,
        avatar:     emp.avatar,
      })
    }
  })
}

// ─── 2. Leave approvals → Employee status ────────────────────────────────────
// Sets employee status to ON_LEAVE if an approved leave covers today's date.
// Resets back to ACTIVE when the leave period has ended.

export function syncLeaveToEmployeeStatus() {
  const today = new Date().toISOString().split('T')[0]
  MOCK_HR_EMPLOYEES.forEach((emp) => {
    const activeLeavs = MOCK_HR_LEAVES.filter(
      (l) => l.employeeId === emp.id && l.status === 'APPROVED' &&
             l.startDate <= today && l.endDate >= today,
    )
    const expectedStatus = activeLeavs.length > 0 ? 'ON_LEAVE' : 'ACTIVE'
    if (emp.status === 'ON_LEAVE' || emp.status === 'ACTIVE') {
      emp.status = expectedStatus
    }
    // Mirror in Team Hub
    const member = MOCK_STAFF_MEMBERS.find((m) => m.email === emp.email)
    if (member) {
      member.role = emp.position
    }
  })
}

// ─── 3. Approved grades → Student notifications ───────────────────────────────
// Fires a notification to the student when their grade submission is approved.

export function syncApprovedGradesToNotifications() {
  MOCK_GRADE_SUBMISSIONS
    .filter((s) => s.status === 'PUBLISHED')
    .forEach((sub) => {
      sub.entries.forEach((entry) => {
        const notifId = `notif_grade_${sub.id}_${entry.studentId}`
        const already = MOCK_NOTIFICATIONS.find((n) => n.id === notifId)
        if (already) return
        MOCK_NOTIFICATIONS.push({
          id:        notifId,
          title:     'Grades Released',
          message:   `Your grade for ${sub.subjectName} has been approved. Final grade: ${entry.letterGrade ?? entry.finalGrade ?? 'N/A'}`,
          type:      'GRADE',
          isRead:    false,
          link:      '/student/grades',
          studentId: entry.studentId,
          schoolId:  'school_1',
          createdAt: sub.publishedAt ?? new Date().toISOString(),
        })
      })
    })
}

// ─── 4. Approved grades → MOCK_GRADES ────────────────────────────────────────
// Ensures approved grade submission entries are persisted to MOCK_GRADES.

export function syncApprovedGradesToRecords() {
  MOCK_GRADE_SUBMISSIONS
    .filter((s) => s.status === 'PUBLISHED')
    .forEach((sub) => {
      sub.entries.forEach((entry) => {
        const record = {
          id:                `grade_${entry.enrollmentId}`,
          quizAverage:       entry.quizAverage,
          assignmentAverage: entry.assignmentAverage,
          midtermGrade:      entry.midtermGrade,
          finalExamGrade:    entry.finalExamGrade,
          finalGrade:        entry.finalGrade,
          letterGrade:       entry.letterGrade,
          status:            entry.gradeStatus,
          enrollmentId:      entry.enrollmentId,
          gradedBy:          sub.facultyName,
          gradedAt:          sub.publishedAt,
          createdAt:         sub.submittedAt,
        }
        const idx = MOCK_GRADES.findIndex((g) => g.enrollmentId === entry.enrollmentId)
        if (idx >= 0) Object.assign(MOCK_GRADES[idx], record)
        else MOCK_GRADES.push(record)
      })
    })
}

// ─── 5. Overdue asset deployments → Asset status ─────────────────────────────
// Marks active deployments that are past their expected return date as OVERDUE.

export function syncOverdueAssets() {
  const today = new Date().toISOString().split('T')[0]
  MOCK_ASSET_DEPLOYMENTS
    .filter((d) => d.status === 'ACTIVE' && d.expectedReturnDate && d.expectedReturnDate < today)
    .forEach((dep) => {
      dep.status = 'OVERDUE' as typeof dep.status
      const asset = MOCK_ASSETS.find((a) => a.id === dep.assetId)
      if (asset && asset.status === 'BORROWED') {
        asset.status = 'OVERDUE'
        // Log status change if not already logged
        const alreadyLogged = MOCK_ASSET_HISTORY.some(
          (h) => h.assetId === dep.assetId && h.activityType === 'STATUS_CHANGED' && h.remarks?.includes('overdue'),
        )
        if (!alreadyLogged) {
          MOCK_ASSET_HISTORY.push({
            id:           `hist_overdue_${dep.id}`,
            assetId:      dep.assetId,
            assetTag:     asset.assetTag,
            assetName:    asset.name,
            activityType: 'STATUS_CHANGED',
            user:         'System',
            startDate:    today,
            status:       'OVERDUE',
            remarks:      `Asset marked overdue — expected return was ${dep.expectedReturnDate}. Borrower: ${dep.borrowerName}`,
            createdAt:    new Date().toISOString(),
          })
        }
      }
    })
}

// ─── 6. Enrollment → Student status ──────────────────────────────────────────
// Sets student status to ACTIVE when they have at least one ENROLLED enrollment.

export function syncEnrollmentToStudentStatus() {
  const enrolledIds = new Set(
    MOCK_ENROLLMENTS.filter((e) => e.status === 'ENROLLED').map((e) => e.studentId),
  )
  MOCK_STUDENTS.forEach((s) => {
    if (enrolledIds.has(s.id) && s.status === 'INACTIVE') {
      s.status = 'ACTIVE'
    }
  })
}

// ─── Master sync ──────────────────────────────────────────────────────────────

export interface SyncResult {
  ran: string[]
  timestamp: string
}

export function syncAll(): SyncResult {
  syncHRISToTeamHub()
  syncLeaveToEmployeeStatus()
  syncApprovedGradesToRecords()
  syncApprovedGradesToNotifications()
  syncOverdueAssets()
  syncEnrollmentToStudentStatus()

  return {
    ran: [
      'HRIS → Team Hub',
      'Leave → Employee Status',
      'Approved Grades → Records',
      'Approved Grades → Notifications',
      'Overdue Asset Detection',
      'Enrollment → Student Status',
    ],
    timestamp: new Date().toISOString(),
  }
}
