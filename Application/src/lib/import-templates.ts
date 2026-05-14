// ── Student multi-sheet Excel template ───────────────────────────────────────

export const STUDENT_SHEETS: Record<string, string[]> = {
  'Personal Info': [
    'First Name *',
    'Last Name *',
    'Middle Name',
    'Suffix',
    'Email *',
    'Phone',
    'Date of Birth (YYYY-MM-DD)',
    'Place of Birth',
    'Gender (Male / Female / Other)',
    'Civil Status (Single / Married / Widowed / Separated)',
    'Nationality',
    'Religion',
    'Blood Type (A+ / A- / B+ / B- / AB+ / AB- / O+ / O-)',
    'Home Address',
    'Program',
    'Year Level (1 / 2 / 3 / 4 / 5)',
    'Status (ACTIVE / INACTIVE / DROPPED / GRADUATED)',
  ],
  'Family Background': [
    'Student Email *',
    'Relation (Father / Mother / Guardian / Sibling / Spouse / Other) *',
    'Full Name *',
    'Occupation',
    'Phone Number',
    'Email Address',
    'Monthly Income (e.g. Below ₱10,000)',
    'Living With (Both Parents / Father Only / Mother Only / Guardian / Alone / Other)',
  ],
  'Academic Records': [
    'Student Email *',
    'Subject Code *',
    'Subject Name',
    'School Year (e.g. 2024-2025)',
    'Semester (1st / 2nd / Summer)',
    'Year Level',
    'Units',
    'Final Grade (Numeric, e.g. 1.25)',
    'Remarks (PASSED / FAILED / INC / DROPPED)',
  ],
  'Educational History': [
    'Student Email *',
    'School Name *',
    'Level (ELEMENTARY / JUNIOR_HIGH / SENIOR_HIGH / COLLEGE / VOCATIONAL)',
    'Years Attended (e.g. 2019-2023)',
    'Honors / Awards',
  ],
}

// ── Download multi-sheet Excel for student import ─────────────────────────────

export async function downloadStudentExcel() {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  Object.entries(STUDENT_SHEETS).forEach(([sheetName, headers]) => {
    const ws = XLSX.utils.aoa_to_sheet([headers])
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 20) }))
    ws['!rows'] = [{ hpt: 22 }]
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  XLSX.writeFile(wb, 'schooleco_student_import_template.xlsx')
}

// ── Parse uploaded student Excel file ────────────────────────────────────────

export interface StudentExcelResult {
  personalInfo: Record<string, string>[]
  familyBackground: Record<string, string>[]
  academicRecords: Record<string, string>[]
  educationalHistory: Record<string, string>[]
  totalRows: number
  validRows: number
  errorRows: number
  rowErrors: { rowIndex: number; errors: string[] }[]
}

export async function parseStudentExcel(file: File): Promise<StudentExcelResult> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  function sheetToRows(sheetName: string): Record<string, string>[] {
    const ws = wb.Sheets[sheetName]
    if (!ws) return []
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    return raw.map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v ?? '').trim()]))
    )
  }

  const personalInfo       = sheetToRows('Personal Info')
  const familyBackground   = sheetToRows('Family Background')
  const academicRecords    = sheetToRows('Academic Records')
  const educationalHistory = sheetToRows('Educational History')

  const REQUIRED_PI = ['First Name *', 'Last Name *', 'Email *']
  const rowErrors: { rowIndex: number; errors: string[] }[] = []

  personalInfo.forEach((row, i) => {
    const errors: string[] = []
    REQUIRED_PI.forEach((col) => {
      if (!row[col]?.trim()) errors.push(`"${col.replace(' *', '')}" is required`)
    })
    if (errors.length) rowErrors.push({ rowIndex: i + 2, errors })
  })

  const validRows = personalInfo.length - rowErrors.length

  return {
    personalInfo,
    familyBackground,
    academicRecords,
    educationalHistory,
    totalRows: personalInfo.length,
    validRows,
    errorRows: rowErrors.length,
    rowErrors,
  }
}

