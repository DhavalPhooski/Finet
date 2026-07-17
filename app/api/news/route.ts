import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/news
 *
 * Server-side proxy for newsdata.io /latest.
 * Hardcodes country=in so all results are India-specific.
 * The API key never reaches the browser.
 *
 * Query params forwarded to upstream:
 *   category  — newsdata.io category (business, technology, etc.)
 *   q         — keyword search
 *   page      — pagination cursor (string token returned by newsdata.io)
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.NEWSDATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'News API key not configured.' }, { status: 500 })
  }

  const { searchParams } = request.nextUrl

  const upstream = new URL('https://newsdata.io/api/1/latest')
  upstream.searchParams.set('apikey', apiKey)
  upstream.searchParams.set('country', 'in')
  upstream.searchParams.set('language', 'en')

  const category = searchParams.get('category')
  if (category) upstream.searchParams.set('category', category)

  const q = searchParams.get('q')
  if (q) upstream.searchParams.set('q', q)

  const page = searchParams.get('page')
  if (page) upstream.searchParams.set('page', page)

  try {
    const res = await fetch(upstream.toString(), {
      next: { revalidate: 300 }, // cache 5 min on server
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Upstream error ${res.status}: ${text}` },
        { status: res.status }
      )
    }

    const json = await res.json()

    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch (err) {
    console.error('[/api/news]', err)
    return NextResponse.json({ error: 'Failed to fetch news.' }, { status: 502 })
  }
}
