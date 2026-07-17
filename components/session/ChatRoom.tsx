'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getChatHistory, sendChatMessage } from '@/services/sessionService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { ChatMessage, ConsultationSession } from '@/types'

const MAX_MESSAGE_LENGTH = 4000

interface ChatRoomProps {
  session: ConsultationSession
  currentUserId: string
  currentUserName: string
  isEnded: boolean
}

/**
 * Real-time chat room for a consultation session.
 *
 * Architecture:
 *  1. Load message history from DB on mount (getChatHistory).
 *  2. Subscribe to postgres_changes on chat_messages for this room_id.
 *  3. Append incoming messages to local state in real time.
 *  4. Outgoing messages are inserted via sendChatMessage — the Realtime
 *     subscription delivers them back so we don't double-append.
 */
export function ChatRoom({
  session,
  currentUserId,
  currentUserName,
  isEnded,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Load history ───────────────────────────────────────────

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true)
      const result = await getChatHistory(session.id)
      if (result.error) {
        setError(result.error)
      } else {
        setMessages(result.data ?? [])
      }
      setIsLoading(false)
    }
    loadHistory()
  }, [session.id])

  // ── Realtime subscription ──────────────────────────────────

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`chat-room-${session.room_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${session.room_id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages((prev) => {
            // Avoid duplicates if the sender also receives their own insert
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.room_id])

  // ── Auto-scroll to latest message ─────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ───────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || isSending || isEnded) return
    if (content.length > MAX_MESSAGE_LENGTH) {
      setError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`)
      return
    }

    setIsSending(true)
    setError(null)

    const result = await sendChatMessage({
      session_id: session.id,
      room_id: session.room_id,
      sender_id: currentUserId,
      content,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setInput('')
      inputRef.current?.focus()
    }

    setIsSending(false)
  }, [input, isSending, isEnded, session.id, session.room_id, currentUserId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ minHeight: 0 }}
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {isLoading ? (
          <div className="flex justify-center pt-8">
            <LoadingSpinner size="md" label="Loading messages…" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-2xl" aria-hidden="true">💬</span>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === currentUserId}
              senderName={msg.sender_id === currentUserId ? currentUserName : 'Expert'}
            />
          ))
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Error */}
      {error && <div className="px-4 pb-2"><ErrorMessage message={error} /></div>}

      {/* Input area */}
      <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
        {isEnded ? (
          <p className="py-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Session has ended. The chat is now read-only.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={isSending}
              aria-label="Chat message input"
              className="flex-1 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSending ? (
                <LoadingSpinner size="sm" label="Sending…" />
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        )}
        {!isEnded && input.length > MAX_MESSAGE_LENGTH * 0.9 && (
          <p className="mt-1 text-right text-xs text-zinc-400">
            {input.length}/{MAX_MESSAGE_LENGTH}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMine,
  senderName,
}: {
  message: ChatMessage
  isMine: boolean
  senderName: string
}) {
  const time = new Date(message.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      <div className="flex items-baseline gap-1.5 mb-0.5">
        {!isMine && (
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {senderName}
          </span>
        )}
        <span className="text-xs text-zinc-300 dark:text-zinc-600">{time}</span>
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isMine
            ? 'rounded-br-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 2L7.5 8.5M14 2L9.5 14 7.5 8.5M14 2L2 6.5l5.5 2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
