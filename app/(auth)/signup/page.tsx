import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'FINET – Create account',
  description: 'Create your FINET account and start budgeting',
}

export default function SignupPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Start managing your finances today
        </p>
      </div>
      <SignupForm />
    </>
  )
}
