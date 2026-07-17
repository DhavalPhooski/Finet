'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/services/authService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { SignupFormValues } from '@/types'

const MIN_PASSWORD_LENGTH = 8

export function SignupForm() {
  const router = useRouter()

  const [values, setValues] = useState<SignupFormValues>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError(null)
  }

  function validate(): string | null {
    if (!values.full_name.trim()) return 'Full name is required.'
    if (!values.email.trim()) return 'Email is required.'
    if (values.password.length < MIN_PASSWORD_LENGTH)
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    if (values.password !== values.confirmPassword)
      return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    const result = await signUp(values)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    // If email confirmation is enabled in Supabase, show success message.
    // If not, the AuthContext will pick up the session and we redirect.
    if (!result.data || result.data.identities?.length === 0) {
      // Email already registered but unconfirmed
      setError('An account with this email already exists.')
      setIsSubmitting(false)
      return
    }

    setIsSuccess(true)
    // Give the auth state change listener time to fire
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 500)
  }

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg bg-green-50 px-4 py-5 text-center dark:bg-green-950"
      >
        <p className="font-medium text-green-800 dark:text-green-300">
          Account created!
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
          Check your email to confirm your address, then sign in.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-green-900 underline-offset-4 hover:underline dark:text-green-200"
        >
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      noValidate
      aria-label="Sign up form"
    >
      {/* Full Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="full_name"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          value={values.full_name}
          onChange={handleChange}
          placeholder="Riya Sharma"
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/10"
        />
      </div>

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
          autoComplete="new-password"
          required
          value={values.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/10"
        />
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={values.confirmPassword}
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
            <LoadingSpinner size="sm" label="Creating account…" />
            <span>Creating account…</span>
          </>
        ) : (
          'Create account'
        )}
      </button>

      {/* Switch to login */}
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
