'use client'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data'
import { formatDateTime } from '@/lib/utils'

const ACTION_COLORS: Record<string, string> = {
  ACCEPT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REJECT: 'bg-red-50 text-red-700 ring-red-600/20',
  PAYMENT: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  CREATE: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  UPDATE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  DELETE: 'bg-red-50 text-red-700 ring-red-600/20',
  LOGIN: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  GRADE: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

export default function AuditPage() {
  return (
    <div className="space-y-5 max-w-7xl">
      <SectionTitle description="Complete audit trail of all system actions">Audit Logs</SectionTitle>
      <Card padding="none">
        <Table>
          <Thead><Th>Timestamp</Th><Th>Action</Th><Th>Entity</Th><Th>Details</Th><Th>User</Th></Thead>
          <Tbody>
            {MOCK_AUDIT_LOGS.map((log) => (
              <Tr key={log.id}>
                <Td className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</Td>
                <Td><Badge className={ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20'}>{log.action}</Badge></Td>
                <Td className="text-xs font-medium">{log.entity}</Td>
                <Td className="text-xs text-slate-600 max-w-xs">{log.details}</Td>
                <Td className="text-xs text-slate-500">{log.userId}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  )
}