// ── Asset Mass Registration Excel Template ────────────────────────────────────

export const ASSET_COLUMNS = [
  { key: 'asset_name',      label: 'Asset Name',           required: true,  example: 'Dell Inspiron 15',         hint: 'Full name or description of the asset' },
  { key: 'category',        label: 'Category',             required: true,  example: 'LAPTOP',                   hint: 'LAPTOP / DESKTOP / MONITOR / PRINTER / PROJECTOR / ROUTER / TABLET / SERVER / LAB_EQUIPMENT / OTHER' },
  { key: 'brand',           label: 'Brand',                required: false, example: 'Dell',                     hint: 'Manufacturer brand (e.g. Dell, HP, Lenovo)' },
  { key: 'model',           label: 'Model',                required: false, example: 'Inspiron 15 3520',         hint: 'Model name or number' },
  { key: 'serial_number',   label: 'Serial Number',        required: false, example: 'SN-20250001',              hint: 'Unique serial number from the manufacturer' },
  { key: 'department',      label: 'Department / Office',  required: true,  example: 'College of Computing',     hint: 'Department or office that owns this asset' },
  { key: 'custodian',       label: 'Custodian',            required: false, example: 'Juan Dela Cruz',           hint: 'Person or office responsible for this asset' },
  { key: 'purchase_date',   label: 'Purchase Date',        required: false, example: '2025-01-15',               hint: 'Format: YYYY-MM-DD' },
  { key: 'supplier',        label: 'Supplier / Vendor',    required: false, example: 'TechSupply Philippines',   hint: 'Vendor or supplier name' },
  { key: 'purchase_cost',   label: 'Purchase Cost (PHP)',  required: false, example: '45000',                    hint: 'Amount in Philippine Peso (numbers only)' },
  { key: 'warranty_expiry', label: 'Warranty Expiry',      required: false, example: '2028-01-15',               hint: 'Format: YYYY-MM-DD' },
  { key: 'building',        label: 'Building',             required: false, example: 'Main Building',            hint: 'Building where the asset is located' },
  { key: 'room',            label: 'Room',                 required: false, example: 'Room 201',                 hint: 'Room or office location' },
]

