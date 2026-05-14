'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, X, Send } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIAssistantProps {
  userRole: string
  userName: string
  portal: 'staff' | 'teacher' | 'student'
}

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

function getAIResponse(message: string, role: string, portal: string): string {
  const msg = message.toLowerCase()

  // ── STUDENT ──────────────────────────────────────────────────────────────
  if (portal === 'student' || role === 'STUDENT') {
    if (msg.includes('grade') || msg.includes('check grade')) {
      return "Your grades are in **My Grades** (sidebar). Only grades officially published by the Registrar appear there. If grades are missing, your professor may still be submitting them for review.\n\nPath: Student Portal → My Grades\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('payment') || msg.includes('soa') || msg.includes('balance') || msg.includes('tuition')) {
      return "Check your **Statement of Account** under **SOA** in the sidebar. You can see your balance, payment history, and breakdown.\n\nFor payment concerns (GCash, bank transfer not reflected), go to **Support Center → Payment Concern** and submit a ticket with your reference number.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('enrollment') || msg.includes('enroll') || msg.includes('subject')) {
      return "Your enrolled subjects are in **My Subjects** (sidebar). If you're pre-enrolled, your status will update once Treasury confirms payment.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('quiz') || msg.includes('assignment') || msg.includes('assessment')) {
      return "Access assessments from **My Subjects → [Course] → Quizzes or Assignments**. Make sure you're within the deadline window to submit.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('lms') || msg.includes('course') || msg.includes('module')) {
      return "Your course materials are under **My Subjects**. Click any course card to access modules, quizzes, assignments, and performance tasks.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('schedule')) {
      return "Your class schedule is visible on your subject cards under **My Subjects**. Expand 'More info' on any card to see the full schedule.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('support') || msg.includes('ticket') || msg.includes('help') || msg.includes('concern') || msg.includes('problem')) {
      return "Go to **Support Center** in the sidebar to submit a support ticket. Choose the right category and your concern is automatically routed to the right office.\n\nFor urgent issues, choose **Critical** priority.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('document') || msg.includes('tor') || msg.includes('transcript') || msg.includes('certificate') || msg.includes('cor')) {
      return "For official documents (TOR, COR, Good Moral), go to **Support Center → TOR Inquiry** and submit a ticket. Processing takes 3–5 business days.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('profile') || msg.includes('personal info')) {
      return "View and manage your profile under **My Profile** in the sidebar.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('notification')) {
      return "Your notifications appear in the **bell icon** at the top-right of every page.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('password') || msg.includes('login') || msg.includes('access')) {
      return "For login issues, go to **Support Center → Login Issue** and submit a ticket. IT Support will reset your account within 1–2 hours.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('request') || msg.includes('borrow') || msg.includes('asset') || msg.includes('laptop') || msg.includes('pc') || msg.includes('equipment')) {
      return "To borrow equipment, go to **Request Center → PC Request or Equipment Borrow Request** and fill in the form. Your request goes to Asset Management.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
  }

  // ── TEACHER ──────────────────────────────────────────────────────────────
  if (portal === 'teacher' || role === 'TEACHER') {
    if (msg.includes('submit grade') || msg.includes('finalize')) {
      return "In **My Grades**, find the subject and click **Submit Grades**. The Registrar reviews it, then publishes to students.\n\nStatuses: Submitted → Closed → Published.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('grade') || msg.includes('grade book') || msg.includes('grading')) {
      return "Go to **My Grades** or **Subjects → [Course] → Grades** to access the grade book. Enter quiz, midterm, exam grades, then click **Save**.\n\nWhen ready, click **Submit Grades** to send to the Registrar for review and publishing.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('quiz') || msg.includes('create quiz') || msg.includes('assessment')) {
      return "Go to **Subjects → [Course] → Quizzes** and click **Create Assessment**. Choose the type, add questions, and publish when ready.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('assignment')) {
      return "Under **Subjects → [Course] → Assignments**, click the **+** to create a new assignment. Set the deadline and publish.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('performance task') || msg.includes('rubric')) {
      return "Create a Performance Task under **Subjects → [Course] → Performance Tasks**. You can build a rubric with weighted criteria.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('schedule') || msg.includes('room')) {
      return "Your room schedule is under **My Schedule**. Only published offerings assigned to you appear there.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('subject') || msg.includes('course') || msg.includes('offering')) {
      return "Your assigned subjects are under **My Subjects** (sidebar). Each subject has sub-pages: Materials, Assignments, Quizzes, Performance Tasks, Grades, Attendance, Criteria.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('criteria') || msg.includes('grading criteria') || msg.includes('weight')) {
      return "Edit grade weights under **Subjects → [Course] → Criteria** (gear icon). You can add custom categories and distribute weights.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('announcement')) {
      return "Post announcements under **Subjects → [Course] → Announcements**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('attendance')) {
      return "Mark attendance under **Subjects → [Course] → Attendance**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('leave') || msg.includes('vacation') || msg.includes('sick')) {
      return "Submit leave requests via **Request Center** in the sidebar. Choose Leave type → HR automatically receives it.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('support') || msg.includes('help') || msg.includes('ticket')) {
      return "Use **Support Center** in the sidebar for technical issues or concerns. Your ticket is routed to the right department automatically.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('request') || msg.includes('borrow') || msg.includes('laptop') || msg.includes('asset')) {
      return "Go to **Request Center → Laptop Request or Equipment Borrow** to submit asset requests. AMO processes them.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
  }

  // ── STAFF ROLES ──────────────────────────────────────────────────────────
  if (portal === 'staff') {

    // REGISTRAR
    if (role === 'REGISTRAR') {
      if (msg.includes('student') || msg.includes('records') || msg.includes('find student')) {
        return "Search students at **Registrar → Student Records**. Click any student to view and edit their full profile.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('enrollment') || msg.includes('enroll student')) {
        return "In a student's profile, go to **Academic Records** tab to manage enrollments.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('document') || msg.includes('generate') || msg.includes('tor') || msg.includes('cor')) {
        return "Go to **Registrar → Document Generator** to create official documents. Choose a template, select a student, and generate.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('grade') || msg.includes('finalization')) {
        return "The **Grade Finalization Room** is under **Grades** in the sidebar. Review submitted grades from teachers, close them, then publish to students.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('import') || msg.includes('bulk') || msg.includes('mass register')) {
        return "Use the **Import** button on the Registrar page to bulk upload students using the Excel template.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('support') || msg.includes('ticket')) {
        return "Your support queue is under **Support Center** in the sidebar. Registrar tickets (TOR, COR, enrollment concerns) appear in your Inbox.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('request')) {
        return "Review incoming requests under **Request Center** in the sidebar.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // TREASURER
    if (role === 'TREASURER') {
      if (msg.includes('payment') || msg.includes('collection')) {
        return "Record payments at **Treasury → Collections**. Search by student, enter amount, and issue an Official Receipt.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('receipt') || msg.includes('or')) {
        return "Official Receipts are at **Treasury → Official Receipts**. You can search, print, or void receipts.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('soa') || msg.includes('student account')) {
        return "View student SOAs at **Treasury → Student Accounts**. Select a student to see their full SOA and payment history.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('support') || msg.includes('ticket')) {
        return "Payment-related support tickets appear in your **Support Center Inbox** automatically.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // ACCOUNTING
    if (role === 'ACCOUNTING') {
      if (msg.includes('budget')) {
        return "Manage department budgets at **Accounting → Budget Management**. Create budgets and track spending per department.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('cashflow')) {
        return "Monitor institutional cashflow at **Accounting → Cashflow**. See inflows, outflows, and running balance.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('expense')) {
        return "Record and approve expenses at **Accounting → Expenses**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('report')) {
        return "Financial reports are at **Accounting → Reports**. Includes cashflow, budget utilization, expense summary, and collection reports.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('purchase request') || msg.includes('pr')) {
        return "Review purchase requests from departments at **Purchasing → Purchase Requests**. You approve Step 1 of the procurement workflow.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // HR_STAFF
    if (role === 'HR_STAFF') {
      if (msg.includes('employee') || msg.includes('staff')) {
        return "Manage employees at **Human Resources → Employees**. Add new employees or view existing records.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('leave') || msg.includes('leave request')) {
        return "Review and approve leave requests at **HR → Leave Requests**. Approve or reject with a reason.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('onboarding')) {
        return "Track onboarding checklists at **HR → Onboarding**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('recruitment') || msg.includes('job') || msg.includes('applicant')) {
        return "Manage job postings and applicants at **HR → Recruitment** (Kanban board) and **HR → Job Postings**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('request')) {
        return "Leave requests submitted by staff appear in your **Request Center Inbox** automatically.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // AMO
    if (role === 'AMO') {
      if (msg.includes('asset') || msg.includes('register')) {
        return "Register assets at **AMS → Asset Registry → Register Asset** (manual) or use **Mass Register** (Excel upload) for bulk registration.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('borrow') || msg.includes('deploy')) {
        return "Manage borrows and deployments at **AMS → Borrow & Deploy**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('maintenance')) {
        return "Log maintenance work at **AMS → Maintenance**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('consumable') || msg.includes('supply') || msg.includes('stock')) {
        return "Manage supplies at **AMS → Consumables**. Set low-stock thresholds for automatic alerts.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('request') || msg.includes('incoming')) {
        return "Asset requests from staff and students appear in your **Request Center Inbox**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // PURCHASING_OFFICER
    if (role === 'PURCHASING_OFFICER') {
      if (msg.includes('purchase request')) {
        return "Review and process purchase requests at **Purchasing → Purchase Requests**. You handle Step 2 approvals.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('purchase order') || msg.includes('po')) {
        return "Create Purchase Orders at **Purchasing → Purchase Orders** after a PR is approved.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('vendor')) {
        return "Manage vendors at **Purchasing → Vendors**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('request')) {
        return "Purchase-related requests from staff appear in your **Request Center Inbox**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // ACADEMIC_ADMIN
    if (role === 'ACADEMIC_ADMIN') {
      if (msg.includes('offering') || msg.includes('subject') || msg.includes('course')) {
        return "Manage and publish course offerings at **Academic → Offerings**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('room') || msg.includes('schedule')) {
        return "Configure room availability at **Academic → Rooms**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('semester') || msg.includes('academic year')) {
        return "Set academic years and semesters at **Academic → Academic Years**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('grade') || msg.includes('finalization')) {
        return "Monitor grade submissions in the **Grade Finalization Room** under **Grades**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // DEAN
    if (role === 'DEAN') {
      if (msg.includes('department') || msg.includes('student')) {
        return "View your department's students at **Dean → Students**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('budget')) {
        return "Your department budget is at **Dean → Department Budget**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('assignment') || msg.includes('teacher')) {
        return "Assign teachers to offerings at **Dean → Assignments**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
      if (msg.includes('statistic')) {
        return "View department statistics at **Dean → Statistics**.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
      }
    }

    // SUPER_ADMIN / General staff
    if (msg.includes('user management') || msg.includes('user') || msg.includes('role')) {
      return "Manage users and roles at **Users & Roles** in the sidebar (Super Admin only).\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('calendar') || msg.includes('event')) {
      return "View and manage the academic calendar at **Calendar** in the sidebar.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('team') || msg.includes('directory')) {
      return "Browse the staff directory at **Team Hub** in the sidebar.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('setting')) {
      return "Access account settings from the top-right profile dropdown → Settings.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
    if (msg.includes('help') || msg.includes('manual')) {
      return "Visit the **Help** section (question mark in sidebar or profile menu) for user manuals and FAQs.\n\n💡 Need more help? You can also check the **Support Center** to submit a ticket."
    }
  }

  // ── FALLBACK ─────────────────────────────────────────────────────────────
  return "I can help you navigate SchoolEco and find what you need. Could you be more specific? For example: 'How do I check my grades?', 'Where can I submit a leave request?', or 'How do I generate a document?'"
}

// ─── Suggested Prompts per Role ───────────────────────────────────────────────

function getSuggestedPrompts(role: string, portal: string): string[] {
  if (portal === 'student' || role === 'STUDENT') {
    return [
      'How do I check my grades?',
      'Where is my SOA?',
      'How do I access my LMS courses?',
      'How do I submit a support ticket?',
      'How do I request official documents?',
    ]
  }
  if (portal === 'teacher' || role === 'TEACHER') {
    return [
      'How do I submit grades?',
      'How do I create a quiz?',
      'Where is my schedule?',
      'How do I file a leave request?',
      'How do I set grade criteria?',
    ]
  }
  if (role === 'REGISTRAR') {
    return [
      'How do I find a student?',
      'How do I generate a TOR?',
      'Where is grade finalization?',
      'How do I bulk import students?',
      'Where are support tickets?',
    ]
  }
  if (role === 'TREASURER') {
    return [
      'How do I record a payment?',
      'How do I generate an OR?',
      'Where are student accounts?',
    ]
  }
  if (role === 'ACCOUNTING') {
    return [
      'Where is cashflow monitoring?',
      'How do I create a budget?',
      'Where are financial reports?',
      'How do I approve expenses?',
    ]
  }
  if (role === 'HR_STAFF') {
    return [
      'How do I approve a leave request?',
      'Where are incoming requests?',
      'How do I add a new employee?',
      'Where is recruitment?',
    ]
  }
  if (role === 'AMO') {
    return [
      'How do I register assets in bulk?',
      'How do I process a borrow request?',
      'Where are low stock alerts?',
      'How do I log maintenance?',
    ]
  }
  if (role === 'PURCHASING_OFFICER') {
    return [
      'How do I process a purchase request?',
      'How do I create a purchase order?',
      'Where are incoming requests?',
    ]
  }
  // ACADEMIC_ADMIN / DEAN / SUPER_ADMIN / other
  return [
    'What can I do in SchoolEco?',
    'How do I navigate this portal?',
    'Where is the calendar?',
    'How do I contact support?',
  ]
}

// ─── Message Renderer ─────────────────────────────────────────────────────────

function renderMessage(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Process **bold** within a line
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const processed = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return <span key={j}>{part}</span>
    })

    const isArrow = line.trimStart().startsWith('→')
    return (
      <span
        key={i}
        className={`block${isArrow ? ' pl-3 text-brand-600 font-medium' : ''}`}
        style={i < lines.length - 1 ? { marginBottom: '4px' } : undefined}
      >
        {processed}
      </span>
    )
  })
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(portal: string, userName: string, userRole: string): string {
  if (portal === 'student') {
    return `Hi ${userName}! I can help you with your enrollment, grades, payments, LMS, and anything in your student portal. What's on your mind?`
  }
  if (portal === 'teacher') {
    // Extract last name
    const parts = userName.trim().split(' ')
    const lastName = parts[parts.length - 1]
    return `Hi Prof. ${lastName}! I'm here to help with your classes, grades, schedules, and anything else in SchoolEco. What do you need?`
  }
  // Staff
  return `Hi ${userName}! I'm your SchoolEco assistant. I can help you navigate the system, find what you need, and answer questions about your role as ${userRole.replace(/_/g, ' ')}. What can I help you with?`
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* AI avatar dot */}
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIAssistant({ userRole, userName, portal }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const suggestedPrompts = getSuggestedPrompts(userRole, portal)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Show greeting on first open
  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setHasUnread(false)
    if (!hasGreeted) {
      setHasGreeted(true)
      const greeting = getGreeting(portal, userName, userRole)
      const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      setMessages([
        {
          id: `ai-greeting-${Date.now()}`,
          role: 'ai',
          content: greeting,
          timestamp: now,
        },
      ])
      setShowSuggestions(true)
    }
  }, [hasGreeted, portal, userName, userRole])

  const handleClose = () => setIsOpen(false)

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isTyping) return

      const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: now,
      }

      setMessages(prev => [...prev, userMsg])
      setInput('')
      setShowSuggestions(false)
      setIsTyping(true)

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      // Simulate AI typing delay (800–1400ms)
      const delay = 800 + Math.random() * 600
      setTimeout(() => {
        const responseText = getAIResponse(trimmed, userRole, portal)
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: responseText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, aiMsg])
        setIsTyping(false)
        setShowSuggestions(true)
      }, delay)
    },
    [isTyping, userRole, portal]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize up to 3 lines (~72px)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 72) + 'px'
  }

  return (
    <div
      className="fixed bottom-6 right-6"
      style={{ zIndex: 999 }}
      aria-label="SchoolEco AI Assistant"
    >
      {/* ── Chat Panel ─────────────────────────────────────────────────── */}
      <div
        className={`absolute bottom-[72px] right-0 w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ height: '520px' }}
        role="dialog"
        aria-modal="true"
        aria-label="SchoolEco AI Chat"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none">SchoolEco AI</p>
            <p className="text-white/60 text-xs mt-0.5">Powered by SchoolEco</p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50/50">
          {messages.map(msg =>
            msg.role === 'user' ? (
              /* User message */
              <div key={msg.id} className="flex flex-col items-end mb-3">
                <div className="max-w-[85%] bg-brand-500 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm text-sm leading-relaxed">
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 mr-1">{msg.timestamp}</span>
              </div>
            ) : (
              /* AI message */
              <div key={msg.id} className="flex items-end gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm text-sm leading-relaxed">
                    {renderMessage(msg.content)}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 ml-1">{msg.timestamp}</span>
                </div>
              </div>
            )
          )}

          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {showSuggestions && !isTyping && (
          <div className="flex-shrink-0 px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto">
            <div className="flex gap-2 w-max">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100 hover:border-brand-300 transition-colors font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="flex-shrink-0 px-3 py-3 bg-white border-t border-slate-100">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/15 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask SchoolEco AI anything..."
              rows={1}
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 resize-none outline-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: '72px', minHeight: '24px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* ── Floating Button ─────────────────────────────────────────────── */}
      <div className="relative group">
        {/* Pulsing unread badge */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white z-10 animate-pulse" />
        )}

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-brand-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Ask SchoolEco AI
          <div className="absolute top-full right-4 border-4 border-transparent border-t-brand-900" />
        </div>

        <button
          onClick={isOpen ? handleClose : handleOpen}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg flex items-center justify-center text-white hover:from-brand-500 hover:to-brand-700 hover:shadow-xl transition-all duration-200 animate-[bounce_1s_ease-in-out_3]"
          aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
          style={{
            animationIterationCount: 3,
            animationFillMode: 'both',
          }}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
