'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Camera, CheckCircle2, User, Mail, Phone, Cake, Briefcase, Building2, Edit2, X } from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { ROLE_LABELS } from '@/lib/utils'
import { loadProfile, saveProfile } from '@/app/providers'
import type { UserProfile } from '@/app/providers'

export default function StaffProfilePage() {
  const { data: session } = useSession()
  const user   = session?.user as { name?: string; email?: string; role?: string; schoolName?: string; deanDepartment?: string; id?: string } | undefined
  const userId = user?.id ?? 'default'

  const [editing, setEditing]   = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [profile, setProfile]   = useState<UserProfile>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProfile(loadProfile(userId))
  }, [userId])

  function update(key: keyof UserProfile, value: string) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setProfile((p) => ({ ...p, photoDataUrl: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    saveProfile(userId, profile)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleCancel() {
    setProfile(loadProfile(userId))
    setEditing(false)
  }

  const displayName = user?.name ?? 'User'

  return (
    <div className="max-w-2xl space-y-5">
      <SectionTitle description="View and edit your personal information">
        My Profile
      </SectionTitle>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Profile saved successfully.</p>
        </div>
      )}

      {/* Photo + identity */}
      <Card>
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            {profile.photoDataUrl
              ? <img src={profile.photoDataUrl} alt={displayName} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-brand-50" />
              : <Avatar name={displayName} size="xl" className="rounded-2xl ring-4 ring-brand-50" />
            }
            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-md hover:bg-brand-600 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-500 mt-0.5">{user?.role ? ROLE_LABELS[user.role] : '—'}</p>
            {user?.deanDepartment && <p className="text-xs text-brand-600 font-medium mt-0.5">{user.deanDepartment}</p>}
            <p className="text-xs text-slate-400 mt-1">{user?.schoolName ?? 'St. Dominic College'}</p>
          </div>

          <div className="shrink-0">
            {editing ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" icon={<X className="h-3.5 w-3.5" />} onClick={handleCancel}>Cancel</Button>
                <Button size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={handleSave}>Save</Button>
              </div>
            ) : (
              <Button size="sm" variant="soft" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>
      </Card>

      {/* Editable fields */}
      <Card>
        <h3 className="text-sm font-bold text-slate-700 mb-4">Personal Information</h3>
        <div className="space-y-4">

          {/* Read-only session fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#e4ebf5] bg-slate-50 px-3 py-2.5">
                <User className="h-4 w-4 text-slate-300 shrink-0" />
                <span className="text-sm text-slate-700">{displayName}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#e4ebf5] bg-slate-50 px-3 py-2.5">
                <Mail className="h-4 w-4 text-slate-300 shrink-0" />
                <span className="text-sm text-slate-700 truncate">{user?.email ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nickname"
              value={profile.nickname ?? ''}
              onChange={(e) => update('nickname', e.target.value)}
              placeholder="e.g. Ana"
              disabled={!editing}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={profile.phone ?? ''}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="09XXXXXXXXX"
              icon={<Phone className="h-4 w-4" />}
              disabled={!editing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Job Title"
              value={profile.jobTitle ?? ''}
              onChange={(e) => update('jobTitle', e.target.value)}
              placeholder="e.g. Admissions Officer"
              icon={<Briefcase className="h-4 w-4" />}
              disabled={!editing}
            />
            <Input
              label="Birthday"
              type="date"
              value={profile.birthday ?? ''}
              onChange={(e) => update('birthday', e.target.value)}
              icon={<Cake className="h-4 w-4" />}
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Department</label>
            <div className="flex items-center gap-2 rounded-lg border border-[#e4ebf5] bg-slate-50 px-3 py-2.5">
              <Building2 className="h-4 w-4 text-slate-300 shrink-0" />
              <span className="text-sm text-slate-700">{user?.deanDepartment ?? user?.schoolName ?? 'St. Dominic College'}</span>
            </div>
          </div>
        </div>

        {!editing && (
          <div className="mt-4 pt-4 border-t border-[#f0f4fa]">
            <p className="text-xs text-slate-400">Click <strong>Edit Profile</strong> to update your information.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