export async function downloadAssetExcel() {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  // ── Sheet 1: Assets (data entry) ─────────────────────────────────────────
  // Row 1 = column headers (friendly names, required marked with *)
  // Row 2 = one clearly-labeled sample row
  // Rows 3+ = empty (user fills here)
  const headers = ASSET_COLUMNS.map((c) => c.required ? `${c.label} *` : c.label)
  const sample  = ASSET_COLUMNS.map((c) => c.example)

  const ws = XLSX.utils.aoa_to_sheet([headers, sample, [], [], [], [], [], [], [], []])

  // Column widths — generous so nothing is cut off
  ws['!cols'] = ASSET_COLUMNS.map((c) => ({ wch: Math.max(c.label.length + 6, 24) }))

  // Freeze the header row so it stays visible while scrolling
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(wb, ws, 'Assets')

  // ── Sheet 2: Instructions ─────────────────────────────────────────────────
  const instructions = XLSX.utils.aoa_to_sheet([
    ['SchoolEco — Asset Import Instructions'],
    [''],
    ['HOW TO USE THIS TEMPLATE'],
    ['1. Go to the "Assets" sheet (tab at the bottom).'],
    ['2. Row 1 contains the column headers — do not edit or delete them.'],
    ['3. Row 2 is a sample row showing what to enter — you may delete it before uploading.'],
    ['4. Fill in your assets starting from Row 3 (or Row 2 if you deleted the sample).'],
    ['5. Columns marked with * are required. Leave optional columns blank if not needed.'],
    ['6. Save the file as .xlsx and upload it in SchoolEco.'],
    [''],
    ['COLUMN GUIDE'],
    ['Column',                'Required?', 'What to enter'],
    ...ASSET_COLUMNS.map((c) => [
      c.required ? `${c.label} *` : c.label,
      c.required ? 'Required' : 'Optional',
      c.hint,
    ]),
    [''],
    ['VALID CATEGORY VALUES'],
    ['Use exactly one of these values in the Category column:'],
    ['LAPTOP', 'DESKTOP', 'MONITOR', 'PRINTER', 'PROJECTOR', 'ROUTER', 'TABLET', 'SERVER', 'LAB_EQUIPMENT', 'OTHER'],
  ])
  instructions['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 55 }]
  XLSX.utils.book_append_sheet(wb, instructions, 'Instructions')

  XLSX.writeFile(wb, 'SchoolEco_Asset_Template.xlsx')
}

export interface AssetImportResult {
  rows: Record<string, string>[]
  totalRows: number
  validRows: number
  errorRows: number
  rowErrors: { rowIndex: number; errors: string[] }[]
}

export async function parseAssetExcel(file: File): Promise<AssetImportResult> {
  const XLSX  = await import('xlsx')
  const buf   = await file.arrayBuffer()
  const wb    = XLSX.read(buf, { type: 'array' })
  const ws    = wb.Sheets['Assets']
  if (!ws) throw new Error('Sheet "Assets" not found. Please use the provided template.')

  // Row 1 = headers, row 2 = sample row — read from row 1 headers, skip rows where all fields match sample
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  // Normalise keys: strip " *" suffix, lowercase, underscores
  const rows = raw.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        k.replace(' *', '').trim()
         .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        String(v ?? '').trim(),
      ])
    )
  ).filter((r) => {
    if (!Object.values(r).some((v) => v !== '')) return false  // skip blank rows
    // Skip sample row (contains the example values)
    const name = r['asset_name'] || r['asset name'] || ''
    if (name === 'Dell Inspiron 15') return false
    return true
  })

  const REQUIRED = ['asset_name', 'category', 'department__office']
  const rowErrors: { rowIndex: number; errors: string[] }[] = []

  rows.forEach((row, i) => {
    const errors: string[] = []
    // Check against both normalised and original key variants
    if (!row['asset_name'] && !row['asset name']) errors.push('"Asset Name" is required')
    if (!row['category'])                         errors.push('"Category" is required')
    if (!row['department__office'] && !row['department'] && !row['department_office']) errors.push('"Department / Office" is required')
    if (errors.length) rowErrors.push({ rowIndex: i + 3, errors })
  })

  void REQUIRED

  const validRows = rows.length - rowErrors.length
  return { rows, totalRows: rows.length, validRows, errorRows: rowErrors.length, rowErrors }
}

// ── Legacy CSV templates (employees, assets, consumables, subjects) ───────────

export interface TemplateColumn {
  key: string
  label: string
  required: boolean
  hint: string
}

export interface ImportTemplate {
  id: string
  name: string
  description: string
  columns: TemplateColumn[]
}

