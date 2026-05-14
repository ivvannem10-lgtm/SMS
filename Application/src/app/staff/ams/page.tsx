'use client'

import Link from 'next/link'
import {
  Package, PackageSearch, ArchiveRestore, ShoppingBag,
  Boxes, CheckCircle2, ArrowRightLeft, Wrench, AlertTriangle, Clock,
  ChevronRight, ShieldAlert,
} from 'lucide-react'
import { SectionTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import {
  MOCK_ASSETS,
  MOCK_ASSET_DEPLOYMENTS,
  MOCK_ASSET_HISTORY,
  MOCK_CONSUMABLES,
} from '@/lib/mock-data'
import type { AssetStatus, AssetActivityType } from '@/types'

const TODAY = new Date('2026-05-10')

function isOverdue(expectedReturnDate?: string) {
  if (!expectedReturnDate) return false
  return new Date(expectedReturnDate) < TODAY
}

const activeDeployments = MOCK_ASSET_DEPLOYMENTS.filter(d => d.status === 'ACTIVE')
const overdueCount = activeDeployments.filter(d => isOverdue(d.expectedReturnDate)).length

const statCards = [
  {
    label: 'Total Assets',
    value: MOCK_ASSETS.length,
    icon: Boxes,
    color: 'bg-brand-50 text-brand-500',
  },
  {
    label: 'Available',
    value: MOCK_ASSETS.filter(a => a.status === 'AVAILABLE').length,
    icon: CheckCircle2,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Deployed / In Use',
    value: MOCK_ASSETS.filter(a => a.status === 'DEPLOYED' || a.status === 'IN_USE').length,
    icon: Package,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    label: 'Borrowed',
    value: MOCK_ASSETS.filter(a => a.status === 'BORROWED').length,
    icon: ArrowRightLeft,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Under Maintenance',
    value: MOCK_ASSETS.filter(a => a.status === 'UNDER_MAINTENANCE').length,
    icon: Wrench,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Overdue',
    value: overdueCount,
    icon: AlertTriangle,
    color: 'bg-rose-50 text-rose-600',
  },
]

const quickActions = [
  {
    label: 'Register Asset',
    desc: 'Add a new asset to the registry',
    href: '/staff/ams/assets/new',
    icon: Package,
    color: 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
    border: 'border-brand-100 hover:border-brand-300',
  },
  {
    label: 'View All Assets',
    desc: 'Browse the full asset inventory',
    href: '/staff/ams/assets',
    icon: PackageSearch,
    color: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
    border: 'border-violet-100 hover:border-violet-300',
  },
  {
    label: 'Borrow & Deploy',
    desc: 'Record a borrow or deployment',
    href: '/staff/ams/borrow',
    icon: ArchiveRestore,
    color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    border: 'border-emerald-100 hover:border-emerald-300',
  },
  {
    label: 'Consumables',
    desc: 'Manage consumable supplies',
    href: '/staff/ams/consumables',
    icon: ShoppingBag,
    color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    border: 'border-amber-100 hover:border-amber-300',
  },
]

const ACTIVITY_COLORS: Record<AssetActivityType, string> = {
  REGISTERED:             'bg-emerald-50 text-emerald-700 ring-emerald-200',
  BORROWED:               'bg-blue-50 text-blue-700 ring-blue-200',
  RETURNED:               'bg-emerald-50 text-emerald-700 ring-emerald-200',
  DEPLOYED:               'bg-violet-50 text-violet-700 ring-violet-200',
  MAINTENANCE_STARTED:    'bg-amber-50 text-amber-700 ring-amber-200',
  MAINTENANCE_COMPLETED:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  STATUS_CHANGED:         'bg-slate-100 text-slate-600 ring-slate-200',
  CUSTODIAN_CHANGED:      'bg-slate-100 text-slate-600 ring-slate-200',
  DAMAGED:                'bg-orange-50 text-orange-700 ring-orange-200',
  LOST:                   'bg-red-50 text-red-700 ring-red-200',
  RETIRED:                'bg-slate-100 text-slate-600 ring-slate-200',
}

const ACTIVITY_LABELS: Record<AssetActivityType, string> = {
  REGISTERED:             'Registered',
  BORROWED:               'Borrowed',
  RETURNED:               'Returned',
  DEPLOYED:               'Deployed',
  MAINTENANCE_STARTED:    'Maint. Started',
  MAINTENANCE_COMPLETED:  'Maint. Done',
  STATUS_CHANGED:         'Status Changed',
  CUSTODIAN_CHANGED:      'Custodian Changed',
  DAMAGED:                'Damaged',
  LOST:                   'Lost',
  RETIRED:                'Retired',
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

function daysUntilExpiry(dateStr: string) {
  const expiry = new Date(dateStr)
  return Math.ceil((expiry.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
}

const warrantyAssets = MOCK_ASSETS.filter(a => {
  if (!a.warrantyExpiry) return false
  const days = daysUntilExpiry(a.warrantyExpiry)
  return days >= 0 && days <= 180
})

const lowStockConsumables = MOCK_CONSUMABLES.filter(c => c.quantity <= c.lowStockThreshold)

const recentActivity = [...MOCK_ASSET_HISTORY]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5)

export default function AMSDashboardPage() {
  return (
    <div className="space-y-6">
      <SectionTitle description="Overview of all school assets, deployments, and consumable stocks.">
        Asset Management
      </SectionTitle>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {statCards.map((s, i) => {
          const href = i === 0 ? '/staff/ams/assets'
            : i === 1 ? '/staff/ams/assets?status=AVAILABLE'
            : i === 2 ? '/staff/ams/assets?status=DEPLOYED'
            : i === 3 ? '/staff/ams/borrow'
            : i === 4 ? '/staff/ams/maintenance'
            : '/staff/ams/borrow?tab=overdue'
          return (
            <Link key={s.label} href={href}
              className="group rounded-2xl bg-white border border-[#e4ebf5] p-5 flex items-start gap-4 hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/5 transition-all cursor-pointer">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110', s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-tight group-hover:text-brand-600 transition-colors">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums leading-none">{s.value}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickActions.map(q => (
          <Link
            key={q.href}
            href={q.href}
            className={cn(
              'group rounded-2xl bg-white border p-5 flex flex-col gap-3 transition-all hover:shadow-card-md hover:-translate-y-px',
              q.border,
            )}
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-colors', q.color)}>
              <q.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{q.label}</p>
              <p className="mt-0.5 text-xs text-slate-500 leading-tight">{q.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors self-end mt-auto" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e4ebf5]">
            <h2 className="text-sm font-semibold text-slate-800">Recent Asset Activity</h2>
          </div>
          <div className="divide-y divide-[#f0f4fa]">
            {recentActivity.map(h => (
              <div key={h.id} className="px-5 py-3.5 flex items-center gap-3">
                <Badge className={cn('shrink-0 text-[10px]', ACTIVITY_COLORS[h.activityType])}>
                  {ACTIVITY_LABELS[h.activityType]}
                </Badge>
                <span className="font-mono text-xs text-brand-600 shrink-0">{h.assetTag}</span>
                <span className="text-xs text-slate-600 truncate flex-1">{h.user ?? h.department ?? '—'}</span>
                <span className="text-xs text-slate-400 shrink-0">{formatDate(h.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e4ebf5]">
            <h2 className="text-sm font-semibold text-slate-800">Active Deployments</h2>
          </div>
          <div className="divide-y divide-[#f0f4fa]">
            {activeDeployments.length === 0 && (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No active deployments.</p>
            )}
            {activeDeployments.map(d => {
              const overdue = isOverdue(d.expectedReturnDate)
              return (
                <div key={d.id} className={cn('px-5 py-3.5', overdue && 'bg-rose-50/50')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{d.assetName}</p>
                      <p className="text-xs font-mono text-brand-600">{d.assetTag}</p>
                    </div>
                    {overdue && (
                      <Badge className="bg-rose-50 text-rose-700 ring-rose-200 shrink-0 text-[10px]">Overdue</Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                    <span>{d.borrowerName}</span>
                    {d.expectedReturnDate && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className={cn(overdue ? 'text-rose-600 font-medium' : '')}>
                          Due {formatDate(d.expectedReturnDate)}
                        </span>
                      </>
                    )}
                    {!d.expectedReturnDate && <span className="text-slate-400 italic">No return date</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e4ebf5] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Low Stock Consumables</h2>
            <Link href="/staff/ams/consumables" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          {lowStockConsumables.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All consumables are well stocked.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4fa]">
              {lowStockConsumables.map(c => {
                const pct = Math.min(100, Math.round((c.quantity / c.lowStockThreshold) * 100))
                return (
                  <div key={c.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                      <span className="text-xs text-rose-600 font-semibold tabular-nums">
                        {c.quantity} / {c.lowStockThreshold} {c.unit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e4ebf5] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">Warranty Alerts</h2>
          </div>
          {warrantyAssets.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No warranties expiring within 180 days.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f4fa]">
              {warrantyAssets.map(a => {
                const days = daysUntilExpiry(a.warrantyExpiry!)
                const badgeCls = days < 30
                  ? 'bg-red-50 text-red-700 ring-red-200'
                  : days < 90
                    ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                const badgeLabel = days < 30 ? 'Expiring Soon' : days < 90 ? 'Expiring' : 'Valid'
                return (
                  <div key={a.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.name}</p>
                      <p className="text-xs font-mono text-brand-600">{a.assetTag}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{formatDate(a.warrantyExpiry)}</span>
                        <span className="text-xs text-slate-400">· {days}d left</span>
                      </div>
                    </div>
                    <Badge className={cn('shrink-0 text-[10px]', badgeCls)}>{badgeLabel}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
