import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Supabase now calls this PUBLISHABLE_KEY (formerly ANON_KEY — same key, new name)
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// Public client — safe to use in browser (respects Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseKey)

// Server-only admin client — bypasses RLS, use only in API routes / server components
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