export const IMPORT_TEMPLATES: Record<string, ImportTemplate> = {
  employees: {
    id: 'employees',
    name: 'Employee Records',
    description: 'Import employee records into the HR module.',
    columns: [
      { key: 'first_name',       label: 'First Name',       required: true,  hint: 'Employee first name' },
      { key: 'last_name',        label: 'Last Name',        required: true,  hint: 'Employee last name (surname)' },
      { key: 'middle_name',      label: 'Middle Name',      required: false, hint: 'Optional' },
      { key: 'email',            label: 'Email',            required: true,  hint: 'Institutional email address' },
      { key: 'phone',            label: 'Phone',            required: false, hint: '11-digit PH mobile number' },
      { key: 'position',         label: 'Position',         required: true,  hint: 'Job title / designation' },
      { key: 'department',       label: 'Department',       required: true,  hint: 'Department or office name' },
      { key: 'employment_type',  label: 'Employment Type',  required: true,  hint: 'FULL_TIME / PART_TIME / CONTRACT / PROBATIONARY / CASUAL' },
      { key: 'work_setup',       label: 'Work Setup',       required: true,  hint: 'ON_SITE / HYBRID / REMOTE' },
      { key: 'start_date',       label: 'Start Date',       required: true,  hint: 'Format: YYYY-MM-DD' },
      { key: 'salary',           label: 'Monthly Salary',   required: false, hint: 'Numeric value in PHP (e.g. 35000)' },
      { key: 'birthday',         label: 'Birthday',         required: false, hint: 'Format: YYYY-MM-DD' },
      { key: 'gender',           label: 'Gender',           required: false, hint: 'Male / Female / Other' },
      { key: 'sss_no',           label: 'SSS Number',       required: false, hint: 'SSS ID number' },
      { key: 'philhealth_no',    label: 'PhilHealth No.',   required: false, hint: 'PhilHealth number' },
    ],
  },

  assets: {
    id: 'assets',
    name: 'Fixed Assets',
    description: 'Import fixed assets into the Asset Management module.',
    columns: [
      { key: 'asset_name',      label: 'Asset Name',      required: true,  hint: 'Full name/description of the asset' },
      { key: 'category',        label: 'Category',        required: true,  hint: 'LAPTOP / DESKTOP / MONITOR / PRINTER / PROJECTOR / ROUTER / LAB_EQUIPMENT / TABLET / SERVER / OTHER_FIXED' },
      { key: 'brand',           label: 'Brand',           required: false, hint: 'Manufacturer brand' },
      { key: 'model',           label: 'Model',           required: false, hint: 'Model name or number' },
      { key: 'serial_number',   label: 'Serial Number',   required: false, hint: 'Unique serial number from manufacturer' },
      { key: 'department',      label: 'Department',      required: true,  hint: 'Department/office the asset belongs to' },
      { key: 'custodian_name',  label: 'Custodian',       required: false, hint: 'Person or office responsible for the asset' },
      { key: 'custodian_type',  label: 'Custodian Type',  required: false, hint: 'INDIVIDUAL or DEPARTMENT' },
      { key: 'purchase_date',   label: 'Purchase Date',   required: false, hint: 'Format: YYYY-MM-DD' },
      { key: 'supplier',        label: 'Supplier',        required: false, hint: 'Vendor/supplier name' },
      { key: 'purchase_cost',   label: 'Purchase Cost',   required: false, hint: 'Numeric value in PHP' },
      { key: 'warranty_expiry', label: 'Warranty Expiry', required: false, hint: 'Format: YYYY-MM-DD' },
      { key: 'campus',          label: 'Campus',          required: false, hint: 'Campus location' },
      { key: 'building',        label: 'Building',        required: false, hint: 'Building name' },
      { key: 'room',            label: 'Room',            required: false, hint: 'Room number or name' },
    ],
  },

  consumables: {
    id: 'consumables',
    name: 'Consumable Inventory',
    description: 'Import consumable items into the Asset Management inventory.',
    columns: [
      { key: 'name',                label: 'Item Name',           required: true,  hint: 'Name of the consumable item' },
      { key: 'category',            label: 'Category',            required: true,  hint: 'Type of consumable (e.g. Office Supplies, Printer Supplies)' },
      { key: 'unit',                label: 'Unit',                required: true,  hint: 'PIECE / REAM / BOX / BOTTLE / SET / PACK / LITER / KILOGRAM' },
      { key: 'quantity',            label: 'Current Quantity',    required: true,  hint: 'Starting stock count' },
      { key: 'low_stock_threshold', label: 'Low Stock Alert At',  required: true,  hint: 'Notify when stock falls below this number' },
      { key: 'overstock_threshold', label: 'Overstock Alert At',  required: true,  hint: 'Flag as overstock when quantity exceeds this number' },
      { key: 'description',         label: 'Description',         required: false, hint: 'Optional description or specifications' },
      { key: 'supplier',            label: 'Supplier',            required: false, hint: 'Vendor/supplier name' },
      { key: 'cost_per_unit',       label: 'Cost Per Unit (PHP)', required: false, hint: 'Unit price in PHP' },
      { key: 'purchase_date',       label: 'Purchase Date',       required: false, hint: 'Format: YYYY-MM-DD' },
    ],
  },

  subjects: {
    id: 'subjects',
    name: 'Academic Subjects',
    description: 'Import subjects/courses into the Academic module.',
    columns: [
      { key: 'code',           label: 'Subject Code',   required: true,  hint: 'Unique subject code (e.g. CS101)' },
      { key: 'name',           label: 'Subject Name',   required: true,  hint: 'Full subject name' },
      { key: 'lecture_units',  label: 'Lecture Units',  required: true,  hint: 'Number of lecture units (numeric)' },
      { key: 'lab_units',      label: 'Lab Units',      required: false, hint: 'Number of lab units (0 if none)' },
      { key: 'type',           label: 'Type',           required: false, hint: 'LECTURE / LABORATORY / HYBRID' },
      { key: 'year_level',     label: 'Year Level',     required: false, hint: 'Recommended year level: 1–5' },
      { key: 'department',     label: 'Department',     required: false, hint: 'Offering department' },
      { key: 'description',    label: 'Description',    required: false, hint: 'Brief subject description' },
    ],
  },
}

