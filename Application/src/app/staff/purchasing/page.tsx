'use client'

import { SectionTitle, Card, StatCard, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MOCK_PURCHASE_REQUESTS, MOCK_PURCHASE_ORDERS } from '@/lib/mock-data'
import type { PRStatus, POStatus, PRPriority } from '@/types'
import { ShoppingCart, Package, CheckCircle2, Truck, Clock, Store } from 'lucide-react'
import Link from 'next/link'

const PR_STATUS_MAP: Record<PRStatus, { label: string; cls: string }> = {
  DRAFT:               { label: 'Draft',              cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  SUBMITTED:           { label: 'Submitted',          cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  UNDER_REVIEW:        { label: 'Under Review',       cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  APPROVED:            { label: 'Approved',           cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REJECTED:            { label: 'Rejected',           cls: 'bg-red-50 text-red-700 ring-red-200' },
  PROCUREMENT_ONGOING: { label: 'Procurement',        cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELIVERED:           { label: 'Delivered',          cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  CLOSED:              { label: 'Closed',             cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  CANCELLED:           { label: 'Cancelled',          cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
}

const PR_PRIORITY_MAP: Record<PRPriority, { label: string; cls: string }> = {
  LOW:    { label: 'Low',    cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  NORMAL: { label: 'Normal', cls: 'bg-blue-50 text-blue-600 ring-blue-200' },
  HIGH:   { label: 'High',   cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  URGENT: { label: 'Urgent', cls: 'bg-red-50 text-red-600 ring-red-200' },
}

const PO_STATUS_MAP: Record<POStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  SENT:      { label: 'Sent',      cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELIVERED: { label: 'Delivered', cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  CLOSED:    { label: 'Closed',    cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
}

export default function PurchasingDashboard() {
  const pendingPRs  = MOCK_PURCHASE_REQUESTS.filter(p => ['SUBMITTED','UNDER_REVIEW'].includes(p.status)).length
  const approvedPRs = MOCK_PURCHASE_REQUESTS.filter(p => p.status === 'APPROVED').length
  const activePOs   = MOCK_PURCHASE_ORDERS.filter(p => ['SENT','CONFIRMED'].includes(p.status)).length
  const deliveredThis = MOCK_PURCHASE_ORDERS.filter(p => p.status === 'DELIVERED' && p.deliveredAt?.startsWith('2025')).length

  const recentPRs = [...MOCK_PURCHASE_REQUESTS].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,5)
  const activePOList = MOCK_PURCHASE_ORDERS.filter(p => ['SENT','CONFIRMED','DELIVERED'].includes(p.status))

  return (
    <div className="space-y-6">
      <SectionTitle description="Overview of purchase requests, orders, and vendor activity.">Purchasing Dashboard</SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending PRs"      value={pendingPRs}   icon={Clock}         color="bg-amber-50 text-amber-600"/>
        <StatCard label="Approved PRs"     value={approvedPRs}  icon={CheckCircle2}  color="bg-emerald-50 text-emerald-600"/>
        <StatCard label="Active POs"       value={activePOs}    icon={Package}       color="bg-brand-50 text-brand-500"/>
        <StatCard label="Delivered (2025)" value={deliveredThis} icon={Truck}        color="bg-teal-50 text-teal-600"/>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Review Requests',   href: '/staff/purchasing/requests', icon: ShoppingCart, desc: 'Approve or reject PRs' },
          { label: 'Purchase Orders',   href: '/staff/purchasing/orders',   icon: Package,      desc: 'Create & track POs' },
          { label: 'Vendor Registry',   href: '/staff/purchasing/vendors',  icon: Store,        desc: 'Manage suppliers' },
          { label: 'PR Requests (All)', href: '/staff/purchasing/requests', icon: Clock,        desc: 'All PR submissions' },
        ].map(a => (
          <Link key={a.href+a.label} href={a.href}>
            <Card hover className="flex flex-col gap-2 h-full">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                <a.icon className="h-4 w-4"/>
              </div>
              <p className="font-semibold text-slate-800 text-sm">{a.label}</p>
              <p className="text-xs text-slate-400">{a.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent PRs */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
            <CardTitle>Recent Purchase Requests</CardTitle>
            <Link href="/staff/purchasing/requests" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          <Table>
            <Thead>
              <Th>PR #</Th>
              <Th>Title</Th>
              <Th>Priority</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
            </Thead>
            <Tbody>
              {recentPRs.map(pr => {
                const s = PR_STATUS_MAP[pr.status]
                const p = PR_PRIORITY_MAP[pr.priority]
                return (
                  <Tr key={pr.id}>
                    <Td><span className="font-mono text-xs text-brand-600 font-semibold">{pr.prNumber}</span></Td>
                    <Td><p className="max-w-[140px] truncate font-medium text-slate-800">{pr.title}</p></Td>
                    <Td><Badge className={p.cls}>{p.label}</Badge></Td>
                    <Td><span className="font-semibold">{formatCurrency(pr.totalAmount)}</span></Td>
                    <Td><Badge className={s.cls}>{s.label}</Badge></Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>

        {/* Active POs */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4ebf5]">
            <CardTitle>Active Purchase Orders</CardTitle>
            <Link href="/staff/purchasing/orders" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          {activePOList.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No active orders.</div>
          ) : (
            <Table>
              <Thead>
                <Th>PO #</Th>
                <Th>Vendor</Th>
                <Th>Amount</Th>
                <Th>Delivery</Th>
                <Th>Status</Th>
              </Thead>
              <Tbody>
                {activePOList.map(po => {
                  const s = PO_STATUS_MAP[po.status]
                  const overdue = po.deliveryDate && po.status !== 'DELIVERED' && new Date(po.deliveryDate) < new Date()
                  return (
                    <Tr key={po.id}>
                      <Td><span className="font-mono text-xs text-brand-600 font-semibold">{po.poNumber}</span></Td>
                      <Td className="max-w-[130px]"><p className="truncate text-slate-800">{po.vendorName}</p></Td>
                      <Td><span className="font-semibold">{formatCurrency(po.totalAmount)}</span></Td>
                      <Td>
                        {po.deliveryDate ? (
                          <span className={overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                            {formatDate(po.deliveryDate)}{overdue ? ' ⚠' : ''}
                          </span>
                        ) : '—'}
                      </Td>
                      <Td><Badge className={s.cls}>{s.label}</Badge></Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
