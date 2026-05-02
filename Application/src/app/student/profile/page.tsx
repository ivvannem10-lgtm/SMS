'use client'
import { Mail, Phone, MapPin, Calendar, GraduationCap } from 'lucide-react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { MOCK_STUDENTS } from '@/lib/mock-data'
import { fullName, formatDate } from '@/lib/utils'

const student = MOCK_STUDENTS[0]

export default function StudentProfilePage() {
  return (
    <div className="max-w-2xl space-y-5">
      <SectionTitle description="Your personal information (view-only)">My Profile</SectionTitle>

      <Card>
        <div className="flex items-start gap-5">
          <Avatar name={fullName(student)} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{fullName(student)}</h1>
                <p className="text-sm text-slate-500">{student.program?.name}</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">Active</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Student ID</p>
                <p className="text-sm font-mono font-semibold text-slate-900">{student.studentId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Year Level</p>
                <p className="text-sm font-medium text-slate-900">{student.yearLevel}st Year</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4 text-slate-900">Personal Information</h3>
        <div className="space-y-3">
          <InfoRow icon={Mail} label="Email" value={student.email} />
          <InfoRow icon={Phone} label="Phone" value={student.phone ?? '—'} />
          <InfoRow icon={MapPin} label="Address" value={student.address ?? '—'} />
          <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(student.dateOfBirth)} />
          <InfoRow icon={GraduationCap} label="Program" value={`${student.program?.code} — ${student.program?.name}`} />
        </div>
        <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          To update your information, please visit the Registrar's Office.
        </p>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  )
}
