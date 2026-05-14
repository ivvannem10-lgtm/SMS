'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  FileText, Plus, Search, ChevronRight, ChevronLeft, Printer, History,
  LayoutTemplate, Zap, Trash2, Eye, CheckCircle2, X, AlertCircle, Edit2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ChevronDown, Upload, Clock, RotateCcw, Copy, Tag, Strikethrough,
  Undo2, Redo2, Columns, Star, List, Table, Move, Info, GitBranch,
  Sliders, BookOpen, TriangleAlert, Type, Hash, Calendar, ImageIcon,
  MousePointer2, Layers, MapPin, Settings2, Download, RefreshCw,
} from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MOCK_STUDENTS, MOCK_SCHOOL, MOCK_ACADEMIC_YEARS, MOCK_SEMESTERS, MOCK_DEPARTMENTS } from '@/lib/mock-data'
import type { Student } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────

type TemplateType = 'TRANSCRIPT' | 'ENROLLMENT_CERT' | 'GOOD_MORAL' | 'CUSTOM'
type PhTab = 'personal' | 'academic' | 'conditions' | 'loop'

interface TemplateVersion { id: string; savedAt: string; body: string; version: string; note?: string }

interface PdfFieldOverlay {
  id: string
  type: 'text' | 'number' | 'date' | 'image' | 'table'
  fieldKey: string
  label: string
  x: number; y: number           // % from top-left of page container
  width: number; height: number  // % of container
  fontSize: number
  fontFamily?: string   // 'Helvetica' | 'Times' | 'Courier' | custom font name
  bold: boolean
  italic?: boolean
  color: string
  align: 'left' | 'center' | 'right'
  tableRows?: number      // for static grid table
  tableCols?: number      // for static grid table
  staticValue?: string    // for number / date fields — user-entered value
  imageDataUrl?: string   // for image fields — base64 data URL
}

interface DocTemplate {
  id: string; name: string; type: TemplateType; description: string; body: string
  isBuiltIn: boolean; isDefault?: boolean; createdAt: string; updatedAt: string
  currentVersion: string; versions: TemplateVersion[]
  isUploaded?: boolean; uploadedPdfUrl?: string
  isMapped?: boolean       // uses data-mapped spans instead of {{tokens}}
  isPdfOverlay?: boolean   // PDF visual overlay mode
  pdfOverlays?: PdfFieldOverlay[]
}

interface ColMapping { colIndex: number; fieldKey: string }

interface DocRecord {
  id: string; templateId: string; templateName: string
  studentDisplayId: string; studentName: string; generatedAt: string; purpose: string
}

interface SubjectRow {
  semester_name: string; ay: string; year: number
  subject_code: string; subject_name: string; units: number
  grade: string; grade_letter: string; remarks: string
}

interface ActiveSpan {
  type: 'ph' | 'if' | 'else' | 'endif'
  key: string   // field key for 'ph'; condition key for 'if'; empty for 'else'/'endif'
  el: HTMLElement
}

export interface ValidationError { token: string; message: string }

interface TableColConfig {
  semester: boolean; subject_code: boolean; subject_name: boolean
  units: boolean; grade: boolean; grade_letter: boolean; remarks: boolean
}

// ── Mock Academic Records ─────────────────────────────────────────────────────

function gradeToLetter(g: string): string {
  const n = parseFloat(g)
  if (n <= 1.00) return 'Excellent'; if (n <= 1.50) return 'Superior'
  if (n <= 2.00) return 'Very Good'; if (n <= 2.50) return 'Good'
  if (n <= 3.00) return 'Satisfactory'; return 'Failed'
}

function row(sem: string, ay: string, yr: number, code: string, name: string, units: number, grade: string | null): SubjectRow {
  return {
    semester_name: sem, ay, year: yr, subject_code: code, subject_name: name, units,
    grade: grade ?? 'INC',
    grade_letter: grade ? gradeToLetter(grade) : 'Incomplete',
    remarks: grade === null ? 'Ongoing' : parseFloat(grade) <= 3.00 ? 'Passed' : 'Failed',
  }
}

const DEMO_RECORDS: Record<string, SubjectRow[]> = {
  st_demo: [
    row('1st Semester','2023-2024',1,'GE 101','Understanding the Self',3,'1.25'),
    row('1st Semester','2023-2024',1,'GE 102','Readings in Philippine History',3,'1.50'),
    row('1st Semester','2023-2024',1,'CS 101','Introduction to Computing',3,'1.25'),
    row('1st Semester','2023-2024',1,'MATH 101','Mathematics in the Modern World',3,'1.75'),
    row('1st Semester','2023-2024',1,'PE 1','Physical Education 1',2,'1.00'),
    row('2nd Semester','2023-2024',1,'GE 103','The Contemporary World',3,'1.50'),
    row('2nd Semester','2023-2024',1,'CS 102','Computer Programming 1',3,'1.25'),
    row('2nd Semester','2023-2024',1,'CS 103','Discrete Mathematics',3,'2.00'),
    row('2nd Semester','2023-2024',1,'NSTP 1','National Service Training',3,'1.00'),
    row('2nd Semester','2023-2024',1,'PE 2','Physical Education 2',2,'1.00'),
    row('1st Semester','2024-2025',2,'CS 201','Data Structures and Algorithms',3,'1.50'),
    row('1st Semester','2024-2025',2,'CS 202','Computer Organization',3,'1.75'),
    row('1st Semester','2024-2025',2,'MATH 201','Calculus for Computing',3,'2.00'),
    row('1st Semester','2024-2025',2,'CS 203','Object-Oriented Programming',3,'1.25'),
    row('1st Semester','2024-2025',2,'GE 104','Ethics',3,'1.50'),
    row('2nd Semester','2024-2025',2,'CS 204','Database Management Systems',3,'1.25'),
    row('2nd Semester','2024-2025',2,'CS 205','Operating Systems',3,'1.75'),
    row('2nd Semester','2024-2025',2,'MATH 202','Linear Algebra',3,'2.25'),
    row('2nd Semester','2024-2025',2,'CS 206','Web Development Fundamentals',3,'1.25'),
    row('1st Semester','2025-2026',3,'CS 301','Software Engineering',3,null),
    row('1st Semester','2025-2026',3,'CS 302','Computer Networks',3,null),
    row('1st Semester','2025-2026',3,'CS 303','Algorithms and Complexity',3,null),
    row('1st Semester','2025-2026',3,'CS 304','Human-Computer Interaction',3,null),
  ],
}

const ACTIVE_AY  = MOCK_ACADEMIC_YEARS.find((a) => a.isActive) ?? MOCK_ACADEMIC_YEARS[0]
const ACTIVE_SEM = MOCK_SEMESTERS.find((s) => s.isActive) ?? MOCK_SEMESTERS[0]
const YEAR_LABELS: Record<number,string> = { 1:'1st Year',2:'2nd Year',3:'3rd Year',4:'4th Year' }

// Return records for a student — falls back to st_demo records scoped by year level
function getStudentRecords(studentId: string): SubjectRow[] {
  if (DEMO_RECORDS[studentId]) return DEMO_RECORDS[studentId]
  const student = MOCK_STUDENTS.find((s) => s.id === studentId)
  const yearLevel = student?.yearLevel ?? 1
  // Use the demo student's rich record set, filtered to the student's completed years
  const base = DEMO_RECORDS['st_demo'] ?? []
  return base.filter((r) => r.year <= yearLevel)
}

function getLoopRows(studentId: string, type: string): SubjectRow[] {
  const all = getStudentRecords(studentId)
  if (type === 'current_subjects')   return all.filter((r) => r.remarks === 'Ongoing')
  if (type === 'completed_subjects') return all.filter((r) => r.remarks === 'Passed')
  if (type === 'failed_subjects')    return all.filter((r) => r.remarks === 'Failed')
  return all
}
function calcGWA(id: string): string {
  const p = getStudentRecords(id).filter((r) => r.remarks === 'Passed')
  if (!p.length) return 'N/A'
  const tw = p.reduce((s,r) => s + r.units * parseFloat(r.grade), 0)
  return (tw / p.reduce((s,r) => s + r.units, 0)).toFixed(4)
}
function totalUnits(id: string): string {
  return String(getStudentRecords(id).filter((r) => r.remarks === 'Passed').reduce((s,r) => s + r.units, 0))
}

// ── Placeholder & condition definitions ───────────────────────────────────────

interface PhItem { key: string; label: string; desc: string }
interface ConditionDef { key: string; label: string; desc: string }

const PH_GROUPS: { id: PhTab; label: string; icon: React.ElementType; items: PhItem[]; note?: string }[] = [
  {
    id: 'personal', label: 'Personal', icon: Tag,
    items: [
      { key:'full_name',    label:'Full Name',    desc:'Complete name' },
      { key:'student_id',   label:'Student ID',   desc:'ID number' },
      { key:'nickname',     label:'Nickname',     desc:"Student's nickname" },
      { key:'email',        label:'Email',        desc:'Email address' },
      { key:'phone_number', label:'Phone',        desc:'Contact number' },
      { key:'birthday',     label:'Birthday',     desc:'Date of birth' },
      { key:'address',      label:'Address',      desc:'Student address' },
      { key:'gender',       label:'Gender',       desc:'Student gender' },
    ],
  },
  {
    id: 'academic', label: 'Academic', icon: BookOpen,
    items: [
      { key:'program',         label:'Program',         desc:'Degree program name' },
      { key:'department',      label:'Department',      desc:'College / department' },
      { key:'year_level',      label:'Year Level',      desc:'e.g. 1st Year' },
      { key:'semester',        label:'Semester',        desc:'Active semester' },
      { key:'academic_year',   label:'Academic Year',   desc:'Current academic year' },
      { key:'date_enrolled',   label:'Date Enrolled',   desc:'Enrollment date' },
      { key:'date_graduated',  label:'Date Graduated',  desc:'Graduation date (if any)' },
      { key:'academic_status', label:'Status',          desc:'ACTIVE, GRADUATED, etc.' },
      { key:'gwa',             label:'GWA',             desc:'General Weighted Average' },
      { key:'total_units',     label:'Total Units',     desc:'Earned credit units' },
      { key:'date_generated',  label:'Date Generated',  desc:"Today's date" },
      { key:'school_name',     label:'School Name',     desc:'Institution name' },
    ],
  },
  {
    id: 'conditions', label: 'Conditions', icon: GitBranch,
    items: [], // handled separately via CONDITIONS
  },
  {
    id: 'loop', label: 'Loop Fields', icon: Table,
    note: 'Use only inside a subject table loop row (highlighted green)',
    items: [
      { key:'subject_code',  label:'Subject Code',     desc:'e.g. CS 101' },
      { key:'subject_name',  label:'Subject Name',     desc:'Full title' },
      { key:'units',         label:'Units',            desc:'Credit units' },
      { key:'grade',         label:'Grade',            desc:'Numerical grade' },
      { key:'grade_letter',  label:'Grade Letter',     desc:'e.g. Excellent' },
      { key:'remarks',       label:'Remarks',          desc:'Passed / Failed / Ongoing' },
      { key:'semester_name', label:'Semester (loop)',  desc:'Semester of this subject' },
      { key:'ay',            label:'Acad. Year (loop)',desc:'Academic year' },
    ],
  },
]

const CONDITIONS: ConditionDef[] = [
  { key:'is_graduated',    label:'Is Graduated',     desc:'True when student status = GRADUATED' },
  { key:'is_active',       label:'Is Active',        desc:'True when student status = ACTIVE' },
  { key:'is_dropped',      label:'Is Dropped',       desc:'True when student status = DROPPED' },
  { key:'is_honor_student',label:'Is Honor Student', desc:'True when GWA ≤ 1.75' },
  { key:'is_male',         label:'Is Male',          desc:'True when gender = MALE' },
  { key:'is_female',       label:'Is Female',        desc:'True when gender = FEMALE' },
  { key:'has_subjects',    label:'Has Subjects',     desc:'True when student has academic records' },
  { key:'has_gwa',         label:'Has GWA',          desc:'True when GWA is computed' },
]

const ALL_PH_ITEMS   = PH_GROUPS.flatMap((g) => g.items)
const KNOWN_KEYS     = new Set(ALL_PH_ITEMS.map((p) => p.key))
const CONDITION_KEYS = new Set(CONDITIONS.map((c) => c.key))
const PH_LABEL: Record<string,string>   = Object.fromEntries(ALL_PH_ITEMS.map((p) => [p.key, p.label]))
const COND_LABEL: Record<string,string> = Object.fromEntries(CONDITIONS.map((c) => [c.key, c.label]))

const TYPE_LABELS: Record<TemplateType,string> = {
  TRANSCRIPT:'Transcript', ENROLLMENT_CERT:'Enrollment', GOOD_MORAL:'Good Moral', CUSTOM:'Custom',
}
const TYPE_COLORS: Record<TemplateType,string> = {
  TRANSCRIPT:      'bg-blue-50 text-blue-700 border-blue-200',
  ENROLLMENT_CERT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  GOOD_MORAL:      'bg-violet-50 text-violet-700 border-violet-200',
  CUSTOM:          'bg-slate-100 text-slate-600 border-slate-200',
}

// ── Span styles (inline so they survive innerHTML round-trips) ─────────────────

const S_PILL  = `display:inline-flex;align-items:center;background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;border-radius:4px;padding:1px 7px;font-size:0.82em;font-family:monospace;font-weight:600;cursor:pointer;white-space:nowrap;`
const S_IF    = `display:inline-flex;align-items:center;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:4px;padding:1px 7px;font-size:0.8em;font-family:monospace;font-weight:700;cursor:pointer;white-space:nowrap;`
const S_ELSE  = `display:inline-flex;align-items:center;background:#fef9c3;color:#854d0e;border:1px solid #fcd34d;border-radius:4px;padding:1px 7px;font-size:0.8em;font-family:monospace;font-weight:700;cursor:pointer;white-space:nowrap;`
const S_ENDIF = `display:inline-flex;align-items:center;background:#fce7f3;color:#9d174d;border:1px solid #f9a8d4;border-radius:4px;padding:1px 7px;font-size:0.8em;font-family:monospace;font-weight:700;cursor:pointer;white-space:nowrap;`
const S_HINT  = `color:#9ca3af;font-style:italic;font-size:0.88em;`

function makePill(key: string) {
  const label = PH_LABEL[key] ?? key
  return `<span style="${S_PILL}" contenteditable="false" data-ph="${key}" draggable="true" title="Field: ${label}">[${label}]</span>`
}
function makeIfSpan(cond: string) {
  const label = COND_LABEL[cond] ?? cond
  return `<span style="${S_IF}" contenteditable="false" data-if="${cond}" draggable="true" title="${label}">[If: ${label}]</span>`
}
const ELSE_SPAN  = `<span style="${S_ELSE}"  contenteditable="false" data-else="true"  draggable="true">[Otherwise]</span>`
const ENDIF_SPAN = `<span style="${S_ENDIF}" contenteditable="false" data-endif="true" draggable="true">[End If]</span>`

const LOOP_ROW_STYLE  = `background:#f0fdf4;`
const LOOP_ROW_BORDER = `border-bottom:2px dashed #86efac;`

// ── Token conversion ───────────────────────────────────────────────────────────

