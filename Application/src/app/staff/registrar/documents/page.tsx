'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  FileText, Plus, Search, ChevronRight, ChevronLeft, Printer, History,
  LayoutTemplate, Zap, Trash2, Eye, CheckCircle2, X, AlertCircle, Edit2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown, Upload, Clock, RotateCcw, Copy, Tag, Strikethrough,
  Undo2, Redo2, Columns, Star, List, Table, Move, Info,
} from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MOCK_STUDENTS, MOCK_SCHOOL, MOCK_ACADEMIC_YEARS, MOCK_SEMESTERS, MOCK_DEPARTMENTS } from '@/lib/mock-data'
import type { Student } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────

type TemplateType = 'TRANSCRIPT' | 'ENROLLMENT_CERT' | 'GOOD_MORAL' | 'CUSTOM'

interface TemplateVersion { id: string; savedAt: string; body: string; version: string; note?: string }

interface DocTemplate {
  id: string; name: string; type: TemplateType; description: string; body: string
  isBuiltIn: boolean; isDefault?: boolean; createdAt: string; updatedAt: string
  currentVersion: string; versions: TemplateVersion[]
}

interface DocRecord {
  id: string; templateId: string; templateName: string
  studentDisplayId: string; studentName: string; generatedAt: string; purpose: string
}

interface SubjectRow {
  semester_name: string; ay: string; year: number
  subject_code: string; subject_name: string; units: number
  grade: string; grade_letter: string; remarks: string
}

// ── Mock Academic Records (demo data for TOR generation) ─────────────────────

function gradeToLetter(g: string): string {
  const n = parseFloat(g)
  if (isNaN(n)) return g
  if (n <= 1.00) return 'Excellent'
  if (n <= 1.50) return 'Superior'
  if (n <= 2.00) return 'Very Good'
  if (n <= 2.50) return 'Good'
  if (n <= 3.00) return 'Satisfactory'
  return 'Failed'
}

function makeRow(sem: string, ay: string, yr: number, code: string, name: string, units: number, grade: string | null): SubjectRow {
  const g = grade ?? 'INC'
  return {
    semester_name: sem, ay, year: yr,
    subject_code: code, subject_name: name, units,
    grade: grade ?? 'INC',
    grade_letter: grade ? gradeToLetter(grade) : 'Incomplete',
    remarks: grade === null ? 'Ongoing' : parseFloat(grade) <= 3.00 ? 'Passed' : 'Failed',
  }
}

const DEMO_RECORDS: Record<string, SubjectRow[]> = {
  st_demo: [
    // 1st Year — 1st Sem 2023-2024
    makeRow('1st Semester', '2023-2024', 1, 'GE 101', 'Understanding the Self', 3, '1.25'),
    makeRow('1st Semester', '2023-2024', 1, 'GE 102', 'Readings in Philippine History', 3, '1.50'),
    makeRow('1st Semester', '2023-2024', 1, 'CS 101', 'Introduction to Computing', 3, '1.25'),
    makeRow('1st Semester', '2023-2024', 1, 'MATH 101', 'Mathematics in the Modern World', 3, '1.75'),
    makeRow('1st Semester', '2023-2024', 1, 'PE 1', 'Physical Education 1', 2, '1.00'),
    // 1st Year — 2nd Sem 2023-2024
    makeRow('2nd Semester', '2023-2024', 1, 'GE 103', 'The Contemporary World', 3, '1.50'),
    makeRow('2nd Semester', '2023-2024', 1, 'CS 102', 'Computer Programming 1', 3, '1.25'),
    makeRow('2nd Semester', '2023-2024', 1, 'CS 103', 'Discrete Mathematics', 3, '2.00'),
    makeRow('2nd Semester', '2023-2024', 1, 'NSTP 1', 'National Service Training', 3, '1.00'),
    makeRow('2nd Semester', '2023-2024', 1, 'PE 2', 'Physical Education 2', 2, '1.00'),
    // 2nd Year — 1st Sem 2024-2025
    makeRow('1st Semester', '2024-2025', 2, 'CS 201', 'Data Structures and Algorithms', 3, '1.50'),
    makeRow('1st Semester', '2024-2025', 2, 'CS 202', 'Computer Organization', 3, '1.75'),
    makeRow('1st Semester', '2024-2025', 2, 'MATH 201', 'Calculus for Computing', 3, '2.00'),
    makeRow('1st Semester', '2024-2025', 2, 'CS 203', 'Object-Oriented Programming', 3, '1.25'),
    makeRow('1st Semester', '2024-2025', 2, 'GE 104', 'Ethics', 3, '1.50'),
    // 2nd Year — 2nd Sem 2024-2025
    makeRow('2nd Semester', '2024-2025', 2, 'CS 204', 'Database Management Systems', 3, '1.25'),
    makeRow('2nd Semester', '2024-2025', 2, 'CS 205', 'Operating Systems', 3, '1.75'),
    makeRow('2nd Semester', '2024-2025', 2, 'MATH 202', 'Linear Algebra', 3, '2.25'),
    makeRow('2nd Semester', '2024-2025', 2, 'CS 206', 'Web Development Fundamentals', 3, '1.25'),
    // Current (Ongoing) — 1st Sem 2025-2026
    makeRow('1st Semester', '2025-2026', 3, 'CS 301', 'Software Engineering', 3, null),
    makeRow('1st Semester', '2025-2026', 3, 'CS 302', 'Computer Networks', 3, null),
    makeRow('1st Semester', '2025-2026', 3, 'CS 303', 'Algorithms and Complexity', 3, null),
    makeRow('1st Semester', '2025-2026', 3, 'CS 304', 'Human-Computer Interaction', 3, null),
  ],
}

function getLoopRows(studentId: string, type: string): SubjectRow[] {
  const all = DEMO_RECORDS[studentId] ?? []
  const activeSem = ACTIVE_SEM?.name ?? '1st Semester 2025-2026'
  switch (type) {
    case 'current_subjects': return all.filter((r) => `${r.semester_name} ${r.ay}` === activeSem || r.remarks === 'Ongoing')
    case 'completed_subjects': return all.filter((r) => r.remarks === 'Passed')
    case 'failed_subjects': return all.filter((r) => r.remarks === 'Failed')
    default: return all
  }
}

function calcGWA(studentId: string): string {
  const passed = (DEMO_RECORDS[studentId] ?? []).filter((r) => r.remarks === 'Passed')
  if (passed.length === 0) return 'N/A'
  const tw = passed.reduce((s, r) => s + r.units * parseFloat(r.grade), 0)
  const tu = passed.reduce((s, r) => s + r.units, 0)
  return (tw / tu).toFixed(4)
}

