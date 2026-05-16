'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff, ChevronDown, ChevronUp,
  Send, BookOpen, Play, AlertTriangle, Shield, Clock, RefreshCw,
} from 'lucide-react'
import { Card, SectionTitle, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import type { SessionUser } from '@/types'
import { API_SCOPES, API_ADMIN_ROLES, ROLE_DEFAULT_SCOPES, type ApiKey, type ApiScope, type ApiAdminRole } from '@/lib/mock-api-keys'
import { cn } from '@/lib/utils'

// ─── Endpoint catalogue for Reference + Try It Out ───────────────────────────

interface EndpointDef {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  description: string
  scope: string
  sampleBody?: string
  queryParams?: { name: string; description: string }[]
}

const ENDPOINT_GROUPS: { group: string; endpoints: EndpointDef[] }[] = [
  {
    group: 'Health',
    endpoints: [
      { method: 'GET', path: '/api/v1/health', description: 'System health check — no auth required', scope: 'public' },
    ],
  },
  {
    group: 'Students',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/students', description: 'List all students (paginated)', scope: 'students:read',
        queryParams: [
          { name: 'search', description: 'Filter by name, email, or student ID' },
          { name: 'status', description: 'ACTIVE | INACTIVE | GRADUATED | DROPPED' },
          { name: 'page', description: 'Page number (default: 1)' },
          { name: 'limit', description: 'Results per page (default: 20, max: 100)' },
        ],
      },
      {
        method: 'POST', path: '/api/v1/students', description: 'Create a new student record', scope: 'students:write',
        sampleBody: JSON.stringify({ firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com', yearLevel: 1, status: 'ACTIVE' }, null, 2),
      },
      { method: 'GET',    path: '/api/v1/students/:id', description: 'Retrieve a student by ID',  scope: 'students:read' },
      {
        method: 'PATCH', path: '/api/v1/students/:id', description: 'Update a student record', scope: 'students:write',
        sampleBody: JSON.stringify({ status: 'INACTIVE', yearLevel: 2 }, null, 2),
      },
      { method: 'DELETE', path: '/api/v1/students/:id', description: 'Delete a student record', scope: 'students:write' },
    ],
  },
  {
    group: 'Courses',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/courses', description: 'List all subject offerings', scope: 'courses:read',
        queryParams: [
          { name: 'status', description: 'DRAFT | PUBLISHED | CLOSED' },
          { name: 'semester', description: 'Filter by semester ID or type' },
          { name: 'page', description: 'Page number (default: 1)' },
          { name: 'limit', description: 'Results per page (default: 20)' },
        ],
      },
    ],
  },
  {
    group: 'Grades',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/grades', description: 'List published grade submissions', scope: 'grades:read',
        queryParams: [
          { name: 'studentId', description: 'Filter entries for a specific student' },
          { name: 'offeringId', description: 'Filter by offering ID' },
          { name: 'semester', description: 'Filter by semester ID' },
        ],
      },
    ],
  },
  {
    group: 'Enrollments',
    endpoints: [
      {
        method: 'GET', path: '/api/v1/enrollments', description: 'List enrollments', scope: 'enrollments:read',
        queryParams: [
          { name: 'studentId', description: 'Filter by student ID' },
          { name: 'status', description: 'PRE_ENROLLED | ENROLLED | DROPPED | COMPLETED' },
          { name: 'semester', description: 'Filter by semester ID' },
        ],
      },
      {
        method: 'POST', path: '/api/v1/enrollments', description: 'Create enrollment records', scope: 'enrollments:write',
        sampleBody: JSON.stringify({ studentId: 'st_001', offeringIds: ['offering_1', 'offering_2'] }, null, 2),
      },
    ],
  },
  {
    group: 'Staff',
    endpoints: [
      { method: 'GET', path: '/api/v1/staff', description: 'List all staff members (no passwords)', scope: 'staff:read' },
    ],
  },
]

const ALL_ENDPOINTS: EndpointDef[] = ENDPOINT_GROUPS.flatMap((g) => g.endpoints)

