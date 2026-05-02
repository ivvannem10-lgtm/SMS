import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MOCK_SOA } from '@/lib/mock-data'
import { generateReceiptNumber } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (!['SUPER_ADMIN', 'TREASURER'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { soaId, amount, method, referenceNumber, notes } = body

  if (!soaId || !amount || amount <= 0) {
    return NextResponse.json({ error: 'soaId and valid amount are required' }, { status: 400 })
  }

  const soa = MOCK_SOA.find((s) => s.id === soaId)
  if (!soa) return NextResponse.json({ error: 'SOA not found' }, { status: 404 })
  if (amount > soa.balance) return NextResponse.json({ error: 'Amount exceeds balance' }, { status: 400 })

  const user = session.user as { name?: string }
  const receiptNumber = generateReceiptNumber()

  const payment = {
    id: `pay_${Date.now()}`,
    soaId,
    amount,
    method: method ?? 'CASH',
    status: 'VALIDATED',
    receiptNumber,
    referenceNumber: referenceNumber ?? null,
    notes: notes ?? null,
    validatedBy: user.name,
    validatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  const newPaid = soa.paidAmount + amount
  const newBalance = soa.totalAmount - newPaid
  const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL'

  return NextResponse.json({
    data: { payment, receiptNumber, newBalance, newStatus },
    message: `Payment of ₱${amount.toLocaleString()} validated. Receipt: ${receiptNumber}`,
  }, { status: 201 })
}
