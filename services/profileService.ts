import { createClient } from '@/lib/supabase/client'
import type { Profile, ProfileInsert, ProfileUpdate, ServiceResult } from '@/types'

/**
 * Profile service — CRUD for the `profiles` table.
 * Profiles are auto-created by a DB trigger after signup,
 * but can also be created/updated from the client.
 */

// ─── Get Profile ──────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<ServiceResult<Profile>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Profile not found.' }

  return { data, error: null }
}

// ─── Create Profile ───────────────────────────────────────────────────────────

export async function createProfile(
  profile: ProfileInsert
): Promise<ServiceResult<Profile>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to create profile.' }

  return { data, error: null }
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<ServiceResult<Profile>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to update profile.' }

  return { data, error: null }
}

// ─── Upsert Profile ───────────────────────────────────────────────────────────
// Used as a safety net after signup in case the DB trigger didn't fire.

export async function upsertProfile(
  profile: ProfileInsert
): Promise<ServiceResult<Profile>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { ...profile, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to upsert profile.' }

  return { data, error: null }
}
