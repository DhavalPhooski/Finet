import type { ChatMessage as ChatMessageType } from '@/hooks/useChat'

interface ChatMessageProps {
  message: ChatMessageType
}

/**
 * Renders a single chat bubble.
 * User messages are right-aligned; model messages are left-aligned.
 * Supports basic markdown-like formatting: **bold**, bullet lists, line breaks.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isUser
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'bg-emerald-500 text-white'
        }`}
        aria-hidden="true"
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'rounded-tl-sm border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
        }`}
      >
        {message.isStreaming && message.content === '' ? (
          <TypingIndicator />
        ) : (
          <FormattedContent content={message.content} />
        )}
        {message.isStreaming && message.content !== '' && (
          <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-current opacity-70" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

// ─── Typing indicator (three bouncing dots) ───────────────────────────────────

function TypingIndicator() {
  return (
    <span className="flex items-center gap-1" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          aria-hidden="true"
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </span>
  )
}

// ─── Basic markdown renderer ──────────────────────────────────────────────────
// Handles: **bold**, `code`, bullet lists (- or *), numbered lists, line breaks
// Deliberately simple — no external library needed.

function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => {
        // Bullet list
        if (/^[-*•]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-zinc-400">•</span>
              <span>{renderInline(line.replace(/^[-*•]\s/, ''))}</span>
            </div>
          )
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/)
          if (match) {
            return (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 font-medium text-zinc-500">{match[1]}.</span>
                <span>{renderInline(match[2])}</span>
              </div>
            )
          }
        }
        // Heading (##)
        if (/^#{1,3}\s/.test(line)) {
          return (
            <p key={i} className="font-semibold">
              {renderInline(line.replace(/^#+\s/, ''))}
            </p>
          )
        }
        // Empty line → spacer
        if (!line.trim()) return <div key={i} className="h-1" />

        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

// Renders inline **bold** and `code` within a line
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-700">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
