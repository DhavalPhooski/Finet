import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/chat
 *
 * Streams a response from Groq (llama-3.3-70b-versatile) back to the client.
 * Groq's API is OpenAI-compatible so we use a plain fetch — no extra package.
 * Runs as a standard Node.js route so .env.local is available in local dev.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 })
  }

  const body = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    context: {
      income: number | null
      currency: string
      allocation: { needs: number; wants: number; investments: number } | null
      budgetNodes: { title: string; allocated: number; spent: number; remaining: number }[]
      recentTransactions: { title: string; amount: number; date: string; category: string | null }[]
      remainingBudget: number | null
    }
  }

  const { messages, context } = body
  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages provided.' }, { status: 400 })
  }

  // ── Build system prompt with user's live financial data ────────────────────

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n)

  let systemPrompt = `You are FinetAI, a friendly and knowledgeable personal finance advisor built into FINET — an Indian personal finance management app.

Your role:
- Give clear, actionable, personalised financial advice based on the user's actual data
- Be concise but thorough — bullet points work well for lists, keep prose natural
- Use Indian financial context: INR currency, Indian tax rules, SIP/mutual funds, PPF, EPF, NPS etc.
- Never be preachy — the user came for help, not judgment
- If you don't know something specific (e.g. current stock prices), say so clearly
- Keep responses focused, no generic disclaimers

`

  if (context.income) {
    systemPrompt += `## User's Financial Profile\n\n`
    systemPrompt += `**Monthly Income:** ${formatINR(context.income)}\n\n`

    if (context.allocation) {
      systemPrompt += `**50/30/20 Ideal Allocation:**\n`
      systemPrompt += `- Needs (50%): ${formatINR(context.allocation.needs)}\n`
      systemPrompt += `- Wants (30%): ${formatINR(context.allocation.wants)}\n`
      systemPrompt += `- Investments (20%): ${formatINR(context.allocation.investments)}\n\n`
    }

    if (context.remainingBudget !== null) {
      systemPrompt += `**Remaining Budget This Month:** ${formatINR(context.remainingBudget)}\n\n`
    }

    if (context.budgetNodes.length > 0) {
      systemPrompt += `**Budget Categories:**\n`
      for (const node of context.budgetNodes) {
        const pct = node.allocated > 0
          ? Math.round((node.spent / node.allocated) * 100)
          : 0
        const status =
          pct >= 100 ? '🔴 over budget' :
          pct >= 80  ? '🟡 near limit'  : '🟢 on track'
        systemPrompt += `- ${node.title}: allocated ${formatINR(node.allocated)}, spent ${formatINR(node.spent)}, remaining ${formatINR(node.remaining)} (${pct}% used) ${status}\n`
      }
      systemPrompt += '\n'
    }

    if (context.recentTransactions.length > 0) {
      systemPrompt += `**Recent Transactions (last 10):**\n`
      for (const tx of context.recentTransactions.slice(0, 10)) {
        const cat = tx.category ? ` [${tx.category}]` : ''
        systemPrompt += `- ${tx.date}: ${tx.title}${cat} — ${formatINR(tx.amount)}\n`
      }
      systemPrompt += '\n'
    }
  } else {
    systemPrompt += `Note: The user hasn't set up their income or budget yet. Answer general finance questions and encourage them to set up their budget in FINET for personalised advice.\n\n`
  }

  // ── Call Groq with streaming ───────────────────────────────────────────────

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    // Groq uses 'assistant' not 'model' for AI turns
    ...messages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content,
    })),
  ]

  const groqRes = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: groqMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!groqRes.ok) {
    const text = await groqRes.text()
    console.error('[/api/chat] Groq error:', groqRes.status, text)
    return NextResponse.json(
      { error: `AI service error: ${groqRes.status}` },
      { status: groqRes.status }
    )
  }

  // ── Forward the SSE stream as plain text to the client ────────────────────
  // Groq returns OpenAI-style SSE: data: {"choices":[{"delta":{"content":"..."}}]}
  // We extract just the text content and stream it as plain text.

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      if (!groqRes.body) {
        controller.close()
        return
      }

      const reader = groqRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (!trimmed.startsWith('data: ')) continue

            try {
              const json = JSON.parse(trimmed.slice(6)) as {
                choices?: { delta?: { content?: string } }[]
              }
              const content = json.choices?.[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(content))
              }
            } catch {
              // malformed JSON chunk — skip
            }
          }
        }
      } catch (err) {
        console.error('[/api/chat stream]', err)
        controller.enqueue(encoder.encode('\n\n[Error generating response]'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
