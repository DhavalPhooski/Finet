interface ErrorMessageProps {
  message: string | null | undefined
  className?: string
}

/**
 * Inline error message.
 * Renders nothing when message is falsy — safe to always render in JSX.
 */
export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null

  return (
    <p
      role="alert"
      aria-live="polite"
      className={`rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400 ${className}`}
    >
      {message}
    </p>
  )
}
