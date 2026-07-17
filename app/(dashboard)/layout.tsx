'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAppointments } from '@/hooks/useAppointments'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'

/**
 * Authenticated layout.
 * Client-side guard: redirects to /login if there is no session.
 * Includes:
 *  - Responsive nav with hamburger menu on mobile
 *  - Live appointment count badge
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
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    showBadge: false },
  { href: '/transactions', label: 'Expenses',     showBadge: false },
  { href: '/community',    label: 'Community',    showBadge: false },
  { href: '/experts',      label: 'Experts',      showBadge: false },
  { href: '/appointments', label: 'Appointments', showBadge: true  },
]

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            FINET
          </span>
          {/* Desktop nav */}
          <DesktopNav />
        </div>

        <div className="flex items-center gap-2">
          <SignOutButton />
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 md:hidden dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && <MobileNav />}
    </header>
  )
}

// ─── Desktop nav ──────────────────────────────────────────────────────────────

function DesktopNav() {
  const pathname = usePathname()
  const { upcomingAppointments } = useAppointments()
  const upcomingCount = upcomingAppointments.length

  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ href, label, showBadge }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        const badgeCount = showBadge ? upcomingCount : 0

        return (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
            {badgeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Mobile nav ───────────────────────────────────────────────────────────────

function MobileNav() {
  const pathname = usePathname()
  const { upcomingAppointments } = useAppointments()
  const upcomingCount = upcomingAppointments.length

  return (
    <nav
      className="border-t border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, showBadge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const badgeCount = showBadge ? upcomingCount : 0

          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
                {badgeCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
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
    <div className="flex items-center gap-3">
      {profile?.full_name && (
        <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 lg:block">
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

// ─── Icons ────────────────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2.5 5h13M2.5 9h13M2.5 13h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
