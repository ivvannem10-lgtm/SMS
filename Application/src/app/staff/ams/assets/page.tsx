'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Pencil, ChevronDown, X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { SectionTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { MOCK_ASSETS } from '@/lib/mock-data'
import { downloadAssetExcel, parseAssetExcel, ASSET_COLUMNS } from '@/lib/import-templates'
import type { Asset, AssetCategory, AssetStatus } from '@/types'

const ALL_CATEGORIES: AssetCategory[] = [
  'LAPTOP','DESKTOP','MONITOR','PRINTER','PROJECTOR',
  'ROUTER','LAB_EQUIPMENT','TABLET','SERVER','OTHER_FIXED',
]

const ALL_STATUSES: AssetStatus[] = [
  'AVAILABLE','BORROWED','DEPLOYED','IN_USE',
  'UNDER_MAINTENANCE','DAMAGED','LOST','RETIRED','OVERDUE',
]

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  LAPTOP: 'Laptop', DESKTOP: 'Desktop', MONITOR: 'Monitor', PRINTER: 'Printer',
  PROJECTOR: 'Projector', ROUTER: 'Router', LAB_EQUIPMENT: 'Lab Equipment',
  TABLET: 'Tablet', SERVER: 'Server', OTHER_FIXED: 'Other Fixed',
}

const STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: 'Available', BORROWED: 'Borrowed', DEPLOYED: 'Deployed', IN_USE: 'In Use',
  UNDER_MAINTENANCE: 'Under Maintenance', DAMAGED: 'Damaged', LOST: 'Lost',
  RETIRED: 'Retired', OVERDUE: 'Overdue',
}

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  LAPTOP:        'bg-brand-50 text-brand-700 ring-brand-200',
  DESKTOP:       'bg-slate-100 text-slate-600 ring-slate-200',
  MONITOR:       'bg-cyan-50 text-cyan-700 ring-cyan-200',
  PRINTER:       'bg-orange-50 text-orange-700 ring-orange-200',
  PROJECTOR:     'bg-violet-50 text-violet-700 ring-violet-200',
  ROUTER:        'bg-teal-50 text-teal-700 ring-teal-200',
  LAB_EQUIPMENT: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  TABLET:        'bg-indigo-50 text-indigo-700 ring-indigo-200',
  SERVER:        'bg-red-50 text-red-700 ring-red-200',
  OTHER_FIXED:   'bg-gray-100 text-gray-600 ring-gray-200',
}

const STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE:         'bg-emerald-50 text-emerald-700 ring-emerald-200',
  BORROWED:          'bg-blue-50 text-blue-700 ring-blue-200',
  DEPLOYED:          'bg-violet-50 text-violet-700 ring-violet-200',
  IN_USE:            'bg-cyan-50 text-cyan-700 ring-cyan-200',
  UNDER_MAINTENANCE: 'bg-amber-50 text-amber-700 ring-amber-200',
  DAMAGED:           'bg-orange-50 text-orange-700 ring-orange-200',
  LOST:              'bg-red-50 text-red-700 ring-red-200',
  RETIRED:           'bg-slate-100 text-slate-600 ring-slate-200',
  OVERDUE:           'bg-rose-50 text-rose-700 ring-rose-200',
}

function StatusPopover({
  current,
  assetId,
  onClose,
  onChange,
}: {
  current: AssetStatus
  assetId: string
  onClose: () => void
  onChange: (id: string, status: AssetStatus) => Promise<void>
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-1 w-48 rounded-xl bg-white border border-[#e4ebf5] shadow-card-md py-1"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#f0f4fa]">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Change Status</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {ALL_STATUSES.map(s => (
        <button
          key={s}
          onClick={async () => { await onChange(assetId, s); onClose() }}
          className={cn(
            'w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 transition-colors',
            s === current && 'bg-brand-50/50',
          )}
        >
          <span className={cn('inline-flex h-1.5 w-1.5 rounded-full shrink-0', {
            'bg-emerald-500': s === 'AVAILABLE',
            'bg-blue-500': s === 'BORROWED',
            'bg-violet-500': s === 'DEPLOYED',
            'bg-cyan-500': s === 'IN_USE',
            'bg-amber-500': s === 'UNDER_MAINTENANCE',
            'bg-orange-500': s === 'DAMAGED',
            'bg-red-500': s === 'LOST',
            'bg-slate-400': s === 'RETIRED',
            'bg-rose-500': s === 'OVERDUE',
          })} />
          <span className="text-slate-700">{STATUS_LABELS[s]}</span>
          {s === current && <span className="ml-auto text-brand-500 text-[10px] font-semibold">Current</span>}
        </button>
      ))}
    </div>
  )
}