// ─── Scope grouping for the create-key form ──────────────────────────────────

const SCOPE_GROUPS: { label: string; scopes: ApiScope[] }[] = [
  { label: 'Students',    scopes: ['students:read', 'students:write'] },
  { label: 'Staff',       scopes: ['staff:read', 'staff:write'] },
  { label: 'Courses',     scopes: ['courses:read', 'courses:write'] },
  { label: 'Grades',      scopes: ['grades:read', 'grades:write'] },
  { label: 'Enrollments', scopes: ['enrollments:read', 'enrollments:write'] },
  { label: 'Financial',   scopes: ['financial:read'] },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function methodColor(method: string) {
  switch (method) {
    case 'GET':    return 'bg-blue-50 text-blue-700 ring-blue-200'
    case 'POST':   return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 'PATCH':  return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 'DELETE': return 'bg-red-50 text-red-700 ring-red-200'
    default:       return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

function KeyStatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset',
      active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-600 ring-red-200',
    )}>
      {active ? 'Active' : 'Revoked'}
    </span>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApiManagementPage() {
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined

  const [activeTab, setActiveTab]   = useState<'keys' | 'reference' | 'tester'>('keys')
  const [keys, setKeys]             = useState<ApiKey[]>([])
  const [loading, setLoading]       = useState(false)

  // Generate key modal
  const [showGenModal, setShowGenModal] = useState(false)
  const [genName, setGenName]           = useState('')
  const [genScopes, setGenScopes]       = useState<Set<ApiScope>>(new Set())
  const [genExpiry, setGenExpiry]       = useState('')
  const [generating, setGenerating]     = useState(false)
  const [newKey, setNewKey]             = useState<string | null>(null)
  const [showNewKey, setShowNewKey]     = useState(false)

  // Revoke confirm
  const [revokeId, setRevokeId]     = useState<string | null>(null)
  const [revoking, setRevoking]     = useState(false)

  // Try It Out
  const [tryEndpoint, setTryEndpoint]   = useState<EndpointDef>(ALL_ENDPOINTS[0])
  const [tryApiKey, setTryApiKey]       = useState('')
  const [tryBody, setTryBody]           = useState('')
  const [tryResponse, setTryResponse]  = useState<string | null>(null)
  const [tryLoading, setTryLoading]     = useState(false)
  const [tryStatus, setTryStatus]      = useState<number | null>(null)

  // Reference collapse state
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Health')

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/v1/keys')
      const json = await res.json()
      if (json.success) setKeys(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  // All admin roles can access this page
  if (user && !API_ADMIN_ROLES.includes(user.role as ApiAdminRole)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Shield className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">Access Restricted</p>
        <p className="text-sm text-slate-400">API management is available to admin staff only.</p>
      </div>
    )
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // ── Generate key ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!genName.trim() || genScopes.size === 0) return
    setGenerating(true)
    try {
      const res  = await fetch('/api/v1/keys', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: genName, scopes: [...genScopes], ...(genExpiry ? { expiresAt: genExpiry } : {}) }),
      })
      const json = await res.json()
      if (json.success) {
        setNewKey(json.data.key)
        await fetchKeys()
      }
    } finally {
      setGenerating(false)
    }
  }

  function closeGenModal() {
    setShowGenModal(false)
    setGenName('')
    setGenScopes(new Set())
    setGenExpiry('')
    setNewKey(null)
    setShowNewKey(false)
  }

  function toggleScope(s: ApiScope) {
    setGenScopes((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  // ── Revoke key ────────────────────────────────────────────────────────────────

  async function handleRevoke() {
    if (!revokeId) return
    setRevoking(true)
    try {
      await fetch(`/api/v1/keys/${revokeId}`, { method: 'DELETE' })
      await fetchKeys()
    } finally {
      setRevoking(false)
      setRevokeId(null)
    }
  }

  // ── Try It Out ────────────────────────────────────────────────────────────────

  async function handleSendRequest() {
    setTryLoading(true)
    setTryResponse(null)
    setTryStatus(null)
    try {
      const url     = tryEndpoint.path.replace(':id', 'REPLACE_ID')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (tryApiKey.trim()) headers['x-api-key'] = tryApiKey.trim()

      const opts: RequestInit = { method: tryEndpoint.method, headers }
      if ((tryEndpoint.method === 'POST' || tryEndpoint.method === 'PATCH') && tryBody.trim()) {
        opts.body = tryBody
      }

      const res  = await fetch(url, opts)
      setTryStatus(res.status)
      const text = await res.text()
      try {
        setTryResponse(JSON.stringify(JSON.parse(text), null, 2))
      } catch {
        setTryResponse(text)
      }
    } catch (e) {
      setTryResponse(String(e))
    } finally {
      setTryLoading(false)
    }
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const totalKeys  = keys.length
  const activeKeys = keys.filter((k) => k.isActive).length
  const totalReqs  = keys.reduce((_, __) => _ + (Math.floor(Math.random() * 0)), 0) // mock count

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <SectionTitle
        description="Manage REST API access keys, view documentation, and test endpoints live."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => {
            const defaults = ROLE_DEFAULT_SCOPES[user?.role as ApiAdminRole]
            setGenScopes(new Set(defaults ?? []))
            setShowGenModal(true)
          }}>
            Generate Key
          </Button>
        }
      >
        API Management
      </SectionTitle>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(['keys', 'reference', 'tester'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {tab === 'keys' ? 'API Keys' : tab === 'reference' ? 'API Reference' : 'Try It Out'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          Tab 1: API Keys
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'keys' && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Keys"    value={totalKeys}  icon={Key}        color="bg-brand-50 text-brand-500" />
            <StatCard label="Active Keys"   value={activeKeys} icon={Shield}      color="bg-emerald-50 text-emerald-600" />
            <StatCard label="Total Requests" value="—"         icon={RefreshCw}  color="bg-slate-50 text-slate-400" sub="Available after DB integration" />
          </div>

          {/* Keys table */}
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
              <div>
                <p className="text-sm font-semibold text-slate-800">API Keys</p>
                {!isSuperAdmin && (
                  <p className="text-xs text-slate-400 mt-0.5">Showing your keys only — Super Admin can view all keys</p>
                )}
              </div>
              <button onClick={fetchKeys} className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} /> Refresh
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Key className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No API keys yet</p>
                <p className="text-xs text-slate-400">Generate a key to start using the REST API.</p>
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => {
                  const defaults = ROLE_DEFAULT_SCOPES[user?.role as ApiAdminRole]
                  setGenScopes(new Set(defaults ?? []))
                  setShowGenModal(true)
                }}>
                  Generate Key
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f0f4fa] border-b border-[#dce8f7]">
                      {['Name', 'Prefix', 'Scopes', 'Created', 'Last Used', 'Expires', 'Status', ''].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-brand-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k.id} className="border-b border-slate-100 hover:bg-brand-50/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{k.name}</td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                            {k.prefix}…
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {k.scopes.slice(0, 3).map((s) => (
                              <span key={s} className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 ring-1 ring-inset ring-brand-200">
                                {s}
                              </span>
                            ))}
                            {k.scopes.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                                +{k.scopes.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(k.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3"><KeyStatusBadge active={k.isActive} /></td>
                        <td className="px-4 py-3">
                          {k.isActive && user?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setRevokeId(k.id)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Tab 2: API Reference
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reference' && (
        <div className="space-y-5">
          {/* Auth info */}
          <Card>
            <h3 className="mb-3 text-sm font-bold text-slate-800">Authentication</h3>
            <p className="text-sm text-slate-600 mb-3">
              All endpoints (except <code className="rounded bg-slate-100 px-1 text-xs">/api/v1/health</code>) require
              an API key. Include it using either header:
            </p>
            <div className="space-y-2">
              {[
                'Authorization: Bearer sis_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                'x-api-key: sis_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
              ].map((h) => (
                <div key={h} className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-2.5">
                  <code className="font-mono text-xs text-emerald-300">{h}</code>
                  <CopyButton value={h} />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
              <p className="text-xs font-semibold text-brand-700">Base URL</p>
              <code className="font-mono text-sm text-brand-800">https://yourdomain.com</code>
            </div>
          </Card>

          {/* Endpoint groups */}
          {ENDPOINT_GROUPS.map((group) => (
            <Card key={group.group} padding="none">
              <button
                onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
                className="flex w-full items-center justify-between px-5 py-4 border-b border-[#e4ebf5] hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-bold text-slate-800">{group.group}</span>
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  {group.endpoints.length} endpoints
                  {expandedGroup === group.group
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />
                  }
                </span>
              </button>

              {expandedGroup === group.group && (
                <div className="divide-y divide-slate-100">
                  {group.endpoints.map((ep, i) => (
                    <div key={i} className="px-5 py-4 space-y-3">
                      <div className="flex items-start gap-3 flex-wrap">
                        <Badge className={methodColor(ep.method)}>{ep.method}</Badge>
                        <code className="font-mono text-sm text-slate-800 flex-1">{ep.path}</code>
                        {ep.scope !== 'public' && (
                          <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                            {ep.scope}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{ep.description}</p>

                      {ep.queryParams && (
                        <div className="rounded-lg bg-slate-50 p-3 space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Query Parameters</p>
                          {ep.queryParams.map((qp) => (
                            <div key={qp.name} className="flex gap-3">
                              <code className="w-24 shrink-0 font-mono text-xs text-brand-600">{qp.name}</code>
                              <span className="text-xs text-slate-600">{qp.description}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {ep.sampleBody && (
                        <div>
                          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sample Body</p>
                          <pre className="rounded-lg bg-slate-900 px-4 py-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                            {ep.sampleBody}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

          {/* Response format */}
          <Card>
            <h3 className="mb-3 text-sm font-bold text-slate-800">Response Format</h3>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">Success</p>
                <pre className="rounded-lg bg-slate-900 px-4 py-3 font-mono text-xs text-emerald-300 overflow-x-auto">{`{ "success": true, "data": [...], "meta": { "total": 50, "page": 1, "limit": 20 } }`}</pre>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">Error</p>
                <pre className="rounded-lg bg-slate-900 px-4 py-3 font-mono text-xs text-red-300 overflow-x-auto">{`{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Invalid or revoked API key." } }`}</pre>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Tab 3: Try It Out
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Request builder */}
          <Card>
            <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
              <Play className="h-4 w-4 text-brand-500" /> Request Builder
            </h3>

            <div className="space-y-4">
              {/* Endpoint selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">Endpoint</label>
                <select
                  value={`${tryEndpoint.method} ${tryEndpoint.path}`}
                  onChange={(e) => {
                    const found = ALL_ENDPOINTS.find((ep) => `${ep.method} ${ep.path}` === e.target.value)
                    if (found) {
                      setTryEndpoint(found)
                      setTryBody(found.sampleBody ?? '')
                      setTryResponse(null)
                      setTryStatus(null)
                    }
                  }}
                  className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
                >
                  {ENDPOINT_GROUPS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.endpoints.map((ep) => (
                        <option key={`${ep.method} ${ep.path}`} value={`${ep.method} ${ep.path}`}>
                          {ep.method} {ep.path}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Method + URL */}
              <div className="flex items-center gap-2 rounded-lg border border-[#dce8f7] bg-slate-50 px-3 py-2">
                <Badge className={methodColor(tryEndpoint.method)}>{tryEndpoint.method}</Badge>
                <code className="font-mono text-xs text-slate-700 flex-1 break-all">{tryEndpoint.path}</code>
              </div>

              {/* Scope */}
              {tryEndpoint.scope !== 'public' && (
                <div className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2">
                  <p className="text-xs text-violet-700">
                    <span className="font-semibold">Required scope: </span>{tryEndpoint.scope}
                  </p>
                </div>
              )}

              {/* API Key */}
              <Input
                label="API Key"
                placeholder="sis_live_xxxx… or leave blank for health check"
                value={tryApiKey}
                onChange={(e) => setTryApiKey(e.target.value)}
              />

              {/* Body */}
              {(tryEndpoint.method === 'POST' || tryEndpoint.method === 'PATCH') && (
                <Textarea
                  label="Request Body (JSON)"
                  value={tryBody}
                  onChange={(e) => setTryBody(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />
              )}

              <Button
                onClick={handleSendRequest}
                loading={tryLoading}
                icon={<Send className="h-4 w-4" />}
                className="w-full"
              >
                Send Request
              </Button>
            </div>
          </Card>

          {/* Response viewer */}
          <Card>
            <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-500" /> Response
            </h3>

            {tryResponse === null ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Send className="h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">Send a request to see the response here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status:</span>
                  <span className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-bold',
                    tryStatus && tryStatus < 300 ? 'bg-emerald-100 text-emerald-700' :
                    tryStatus && tryStatus < 500 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700',
                  )}>
                    {tryStatus}
                  </span>
                </div>
                <pre className="max-h-[400px] overflow-auto rounded-lg bg-slate-900 px-4 py-3 font-mono text-xs text-emerald-300 leading-relaxed">
                  {tryResponse}
                </pre>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Generate Key Modal
         ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showGenModal}
        onClose={closeGenModal}
        title="Generate New API Key"
        description="The full key will be shown once — store it securely."
        size="lg"
        footer={
          newKey ? (
            <Button onClick={closeGenModal}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={closeGenModal}>Cancel</Button>
              <Button
                onClick={handleGenerate}
                loading={generating}
                disabled={!genName.trim() || genScopes.size === 0}
              >
                Generate Key
              </Button>
            </>
          )
        }
      >
        {newKey ? (
          /* ── Success state: show the key ──────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">This key won&apos;t be shown again</p>
                <p className="mt-0.5 text-xs text-amber-700">Copy and store it in a safe place now.</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Your API Key</label>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-slate-900 px-4 py-3">
                <code className={cn('flex-1 font-mono text-sm break-all', showNewKey ? 'text-emerald-300' : 'text-emerald-300 blur-sm select-none')}>
                  {newKey}
                </code>
                <button
                  onClick={() => setShowNewKey((v) => !v)}
                  className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={async () => { await navigator.clipboard.writeText(newKey) }}
                  className="shrink-0 flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Use this key by setting:<br />
              <code className="font-mono text-brand-600">Authorization: Bearer {newKey.slice(0, 20)}…</code>
            </div>
          </div>
        ) : (
          /* ── Form ─────────────────────────────────────────────────────────── */
          <div className="space-y-5">
            <Input
              label="Key Name"
              placeholder="e.g. Mobile App Integration"
              value={genName}
              onChange={(e) => setGenName(e.target.value)}
            />

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700 tracking-wide">Scopes</p>
              <div className="space-y-4">
                {SCOPE_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.scopes.map((scope) => {
                        const info = API_SCOPES.find((s) => s.value === scope)
                        const active = genScopes.has(scope)
                        return (
                          <button
                            key={scope}
                            type="button"
                            onClick={() => toggleScope(scope)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ring-1 ring-inset',
                              active
                                ? 'bg-brand-500 text-white ring-brand-600 shadow-sm'
                                : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-brand-50 hover:text-brand-600 hover:ring-brand-200',
                            )}
                          >
                            {active && <Check className="h-3 w-3" />}
                            {info?.label ?? scope}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> Expiry Date
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="date"
                value={genExpiry}
                onChange={(e) => setGenExpiry(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15"
              />
            </div>

            {genScopes.size > 0 && (
              <div className="rounded-lg bg-brand-50 border border-brand-100 px-3 py-2">
                <p className="text-xs text-brand-700">
                  <span className="font-semibold">{genScopes.size} scope{genScopes.size > 1 ? 's' : ''} selected: </span>
                  {[...genScopes].join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Revoke confirmation ────────────────────────────────────────────────── */}
      <Modal
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        title="Revoke API Key"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRevokeId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevoke} loading={revoking} icon={<Trash2 className="h-4 w-4" />}>
              Revoke Key
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Revoking this key will immediately invalidate all requests using it. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
