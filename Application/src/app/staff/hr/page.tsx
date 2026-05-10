'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase, Users, Calendar, LayoutDashboard,
  Plus, ArrowRight, CheckCircle, Clock, TrendingUp, UserCheck,
} from 'lucide-react'
import { SectionTitle, Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  MOCK_HR_EMPLOYEES,
  MOCK_JOB_POSTINGS,
  MOCK_JOB_APPLICATIONS,
  MOCK_HR_LEAVES,
} from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import type { AtsStage, HRLeaveType, JobPostingStatus } from '@/types'

const ATS_STAGES: AtsStage[] = [
  'NEW',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'FINAL_EVALUATION',
  'HIRED',
]

const ATS_STAGE_LABELS: Record<AtsStage, string> = {
  NEW: 'New',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview\nScheduled',
  INTERVIEW_COMPLETED: 'Interview\nCompleted',
  FINAL_EVALUATION: 'Final\nEvaluation',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
}

const ATS_STAGE_COLORS: Record<AtsStage, string> = {
  NEW: 'bg-slate-100 text-slate-600 ring-slate-200',
  SCREENING: 'bg-blue-50 text-blue-700 ring-blue-200',
  SHORTLISTED: 'bg-violet-50 text-violet-700 ring-violet-200',
  INTERVIEW_SCHEDULED: 'bg-amber-50 text-amber-700 ring-amber-200',
  INTERVIEW_COMPLETED: 'bg-orange-50 text-orange-700 ring-orange-200',
  FINAL_EVALUATION: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  HIRED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
}

const JOB_STATUS_COLORS: Record<JobPostingStatus, string> = {
  OPEN: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
  DRAFT: 'bg-amber-50 text-amber-700 ring-amber-200',
  FILLED: 'bg-blue-50 text-blue-700 ring-blue-200',
}

const LEAVE_TYPE_COLORS: Record<HRLeaveType, string> = {
  SICK: 'bg-red-50 text-red-700 ring-red-200',
  VACATION: 'bg-blue-50 text-blue-700 ring-blue-200',
  EMERGENCY: 'bg-amber-50 text-amber-700 ring-amber-200',
  MATERNITY: 'bg-pink-50 text-pink-700 ring-pink-200',
  PATERNITY: 'bg-pink-50 text-pink-700 ring-pink-200',
}

const LEAVE_TYPE_LABELS: Record<HRLeaveType, string> = {
  SICK: 'Sick Leave',
  VACATION: 'Vacation',
  EMERGENCY: 'Emergency',
  MATERNITY: 'Maternity',
  PATERNITY: 'Paternity',
}

const QUICK_ACTIONS = [
  {
    label: 'Post New Job',
    desc: 'Create a new job posting',
    href: '/staff/hr/jobs',
    icon: Briefcase,
    color: 'bg-blue-50 text-blue-600 ring-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    label: 'View Applications',
    desc: 'Manage ATS pipeline',
    href: '/staff/hr/recruitment',
    icon: LayoutDashboard,
    color: 'bg-violet-50 text-violet-600 ring-violet-100',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    label: 'Manage Employees',
    desc: 'Employee directory',
    href: '/staff/hr/employees',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Leave Requests',
    desc: 'Review pending leaves',
    href: '/staff/hr/leaves',
    icon: Calendar,
    color: 'bg-amber-50 text-amber-600 ring-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
  },
]

export default function HRDashboardPage() {
  const totalEmployees   = MOCK_HR_EMPLOYEES.length
  const activeEmployees  = MOCK_HR_EMPLOYEES.filter((e) => e.status === 'ACTIVE').length
  const openPostings     = MOCK_JOB_POSTINGS.filter((j) => j.status === 'OPEN').length
  const pendingLeaves    = MOCK_HR_LEAVES.filter((l) => l.status === 'PENDING').length

  const recentPostings = [...MOCK_JOB_POSTINGS].slice(0, 4)
  const pendingLeaveList = MOCK_HR_LEAVES.filter((l) => l.status === 'PENDING')

  const stageCounts = ATS_STAGES.reduce<Record<AtsStage, number>>(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<AtsStage, number>,
  )
  MOCK_JOB_APPLICATIONS.forEach((a) => {
    if (a.stage in stageCounts) stageCounts[a.stage as AtsStage]++
  })

  return (
    <div className="space-y-6">
      <SectionTitle description="Overview of HR activities, open positions, and workforce data.">
        HR Dashboard
      </SectionTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={totalEmployees}
          icon={Users}
          color="bg-brand-50 text-brand-500"
        />
        <StatCard
          label="Active Employees"
          value={activeEmployees}
          icon={UserCheck}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Open Job Postings"
          value={openPostings}
          icon={Briefcase}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Pending Leave Requests"
          value={pendingLeaves}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card hover className="h-full">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${action.iconBg}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{action.desc}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-500">
                Go <ArrowRight className="h-3 w-3" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="none">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#e4ebf5]">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Recent Job Postings</h3>
              <p className="text-xs text-slate-500 mt-0.5">{recentPostings.length} of {MOCK_JOB_POSTINGS.length} postings</p>
            </div>
            <Link href="/staff/hr/jobs" className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#f0f4fa]">
            {recentPostings.map((job) => {
              const appCount = MOCK_JOB_APPLICATIONS.filter((a) => a.jobId === job.id).length
              return (
                <div key={job.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-brand-50/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">{appCount} applicant{appCount !== 1 ? 's' : ''}</span>
                    <Badge className={JOB_STATUS_COLORS[job.status]}>{job.status}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card padding="none">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#e4ebf5]">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Pending Leave Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">{pendingLeaveList.length} pending</p>
            </div>
            <Link href="/staff/hr/leaves" className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#f0f4fa]">
            {pendingLeaveList.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No pending leave requests.</div>
            )}
            {pendingLeaveList.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-brand-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{leave.employeeName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.totalDays}d
                  </p>
                </div>
                <Badge className={LEAVE_TYPE_COLORS[leave.leaveType]}>
                  {LEAVE_TYPE_LABELS[leave.leaveType]}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 border-b border-[#e4ebf5]">
          <h3 className="text-sm font-semibold text-slate-800">ATS Pipeline Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {MOCK_JOB_APPLICATIONS.filter((a) => a.stage !== 'REJECTED').length} active candidates across all stages
          </p>
        </div>
        <div className="px-5 py-5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {ATS_STAGES.map((stage, idx) => (
              <div key={stage} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-1 ring-inset ${ATS_STAGE_COLORS[stage]}`}>
                    {stageCounts[stage]}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 text-center whitespace-pre-line leading-tight max-w-[64px]">
                    {ATS_STAGE_LABELS[stage]}
                  </span>
                </div>
                {idx < ATS_STAGES.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mb-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
