'use client'

import { useState, useRef, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
}

/**
 * Multi-line chat input.
 * Enter sends, Shift+Enter adds a newline.
 * Auto-grows up to ~6 lines then scrolls.
 */
export function ChatInput({ onSend, isLoading, placeholder = 'Ask FinetAI anything…' }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px` // max ~6 lines
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        aria-label="Chat message"
        className="flex-1 resize-none bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none disabled:opacity-50 dark:text-zinc-100"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        aria-label="Send message"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isLoading ? <StopIcon /> : <SendIcon />}
      </button>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.25 7L1.75 1.75l2.625 5.25-2.625 5.25L12.25 7z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  )
}