// ── CSV generation (non-student templates) ────────────────────────────────────

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export function downloadCSV(templateId: string) {
  const tmpl = IMPORT_TEMPLATES[templateId]
  if (!tmpl) return

  const keys    = tmpl.columns.map((c) => c.key)
  const labels  = tmpl.columns.map((c) => escapeCSV(`${c.label}${c.required ? ' *' : ''}`))

  const csv = [keys.join(','), labels.join(','), ''].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `schooleco_${templateId}_import_template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── CSV parsing (non-student templates) ───────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim()); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

export interface ParsedRow {
  data: Record<string, string>
  errors: string[]
  rowIndex: number
}

export interface ParseResult {
  rows: ParsedRow[]
  totalRows: number
  validRows: number
  errorRows: number
}

export function parseImportCSV(content: string, templateId: string): ParseResult {
  const tmpl = IMPORT_TEMPLATES[templateId]
  if (!tmpl) return { rows: [], totalRows: 0, validRows: 0, errorRows: 0 }

  const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length < 2) return { rows: [], totalRows: 0, validRows: 0, errorRows: 0 }

  const headerLine = parseCSVLine(lines[0])
  const keys = tmpl.columns.map((c) => c.key)
  const normalizedHeaders = headerLine.map((h) =>
    h.toLowerCase().replace(/ \*/g, '').trim().replace(/ /g, '_')
  )

  // Skip non-data rows (labels row)
  let dataStart = 1
  for (let i = 1; i < Math.min(lines.length, 3); i++) {
    const row = parseCSVLine(lines[i])
    const first = row[0]?.toLowerCase() ?? ''
    const isKeyMatch = keys.some((k) => first === k)
    if (!isKeyMatch && first !== '' && !/^\d/.test(first) && !first.includes('@')) {
      dataStart = i + 1
    } else {
      break
    }
  }

  const rows: ParsedRow[] = []
  for (let i = dataStart; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i])
    if (cells.every((c) => c === '')) continue

    const data: Record<string, string> = {}
    normalizedHeaders.forEach((h, idx) => { data[h] = cells[idx] ?? '' })

    const errors: string[] = []
    tmpl.columns.filter((c) => c.required).forEach((col) => {
      if (!data[col.key]?.trim()) errors.push(`"${col.label}" is required`)
    })

    rows.push({ data, errors, rowIndex: i + 1 })
  }

  return {
    rows,
    totalRows: rows.length,
    validRows:  rows.filter((r) => r.errors.length === 0).length,
    errorRows:  rows.filter((r) => r.errors.length > 0).length,
  }
}
