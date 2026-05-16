import { NextResponse } from 'next/server'
import { options } from '@/lib/api-middleware'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key',
}

export async function GET() {
  return NextResponse.json(
    { status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() },
    { status: 200, headers: CORS },
  )
}

export async function OPTIONS() {
  return options()
}
