'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock, Circle, BadgeCheck, User, Calendar, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { MOCK_HR_ONBOARDING, MOCK_HR_EMPLOYEES } from '@/lib/mock-data'
import { SectionTitle } from '@/components/ui/Card'
import { cn, formatDate, initials } from '@/lib/utils'
import type { HROnboardingRecord, OnboardingTask } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600 ring-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-200',
  COMPLETED:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const TASK_CATEGORIES = ['Documents', 'System Access', 'Orientation', 'HR & Legal', 'Other']

export default function OnboardingPage() {
  const [records, setRecords] = useState<HROnboardingRecord[]>(MOCK_HR_ONBOARDING)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['onboard_1']))
  const [addTaskFor, setAddTaskFor] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ title: '', category: 'Documents', dueDate: '', assignedTo: '' })
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')

  const employees = MOCK_HR_EMPLOYEES
  const employeesWithOnboarding = new Set(records.map((r) => r.employeeId))

  function toggleTask(recordId: string, taskId: string) {
    setRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r
      const tasks = r.tasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : undefined } : t
      )
      const done = tasks.filter((t) => t.isCompleted).length
      const rec: HROnboardingRecord = {
        ...r, tasks, completedTasksCount: done,
        status: done === tasks.length ? 'COMPLETED' : done > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      }
      Object.assign(MOCK_HR_ONBOARDING.find((x) => x.id === recordId) ?? {}, rec)
      return rec
    }))
  }

  function addTask(recordId: string) {
    if (!newTask.title.trim()) return
    setRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r
      const task: OnboardingTask = {
        id: `task_${Date.now()}`, title: newTask.title.trim(),
        category: newTask.category, isCompleted: false,
        dueDate: newTask.dueDate || undefined, assignedTo: newTask.assignedTo || undefined,
      }
      const tasks = [...r.tasks, task]
      const rec = { ...r, tasks, totalTasksCount: tasks.length }
      Object.assign(MOCK_HR_ONBOARDING.find((x) => x.id === recordId) ?? {}, rec)
      return rec
    }))
    setNewTask({ title: '', category: 'Documents', dueDate: '', assignedTo: '' })
    setAddTaskFor(null)
  }

  function startOnboarding() {
    if (!selectedEmployee) return
    const emp = employees.find((e) => e.id === selectedEmployee)
    if (!emp) return
    const record: HROnboardingRecord = {
      id: `onboard_${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      startDate: emp.startDate,
      status: 'NOT_STARTED',
      tasks: [
        { id: `task_${Date.now()}_1`, title: 'Submit Government IDs', category: 'Documents', isCompleted: false, dueDate: emp.startDate },
        { id: `task_${Date.now()}_2`, title: 'Sign Employment Contract', category: 'HR & Legal', isCompleted: false },
        { id: `task_${Date.now()}_3`, title: 'IT Account Setup', category: 'System Access', isCompleted: false, assignedTo: 'IT Services' },
        { id: `task_${Date.now()}_4`, title: 'Department Orientation', category: 'Orientation', isCompleted: false },
        { id: `task_${Date.now()}_5`, title: 'Biometrics Enrollment', category: 'System Access', isCompleted: false, assignedTo: 'HR' },
      ],
      completedTasksCount: 0, totalTasksCount: 5,
    }
    MOCK_HR_ONBOARDING.push(record)
    setRecords([...MOCK_HR_ONBOARDING])
    setAddEmployeeOpen(false)
    setSelectedEmployee('')
    setExpanded((prev) => new Set([...prev, record.id]))
  }

  const totalComplete = records.filter((r) => r.status === 'COMPLETED').length
  const totalInProgress = records.filter((r) => r.status === 'IN_PROGRESS').length

  return (
    <div className="space-y-6">
      <SectionTitle
        description={`${records.length} onboarding records · ${totalInProgress} in progress · ${totalComplete} completed`}
        actions={
          <button onClick={() => setAddEmployeeOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
            <Plus className="h-3.5 w-3.5" /> Start Onboarding
          </button>
        }
      >
        Onboarding
      </SectionTitle>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: records.length, color: 'brand' },
          { label: 'In Progress', value: totalInProgress, color: 'blue' },
          { label: 'Completed', value: totalComplete, color: 'emerald' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-[#e4ebf5] px-5 py-4">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#e4ebf5] py-20 text-center">
          <BadgeCheck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No onboarding records yet.</p>
          <p className="text-slate-400 text-sm mt-1">Click "Start Onboarding" to begin tracking a new employee.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const isExpanded = expanded.has(record.id)
            const pct = record.totalTasksCount > 0 ? Math.round((record.completedTasksCount / record.totalTasksCount) * 100) : 0
            const byCategory: Record<string, typeof record.tasks> = {}
            record.tasks.forEach((t) => { if (!byCategory[t.category]) byCategory[t.category] = []; byCategory[t.category].push(t) })

            return (
              <div key={record.id} className="rounded-2xl bg-white border border-[#e4ebf5] overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpanded((prev) => { const next = new Set(prev); isExpanded ? next.delete(record.id) : next.add(record.id); return next })}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#f3f6fb] transition-colors text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 shrink-0">
                    <User className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{record.employeeName}</p>
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', STATUS_COLORS[record.status])}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 max-w-48 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-500">{record.completedTasksCount}/{record.totalTasksCount} tasks · {pct}%</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Start: {formatDate(record.startDate)}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>

                {/* Tasks */}
                {isExpanded && (
                  <div className="border-t border-[#e4ebf5] px-5 py-4 space-y-4">
                    {Object.entries(byCategory).map(([cat, tasks]) => (
                      <div key={cat}>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{cat}</p>
                        <div className="space-y-2">
                          {tasks.map((task) => (
                            <div key={task.id}
                              className={cn('flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                                task.isCompleted ? 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50' : 'border-[#e4ebf5] hover:bg-[#f3f6fb]')}
                              onClick={() => toggleTask(record.id, task.id)}
                            >
                              <div className="mt-0.5 shrink-0">
                                {task.isCompleted
                                  ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                                  : <Circle className="h-4.5 w-4.5 text-slate-300" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn('text-sm font-medium', task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800')}>{task.title}</p>
                                <div className="flex flex-wrap gap-3 mt-0.5">
                                  {task.dueDate && <p className="text-xs text-slate-500">Due: {formatDate(task.dueDate)}</p>}
                                  {task.assignedTo && <p className="text-xs text-slate-400">Assigned to: {task.assignedTo}</p>}
                                  {task.completedAt && <p className="text-xs text-emerald-600">Completed: {formatDate(task.completedAt)}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Add task form */}
                    {addTaskFor === record.id ? (
                      <div className="rounded-xl border border-dashed border-brand-300 bg-brand-50/30 p-4 space-y-3">
                        <p className="text-xs font-semibold text-brand-700">New Task</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                              className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                          </div>
                          <select value={newTask.category} onChange={(e) => setNewTask((p) => ({ ...p, category: e.target.value }))}
                            className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                            {TASK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                          </select>
                          <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                            className="rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                          <input placeholder="Assigned to (optional)" value={newTask.assignedTo} onChange={(e) => setNewTask((p) => ({ ...p, assignedTo: e.target.value }))}
                            className="col-span-2 rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addTask(record.id)}
                            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">Add Task</button>
                          <button onClick={() => setAddTaskFor(null)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddTaskFor(record.id)}
                        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium">
                        <Plus className="h-3.5 w-3.5" /> Add Task
                      </button>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Link href={`/staff/hr/employees/${record.employeeId}`}
                        className="text-xs text-brand-600 hover:underline font-medium">View Employee Profile →</Link>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Start Onboarding Modal */}
      {addEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={() => setAddEmployeeOpen(false)} />
          <div className="relative w-[440px] rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-l-[3px] border-brand-500 px-5 py-4">
              <p className="text-sm font-bold text-slate-900">Start Employee Onboarding</p>
              <p className="text-xs text-slate-500 mt-0.5">Select an employee to create an onboarding checklist.</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Select Employee</label>
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full rounded-lg border border-[#dce8f7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/15">
                  <option value="">— Choose employee —</option>
                  {employees.filter((e) => !employeesWithOnboarding.has(e.id)).map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>
                  ))}
                </select>
                {employees.filter((e) => !employeesWithOnboarding.has(e.id)).length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">All employees already have onboarding records.</p>
                )}
              </div>
              <p className="text-xs text-slate-400">A default 5-task checklist will be created. You can add more tasks after.</p>
            </div>
            <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
              <button onClick={() => setAddEmployeeOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={startOnboarding} disabled={!selectedEmployee}
                className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40">
                Start Onboarding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
