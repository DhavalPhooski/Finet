'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'

/**
 * Authenticated layout.
 * Client-side guard: redirects to /login if there is no session.
 * The middleware handles the server-side redirect; this is the client-side safety net.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <FullPageLoader label="Loading your dashboard…" />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Brand + nav links */}
          <div className="flex items-center gap-6">
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              FINET
            </span>
            <NavLinks />
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transactions', label: 'Expenses' },
  { href: '/community', label: 'Community' },
]

function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition
              ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
              }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Sign-out button ──────────────────────────────────────────────────────────

function SignOutButton() {
  const { signOut, profile } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4">
      {profile?.full_name && (
        <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:block">
          {profile.full_name}
        </span>
      )}
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        Sign out
      </button>
    </div>
  )
}
