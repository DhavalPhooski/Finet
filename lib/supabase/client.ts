import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Browser-side Supabase client.
 * Use this in Client Components ('use client').
 * Creates a new instance on every call — safe because @supabase/ssr handles
 * singleton behaviour internally via the cookie store.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
