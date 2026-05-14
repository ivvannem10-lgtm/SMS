'use client'
import { useState, useRef, useCallback } from 'react'
import {
  X, Download, Upload, CheckCircle, AlertCircle, FileSpreadsheet,
  ChevronRight, Info, RefreshCw, Table2, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  IMPORT_TEMPLATES, STUDENT_SHEETS,
  downloadCSV, downloadStudentExcel,
  parseImportCSV, parseStudentExcel,
} from '@/lib/import-templates'
import type { ParseResult, StudentExcelResult } from '@/lib/import-templates'

type Step = 'template' | 'upload' | 'preview'

interface ImportModalProps {
  templateId: string
  onClose: () => void
  onImport: (rows: Record<string, string>[]) => void
}

export function ImportModal({ templateId, onClose, onImport }: ImportModalProps) {
  const isStudent = templateId === 'students'
  const tmpl      = isStudent ? null : IMPORT_TEMPLATES[templateId]

  const [step,       setStep]       = useState<Step>('template')
  const [dragging,   setDragging]   = useState(false)
  const [fileName,   setFileName]   = useState('')
  const [result,     setResult]     = useState<ParseResult | null>(null)
  const [xlsxResult, setXlsxResult] = useState<StudentExcelResult | null>(null)
  const [importing,  setImporting]  = useState(false)
  const [done,       setDone]       = useState(false)
  const [downloading, setDownloading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── File handling ──────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!file) return
    setFileName(file.name)

    if (isStudent) {
      const parsed = await parseStudentExcel(file)
      setXlsxResult(parsed)
      setStep('preview')
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setResult(parseImportCSV(text, templateId))
        setStep('preview')
      }
      reader.readAsText(file)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  // ── Import ─────────────────────────────────────────────────────────────────

  function handleImport() {
    setImporting(true)
    setTimeout(() => {
      if (isStudent && xlsxResult) {
        const validRows = xlsxResult.personalInfo.filter((_, i) =>
          !xlsxResult.rowErrors.some((e) => e.rowIndex === i + 2)
        )
        // Map Excel column labels → simple keys
        const mapped = validRows.map((row) => ({
          first_name:   row['First Name *'] ?? '',
          last_name:    row['Last Name *']  ?? '',
          middle_name:  row['Middle Name']  ?? '',
          email:        row['Email *']      ?? '',
          phone:        row['Phone']        ?? '',
          birthday:     row['Date of Birth (YYYY-MM-DD)'] ?? '',
          gender:       row['Gender (Male / Female / Other)'] ?? '',
          address:      row['Home Address'] ?? '',
          program:      row['Program']      ?? '',
          year_level:   row['Year Level (1 / 2 / 3 / 4 / 5)'] ?? '',
          status:       row['Status (ACTIVE / INACTIVE / DROPPED / GRADUATED)'] ?? '',
        }))
        onImport(mapped)
      } else if (result) {
        onImport(result.rows.filter((r) => r.errors.length === 0).map((r) => r.data))
      }
      setImporting(false)
      setDone(true)
    }, 600)
  }

  if (!isStudent && !tmpl) return null

  const displayName = isStudent ? 'Student Records' : tmpl!.name
  const description = isStudent
    ? 'Import students with Personal Info, Family Background, Academic Records and Educational History.'
    : tmpl!.description

  const totalImported = isStudent
    ? (xlsxResult?.validRows ?? 0)
    : (result?.validRows ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="border-l-[3px] border-brand-500 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-4.5 w-4.5 text-brand-500" />
            <div>
              <p className="text-sm font-bold text-slate-900">Import {displayName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-[#e4ebf5] shrink-0">
          {(['template', 'upload', 'preview'] as Step[]).map((s, i) => (
            <button key={s} onClick={() => !done && s !== 'preview' && setStep(s)}
              className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors border-b-2',
                step === s
                  ? 'border-brand-500 text-brand-700 bg-brand-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-600')}>
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold',
                step === s ? 'bg-brand-500 text-white' :
                (s === 'preview' && (result || xlsxResult)) || (s === 'upload' && step === 'preview')
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-500')}>
                {(s === 'upload' && step === 'preview') || (s === 'template' && step !== 'template') ? '✓' : i + 1}
              </span>
              {s === 'template' ? 'Download Template' : s === 'upload' ? 'Upload File' : 'Review & Import'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1: Download template ───────────────────────────────── */}
          {step === 'template' && (
            <div className="p-5 space-y-5">
              {/* Download card */}
              <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">
                    Download {isStudent ? 'Excel' : 'CSV'} Template
                  </p>
                  <p className="text-xs text-white/60">
                    {isStudent
                      ? 'Clean 4-sheet workbook. Fill in each sheet directly — no sample data to remove.'
                      : 'Clean header-only file. Fill in your data and upload.'}
                  </p>
                </div>
                <button
                  disabled={downloading}
                  onClick={async () => {
                    setDownloading(true)
                    if (isStudent) await downloadStudentExcel()
                    else downloadCSV(templateId)
                    setDownloading(false)
                  }}
                  className="flex items-center gap-2 shrink-0 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-50 transition-colors shadow-lg disabled:opacity-60">
                  <Download className="h-4 w-4" />
                  {downloading ? 'Preparing…' : isStudent ? 'Download .XLSX' : 'Download .CSV'}
                </button>
              </div>

              {/* How to use */}
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed space-y-1">
                  <p className="font-semibold">How to use:</p>
                  {isStudent ? (
                    <>
                      <p>1. Download the Excel file — it opens with <strong>4 separate sheets</strong>.</p>
                      <p>2. Fill in each sheet. Columns marked <strong>*</strong> are required. <strong>Student Email</strong> links the other sheets to a student.</p>
                      <p>3. Save the file and upload it on the next step.</p>
                    </>
                  ) : (
                    <>
                      <p>1. Download the CSV and open it in <strong>Microsoft Excel</strong> or <strong>Google Sheets</strong>.</p>
                      <p>2. Fill in your data starting from row 2 (below the header row).</p>
                      <p>3. Save as <strong>.CSV</strong> then upload on the next step.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Sheet / column reference */}
              {isStudent ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-brand-500" /> Sheets in this workbook
                  </p>
                  {Object.entries(STUDENT_SHEETS).map(([sheetName, cols], si) => {
                    const colors = ['brand', 'emerald', 'violet', 'amber']
                    const color  = colors[si]
                    return (
                      <div key={sheetName} className="rounded-xl border border-[#e4ebf5] overflow-hidden">
                        <div className={cn('px-4 py-2.5 flex items-center gap-2 border-b border-[#e4ebf5]',
                          `bg-${color}-50`)}>
                          <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold text-white',
                            `bg-${color}-500`)}>
                            {si + 1}
                          </span>
                          <p className={cn('text-xs font-bold', `text-${color}-800`)}>{sheetName}</p>
                          <span className="ml-auto text-[10px] text-slate-400">{cols.length} columns</span>
                        </div>
                        <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                          {cols.map((col) => (
                            <span key={col}
                              className={cn('rounded-md px-2 py-0.5 text-[10px] font-medium',
                                col.endsWith('*')
                                  ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
                                  : 'bg-slate-100 text-slate-600')}>
                              {col.replace(' *', '')}
                              {col.endsWith('*') && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-[10px] text-slate-400"><span className="text-red-500 font-bold">*</span> Required field</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Table2 className="h-3.5 w-3.5 text-brand-500" /> Column Reference
                  </p>
                  <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-[#f0f4fa]">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Column</th>
                          <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Key</th>
                          <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Hint</th>
                          <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Req.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f4fa]">
                        {tmpl!.columns.map((col) => (
                          <tr key={col.key} className="hover:bg-brand-50/30">
                            <td className="px-3 py-2 font-semibold text-slate-700">{col.label}</td>
                            <td className="px-3 py-2 font-mono text-brand-600">{col.key}</td>
                            <td className="px-3 py-2 text-slate-500">{col.hint}</td>
                            <td className="px-3 py-2">
                              {col.required
                                ? <span className="rounded-full bg-red-50 text-red-600 px-1.5 py-0.5 font-semibold ring-1 ring-inset ring-red-200">Yes</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Upload ──────────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="p-5 space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer py-14 transition-all',
                  dragging ? 'border-brand-400 bg-brand-50' : 'border-[#dce8f7] bg-[#f8fafd] hover:border-brand-400 hover:bg-brand-50/40',
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100 mb-4">
                  <Upload className="h-6 w-6 text-brand-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">
                  {dragging ? 'Drop your file here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-slate-400">
                  Supports <strong>{isStudent ? '.XLSX' : '.CSV'}</strong> files
                </p>
                <input
                  ref={fileRef} type="file"
                  accept={isStudent ? '.xlsx,.xls' : '.csv,.txt'}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              <div className="rounded-xl bg-[#f3f6fb] border border-[#e4ebf5] px-4 py-3 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isStudent
                    ? 'Upload the filled-in Excel template. All 4 sheets will be read. The Personal Info sheet is required — the other sheets are optional.'
                    : 'Upload the filled CSV file. The first row must be the column header keys.'}
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3: Preview ─────────────────────────────────────────── */}
          {step === 'preview' && (
            <div className="p-5 space-y-4">
              {done ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-base font-bold text-slate-900">Import Complete!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {totalImported} record{totalImported !== 1 ? 's' : ''} imported successfully.
                  </p>
                  <button onClick={onClose} className="mt-5 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
                    Close
                  </button>
                </div>
              ) : isStudent && xlsxResult ? (
                <>
                  {/* Sheet summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Personal Info',       count: xlsxResult.personalInfo.length,       color: 'brand' },
                      { label: 'Family Background',   count: xlsxResult.familyBackground.length,   color: 'emerald' },
                      { label: 'Academic Records',    count: xlsxResult.academicRecords.length,     color: 'violet' },
                      { label: 'Educational History', count: xlsxResult.educationalHistory.length,  color: 'amber' },
                    ].map((s) => (
                      <div key={s.label} className={cn('rounded-xl border px-4 py-3',
                        s.color === 'brand'   ? 'bg-brand-50 border-brand-200' :
                        s.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
                        s.color === 'violet'  ? 'bg-violet-50 border-violet-200' :
                        'bg-amber-50 border-amber-200')}>
                        <p className={cn('text-xl font-bold',
                          s.color === 'brand'   ? 'text-brand-700' :
                          s.color === 'emerald' ? 'text-emerald-700' :
                          s.color === 'violet'  ? 'text-violet-700' :
                          'text-amber-700')}>{s.count}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Valid / error summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-[#f3f6fb] border border-[#e4ebf5] px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-slate-900">{xlsxResult.totalRows}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Total Students</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-emerald-700">{xlsxResult.validRows}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">Ready to Import</p>
                    </div>
                    <div className={cn('rounded-xl border px-4 py-3 text-center',
                      xlsxResult.errorRows > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')}>
                      <p className={cn('text-2xl font-bold', xlsxResult.errorRows > 0 ? 'text-red-700' : 'text-slate-400')}>
                        {xlsxResult.errorRows}
                      </p>
                      <p className={cn('text-xs mt-0.5', xlsxResult.errorRows > 0 ? 'text-red-600' : 'text-slate-400')}>With Errors</p>
                    </div>
                  </div>

                  {xlsxResult.errorRows > 0 && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Rows with errors (will be skipped):</p>
                        {xlsxResult.rowErrors.slice(0, 5).map((e) => (
                          <p key={e.rowIndex}>Row {e.rowIndex}: {e.errors.join(', ')}</p>
                        ))}
                        {xlsxResult.rowErrors.length > 5 && (
                          <p className="text-amber-600">…and {xlsxResult.rowErrors.length - 5} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview of personal info rows */}
                  {xlsxResult.personalInfo.length > 0 && (
                    <div className="rounded-xl border border-[#e4ebf5] overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-[#f0f4fa] sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">#</th>
                            <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">First Name</th>
                            <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Last Name</th>
                            <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Email</th>
                            <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f4fa]">
                          {xlsxResult.personalInfo.map((row, i) => {
                            const hasError = xlsxResult.rowErrors.some((e) => e.rowIndex === i + 2)
                            return (
                              <tr key={i} className={cn(hasError ? 'bg-red-50/50' : 'hover:bg-brand-50/30')}>
                                <td className="px-3 py-2 font-mono text-slate-400">{i + 2}</td>
                                <td className="px-3 py-2 text-slate-700">{row['First Name *'] || <span className="text-red-400">—</span>}</td>
                                <td className="px-3 py-2 text-slate-700">{row['Last Name *']  || <span className="text-red-400">—</span>}</td>
                                <td className="px-3 py-2 text-slate-500 max-w-36 truncate">{row['Email *'] || <span className="text-red-400">—</span>}</td>
                                <td className="px-3 py-2">
                                  {hasError
                                    ? <span className="text-red-600 font-semibold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Error</span>
                                    : <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> OK</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-xs text-slate-400 flex-1">File: <span className="font-medium text-slate-600">{fileName}</span></p>
                    <button onClick={() => { setStep('upload'); setXlsxResult(null); setFileName('') }}
                      className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      <RefreshCw className="h-3.5 w-3.5" /> Re-upload
                    </button>
                  </div>
                </>
              ) : result ? (
                <>
                  {/* CSV preview (non-student) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-[#f3f6fb] border border-[#e4ebf5] px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-slate-900">{result.totalRows}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Total Rows</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-emerald-700">{result.validRows}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">Ready to Import</p>
                    </div>
                    <div className={cn('rounded-xl border px-4 py-3 text-center',
                      result.errorRows > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200')}>
                      <p className={cn('text-2xl font-bold', result.errorRows > 0 ? 'text-red-700' : 'text-slate-400')}>{result.errorRows}</p>
                      <p className={cn('text-xs mt-0.5', result.errorRows > 0 ? 'text-red-600' : 'text-slate-400')}>With Errors</p>
                    </div>
                  </div>

                  {result.errorRows > 0 && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">Rows with errors will be skipped. Fix them and re-upload to include them.</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-[#e4ebf5] overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-[#f0f4fa] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide w-12">Row</th>
                          <th className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">Status</th>
                          {tmpl!.columns.slice(0, 4).map((col) => (
                            <th key={col.key} className="px-3 py-2 text-left font-bold text-brand-700 uppercase tracking-wide">{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f4fa]">
                        {result.rows.map((row) => (
                          <tr key={row.rowIndex} className={cn(row.errors.length > 0 ? 'bg-red-50/50' : 'hover:bg-brand-50/30')}>
                            <td className="px-3 py-2 font-mono text-slate-400">{row.rowIndex}</td>
                            <td className="px-3 py-2">
                              {row.errors.length === 0
                                ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle className="h-3 w-3" /> OK</span>
                                : (
                                  <div>
                                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><AlertCircle className="h-3 w-3" /> Error</span>
                                    {row.errors.map((e, i) => <p key={i} className="text-red-500 mt-0.5 text-2xs">{e}</p>)}
                                  </div>
                                )}
                            </td>
                            {tmpl!.columns.slice(0, 4).map((col) => (
                              <td key={col.key} className="px-3 py-2 text-slate-600 max-w-24 truncate">
                                {row.data[col.key] || <span className="text-slate-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-xs text-slate-400 flex-1">File: <span className="font-medium text-slate-600">{fileName}</span></p>
                    <button onClick={() => { setStep('upload'); setResult(null); setFileName('') }}
                      className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      <RefreshCw className="h-3.5 w-3.5" /> Re-upload
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="border-t border-[#e4ebf5] px-5 py-4 flex items-center justify-between shrink-0">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <div className="flex gap-2">
              {step === 'template' && (
                <button onClick={() => setStep('upload')}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600">
                  Next: Upload <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
              {step === 'upload' && (
                <button onClick={() => setStep('template')}
                  className="rounded-lg border border-[#dce8f7] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  ← Back
                </button>
              )}
              {step === 'preview' && (result || xlsxResult) && !done && (
                <>
                  <button onClick={() => setStep('upload')}
                    className="rounded-lg border border-[#dce8f7] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    ← Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={totalImported === 0 || importing}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40 transition-all">
                    {importing
                      ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Importing…</>
                      : <><CheckCircle className="h-3.5 w-3.5" /> Import {totalImported} Student{totalImported !== 1 ? 's' : ''}</>}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
