import { createClient } from '@/lib/supabase/client'
import type { LoginFormValues, SignupFormValues, ServiceResult } from '@/types'
import type { Session, User } from '@supabase/supabase-js'

/**
 * Auth service — all Supabase Auth calls isolated from UI components.
 * Uses the browser client (safe to call from 'use client' components).
 */

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export async function signUp(
  values: SignupFormValues
): Promise<ServiceResult<User>> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.full_name,
      },
    },
  })

  if (error) return { data: null, error: error.message }
  if (!data.user) return { data: null, error: 'Sign up failed. Please try again.' }

  return { data: data.user, error: null }
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signIn(
  values: LoginFormValues
): Promise<ServiceResult<Session>> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  })

  if (error) return { data: null, error: error.message }
  if (!data.session) return { data: null, error: 'Login failed. Please try again.' }

  return { data: data.session, error: null }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<ServiceResult<null>> {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<ServiceResult<User>> {
  const supabase = createClient()

  // getUser() validates the token with Supabase — more secure than getSession()
  const { data, error } = await supabase.auth.getUser()

  if (error) return { data: null, error: error.message }
  if (!data.user) return { data: null, error: 'No authenticated user.' }

  return { data: data.user, error: null }
}

// ─── Get Current Session ──────────────────────────────────────────────────────

export async function getSession(): Promise<ServiceResult<Session>> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getSession()

  if (error) return { data: null, error: error.message }
  if (!data.session) return { data: null, error: 'No active session.' }

  return { data: data.session, error: null }
}