function totalUnits(studentId: string): string {
  return String((DEMO_RECORDS[studentId] ?? []).filter((r) => r.remarks === 'Passed').reduce((s, r) => s + r.units, 0))
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIVE_AY  = MOCK_ACADEMIC_YEARS.find((a) => a.isActive) ?? MOCK_ACADEMIC_YEARS[0]
const ACTIVE_SEM = MOCK_SEMESTERS.find((s) => s.isActive) ?? MOCK_SEMESTERS[0]
const YEAR_LABELS: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' }

// ── Placeholder groups ─────────────────────────────────────────────────────────

interface PhItem { key: string; label: string; desc: string }
interface PhGroup { id: string; label: string; color: string; items: PhItem[]; note?: string }

const PH_GROUPS: PhGroup[] = [
  {
    id: 'personal', label: 'Personal Information', color: 'blue',
    items: [
      { key: 'full_name',    label: 'Full Name',    desc: 'Complete name' },
      { key: 'student_id',   label: 'Student ID',   desc: 'ID number' },
      { key: 'nickname',     label: 'Nickname',     desc: 'Student\'s nickname' },
      { key: 'email',        label: 'Email',        desc: 'Email address' },
      { key: 'phone_number', label: 'Phone',        desc: 'Contact number' },
      { key: 'birthday',     label: 'Birthday',     desc: 'Date of birth' },
      { key: 'address',      label: 'Address',      desc: 'Student address' },
      { key: 'gender',       label: 'Gender',       desc: 'Student gender' },
    ],
  },
  {
    id: 'academic', label: 'Academic Information', color: 'brand',
    items: [
      { key: 'program',         label: 'Program',         desc: 'Degree program name' },
      { key: 'department',      label: 'Department',      desc: 'College / department' },
      { key: 'year_level',      label: 'Year Level',      desc: 'e.g. 1st Year' },
      { key: 'semester',        label: 'Semester',        desc: 'Active semester' },
      { key: 'academic_year',   label: 'Academic Year',   desc: 'Current academic year' },
      { key: 'date_enrolled',   label: 'Date Enrolled',   desc: 'Enrollment date' },
      { key: 'date_graduated',  label: 'Date Graduated',  desc: 'Graduation date (if any)' },
      { key: 'academic_status', label: 'Academic Status', desc: 'ACTIVE, GRADUATED, etc.' },
      { key: 'gwa',             label: 'GWA',             desc: 'General Weighted Average' },
      { key: 'total_units',     label: 'Total Units',     desc: 'Earned credit units' },
      { key: 'date_generated',  label: 'Date Generated',  desc: 'Today\'s date' },
      { key: 'school_name',     label: 'School Name',     desc: 'Institution name' },
    ],
  },
  {
    id: 'loop_fields', label: 'Inside Subject Loop', color: 'violet',
    note: 'Use only inside a subject loop table row (highlighted in green)',
    items: [
      { key: 'subject_code',  label: 'Subject Code',  desc: 'e.g. CS 101' },
      { key: 'subject_name',  label: 'Subject Name',  desc: 'Full subject title' },
      { key: 'units',         label: 'Units',         desc: 'Credit units (number)' },
      { key: 'grade',         label: 'Grade',         desc: 'Numerical grade (1.00–5.00)' },
      { key: 'grade_letter',  label: 'Grade Letter',  desc: 'e.g. Excellent, Good' },
      { key: 'remarks',       label: 'Remarks',       desc: 'Passed / Failed / Ongoing' },
      { key: 'semester_name', label: 'Semester (loop)',desc: 'Semester of this subject' },
      { key: 'ay',            label: 'Acad. Year (loop)', desc: 'Academic year of this subject' },
    ],
  },
]

const ALL_PH_ITEMS = PH_GROUPS.flatMap((g) => g.items)
const KNOWN_KEYS   = new Set(ALL_PH_ITEMS.map((p) => p.key))

const TYPE_LABELS: Record<TemplateType, string> = {
  TRANSCRIPT: 'Transcript', ENROLLMENT_CERT: 'Enrollment', GOOD_MORAL: 'Good Moral', CUSTOM: 'Custom',
}
const TYPE_COLORS: Record<TemplateType, string> = {
  TRANSCRIPT: 'bg-blue-50 text-blue-700 border-blue-200',
  ENROLLMENT_CERT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  GOOD_MORAL: 'bg-violet-50 text-violet-700 border-violet-200',
  CUSTOM: 'bg-slate-100 text-slate-600 border-slate-200',
}

// ── Inline span styles (must survive innerHTML round-trips) ───────────────────

const PILL = `display:inline-flex;align-items:center;background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;border-radius:4px;padding:1px 7px;font-size:0.82em;font-family:monospace;font-weight:600;cursor:pointer;white-space:nowrap;`
const IF_S  = `display:inline-flex;align-items:center;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:4px;padding:1px 7px;font-size:0.8em;font-family:monospace;font-weight:700;cursor:default;white-space:nowrap;`
const ELSE_S= `display:inline-flex;align-items:center;background:#fef9c3;color:#854d0e;border:1px solid #fcd34d;border-radius:4px;padding:1px 7px;font-size:0.8em;font-family:monospace;font-weight:700;cursor:default;white-space:nowrap;`
const ENIF_S= `display:inline-flex;align-items:center;background:#fce7f3;color:#9d174d;border:1px solid #f9a8d4;border-radius:4px;padding:1px 7px;font-size:0.8em;font-family:monospace;font-weight:700;cursor:default;white-space:nowrap;`

function makePill(key: string) {
  return `<span style="${PILL}" contenteditable="false" data-ph="${key}" draggable="true">{{${key}}}</span>`
}
function makeIfSpan(cond: string) {
  return `<span style="${IF_S}" contenteditable="false" data-if="${cond}">{{#if ${cond}}}</span>`
}
const ELSE_SPAN = `<span style="${ELSE_S}" contenteditable="false" data-else="true">{{else}}</span>`
const ENDIF_SPAN = `<span style="${ENIF_S}" contenteditable="false" data-endif="true">{{/if}}</span>`

// Loop-template row background
const LOOP_ROW_STYLE  = `background:#f0fdf4;`
const LOOP_ROW_BORDER = `border-bottom:2px dashed #86efac;`

// ── Condition definitions ──────────────────────────────────────────────────────

export interface ConditionDef { key: string; label: string; desc: string }
const CONDITIONS: ConditionDef[] = [
  { key: 'is_graduated',    label: 'Is Graduated',      desc: 'True if student status = GRADUATED' },
  { key: 'is_active',       label: 'Is Active',         desc: 'True if student status = ACTIVE' },
  { key: 'is_dropped',      label: 'Is Dropped',        desc: 'True if student status = DROPPED' },
  { key: 'is_honor_student',label: 'Is Honor Student',  desc: 'True if GWA ≤ 1.75' },
  { key: 'is_male',         label: 'Is Male',           desc: 'True if gender = MALE' },
  { key: 'is_female',       label: 'Is Female',         desc: 'True if gender = FEMALE' },
  { key: 'has_subjects',    label: 'Has Subjects',      desc: 'True if student has academic records' },
  { key: 'has_gwa',         label: 'Has GWA',           desc: 'True if GWA has been computed' },
]
const CONDITION_KEYS = new Set(CONDITIONS.map((c) => c.key))

// ── Token ↔ pill/span conversion ──────────────────────────────────────────────

function tokensToPills(html: string): string {
  // Protect existing special spans
  const saved: string[] = []
  const protect = (rx: RegExp) => (html = html.replace(rx, (m) => { saved.push(m); return `￾${saved.length - 1}￾` }))
  protect(/<span[^>]*\bdata-ph="[^"]*"[^>]*>[^<]*<\/span>/g)
  protect(/<span[^>]*\bdata-if="[^"]*"[^>]*>[^<]*<\/span>/g)
  protect(/<span[^>]*\bdata-else="true"[^>]*>[^<]*<\/span>/g)
  protect(/<span[^>]*\bdata-endif="true"[^>]*>[^<]*<\/span>/g)

  // Convert raw condition markers
  html = html.replace(/\{\{#if\s+([^}]+)\}\}/g, (_, c) => makeIfSpan(c.trim()))
  html = html.replace(/\{\{else\}\}/g, ELSE_SPAN)
  html = html.replace(/\{\{\/if\}\}/g, ENDIF_SPAN)

  // Convert known simple tokens (skip loop markers and filters)
  html = html.replace(/\{\{([^#/|][^|}]*)\}\}/g, (m, key) => {
    key = key.trim()
    return KNOWN_KEYS.has(key) ? makePill(key) : m
  })

  return html.replace(/￾(\d+)￾/g, (_, i) => saved[parseInt(i)])
}

// ── Template processing engine ─────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return iso }
}

function formatDateStr(value: string, fmt: string): string {
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    const mo = ['January','February','March','April','May','June','July','August','September','October','November','December']
    return fmt
      .replace('MMMM', mo[d.getMonth()])
      .replace('MMM',  mo[d.getMonth()].slice(0, 3))
      .replace('MM',   String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD',   String(d.getDate()).padStart(2, '0'))
      .replace('YYYY', String(d.getFullYear()))
      .replace('YY',   String(d.getFullYear()).slice(2))
  } catch { return value }
}

function applyFilter(value: string, filterStr: string): string {
  const [fname, ...rest] = filterStr.trim().split(':')
  const arg = rest.join(':').trim().replace(/['"]/g, '')
  switch (fname.trim()) {
    case 'uppercase': return value.toUpperCase()
    case 'lowercase': return value.toLowerCase()
    case 'title':     return value.replace(/\b\w/g, (c) => c.toUpperCase())
    case 'or':        return (value === 'N/A' || !value) ? arg : value
    case 'number':    return isNaN(parseFloat(value)) ? value : parseFloat(value).toFixed(parseInt(arg) || 2)
    case 'format':    return formatDateStr(value, arg || 'MMMM DD, YYYY')
    default:          return value
  }
}

function evaluateCondition(cond: string, s: Student): boolean {
  switch (cond.trim()) {
    case 'is_graduated':    return s.status === 'GRADUATED'
    case 'is_active':       return s.status === 'ACTIVE'
    case 'is_dropped':      return s.status === 'DROPPED'
    case 'is_honor_student':return parseFloat(calcGWA(s.id)) <= 1.75
    case 'is_male':         return (s.gender ?? '').toLowerCase().startsWith('m')
    case 'is_female':       return (s.gender ?? '').toLowerCase().startsWith('f')
    case 'has_subjects':    return (DEMO_RECORDS[s.id] ?? []).length > 0
    case 'has_gwa':         return calcGWA(s.id) !== 'N/A'
    default:                return false
  }
}

function getSimpleValue(key: string, s: Student): string {
  const dept = MOCK_DEPARTMENTS.find((d) => d.name === s.program?.name || d.id === s.programId)
  const m: Record<string, string> = {
    full_name:      `${s.firstName}${s.middleName ? ' ' + s.middleName : ''} ${s.lastName}`,
    student_id:     s.studentId,
    nickname:       s.firstName,
    email:          s.email,
    phone_number:   s.phone ?? 'N/A',
    birthday:       s.dateOfBirth ? fmtDate(s.dateOfBirth) : 'N/A',
    address:        s.address ?? 'N/A',
    gender:         s.gender ?? 'N/A',
    program:        s.program?.name ?? s.programId ?? 'N/A',
    department:     dept?.name ?? 'N/A',
    year_level:     YEAR_LABELS[s.yearLevel] ?? `Year ${s.yearLevel}`,
    semester:       ACTIVE_SEM?.name ?? 'Current Semester',
    academic_year:  ACTIVE_AY?.name ?? '2025-2026',
    date_enrolled:  fmtDate(s.createdAt),
    date_graduated: s.status === 'GRADUATED' ? fmtDate(s.updatedAt) : 'N/A',
    academic_status: s.status,
    gwa:            calcGWA(s.id),
    total_units:    totalUnits(s.id),
    date_generated: fmtDate(new Date().toISOString()),
    school_name:    MOCK_SCHOOL.name,
  }
  return m[key] ?? `{{${key}}}`
}

export interface ValidationError { token: string; message: string }

function validateTemplate(body: string): ValidationError[] {
  const errors: ValidationError[] = []
  // Strip all special spans to get raw text
  const stripped = body
    .replace(/<span[^>]*\bdata-ph="([^"]+)"[^>]*>[^<]*<\/span>/g, '{{$1}}')
    .replace(/<span[^>]*\bdata-if="([^"]+)"[^>]*>[^<]*<\/span>/g, '{{#if $1}}')
    .replace(/<span[^>]*\bdata-else="true"[^>]*>[^<]*<\/span>/g, '{{else}}')
    .replace(/<span[^>]*\bdata-endif="true"[^>]*>[^<]*<\/span>/g, '{{/if}}')
    .replace(/<[^>]*>/g, '')  // strip all HTML tags

  // Detect unknown simple tokens (not loop fields, not condition keys, not filters)
  const seen = new Set<string>()
  stripped.replace(/\{\{([^#/|][^|}]*)\}\}/g, (m, key) => {
    key = key.trim()
    if (!KNOWN_KEYS.has(key) && !seen.has(key)) {
      seen.add(key)
      errors.push({ token: m, message: `Unknown field "{{${key}}}" — this token has no data and will appear blank.` })
    }
    return m
  })

  // Detect unknown conditions
  stripped.replace(/\{\{#if\s+([^}]+)\}\}/g, (m, cond) => {
    cond = cond.trim()
    if (!CONDITION_KEYS.has(cond) && !seen.has(`#if:${cond}`)) {
      seen.add(`#if:${cond}`)
      errors.push({ token: m, message: `Unknown condition "{{#if ${cond}}}" — always evaluates to false.` })
    }
    return m
  })

  // Detect unclosed conditionals
  const opens  = (stripped.match(/\{\{#if\b/g) ?? []).length
  const closes = (stripped.match(/\{\{\/if\}\}/g) ?? []).length
  if (opens !== closes) errors.push({ token: '{{#if}} / {{/if}}', message: `Unbalanced conditionals: ${opens} opening vs ${closes} closing {{/if}} blocks.` })

  return errors
}

function stripSpecialSpans(raw: string): string {
  return raw
    .replace(/<span[^>]*\bdata-if="([^"]+)"[^>]*>[^<]*<\/span>/g, '{{#if $1}}')
    .replace(/<span[^>]*\bdata-else="true"[^>]*>[^<]*<\/span>/g, '{{else}}')
    .replace(/<span[^>]*\bdata-endif="true"[^>]*>[^<]*<\/span>/g, '{{/if}}')
    .replace(/<span[^>]*\bdata-ph="([^"]+)"[^>]*>[^<]*<\/span>/g, '{{$1}}')
}

function processRowTokens(content: string, row: SubjectRow): string {
  let r = stripSpecialSpans(content)
  const rowMap: Record<string, string> = {
    subject_code: row.subject_code, subject_name: row.subject_name, units: String(row.units),
    grade: row.grade, grade_letter: row.grade_letter, remarks: row.remarks,
    semester_name: row.semester_name, ay: row.ay,
  }
  for (const [k, v] of Object.entries(rowMap)) r = r.replaceAll(`{{${k}}}`, v)
  return r
}

// Full DocAutomator-level template processor
// Pipeline: condition spans → pill spans → loop rows → conditionals → filters → simple tokens
function processTemplate(body: string, student: Student): string {
  let raw = body

  // Step 1: Expand data-loop-type rows
  raw = raw.replace(/<tr([^>]*)\bdata-loop-type="([^"]+)"([^>]*)>([\s\S]*?)<\/tr>/g,
    (_, pre, loopType, post, content) => {
      const rows = getLoopRows(student.id, loopType)
      if (rows.length === 0) return `<tr><td colspan="8" style="padding:10px;text-align:center;color:#9ca3af;font-style:italic;border:1px solid #ddd;">No subject records found.</td></tr>`
      return rows.map((row) => `<tr${pre}${post} style="">${processRowTokens(content, row)}</tr>`).join('')
    })

  // Step 2: Convert all special spans to raw markers
  raw = stripSpecialSpans(raw)

  // Step 3: Process conditionals {{#if cond}}...{{else}}...{{/if}}
  raw = raw.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, cond, ifBlock, elseBlock = '') =>
      evaluateCondition(cond.trim(), student) ? ifBlock : elseBlock
  )

  // Step 4: Process filtered tokens {{key | filter}} or {{key | filter: "arg"}}
  raw = raw.replace(/\{\{([^|#/}]+)\|([^}]+)\}\}/g, (_, key, filterStr) =>
    applyFilter(getSimpleValue(key.trim(), student), filterStr)
  )

  // Step 5: Replace remaining simple tokens
  raw = raw.replace(/\{\{([^}]+)\}\}/g, (_, key) => getSimpleValue(key.trim(), student))

  return raw
}

// Same pipeline as processTemplate but wraps resolved values with a green highlight
function previewTemplate(body: string, student: Student): string {
  const hl = (v: string) => `<span style="background:#dcfce7;color:#166534;border-radius:3px;padding:0 3px;font-weight:600;">${v}</span>`

  let raw = body

  // Expand loop rows with highlighting
  raw = raw.replace(
    /<tr([^>]*)\bdata-loop-type="([^"]+)"([^>]*)>([\s\S]*?)<\/tr>/g,
    (_, pre, loopType, post, content) => {
      const rows = getLoopRows(student.id, loopType)
      if (rows.length === 0) {
        return `<tr><td colspan="8" style="padding:10px;text-align:center;color:#9ca3af;font-style:italic;border:1px solid #ddd;">No records found.</td></tr>`
      }
      return rows.map((row) => {
        let c = processRowTokens(content, row)
        // Highlight values in preview
        c = c.replace(new RegExp(`(${Object.values(row).filter((v) => v && String(v).length > 0).map((v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g'), hl)
        return `<tr${pre}${post} style="">${c}</tr>`
      }).join('')
    }
  )

  // Convert condition spans to markers
  raw = stripSpecialSpans(raw)

  // Process conditionals
  raw = raw.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, cond, ifBlock, elseBlock = '') =>
      evaluateCondition(cond.trim(), student) ? ifBlock : elseBlock
  )

  // Filtered tokens with highlight
  raw = raw.replace(/\{\{([^|#/}]+)\|([^}]+)\}\}/g, (_, key, filterStr) =>
    hl(applyFilter(getSimpleValue(key.trim(), student), filterStr))
  )

  // Simple tokens with highlight
  raw = raw.replace(/\{\{([^}]+)\}\}/g, (_, key) => hl(getSimpleValue(key.trim(), student)))
  return raw
}

function printDoc(html: string, title: string) {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>@page{margin:0}body{margin:0;background:#fff}@media print{.np{display:none!important}}</style>
  </head><body>
    <div class="np" style="text-align:center;padding:12px;background:#1a4a8a;color:#fff;font-family:sans-serif;font-size:13px;">
      <button onclick="window.print()" style="background:#fff;color:#1a4a8a;border:none;padding:8px 24px;border-radius:6px;font-weight:bold;cursor:pointer;">🖨 Print / Save PDF</button>
      &nbsp;<button onclick="window.close()" style="background:transparent;color:#bbd;border:1px solid #6699cc;padding:8px 16px;border-radius:6px;cursor:pointer;">Close</button>
    </div>${html}</body></html>`)
  w.document.close(); w.focus()
}

function bumpVer(v: string): string {
  const p = v.split('.').map(Number); p[1] = (p[1] ?? 0) + 1; return p.join('.')
}

// ── Module-level stores ────────────────────────────────────────────────────────

// Shared loop row HTML snippet used by the built-in TOR and the insert-loop-block function
const LOOP_ROW_HTML = (loopType: string) =>
  `<tr data-loop-type="${loopType}" style="${LOOP_ROW_STYLE}${LOOP_ROW_BORDER}">
    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;">{{semester_name}} {{ay}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-weight:700;font-size:12px;">{{subject_code}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:12px;">{{subject_name}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-size:12px;">{{units}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:13px;">{{grade}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-size:12px;">{{remarks}}</td>
  </tr>`

const BUILT_IN_TEMPLATES: DocTemplate[] = [
  {
    id: 'tpl_transcript', name: 'Transcript of Records', type: 'TRANSCRIPT',
    isBuiltIn: true, isDefault: true,
    description: 'Full TOR with subject history, grades, and GWA — uses a loop row that repeats per subject.',
    createdAt: '2025-01-01', updatedAt: '2025-01-01', currentVersion: '1.0', versions: [],
    body: `<div style="font-family:'Times New Roman',serif;max-width:700px;margin:0 auto;padding:40px 50px;line-height:1.6;color:#111;">
  <div style="text-align:center;margin-bottom:12px;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Republic of the Philippines</div>
    <div style="font-size:22px;font-weight:bold;margin:4px 0;">{{school_name}}</div>
    <div style="font-size:11px;color:#666;">Quezon City, Philippines</div>
    <div style="height:3px;background:linear-gradient(to right,#1a4a8a,#2563eb);margin:10px auto;width:80%;"></div>
    <div style="font-size:16px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-top:8px;">Official Transcript of Records</div>
    <div style="font-size:11px;color:#666;margin-top:2px;">Academic Year {{academic_year}} · {{semester}}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:12px;margin-top:18px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
    <div><span style="font-weight:700;color:#374151;">Student Name:</span> {{full_name}}</div>
    <div><span style="font-weight:700;color:#374151;">Student ID:</span> {{student_id}}</div>
    <div><span style="font-weight:700;color:#374151;">Program:</span> {{program}}</div>
    <div><span style="font-weight:700;color:#374151;">Department:</span> {{department}}</div>
    <div><span style="font-weight:700;color:#374151;">Year Level:</span> {{year_level}}</div>
    <div><span style="font-weight:700;color:#374151;">Status:</span> {{academic_status}}</div>
    <div><span style="font-weight:700;color:#374151;">Date Enrolled:</span> {{date_enrolled}}</div>
    {{#if is_graduated}}<div><span style="font-weight:700;color:#374151;">Date Graduated:</span> {{date_graduated}}</div>{{else}}<div><span style="font-weight:700;color:#374151;">Current Semester:</span> {{semester}}</div>{{/if}}
    <div><span style="font-weight:700;color:#374151;">GWA:</span> {{gwa}}</div>
    {{#if is_honor_student}}<div style="color:#b45309;font-weight:700;font-size:11px;"><span>🏅 HONOR GRADUATE — GWA: {{gwa}}</span></div>{{/if}}
  </div>
  <div style="font-size:11px;font-weight:700;color:#1a4a8a;margin:18px 0 6px;text-transform:uppercase;letter-spacing:1px;">Academic Records</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead>
      <tr style="background:#1a4a8a;color:#fff;">
        <th style="padding:8px 10px;text-align:left;border:1px solid #1a4a8a;font-weight:600;">Semester / A.Y.</th>
        <th style="padding:8px 10px;text-align:left;border:1px solid #1a4a8a;font-weight:600;">Code</th>
        <th style="padding:8px 10px;text-align:left;border:1px solid #1a4a8a;font-weight:600;">Subject Name</th>
        <th style="padding:8px 10px;text-align:center;border:1px solid #1a4a8a;font-weight:600;">Units</th>
        <th style="padding:8px 10px;text-align:center;border:1px solid #1a4a8a;font-weight:600;">Grade</th>
        <th style="padding:8px 10px;text-align:center;border:1px solid #1a4a8a;font-weight:600;">Remarks</th>
      </tr>
    </thead>
    <tbody>${LOOP_ROW_HTML('subjects')}</tbody>
    <tfoot>
      <tr style="background:#f0f4fa;font-weight:700;">
        <td colspan="3" style="padding:8px 10px;border:1px solid #ddd;text-align:right;font-size:12px;">Total Earned Units:</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-size:12px;">{{total_units}}</td>
        <td colspan="2" style="padding:8px 10px;border:1px solid #ddd;"></td>
      </tr>
      <tr style="background:#eef3fb;font-weight:700;">
        <td colspan="4" style="padding:8px 10px;border:1px solid #ddd;text-align:right;font-size:12px;">General Weighted Average (GWA):</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-size:13px;font-weight:800;">{{gwa}}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-size:12px;">${'—'}</td>
      </tr>
    </tfoot>
  </table>
  <div style="margin-top:36px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;font-size:12px;text-align:center;">
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:700;">Prepared by</div><div style="color:#666;font-size:11px;">Registrar Staff</div></div>
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:700;">Verified by</div><div style="color:#666;font-size:11px;">Registrar</div></div>
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:700;">Date Issued</div><div style="color:#666;font-size:11px;">{{date_generated}}</div></div>
  </div>
  <div style="margin-top:20px;padding:10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;font-size:10px;color:#92400e;text-align:center;">This document is NOT valid without the Official Dry Seal of {{school_name}}.</div>
</div>`,
  },
  {
    id: 'tpl_enrollment', name: 'Certificate of Enrollment', type: 'ENROLLMENT_CERT',
    isBuiltIn: true, isDefault: true,
    description: 'Certifies that the student is currently enrolled.',
    createdAt: '2025-01-01', updatedAt: '2025-01-01', currentVersion: '1.0', versions: [],
    body: `<div style="font-family:'Times New Roman',serif;max-width:680px;margin:0 auto;padding:40px 50px;line-height:1.7;color:#111;">
  <div style="text-align:center;margin-bottom:6px;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Republic of the Philippines</div>
    <div style="font-size:22px;font-weight:bold;margin:4px 0;">{{school_name}}</div>
    <div style="height:2px;background:#1a4a8a;margin:10px auto;width:80%;"></div>
    <div style="font-size:15px;font-weight:bold;text-transform:uppercase;margin-top:8px;">Certificate of Enrollment</div>
    <div style="font-size:11px;color:#666;margin-top:2px;">Academic Year {{academic_year}}</div>
  </div>
  <div style="margin-top:30px;font-size:13px;">
    <p>TO WHOM IT MAY CONCERN:</p>
    <p style="margin-top:16px;text-indent:40px;">This is to certify that <strong>{{full_name}}</strong>, with Student ID <strong>{{student_id}}</strong>, is a bona fide student of <strong>{{school_name}}</strong>, currently enrolled in <strong>{{program}}</strong> — <strong>{{year_level}}</strong>, for the <strong>{{semester}}</strong> of Academic Year <strong>{{academic_year}}</strong>.</p>
    <p style="margin-top:16px;text-indent:40px;">This certificate is issued upon the request of the student for whatever legal purpose it may serve.</p>
    <p style="margin-top:16px;text-indent:40px;">Issued this <strong>{{date_generated}}</strong> at the Office of the Registrar, {{school_name}}.</p>
  </div>
  <div style="margin-top:50px;text-align:right;font-size:12px;">
    <div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;display:inline-block;min-width:220px;">UNIVERSITY REGISTRAR</div>
  </div>
  <div style="margin-top:20px;padding:10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;font-size:10px;color:#92400e;text-align:center;">Valid only when stamped with the Official Seal of {{school_name}}.</div>
</div>`,
  },
  {
    id: 'tpl_goodmoral', name: 'Good Moral Certificate', type: 'GOOD_MORAL',
    isBuiltIn: true, isDefault: true,
    description: 'Certifies the student\'s good moral character.',
    createdAt: '2025-01-01', updatedAt: '2025-01-01', currentVersion: '1.0', versions: [],
    body: `<div style="font-family:'Times New Roman',serif;max-width:680px;margin:0 auto;padding:40px 50px;line-height:1.7;color:#111;">
  <div style="text-align:center;margin-bottom:6px;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Republic of the Philippines</div>
    <div style="font-size:22px;font-weight:bold;margin:4px 0;">{{school_name}}</div>
    <div style="height:2px;background:#1a4a8a;margin:10px auto;width:80%;"></div>
    <div style="font-size:15px;font-weight:bold;text-transform:uppercase;margin-top:8px;">Certificate of Good Moral Character</div>
    <div style="font-size:11px;color:#666;margin-top:2px;">Academic Year {{academic_year}}</div>
  </div>
  <div style="margin-top:30px;font-size:13px;">
    <p>TO WHOM IT MAY CONCERN:</p>
    <p style="margin-top:16px;text-indent:40px;">This is to certify that <strong>{{full_name}}</strong>, Student ID <strong>{{student_id}}</strong>, a <strong>{{year_level}}</strong> student in <strong>{{program}}</strong> at <strong>{{school_name}}</strong>, is known to be a person of good moral character and satisfactory conduct.</p>
    <p style="margin-top:16px;text-indent:40px;">Issued this <strong>{{date_generated}}</strong> at the Office of the Registrar.</p>
  </div>
  <div style="margin-top:50px;text-align:right;font-size:12px;">
    <div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;display:inline-block;min-width:220px;">UNIVERSITY REGISTRAR</div>
  </div>
</div>`,
  },
]

const CUSTOM_TEMPLATES: DocTemplate[] = []
const DOC_HISTORY: DocRecord[] = []
let _seq = 1

function allTemplates() { return [...BUILT_IN_TEMPLATES, ...CUSTOM_TEMPLATES] }

// ── Small UI helpers ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: TemplateType }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_COLORS[type]}`}>{TYPE_LABELS[type]}</span>
}

function TB({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

function Sep() { return <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" /> }

// ── Template Editor ────────────────────────────────────────────────────────────

function TemplateEditor({ template, onBack, onSaved }: {
  template: DocTemplate; onBack: () => void; onSaved: (u: DocTemplate) => void
}) {
  const editorRef  = useRef<HTMLDivElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout>>()

  const [name,        setName]     = useState(template.name)
  const [description, setDesc]     = useState(template.description)
  const [isDirty,     setDirty]    = useState(false)
  const [splitView,   setSplit]    = useState(true)
  const [showPrev,    setShowPrev] = useState(false)
  const [previewHtml, setPrevHtml] = useState('')
  const [prevStudent, setPrevStu]  = useState<Student | null>(MOCK_STUDENTS[0] ?? null)
  const [showPhs,     setShowPhs]  = useState(false)
  const [showVers,    setShowVers] = useState(false)
  const [activePh,    setActivePh] = useState<{ key: string; el: HTMLElement } | null>(null)
  const [saved,       setSaved]    = useState(false)
  const [phTab,       setPhTab]    = useState(PH_GROUPS[0].id)
  const [validErrors, setValidErr] = useState<ValidationError[]>([])

  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.innerHTML = tokensToPills(template.body)
    setName(template.name); setDesc(template.description); setDirty(false); setActivePh(null)
    doRefresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id])

  const doRefresh = useCallback(() => {
    if (!editorRef.current || !prevStudent) return
    setPrevHtml(previewTemplate(editorRef.current.innerHTML, prevStudent))
  }, [prevStudent])

  useEffect(() => { doRefresh() }, [prevStudent, doRefresh])

  function onInput() { setDirty(true); clearTimeout(timerRef.current); timerRef.current = setTimeout(doRefresh, 700) }

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand(cmd, false, val ?? '')
  }

  function insertPh(key: string) {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, makePill(key) + '&thinsp;')
    setDirty(true); setShowPhs(false); setTimeout(doRefresh, 100)
  }

  function insertLoopTable(loopType: string) {
    editorRef.current?.focus()
    const html = `<br><table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
  <thead><tr style="background:#1a4a8a;color:#fff;">
    <th style="padding:8px 10px;border:1px solid #1a4a8a;text-align:left;">Semester / A.Y.</th>
    <th style="padding:8px 10px;border:1px solid #1a4a8a;text-align:left;">Code</th>
    <th style="padding:8px 10px;border:1px solid #1a4a8a;text-align:left;">Subject Name</th>
    <th style="padding:8px 10px;border:1px solid #1a4a8a;text-align:center;">Units</th>
    <th style="padding:8px 10px;border:1px solid #1a4a8a;text-align:center;">Grade</th>
    <th style="padding:8px 10px;border:1px solid #1a4a8a;text-align:center;">Remarks</th>
  </tr></thead>
  <tbody>${LOOP_ROW_HTML(loopType)}</tbody>
</table><br>`
    document.execCommand('insertHTML', false, html)
    setDirty(true); setShowPhs(false); setTimeout(doRefresh, 100)
  }

  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement
    const ph = t.getAttribute('data-ph')
    if (ph) { setActivePh({ key: ph, el: t }); setShowPhs(false) }
    else if (!t.closest?.('[data-ph]')) setActivePh(null)
  }

  function deleteActivePill() {
    if (!activePh) return
    activePh.el.remove()
    setActivePh(null); setDirty(true); setTimeout(doRefresh, 100)
  }

  function save() {
    if (!editorRef.current) return
    const body = editorRef.current.innerHTML
    const now  = new Date().toISOString()
    const updated: DocTemplate = {
      ...template,
      name: name.trim() || template.name,
      description: description.trim() || template.description,
      body, updatedAt: now.slice(0, 10),
      currentVersion: bumpVer(template.currentVersion),
      versions: [
        { id: `v_${Date.now()}`, savedAt: now, body: template.body, version: template.currentVersion, note: 'Saved' },
        ...template.versions,
      ].slice(0, 10),
    }
    onSaved(updated); setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  function restore(v: TemplateVersion) {
    if (!editorRef.current) return
    editorRef.current.innerHTML = tokensToPills(v.body)
    setDirty(true); setShowVers(false); doRefresh()
  }

  const showEditor  = splitView || !showPrev
  const showPreview = splitView || showPrev

  const activePhGroup = PH_GROUPS.find((g) => g.id === phTab) ?? PH_GROUPS[0]

  return (
    <div className="-mx-6 -mt-6 -mb-6 flex flex-col bg-white" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 shrink-0">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
        <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true) }}
          className="flex-1 min-w-0 text-sm font-bold text-slate-800 bg-transparent border-none outline-none"
          placeholder="Template name…" />
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {template.isBuiltIn && <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">Built-in</span>}
          <TypeBadge type={template.type} />
          {isDirty && <span className="text-[11px] text-slate-400 hidden sm:inline">Unsaved</span>}
          {saved && <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" />Saved</span>}
          <button onClick={() => setShowVers((v) => !v)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${showVers ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <Clock className="h-3 w-3" /> v{template.currentVersion}
            {template.versions.length > 0 && <span className="rounded-full bg-slate-100 px-1.5 text-[9px] font-bold">{template.versions.length}</span>}
          </button>
          <button onClick={save} disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-200 bg-[#f8fafd] shrink-0 flex-wrap">
        <TB icon={Undo2} title="Undo" onClick={() => exec('undo')} />
        <TB icon={Redo2} title="Redo" onClick={() => exec('redo')} />
        <Sep />
        <TB icon={Bold}          title="Bold"          onClick={() => exec('bold')} />
        <TB icon={Italic}        title="Italic"        onClick={() => exec('italic')} />
        <TB icon={Underline}     title="Underline"     onClick={() => exec('underline')} />
        <TB icon={Strikethrough} title="Strikethrough" onClick={() => exec('strikeThrough')} />
        <Sep />
        <select onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { editorRef.current?.focus(); document.execCommand('formatBlock', false, e.target.value) }}
          className="h-7 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 focus:outline-none cursor-pointer">
          <option value="p">Normal</option>
          <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option>
        </select>
        <select onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { editorRef.current?.focus(); document.execCommand('fontSize', false, e.target.value) }}
          className="h-7 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 focus:outline-none cursor-pointer">
          <option value="2">Small</option><option value="3" selected>Normal</option>
          <option value="4">Large</option><option value="5">XL</option>
        </select>
        <Sep />
        <TB icon={AlignLeft}    title="Align Left"    onClick={() => exec('justifyLeft')} />
        <TB icon={AlignCenter}  title="Align Center"  onClick={() => exec('justifyCenter')} />
        <TB icon={AlignRight}   title="Align Right"   onClick={() => exec('justifyRight')} />
        <TB icon={AlignJustify} title="Justify"       onClick={() => exec('justifyFull')} />
        <TB icon={List}         title="Bullet list"   onClick={() => exec('insertUnorderedList')} />
        <Sep />

        {/* Placeholder picker button */}
        <div className="relative">
          <button type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowPhs((p) => !p) }}
            className="flex h-7 items-center gap-1.5 rounded border border-violet-300 bg-violet-50 px-2.5 text-[11px] font-bold text-violet-700 hover:bg-violet-100 transition-colors">
            <Tag className="h-3 w-3" /> Placeholders <ChevronDown className="h-3 w-3" />
          </button>

          {showPhs && (
            <div className="absolute left-0 top-9 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              {/* Group tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50">
                {PH_GROUPS.map((g) => (
                  <button key={g.id} type="button"
                    onMouseDown={(e) => { e.preventDefault(); setPhTab(g.id) }}
                    className={`flex-1 py-2 text-[10px] font-bold transition-colors ${phTab === g.id ? 'bg-white text-violet-700 border-b-2 border-violet-500' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {g.id === 'personal' ? 'Personal' : g.id === 'academic' ? 'Academic' : 'Loop Fields'}
                  </button>
                ))}
              </div>

              {/* Personal / Academic / Loop fields */}
              <div className="max-h-56 overflow-y-auto">
                {activePhGroup.note && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-violet-50 border-b border-violet-100">
                    <Info className="h-3 w-3 text-violet-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-violet-700">{activePhGroup.note}</p>
                  </div>
                )}
                {activePhGroup.items.map((ph) => (
                  <button key={ph.key} type="button"
                    onMouseDown={(e) => { e.preventDefault(); insertPh(ph.key) }}
                    className="flex w-full items-center gap-3 px-3 py-2 hover:bg-violet-50 transition-colors text-left">
                    <code className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-violet-700">
                      {`{{${ph.key}}}`}
                    </code>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{ph.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{ph.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Insert loop table buttons */}
              <div className="border-t border-slate-100 bg-emerald-50 px-3 py-3 space-y-2">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                  <Table className="h-3 w-3" /> Insert Subject Table (TOR)
                </p>
                {[
                  { type: 'subjects',           label: 'All Subjects Table', desc: 'Every subject across all semesters' },
                  { type: 'current_subjects',   label: 'Current Semester',   desc: 'Active semester subjects only' },
                  { type: 'completed_subjects', label: 'Completed Subjects', desc: 'Passed subjects only' },
                ].map((opt) => (
                  <button key={opt.type} type="button"
                    onMouseDown={(e) => { e.preventDefault(); insertLoopTable(opt.type) }}
                    className="flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 hover:bg-emerald-100 transition-colors text-left">
                    <Table className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
                <p className="text-[10px] text-slate-500">The highlighted green row repeats once per subject.</p>
              </div>
            </div>
          )}
        </div>

        {/* View controls */}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSplit((s) => !s)}
            className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold transition-colors ${splitView ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Columns className="h-3.5 w-3.5" /><span className="hidden sm:inline">Split</span>
          </button>
          {!splitView && (
            <button type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPrev((p) => !p)}
              className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold transition-colors ${showPrev ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>
              <Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">{showPrev ? 'Editor' : 'Preview'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected pill action bar */}
      {activePh && (
        <div className="flex items-center gap-3 px-4 py-2 bg-violet-50 border-b border-violet-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-violet-700">Selected placeholder:</span>
            <code className="rounded bg-violet-100 px-2 py-0.5 text-[11px] font-mono font-bold text-violet-800">{`{{${activePh.key}}}`}</code>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Move className="h-3 w-3" /> Drag to move
            <span>·</span>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px]">⌫</kbd> to delete
          </div>
          <button onClick={deleteActivePill}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-3 w-3" /> Remove Placeholder
          </button>
          <button onClick={() => setActivePh(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Legend for loop row */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-50 border-b border-emerald-100 shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-emerald-700">
          <div className="h-2.5 w-4 rounded-sm border border-emerald-300 bg-emerald-200" />
          <span className="font-semibold">Green rows</span> = subject loop template — repeats once per subject when generating
        </div>
        <div className="flex items-center gap-2 text-[10px] text-violet-700 ml-6">
          <div className="rounded bg-violet-100 px-1 text-[9px] font-mono font-bold">{'{{key}}'}</div>
          <span>= click to select / drag to move / ⌫ to delete</span>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden" onClick={() => setShowPhs(false)}>

        {/* Editor pane */}
        {showEditor && (
          <div className={`flex flex-col overflow-hidden ${splitView ? 'w-[55%] border-r border-slate-200' : 'flex-1'}`}>
            <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-100 bg-slate-50 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Editor</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-200 p-6">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={onInput}
                onClick={handleEditorClick}
                spellCheck
                className="min-h-[500px] w-full max-w-2xl mx-auto bg-white shadow-md rounded-lg outline-none px-10 py-10 leading-7 focus:ring-2 focus:ring-brand-400/30"
                style={{ fontFamily: "'Times New Roman', serif", fontSize: '13px' }}
              />
            </div>
          </div>
        )}

        {/* Preview pane */}
        {showPreview && (
          <div className={`flex flex-col overflow-hidden ${splitView ? 'w-[45%]' : 'flex-1'}`}>
            <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-100 bg-slate-50 shrink-0 flex-wrap gap-y-1">
              <Eye className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Student:</span>
                <select value={prevStudent?.id ?? ''} onChange={(e) => setPrevStu(MOCK_STUDENTS.find((s) => s.id === e.target.value) ?? null)}
                  className="h-6 rounded border border-slate-200 bg-white px-1 text-[10px] text-slate-700 focus:outline-none">
                  {MOCK_STUDENTS.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
                <button onClick={doRefresh} className="h-6 rounded border border-slate-200 px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100">↺</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-200 p-4">
              {prevStudent ? (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Live — green = resolved values · {(DEMO_RECORDS[prevStudent.id] ?? []).length} subject records
                    </span>
                  </div>
                  <div className="w-full max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <AlertCircle className="h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">Select a student to preview.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Version panel */}
        {showVers && (
          <div className="w-60 shrink-0 border-l border-slate-200 flex flex-col overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <p className="text-xs font-bold text-slate-700">Version History</p>
              <button onClick={() => setShowVers(false)} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 border-b border-slate-100 bg-brand-50">
                <p className="text-[10px] font-bold text-brand-700 uppercase">v{template.currentVersion} — Current</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Updated: {template.updatedAt}</p>
              </div>
              {template.versions.length === 0 && (
                <div className="px-4 py-8 text-center"><Clock className="h-5 w-5 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">Save changes to create checkpoints.</p></div>
              )}
              {template.versions.map((v) => (
                <div key={v.id} className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-600">v{v.version}</span>
                    <button onClick={() => restore(v)} className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-800">
                      <RotateCcw className="h-2.5 w-2.5" /> Restore
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {new Date(v.savedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' '}{new Date(v.savedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-200 bg-slate-50 shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Desc:</span>
        <input value={description} onChange={(e) => { setDesc(e.target.value); setDirty(true) }}
          className="flex-1 text-[11px] text-slate-600 bg-transparent border-none outline-none" placeholder="Short description…" />
        <TypeBadge type={template.type} />
        <span className="text-[10px] text-slate-400 hidden sm:inline">Created: {template.createdAt}</span>
      </div>
    </div>
  )
}

// ── Templates Tab ──────────────────────────────────────────────────────────────

function TemplatesTab({ onEdit, onGenerate }: { onEdit: (t: DocTemplate) => void; onGenerate: (t: DocTemplate) => void }) {
  const [list, refresh] = useState(() => allTemplates())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  function reload() { refresh([...allTemplates()]) }

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const now  = new Date().toISOString().slice(0, 10)
    const tpl: DocTemplate = {
      id: `tpl_${Date.now()}`, name, type: 'CUSTOM', isBuiltIn: false, isDefault: false,
      description: `Imported from ${file.name} — customize using the editor. Raw placeholders are auto-converted to pill tokens.`,
      createdAt: now, updatedAt: now, currentVersion: '1.0', versions: [],
      body: `<div style="font-family:'Times New Roman',serif;max-width:680px;margin:0 auto;padding:40px 50px;line-height:1.7;color:#111;">
  <div style="padding:10px;background:#f0f9ff;border:1px dashed #7dd3fc;border-radius:6px;font-size:11px;color:#0369a1;margin-bottom:24px;">
    Uploaded from <strong>${file.name}</strong>. Click any violet placeholder pill to select it, drag to reposition, or use the Placeholders toolbar button to insert new ones. Use <strong>Insert Subject Table</strong> to add a grade table for TOR.
  </div>
  <div style="text-align:center;margin-bottom:20px;">
    <div style="font-size:20px;font-weight:bold;">{{school_name}}</div>
    <div style="height:2px;background:#1a4a8a;margin:10px auto;width:80%;"></div>
    <div style="font-size:15px;font-weight:bold;text-transform:uppercase;">${name}</div>
    <div style="font-size:11px;color:#666;margin-top:4px;">Academic Year {{academic_year}}</div>
  </div>
  <p>TO WHOM IT MAY CONCERN:</p>
  <p style="margin-top:16px;text-indent:40px;">This is to certify that <strong>{{full_name}}</strong>, with Student ID <strong>{{student_id}}</strong>, is enrolled in <strong>{{program}}</strong> — <strong>{{year_level}}</strong>.</p>
  <p style="margin-top:16px;text-indent:40px;">GWA: <strong>{{gwa}}</strong> | Total Earned Units: <strong>{{total_units}}</strong></p>
  <p style="margin-top:16px;text-indent:40px;">Issued this <strong>{{date_generated}}</strong>.</p>
</div>`,
    }
    CUSTOM_TEMPLATES.push(tpl); reload(); onEdit(tpl)
    if (fileRef.current) fileRef.current.value = ''
  }

  function createBlank() {
    const now = new Date().toISOString().slice(0, 10)
    const tpl: DocTemplate = {
      id: `tpl_${Date.now()}`, name: 'New Template', type: 'CUSTOM', isBuiltIn: false, isDefault: false,
      description: 'Custom document template.', createdAt: now, updatedAt: now, currentVersion: '1.0', versions: [],
      body: `<div style="font-family:'Times New Roman',serif;max-width:680px;margin:0 auto;padding:40px 50px;line-height:1.7;color:#111;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:20px;font-weight:bold;">{{school_name}}</div>
    <div style="height:2px;background:#1a4a8a;margin:10px auto;width:80%;"></div>
    <div style="font-size:16px;font-weight:bold;text-transform:uppercase;">Document Title</div>
  </div>
  <p>TO WHOM IT MAY CONCERN:</p>
  <p style="text-indent:40px;margin-top:16px;">This document is for <strong>{{full_name}}</strong> ({{student_id}}).</p>
  <p style="text-indent:40px;margin-top:16px;">Issued this {{date_generated}}.</p>
</div>`,
    }
    CUSTOM_TEMPLATES.push(tpl); reload(); onEdit(tpl)
  }

  function dup(tpl: DocTemplate) {
    const now = new Date().toISOString().slice(0, 10)
    CUSTOM_TEMPLATES.push({ ...tpl, id: `tpl_${Date.now()}`, name: `${tpl.name} (Copy)`, isBuiltIn: false, isDefault: false, createdAt: now, updatedAt: now, currentVersion: '1.0', versions: [] })
    reload()
  }
  function remove(id: string) { const i = CUSTOM_TEMPLATES.findIndex((t) => t.id === id); if (i !== -1) CUSTOM_TEMPLATES.splice(i, 1); setDeleteId(null); reload() }
  function setDefault(tpl: DocTemplate) { allTemplates().forEach((t) => { if (t.type === tpl.type) t.isDefault = false }); tpl.isDefault = true; reload() }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
          <Upload className="h-4 w-4" /> Upload Template <span className="text-[10px] font-normal opacity-75">DOCX / PDF</span>
        </button>
        <input ref={fileRef} type="file" accept=".docx,.pdf,.doc" className="hidden" onChange={upload} />
        <button onClick={createBlank}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
          <Plus className="h-4 w-4" /> Create from Scratch
        </button>
      </div>

      {/* Placeholder quick ref */}
      <div className="rounded-xl border border-[#e4ebf5] bg-[#f8fafd] px-4 py-3">
        <p className="text-xs font-bold text-slate-600 mb-2">Available Placeholders — hover for description</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PH_ITEMS.map((ph) => (
            <span key={ph.key} title={ph.desc} className="cursor-default rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-mono font-bold text-violet-700">
              {`{{${ph.key}}}`}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((tpl) => (
          <div key={tpl.id} className="relative flex flex-col rounded-2xl border border-[#e4ebf5] bg-white hover:border-brand-200 hover:shadow-sm transition-all overflow-hidden">
            <div className={`h-1 w-full ${tpl.type === 'TRANSCRIPT' ? 'bg-blue-500' : tpl.type === 'ENROLLMENT_CERT' ? 'bg-emerald-500' : tpl.type === 'GOOD_MORAL' ? 'bg-violet-500' : 'bg-slate-400'}`} />
            <div className="flex flex-col gap-3 p-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <FileText className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {tpl.isDefault && <span title="Default template"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /></span>}
                  <TypeBadge type={tpl.type} />
                  {tpl.isBuiltIn && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">Built-in</span>}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 leading-snug">{tpl.name}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{tpl.description}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>v{tpl.currentVersion}</span>
                  {tpl.versions.length > 0 && <span>· {tpl.versions.length} revision{tpl.versions.length > 1 ? 's' : ''}</span>}
                  <span>· {tpl.updatedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-3 border-t border-[#f0f4fa] flex-wrap">
                <button onClick={() => onEdit(tpl)} className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => onGenerate(tpl)} className="flex items-center gap-1.5 rounded-lg border border-[#e4ebf5] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <Zap className="h-3.5 w-3.5" /> Use
                </button>
                <button onClick={() => dup(tpl)} title="Duplicate" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4ebf5] text-slate-400 hover:bg-slate-50 transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                {!tpl.isDefault && <button onClick={() => setDefault(tpl)} title="Set default" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4ebf5] text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"><Star className="h-3.5 w-3.5" /></button>}
                {!tpl.isBuiltIn && <button onClick={() => setDeleteId(tpl.id)} title="Delete" className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-auto"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-l-[3px] border-red-500 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">Delete template?</p>
              <p className="mt-1 text-xs text-slate-500">This cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => remove(deleteId)} className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Generate Tab ───────────────────────────────────────────────────────────────

function GenerateTab({ initialTemplate }: { initialTemplate: DocTemplate | null }) {
  const [step,  setStep]  = useState<1|2|3>(initialTemplate ? 2 : 1)
  const [tpl,   setTpl]   = useState<DocTemplate | null>(initialTemplate)
  const [query, setQuery] = useState('')
  const [stu,   setStu]   = useState<Student | null>(null)
  const [purp,  setPurp]  = useState('')
  const [html,  setHtml]  = useState('')

  useEffect(() => { if (initialTemplate) { setTpl(initialTemplate); setStep(2) } }, [initialTemplate])

  const students = MOCK_STUDENTS.filter((s) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentId.includes(q) || s.email.toLowerCase().includes(q)
  })

  function generate() {
    if (!tpl || !stu) return
    setHtml(processTemplate(tpl.body, stu))
    DOC_HISTORY.unshift({ id: `doc_${_seq++}`, templateId: tpl.id, templateName: tpl.name, studentDisplayId: stu.studentId, studentName: `${stu.firstName} ${stu.lastName}`, generatedAt: new Date().toISOString(), purpose: purp.trim() || 'General purpose' })
    setStep(3)
  }

  function reset() { setStep(1); setTpl(null); setStu(null); setPurp(''); setHtml(''); setQuery('') }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {([1,2,3] as const).map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${step >= n ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
            </div>
            <span className={`text-xs font-semibold ${step >= n ? 'text-slate-700' : 'text-slate-400'}`}>{['Select Template','Choose Student','Preview & Print'][i]}</span>
            {n < 3 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Choose a Template</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allTemplates().map((t) => (
              <button key={t.id} onClick={() => { setTpl(t); setStep(2) }}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${tpl?.id === t.id ? 'border-brand-500 bg-brand-50' : 'border-[#e4ebf5] hover:border-brand-300 hover:bg-brand-50'}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 mt-0.5"><FileText className="h-4 w-4 text-brand-600" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-slate-800">{t.name}</p>
                    <TypeBadge type={t.type} />
                    {t.isDefault && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && tpl && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">Select Student — <span className="text-brand-600">{tpl.name}</span></h3>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600"><ChevronLeft className="h-3.5 w-3.5" /> Back</button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, student ID, or email…"
              className="w-full rounded-xl border border-[#dce8f7] bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
          </div>
          <div className="rounded-xl border border-[#e4ebf5] overflow-hidden mb-4">
            {students.length === 0
              ? <div className="flex flex-col items-center py-8 gap-2"><AlertCircle className="h-7 w-7 text-slate-300" /><p className="text-sm text-slate-400">No students found.</p></div>
              : <table className="w-full">
                  <thead><tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                    {['Student ID','Name','Program','Year',''].map((h) => <th key={h} className="py-2.5 px-3 first:pl-4 last:pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-brand-700">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-[#f0f4fa]">
                    {students.map((s) => (
                      <tr key={s.id} onClick={() => setStu(stu?.id === s.id ? null : s)}
                        className={`cursor-pointer transition-colors ${stu?.id === s.id ? 'bg-brand-50' : 'hover:bg-[#f8fafd]'}`}>
                        <td className="py-3 pl-4 pr-3 text-xs font-mono text-slate-600">{s.studentId}</td>
                        <td className="py-3 px-3 text-sm font-semibold text-slate-800">{s.firstName} {s.lastName}</td>
                        <td className="py-3 px-3 text-xs text-slate-500">{s.program?.name ?? '—'}</td>
                        <td className="py-3 px-3 text-xs text-slate-600">{YEAR_LABELS[s.yearLevel] ?? `Yr ${s.yearLevel}`}</td>
                        <td className="py-3 pl-3 pr-4 text-right">{stu?.id === s.id && <CheckCircle2 className="h-4 w-4 text-brand-500 inline" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
          {stu && (
            <div className="space-y-3">
              {/* Show academic summary for TOR */}
              {tpl.type === 'TRANSCRIPT' && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                  <p className="text-xs font-bold text-blue-800 mb-1">Academic Record Summary</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
                    <div><span className="font-semibold">Total Subjects:</span> {(DEMO_RECORDS[stu.id] ?? []).length}</div>
                    <div><span className="font-semibold">GWA:</span> {calcGWA(stu.id)}</div>
                    <div><span className="font-semibold">Earned Units:</span> {totalUnits(stu.id)}</div>
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                <p className="text-sm font-semibold text-brand-800">{stu.firstName} {stu.lastName} · {stu.studentId}</p>
              </div>
              <Input label="Purpose (optional)" value={purp} onChange={(e) => setPurp(e.target.value)} placeholder="e.g. Scholarship, CHED requirement, Employment…" />
              <Button onClick={generate} icon={<Zap className="h-4 w-4" />}>Generate Document</Button>
            </div>
          )}
        </Card>
      )}

      {step === 3 && tpl && stu && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">{tpl.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stu.firstName} {stu.lastName} · {stu.studentId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => printDoc(html, tpl.name)} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </button>
                <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> New
                </button>
              </div>
            </div>
          </Card>
          <div className="rounded-2xl border border-[#e4ebf5] bg-white shadow-sm overflow-hidden">
            <div className="bg-[#f0f4fa] border-b border-[#dce8f7] px-4 py-2.5 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Generated Document Preview</span>
            </div>
            <div className="p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── History Tab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const [records] = useState<DocRecord[]>(() => [...DOC_HISTORY])
  if (records.length === 0) return (
    <Card><div className="flex flex-col items-center py-14 gap-3">
      <History className="h-10 w-10 text-slate-200" />
      <p className="text-sm font-semibold text-slate-400">No documents generated yet.</p>
    </div></Card>
  )
  return (
    <Card padding="none">
      <div className="px-4 py-4 border-b border-[#e4ebf5] flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">Document History</h3>
        <span className="text-xs text-slate-400">{records.length} this session</span>
      </div>
      <table className="w-full">
        <thead><tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
          {['Document','Student','Purpose','Generated'].map((h) => <th key={h} className="py-2.5 px-3 first:pl-4 last:pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-brand-700">{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-[#f0f4fa]">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-[#f8fafd]">
              <td className="py-3 pl-4 pr-3 text-sm font-semibold text-slate-800">{r.templateName}</td>
              <td className="py-3 px-3"><p className="text-sm text-slate-700">{r.studentName}</p><p className="text-xs text-slate-400 font-mono">{r.studentDisplayId}</p></td>
              <td className="py-3 px-3 text-xs text-slate-500">{r.purpose}</td>
              <td className="py-3 pl-3 pr-4 text-xs text-slate-500">
                {new Date(r.generatedAt).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}
                {' '}{new Date(r.generatedAt).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type TabId = 'templates' | 'generate' | 'history'

export default function DocumentsPage() {
  const [tab,  setTab]  = useState<TabId>('templates')
  const [jump, setJump] = useState<DocTemplate | null>(null)
  const [edit, setEdit] = useState<DocTemplate | null>(null)

  function savedTemplate(updated: DocTemplate) {
    const bi = BUILT_IN_TEMPLATES.findIndex((t) => t.id === updated.id)
    if (bi !== -1) BUILT_IN_TEMPLATES[bi] = updated
    else { const ci = CUSTOM_TEMPLATES.findIndex((t) => t.id === updated.id); if (ci !== -1) CUSTOM_TEMPLATES[ci] = updated }
    setEdit(updated)
  }

  if (edit) {
    return <TemplateEditor template={edit} onBack={() => setEdit(null)} onSaved={savedTemplate} />
  }

  return (
    <div className="space-y-5">
      <SectionTitle description="Upload, customize, and generate official school documents with full student records">
        Document Generator
      </SectionTitle>
      <div className="flex items-center gap-1 rounded-xl border border-[#e4ebf5] bg-white p-1 w-fit">
        {([
          { id: 'templates', label: 'Templates',  icon: LayoutTemplate },
          { id: 'generate',  label: 'Generate',   icon: Zap },
          { id: 'history',   label: 'History',    icon: History },
        ] as { id: TabId; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { if (id !== 'generate') setJump(null); setTab(id) }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${tab === id ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>
      {tab === 'templates' && <TemplatesTab onEdit={(t) => setEdit(t)} onGenerate={(t) => { setJump(t); setTab('generate') }} />}
      {tab === 'generate'  && <GenerateTab initialTemplate={jump} />}
      {tab === 'history'   && <HistoryTab />}
    </div>
  )
}
