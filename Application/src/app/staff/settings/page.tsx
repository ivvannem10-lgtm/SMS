'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle2, AlertCircle, Bell, Mail, Shield, Lock, FileText, ExternalLink, ChevronRight } from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function SettingsPage() {
  // Password
  const [pwForm,     setPwForm]     = useState({ current: '', newPw: '', confirm: '' })
  const [showPw,     setShowPw]     = useState({ current: false, newPw: false, confirm: false })
  const [pwSaving,   setPwSaving]   = useState(false)
  const [pwResult,   setPwResult]   = useState<'success' | 'error' | null>(null)
  const [pwError,    setPwError]    = useState('')

  // Notifications
  const [notifs, setNotifs] = useState({
    applicantSubmissions: true,
    statusChanges:        true,
    documentUploads:      true,
    followUpReminders:    true,
    systemAlerts:         false,
  })
  const [notifSaved, setNotifSaved] = useState(false)

  async function handlePasswordChange() {
    setPwResult(null)
    if (!pwForm.current.trim()) { setPwError('Current password is required.'); setPwResult('error'); return }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); setPwResult('error'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); setPwResult('error'); return }
    // Mock: accept 'password' as current
    if (pwForm.current !== 'password') { setPwError('Current password is incorrect.'); setPwResult('error'); return }
    setPwSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setPwSaving(false)
    setPwResult('success')
    setPwForm({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwResult(null), 4000)
  }

  function saveNotifs() {
    try { localStorage.setItem('sis_notif_prefs', JSON.stringify(notifs)) } catch { /* ignore */ }
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 3000)
  }

  const pwValid = pwForm.current && pwForm.newPw.length >= 6 && pwForm.newPw === pwForm.confirm

  return (
    <div className="max-w-xl space-y-5">
      <SectionTitle description="Manage your account security and preferences">
        Settings
      </SectionTitle>

      {/* Change Password */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
            <Lock className="h-4.5 w-4.5 text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
            <p className="text-xs text-slate-400">Use a strong password you don't use elsewhere.</p>
          </div>
        </div>

        {pwResult === 'success' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-800">Password changed successfully.</p>
          </div>
        )}
        {pwResult === 'error' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{pwError}</p>
          </div>
        )}

        <div className="space-y-3">
          {(['current', 'newPw', 'confirm'] as const).map((field) => {
            const labels = { current: 'Current Password', newPw: 'New Password', confirm: 'Confirm New Password' }
            return (
              <div key={field} className="relative">
                <Input
                  label={labels[field]}
                  type={showPw[field] ? 'text' : 'password'}
                  value={pwForm[field]}
                  onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                />
                <button
                  onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                  className="absolute right-3 bottom-[9px] text-slate-400 hover:text-slate-600"
                >
                  {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )
          })}
          <div className="pt-1">
            <Button onClick={handlePasswordChange} loading={pwSaving} disabled={!pwValid} icon={<Shield className="h-4 w-4" />}>
              Update Password
            </Button>
          </div>
          <p className="text-xs text-slate-400">Demo hint: current password is <code className="bg-slate-100 px-1 rounded">password</code></p>
        </div>
      </Card>

      {/* Notification preferences */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Bell className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Notification Preferences</h3>
            <p className="text-xs text-slate-400">Choose which alerts you want to receive.</p>
          </div>
        </div>

        {notifSaved && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-800">Notification preferences saved.</p>
          </div>
        )}

        <div className="space-y-4">
          {([
            { key: 'applicantSubmissions', label: 'Applicant Submissions',  desc: 'When a new application is submitted via the portal' },
            { key: 'statusChanges',        label: 'Status Changes',         desc: 'When an applicant status is updated' },
            { key: 'documentUploads',      label: 'Document Uploads',       desc: 'When documents are attached to an applicant' },
            { key: 'followUpReminders',    label: 'Follow-up Reminders',    desc: 'CRM follow-ups due today (shown in bell icon)' },
            { key: 'systemAlerts',         label: 'System Alerts',          desc: 'System-wide announcements and maintenance notices' },
          ] as const).map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <Toggle
                checked={notifs[item.key]}
                onChange={(v) => setNotifs((p) => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-[#f0f4fa]">
          <Button size="sm" variant="soft" onClick={saveNotifs} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
            Save Preferences
          </Button>
        </div>
      </Card>

      {/* Account info */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <Mail className="h-4 w-4 text-slate-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Account Information</h3>
        </div>
        <div className="rounded-xl border border-[#e4ebf5] overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-[#f0f4fa]">
              <tr>
                <td className="py-2.5 pl-4 pr-3 w-32 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-[#f8fafd]">Account Type</td>
                <td className="py-2.5 pl-3 pr-4 text-sm text-slate-700">Staff (Demo)</td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-[#f8fafd]">Auth Method</td>
                <td className="py-2.5 pl-3 pr-4 text-sm text-slate-700">Credentials</td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-[#f8fafd]">Session</td>
                <td className="py-2.5 pl-3 pr-4 text-sm text-emerald-600 font-semibold">Active</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Terms & Legal */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
            <FileText className="h-4.5 w-4.5 text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Terms & Legal</h3>
            <p className="text-xs text-slate-400">Review the policies governing your use of this system.</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4ebf5] overflow-hidden divide-y divide-[#f0f4fa]">
          <Link href="/terms" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-brand-50/50 transition-colors group">
            <div>
              <p className="text-sm font-semibold text-slate-800">Terms of Service</p>
              <p className="text-xs text-slate-400 mt-0.5">Legal Master Policy Framework — Version 1.0, Effective May 10, 2026</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors shrink-0" />
          </Link>
          <div className="px-4 py-3.5 bg-[#f8fafd]">
            <p className="text-xs text-slate-500 leading-relaxed">
              By continuing to use the SMS School Management System, you acknowledge that you have read, understood, and agree to be bound by the Terms of Service. All activity within this system is subject to audit logging in accordance with Section 9 of the Terms.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Data Governance', desc: 'Section 03', href: '/terms#section-03' },
            { label: 'Acceptable Use', desc: 'Section 06', href: '/terms#section-06' },
            { label: 'Audit & Monitoring', desc: 'Section 09', href: '/terms#section-09' },
          ].map((item) => (
            <Link key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#e4ebf5] px-3.5 py-3 hover:bg-brand-50 hover:border-brand-200 transition-colors group">
              <div>
                <p className="text-xs font-semibold text-slate-700 group-hover:text-brand-700">{item.label}</p>
                <p className="text-2xs text-slate-400">{item.desc}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-500 shrink-0" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