function tokensToPills(html: string): string {
  // Protect existing spans
  const saved: string[] = []
  const prot = (rx: RegExp) => { html = html.replace(rx, (m) => { saved.push(m); return `￾${saved.length-1}￾` }) }
  prot(/<span[^>]*\bdata-ph="[^"]*"[^>]*>[^<]*<\/span>/g)
  prot(/<span[^>]*\bdata-if="[^"]*"[^>]*>[^<]*<\/span>/g)
  prot(/<span[^>]*\bdata-else="true"[^>]*>[^<]*<\/span>/g)
  prot(/<span[^>]*\bdata-endif="true"[^>]*>[^<]*<\/span>/g)
  // Convert raw markers
  html = html.replace(/\{\{#if\s+([^}]+)\}\}/g, (_, c) => makeIfSpan(c.trim()))
  html = html.replace(/\{\{else\}\}/g, ELSE_SPAN)
  html = html.replace(/\{\{\/if\}\}/g, ENDIF_SPAN)
  // Convert known simple tokens (skip loop markers and filter syntax)
  html = html.replace(/\{\{([^#/|][^|}]*)\}\}/g, (m, key) => {
    key = key.trim(); return KNOWN_KEYS.has(key) ? makePill(key) : m
  })
  return html.replace(/￾(\d+)￾/g, (_, i) => saved[+i])
}

// ── Template engine ────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' }) }
  catch { return iso }
}

function formatDateStr(value: string, fmt: string): string {
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    const mo = ['January','February','March','April','May','June','July','August','September','October','November','December']
    return fmt
      .replace('MMMM', mo[d.getMonth()]).replace('MMM', mo[d.getMonth()].slice(0,3))
      .replace('MM', String(d.getMonth()+1).padStart(2,'0'))
      .replace('DD', String(d.getDate()).padStart(2,'0'))
      .replace('YYYY', String(d.getFullYear())).replace('YY', String(d.getFullYear()).slice(2))
  } catch { return value }
}

function applyFilter(value: string, filterStr: string): string {
  const [fname, ...rest] = filterStr.trim().split(':')
  const arg = rest.join(':').trim().replace(/['"]/g,'')
  switch (fname.trim()) {
    case 'uppercase': return value.toUpperCase()
    case 'lowercase': return value.toLowerCase()
    case 'title':     return value.replace(/\b\w/g, (c) => c.toUpperCase())
    case 'or':        return (value === 'N/A' || !value) ? arg : value
    case 'number':    return isNaN(parseFloat(value)) ? value : parseFloat(value).toFixed(+arg || 2)
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
  const dept = MOCK_DEPARTMENTS.find((d) => d.id === s.programId || d.name === s.program?.name)
  const m: Record<string,string> = {
    full_name:       `${s.firstName}${s.middleName ? ' '+s.middleName : ''} ${s.lastName}`,
    student_id:      s.studentId, nickname: s.firstName, email: s.email,
    phone_number:    s.phone ?? 'N/A',
    birthday:        s.dateOfBirth ? fmtDate(s.dateOfBirth) : 'N/A',
    address:         s.address ?? 'N/A', gender: s.gender ?? 'N/A',
    program:         s.program?.name ?? s.programId ?? 'N/A',
    department:      dept?.name ?? 'N/A',
    year_level:      YEAR_LABELS[s.yearLevel] ?? `Year ${s.yearLevel}`,
    semester:        ACTIVE_SEM?.name ?? 'Current Semester',
    academic_year:   ACTIVE_AY?.name ?? '2025-2026',
    date_enrolled:   fmtDate(s.createdAt),
    date_graduated:  s.status === 'GRADUATED' ? fmtDate(s.updatedAt) : 'N/A',
    academic_status: s.status, gwa: calcGWA(s.id), total_units: totalUnits(s.id),
    date_generated:  fmtDate(new Date().toISOString()), school_name: MOCK_SCHOOL.name,
  }
  return m[key] ?? `{{${key}}}`
}

function stripSpecialSpans(raw: string): string {
  return raw
    .replace(/<span[^>]*\bdata-if="([^"]+)"[^>]*>[^<]*<\/span>/g,  '{{#if $1}}')
    .replace(/<span[^>]*\bdata-else="true"[^>]*>[^<]*<\/span>/g,   '{{else}}')
    .replace(/<span[^>]*\bdata-endif="true"[^>]*>[^<]*<\/span>/g,  '{{/if}}')
    .replace(/<span[^>]*\bdata-ph="([^"]+)"[^>]*>[^<]*<\/span>/g,  '{{$1}}')
}

function processRowTokens(content: string, r: SubjectRow): string {
  let s = stripSpecialSpans(content)
  const map: Record<string,string> = {
    subject_code: r.subject_code, subject_name: r.subject_name, units: String(r.units),
    grade: r.grade, grade_letter: r.grade_letter, remarks: r.remarks,
    semester_name: r.semester_name, ay: r.ay,
  }
  for (const [k,v] of Object.entries(map)) s = s.replaceAll(`{{${k}}}`, v)
  return s
}

// Full pipeline: loops → strip spans → conditionals → filters → tokens
function processTemplate(body: string, student: Student): string {
  // 1. Expand loop rows
  let raw = body.replace(/<tr([^>]*)\bdata-loop-type="([^"]+)"([^>]*)>([\s\S]*?)<\/tr>/g,
    (_, pre, type, post, content) => {
      const rows = getLoopRows(student.id, type)
      if (!rows.length) return `<tr><td colspan="8" style="padding:10px;text-align:center;color:#9ca3af;font-style:italic;border:1px solid #ddd;">No records found.</td></tr>`
      return rows.map((r) => `<tr${pre}${post}>${processRowTokens(content, r)}</tr>`).join('')
    })
  // 2. Strip special spans → raw markers
  raw = stripSpecialSpans(raw)
  // 3. Conditionals
  raw = raw.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, cond, ifB, elseB = '') => evaluateCondition(cond.trim(), student) ? ifB : elseB)
  // 4. Filtered tokens
  raw = raw.replace(/\{\{([^|#/}]+)\|([^}]+)\}\}/g, (_, key, fs) =>
    applyFilter(getSimpleValue(key.trim(), student), fs))
  // 5. Simple tokens
  raw = raw.replace(/\{\{([^}]+)\}\}/g, (_, key) => getSimpleValue(key.trim(), student))
  return raw
}

// Same pipeline but highlights resolved values green
function previewTemplate(body: string, student: Student): string {
  const hl = (v: string) => `<span style="background:#dcfce7;color:#166534;border-radius:3px;padding:0 3px;font-weight:600;">${v}</span>`
  // 1. Expand loop rows
  let raw = body.replace(/<tr([^>]*)\bdata-loop-type="([^"]+)"([^>]*)>([\s\S]*?)<\/tr>/g,
    (_, pre, type, post, content) => {
      const rows = getLoopRows(student.id, type)
      if (!rows.length) return `<tr><td colspan="8" style="padding:10px;text-align:center;color:#9ca3af;font-style:italic;border:1px solid #ddd;">No records found.</td></tr>`
      return rows.map((r) => `<tr${pre}${post}>${processRowTokens(content, r)}</tr>`).join('')
    })
  // 2–5 with highlights
  raw = stripSpecialSpans(raw)
  raw = raw.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, cond, ifB, elseB = '') => evaluateCondition(cond.trim(), student) ? ifB : elseB)
  raw = raw.replace(/\{\{([^|#/}]+)\|([^}]+)\}\}/g, (_, key, fs) =>
    hl(applyFilter(getSimpleValue(key.trim(), student), fs)))
  raw = raw.replace(/\{\{([^}]+)\}\}/g, (_, key) => hl(getSimpleValue(key.trim(), student)))
  return raw
}

// Validate template — detects unknown tokens, conditions, and unbalanced blocks
function validateTemplate(body: string): ValidationError[] {
  const errors: ValidationError[] = []
  const text = stripSpecialSpans(body).replace(/<[^>]*>/g, '')
  const seen = new Set<string>()

  text.replace(/\{\{([^#/|][^|}]*)\}\}/g, (m, key) => {
    key = key.trim()
    if (!KNOWN_KEYS.has(key) && !seen.has(key)) {
      seen.add(key)
      errors.push({ token: m, message: `Unknown field "{{${key}}}" — no data source for this token.` })
    }
    return m
  })
  text.replace(/\{\{#if\s+([^}]+)\}\}/g, (m, cond) => {
    cond = cond.trim()
    if (!CONDITION_KEYS.has(cond) && !seen.has(`c:${cond}`)) {
      seen.add(`c:${cond}`)
      errors.push({ token: m, message: `Unknown condition "{{#if ${cond}}}" — always evaluates to false.` })
    }
    return m
  })
  const opens  = (text.match(/\{\{#if\b/g)   ?? []).length
  const closes = (text.match(/\{\{\/if\}\}/g) ?? []).length
  if (opens !== closes)
    errors.push({ token: '{{#if}} / {{/if}}', message: `${opens} opening block${opens!==1?'s':''} but ${closes} closing {{/if}} — conditional is unbalanced.` })

  return errors
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
  const p = v.split('.').map(Number); p[1] = (p[1]??0)+1; return p.join('.')
}

function detectPlaceholders(body: string): string[] {
  const found = new Set<string>()
  // From raw {{tokens}}
  body.replace(/<[^>]+>/g, ' ').replace(/\{\{([^#/|][^|}]*)\}\}/g, (_, k) => { found.add(k.trim()); return _ })
  // From pill spans (data-ph)
  body.replace(/data-ph="([^"]+)"/g, (_, k) => { found.add(k); return _ })
  // From mapped spans (data-mapped)
  body.replace(/data-mapped="([^"]+)"/g, (_, k) => { if (k !== 'subjects_table') found.add(k); return _ })
  return [...found]
}

// ── PDF overlay generation (uses pdf-lib) ─────────────────────────────────────

async function generatePdfWithOverlays(
  pdfUrl: string, overlays: PdfFieldOverlay[], student: Student,
  customFontDefs: CustomFontDef[] = []
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfLib   = await import('pdf-lib') as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fontkit  = (await import('@pdf-lib/fontkit')) as any
  const resp  = await fetch(pdfUrl)
  const bytes = await resp.arrayBuffer()
  const pdfDoc = await pdfLib.PDFDocument.load(bytes)
  const page   = pdfDoc.getPages()[0]
  const { width, height } = page.getSize()
  // ── Embed standard fonts FIRST (must happen before registerFontkit) ──────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type FontSet = { normal: any; bold: any; italic: any; boldItalic: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FONTS: Record<string, FontSet> = {}

  const SF = pdfLib.StandardFonts
  FONTS['Helvetica'] = {
    normal:     await pdfDoc.embedFont(SF.Helvetica),
    bold:       await pdfDoc.embedFont(SF.HelveticaBold),
    italic:     await pdfDoc.embedFont(SF.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(SF.HelveticaBoldOblique),
  }
  FONTS['Times'] = {
    normal:     await pdfDoc.embedFont(SF.TimesRoman),
    bold:       await pdfDoc.embedFont(SF.TimesRomanBold),
    italic:     await pdfDoc.embedFont(SF.TimesRomanItalic),
    boldItalic: await pdfDoc.embedFont(SF.TimesRomanBoldItalic),
  }
  FONTS['Courier'] = {
    normal:     await pdfDoc.embedFont(SF.Courier),
    bold:       await pdfDoc.embedFont(SF.CourierBold),
    italic:     await pdfDoc.embedFont(SF.CourierOblique),
    boldItalic: await pdfDoc.embedFont(SF.CourierBoldOblique),
  }

  // ── Register fontkit AFTER standard fonts (critical order) ───────────────────
  pdfDoc.registerFontkit(fontkit.default ?? fontkit)

  // ── Embed custom / Google Fonts ───────────────────────────────────────────────
  for (const ov of overlays) {
    const fid = ov.fontFamily ?? 'Helvetica'
    if (FONTS[fid]) continue
    try {
      const customDef = customFontDefs.find(f => f.name === fid)
      if (customDef) {
        const emb = await pdfDoc.embedFont(customDef.data, { subset: true })
        FONTS[fid] = { normal: emb, bold: emb, italic: emb, boldItalic: emb }
        continue
      }
      const preset = BUILTIN_FONT_PRESETS.find(p => p.id === fid)
      if (preset?.gfamily) {
        const buf = await fetchGoogleFontBytes(preset.gfamily)
        if (buf) {
          const emb = await pdfDoc.embedFont(buf, { subset: true })
          FONTS[fid] = { normal: emb, bold: emb, italic: emb, boldItalic: emb }
        }
      }
    } catch { /* fall back to Helvetica below */ }
  }

  for (const ov of overlays) {
    if (ov.type === 'table') {
      // Draw static grid table (rows × cols)
      const rows = Math.max(1, ov.tableRows ?? 3)
      const cols = Math.max(1, ov.tableCols ?? 5)
      const tX = (ov.x      / 100) * width
      const tY = height - (ov.y / 100) * height
      const tW = (ov.width  / 100) * width
      const tH = (ov.height / 100) * height
      const cW = tW / cols
      const rH = tH / rows
      const lineColor = pdfLib.rgb(0, 0, 0)
      // horizontal lines
      for (let r = 0; r <= rows; r++) {
        const ly = tY - r * rH
        page.drawLine({ start:{x:tX,y:ly}, end:{x:tX+tW,y:ly}, thickness:0.5, color:lineColor })
      }
      // vertical lines
      for (let c = 0; c <= cols; c++) {
        const lx = tX + c * cW
        page.drawLine({ start:{x:lx,y:tY}, end:{x:lx,y:tY-tH}, thickness:0.5, color:lineColor })
      }
    } else if (ov.type === 'image') {
      if (!ov.imageDataUrl) continue
      try {
        const imgResp  = await fetch(ov.imageDataUrl)
        const imgBytes = await imgResp.arrayBuffer()
        const isJpeg   = ov.imageDataUrl.startsWith('data:image/jpeg') || ov.imageDataUrl.startsWith('data:image/jpg')
        const embImg   = isJpeg ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes)
        const ix = (ov.x / 100) * width
        const iy = height - (ov.y / 100) * height - (ov.height / 100) * height
        const iw = (ov.width  / 100) * width
        const ih = (ov.height / 100) * height
        page.drawImage(embImg, { x: ix, y: iy, width: iw, height: ih })
      } catch { /* skip if image fails to embed */ }
    } else {
      const val = (ov.type === 'number' || ov.type === 'date')
        ? (ov.staticValue || '')
        : (ov.fieldKey ? getSimpleValue(ov.fieldKey, student) : '')
      if (!val || val.startsWith('{{')) continue
      // Resolve font — fall back to Helvetica if unknown family
      const family = FONTS[ov.fontFamily ?? 'Helvetica'] ?? FONTS['Helvetica']
      if (!family) continue   // should never happen but guard anyway
      const font = ov.bold && ov.italic ? family.boldItalic
        : ov.bold   ? family.bold
        : ov.italic ? family.italic
        : family.normal
      if (!font) continue
      const fieldLeft = (ov.x      / 100) * width
      const fieldW    = (ov.width  / 100) * width
      const fieldTopY = height - (ov.y     / 100) * height   // PDF y=0 is bottom
      const fieldH    = (ov.height / 100) * height

      // ── Auto-fit: shrink until text fits field on ONE line ──────────────────
      let sz = ov.fontSize || 11
      const PADDING = 0.97   // 3% safety margin to prevent micro-overflow wrapping

      // 1. Cap by field height (cap-height ≈ 70% of pt size)
      sz = Math.min(sz, fieldH * 0.82)

      // 2. Iteratively shrink until text fits field width (no word-wrap)
      let textWidth = font.widthOfTextAtSize(val, sz)
      if (textWidth > fieldW * PADDING) {
        sz = sz * (fieldW * PADDING / textWidth)
        sz = Math.max(4, sz)
        textWidth = font.widthOfTextAtSize(val, sz)
      }

      // 3. Vertically center
      const py = Math.max(4, fieldTopY - fieldH / 2 - sz * 0.3)

      // 4. Horizontal alignment
      const px = ov.align === 'center' ? fieldLeft + (fieldW - textWidth) / 2
               : ov.align === 'right'  ? fieldLeft +  fieldW - textWidth
               : fieldLeft

      // 5. Parse hex color
      const hex = (ov.color || '#000000').replace('#','')
      const cr = parseInt(hex.slice(0,2),16)/255
      const cg = parseInt(hex.slice(2,4),16)/255
      const cb = parseInt(hex.slice(4,6),16)/255

      // No maxWidth — prevents pdf-lib word-wrap; auto-fit guarantees it fits
      page.drawText(val, { x: Math.max(0, px), y: py, size: sz, font, color: pdfLib.rgb(cr,cg,cb) })
    }
  }

  const out  = await pdfDoc.save()
  const blob = new Blob([out], { type:'application/pdf' })
  return URL.createObjectURL(blob)
}

// ── Mapping system styles & helpers ───────────────────────────────────────────

const MAPPED_SPAN_STYLE = `display:inline;background:#fef08a;color:#713f12;border:1.5px solid #fbbf24;border-radius:3px;padding:0 3px;cursor:pointer;font-weight:600;`
const MAPPED_LOOP_ROW_STYLE = `background:#f0fdf4;border-bottom:2px dashed #4ade80;`

function processMappedRowTokens(content: string, r: SubjectRow): string {
  const map: Record<string,string> = {
    subject_code: r.subject_code, subject_name: r.subject_name, units: String(r.units),
    grade: r.grade, grade_letter: r.grade_letter, remarks: r.remarks,
    semester_name: r.semester_name, ay: r.ay,
  }
  return content.replace(/<span[^>]*\bdata-mapped="([^"]+)"[^>]*>[^<]*<\/span>/g,
    (_, key) => map[key] ?? '')
}

function processMappedTemplate(body: string, student: Student): string {
  // 1. Strip editor highlight styles from loop rows
  let raw = body.replace(/style="[^"]*background:#f0fdf4[^"]*"/g, '')
  // 2. Expand loop rows
  raw = raw.replace(/<tr([^>]*)\bdata-loop-type="([^"]+)"([^>]*)>([\s\S]*?)<\/tr>/g,
    (_, pre, type, post, content) => {
      const rows = getLoopRows(student.id, type)
      if (!rows.length) return `<tr><td colspan="8" style="padding:10px;text-align:center;color:#9ca3af;font-style:italic;">No records found.</td></tr>`
      return rows.map((r) => `<tr${pre}${post}>${processMappedRowTokens(content, r)}</tr>`).join('')
    })
  // 3. Replace all data-mapped spans with field values
  raw = raw.replace(/<span[^>]*\bdata-mapped="([^"]+)"[^>]*>[\s\S]*?<\/span>/g,
    (_, key) => getSimpleValue(key, student))
  return raw
}

function previewMappedTemplate(body: string, student: Student): string {
  const hl = (v: string) => `<span style="background:#dcfce7;color:#166534;border-radius:3px;padding:0 3px;font-weight:600;">${v}</span>`
  let raw = body.replace(/style="[^"]*background:#f0fdf4[^"]*"/g, '')
  raw = raw.replace(/<tr([^>]*)\bdata-loop-type="([^"]+)"([^>]*)>([\s\S]*?)<\/tr>/g,
    (_, pre, type, post, content) => {
      const rows = getLoopRows(student.id, type)
      if (!rows.length) return `<tr><td colspan="8" style="padding:10px;text-align:center;color:#9ca3af;font-style:italic;">No records found.</td></tr>`
      return rows.map((r) => `<tr${pre}${post}>${processMappedRowTokens(content, r)}</tr>`).join('')
    })
  raw = raw.replace(/<span[^>]*\bdata-mapped="([^"]+)"[^>]*>[\s\S]*?<\/span>/g,
    (_, key) => hl(getSimpleValue(key, student)))
  return raw
}

// ── Module-level stores ────────────────────────────────────────────────────────

const LOOP_ROW = (type: string) =>
  `<tr data-loop-type="${type}" style="${LOOP_ROW_STYLE}${LOOP_ROW_BORDER}">
    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;">{{semester_name}} {{ay}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-weight:700;">{{subject_code}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;">{{subject_name}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;">{{units}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:700;">{{grade}}</td>
    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;">{{remarks}}</td>
  </tr>`

const BUILT_IN_TEMPLATES: DocTemplate[] = [
  {
    id:'tpl_transcript', name:'Transcript of Records', type:'TRANSCRIPT',
    isBuiltIn:true, isDefault:true,
    description:'Full TOR with subject grades, GWA, conditionals, and loop rows.',
    createdAt:'2025-01-01', updatedAt:'2025-01-01', currentVersion:'1.0', versions:[],
    body:`<div style="font-family:'Times New Roman',serif;max-width:700px;margin:0 auto;padding:40px 50px;line-height:1.6;color:#111;">
  <div style="text-align:center;margin-bottom:12px;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Republic of the Philippines</div>
    <div style="font-size:22px;font-weight:bold;margin:4px 0;">{{school_name}}</div>
    <div style="height:3px;background:linear-gradient(to right,#1a4a8a,#2563eb);margin:10px auto;width:80%;"></div>
    <div style="font-size:16px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin-top:8px;">Official Transcript of Records</div>
    <div style="font-size:11px;color:#666;margin-top:2px;">Academic Year {{academic_year}}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:12px;margin-top:18px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
    <div><b>Student Name:</b> {{full_name}}</div>
    <div><b>Student ID:</b> {{student_id}}</div>
    <div><b>Program:</b> {{program}}</div>
    <div><b>Department:</b> {{department}}</div>
    <div><b>Year Level:</b> {{year_level}}</div>
    <div><b>Status:</b> {{academic_status}}</div>
    <div><b>Date Enrolled:</b> {{date_enrolled | format: "MMMM DD, YYYY"}}</div>
    {{#if is_graduated}}<div><b>Date Graduated:</b> {{date_graduated}}</div>{{else}}<div><b>Active Semester:</b> {{semester}}</div>{{/if}}
    <div><b>GWA:</b> {{gwa}}</div>
    {{#if is_honor_student}}<div style="color:#b45309;font-weight:700;">🏅 Honor Graduate (GWA ≤ 1.75)</div>{{/if}}
  </div>
  <div style="font-size:11px;font-weight:700;color:#1a4a8a;margin:18px 0 6px;text-transform:uppercase;letter-spacing:1px;">Academic Records</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead><tr style="background:#1a4a8a;color:#fff;">
      <th style="padding:8px 10px;text-align:left;border:1px solid #1a4a8a;">Semester / A.Y.</th>
      <th style="padding:8px 10px;text-align:left;border:1px solid #1a4a8a;">Code</th>
      <th style="padding:8px 10px;text-align:left;border:1px solid #1a4a8a;">Subject Name</th>
      <th style="padding:8px 10px;text-align:center;border:1px solid #1a4a8a;">Units</th>
      <th style="padding:8px 10px;text-align:center;border:1px solid #1a4a8a;">Grade</th>
      <th style="padding:8px 10px;text-align:center;border:1px solid #1a4a8a;">Remarks</th>
    </tr></thead>
    <tbody>${LOOP_ROW('subjects')}</tbody>
    <tfoot>
      <tr style="background:#f0f4fa;font-weight:700;">
        <td colspan="3" style="padding:8px 10px;border:1px solid #ddd;text-align:right;">Total Earned Units:</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">{{total_units}}</td>
        <td colspan="2" style="padding:8px 10px;border:1px solid #ddd;"></td>
      </tr>
      <tr style="background:#eef3fb;font-weight:800;">
        <td colspan="4" style="padding:8px 10px;border:1px solid #ddd;text-align:right;">General Weighted Average (GWA):</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-size:13px;">{{gwa}}</td>
        <td style="padding:8px 10px;border:1px solid #ddd;text-align:center;">—</td>
      </tr>
    </tfoot>
  </table>
  <div style="margin-top:36px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;font-size:12px;text-align:center;">
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:700;">Prepared by</div><div style="color:#666;font-size:11px;">Registrar Staff</div></div>
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:700;">University Registrar</div><div style="color:#666;font-size:11px;">{{school_name}}</div></div>
    <div><div style="border-top:1px solid #333;padding-top:6px;font-weight:700;">Date Issued</div><div style="color:#666;font-size:11px;">{{date_generated}}</div></div>
  </div>
  <div style="margin-top:20px;padding:10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;font-size:10px;color:#92400e;text-align:center;">NOT valid without the Official Dry Seal of {{school_name}}.</div>
</div>`,
  },
  {
    id:'tpl_enrollment', name:'Certificate of Enrollment', type:'ENROLLMENT_CERT',
    isBuiltIn:true, isDefault:true,
    description:'Certifies that the student is currently enrolled.',
    createdAt:'2025-01-01', updatedAt:'2025-01-01', currentVersion:'1.0', versions:[],
    body:`<div style="font-family:'Times New Roman',serif;max-width:680px;margin:0 auto;padding:40px 50px;line-height:1.7;color:#111;">
  <div style="text-align:center;margin-bottom:6px;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#666;">Republic of the Philippines</div>
    <div style="font-size:22px;font-weight:bold;margin:4px 0;">{{school_name}}</div>
    <div style="height:2px;background:#1a4a8a;margin:10px auto;width:80%;"></div>
    <div style="font-size:15px;font-weight:bold;text-transform:uppercase;margin-top:8px;">Certificate of Enrollment</div>
    <div style="font-size:11px;color:#666;margin-top:2px;">Academic Year {{academic_year}}</div>
  </div>
  <div style="margin-top:30px;font-size:13px;">
    <p>TO WHOM IT MAY CONCERN:</p>
    <p style="margin-top:16px;text-indent:40px;">This is to certify that <strong>{{full_name | uppercase}}</strong>, with Student ID <strong>{{student_id}}</strong>, is a bona fide student of <strong>{{school_name}}</strong>, currently enrolled in <strong>{{program}}</strong> — <strong>{{year_level}}</strong>, for the <strong>{{semester}}</strong> of Academic Year <strong>{{academic_year}}</strong>.</p>
    <p style="margin-top:16px;text-indent:40px;">Date of Enrollment: <strong>{{date_enrolled | format: "MMMM DD, YYYY"}}</strong>.</p>
    <p style="margin-top:16px;text-indent:40px;">Issued this <strong>{{date_generated}}</strong> at the Office of the Registrar, {{school_name}}.</p>
  </div>
  <div style="margin-top:50px;text-align:right;font-size:12px;">
    <div style="border-top:1px solid #333;padding-top:6px;font-weight:bold;display:inline-block;min-width:220px;">UNIVERSITY REGISTRAR</div>
  </div>
  <div style="margin-top:20px;padding:10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;font-size:10px;color:#92400e;text-align:center;">Valid only when stamped with the Official Seal of {{school_name}}.</div>
</div>`,
  },
  {
    id:'tpl_goodmoral', name:'Good Moral Certificate', type:'GOOD_MORAL',
    isBuiltIn:true, isDefault:true,
    description:"Certifies the student's good moral character.",
    createdAt:'2025-01-01', updatedAt:'2025-01-01', currentVersion:'1.0', versions:[],
    body:`<div style="font-family:'Times New Roman',serif;max-width:680px;margin:0 auto;padding:40px 50px;line-height:1.7;color:#111;">
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

function TB({ icon:Icon, title, onClick }: { icon:React.ElementType; title:string; onClick:()=>void }) {
  return (
    <button type="button" title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
    ><Icon className="h-3.5 w-3.5" /></button>
  )
}

function Sep() { return <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" /> }

// ── Field chip in the right panel ─────────────────────────────────────────────

function FieldItem({ phKey, label, desc, onInsert, onDragStart }: {
  phKey: string; label: string; desc: string
  onInsert: (k: string) => void
  onDragStart: (e: React.DragEvent, k: string) => void
}) {
  return (
    <div draggable onDragStart={(e) => onDragStart(e, phKey)}
      className="group flex items-center gap-2 px-3 py-1.5 hover:bg-violet-50 rounded-lg cursor-grab active:cursor-grabbing transition-colors mx-2"
      title={desc}>
      <span className="flex-1 min-w-0 inline-flex items-center rounded-md bg-violet-100 border border-violet-200 px-2 py-0.5 text-[11px] font-semibold text-violet-800 truncate">
        [{label}]
      </span>
      <button type="button"
        onMouseDown={(e) => { e.preventDefault(); onInsert(phKey) }}
        className="shrink-0 flex h-5 w-5 items-center justify-center rounded text-violet-400 hover:bg-violet-200 hover:text-violet-700 opacity-0 group-hover:opacity-100 transition-all"
        title={`Click to insert "${label}" at cursor`}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Template Editor ────────────────────────────────────────────────────────────

function TemplateEditor({ template, onBack, onSaved }: {
  template: DocTemplate; onBack: ()=>void; onSaved: (u: DocTemplate)=>void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout>>()
  const bodyRef   = useRef<string>(template.body)

  const [name,        setName]      = useState(template.name)
  const [description, setDesc]      = useState(template.description)
  const [isDirty,     setDirty]     = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPrevHtml]  = useState('')
  const [prevStudent, setPrevStu]   = useState<Student | null>(MOCK_STUDENTS[0] ?? null)
  const [activeSpan,  setActiveSpan] = useState<ActiveSpan | null>(null)
  const [saved,       setSaved]     = useState(false)
  const [validErrors, setValidErr]  = useState<ValidationError[]>([])
  const [fieldSearch, setFieldSearch] = useState('')
  const [tableModal,  setTableModal] = useState(false)
  const [tableType,   setTableType] = useState<'subjects'|'current_subjects'|'completed_subjects'>('subjects')
  const [tableCols,   setTableCols] = useState<TableColConfig>({
    semester:true, subject_code:true, subject_name:true,
    units:true, grade:true, grade_letter:false, remarks:true,
  })
  const [showVersions, setShowVersions] = useState(false)

  // Load / reload editor content
  useEffect(() => {
    if (!editorRef.current) return
    const pills = tokensToPills(template.body)
    editorRef.current.innerHTML = pills
    bodyRef.current = pills
    setName(template.name); setDesc(template.description)
    setDirty(false); setActiveSpan(null); setValidErr([])
    doRefresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id])

  const doRefresh = useCallback(() => {
    const body = editorRef.current ? editorRef.current.innerHTML : bodyRef.current
    if (!prevStudent) return
    setPrevHtml(previewTemplate(body, prevStudent))
  }, [prevStudent])

  useEffect(() => { doRefresh() }, [prevStudent, doRefresh])

  function onInput() {
    setDirty(true)
    if (editorRef.current) bodyRef.current = editorRef.current.innerHTML
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doRefresh()
      if (editorRef.current) setValidErr(validateTemplate(editorRef.current.innerHTML))
    }, 700)
  }

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand(cmd, false, val ?? '')
  }

  function insertPh(key: string) {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, makePill(key) + '&thinsp;')
    setDirty(true)
    if (editorRef.current) bodyRef.current = editorRef.current.innerHTML
    setTimeout(doRefresh, 100)
  }

  function insertCondition(condKey: string) {
    editorRef.current?.focus()
    const cond = CONDITIONS.find((c) => c.key === condKey)
    const block = [
      '<br>',
      makeIfSpan(condKey),
      ` <span style="${S_HINT}">&nbsp;(shown when ${cond?.label ?? condKey} is true — type your content here)&nbsp;</span>`,
      ELSE_SPAN,
      ` <span style="${S_HINT}">&nbsp;(shown when ${cond?.label ?? condKey} is false — type your content here)&nbsp;</span>`,
      ENDIF_SPAN,
      '<br>',
    ].join('')
    document.execCommand('insertHTML', false, block)
    setDirty(true)
    if (editorRef.current) bodyRef.current = editorRef.current.innerHTML
    setTimeout(() => { doRefresh(); if (editorRef.current) setValidErr(validateTemplate(editorRef.current.innerHTML)) }, 100)
  }

  function insertSmartTable() {
    editorRef.current?.focus()
    const colDefs = ([
      { key:'semester'     as keyof TableColConfig, header:'Semester / A.Y.', cells:['semester_name','ay'] as string[] },
      { key:'subject_code' as keyof TableColConfig, header:'Code',            cells:['subject_code'] as string[] },
      { key:'subject_name' as keyof TableColConfig, header:'Subject Name',    cells:['subject_name'] as string[] },
      { key:'units'        as keyof TableColConfig, header:'Units',           cells:['units'] as string[] },
      { key:'grade'        as keyof TableColConfig, header:'Grade',           cells:['grade'] as string[] },
      { key:'grade_letter' as keyof TableColConfig, header:'Rating',          cells:['grade_letter'] as string[] },
      { key:'remarks'      as keyof TableColConfig, header:'Remarks',         cells:['remarks'] as string[] },
    ]).filter((c) => tableCols[c.key])
    const thS = `padding:8px 10px;text-align:left;border:1px solid #1a4a8a;font-size:11px;`
    const tdS = `padding:7px 10px;border:1px solid #e5e7eb;`
    const headerRow = colDefs.map((c) => `<th style="${thS}">${c.header}</th>`).join('')
    const dataRow   = colDefs.map((c) => `<td style="${tdS}">${c.cells.map((k) => makePill(k)).join(' ')}</td>`).join('')
    const tableHtml = [
      '<br>',
      `<table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">`,
      `<thead><tr style="background:#1a4a8a;color:#fff;">${headerRow}</tr></thead>`,
      `<tbody><tr data-loop-type="${tableType}" style="${LOOP_ROW_STYLE}${LOOP_ROW_BORDER}">${dataRow}</tr></tbody>`,
      `</table><br>`,
    ].join('')
    document.execCommand('insertHTML', false, tableHtml)
    setDirty(true); setTableModal(false)
    if (editorRef.current) bodyRef.current = editorRef.current.innerHTML
    setTimeout(() => { doRefresh(); if (editorRef.current) setValidErr(validateTemplate(editorRef.current.innerHTML)) }, 100)
  }

  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement
    const ph    = t.getAttribute('data-ph')
    const ifKey = t.getAttribute('data-if')
    const isElse   = t.hasAttribute('data-else')
    const isEndif  = t.hasAttribute('data-endif')
    if (ph)          setActiveSpan({ type:'ph',    key: ph,    el: t })
    else if (ifKey)  setActiveSpan({ type:'if',    key: ifKey, el: t })
    else if (isElse) setActiveSpan({ type:'else',  key:'',     el: t })
    else if (isEndif)setActiveSpan({ type:'endif', key:'',     el: t })
    else if (!t.closest?.('[data-ph],[data-if],[data-else],[data-endif]')) setActiveSpan(null)
  }

  function deleteActiveSpan() {
    if (!activeSpan) return
    activeSpan.el.remove(); setActiveSpan(null); setDirty(true)
    if (editorRef.current) bodyRef.current = editorRef.current.innerHTML
    setTimeout(() => { doRefresh(); if (editorRef.current) setValidErr(validateTemplate(editorRef.current.innerHTML)) }, 100)
  }

  function onFieldDragStart(e: React.DragEvent, key: string) {
    e.dataTransfer.setData('text/html', makePill(key) + '&thinsp;')
    e.dataTransfer.effectAllowed = 'copy'
  }

  function onEditorDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const html = e.dataTransfer.getData('text/html'); if (!html) return
    editorRef.current?.focus()
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(e.clientX, e.clientY)
      if (r) { const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r) }
    }
    document.execCommand('insertHTML', false, html)
    setDirty(true)
    if (editorRef.current) bodyRef.current = editorRef.current.innerHTML
    setTimeout(doRefresh, 100)
  }

  function save() {
    const body = bodyRef.current
    const now  = new Date().toISOString()
    onSaved({
      ...template, name: name.trim() || template.name,
      description: description.trim() || template.description,
      body, updatedAt: now.slice(0,10),
      currentVersion: bumpVer(template.currentVersion),
      versions: [
        { id:`v_${Date.now()}`, savedAt:now, body:template.body, version:template.currentVersion, note:'Saved' },
        ...template.versions,
      ].slice(0, 10),
    })
    setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  function restore(v: TemplateVersion) {
    if (!editorRef.current) return
    const pills = tokensToPills(v.body)
    editorRef.current.innerHTML = pills; bodyRef.current = pills
    setDirty(true); setShowVersions(false); setValidErr([]); doRefresh()
  }

  function togglePreview() {
    if (!showPreview && editorRef.current) {
      bodyRef.current = editorRef.current.innerHTML
      if (prevStudent) setPrevHtml(previewTemplate(editorRef.current.innerHTML, prevStudent))
    }
    setShowPreview((p) => !p)
  }

  const matchSearch = (item: PhItem) => {
    if (!fieldSearch.trim()) return true
    const q = fieldSearch.toLowerCase()
    return item.label.toLowerCase().includes(q) || item.key.includes(q) || item.desc.toLowerCase().includes(q)
  }
  const filteredPersonal = PH_GROUPS[0].items.filter(matchSearch)
  const filteredAcademic = PH_GROUPS[1].items.filter(matchSearch)
  const hasSearchResults = filteredPersonal.length > 0 || filteredAcademic.length > 0

  const spanLabel = activeSpan?.type === 'ph'
    ? `[${PH_LABEL[activeSpan.key] ?? activeSpan.key}]`
    : activeSpan?.type === 'if'    ? `[If: ${COND_LABEL[activeSpan.key] ?? activeSpan.key}]`
    : activeSpan?.type === 'else'  ? '[Otherwise]'
    : activeSpan?.type === 'endif' ? '[End If]' : ''
  const spanDesc = activeSpan?.type === 'ph'
    ? ALL_PH_ITEMS.find((p) => p.key === activeSpan.key)?.desc ?? ''
    : activeSpan?.type === 'if'   ? CONDITIONS.find((c) => c.key === activeSpan.key)?.desc ?? ''
    : activeSpan?.type === 'else' ? 'Alternate block — shown when condition is false'
    : activeSpan?.type === 'endif'? 'Marks the end of a conditional block' : ''
  const spanBg = activeSpan?.type === 'ph'    ? 'bg-violet-50 border-violet-200'
               : activeSpan?.type === 'if'    ? 'bg-emerald-50 border-emerald-200'
               : activeSpan?.type === 'else'  ? 'bg-amber-50 border-amber-200'
               : activeSpan?.type === 'endif' ? 'bg-pink-50 border-pink-200' : ''

  const builderStep = showPreview ? 3 : 2

  return (
    <div className="-mx-6 -mt-6 -mb-6 flex flex-col" style={{ height:'calc(100vh - 56px)', background:'#f3f6fb' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 shrink-0">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
        <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true) }}
          className="flex-1 min-w-0 text-sm font-bold text-slate-800 bg-transparent border-none outline-none" />
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {template.isBuiltIn && <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">Built-in</span>}
          <TypeBadge type={template.type} />
          {isDirty && <span className="text-[11px] text-slate-400 hidden sm:inline">Unsaved</span>}
          {saved   && <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" />Saved</span>}
          <button onClick={save} disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors">
            <CheckCircle2 className="h-3 w-3" /> Save
          </button>
          <button onClick={togglePreview}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[11px] font-bold transition-colors ${showPreview ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Eye className="h-3 w-3" /> {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-white shrink-0">
        {([
          { n:1, label:'Choose', icon:LayoutTemplate },
          { n:2, label:'Add Fields', icon:Edit2 },
          { n:3, label:'Preview', icon:Eye },
          { n:4, label:'Save', icon:Zap },
        ] as const).map((s, i) => {
          const done   = builderStep > s.n || (s.n === 4 && saved)
          const active = builderStep === s.n
          const Icon   = s.icon
          return (
            <div key={s.n} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${done ? 'bg-brand-500 text-white' : active ? 'bg-brand-100 text-brand-700 border border-brand-300' : 'bg-slate-100 text-slate-400'}`}>
                {done ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 3 && <ChevronRight className="h-3 w-3 text-slate-300 mx-0.5" />}
            </div>
          )
        })}
        <span className="ml-auto text-[10px] text-slate-400 hidden sm:inline">
          {template.isBuiltIn ? 'Built-in template' : `v${template.currentVersion}`}
        </span>
      </div>

      {/* ── Uploaded template notice ── */}
      {template.isUploaded && !showPreview && (
        <div className="flex items-start gap-3 px-4 py-2 bg-sky-50 border-b border-sky-200 shrink-0">
          <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-sky-800">
            {template.uploadedPdfUrl
              ? <><strong>PDF reference</strong> shown on the right. Build your template on the left, then insert fields from the panel.</>
              : <><strong>Your document design is preserved.</strong> Click anywhere to position your cursor, then click or drag a field from the right panel to insert it.</>}
          </p>
        </div>
      )}

      {/* ── Validation bar ── */}
      {validErrors.length > 0 && !showPreview && (
        <div className="flex items-start gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-amber-800">{validErrors.length} field {validErrors.length===1?'issue':'issues'} — template will still generate</p>
            {validErrors.map((err, i) => <p key={i} className="text-[10px] text-amber-700 mt-0.5">{err.message}</p>)}
          </div>
          <button onClick={() => setValidErr([])} className="text-amber-400 hover:text-amber-600 shrink-0"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ── Active span bar ── */}
      {activeSpan && !showPreview && (
        <div className={`flex items-center gap-3 px-4 py-2 border-b shrink-0 ${spanBg}`}>
          <code className="rounded bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-800">{spanLabel}</code>
          {spanDesc && <span className="text-[10px] text-slate-500 hidden sm:inline truncate">{spanDesc}</span>}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={deleteActiveSpan}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50">
              <Trash2 className="h-3 w-3" /> Remove
            </button>
            <button onClick={() => setActiveSpan(null)} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}

      {/* ── Main workspace ── */}
      {showPreview ? (

        /* ── Preview mode ── */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0 flex-wrap gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Preview with:</span>
              <select value={prevStudent?.id ?? ''}
                onChange={(e) => setPrevStu(MOCK_STUDENTS.find((s) => s.id === e.target.value) ?? null)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:border-brand-300">
                {MOCK_STUDENTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.studentId}</option>
                ))}
              </select>
              <button onClick={doRefresh} className="h-8 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">↺ Refresh</button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {prevStudent && (
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {(DEMO_RECORDS[prevStudent.id] ?? []).length} subjects · GWA: {calcGWA(prevStudent.id)}
                </span>
              )}
              {prevStudent && (
                <button onClick={() => printDoc(processTemplate(bodyRef.current, prevStudent), name)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-brand-600">
                  <Printer className="h-3.5 w-3.5" /> Print / Export PDF
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-slate-300">
            {prevStudent
              ? <div className="w-full max-w-3xl mx-auto bg-white shadow-2xl" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              : <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Eye className="h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-400">Select a student above to see the preview.</p>
                </div>
            }
          </div>
        </div>

      ) : (

        /* ── Edit mode ── */
        <div className="flex flex-1 overflow-hidden">

          {/* ── Editor column ── */}
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">

            {/* Formatting toolbar */}
            <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-200 bg-white shrink-0 flex-wrap">
              <TB icon={Undo2}        title="Undo (Ctrl+Z)"  onClick={() => exec('undo')} />
              <TB icon={Redo2}        title="Redo (Ctrl+Y)"  onClick={() => exec('redo')} />
              <Sep />
              <TB icon={Bold}         title="Bold"           onClick={() => exec('bold')} />
              <TB icon={Italic}       title="Italic"         onClick={() => exec('italic')} />
              <TB icon={Underline}    title="Underline"      onClick={() => exec('underline')} />
              <Sep />
              <select onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => { editorRef.current?.focus(); document.execCommand('formatBlock', false, e.target.value) }}
                className="h-7 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-700 focus:outline-none cursor-pointer">
                <option value="p">Normal</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
              <Sep />
              <TB icon={AlignLeft}   title="Align Left"    onClick={() => exec('justifyLeft')} />
              <TB icon={AlignCenter} title="Align Center"  onClick={() => exec('justifyCenter')} />
              <TB icon={AlignRight}  title="Align Right"   onClick={() => exec('justifyRight')} />
              <TB icon={List}        title="Bullet List"   onClick={() => exec('insertUnorderedList')} />
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={() => setShowVersions((v) => !v)}
                  className={`flex items-center gap-1 h-7 rounded px-2.5 text-[11px] font-semibold transition-colors ${showVersions ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <History className="h-3 w-3" />
                  <span className="hidden sm:inline">History</span>
                  {template.versions.length > 0 && (
                    <span className="rounded-full bg-slate-200 px-1 text-[9px] font-bold">{template.versions.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Document canvas */}
            <div className="flex-1 overflow-y-auto p-8 cursor-text" style={{ background:'#dde3ec' }}
              onDrop={onEditorDrop}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}>
              <div ref={editorRef} contentEditable suppressContentEditableWarning
                onInput={onInput} onClick={handleEditorClick} spellCheck
                className="w-full max-w-[740px] mx-auto bg-white shadow-xl outline-none min-h-[700px] focus:shadow-2xl transition-shadow"
                style={{ fontFamily:"'Times New Roman',serif", fontSize:'13px', padding:'60px 70px', lineHeight:'1.7' }}
              />
            </div>
          </div>

          {/* ── Fields panel ── */}
          <div className="w-[268px] shrink-0 border-l border-slate-200 flex flex-col bg-white overflow-hidden">

            <div className="px-4 py-3 border-b border-slate-100 bg-brand-50 shrink-0">
              <p className="text-[11px] font-bold text-brand-800">Insert Fields</p>
              <p className="text-[10px] text-brand-600 mt-0.5">Click or drag a field into the document</p>
            </div>

            <div className="px-3 py-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                <Search className="h-3 w-3 text-slate-400 shrink-0" />
                <input value={fieldSearch} onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Search fields..."
                  className="flex-1 min-w-0 text-[11px] bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400" />
                {fieldSearch && <button onClick={() => setFieldSearch('')} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* Personal Info */}
              {filteredPersonal.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                    <Tag className="h-3 w-3 text-violet-500 shrink-0" />
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Personal Info</p>
                  </div>
                  <div className="py-1">
                    {filteredPersonal.map((ph) => (
                      <FieldItem key={ph.key} phKey={ph.key} label={ph.label} desc={ph.desc}
                        onInsert={insertPh} onDragStart={onFieldDragStart} />
                    ))}
                  </div>
                </div>
              )}

              {/* Academic Info */}
              {filteredAcademic.length > 0 && (
                <div className="border-t border-slate-100">
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                    <BookOpen className="h-3 w-3 text-blue-500 shrink-0" />
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Academic Info</p>
                  </div>
                  <div className="py-1">
                    {filteredAcademic.map((ph) => (
                      <FieldItem key={ph.key} phKey={ph.key} label={ph.label} desc={ph.desc}
                        onInsert={insertPh} onDragStart={onFieldDragStart} />
                    ))}
                  </div>
                </div>
              )}

              {fieldSearch && !hasSearchResults && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Search className="h-6 w-6 text-slate-200" />
                  <p className="text-[11px] text-slate-400">No fields match &ldquo;{fieldSearch}&rdquo;</p>
                </div>
              )}

              {/* Auto-fill Tables */}
              {!fieldSearch && (
                <div className="border-t border-slate-100">
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 border-b border-teal-100">
                    <Table className="h-3 w-3 text-teal-600 shrink-0" />
                    <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">Auto-fill Tables</p>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {([
                      { type:'subjects'           as const, label:'All Subjects',       desc:'Every subject (use for TOR)' },
                      { type:'current_subjects'   as const, label:'Current Semester',   desc:'Active semester subjects only' },
                      { type:'completed_subjects' as const, label:'Completed Subjects', desc:'Subjects the student passed' },
                    ]).map((opt) => (
                      <button key={opt.type} type="button"
                        onClick={() => { setTableType(opt.type); setTableModal(true) }}
                        className="w-full flex items-center gap-2 rounded-xl border-2 border-teal-100 bg-white px-3 py-2 text-left hover:border-teal-300 hover:bg-teal-50 transition-all"
                        title="Click to configure and insert a table that auto-fills with real subject data">
                        <Table className="h-4 w-4 text-teal-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-teal-800">{opt.label}</p>
                          <p className="text-[10px] text-slate-500 truncate">{opt.desc}</p>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditions */}
              {!fieldSearch && (
                <div className="border-t border-slate-100">
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border-b border-emerald-100">
                    <GitBranch className="h-3 w-3 text-emerald-600 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Show / Hide Sections</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {CONDITIONS.map((cond) => (
                      <button key={cond.key} type="button"
                        onMouseDown={(e) => { e.preventDefault(); insertCondition(cond.key) }}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-emerald-50 transition-colors text-left"
                        title={cond.desc}>
                        <span className="shrink-0 rounded-md bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          [If: {cond.label}]
                        </span>
                        <p className="text-[10px] text-slate-500 truncate min-w-0">{cond.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Version history (collapsible) */}
            {showVersions && (
              <div className="border-t border-slate-200 max-h-52 overflow-y-auto shrink-0">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1"><History className="h-3 w-3" /> Version History</p>
                  <button onClick={() => setShowVersions(false)} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                </div>
                <div className="px-4 py-2.5 border-b border-slate-100 bg-brand-50">
                  <p className="text-[10px] font-bold text-brand-700">v{template.currentVersion} — Current</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Updated: {template.updatedAt}</p>
                </div>
                {template.versions.length === 0
                  ? <div className="px-4 py-5 text-center"><p className="text-[10px] text-slate-400">Save changes to create checkpoints.</p></div>
                  : template.versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-600">v{v.version}</p>
                        <p className="text-[10px] text-slate-400">{new Date(v.savedAt).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}</p>
                      </div>
                      <button onClick={() => restore(v)} className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-800">
                        <RotateCcw className="h-2.5 w-2.5" /> Restore
                      </button>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Quick tips */}
            <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 shrink-0">
              <p className="text-[10px] font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Info className="h-3 w-3" /> Quick Tips</p>
              <ul className="text-[10px] text-slate-500 space-y-0.5 leading-relaxed">
                <li>• Click a field chip to insert at cursor</li>
                <li>• Drag a field directly into your document</li>
                <li>• Click a <span className="rounded bg-violet-100 px-1 text-violet-700 font-semibold">[chip]</span> in the doc to select it</li>
                <li>• Use <strong>Show/Hide</strong> for graduate-only text</li>
              </ul>
            </div>
          </div>

          {/* ── PDF reference panel ── */}
          {template.uploadedPdfUrl && (
            <div className="w-80 shrink-0 border-l border-slate-200 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-[11px] font-bold text-slate-600">PDF Reference</p>
                <span className="ml-auto text-[10px] text-slate-400">Read-only</span>
              </div>
              <iframe src={template.uploadedPdfUrl} className="flex-1 border-0" title="PDF Reference" />
            </div>
          )}

        </div>
      )}

      {/* ── Smart Table Builder Modal ── */}
      {tableModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTableModal(false)} />
          <div className="relative z-10 w-[440px] rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-teal-50 border-b border-teal-200">
              <h3 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                <Table className="h-4 w-4 text-teal-600" /> Insert Subjects Table
              </h3>
              <p className="text-xs text-teal-700 mt-1">
                This table <strong>automatically fills with real student data</strong> when you generate a document — no manual entry needed.
              </p>
            </div>
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-2">Include which subjects?</p>
              <div className="space-y-2">
                {([
                  { value:'subjects'           as const, label:'All Subjects (recommended for TOR)', desc:'Every subject across all semesters' },
                  { value:'current_subjects'   as const, label:'Current Semester Only',              desc:'Only active semester subjects' },
                  { value:'completed_subjects' as const, label:'Completed (Passed) Only',            desc:'Only subjects the student has passed' },
                ]).map((opt) => (
                  <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="tableType" value={opt.value} checked={tableType === opt.value}
                      onChange={() => setTableType(opt.value)} className="mt-0.5 accent-teal-600" />
                    <div>
                      <p className="text-[11px] font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-slate-700 mb-2">Choose columns to show:</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {([
                  { key:'semester'     as const, label:'Semester / A.Y.' },
                  { key:'subject_code' as const, label:'Subject Code' },
                  { key:'subject_name' as const, label:'Subject Name' },
                  { key:'units'        as const, label:'Units' },
                  { key:'grade'        as const, label:'Grade (Number)' },
                  { key:'grade_letter' as const, label:'Rating (Excellent…)' },
                  { key:'remarks'      as const, label:'Remarks (Passed/Failed)' },
                ]).map((col) => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={tableCols[col.key]}
                      onChange={() => setTableCols((prev) => ({ ...prev, [col.key]: !prev[col.key] }))}
                      className="accent-teal-600" />
                    <span className="text-[11px] text-slate-700">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3" /> The highlighted row repeats for each subject
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setTableModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={insertSmartTable}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-[11px] font-bold text-white hover:bg-teal-700 transition-colors">
                  Insert Table →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-200 bg-white shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide shrink-0">Description:</span>
        <input value={description} onChange={(e) => { setDesc(e.target.value); setDirty(true) }}
          placeholder="Add a description for this template..."
          className="flex-1 min-w-0 text-[11px] text-slate-600 bg-transparent border-none outline-none" />
        <TypeBadge type={template.type} />
        <span className="text-[10px] text-slate-400 hidden sm:inline shrink-0">Created: {template.createdAt}</span>
      </div>
    </div>
  )
}


// ── Custom font registry (session-persistent) ─────────────────────────────────

interface CustomFontDef {
  id: string
  name: string
  data: ArrayBuffer
  cssUrl: string   // blob URL for @font-face
}

const CUSTOM_FONT_STORE: CustomFontDef[] = []

// Built-in font presets — standard PDF fonts + Google Fonts (fetched at generation time)
const BUILTIN_FONT_PRESETS = [
  { id:'Helvetica',    name:'Helvetica',          css:'Helvetica,Arial,sans-serif',            gfamily: null },
  { id:'Times',        name:'Times Roman',         css:"'Times New Roman',serif",               gfamily: null },
  { id:'Courier',      name:'Courier',             css:"'Courier New',monospace",               gfamily: null },
  { id:'Cinzel',       name:'Cinzel',              css:"'Cinzel',serif",                        gfamily:'Cinzel' },
  { id:'Playfair',     name:'Playfair Display',    css:"'Playfair Display',serif",              gfamily:'Playfair+Display' },
  { id:'Lato',         name:'Lato',                css:"'Lato',sans-serif",                     gfamily:'Lato' },
  { id:'Montserrat',   name:'Montserrat',          css:"'Montserrat',sans-serif",               gfamily:'Montserrat' },
  { id:'GreatVibes',   name:'Great Vibes',         css:"'Great Vibes',cursive",                 gfamily:'Great+Vibes' },
  { id:'DancingScript',name:'Dancing Script',      css:"'Dancing Script',cursive",              gfamily:'Dancing+Script' },
  { id:'EBGaramond',   name:'EB Garamond',         css:"'EB Garamond',serif",                   gfamily:'EB+Garamond' },
]

function getFontCss(fontId: string): string {
  const preset = BUILTIN_FONT_PRESETS.find(f => f.id === fontId)
  if (preset) return preset.css
  const custom = CUSTOM_FONT_STORE.find(f => f.name === fontId)
  return custom ? `'${custom.name}',sans-serif` : 'Helvetica,Arial,sans-serif'
}

// Cache fetched Google Font bytes to avoid re-fetching
const GF_CACHE: Record<string, ArrayBuffer> = {}

async function fetchGoogleFontBytes(family: string): Promise<ArrayBuffer | null> {
  if (GF_CACHE[family]) return GF_CACHE[family]
  try {
    // Use Google Fonts CSS2 API to get woff2 URL, then fetch the actual font file
    const cssRes = await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@400`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }  // request woff2
    })
    const css = await cssRes.text()
    // Extract first src: url(...) from CSS
    const match = css.match(/src:\s*url\(([^)]+)\)/)
    if (!match) return null
    const fontRes = await fetch(match[1])
    const buf = await fontRes.arrayBuffer()
    GF_CACHE[family] = buf
    return buf
  } catch { return null }
}

// ── PDF Overlay Editor ────────────────────────────────────────────────────────

type PdfTool = 'select' | 'text' | 'number' | 'date' | 'image' | 'table'


const TOOL_META: Record<PdfTool, { label: string; icon: React.ElementType; tc: string }> = {
  select: { label:'Select (V)',   icon:MousePointer2, tc:'#1a4a8a' },
  text:   { label:'Text (T)',     icon:Type,          tc:'#6d28d9' },
  number: { label:'Number (#)',   icon:Hash,          tc:'#1d4ed8' },
  date:   { label:'Date (D)',     icon:Calendar,      tc:'#065f46' },
  image:  { label:'Image (I)',    icon:ImageIcon,     tc:'#0f766e' },
  table:  { label:'Table',        icon:Table,         tc:'#b45309' },
}

const TABLE_COLS_DEFAULT = ['subject_code','subject_name','units','grade','remarks']
const TABLE_COL_LABELS: Record<string,string> = {
  subject_code:'Code', subject_name:'Subject Name', units:'Units',
  grade:'Grade', grade_letter:'Rating', remarks:'Remarks', semester_name:'Semester', ay:'A.Y.',
}

function PdfOverlayEditor({ template, onBack, onSaved }: {
  template: DocTemplate; onBack: ()=>void; onSaved: (u: DocTemplate)=>void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [name,     setName]   = useState(template.name)
  const [overlays, setOvs]    = useState<PdfFieldOverlay[]>(() => template.pdfOverlays ?? [])
  const [selected, setSel]    = useState<string|null>(null)
  const [tool,     setTool]   = useState<PdfTool>('select')
  const [isDirty,  setDirty]  = useState(false)
  const [saved,    setSaved]  = useState(false)
  const [fSearch,  setFSearch] = useState('')
  const [prevStudent, setPrevStu]  = useState<Student|null>(MOCK_STUDENTS[0] ?? null)
  const [previewUrl,  setPrevUrl]     = useState<string|null>(null)
  const [previewImgs, setPreviewImgs] = useState<string[]>([])
  const [showPreview, setShowPrev]    = useState(false)
  const [generating,  setGen]         = useState(false)
  const [stuSearch,   setStuSearch]  = useState('')
  const [stuIdx,      setStuIdx]     = useState(0)
  const [showStuSearch, setShowStuSearch] = useState(false)
  const stuSearchRef = useRef<HTMLInputElement>(null)
  const [customFonts, setCustomFonts] = useState<CustomFontDef[]>(CUSTOM_FONT_STORE)
  const fontImportRef = useRef<HTMLInputElement>(null)

  // Inject Google Fonts + custom @font-face CSS into document head once
  useEffect(() => {
    const families = BUILTIN_FONT_PRESETS
      .filter(f => f.gfamily)
      .map(f => f.gfamily!)
      .join('&family=')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch{} }
  }, [])

  function handleFontImport(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result as ArrayBuffer
      const blobUrl = URL.createObjectURL(new Blob([data]))
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g,' ')
        .replace(/\b\w/g, c => c.toUpperCase())
      const def: CustomFontDef = { id: `cf_${Date.now()}`, name, data, cssUrl: blobUrl }
      CUSTOM_FONT_STORE.push(def)
      // Inject @font-face
      const style = document.createElement('style')
      style.textContent = `@font-face { font-family: '${name}'; src: url('${blobUrl}'); }`
      document.head.appendChild(style)
      setCustomFonts([...CUSTOM_FONT_STORE])
    }
    reader.readAsArrayBuffer(file)
  }
  const filteredStu = useMemo(() => {
    const q = stuSearch.toLowerCase().trim()
    if (!q) return MOCK_STUDENTS
    return MOCK_STUDENTS.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q)
    )
  }, [stuSearch])
  const [tableModal,  setTableModal]   = useState(false)
  const [tableRowsIn, setTableRowsIn]  = useState(3)
  const [tableColsIn, setTableColsIn]  = useState(5)
  // Guide lines: which snap lines are active during drag
  const [activeGuides, setGuides] = useState<{ x: number|null; y: number|null }>({ x: null, y: null })

  // ── pdfjs canvas render — eliminates browser PDF-viewer chrome so overlay % coords align exactly ──
  const [pdfDataUrl,  setPdfDataUrl]  = useState<string|null>(null)
  const [pdfAspect,   setPdfAspect]   = useState('612/792')

  // ── Undo/redo stack ──
  const histRef    = useRef<PdfFieldOverlay[][]>([[...(template.pdfOverlays ?? [])]])
  const histIdx    = useRef(0)
  const clipRef    = useRef<PdfFieldOverlay|null>(null)
  const dragRef        = useRef<{id:string;mode:'move'|'resize';sx:number;sy:number;ox:number;oy:number;ow:number;oh:number}|null>(null)
  const didDragRef     = useRef(false)   // true if mouse moved during drag
  const fieldDownRef   = useRef(false)   // true if the last mousedown was on a field (suppresses canvas onClick)
  const handlersRef = useRef({ undo:()=>{}, redo:()=>{}, cut:()=>{}, copy:()=>{}, paste:()=>{}, del:()=>{} })

  function pushH(ovs: PdfFieldOverlay[]) {
    const h = histRef.current.slice(0, histIdx.current + 1)
    h.push([...ovs])
    histRef.current = h; histIdx.current = h.length - 1
  }
  function commit(ovs: PdfFieldOverlay[]) { setOvs(ovs); pushH(ovs); setDirty(true) }
  function upd(id: string, patch: Partial<PdfFieldOverlay>) { commit(overlays.map(o => o.id===id ? {...o,...patch} : o)) }
  function undo() {
    if (histIdx.current <= 0) return
    histIdx.current--; setOvs([...histRef.current[histIdx.current]]); setDirty(true)
  }
  function redo() {
    if (histIdx.current >= histRef.current.length - 1) return
    histIdx.current++; setOvs([...histRef.current[histIdx.current]]); setDirty(true)
  }
  function cut() {
    if (!selected) return; const ov = overlays.find(o=>o.id===selected); if(ov) clipRef.current={...ov}
    commit(overlays.filter(o=>o.id!==selected)); setSel(null)
  }
  function copy() { const ov = overlays.find(o=>o.id===selected); if(ov) clipRef.current={...ov} }
  function paste() {
    const cb = clipRef.current; if(!cb) return
    const nw = {...cb, id:`pf_${Date.now()}`, x:Math.min(90,cb.x+2), y:Math.min(90,cb.y+2)}
    commit([...overlays, nw]); setSel(nw.id)
  }
  function delSel() { if(!selected) return; commit(overlays.filter(o=>o.id!==selected)); setSel(null) }

  // keep handlersRef fresh every render
  handlersRef.current = { undo, redo, cut, copy, paste, del:delSel }

  // ── Keyboard shortcuts (Ctrl+Z/Y/X/C/V/A, Delete, Arrow nudge) ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.matches('input,textarea,select')) return
      const ctrl = e.ctrlKey || e.metaKey
      const h = handlersRef.current
      if (ctrl) {
        const k = e.key.toLowerCase()
        if (k==='z' && !e.shiftKey) { e.preventDefault(); h.undo(); return }
        if (k==='z' &&  e.shiftKey) { e.preventDefault(); h.redo(); return }
        if (k==='y') { e.preventDefault(); h.redo(); return }
        if (k==='x') { e.preventDefault(); h.cut();  return }
        if (k==='c') { e.preventDefault(); h.copy(); return }
        if (k==='v') { e.preventDefault(); h.paste(); return }
        if (k==='a') { e.preventDefault(); if(overlays.length) setSel(overlays[overlays.length-1].id); return }
      }
      if ((e.key==='Delete'||e.key==='Backspace') && selected) { e.preventDefault(); h.del() }
      if (e.key==='Escape') setSel(null)
      // Arrow nudge — 1% step, Shift = 0.1%
      if (selected && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault()
        const step = e.shiftKey ? 0.1 : 1
        const dx = e.key==='ArrowLeft' ? -step : e.key==='ArrowRight' ? step : 0
        const dy = e.key==='ArrowUp'   ? -step : e.key==='ArrowDown'  ? step : 0
        const cur = histRef.current[histIdx.current] ?? []
        commit(cur.map((o: PdfFieldOverlay) =>
          o.id===selected ? { ...o, x: Math.max(0,Math.min(95,o.x+dx)), y: Math.max(0,Math.min(95,o.y+dy)) } : o
        ))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // registers once; uses ref for latest state

  // Render PDF first page to canvas via pdfjs so no browser PDF-viewer chrome offsets coords
  useEffect(() => {
    if (!template.uploadedPdfUrl) { setPdfDataUrl(null); setPdfAspect('612/792'); return }
    let cancelled = false
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfjs = await import('pdfjs-dist') as any
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const resp  = await fetch(template.uploadedPdfUrl!)
        const bytes = await resp.arrayBuffer()
        const pdf   = await pdfjs.getDocument({ data: bytes }).promise
        const page  = await pdf.getPage(1)
        const vp1   = page.getViewport({ scale: 1 })
        const scale = Math.min(2, 1200 / vp1.width) // cap render width at 1200px
        const vp    = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width  = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
        if (!cancelled) {
          setPdfDataUrl(canvas.toDataURL('image/png'))
          setPdfAspect(`${vp1.width}/${vp1.height}`)
        }
      } catch { /* PDF failed to render — fall back to blank canvas */ }
    })()
    return () => { cancelled = true }
  }, [template.uploadedPdfUrl])

  // Sync prevStudent with filtered navigation
  useEffect(() => { setStuIdx(0) }, [stuSearch])
  useEffect(() => {
    const s = filteredStu[stuIdx]
    if (s) setPrevStu(s)
  }, [stuIdx, filteredStu])

  function pct(e: {clientX:number;clientY:number}) {
    if (!containerRef.current) return { x:0, y:0 }
    const r = containerRef.current.getBoundingClientRect()
    return {
      x: Math.max(0,Math.min(98, ((e.clientX-r.left)/r.width)*100)),
      y: Math.max(0,Math.min(98, ((e.clientY-r.top)/r.height)*100)),
    }
  }

  function addField(x:number, y:number, fieldKey='', fieldLabel='', type:PdfTool='text') {
    const nw: PdfFieldOverlay = {
      id:`pf_${Date.now()}`, type:type==='select'?'text':type,
      fieldKey, label:fieldLabel||PH_LABEL[fieldKey]||`${TOOL_META[type]?.label??'Text'} field`,
      x, y, width:24, height:3.6, fontSize:11, bold:false, color:'#111111', align:'left',
    }
    commit([...overlays, nw]); setSel(nw.id); setTool('select')
    return nw
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    // Suppress if the originating mousedown was on a field (regardless of movement)
    if (fieldDownRef.current) { fieldDownRef.current = false; didDragRef.current = false; return }
    if (didDragRef.current)   { didDragRef.current = false; return }
    if (tool === 'select') { setSel(null); return }
    if (tool === 'table') { setTableModal(true); return }
    const { x, y } = pct(e)
    addField(x, y, '', '', tool)
  }

  function handleFieldMouseDown(e: React.MouseEvent, id: string, mode: 'move'|'resize') {
    e.stopPropagation()
    fieldDownRef.current = true   // mark: this click originated on a field
    setSel(id)
    didDragRef.current = false
    const ov = overlays.find(o => o.id===id)!
    dragRef.current = { id, mode, sx:e.clientX, sy:e.clientY, ox:ov.x, oy:ov.y, ow:ov.width, oh:ov.height }
  }

  const SNAP_THRESHOLD = 1.5   // % — snap when field center within 1.5% of guide

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const d = dragRef.current; if (!d || !containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - d.sx) / r.width)  * 100
    const dy = ((e.clientY - d.sy) / r.height) * 100
    if (Math.abs(e.clientX - d.sx) > 2 || Math.abs(e.clientY - d.sy) > 2) didDragRef.current = true

    if (d.mode === 'move') {
      const ov = overlays.find(o => o.id === d.id)
      if (!ov) return
      let nx = Math.max(0, Math.min(96, d.ox + dx))
      let ny = Math.max(0, Math.min(96, d.oy + dy))

      // Snap guides: canvas center (50%), left/right edges (0/100), top/bottom (0/100)
      const SNAPS_X = [0, 50 - ov.width / 2, 100 - ov.width]   // left edge, center, right edge
      const SNAPS_Y = [0, 50 - ov.height / 2, 100 - ov.height]

      let guideX: number | null = null
      let guideY: number | null = null

      for (const snap of SNAPS_X) {
        if (Math.abs(nx - snap) < SNAP_THRESHOLD) { nx = snap; guideX = snap + ov.width / 2; break }
      }
      for (const snap of SNAPS_Y) {
        if (Math.abs(ny - snap) < SNAP_THRESHOLD) { ny = snap; guideY = snap + ov.height / 2; break }
      }

      setGuides({ x: guideX, y: guideY })
      setOvs(p => p.map(o => o.id === d.id ? { ...o, x: nx, y: ny } : o))
    } else {
      setGuides({ x: null, y: null })
      setOvs(p => p.map(o => o.id === d.id ? { ...o, width: Math.max(5, d.ow + dx), height: Math.max(1.5, d.oh + dy) } : o))
    }
  }

  function handleCanvasMouseUp() {
    setGuides({ x: null, y: null })
    if (!dragRef.current) return
    pushH(overlays); dragRef.current = null; setDirty(true)
  }

  // Drag-and-drop FROM right panel fields
  function handleCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const fieldKey   = e.dataTransfer.getData('fieldKey'); if (!fieldKey) return
    const fieldLabel = e.dataTransfer.getData('fieldLabel') || PH_LABEL[fieldKey] || fieldKey
    const { x, y }  = pct(e)
    addField(x, y, fieldKey, fieldLabel, 'text')
  }

  function insertTableOverlay() {
    const rows = Math.max(1, tableRowsIn)
    const cols = Math.max(1, tableColsIn)
    const nw: PdfFieldOverlay = {
      id:`pf_${Date.now()}`, type:'table', fieldKey:'', label:`${rows}×${cols} Table`,
      x:5, y:40, width:90, height:Math.min(40, rows * 5),
      fontSize:8, bold:false, color:'#111111', align:'left',
      tableRows:rows, tableCols:cols,
    }
    commit([...overlays, nw]); setSel(nw.id); setTableModal(false)
  }

  function save() {
    onSaved({ ...template, name:name.trim()||template.name, pdfOverlays:overlays, updatedAt:new Date().toISOString().slice(0,10) })
    setDirty(false); setSaved(true); setTimeout(()=>setSaved(false), 3000)
  }

  async function runPreview() {
    if (!template.uploadedPdfUrl || !prevStudent) return
    setGen(true); setPrevUrl(null); setPreviewImgs([])
    try {
      const url = await generatePdfWithOverlays(template.uploadedPdfUrl, overlays, prevStudent, CUSTOM_FONT_STORE)
      setPrevUrl(url)
      // Render all pages to canvas images so no browser PDF viewer chrome shows
      try {
        const pdfjs = await import('pdfjs-dist') as any
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const resp  = await fetch(url)
        const bytes = await resp.arrayBuffer()
        const pdf   = await pdfjs.getDocument({ data: bytes }).promise
        const imgs: string[] = []
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p)
          const vp1  = page.getViewport({ scale: 1 })
          const scale = Math.min(2, 1600 / vp1.width)
          const vp   = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          canvas.width = vp.width; canvas.height = vp.height
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
          imgs.push(canvas.toDataURL('image/png'))
        }
        setPreviewImgs(imgs)
      } catch { /* fall back to iframe if pdfjs fails */ }
      setShowPrev(true)
    } catch (err) { alert('Preview failed: ' + String(err)) }
    finally { setGen(false) }
  }

  const selOv     = overlays.find(o => o.id===selected) ?? null
  const unmapped  = overlays.filter(o => o.type==='text' && !o.fieldKey).length
  const isCross   = tool !== 'select' && tool !== 'table'
  const canUndo   = histIdx.current > 0
  const canRedo   = histIdx.current < histRef.current.length - 1
  const fPersonal = PH_GROUPS[0].items.filter(p => !fSearch || p.label.toLowerCase().includes(fSearch.toLowerCase()))
  const fAcademic = PH_GROUPS[1].items.filter(p => !fSearch || p.label.toLowerCase().includes(fSearch.toLowerCase()))

  return (
    <div className="-mx-6 -mt-6 -mb-6 flex flex-col" style={{ height:'calc(100vh - 56px)', background:'#181e2b' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700 bg-[#1e2738] shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white shrink-0">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="h-4 w-px bg-slate-600 shrink-0" />
        <FileText className="h-4 w-4 text-violet-400 shrink-0" />
        <input value={name} onChange={(e)=>{setName(e.target.value);setDirty(true)}}
          className="flex-1 min-w-0 text-sm font-bold text-white bg-transparent border-none outline-none" />
        <span className="rounded-full bg-violet-900/60 border border-violet-500/40 px-2.5 py-0.5 text-[10px] font-bold text-violet-300 shrink-0">PDF Overlay</span>
        <div className="flex items-center gap-2 shrink-0">
          {/* Undo/Redo */}
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
            className="flex h-7 w-7 items-center justify-center rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors" >
            <Undo2 className="h-3.5 w-3.5"/>
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
            className="flex h-7 w-7 items-center justify-center rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors">
            <Redo2 className="h-3.5 w-3.5"/>
          </button>
          <div className="h-4 w-px bg-slate-600" />
          {isDirty && <span className="text-[11px] text-slate-500 hidden sm:inline">Unsaved</span>}
          {saved   && <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><CheckCircle2 className="h-3 w-3"/>Saved</span>}
          {unmapped > 0 && <span className="flex items-center gap-1 text-[11px] text-amber-400"><AlertCircle className="h-3 w-3"/>{unmapped} unmapped</span>}
          <button onClick={save} disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-600 disabled:opacity-40">
            <CheckCircle2 className="h-3 w-3"/> Save
          </button>
          <button onClick={runPreview} disabled={generating || !template.uploadedPdfUrl}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-900/40 px-3.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-800/60 disabled:opacity-40">
            {generating ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Eye className="h-3 w-3"/>}
            {generating ? 'Generating…' : 'Preview'}
          </button>
        </div>
      </div>

      {/* ── Format bar (visible when a text field is selected) ── */}
      {selOv && selOv.type !== 'table' && selOv.type !== 'image' && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-600 bg-[#161d2b] shrink-0 flex-wrap">
          {/* Undo / Redo */}
          <button onClick={undo} disabled={!canUndo}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
            <Undo2 className="h-3.5 w-3.5"/>
          </button>
          <button onClick={redo} disabled={!canRedo}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors" title="Redo (Ctrl+Y)">
            <Redo2 className="h-3.5 w-3.5"/>
          </button>
          <div className="w-px h-5 bg-slate-600"/>
          {/* Font size */}
          <button onClick={() => upd(selOv.id,{fontSize:Math.max(6,(selOv.fontSize??11)-1)})}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600 font-bold text-sm">−</button>
          <input type="number" min={6} max={120} value={selOv.fontSize ?? 11}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) upd(selOv.id,{fontSize:v}) }}
            onBlur={e => { const v = parseInt(e.target.value)||11; upd(selOv.id,{fontSize:Math.max(6,Math.min(120,v))}) }}
            className="w-12 h-7 rounded border border-slate-600 bg-slate-700 px-1.5 text-center text-xs text-white focus:outline-none focus:border-brand-400"/>
          <button onClick={() => upd(selOv.id,{fontSize:Math.min(120,(selOv.fontSize??11)+1)})}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600 font-bold text-sm">+</button>
          <span className="text-[10px] text-slate-500">pt</span>
          {/* Auto Fit — fill field height, constrained by width for the preview student */}
          <button
            onClick={() => {
              const [pw, ph] = pdfAspect.split('/').map(Number)
              const fieldHpt = (selOv.height / 100) * (ph || 792)
              const fieldWpt = (selOv.width  / 100) * (pw || 612)
              // Start from a size that fills the height, then shrink if name is long
              let sz = Math.max(6, fieldHpt * 0.82)
              if (prevStudent) {
                const name = `${prevStudent.firstName} ${prevStudent.lastName}`
                // Rough Helvetica width: avg 0.55 em per char
                const approxW = name.length * sz * 0.55
                if (approxW > fieldWpt * 0.97) sz = sz * (fieldWpt * 0.97 / approxW)
              }
              upd(selOv.id, { fontSize: Math.max(6, Math.round(sz)) })
            }}
            className="h-7 px-3 rounded-lg border border-emerald-600 bg-emerald-700/40 text-[11px] font-bold text-emerald-300 hover:bg-emerald-700/70 whitespace-nowrap transition-colors"
            title="Auto-fit: set font size to fill field without overflowing">
            ⚡ Auto Fit
          </button>
          <div className="w-px h-5 bg-slate-600"/>
          {/* Font family */}
          <select
            value={selOv.fontFamily ?? 'Helvetica'}
            onChange={e => {
              if (e.target.value === '__import__') { fontImportRef.current?.click(); return }
              upd(selOv.id, { fontFamily: e.target.value })
            }}
            className="h-7 rounded border border-slate-600 bg-slate-700 px-2 text-xs text-white focus:outline-none focus:border-brand-400 max-w-[160px]"
          >
            <optgroup label="── Standard ──">
              {BUILTIN_FONT_PRESETS.filter(f => !f.gfamily).map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </optgroup>
            <optgroup label="── Google Fonts ──">
              {BUILTIN_FONT_PRESETS.filter(f => f.gfamily).map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </optgroup>
            {customFonts.length > 0 && (
              <optgroup label="── Imported ──">
                {customFonts.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </optgroup>
            )}
            <option value="__import__">＋ Import font (.ttf/.otf)…</option>
          </select>
          <input ref={fontImportRef} type="file" accept=".ttf,.otf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFontImport(f); e.target.value='' }}/>
          <div className="w-px h-5 bg-slate-600"/>
          {/* Bold */}
          <button onClick={() => upd(selOv.id,{bold:!selOv.bold})}
            className={`flex h-7 w-7 items-center justify-center rounded border font-bold text-sm transition-colors ${selOv.bold ? 'border-brand-400 bg-brand-600 text-white' : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            title="Bold">B</button>
          {/* Italic */}
          <button onClick={() => upd(selOv.id,{italic:!selOv.italic})}
            className={`flex h-7 w-7 items-center justify-center rounded border italic font-bold text-sm transition-colors ${selOv.italic ? 'border-brand-400 bg-brand-600 text-white' : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            title="Italic">I</button>
          <div className="w-px h-5 bg-slate-600"/>
          {/* Alignment */}
          {([['left','⬜▪▪'],['center','▪⬜▪'],['right','▪▪⬜']] as const).map(([a, icon]) => (
            <button key={a} onClick={() => upd(selOv.id,{align:a})}
              title={`Align ${a}`}
              className={`flex h-7 px-2 items-center justify-center rounded border text-xs font-semibold transition-colors ${selOv.align===a ? 'border-brand-400 bg-brand-600 text-white' : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {a==='left'?<AlignLeft className="h-3.5 w-3.5"/>:a==='center'?<AlignCenter className="h-3.5 w-3.5"/>:<AlignRight className="h-3.5 w-3.5"/>}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-600"/>
          {/* Color */}
          <label className="flex h-7 items-center gap-1.5 cursor-pointer rounded border border-slate-600 bg-slate-700 px-2 hover:bg-slate-600 transition-colors" title="Text color">
            <div className="w-4 h-4 rounded-sm border border-slate-500" style={{ background: selOv.color || '#ffffff' }}/>
            <span className="text-[10px] text-slate-400">Color</span>
            <input type="color" value={selOv.color || '#000000'} onChange={e => upd(selOv.id,{color:e.target.value})} className="sr-only"/>
          </label>
          <div className="flex-1"/>
          {/* Delete */}
          <button onClick={delSel}
            className="flex h-7 items-center gap-1 px-2 rounded border border-red-800 bg-red-900/40 text-red-400 hover:bg-red-900/70 text-xs font-semibold transition-colors">
            <Trash2 className="h-3 w-3"/> Delete field
          </button>
        </div>
      )}

      {/* ── Tool bar ── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-700 bg-[#1e2533] shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Tools:</span>
        {(Object.entries(TOOL_META) as [PdfTool, typeof TOOL_META[PdfTool]][]).map(([t, meta]) => {
          const Icon = meta.icon
          const active = tool === t
          return (
            <button key={t} onClick={() => setTool(t)}
              title={meta.label + (t !== 'select' ? ' — click PDF to place' : '')}
              className={`flex items-center gap-1.5 h-8 rounded-lg px-3 text-[11px] font-semibold transition-all ${active ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
              <Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{meta.label}</span>
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
          <span>{overlays.length} field{overlays.length!==1?'s':''}</span>
          <span className="hidden sm:inline">Click PDF to place · Drag to move · ↘ corner to resize</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── PDF canvas ── */}
        <div className="flex-1 overflow-auto" style={{ background:'#2a3040', padding:'32px 32px 32px 48px' }}>
          <div className="max-w-[640px] mx-auto">

            {/* ── Horizontal ruler (top) ── */}
            <div style={{ display:'flex', marginLeft:20 }}>
              <div style={{ flex:1, height:18, background:'#1a2236', borderRadius:'4px 4px 0 0', position:'relative', overflow:'visible' }}>
                {[0,10,20,30,40,50,60,70,80,90,100].map(p => (
                  <div key={p} style={{ position:'absolute', left:`${p}%`, top:0, bottom:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ width:1, height: p%10===0 ? 8 : 4, background: p===50 ? '#60a5fa' : '#4b5563', marginTop:'auto' }}/>
                    {p % 10 === 0 && p > 0 && p < 100 && (
                      <span style={{ position:'absolute', bottom:2, fontSize:7, color: p===50 ? '#60a5fa' : '#6b7280', transform:'translateX(-50%)', lineHeight:1 }}>{p}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Canvas row: vertical ruler + PDF ── */}
            {/* Canvas row — use a ref to measure height so ruler matches exactly */}
            <div style={{ display:'flex', alignItems:'flex-start' }}>
              {/* Vertical ruler — height driven by CSS to mirror the canvas */}
              <div style={{ width:20, background:'#1a2236', borderRadius:'0 0 0 4px', position:'relative', flexShrink:0, alignSelf:'stretch' }}>
                {[0,10,20,30,40,50,60,70,80,90,100].map(p => (
                  <div key={p} style={{ position:'absolute', top:`${p}%`, left:0, right:0, display:'flex', alignItems:'center' }}>
                    <div style={{ height:1, width: p%10===0 ? 8 : 4, background: p===50 ? '#60a5fa' : '#4b5563', marginLeft:'auto' }}/>
                    {p % 10 === 0 && p > 0 && p < 100 && (
                      <span style={{ position:'absolute', right:10, fontSize:6, color: p===50 ? '#60a5fa' : '#6b7280', transform:'translateY(-50%)', lineHeight:1 }}>{p}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* ── PDF Canvas — containerRef on the aspect-ratio div for exact coordinate calc ── */}
              <div
                ref={containerRef}
                className="relative shadow-2xl select-none"
                style={{
                  flex:1, aspectRatio: pdfAspect,
                  cursor: tool !== 'select' ? 'crosshair' : 'default',
                  alignSelf: 'flex-start',   // let aspect-ratio control height, not flex-stretch
                }}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onDrop={handleCanvasDrop}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
              >

                {/* Faint center crosshair — always visible */}
                <div style={{ position:'absolute', left:'50%', top:0, bottom:0, borderLeft:'1px dashed rgba(99,179,237,0.3)', zIndex:8, pointerEvents:'none' }}/>
                <div style={{ position:'absolute', top:'50%', left:0, right:0, borderTop:'1px dashed rgba(99,179,237,0.3)', zIndex:8, pointerEvents:'none' }}/>

                {/* Active snap guides */}
                {activeGuides.x !== null && (
                  <div style={{ position:'absolute', left:`${activeGuides.x}%`, top:0, bottom:0, borderLeft:'2px solid #ef4444', zIndex:12, pointerEvents:'none' }}>
                    <span style={{ position:'absolute', top:4, left:3, fontSize:9, fontWeight:700, color:'#ef4444', background:'rgba(0,0,0,0.7)', padding:'1px 5px', borderRadius:3 }}>{Math.round(activeGuides.x)}%</span>
                  </div>
                )}
                {activeGuides.y !== null && (
                  <div style={{ position:'absolute', top:`${activeGuides.y}%`, left:0, right:0, borderTop:'2px solid #ef4444', zIndex:12, pointerEvents:'none' }}>
                    <span style={{ position:'absolute', left:4, top:2, fontSize:9, fontWeight:700, color:'#ef4444', background:'rgba(0,0,0,0.7)', padding:'1px 5px', borderRadius:3 }}>{Math.round(activeGuides.y)}%</span>
                  </div>
                )}

            {/* PDF rendered to canvas via pdfjs — no browser viewer chrome, coords align 1:1 */}
            {pdfDataUrl ? (
              <img src={pdfDataUrl} alt="" draggable={false}
                className="absolute inset-0 w-full h-full rounded-sm select-none"
                style={{ pointerEvents:'none', display:'block' }}
              />
            ) : template.uploadedPdfUrl ? (
              <div className="absolute inset-0 bg-white rounded-sm flex items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading PDF…</span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-white rounded-sm flex items-center justify-center">
                <p className="text-slate-400 text-sm">No PDF — use a blank canvas</p>
              </div>
            )}

            {/* Field overlays */}
            {overlays.map((ov) => {
              const isSel = selected === ov.id
              const typeColor: Record<PdfTool,string> = {
                select:'#1a4a8a', text:'#6d28d9', number:'#1d4ed8', date:'#065f46', image:'#0f766e', table:'#b45309'
              }
              const tc = typeColor[ov.type as PdfTool] || '#1a4a8a'
              const liveVal = (ov.type === 'number' || ov.type === 'date')
                ? (ov.staticValue || null)
                : (ov.fieldKey && prevStudent) ? getSimpleValue(ov.fieldKey, prevStudent) : null
              // 8 resize handles: corners + edge midpoints
              const handles = [
                { cursor:'nw-resize', top:-4, left:-4,  dx:-1, dy:-1 },
                { cursor:'n-resize',  top:-4, left:'50%' as const, dx:0, dy:-1 },
                { cursor:'ne-resize', top:-4, right:-4, dx:1, dy:-1 },
                { cursor:'e-resize',  top:'50%' as const, right:-4, dx:1, dy:0 },
                { cursor:'se-resize', bottom:-4, right:-4, dx:1, dy:1 },
                { cursor:'s-resize',  bottom:-4, left:'50%' as const, dx:0, dy:1 },
                { cursor:'sw-resize', bottom:-4, left:-4,  dx:-1, dy:1 },
                { cursor:'w-resize',  top:'50%' as const, left:-4, dx:-1, dy:0 },
              ]
              return (
                <div key={ov.id}
                  style={{
                    position:'absolute', left:`${ov.x}%`, top:`${ov.y}%`,
                    width:`${ov.width}%`, height:`${ov.height}%`,
                    border:`2px solid ${isSel ? tc : tc+'99'}`,
                    background: isSel ? `${tc}22` : `${tc}0d`,
                    borderRadius:'3px', cursor: isSel ? 'move' : 'grab', userSelect:'none',
                    boxShadow: isSel ? `0 0 0 3px ${tc}44, 0 2px 8px rgba(0,0,0,0.25)` : `0 1px 3px rgba(0,0,0,0.1)`,
                    display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 5px', overflow:'hidden',
                  }}
                  onMouseDown={(e) => handleFieldMouseDown(e, ov.id, 'move')}
                  onClick={(e) => { e.stopPropagation(); setSel(ov.id) }}
                >

                  {/* Field label + live value — exact 1:1 scale match with PDF output */}
                  {(() => {
                    // containerRef IS the aspect-ratio div — clientWidth/Height = actual canvas px
                    const [pw, ph] = pdfAspect.split('/').map(Number)
                    const cw = containerRef.current?.clientWidth  ?? (pw || 792)
                    const ch = containerRef.current?.clientHeight ?? (ph || 612)
                    // 1pt in PDF = (cw/pw) px on screen
                    const scale  = cw / (pw || 792)
                    const fieldWpx = (ov.width  / 100) * cw
                    const fieldHpx = (ov.height / 100) * ch
                    // Mirror the exact PDF auto-fit formula
                    let displayPx = (ov.fontSize ?? 11) * scale
                    displayPx = Math.min(displayPx, fieldHpx * 0.82)
                    const approxTextW = (liveVal?.length ?? 0) * displayPx * 0.55
                    if (approxTextW > fieldWpx * 0.97 && approxTextW > 0) {
                      displayPx = Math.max(4, displayPx * (fieldWpx * 0.97 / approxTextW))
                    }
                    void ch
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:'1px', overflow:'hidden' }}>
                        {ov.type === 'image' && ov.imageDataUrl && (
                          <img src={ov.imageDataUrl} style={{ width:'100%', height:'100%', objectFit:'contain', position:'absolute', inset:0 }} alt="" />
                        )}
                        {!liveVal && !(ov.type === 'image' && ov.imageDataUrl) && (
                          <span style={{ fontSize:'8px', fontFamily:'system-ui', fontWeight:700, color:`${tc}cc`, lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {ov.type==='table' ? `⊞ ${ov.tableRows??3}×${ov.tableCols??5} Table` : ov.type==='image' ? `⬜ ${ov.label}` : ov.label}
                          </span>
                        )}
                        {liveVal && (
                          <span style={{
                            fontSize:`${Math.max(8, displayPx)}px`,
                            fontFamily: getFontCss(ov.fontFamily ?? 'Helvetica'),
                            fontWeight: ov.bold ? 700 : 400,
                            fontStyle: ov.italic ? 'italic' : 'normal',
                            color: ov.color || '#1e293b',
                            textAlign: ov.align || 'left',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2,
                          }}>
                            {liveVal}
                          </span>
                        )}
                        {ov.type === 'text' && !ov.fieldKey && (
                          <span style={{ fontSize:'9px', fontFamily:'system-ui', color:`${tc}88`, fontStyle:'italic' }}>unmapped</span>
                        )}
                      </div>
                    )
                  })()}

                  {/* 8 resize handles */}
                  {isSel && handles.map((h, i) => (
                    <div key={i}
                      style={{
                        position:'absolute',
                        ...(h.top    !== undefined && h.top    !== '50%' ? { top:    h.top    } : h.top    === '50%' ? { top:'50%',    transform:'translateY(-50%)' } : {}),
                        ...(h.bottom !== undefined                        ? { bottom: h.bottom } : {}),
                        ...(h.left   !== undefined && h.left   !== '50%' ? { left:   h.left   } : h.left   === '50%' ? { left:'50%',   transform:'translateX(-50%)' } : {}),
                        ...(h.right  !== undefined                        ? { right:  h.right  } : {}),
                        ...(h.top === '50%' ? { transform:'translateY(-50%)' } : h.left === '50%' ? { transform:'translateX(-50%)' } : {}),
                        width:8, height:8, background:'white', border:`2px solid ${tc}`,
                        borderRadius:'2px', cursor:h.cursor, zIndex:5,
                      }}
                      onMouseDown={(e) => { e.stopPropagation(); handleFieldMouseDown(e, ov.id, 'resize') }}
                    />
                  ))}
                </div>
              )
            })}

                {/* Position HUD on selected field */}
                {selOv && (
                  <div style={{
                    position:'absolute',
                    left:`${selOv.x}%`, top:`calc(${selOv.y}% - 20px)`,
                    background:'rgba(15,23,42,0.85)', color:'#e2e8f0',
                    fontSize:9, fontWeight:700, fontFamily:'monospace',
                    padding:'2px 6px', borderRadius:4, pointerEvents:'none', zIndex:20,
                    whiteSpace:'nowrap', lineHeight:1.6,
                  }}>
                    x:{Math.round(selOv.x)}% y:{Math.round(selOv.y)}% · {Math.round(selOv.width)}×{Math.round(selOv.height)}%
                  </div>
                )}

              </div>{/* end containerRef / PDF canvas */}
            </div>{/* end canvas row */}
          </div>{/* end outer max-w wrapper */}

          {showPreview && previewUrl && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPrev(false)}>
              <div className="relative bg-[#1e2533] rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full mx-8 max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 shrink-0">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Preview — {prevStudent?.firstName} {prevStudent?.lastName}</span>
                    <select value={prevStudent?.id ?? ''} onChange={e => setPrevStu(MOCK_STUDENTS.find(s => s.id===e.target.value)??null)}
                      className="h-7 rounded-lg border border-slate-600 bg-slate-700 px-2 text-[11px] text-white focus:outline-none">
                      {MOCK_STUDENTS.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                    </select>
                    <button onClick={runPreview} disabled={generating}
                      className="flex items-center gap-1 h-7 rounded-lg border border-slate-600 px-2 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40">
                      <RefreshCw className={`h-3 w-3 ${generating?'animate-spin':''}`}/> Refresh
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowPrev(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5"/></button>
                  </div>
                </div>
                {previewImgs.length > 0 ? (
                  <div className="flex-1 overflow-y-auto bg-[#111827] flex flex-col items-center gap-4 p-4">
                    {previewImgs.map((src, i) => (
                      <img key={i} src={src} alt={`Page ${i+1}`} className="w-full max-w-3xl rounded shadow-2xl block" />
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="w-[280px] shrink-0 border-l border-slate-700 bg-[#252d3d] flex flex-col overflow-hidden text-white">

          {selOv ? (
            <>
              <div className="px-4 py-3 border-b border-slate-700 shrink-0 flex items-center justify-between">
                <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-slate-400"/>
                  {selOv.type === 'table' ? 'Table Field' : selOv.type === 'image' ? 'Image Field' : selOv.type === 'number' ? 'Number Field' : selOv.type === 'date' ? 'Date Field' : 'Field Properties'}
                </p>
                <button onClick={() => delSel()} className="text-red-400 hover:text-red-300 text-[11px] font-semibold flex items-center gap-1">
                  <Trash2 className="h-3 w-3"/> Delete
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Label */}
                <div className="px-4 py-3 border-b border-slate-700/60">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Label</label>
                  <input value={selOv.label} onChange={e => upd(selOv.id,{label:e.target.value})}
                    className="w-full h-8 rounded-lg bg-slate-700 border border-slate-600 px-2.5 text-[11px] text-white focus:outline-none focus:border-brand-400" />
                </div>

                {/* Text field: map to student field */}
                {selOv.type === 'text' && (
                  <div className="px-4 py-3 border-b border-slate-700/60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Map to Student Field</label>
                    <select value={selOv.fieldKey} onChange={e => upd(selOv.id,{fieldKey:e.target.value})}
                      className="w-full h-8 rounded-lg bg-slate-700 border border-slate-600 px-2 text-[11px] text-white focus:outline-none focus:border-brand-400">
                      <option value="">— Select field —</option>
                      <optgroup label="Personal Info">
                        {PH_GROUPS[0].items.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </optgroup>
                      <optgroup label="Academic Info">
                        {PH_GROUPS[1].items.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </optgroup>
                    </select>
                    {!selOv.fieldKey && (
                      <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>Not mapped — won&apos;t fill data</p>
                    )}
                  </div>
                )}

                {/* Number field: static number input */}
                {selOv.type === 'number' && (
                  <div className="px-4 py-3 border-b border-slate-700/60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Number Value</label>
                    <input type="number" value={selOv.staticValue ?? ''}
                      onChange={e => upd(selOv.id,{staticValue:e.target.value})}
                      placeholder="Enter number…"
                      className="w-full h-8 rounded-lg bg-slate-700 border border-slate-600 px-2.5 text-[11px] text-white focus:outline-none focus:border-brand-400" />
                  </div>
                )}

                {/* Date field: date picker */}
                {selOv.type === 'date' && (
                  <div className="px-4 py-3 border-b border-slate-700/60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Date Value</label>
                    <input type="date" value={selOv.staticValue ?? ''}
                      onChange={e => upd(selOv.id,{staticValue:e.target.value})}
                      className="w-full h-8 rounded-lg bg-slate-700 border border-slate-600 px-2.5 text-[11px] text-white focus:outline-none focus:border-brand-400 [color-scheme:dark]" />
                  </div>
                )}

                {/* Image field: file upload */}
                {selOv.type === 'image' && (
                  <div className="px-4 py-3 border-b border-slate-700/60 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Image</label>
                    {selOv.imageDataUrl && (
                      <img src={selOv.imageDataUrl} alt="preview"
                        className="w-full rounded-lg max-h-28 object-contain border border-slate-600 bg-slate-800" />
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" id={`img_up_${selOv.id}`}
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const reader = new FileReader()
                        reader.onload = ev => upd(selOv.id,{imageDataUrl: ev.target?.result as string})
                        reader.readAsDataURL(f)
                        e.target.value = ''
                      }} />
                    <label htmlFor={`img_up_${selOv.id}`}
                      className="flex items-center justify-center gap-2 w-full h-8 rounded-lg bg-slate-700 border border-dashed border-slate-500 text-[11px] text-slate-300 hover:bg-slate-600 cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5"/> {selOv.imageDataUrl ? 'Replace Image' : 'Upload Image'}
                    </label>
                    {selOv.imageDataUrl && (
                      <button onClick={() => upd(selOv.id,{imageDataUrl:undefined})}
                        className="w-full text-[10px] text-red-400 hover:text-red-300 transition-colors">
                        Remove image
                      </button>
                    )}
                  </div>
                )}

                {/* Table: rows × cols */}
                {selOv.type === 'table' && (
                  <div className="px-4 py-3 border-b border-slate-700/60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Table Size</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 block mb-1">Rows</label>
                        <input type="number" min={1} max={50} value={selOv.tableRows ?? 3}
                          onChange={e => upd(selOv.id,{tableRows:Math.max(1,parseInt(e.target.value)||1)})}
                          className="w-full h-7 rounded bg-slate-700 border border-slate-600 px-2 text-[11px] text-white text-center focus:outline-none" />
                      </div>
                      <span className="text-slate-500 text-sm mt-4">×</span>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 block mb-1">Cols</label>
                        <input type="number" min={1} max={20} value={selOv.tableCols ?? 5}
                          onChange={e => upd(selOv.id,{tableCols:Math.max(1,parseInt(e.target.value)||1)})}
                          className="w-full h-7 rounded bg-slate-700 border border-slate-600 px-2 text-[11px] text-white text-center focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Position & size */}
                <div className="px-4 py-3 border-b border-slate-700/60">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Position & Size (%)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['x','y','width','height'] as const).map(k => (
                      <div key={k}>
                        <label className="text-[10px] text-slate-500 block mb-0.5">{k.toUpperCase()}</label>
                        <input type="number" step="0.5"
                          value={parseFloat(String(selOv[k])).toFixed(1)}
                          onChange={e => upd(selOv.id, { [k]: parseFloat(e.target.value)||0 })}
                          className="w-full h-7 rounded bg-slate-700 border border-slate-600 px-2 text-[11px] text-white focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text styling (not for table/image) */}
                {selOv.type !== 'table' && selOv.type !== 'image' && (
                  <div className="px-4 py-3 border-b border-slate-700/60">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Text Style</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-16">Font</label>
                        <select value={selOv.fontFamily ?? 'Helvetica'}
                          onChange={e => {
                            if (e.target.value === '__import__') { fontImportRef.current?.click(); return }
                            upd(selOv.id,{fontFamily:e.target.value})
                          }}
                          className="flex-1 h-7 rounded bg-slate-700 border border-slate-600 px-1.5 text-[11px] text-white focus:outline-none">
                          <optgroup label="Standard">
                            {BUILTIN_FONT_PRESETS.filter(f=>!f.gfamily).map(f=>(
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Google Fonts">
                            {BUILTIN_FONT_PRESETS.filter(f=>f.gfamily).map(f=>(
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </optgroup>
                          {customFonts.length > 0 && (
                            <optgroup label="Imported">
                              {customFonts.map(f=><option key={f.id} value={f.name}>{f.name}</option>)}
                            </optgroup>
                          )}
                          <option value="__import__">＋ Import font…</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-16">Size (pt)</label>
                        <input type="number" min={6} max={120} value={selOv.fontSize}
                          onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) upd(selOv.id,{fontSize:v}) }}
                          onBlur={e => { const v = parseInt(e.target.value)||11; upd(selOv.id,{fontSize:Math.max(6,Math.min(120,v))}) }}
                          className="w-16 h-7 rounded bg-slate-700 border border-slate-600 px-2 text-[11px] text-white focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-16">Bold</label>
                        <input type="checkbox" checked={selOv.bold}
                          onChange={e => upd(selOv.id,{bold:e.target.checked})}
                          className="accent-brand-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-16">Italic</label>
                        <input type="checkbox" checked={!!selOv.italic}
                          onChange={e => upd(selOv.id,{italic:e.target.checked})}
                          className="accent-brand-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-16">Color</label>
                        <input type="color" value={selOv.color}
                          onChange={e => upd(selOv.id,{color:e.target.value})}
                          className="h-7 w-14 rounded border border-slate-600 bg-slate-700 cursor-pointer" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-16">Align</label>
                        <div className="flex gap-1">
                          {(['left','center','right'] as const).map(a => (
                            <button key={a} onClick={() => upd(selOv.id,{align:a})}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${selOv.align===a ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                              {a[0].toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-slate-700 shrink-0">
                <button onClick={() => setSel(null)}
                  className="w-full h-8 rounded-lg bg-slate-700 border border-slate-600 text-[11px] font-semibold text-slate-300 hover:bg-slate-600">
                  ← All Fields
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-700 shrink-0">
                <p className="text-[11px] font-bold text-white flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-slate-400"/>Fields ({overlays.length})</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Click a tool above, then click the PDF to place</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {overlays.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                    <MapPin className="h-8 w-8 text-slate-600" />
                    <p className="text-[11px] text-slate-500">No fields yet.<br/>Select a tool, then click on the PDF to place a field.</p>
                  </div>
                ) : overlays.map(ov => (
                  <div key={ov.id}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors ${selected===ov.id?'bg-slate-700':''}`}
                    onClick={() => setSel(ov.id)}>
                    <div className={`h-2 w-2 rounded-full shrink-0 ${ov.type==='table'?'bg-amber-400':ov.fieldKey?'bg-emerald-400':'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">{ov.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {ov.type==='table' ? `${ov.tableRows??3} rows × ${ov.tableCols??5} cols` : (ov.fieldKey ? (PH_LABEL[ov.fieldKey]??ov.fieldKey) : '⚠ Not mapped')}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold uppercase rounded px-1.5 py-0.5 bg-slate-700 text-slate-400 shrink-0">
                      {ov.type}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 px-4 py-3 bg-[#1e2533] shrink-0 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Preview</p>

                {/* Student nav row */}
                <div className="flex items-center gap-1">
                  <button onClick={() => setStuIdx(i => Math.max(0, i - 1))} disabled={stuIdx === 0}
                    className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5"/>
                  </button>
                  <div className="flex-1 min-w-0 rounded-lg bg-slate-700 border border-slate-600 px-2 h-8 flex items-center">
                    <p className="text-[11px] text-white truncate">
                      {prevStudent ? `${prevStudent.firstName} ${prevStudent.lastName}` : '—'}
                    </p>
                  </div>
                  <button onClick={() => setStuIdx(i => Math.min(filteredStu.length - 1, i + 1))} disabled={stuIdx >= filteredStu.length - 1}
                    className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors">
                    <ChevronRight className="h-3.5 w-3.5"/>
                  </button>
                  <button onClick={() => { setShowStuSearch(v => !v); setTimeout(() => stuSearchRef.current?.focus(), 50) }}
                    className={`flex h-8 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${showStuSearch ? 'border-emerald-500 bg-emerald-900 text-emerald-300' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                    <Search className="h-3.5 w-3.5"/>
                  </button>
                </div>

                {/* Search input */}
                {showStuSearch && (
                  <div>
                    <input
                      ref={stuSearchRef}
                      value={stuSearch}
                      onChange={e => setStuSearch(e.target.value)}
                      placeholder="Search name or ID…"
                      className="w-full h-8 rounded-lg bg-slate-700 border border-emerald-600 px-2 text-[11px] text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                    {stuSearch && (
                      <p className="text-[9px] text-slate-400 mt-0.5">{filteredStu.length} result{filteredStu.length !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                )}

                <button onClick={runPreview} disabled={generating || !template.uploadedPdfUrl}
                  className="w-full h-8 rounded-lg bg-emerald-700 text-[11px] font-bold text-white hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin"/> : <Eye className="h-3.5 w-3.5"/>}
                  {generating ? 'Generating…' : 'Preview with Student'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Table insert modal ── */}
      {tableModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTableModal(false)} />
          <div className="relative z-10 w-80 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-amber-50 border-b border-amber-200">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2"><Table className="h-4 w-4 text-amber-600"/>Insert Table</h3>
              <p className="text-xs text-amber-700 mt-0.5">Set the number of rows and columns.</p>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Rows</label>
                  <input type="number" min={1} max={50} value={tableRowsIn}
                    onChange={e => setTableRowsIn(Math.max(1, parseInt(e.target.value)||1))}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-400 text-center" />
                </div>
                <div className="text-lg font-bold text-slate-400 mt-5">×</div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Columns</label>
                  <input type="number" min={1} max={20} value={tableColsIn}
                    onChange={e => setTableColsIn(Math.max(1, parseInt(e.target.value)||1))}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-400 text-center" />
                </div>
              </div>
              {/* Visual grid preview */}
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-[10px] text-slate-400 mb-2 text-center">{tableRowsIn} × {tableColsIn} table</p>
                <div className="overflow-hidden rounded border border-slate-300"
                  style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(tableColsIn,8)}, 1fr)`, gap:0 }}>
                  {Array.from({ length: Math.min(tableRowsIn, 6) * Math.min(tableColsIn, 8) }).map((_,i) => (
                    <div key={i} className="border border-slate-200 bg-white" style={{ height:'18px' }} />
                  ))}
                </div>
                {(tableRowsIn > 6 || tableColsIn > 8) && (
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">Preview truncated — full table will be placed</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={()=>setTableModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={insertTableOverlay} className="rounded-xl bg-amber-600 px-5 py-2 text-[11px] font-bold text-white hover:bg-amber-700">Place Table →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-700 bg-[#1e2533] shrink-0">
        <TypeBadge type={template.type} />
        <span className="text-[10px] text-slate-500">{overlays.filter(o=>o.fieldKey||o.type==='table').length}/{overlays.length} fields mapped</span>
        <span className="text-[10px] text-slate-600 ml-auto hidden sm:inline">pdf-lib overlay engine</span>
      </div>
    </div>
  )
}

// ── Mapping Editor ────────────────────────────────────────────────────────────

function MappingEditor({ template, onBack, onSaved }: {
  template: DocTemplate; onBack: ()=>void; onSaved: (u: DocTemplate)=>void
}) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [name,        setName]      = useState(template.name)
  const [isDirty,     setDirty]     = useState(false)
  const [saved,       setSaved]     = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPrevHtml]  = useState('')
  const [prevStudent, setPrevStu]   = useState<Student | null>(MOCK_STUDENTS[0] ?? null)
  const [mappedKeys,  setMappedKeys] = useState<Set<string>>(new Set())
  const [hasLoop,     setHasLoop]   = useState(false)

  // Popup for field assignment
  const [fieldPopup, setFieldPopup] = useState<{
    x: number; y: number; savedRange: Range | null
  } | null>(null)

  // Table mapping modal
  const [tableModal, setTableModal] = useState<{
    row: HTMLTableRowElement; colCount: number
  } | null>(null)
  const [loopType,   setLoopType]  = useState<'subjects'|'current_subjects'|'completed_subjects'>('subjects')
  const [colMappings,setColMaps]   = useState<Record<number,string>>({})

  // Unmapped warning clicked field
  const [unmappedAlert, setUnmappedAlert] = useState<string|null>(null)

  // Sync DOM → state
  function syncState() {
    if (!viewerRef.current) return
    const spans = viewerRef.current.querySelectorAll('[data-mapped]')
    const keys = new Set<string>()
    spans.forEach((s) => { const k = s.getAttribute('data-mapped'); if (k) keys.add(k) })
    setMappedKeys(keys)
    setHasLoop(!!viewerRef.current.querySelector('[data-loop-type]'))
  }

  // Initial load
  useEffect(() => {
    if (!viewerRef.current) return
    viewerRef.current.innerHTML = template.body
    syncState()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id])

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (fieldPopup || tableModal) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return
    const range = sel.getRangeAt(0)
    if (!viewerRef.current?.contains(range.commonAncestorContainer)) return
    // Don't allow mapping over existing mapping
    const node = range.commonAncestorContainer as Element
    if (node.closest?.('[data-mapped]') || (node as Element).getAttribute?.('data-mapped')) return
    const rect = range.getBoundingClientRect()
    setFieldPopup({ x: e.clientX, y: rect.bottom + 8, savedRange: range.cloneRange() })
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Close field popup if clicking outside
    if (fieldPopup) { setFieldPopup(null); window.getSelection()?.removeAllRanges(); return }
    // Detect click on data-mapped span (to remove mapping)
    const target = e.target as HTMLElement
    const mappedEl = target.closest('[data-mapped]') as HTMLElement | null
    if (mappedEl && viewerRef.current?.contains(mappedEl)) {
      const key = mappedEl.getAttribute('data-mapped') ?? ''
      const label = PH_LABEL[key] ?? key
      if (confirm(`Remove mapping for [${label}]?`)) {
        const text = mappedEl.textContent ?? ''
        const t = document.createTextNode(text)
        mappedEl.replaceWith(t); syncState(); setDirty(true)
      }
      return
    }
    // Detect click on a tbody row for table mapping
    const tr = target.closest('tbody > tr') as HTMLTableRowElement | null
    if (tr && viewerRef.current?.contains(tr)) {
      const cells = tr.querySelectorAll('td')
      if (cells.length === 0) return
      const existing = tr.getAttribute('data-loop-type') as typeof loopType | null
      setLoopType(existing ?? 'subjects')
      // Pre-fill col mappings from existing data-mapped spans in the row
      const preFill: Record<number, string> = {}
      cells.forEach((cell, i) => {
        const span = cell.querySelector('[data-mapped]')
        if (span) preFill[i] = span.getAttribute('data-mapped') ?? ''
      })
      setColMaps(preFill)
      setTableModal({ row: tr, colCount: cells.length })
    }
  }

  function mapField(fieldKey: string) {
    if (!fieldPopup || !viewerRef.current) return
    const range = fieldPopup.savedRange
    setFieldPopup(null)
    if (!range) return
    const span = document.createElement('span')
    span.setAttribute('data-mapped', fieldKey)
    span.setAttribute('title', `Mapped: ${PH_LABEL[fieldKey] ?? fieldKey} — click to remove`)
    span.style.cssText = MAPPED_SPAN_STYLE
    try {
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
    } catch {
      range.deleteContents()
      span.textContent = `[${PH_LABEL[fieldKey] ?? fieldKey}]`
      range.insertNode(span)
    }
    window.getSelection()?.removeAllRanges()
    syncState(); setDirty(true)
  }

  function applyTableMapping() {
    if (!tableModal || !viewerRef.current) return
    const { row } = tableModal
    row.setAttribute('data-loop-type', loopType)
    row.setAttribute('style', MAPPED_LOOP_ROW_STYLE)
    const cells = row.querySelectorAll('td')
    cells.forEach((cell, i) => {
      const key = colMappings[i]
      if (key) {
        cell.setAttribute('data-mapped-col', key)
        // Wrap cell content in a mapped span
        const existing = cell.querySelector('[data-mapped]')
        if (existing) existing.remove()
        const span = document.createElement('span')
        span.setAttribute('data-mapped', key)
        span.setAttribute('title', `Mapped: ${PH_LABEL[key] ?? key} — click to remove`)
        span.style.cssText = MAPPED_SPAN_STYLE
        span.textContent = `[${PH_LABEL[key] ?? key}]`
        // Preserve original text as separate node for reference, then replace
        cell.innerHTML = ''
        cell.appendChild(span)
      }
    })
    syncState(); setDirty(true); setTableModal(null)
  }

  function clearTableMapping() {
    if (!tableModal || !viewerRef.current) return
    const { row } = tableModal
    row.removeAttribute('data-loop-type')
    row.removeAttribute('style')
    const cells = row.querySelectorAll('td')
    cells.forEach((cell) => {
      cell.removeAttribute('data-mapped-col')
      const span = cell.querySelector('[data-mapped]')
      if (span) { cell.textContent = span.textContent; }
    })
    syncState(); setDirty(true); setTableModal(null)
  }

  function togglePreview() {
    if (!showPreview && viewerRef.current && prevStudent) {
      setPrevHtml(previewMappedTemplate(viewerRef.current.innerHTML, prevStudent))
    }
    setShowPreview((p) => !p)
  }

  useEffect(() => {
    if (showPreview && viewerRef.current && prevStudent) {
      setPrevHtml(previewMappedTemplate(viewerRef.current.innerHTML, prevStudent))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevStudent])

  function save() {
    const body = viewerRef.current?.innerHTML ?? template.body
    const now  = new Date().toISOString()
    onSaved({ ...template, name: name.trim() || template.name, body, updatedAt: now.slice(0,10), isMapped: true })
    setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  // Important fields to show status for
  const KEY_FIELDS = [...PH_GROUPS[0].items.slice(0,4), ...PH_GROUPS[1].items.slice(0,5)]

  const LOOP_LABELS: Record<string,string> = {
    subjects:'All Subjects', current_subjects:'Current Semester', completed_subjects:'Completed Only'
  }

  return (
    <div className="-mx-6 -mt-6 -mb-6 flex flex-col" style={{ height:'calc(100vh - 56px)', background:'#f3f6fb' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 shrink-0">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="h-4 w-px bg-slate-200 shrink-0" />
        <FileText className="h-4 w-4 text-brand-500 shrink-0" />
        <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true) }}
          className="flex-1 min-w-0 text-sm font-bold text-slate-800 bg-transparent border-none outline-none" />
        <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">Mapping Mode</span>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && <span className="text-[11px] text-slate-400 hidden sm:inline">Unsaved</span>}
          {saved   && <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" />Saved</span>}
          <button onClick={save} disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors">
            <CheckCircle2 className="h-3 w-3" /> Save
          </button>
          <button onClick={togglePreview}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[11px] font-bold transition-colors ${showPreview ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Eye className="h-3 w-3" /> {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* ── Help bar ── */}
      {!showPreview && (
        <div className="flex items-start gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 shrink-0">
          <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800">
            <strong>Select (highlight) any text</strong> in the document to map it to a student field. &nbsp;
            <strong>Click any table row</strong> in the body to configure it to auto-fill with subject data.
            Mapped text shows in <span style={{ background:'#fef08a', border:'1px solid #fbbf24', borderRadius:3, padding:'0 3px', fontSize:11, fontWeight:600, color:'#713f12' }}>yellow</span>. Click a mapped field to remove it.
          </p>
        </div>
      )}

      {showPreview ? (

        /* ── Preview mode ── */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0 flex-wrap gap-y-2">
            <span className="text-xs font-semibold text-slate-600">Preview with:</span>
            <select value={prevStudent?.id ?? ''}
              onChange={(e) => setPrevStu(MOCK_STUDENTS.find((s) => s.id === e.target.value) ?? null)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none">
              {MOCK_STUDENTS.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.studentId}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              {prevStudent && (
                <button onClick={() => { if (viewerRef.current && prevStudent) printDoc(processMappedTemplate(viewerRef.current.innerHTML, prevStudent), name) }}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-brand-600">
                  <Printer className="h-3.5 w-3.5" /> Print / Export PDF
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-slate-300">
            {prevStudent
              ? <div className="w-full max-w-3xl mx-auto bg-white shadow-2xl" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              : <div className="flex items-center justify-center h-full"><p className="text-slate-400">Select a student above</p></div>
            }
          </div>
        </div>

      ) : (

        /* ── Mapping mode ── */
        <div className="flex flex-1 overflow-hidden">

          {/* ── Document viewer ── */}
          <div className="flex-1 overflow-y-auto p-8 cursor-text select-text" style={{ background:'#dde3ec' }}>
            <div
              ref={viewerRef}
              onMouseUp={handleMouseUp}
              onClick={handleClick}
              className="w-full max-w-[740px] mx-auto bg-white shadow-xl min-h-[700px] select-text outline-none"
              style={{ fontFamily:"'Times New Roman',serif", fontSize:'13px', padding:'60px 70px', lineHeight:'1.7', userSelect:'text' }}
            />
            <p className="text-center text-[10px] text-slate-400 mt-4">
              Select text to map a field · Click a table body row to configure auto-fill
            </p>
          </div>

          {/* ── Right panel: mapping status ── */}
          <div className="w-[260px] shrink-0 border-l border-slate-200 flex flex-col bg-white overflow-hidden">

            <div className="px-4 py-3 border-b border-slate-100 bg-amber-50 shrink-0">
              <p className="text-[11px] font-bold text-amber-900">Mapping Status</p>
              <p className="text-[10px] text-amber-700 mt-0.5">{mappedKeys.size} field{mappedKeys.size !== 1 ? 's' : ''} mapped · {hasLoop ? '1 table configured' : 'No table configured'}</p>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* Field status */}
              <div>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Fields</p>
                </div>
                <div className="px-3 py-2 space-y-1">
                  {KEY_FIELDS.map((ph) => {
                    const isMapped = mappedKeys.has(ph.key)
                    return (
                      <div key={ph.key} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${isMapped ? 'bg-emerald-50' : 'bg-slate-50'}`}
                        title={isMapped ? `${ph.label} is mapped` : `${ph.label} — select text in the document and map it here`}>
                        <div className={`h-2 w-2 rounded-full shrink-0 ${isMapped ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`text-[11px] font-semibold ${isMapped ? 'text-emerald-800' : 'text-slate-500'}`}>{ph.label}</span>
                        {!isMapped && (
                          <button className="ml-auto text-[9px] text-slate-400 hover:text-amber-600 font-bold"
                            onClick={() => setUnmappedAlert(ph.key)}>
                            !
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {/* Show any extra mapped fields not in KEY_FIELDS */}
                  {[...mappedKeys].filter((k) => !KEY_FIELDS.find((f) => f.key === k)).map((k) => (
                    <div key={k} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-emerald-50">
                      <div className="h-2 w-2 rounded-full shrink-0 bg-emerald-500" />
                      <span className="text-[11px] font-semibold text-emerald-800">{PH_LABEL[k] ?? k}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table status */}
              <div className="border-t border-slate-100">
                <div className="px-4 py-2 bg-teal-50 border-b border-teal-100 sticky top-0">
                  <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">Auto-fill Table</p>
                </div>
                <div className="px-3 py-3">
                  {hasLoop ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <p className="text-[11px] font-bold text-emerald-800">Table Configured</p>
                      </div>
                      <p className="text-[10px] text-emerald-700">
                        {LOOP_LABELS[viewerRef.current?.querySelector('[data-loop-type]')?.getAttribute('data-loop-type') ?? ''] ?? 'Subjects'} will auto-fill when generating.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <p className="text-[11px] font-bold text-amber-800">Table Not Configured</p>
                      </div>
                      <p className="text-[10px] text-amber-700">Click on any table body row in the document to configure auto-fill.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* How to map guide */}
              <div className="border-t border-slate-100">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">How to Map</p>
                </div>
                <ol className="px-4 py-3 space-y-2 text-[10px] text-slate-600 leading-relaxed">
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-brand-600">1.</span>Find the student&rsquo;s name in your document and select (highlight) it</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-brand-600">2.</span>A popup appears — choose the field (e.g. &ldquo;Full Name&rdquo;)</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-brand-600">3.</span>The text turns <span style={{ background:'#fef08a', padding:'0 2px', borderRadius:2, fontWeight:600 }}>yellow</span> — it&rsquo;s now mapped</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-brand-600">4.</span>For grade tables: click any data row to configure auto-fill</li>
                  <li className="flex gap-2"><span className="shrink-0 font-bold text-brand-600">5.</span>Click <strong>Save</strong>, then use <strong>Generate</strong> to produce documents</li>
                </ol>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── Field picker popup ── */}
      {fieldPopup && (
        <div className="fixed z-[70]" style={{ left: Math.min(fieldPopup.x, window.innerWidth - 260), top: fieldPopup.y }}>
          <div className="w-56 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-3 py-2 bg-brand-50 border-b border-brand-100">
              <p className="text-[11px] font-bold text-brand-800">Map selected text to:</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {[...PH_GROUPS[0].items, ...PH_GROUPS[1].items].map((ph) => (
                <button key={ph.key} type="button" onClick={() => mapField(ph.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-brand-50 transition-colors text-left">
                  <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">[{ph.label}]</span>
                  <span className="text-[10px] text-slate-500 truncate">{ph.desc}</span>
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
              <button onClick={() => { setFieldPopup(null); window.getSelection()?.removeAllRanges() }}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table mapping modal ── */}
      {tableModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTableModal(null)} />
          <div className="relative z-10 w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="px-5 py-4 bg-teal-50 border-b border-teal-200">
              <h3 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                <Table className="h-4 w-4 text-teal-600" /> Configure Table Auto-fill
              </h3>
              <p className="text-xs text-teal-700 mt-1">This row will repeat automatically for each subject when generating a document.</p>
            </div>

            {/* Loop type */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-2">Which subjects should this row show?</p>
              {([
                { value:'subjects'           as const, label:'All Subjects (use for TOR)',    desc:'Every subject across all semesters' },
                { value:'current_subjects'   as const, label:'Current Semester Only',         desc:'Active semester subjects' },
                { value:'completed_subjects' as const, label:'Completed (Passed) Only',       desc:'Subjects the student has passed' },
              ]).map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 mb-2 cursor-pointer">
                  <input type="radio" name="loopType" value={opt.value} checked={loopType === opt.value}
                    onChange={() => setLoopType(opt.value)} className="mt-0.5 accent-teal-600" />
                  <div><p className="text-[11px] font-semibold text-slate-800">{opt.label}</p><p className="text-[10px] text-slate-500">{opt.desc}</p></div>
                </label>
              ))}
            </div>

            {/* Column mapping */}
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-slate-700 mb-3">Map each column to a data field:</p>
              <div className="space-y-2">
                {Array.from({ length: tableModal.colCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-slate-600 w-20 shrink-0">Column {i+1}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    <select value={colMappings[i] ?? ''}
                      onChange={(e) => setColMaps((prev) => ({ ...prev, [i]: e.target.value }))}
                      className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 focus:outline-none focus:border-brand-300">
                      <option value="">— Not mapped —</option>
                      {PH_GROUPS[3].items.map((ph) => (
                        <option key={ph.key} value={ph.key}>{ph.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3" /> You can leave columns unmapped — they will keep their original content
              </p>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
              {tableModal.row.getAttribute('data-loop-type') && (
                <button onClick={clearTableMapping} className="text-[11px] font-semibold text-red-500 hover:text-red-700">
                  Remove Table Configuration
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setTableModal(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button onClick={applyTableMapping} className="rounded-xl bg-teal-600 px-5 py-2 text-[11px] font-bold text-white hover:bg-teal-700">
                  Apply Configuration →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unmapped field alert ── */}
      {unmappedAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setUnmappedAlert(null)} />
          <div className="relative z-10 w-80 rounded-2xl bg-white shadow-xl p-5">
            <p className="text-sm font-bold text-slate-800 mb-2">Field Not Mapped</p>
            <p className="text-xs text-slate-500 mb-4">
              <strong>[{PH_LABEL[unmappedAlert] ?? unmappedAlert}]</strong> is not yet mapped. Find where this information appears in your document, select that text, and choose this field from the popup.
            </p>
            <button onClick={() => setUnmappedAlert(null)} className="w-full rounded-xl bg-brand-500 py-2 text-xs font-bold text-white hover:bg-brand-600">Got it</button>
          </div>
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-200 bg-white shrink-0">
        <TypeBadge type={template.type} />
        <span className="text-[10px] text-slate-500 hidden sm:inline">Mapped fields: <strong>{mappedKeys.size}</strong></span>
        <span className="text-[10px] text-slate-500 hidden sm:inline">Table: <strong>{hasLoop ? 'Configured' : 'Not set'}</strong></span>
        <span className="text-[10px] text-slate-400 hidden sm:inline ml-auto">Created: {template.createdAt}</span>
      </div>
    </div>
  )
}

// ── Automation Editor (DocsAutomator-style configuration) ─────────────────────

const STEP_ARROW = (
  <div className="flex justify-center text-slate-300 my-1">
    <svg width="15" height="34" viewBox="0 0 15 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.5 1C8.5 0.447715 8.05228 2.41411e-08 7.5 0C6.94772 -2.41411e-08 6.5 0.447715 6.5 1L8.5 1ZM6.79289 33.7071C7.18342 34.0976 7.81658 34.0976 8.20711 33.7071L14.5711 27.3431C14.9616 26.9526 14.9616 26.3195 14.5711 25.9289C14.1805 25.5384 13.5474 25.5384 13.1569 25.9289L7.5 31.5858L1.84314 25.9289C1.45262 25.5384 0.819456 25.5384 0.428931 25.9289C0.0384067 26.3195 0.0384067 26.9526 0.428931 27.3431L6.79289 33.7071ZM6.5 1L6.5 33L8.5 33L8.5 1L6.5 1Z" fill="currentColor"/>
    </svg>
  </div>
)

function StepCard({ n, title, subtitle, helpUrl, children, action, accent }: {
  n: number; title: string; subtitle?: string; helpUrl?: string
  children: React.ReactNode; action?: React.ReactNode; accent?: string
}) {
  return (
    <div className={`bg-white shadow-sm border flex flex-col grow rounded-2xl w-full ${accent ?? 'border-slate-100'}`}>
      <div className="flex flex-col md:flex-row grow md:items-center px-6 py-4 gap-4">
        <div className="flex grow gap-3 items-start">
          <div className="h-8 w-8 rounded-full flex justify-center items-center font-bold shrink-0 border border-brand-900 text-brand-900 mt-0.5">{n}</div>
          <div>
            <h3 className="font-bold text-base text-slate-900 leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {helpUrl && (
          <a href={helpUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-brand-600 hover:text-brand-400 text-sm transition-colors">
            <Info className="h-4 w-4"/><span>Help</span>
          </a>
        )}
        {action}
      </div>
      <hr className="border-slate-200"/>
      {children}
    </div>
  )
}

interface GenOptions { dateFormat: string; locale: string; pdfQuality: string; formatNumbers: boolean }
interface PostActions { savePDF: boolean; sendEmail: boolean; eSignature: boolean; notifyWebhook: boolean }

function AutomationEditor({ template, onBack, onSaved, onEditTemplate, onMapFields, onConfigureOverlay }: {
  template: DocTemplate; onBack: ()=>void; onSaved: (u: DocTemplate)=>void
  onEditTemplate: ()=>void; onMapFields: ()=>void; onConfigureOverlay: ()=>void
}) {
  const [name,       setName]      = useState(template.name)
  const [tplType,    setTplType]   = useState(template.type)
  const [isDirty,    setDirty]     = useState(false)
  const [saved,      setSaved]     = useState(false)
  const [prevHtml,   setPrevHtml]  = useState('')
  const [generating, setGen]       = useState(false)
  const [pdfDataUrl, setPdfDataUrl] = useState<string|null>(null)

  // Student navigation
  const [stuSearch,  setStuSearch]  = useState('')
  const [stuIdx,     setStuIdx]     = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredStudents = useMemo(() => {
    const q = stuSearch.toLowerCase().trim()
    if (!q) return MOCK_STUDENTS
    return MOCK_STUDENTS.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    )
  }, [stuSearch])

  const prevStu = filteredStudents[stuIdx] ?? filteredStudents[0] ?? null

  function goPrev() { setStuIdx(i => Math.max(0, i - 1)) }
  function goNext() { setStuIdx(i => Math.min(filteredStudents.length - 1, i + 1)) }

  useEffect(() => { setStuIdx(0) }, [stuSearch])

  // Render PDF to canvas via pdfjs for PDF Overlay templates
  useEffect(() => {
    if (!template.isPdfOverlay || !template.uploadedPdfUrl) { setPdfDataUrl(null); return }
    let cancelled = false
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist') as any
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const resp  = await fetch(template.uploadedPdfUrl!)
        const bytes = await resp.arrayBuffer()
        const pdf   = await pdfjs.getDocument({ data: bytes }).promise
        const page  = await pdf.getPage(1)
        const vp1   = page.getViewport({ scale: 1 })
        const scale = Math.min(2, 900 / vp1.width)
        const vp    = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width  = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
        if (!cancelled) setPdfDataUrl(canvas.toDataURL('image/png'))
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [template.uploadedPdfUrl, template.isPdfOverlay])

  // Auto-refresh preview whenever selected student changes
  useEffect(() => {
    if (!prevStu) { setPrevHtml(''); return }
    let html = ''
    if (template.isPdfOverlay) {
      const cnt = (template.pdfOverlays ?? []).length
      html = `<div style="padding:40px;font-family:Georgia,serif;text-align:center;color:#475569;">
        <div style="font-size:48px;margin-bottom:16px;">📄</div>
        <p style="font-weight:700;font-size:16px;color:#1e293b;margin-bottom:8px;">PDF Overlay Template</p>
        <p style="color:#64748b;font-size:13px;">${cnt} field${cnt!==1?'s':''} configured</p>
        <p style="color:#64748b;font-size:13px;margin-top:4px;">Use <em>Configure Overlay</em> to preview on PDF.</p>
      </div>`
    } else if (template.isMapped) {
      html = previewMappedTemplate(template.body, prevStu)
    } else {
      html = previewTemplate(template.body, prevStu)
    }
    setPrevHtml(html)
  }, [prevStu, template])
  const [showMapModal, setMapModal] = useState(false)
  const [showOptModal, setOptModal] = useState(false)

  const [mapping, setMapping] = useState<Record<string,string>>(() => {
    const m: Record<string,string> = {}
    detectPlaceholders(template.body).forEach(k => { if (KNOWN_KEYS.has(k)) m[k] = k })
    return m
  })

  const [genOpts, setGenOpts] = useState<GenOptions>({
    dateFormat:'MMMM DD, YYYY', locale:'English (Philippines)',
    pdfQuality:'Good, 600px', formatNumbers:false,
  })
  const [postActs, setPostActs] = useState<PostActions>({
    savePDF:true, sendEmail:false, eSignature:false, notifyWebhook:false,
  })

  const placeholders   = useMemo(() => detectPlaceholders(template.body), [template.body])
  const mappedCount    = placeholders.filter(k => mapping[k]).length
  const overlayCount   = (template.pdfOverlays ?? []).length
  const mappedSpanCount = template.isMapped
    ? (() => { const s = new Set<string>(); template.body.replace(/data-mapped="([^"]+)"/g,(_:string,k:string)=>{ s.add(k); return _ }); return s.size })()
    : 0

  function save() {
    onSaved({ ...template, name: name.trim() || template.name, type:tplType })
    setDirty(false); setSaved(true); setTimeout(()=>setSaved(false),3000)
  }

  async function createPreview() {
    if (!prevStu) return
    setGen(true)
    try {
      let html = ''
      if (template.isPdfOverlay) {
        html = `<div style="padding:40px;font-family:Georgia,serif;text-align:center;color:#475569;">
          <div style="font-size:48px;margin-bottom:16px;">📄</div>
          <p style="font-weight:700;font-size:16px;color:#1e293b;margin-bottom:8px;">PDF Overlay Template</p>
          <p style="color:#64748b;font-size:13px;">${overlayCount} field${overlayCount!==1?'s':''} configured</p>
          <p style="color:#64748b;font-size:13px;margin-top:4px;">Use <em>Configure Overlay</em> to preview on PDF.</p>
        </div>`
      } else if (template.isMapped) {
        html = previewMappedTemplate(template.body, prevStu)
      } else {
        html = previewTemplate(template.body, prevStu)
      }
      setPrevHtml(html)
    } finally { setGen(false) }
  }

  // Status badge
  const statusColor = 'bg-emerald-100 text-emerald-700'
  const statusLabel = template.isBuiltIn ? 'Built-in' : template.isPdfOverlay ? 'PDF Overlay' : template.isMapped ? 'DOCX Mapped' : 'Active'

  return (
    <div className="space-y-0">
      {/* ── Sub-nav ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <nav className="flex items-center gap-2 text-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-800">
            <LayoutTemplate className="h-3.5 w-3.5"/>Templates
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400"/>
          <div className="flex-1 min-w-0">
            <input value={name} onChange={e=>{setName(e.target.value);setDirty(true)}}
              className="bg-white border border-slate-200 text-brand-950 rounded focus:ring-brand-500 focus:border-brand-500 py-2 px-3 h-9 text-sm w-64"
              type="text" placeholder="Automation name"/>
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusColor} border-emerald-200`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
            {statusLabel}
          </span>
          {isDirty && <span className="text-xs text-slate-400">Unsaved</span>}
          {saved  && <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 className="h-3.5 w-3.5"/>Saved</span>}
          <button onClick={save} disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5"/> Save
          </button>
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">

        {/* ── Steps column (2/3) ── */}
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-0">

            {/* Step 1: Data Source */}
            <StepCard n={1} title="Data Source">
              <div className="flex items-center justify-between rounded-2xl w-full p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm w-14 h-14 flex items-center justify-center p-2">
                    <FileText className="h-8 w-8 text-brand-600"/>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Student Records</p>
                    <p className="text-xs text-slate-500 mt-0.5">Academic, personal &amp; subject data</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-2xl text-xs font-semibold">
                    <CheckCircle2 className="h-3 w-3"/>Connected
                  </div>
                </div>
              </div>
            </StepCard>

            {STEP_ARROW}

            {/* Step 2: Template */}
            <StepCard n={2} title="Template / Document Design" subtitle="Design the visual layout, text, and structure of your document" accent="border-blue-200">
              <div className="flex flex-col grow items-start justify-center p-4 gap-4">
                <div className="flex items-center w-full gap-3">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-brand-50 rounded-xl border border-brand-100">
                      {template.isPdfOverlay
                        ? <FileText className="h-6 w-6 text-violet-600"/>
                        : <FileText className="h-6 w-6 text-brand-600"/>}
                    </div>
                    <div>
                      <p className="font-bold text-brand-950 truncate max-w-[280px]" title={template.name}>{template.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <TypeBadge type={tplType}/>
                        {template.isPdfOverlay && <span className="rounded-full bg-violet-100 border border-violet-200 px-2 py-0.5 text-[9px] font-bold text-violet-700">PDF Overlay</span>}
                        {template.isMapped && !template.isPdfOverlay && <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700">DOCX Mapped</span>}
                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-2xl">
                          <CheckCircle2 className="h-2.5 w-2.5"/>Template Check
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={template.isPdfOverlay ? onConfigureOverlay : template.isMapped ? onMapFields : onEditTemplate}
                      className="border border-slate-200 rounded px-4 py-2 text-sm flex items-center gap-1.5 text-brand-950 hover:bg-slate-100 transition-colors">
                      <Edit2 className="h-3.5 w-3.5"/>
                      {template.isPdfOverlay ? 'Configure Overlay' : template.isMapped ? 'Map Fields' : 'Edit Template'}
                    </button>
                  </div>
                </div>
              </div>
            </StepCard>

          </div>
        </div>

        {/* ── Preview panel (right 1/3, sticky) ── */}
        <div className="mt-8 lg:mt-0 lg:self-start lg:sticky" style={{ top:'80px' }}>
          <div className="relative w-full">
            <div className="w-full">
              <div className="bg-white shadow-sm border border-slate-100 flex flex-col grow rounded-2xl overflow-hidden">

                {/* Preview header */}
                <div className="px-4 pt-3 pb-2 border-b border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Preview Document</p>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3"/>Live
                    </span>
                  </div>

                  {/* Student name + nav */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={goPrev} disabled={stuIdx === 0}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5"/>
                    </button>
                    <div className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-[#f8fafd] px-2.5 py-1.5">
                      {prevStu ? (
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {prevStu.firstName} {prevStu.lastName}
                          <span className="ml-1.5 text-xs text-slate-400 font-normal">— {prevStu.studentId}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">No students</p>
                      )}
                    </div>
                    <button onClick={goNext} disabled={stuIdx >= filteredStudents.length - 1}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <ChevronRight className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => { setShowSearch(v=>!v); setTimeout(()=>searchInputRef.current?.focus(),50) }}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${showSearch ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                      <Search className="h-3.5 w-3.5"/>
                    </button>
                  </div>

                  {/* Search input */}
                  {showSearch && (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                      <input
                        ref={searchInputRef}
                        value={stuSearch}
                        onChange={e => setStuSearch(e.target.value)}
                        placeholder="Search by name, ID, email…"
                        className="w-full rounded-lg border border-brand-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      {filteredStudents.length > 0 && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {stuIdx + 1} of {filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <hr className="border-slate-200"/>

                {/* Preview body */}
                <div className="flex flex-col grow items-center justify-center">
                  {template.isPdfOverlay ? (
                    pdfDataUrl ? (
                      <div className="w-full overflow-auto max-h-[540px]">
                        <img src={pdfDataUrl} alt="PDF preview" className="w-full h-auto block"/>
                      </div>
                    ) : (
                      <div className="h-[540px] flex flex-col items-center justify-center gap-3 px-6 text-center">
                        <FileText className="h-12 w-12 text-slate-200"/>
                        <div>
                          <p className="text-sm font-semibold text-slate-600">PDF Overlay Template</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {(template.pdfOverlays ?? []).length} field{(template.pdfOverlays ?? []).length !== 1 ? 's' : ''} configured.
                            {!template.uploadedPdfUrl && ' Upload a PDF in Configure Overlay to preview.'}
                          </p>
                        </div>
                      </div>
                    )
                  ) : prevHtml ? (
                    <div className="w-full overflow-auto max-h-[540px] p-3">
                      <div className="transform origin-top-left scale-[0.65] w-[154%]"
                        dangerouslySetInnerHTML={{ __html: prevHtml }}/>
                    </div>
                  ) : (
                    <div className="h-[540px] flex flex-col items-center justify-center gap-4 px-6">
                      <FileText className="h-12 w-12 text-slate-300"/>
                      <div className="text-center">
                        <p className="text-slate-600 font-medium">No preview yet.</p>
                        <p className="text-slate-400 text-sm mt-1">Select a student to preview.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Field Mapping Modal ── */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setMapModal(false)}/>
          <div className="relative z-10 w-[620px] max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Data Field Mapping</h3>
                <p className="text-sm text-slate-500 mt-0.5">Map each template placeholder to a student data field</p>
              </div>
              <button onClick={()=>setMapModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
            </div>

            {template.isPdfOverlay ? (
              <div className="px-6 py-6 text-center flex-1 flex flex-col items-center justify-center gap-3">
                <FileText className="h-10 w-10 text-violet-400"/>
                <p className="text-sm font-semibold text-slate-700">PDF Overlay fields are configured in the overlay editor.</p>
                <button onClick={()=>{setMapModal(false); onConfigureOverlay()}}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600">
                  <Edit2 className="h-4 w-4"/> Open Overlay Editor
                </button>
              </div>
            ) : template.isMapped ? (
              <div className="px-6 py-6 text-center flex-1 flex flex-col items-center justify-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500"/>
                <p className="text-sm font-semibold text-slate-700">DOCX fields are mapped visually in the mapping editor.</p>
                <p className="text-sm text-slate-500">{mappedSpanCount} field{mappedSpanCount!==1?'s':''} mapped by clicking on document text.</p>
                <button onClick={()=>{setMapModal(false); onMapFields()}}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600">
                  <Edit2 className="h-4 w-4"/> Open Map Fields Editor
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {placeholders.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-400">
                    <p>No placeholders detected in this template.</p>
                    <p className="text-sm mt-1">Edit the template to add <code className="bg-slate-100 rounded px-1">{'{{field_name}}'}</code> placeholders.</p>
                  </div>
                ) : (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-600">Template Placeholder</p>
                      <p className="text-sm font-bold text-slate-600">Student Data Field</p>
                    </div>
                    <div className="space-y-2.5">
                      {placeholders.map(ph => {
                        const autoMapped = KNOWN_KEYS.has(ph)
                        return (
                          <div key={ph} className="grid grid-cols-2 gap-4 items-center py-2 border-b border-slate-50">
                            <div className="flex items-center gap-2">
                              <code className="bg-violet-50 border border-violet-200 rounded px-2 py-1 text-[11px] font-mono text-violet-700">
                                {`{{${ph}}}`}
                              </code>
                              {autoMapped && (
                                <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold">
                                  <CheckCircle2 className="h-3 w-3"/>Auto
                                </span>
                              )}
                            </div>
                            <select value={mapping[ph]||''}
                              onChange={e=>{setMapping(p=>({...p,[ph]:e.target.value})); setDirty(true)}}
                              className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 focus:outline-none focus:border-brand-300 bg-white">
                              <option value="">— Select field —</option>
                              <optgroup label="Personal Info">
                                {PH_GROUPS[0].items.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}
                              </optgroup>
                              <optgroup label="Academic Info">
                                {PH_GROUPS[1].items.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}
                              </optgroup>
                            </select>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-sm text-slate-500 mt-4 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
                      {mappedCount} of {placeholders.length} fields mapped
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-2">
              <button onClick={()=>setMapModal(false)} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generation Options Modal ── */}
      {showOptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setOptModal(false)}/>
          <div className="relative z-10 w-[480px] rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Generation Options</h3>
              <button onClick={()=>setOptModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {[
                { label:'Date Format',   key:'dateFormat',  options:['MMMM DD, YYYY','MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'] },
                { label:'Locale',        key:'locale',      options:['English (Philippines)','English (United States)','Filipino'] },
                { label:'PDF Quality',   key:'pdfQuality',  options:['Good, 600px','High, 1200px','Standard, 300px'] },
              ].map(opt => (
                <div key={opt.key} className="flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold text-slate-700 w-36">{opt.label}</label>
                  <select value={(genOpts as unknown as Record<string,string>)[opt.key]}
                    onChange={e=>{setGenOpts(p=>({...p,[opt.key]:e.target.value})); setDirty(true)}}
                    className="flex-1 h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-700 focus:outline-none focus:border-brand-300">
                    {opt.options.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-semibold text-slate-700 w-36">Format Numbers</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={genOpts.formatNumbers}
                    onChange={e=>{setGenOpts(p=>({...p,formatNumbers:e.target.checked})); setDirty(true)}}/>
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"/>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={()=>setOptModal(false)} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600">Save Options</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Templates Tab ──────────────────────────────────────────────────────────────

type FeatureKey = 'smart' | 'showhide' | 'tables' | 'formatting'

const FEATURE_HELP: Record<FeatureKey, { title: string; color: string; icon: React.ElementType; description: string; examples: { label: string; code: string; result: string }[] }> = {
  smart: {
    title: 'Smart Fields', color: 'violet', icon: Tag,
    description: 'Insert live student data into your document by typing {{field_name}} or dragging fields from the panel. Fields are replaced with real data when the document is generated.',
    examples: [
      { label: 'Full name',      code: '{{full_name}}',     result: 'Juan Dela Cruz' },
      { label: 'Student ID',     code: '{{student_id}}',    result: '2025-00001' },
      { label: 'Program',        code: '{{program}}',       result: 'BS Computer Science' },
      { label: 'Year level',     code: '{{year_level}}',    result: '2nd Year' },
      { label: 'GWA',            code: '{{gwa}}',           result: '1.6250' },
      { label: 'Earned units',   code: '{{total_units}}',   result: '75' },
      { label: 'Today\'s date',  code: '{{date_generated}}',result: 'May 4, 2026' },
      { label: 'School name',    code: '{{school_name}}',   result: 'St. Dominic College' },
    ],
  },
  showhide: {
    title: 'Show / Hide Sections', color: 'emerald', icon: GitBranch,
    description: 'Show or hide blocks of text based on student conditions. Use {{#if condition}}...{{else}}...{{/if}} blocks to conditionally render content.',
    examples: [
      { label: 'Graduated vs active',   code: '{{#if is_graduated}}\nThis student has graduated.\n{{else}}\nCurrently enrolled.\n{{/if}}', result: 'Shows relevant line only' },
      { label: 'Honor student',         code: '{{#if is_honor_student}}\nWith Latin Honors\n{{/if}}',                result: 'Only if GWA ≤ 1.75' },
      { label: 'Male / female',         code: '{{#if is_male}}his{{else}}her{{/if}}',                               result: 'his  or  her' },
      { label: 'Has subjects',          code: '{{#if has_subjects}}\n[table here]\n{{/if}}',                        result: 'Table only if records exist' },
    ],
  },
  tables: {
    title: 'Auto Tables', color: 'teal', icon: Table,
    description: 'Create tables that automatically expand to one row per subject. Add data-loop-type to a table row and the system fills it with every matching subject record.',
    examples: [
      { label: 'All subjects',       code: 'data-loop-type="subjects"',           result: 'All subject rows' },
      { label: 'Completed only',     code: 'data-loop-type="completed_subjects"', result: 'Passed subjects only' },
      { label: 'Current semester',   code: 'data-loop-type="current_subjects"',   result: 'Ongoing subjects' },
      { label: 'Inside loop row',    code: '{{subject_code}} — {{subject_name}}', result: 'CS 101 — Intro to Computing' },
      { label: 'Grade in row',       code: '{{grade}} ({{grade_letter}})',         result: '1.25 (Excellent)' },
    ],
  },
  formatting: {
    title: 'Formatting Filters', color: 'blue', icon: Sliders,
    description: 'Apply transformations to any field value using the pipe | syntax: {{field | filter}} or {{field | filter: "argument"}}.',
    examples: [
      { label: 'All caps',       code: '{{full_name | uppercase}}',             result: 'JUAN DELA CRUZ' },
      { label: 'Title case',     code: '{{program | title}}',                   result: 'Bs Computer Science' },
      { label: 'Lowercase',      code: '{{status | lowercase}}',                result: 'active' },
      { label: 'Date format',    code: '{{date_generated | format: "MMMM DD, YYYY"}}', result: 'May 04, 2026' },
      { label: 'Decimal places', code: '{{gwa | number: "2"}}',                 result: '1.63' },
      { label: 'Fallback value', code: '{{nickname | or: "Student"}}',          result: 'Student  (if blank)' },
    ],
  },
}

function FeatureHelpModal({ featureKey, onClose }: { featureKey: FeatureKey; onClose: () => void }) {
  const f = FEATURE_HELP[featureKey]
  const Icon = f.icon
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 bg-${f.color}-50 border-b border-${f.color}-100`}>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${f.color}-100 shrink-0`}>
            <Icon className={`h-4 w-4 text-${f.color}-600`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold text-${f.color}-900`}>{f.title}</p>
            <p className={`text-xs text-${f.color}-600 mt-0.5`}>{f.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0"><X className="h-4 w-4" /></button>
        </div>

        {/* Examples */}
        <div className="overflow-y-auto p-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Examples</p>
          {f.examples.map((ex) => (
            <div key={ex.label} className="rounded-xl border border-[#e4ebf5] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-[#e4ebf5]">
                <p className="text-[11px] font-semibold text-slate-500">{ex.label}</p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#e4ebf5]">
                <div className="px-3 py-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Template</p>
                  <code className="text-xs text-brand-700 font-mono break-all whitespace-pre-wrap">{ex.code}</code>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Output</p>
                  <p className="text-xs text-emerald-700 font-semibold break-all">{ex.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#e4ebf5] px-5 py-3 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white hover:bg-brand-600">Got it</button>
        </div>
      </div>
    </div>
  )
}

function TemplatesTab({ onEdit, onMap, onPdfOverlay, onGenerate }: {
  onEdit:(t:DocTemplate)=>void; onMap:(t:DocTemplate)=>void
  onPdfOverlay:(t:DocTemplate)=>void; onGenerate:(t:DocTemplate)=>void
}) {
  const [list, refresh] = useState(() => allTemplates())
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [converting, setConverting] = useState(false)
  const [featureHelp, setFeatureHelp] = useState<FeatureKey|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  function reload() { refresh([...allTemplates()]) }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g,' ')
    const now  = new Date().toISOString().slice(0,10)
    const ext  = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'pdf') {
      // PDF → open in PDF Overlay Editor (visual field placement)
      const pdfUrl = URL.createObjectURL(file)
      const tpl: DocTemplate = {
        id:`tpl_${Date.now()}`, name, type:'CUSTOM', isBuiltIn:false, isDefault:false,
        description:`PDF Overlay: ${file.name}. Place text/table fields visually, then generate with real student data.`,
        createdAt:now, updatedAt:now, currentVersion:'1.0', versions:[],
        isUploaded:true, uploadedPdfUrl:pdfUrl, isPdfOverlay:true,
        pdfOverlays:[], body:'',
      }
      CUSTOM_TEMPLATES.push(tpl); reload(); onPdfOverlay(tpl)
    } else {
      // For DOCX/DOC: convert to HTML via mammoth → open in Mapping Mode (click to map fields)
      setConverting(true)
      try {
        const arrayBuffer = await file.arrayBuffer()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mammoth = await import('mammoth') as any
        const result  = await mammoth.convertToHtml(
          { arrayBuffer },
          { styleMap: ['p[style-name=\'Title\'] => h1:fresh', 'p[style-name=\'Heading 1\'] => h2:fresh'] }
        )
        const convertedHtml = result.value as string
        const tpl: DocTemplate = {
          id:`tpl_${Date.now()}`, name, type:'CUSTOM', isBuiltIn:false, isDefault:false,
          description:`Mapped template from ${file.name}. Select text to map fields, click table rows to configure auto-fill.`,
          createdAt:now, updatedAt:now, currentVersion:'1.0', versions:[],
          isUploaded:true, isMapped:true,
          body: convertedHtml || `<p>Could not extract content from ${file.name}.</p>`,
        }
        CUSTOM_TEMPLATES.push(tpl); reload(); onMap(tpl)
      } catch {
        alert('Could not convert the file. Please ensure it is a valid DOCX file.')
      } finally {
        setConverting(false)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function createBlank() {
    const now = new Date().toISOString().slice(0,10)
    const tpl: DocTemplate = {
      id:`tpl_${Date.now()}`, name:'New Template', type:'CUSTOM', isBuiltIn:false, isDefault:false,
      description:'Custom document template.', createdAt:now, updatedAt:now, currentVersion:'1.0', versions:[],
      body:`<div style="font-family:'Times New Roman',serif;max-width:680px;margin:0 auto;padding:40px 50px;line-height:1.7;color:#111;">
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
    const now = new Date().toISOString().slice(0,10)
    CUSTOM_TEMPLATES.push({ ...tpl, id:`tpl_${Date.now()}`, name:`${tpl.name} (Copy)`, isBuiltIn:false, isDefault:false, createdAt:now, updatedAt:now, currentVersion:'1.0', versions:[] })
    reload()
  }
  function remove(id: string) { const i = CUSTOM_TEMPLATES.findIndex((t) => t.id === id); if (i!==-1) CUSTOM_TEMPLATES.splice(i,1); setDeleteId(null); reload() }
  function setDefault(tpl: DocTemplate) { allTemplates().forEach((t) => { if (t.type===tpl.type) t.isDefault=false }); tpl.isDefault=true; reload() }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => !converting && fileRef.current?.click()} disabled={converting}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-wait">
          <Upload className="h-4 w-4" />
          {converting ? 'Converting…' : 'Upload Template'}
          {!converting && <span className="text-[10px] font-normal opacity-75">PDF → overlay · DOCX → map</span>}
        </button>
        <input ref={fileRef} type="file" accept=".docx,.pdf,.doc" className="hidden" onChange={upload} />
        <button onClick={createBlank}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
          <Plus className="h-4 w-4" /> Create from Scratch
        </button>
      </div>


      {/* Feature help modal */}
      {featureHelp && <FeatureHelpModal featureKey={featureHelp} onClose={() => setFeatureHelp(null)} />}

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((tpl) => (
          <div key={tpl.id} className="relative flex flex-col rounded-2xl border border-[#e4ebf5] bg-white hover:border-brand-200 hover:shadow-sm transition-all overflow-hidden">
            <div className={`h-1 w-full ${tpl.type==='TRANSCRIPT'?'bg-blue-500':tpl.type==='ENROLLMENT_CERT'?'bg-emerald-500':tpl.type==='GOOD_MORAL'?'bg-violet-500':'bg-slate-400'}`} />
            <div className="flex flex-col gap-3 p-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <FileText className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {tpl.isDefault && <span title="Default"><Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /></span>}
                  <TypeBadge type={tpl.type} />
                  {tpl.isPdfOverlay && <span className="rounded-full bg-violet-100 border border-violet-300 px-2 py-0.5 text-[9px] font-bold text-violet-800">PDF Overlay</span>}
                  {tpl.isMapped && !tpl.isPdfOverlay && <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[9px] font-bold text-amber-800">Mapped</span>}
                  {tpl.isBuiltIn && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">Built-in</span>}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 leading-snug">{tpl.name}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{tpl.description}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>v{tpl.currentVersion}</span>
                  {tpl.versions.length > 0 && <span>· {tpl.versions.length} revision{tpl.versions.length>1?'s':''}</span>}
                  <span>· {tpl.updatedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-3 border-t border-[#f0f4fa] flex-wrap">
                <button
                  onClick={() => tpl.isPdfOverlay ? onPdfOverlay(tpl) : tpl.isMapped ? onMap(tpl) : onEdit(tpl)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                  {tpl.isPdfOverlay ? 'Edit Overlay' : tpl.isMapped ? 'Map Fields' : 'Edit'}
                </button>
                <button onClick={() => onGenerate(tpl)} className="flex items-center gap-1.5 rounded-lg border border-[#e4ebf5] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <Zap className="h-3.5 w-3.5" /> Use
                </button>
                <button onClick={() => dup(tpl)} title="Duplicate" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4ebf5] text-slate-400 hover:bg-slate-50 transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                {!tpl.isDefault && <button onClick={() => setDefault(tpl)} title="Set as default" className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4ebf5] text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"><Star className="h-3.5 w-3.5" /></button>}
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

function GenerateTab({ initialTemplate }: { initialTemplate: DocTemplate|null }) {
  const [step,  setStep]  = useState<1|2|3>(initialTemplate ? 2 : 1)
  const [tpl,   setTpl]   = useState<DocTemplate|null>(initialTemplate)
  const [query, setQuery] = useState('')
  const [stu,   setStu]   = useState<Student|null>(null)
  const [purp,  setPurp]  = useState('')
  const [html,  setHtml]  = useState('')
  const [pdfUrl, setPdfUrl] = useState<string|null>(null)
  const [genWarnings, setGenWarnings] = useState<ValidationError[]>([])
  const [genLoading, setGenLoading] = useState(false)
  const [genPdfImgs, setGenPdfImgs] = useState<string[]>([])

  useEffect(() => { if (initialTemplate) { setTpl(initialTemplate); setStep(2) } }, [initialTemplate])

  const students = MOCK_STUDENTS.filter((s) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentId.includes(q) || s.email.toLowerCase().includes(q)
  })

  async function generate() {
    if (!tpl || !stu) return
    setGenLoading(true)
    try {
      if (tpl.isPdfOverlay) {
        // PDF overlay generation via pdf-lib
        if (!tpl.uploadedPdfUrl) { alert('No PDF attached to this template.'); return }
        const url = await generatePdfWithOverlays(tpl.uploadedPdfUrl, tpl.pdfOverlays ?? [], stu, CUSTOM_FONT_STORE)
        setPdfUrl(url); setHtml(''); setGenPdfImgs([])
        // Render all pages to canvas images (no browser PDF viewer chrome)
        try {
          const pdfjs = await import('pdfjs-dist') as any
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
          const resp  = await fetch(url)
          const bytes = await resp.arrayBuffer()
          const pdf   = await pdfjs.getDocument({ data: bytes }).promise
          const imgs: string[] = []
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p)
            const vp1  = page.getViewport({ scale: 1 })
            const scale = Math.min(2, 1600 / vp1.width)
            const vp   = page.getViewport({ scale })
            const canvas = document.createElement('canvas')
            canvas.width = vp.width; canvas.height = vp.height
            await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
            imgs.push(canvas.toDataURL('image/png'))
          }
          setGenPdfImgs(imgs)
        } catch { /* fall back to showing download only */ }
      } else {
        const warnings = tpl.isMapped ? [] : validateTemplate(tpl.body)
        setGenWarnings(warnings)
        setHtml(tpl.isMapped ? processMappedTemplate(tpl.body, stu) : processTemplate(tpl.body, stu))
        setPdfUrl(null)
      }
      DOC_HISTORY.unshift({ id:`doc_${_seq++}`, templateId:tpl.id, templateName:tpl.name, studentDisplayId:stu.studentId, studentName:`${stu.firstName} ${stu.lastName}`, generatedAt:new Date().toISOString(), purpose:purp.trim()||'General purpose' })
      setStep(3)
    } finally { setGenLoading(false) }
  }

  function reset() { setStep(1); setTpl(null); setStu(null); setPurp(''); setHtml(''); setPdfUrl(null); setQuery(''); setGenWarnings([]); setGenPdfImgs([]) }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {([1,2,3] as const).map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${step>=n ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {step>n ? <CheckCircle2 className="h-4 w-4" /> : n}
            </div>
            <span className={`text-xs font-semibold ${step>=n ? 'text-slate-700' : 'text-slate-400'}`}>{['Select Template','Choose Student','Preview & Print'][i]}</span>
            {n<3 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
          </div>
        ))}
      </div>

      {step===1 && (
        <Card>
          <h3 className="text-sm font-bold text-slate-700 mb-4">Choose a Template</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allTemplates().map((t) => (
              <button key={t.id} onClick={() => { setTpl(t); setStep(2) }}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${tpl?.id===t.id ? 'border-brand-500 bg-brand-50' : 'border-[#e4ebf5] hover:border-brand-300 hover:bg-brand-50'}`}>
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

      {step===2 && tpl && (
        <div className="space-y-3">
          {/* ── Selected student + Generate bar — always at top ── */}
          {stu ? (
            <div className="rounded-xl border border-brand-300 bg-brand-50 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-100 bg-brand-500">
                <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{stu.firstName} {stu.lastName}</p>
                  <p className="text-xs text-brand-200 font-mono">{stu.studentId} · {YEAR_LABELS[stu.yearLevel] ?? `Yr ${stu.yearLevel}`}</p>
                </div>
                <button onClick={() => setStu(null)} className="text-brand-200 hover:text-white transition-colors shrink-0" title="Change student">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-4 py-3 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                  <div><span className="text-brand-500 font-semibold">Email: </span><span className="text-slate-700">{stu.email}</span></div>
                  <div><span className="text-brand-500 font-semibold">Gender: </span><span className="text-slate-700">{stu.gender ?? 'N/A'}</span></div>
                  <div><span className="text-brand-500 font-semibold">Birthday: </span><span className="text-slate-700">{stu.dateOfBirth ? new Date(stu.dateOfBirth).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : 'N/A'}</span></div>
                  <div><span className="text-brand-500 font-semibold">Status: </span><span className="text-slate-700">{stu.status}</span></div>
                  <div><span className="text-brand-500 font-semibold">Program: </span><span className="text-slate-700">{stu.program?.name ?? stu.programId ?? 'N/A'}</span></div>
                  <div><span className="text-brand-500 font-semibold">Address: </span><span className="text-slate-700">{stu.address ?? 'N/A'}</span></div>
                  {tpl.type === 'TRANSCRIPT' && (
                    <>
                      <div><span className="text-brand-500 font-semibold">Subjects: </span><span className="text-slate-700 font-bold">{getStudentRecords(stu.id).length}</span></div>
                      <div><span className="text-brand-500 font-semibold">GWA: </span><span className="text-slate-700 font-bold">{calcGWA(stu.id)}</span></div>
                      <div><span className="text-brand-500 font-semibold">Earned Units: </span><span className="text-slate-700 font-bold">{totalUnits(stu.id)}</span></div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-brand-100">
                  <div className="flex-1 min-w-[180px]">
                    <Input value={purp} onChange={(e) => setPurp(e.target.value)} placeholder="Purpose (optional) — e.g. Scholarship application" />
                  </div>
                  <Button onClick={generate} icon={genLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} size="lg">
                    {genLoading ? 'Generating…' : (tpl?.isPdfOverlay ? 'Generate PDF' : 'Generate Document')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#e4ebf5] bg-slate-50 px-4 py-3 flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
              <p className="text-sm text-slate-500">Click a student row below to select them, then click <strong>Generate Document</strong>.</p>
            </div>
          )}

          {/* ── Student search + table ── */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">Select Student — <span className="text-brand-600">{tpl.name}</span></h3>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600"><ChevronLeft className="h-3.5 w-3.5" /> Back</button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, student ID, or email…"
                className="w-full rounded-xl border border-[#dce8f7] bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400" />
            </div>
            <div className="rounded-xl border border-[#e4ebf5] overflow-hidden" style={{ maxHeight: 360, overflowY: 'auto' }}>
              {students.length===0
                ? <div className="flex flex-col items-center py-8 gap-2"><AlertCircle className="h-7 w-7 text-slate-300" /><p className="text-sm text-slate-400">No students found.</p></div>
                : <table className="w-full">
                    <thead className="sticky top-0 z-10"><tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                      {['Student ID','Name','Program','Year',''].map((h) => <th key={h} className="py-2.5 px-3 first:pl-4 last:pr-4 text-left text-[11px] font-bold uppercase tracking-wider text-brand-700">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-[#f0f4fa]">
                      {students.map((s) => {
                        const isSelected = stu?.id === s.id
                        return (
                          <tr key={s.id} onClick={() => setStu(isSelected ? null : s)}
                            className={`cursor-pointer transition-colors select-none ${isSelected ? 'bg-brand-50' : 'hover:bg-[#f8fafd]'}`}>
                            <td className="py-2.5 pl-4 pr-3 text-xs font-mono text-slate-600">{s.studentId}</td>
                            <td className="py-2.5 px-3 text-sm font-semibold text-slate-800">{s.firstName} {s.lastName}</td>
                            <td className="py-2.5 px-3 text-xs text-slate-500">{s.program?.name ?? s.programId ?? '—'}</td>
                            <td className="py-2.5 px-3 text-xs text-slate-600">{YEAR_LABELS[s.yearLevel] ?? `Yr ${s.yearLevel}`}</td>
                            <td className="py-2.5 pl-3 pr-4 text-right w-10">
                              {isSelected
                                ? <CheckCircle2 className="h-4 w-4 text-brand-500 inline" />
                                : <span className="h-4 w-4 rounded-full border-2 border-slate-200 inline-block align-middle" />
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
              }
            </div>
          </Card>
        </div>
      )}

      {step===3 && tpl && stu && (
        <div className="space-y-4">
          {genWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                <TriangleAlert className="h-3.5 w-3.5" /> {genWarnings.length} validation {genWarnings.length===1?'warning':'warnings'} — document generated but may have gaps
              </p>
              {genWarnings.map((w,i) => (
                <p key={i} className="text-[11px] text-amber-700 flex items-start gap-2">
                  <code className="shrink-0 bg-amber-100 rounded px-1 font-mono">{w.token}</code>
                  <span>{w.message}</span>
                </p>
              ))}
            </div>
          )}
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">{tpl.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stu.firstName} {stu.lastName} · {stu.studentId}</p>
                {tpl.isPdfOverlay && <span className="inline-flex items-center gap-1 text-[10px] text-violet-600 font-semibold mt-1"><FileText className="h-3 w-3"/>PDF Overlay document</span>}
              </div>
              <div className="flex gap-2">
                {pdfUrl ? (
                  <a href={pdfUrl} download={`${tpl.name} - ${stu.firstName} ${stu.lastName}.pdf`}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600">
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                ) : (
                  <button onClick={() => printDoc(html, tpl.name)} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600">
                    <Printer className="h-4 w-4" /> Print / Save PDF
                  </button>
                )}
                <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Plus className="h-3.5 w-3.5" /> New
                </button>
              </div>
            </div>
          </Card>
          {pdfUrl ? (
            <div className="rounded-2xl border border-[#e4ebf5] overflow-hidden bg-[#23272f]">
              <div className="bg-[#1e2738] border-b border-[#2d3a50] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">Generated PDF — {stu.firstName} {stu.lastName}</span>
                  {genPdfImgs.length > 0 && <span className="text-[10px] text-slate-500">{genPdfImgs.length} page{genPdfImgs.length !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="overflow-y-auto p-6 flex flex-col items-center gap-4" style={{ maxHeight: '75vh' }}>
                {genPdfImgs.length > 0 ? (
                  genPdfImgs.map((src, i) => (
                    <img key={i} src={src} alt={`Page ${i+1}`}
                      className="w-full max-w-2xl rounded-lg shadow-2xl border border-[#3a4460]"
                      style={{ display: 'block' }}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                    <FileText className="h-10 w-10 opacity-40" />
                    <p className="text-sm font-semibold">Rendering PDF…</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e4ebf5] bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f0f4fa] border-b border-[#dce8f7] px-4 py-2.5 flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">Generated Document</span>
              </div>
              <div className="p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── History Tab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const [records] = useState<DocRecord[]>(() => [...DOC_HISTORY])
  if (!records.length) return (
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
                {new Date(r.generatedAt).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}
                {' '}{new Date(r.generatedAt).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type TabId = 'templates'|'generate'|'history'

export default function DocumentsPage() {
  const [tab,          setTab]         = useState<TabId>('templates')
  const [jump,         setJump]        = useState<DocTemplate|null>(null)
  const [edit,         setEdit]        = useState<DocTemplate|null>(null)
  const [mapping,      setMapping]     = useState<DocTemplate|null>(null)
  const [pdfOverlay,   setPdfOverlay]  = useState<DocTemplate|null>(null)
  const [autoTemplate, setAutoTemplate] = useState<DocTemplate|null>(null)

  function persistTemplate(updated: DocTemplate) {
    const bi = BUILT_IN_TEMPLATES.findIndex((t) => t.id === updated.id)
    if (bi!==-1) BUILT_IN_TEMPLATES[bi] = updated
    else { const ci = CUSTOM_TEMPLATES.findIndex((t) => t.id === updated.id); if (ci!==-1) CUSTOM_TEMPLATES[ci] = updated }
  }

  function savedFromAuto(updated: DocTemplate) {
    persistTemplate(updated)
    if (autoTemplate?.id === updated.id) setAutoTemplate(updated)
  }

  function savedTemplate(updated: DocTemplate) {
    persistTemplate(updated)
    if (updated.isPdfOverlay) setPdfOverlay(updated)
    else if (updated.isMapped) setMapping(updated)
    else setEdit(updated)
  }

  // Specialist editors (open from within AutomationEditor)
  if (edit)       return <TemplateEditor   template={edit}       onBack={()=>setEdit(null)}       onSaved={savedTemplate} />
  if (mapping)    return <MappingEditor    template={mapping}    onBack={()=>setMapping(null)}     onSaved={savedTemplate} />
  if (pdfOverlay) return <PdfOverlayEditor template={pdfOverlay} onBack={()=>setPdfOverlay(null)} onSaved={savedTemplate} />

  // Automation config page (DocsAutomator-style — primary editing experience)
  if (autoTemplate) return (
    <div className="space-y-5 pb-12">
      <AutomationEditor
        template={autoTemplate}
        onBack={()=>setAutoTemplate(null)}
        onSaved={savedFromAuto}
        onEditTemplate={()=>{ setEdit(autoTemplate); setAutoTemplate(null) }}
        onMapFields={()=>{ setMapping(autoTemplate); setAutoTemplate(null) }}
        onConfigureOverlay={()=>{ setPdfOverlay(autoTemplate); setAutoTemplate(null) }}
      />
    </div>
  )

  return (
    <div className="space-y-5">
      <SectionTitle description="PDF Overlay Editor · DOCX Field Mapping · Smart Builder · Dynamic TOR Tables · Instant Preview">
        Document Automation System
      </SectionTitle>
      <div className="flex items-center gap-1 rounded-xl border border-[#e4ebf5] bg-white p-1 w-fit">
        {([
          {id:'templates', label:'Automations',  icon:LayoutTemplate},
          {id:'generate',  label:'Generate',      icon:Zap},
          {id:'history',   label:'History',       icon:History},
        ] as {id:TabId; label:string; icon:React.ElementType}[]).map(({id, label, icon:Icon}) => (
          <button key={id} onClick={() => { if (id!=='generate') setJump(null); setTab(id) }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${tab===id ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>
      {tab==='templates' && <TemplatesTab
        onEdit={(t)=>setAutoTemplate(t)}
        onMap={(t)=>setAutoTemplate(t)}
        onPdfOverlay={(t)=>setAutoTemplate(t)}
        onGenerate={(t)=>{setJump(t);setTab('generate')}} />}
      {tab==='generate'  && <GenerateTab initialTemplate={jump} />}
      {tab==='history'   && <HistoryTab />}
    </div>
  )
}
