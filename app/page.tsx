import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Root page — determines where to send the user.
 * This runs on the server so there is no flash of unauthenticated content.
 *
 * Authenticated  → /dashboard
 * Unauthenticated → /login
 */
export default async function RootPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
