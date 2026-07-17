'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfile, upsertProfile } from '@/services/profileService'
import { signOut as authSignOut } from '@/services/authService'
import type { AuthState, Profile, SupabaseUser } from '@/types'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  // Fetch the profile row for the given user
  const loadProfile = useCallback(async (u: SupabaseUser) => {
    const result = await getProfile(u.id)

    if (result.error) {
      // Profile may not exist yet (race with DB trigger) — upsert as fallback
      const upsertResult = await upsertProfile({
        id: u.id,
        email: u.email ?? '',
        full_name: (u.user_metadata?.full_name as string) ?? null,
      })
      if (!upsertResult.error) setProfile(upsertResult.data)
    } else {
      setProfile(result.data)
    }
  }, [])

  // Manually refresh the profile (e.g. after updating name)
  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user)
  }, [user, loadProfile])

  // Sign out and clear local state
  const signOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
    setProfile(null)
  }, [])

  useEffect(() => {
    let mounted = true

    // 1. Hydrate from the current session on mount
    const initAuth = async () => {
      const { data } = await supabase.auth.getUser()

      if (!mounted) return

      if (data.user) {
        setUser(data.user)
        await loadProfile(data.user)
      }

      setIsLoading(false)
    }

    initAuth()

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await loadProfile(currentUser)
      } else {
        setProfile(null)
      }

      // Only set loading false after INITIAL_SESSION fires
      if (event === 'INITIAL_SESSION') {
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
