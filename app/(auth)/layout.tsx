import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FINET – Sign in',
}

/**
 * Unauthenticated layout.
 * Centered card layout used by /login and /signup.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            FINET
          </span>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your personal finance manager
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {children}
        </div>
      </div>
    </div>
  )
}