export default function AssetRegistryPage() {
  const confirm = useConfirm()
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'ALL' | AssetCategory>('ALL')
  const [status, setStatus] = useState<'ALL' | AssetStatus>('ALL')
  const [department, setDepartment] = useState('ALL')
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [importOpen,    setImportOpen]    = useState(false)
  const [uploadedFile,  setUploadedFile]  = useState<string>('')
  const [previewRows,   setPreviewRows]   = useState<Record<string,string>[]>([])
  const [importCounts,  setImportCounts]  = useState({ total:0, valid:0, errors:0 })
  const [importErrList, setImportErrList] = useState<{rowIndex:number;errors:string[]}[]>([])
  const [importing,     setImporting]     = useState(false)
  const [imported,      setImported]      = useState(false)
  const [dragOver,      setDragOver]      = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function openImport()  { setImportOpen(true); setUploadedFile(''); setPreviewRows([]); setImported(false) }
  function closeImport() { setImportOpen(false) }

  async function processFile(file: File) {
    if (!file.name.endsWith('.xlsx')) { alert('Please upload an .xlsx file.'); return }
    setUploadedFile(file.name)
    try {
      const { parseAssetExcel } = await import('@/lib/import-templates')
      const result = await parseAssetExcel(file)
      setPreviewRows(result.rows)
      setImportCounts({ total: result.totalRows, valid: result.validRows, errors: result.errorRows })
      setImportErrList(result.rowErrors)
    } catch(err) { alert(String(err)) }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]; if (f) processFile(f)
  }

  function commitImport() {
    setImporting(true)
    setTimeout(() => {
      previewRows.forEach((row) => {
        const name = row['asset_name'] || row['asset name'] || ''
        const cat  = ((row['category'] || 'OTHER_FIXED').toUpperCase().replace(/\s+/g,'_')) as Asset['category']
        const dept = row['department__office'] || row['department'] || row['department_office'] || ''
        MOCK_ASSETS.push({
          id: `ast_imp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          assetTag: `IT-${cat.slice(0,4)}-${new Date().getFullYear()}-${String(MOCK_ASSETS.length+1).padStart(4,'0')}`,
          name, category: cat,
          brand: row['brand']||undefined, model: row['model']||undefined,
          serialNumber: row['serial_number']||undefined, department: dept,
          custodianType: 'DEPARTMENT', custodianName: row['custodian']||undefined,
          purchaseDate: row['purchase_date']||undefined,
          supplier: row['supplier__vendor']||row['supplier']||undefined,
          purchaseCost: row['purchase_cost__php_'] ? Number(row['purchase_cost__php_'].replace(/[^0-9.]/g,'')) : undefined,
          warrantyExpiry: row['warranty_expiry']||undefined,
          building: row['building']||undefined, room: row['room']||undefined,
          status: 'AVAILABLE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        })
      })
      setAssets([...MOCK_ASSETS])
      setImporting(false)
      setImported(true)
    }, 800)
  }

  const departments = ['ALL', ...Array.from(new Set(MOCK_ASSETS.map(a => a.department)))]

  const q = search.toLowerCase()
  const filtered = assets.filter(a => {
    const matchSearch = !q
      || a.assetTag.toLowerCase().includes(q)
      || a.name.toLowerCase().includes(q)
      || (a.serialNumber ?? '').toLowerCase().includes(q)
    const matchCat = category === 'ALL' || a.category === category
    const matchSts = status === 'ALL' || a.status === status
    const matchDept = department === 'ALL' || a.department === department
    return matchSearch && matchCat && matchSts && matchDept
  })

  async function handleStatusChange(id: string, newStatus: AssetStatus) {
    const ok = await confirm({
      title: 'Update Asset Status?',
      message: `Change status to ${STATUS_LABELS[newStatus]}?`,
      variant: 'warning',
      confirmLabel: 'Update Status',
    })
    if (!ok) return
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a))
    MOCK_ASSETS.forEach((a, i) => { if (a.id === id) MOCK_ASSETS[i] = { ...a, status: newStatus } })
  }

  const statsStrip = [
    { label: 'Available', value: assets.filter(a => a.status === 'AVAILABLE').length, cls: 'text-emerald-600' },
    { label: 'Borrowed', value: assets.filter(a => a.status === 'BORROWED').length, cls: 'text-blue-600' },
    { label: 'Deployed', value: assets.filter(a => a.status === 'DEPLOYED' || a.status === 'IN_USE').length, cls: 'text-violet-600' },
    { label: 'Maintenance', value: assets.filter(a => a.status === 'UNDER_MAINTENANCE').length, cls: 'text-amber-600' },
    { label: 'Total', value: assets.length, cls: 'text-brand-600' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle
        description={`${assets.length} assets registered in the system`}
        actions={
          <div className="flex gap-2">
            <button onClick={openImport}
              className="flex items-center gap-1.5 rounded-lg border border-[#dce8f7] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-all">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Mass Register
            </button>
            <Link href="/staff/ams/assets/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 transition-colors">
              <Plus className="h-4 w-4" /> Register Asset
            </Link>
          </div>
        }
      >
        Asset Registry
      </SectionTitle>

      <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileInput}/>

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={closeImport} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden" style={{maxHeight:'90vh'}}>

            {/* Header */}
            <div className="border-l-[3px] border-brand-500 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">Mass Asset Registration</p>
                <p className="text-xs text-slate-400 mt-0.5">Download the template, fill it in, and upload to register multiple assets at once.</p>
              </div>
              <button onClick={closeImport} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4 text-slate-400"/></button>
            </div>

            {imported ? (
              <div className="flex flex-col items-center justify-center gap-4 py-14 px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600"/>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{importCounts.valid} asset{importCounts.valid!==1?'s':''} registered successfully!</p>
                  <p className="text-sm text-slate-500 mt-1">All assets added to the registry with status <strong>Available</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>{setImported(false);setUploadedFile('');setPreviewRows([])}}
                    className="rounded-xl border border-[#dce8f7] px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Upload Another File
                  </button>
                  <button onClick={closeImport} className="rounded-xl bg-brand-500 hover:bg-brand-600 px-5 py-2 text-sm font-bold text-white">Done</button>
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{maxHeight:'calc(90vh - 72px)'}}>
                {/* Step 1 — Download */}
                <div className="px-6 pt-4 pb-5 border-b border-[#e4ebf5]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">1</span>
                    <p className="text-sm font-bold text-slate-800">Download the Excel Template</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 ml-8">The template includes a sample row and an Instructions sheet explaining every column. Required columns are marked with <span className="text-red-500 font-semibold">*</span>.</p>
                  <div className="ml-8 flex items-center gap-3">
                    <button onClick={()=>downloadAssetExcel()}
                      className="flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2 text-sm font-bold text-white transition-colors">
                      <Download className="h-4 w-4"/> Download Template
                    </button>
                    <span className="text-xs text-slate-400">SchoolEco_Asset_Template.xlsx</span>
                  </div>
                </div>

                {/* Step 2 — Fill & Upload */}
                <div className="px-6 pt-4 pb-5 border-b border-[#e4ebf5]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">2</span>
                    <p className="text-sm font-bold text-slate-800">Fill in your assets &amp; upload the file</p>
                  </div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e)=>{e.preventDefault();setDragOver(true)}}
                    onDragLeave={()=>setDragOver(false)}
                    onClick={()=>fileRef.current?.click()}
                    className={cn(
                      'ml-8 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-8 cursor-pointer transition-all',
                      dragOver ? 'border-brand-400 bg-brand-50' : uploadedFile ? 'border-emerald-400 bg-emerald-50' : 'border-[#dce8f7] bg-[#f8fafd] hover:border-brand-400 hover:bg-brand-50/30'
                    )}>
                    {uploadedFile ? (
                      <>
                        <FileSpreadsheet className="h-8 w-8 text-emerald-500"/>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-emerald-700">{uploadedFile}</p>
                          <p className="text-xs text-emerald-600 mt-0.5">File loaded — click to replace</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-300"/>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-600">Click or drag your .xlsx file here</p>
                          <p className="text-xs text-slate-400 mt-0.5">Only .xlsx files using the provided template</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 3 — Review */}
                {previewRows.length > 0 && (
                  <div className="px-6 pt-4 pb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">3</span>
                      <p className="text-sm font-bold text-slate-800">Review &amp; Register</p>
                    </div>
                    <div className="ml-8 space-y-3">
                      {/* Counts */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {label:'Total Rows', value:importCounts.total, cls:'text-slate-700', bg:'bg-slate-50 border-slate-200'},
                          {label:'Ready to Import', value:importCounts.valid, cls:'text-emerald-700', bg:'bg-emerald-50 border-emerald-200'},
                          {label:'Rows with Errors', value:importCounts.errors, cls:'text-red-600', bg:'bg-red-50 border-red-200'},
                        ].map(s=>(
                          <div key={s.label} className={cn('rounded-xl border px-3 py-2.5 text-center', s.bg)}>
                            <p className={cn('text-xl font-bold tabular-nums', s.cls)}>{s.value}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {/* Error list */}
                      {importErrList.length > 0 && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 space-y-0.5 max-h-20 overflow-y-auto">
                          {importErrList.map(e=>(
                            <p key={e.rowIndex} className="text-xs text-red-700"><span className="font-bold">Row {e.rowIndex}:</span> {e.errors.join(' · ')}</p>
                          ))}
                        </div>
                      )}
                      {/* Preview table */}
                      <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
                        <div className="overflow-x-auto max-h-40">
                          <table className="w-full text-xs">
                            <thead className="bg-[#f0f4fa] sticky top-0">
                              <tr>
                                {['Asset Name','Category','Department','Brand','Serial No.'].map(h=>(
                                  <th key={h} className="px-3 py-2 text-left text-brand-700 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f4fa]">
                              {previewRows.map((r,i)=>(
                                <tr key={i} className="hover:bg-[#f8fafd]">
                                  <td className="px-3 py-2 font-medium text-slate-800 max-w-[130px] truncate">{r['asset_name']||r['asset name']||'—'}</td>
                                  <td className="px-3 py-2 text-slate-600">{r['category']||'—'}</td>
                                  <td className="px-3 py-2 text-slate-600 max-w-[110px] truncate">{r['department__office']||r['department']||'—'}</td>
                                  <td className="px-3 py-2 text-slate-500">{r['brand']||'—'}</td>
                                  <td className="px-3 py-2 text-slate-500 font-mono">{r['serial_number']||'—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {/* Register button */}
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={closeImport} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button onClick={commitImport} disabled={importCounts.valid===0||importing}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-40 transition-colors">
                          {importing ? <><RefreshCw className="h-4 w-4 animate-spin"/>Registering…</> : <><CheckCircle2 className="h-4 w-4"/>Register {importCounts.valid} Asset{importCounts.valid!==1?'s':''}</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {statsStrip.map(s => (
          <div key={s.label} className="rounded-2xl bg-white border border-[#e4ebf5] px-4 py-3 text-center">
            <p className={cn('text-xl font-bold tabular-nums', s.cls)}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e4ebf5] bg-white flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by tag, name, serial…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#dce8f7] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 bg-white text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <div className="relative">
            <select
              value={category}
              onChange={e => setCategory(e.target.value as 'ALL' | AssetCategory)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#dce8f7] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 bg-white text-slate-700"
            >
              <option value="ALL">All Categories</option>
              {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'ALL' | AssetStatus)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#dce8f7] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="relative">
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-[#dce8f7] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 bg-white text-slate-700"
            >
              {departments.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm mb-4">No assets match your filters.</p>
            <Link
              href="/staff/ams/assets/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Register Asset
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                  {['Asset', 'Category', 'Status', 'Department / Custodian', 'Location', 'Purchase Cost', 'Actions'].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-[10px] font-bold text-brand-700 uppercase tracking-widest whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4fa]">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-brand-600 block">{a.assetTag}</span>
                      <span className="text-sm font-semibold text-slate-800 block leading-tight">{a.name}</span>
                      {(a.brand || a.model) && (
                        <span className="text-xs text-slate-400 block leading-tight">
                          {[a.brand, a.model].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-[10px]', CATEGORY_COLORS[a.category])}>
                        {CATEGORY_LABELS[a.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenPopover(openPopover === a.id ? null : a.id)}
                          className="group flex items-center gap-1"
                          title="Click to change status"
                        >
                          <Badge className={cn('text-[10px]', STATUS_COLORS[a.status])}>
                            {STATUS_LABELS[a.status]}
                          </Badge>
                          <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                        {openPopover === a.id && (
                          <StatusPopover
                            current={a.status}
                            assetId={a.id}
                            onClose={() => setOpenPopover(null)}
                            onChange={handleStatusChange}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-800 block leading-tight">{a.department}</span>
                      {a.custodianName && (
                        <span className="text-xs text-slate-400 block leading-tight">{a.custodianName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(a.building || a.room) ? (
                        <span className="text-xs text-slate-600">
                          {[a.building, a.room].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.purchaseCost != null ? (
                        <span className="text-sm text-slate-700 font-medium tabular-nums">
                          {formatCurrency(a.purchaseCost)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/staff/ams/assets/${a.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#dce8f7] bg-white hover:bg-brand-50 hover:border-brand-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-brand-700 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <button
                          onClick={() => setOpenPopover(openPopover === `edit-${a.id}` ? null : `edit-${a.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#dce8f7] bg-white hover:bg-slate-50 hover:border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#f0f4fa] flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {filtered.length} of {assets.length} assets
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
