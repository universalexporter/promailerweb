import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Account-wide sending analytics for the desktop dashboard.
// Aggregates across ALL of this user's server jobs (send_jobs/send_recipients).
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

    // All job ids for this account
    const { data: jobs } = await supabaseAdmin
      .from('send_jobs').select('id').eq('api_key', apiKey)
    const jobIds = (jobs || []).map(j => j.id)

    if (jobIds.length === 0) {
      return NextResponse.json({
        total_sent: 0, total_failed: 0, total_unsub: 0,
        days: [], providers: [], failures: [], hours: Array(24).fill(0),
      }, { status: 200 })
    }

    // Pull processed recipients across all jobs (cap to keep it fast)
    const { data: rows } = await supabaseAdmin
      .from('send_recipients')
      .select('email, status, error_log, processed_at')
      .in('job_id', jobIds)
      .not('processed_at', 'is', null)
      .order('processed_at', { ascending: false })
      .limit(20000)

    let total_sent = 0, total_failed = 0, total_unsub = 0
    const dayMap: Record<string, { sent: number; failed: number }> = {}
    const providerMap: Record<string, number> = {}
    const failureMap: Record<string, number> = {}
    const hours = Array(24).fill(0)

    const classifyProvider = (email: string): string => {
      const dom = (email.split('@')[1] || '').toLowerCase()
      if (dom.includes('gmail') || dom.includes('googlemail')) return 'Gmail'
      if (['outlook', 'hotmail', 'live.', 'msn.'].some(k => dom.includes(k))) return 'Outlook'
      if (dom.includes('yahoo') || dom.includes('ymail')) return 'Yahoo'
      if (['icloud', 'me.com', 'mac.com'].some(k => dom.includes(k))) return 'Apple'
      if (dom.includes('proton')) return 'Proton'
      return 'Other'
    }
    const normalizeReason = (err: string | null): string => {
      const e = (err || '').toLowerCase()
      if (!e) return 'Unknown'
      if (e.includes('not verified') || e.includes('domain')) return 'Domain not verified'
      if (e.includes('balance') || e.includes('limit') || e.includes('plan')) return 'Quota / balance'
      if (e.includes('invalid') || e.includes('recipient') || e.includes('address')) return 'Invalid address'
      if (e.includes('timeout')) return 'Gateway timeout'
      if (e.includes('resend') || e.includes('error') || e.includes('http')) return 'Provider error'
      return 'Other error'
    }

    for (const r of rows || []) {
      const ts = r.processed_at ? new Date(r.processed_at) : null
      const dayKey = ts ? ts.toISOString().slice(0, 10) : null

      if (r.status === 'sent') {
        total_sent++
        providerMap[classifyProvider(r.email)] = (providerMap[classifyProvider(r.email)] || 0) + 1
        if (ts) hours[ts.getUTCHours()]++
        if (dayKey) {
          dayMap[dayKey] = dayMap[dayKey] || { sent: 0, failed: 0 }
          dayMap[dayKey].sent++
        }
      } else if (r.status === 'failed') {
        total_failed++
        failureMap[normalizeReason(r.error_log)] = (failureMap[normalizeReason(r.error_log)] || 0) + 1
        if (dayKey) {
          dayMap[dayKey] = dayMap[dayKey] || { sent: 0, failed: 0 }
          dayMap[dayKey].failed++
        }
      } else if (r.status === 'unsubscribed') {
        total_unsub++
      }
    }

    // Last 7 days series (oldest -> newest)
    const days: { day: string; sent: number; failed: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - i)
      const key = d.toISOString().slice(0, 10)
      const rec = dayMap[key] || { sent: 0, failed: 0 }
      days.push({ day: key, sent: rec.sent, failed: rec.failed })
    }

    const toSorted = (m: Record<string, number>) =>
      Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

    return NextResponse.json({
      total_sent, total_failed, total_unsub,
      days,
      providers: toSorted(providerMap),
      failures: toSorted(failureMap),
      hours,
    }, { status: 200 })

  } catch (error: any) {
    console.error('dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}