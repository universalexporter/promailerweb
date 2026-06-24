import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Event types we chart, in display order.
const TYPES = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'delivery_delayed']

// POST body:
//   { start?: "YYYY-MM-DD", end?: "YYYY-MM-DD", days?: number, email?: string }
// Returns:
//   { range:{start,end}, totals:{...}, days:[{day, sent, delivered, ...}],
//     recent:[...latest events...], timeline?:[...events for a searched email...] }
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
    }
    const apiKey = authHeader.split(' ')[1]

    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles').select('id').eq('api_key', apiKey).single()
    if (profErr || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }
    const userId = profile.id

    const body = await req.json().catch(() => ({}))
    const searchEmail = (body?.email || '').toString().trim().toLowerCase()

    // Resolve the date window (UTC). Default: last 30 days inclusive.
    let endDate: Date, startDate: Date
    if (body?.start && body?.end) {
      startDate = new Date(`${String(body.start).slice(0, 10)}T00:00:00.000Z`)
      endDate = new Date(`${String(body.end).slice(0, 10)}T23:59:59.999Z`)
    } else {
      const n = Math.max(1, Math.min(180, parseInt(body?.days, 10) || 30))
      endDate = new Date()
      startDate = new Date(Date.now() - (n - 1) * 86400000)
      startDate.setUTCHours(0, 0, 0, 0)
    }
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    // Pull events for this user in the window (cap for speed).
    const { data: rows } = await supabaseAdmin
      .from('email_events')
      .select('email, event_type, subject, from_email, reason, resend_id, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50000)

    const totals: Record<string, number> = {}
    for (const t of TYPES) totals[t] = 0

    // Per-day buckets across the window.
    const dayMap: Record<string, Record<string, number>> = {}
    const mkDay = (k: string) => {
      if (!dayMap[k]) { dayMap[k] = {}; for (const t of TYPES) dayMap[k][t] = 0 }
      return dayMap[k]
    }

    for (const r of rows || []) {
      const t = r.event_type
      if (totals[t] === undefined) totals[t] = 0
      totals[t]++
      const k = r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : null
      if (k) {
        const d = mkDay(k)
        d[t] = (d[t] || 0) + 1
      }
    }

    // Build a continuous day series (oldest -> newest), zero-filled.
    const days: any[] = []
    const cur = new Date(startDate)
    cur.setUTCHours(0, 0, 0, 0)
    const last = new Date(endDate); last.setUTCHours(0, 0, 0, 0)
    let guard = 0
    while (cur <= last && guard < 400) {
      const k = cur.toISOString().slice(0, 10)
      const d = dayMap[k] || {}
      const entry: any = { day: k }
      for (const t of TYPES) entry[t] = d[t] || 0
      days.push(entry)
      cur.setUTCDate(cur.getUTCDate() + 1)
      guard++
    }

    // Most-recent events for the live feed table.
    const recent = (rows || []).slice(0, 80).map(r => ({
      email: r.email,
      event_type: r.event_type,
      subject: r.subject,
      reason: r.reason,
      created_at: r.created_at,
    }))

    // Optional: full timeline for one searched address (across ALL time, not just
    // the window, so you can trace any mail's whole life).
    let timeline: any[] | undefined = undefined
    if (searchEmail) {
      const { data: tl } = await supabaseAdmin
        .from('email_events')
        .select('email, event_type, subject, reason, resend_id, created_at')
        .eq('user_id', userId)
        .eq('email', searchEmail)
        .order('created_at', { ascending: true })
        .limit(500)
      timeline = (tl || []).map(r => ({
        email: r.email,
        event_type: r.event_type,
        subject: r.subject,
        reason: r.reason,
        resend_id: r.resend_id,
        created_at: r.created_at,
      }))
    }

    return NextResponse.json({
      range: { start: startDate.toISOString().slice(0, 10), end: endDate.toISOString().slice(0, 10) },
      totals,
      days,
      recent,
      ...(timeline !== undefined ? { timeline } : {}),
    }, { status: 200 })

  } catch (error: any) {
    console.error('dashboard events error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}