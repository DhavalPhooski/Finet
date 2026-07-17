import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'FINET – Sign in',
  description: 'Sign in to your FINET account',
}

export default function LoginPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to your account
        </p>
      </div>
      <LoginForm />
    </>
  )
}
