'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/services/authService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { LoginFormValues } from '@/types'

export function LoginForm() {
  const router = useRouter()

  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    // Clear error on user input
    if (error) setError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!values.email.trim() || !values.password) {
      setError('Email and password are required.')
      return
    }

    setIsSubmitting(true)

    const result = await signIn(values)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      noValidate
      aria-label="Login form"
    >
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={handleChange}
          placeholder="you@example.com"
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/10"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={handleChange}
          placeholder="••••••••"
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/10"
        />
      </div>

      {/* Error */}
      <ErrorMessage message={error} />

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size="sm" label="Signing in…" />
            <span>Signing in…</span>
          </>
        ) : (
          'Sign in'
        )}
      </button>

      {/* Switch to sign up */}
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Sign up
        </Link>
      </p>
    </form>
  )
}
