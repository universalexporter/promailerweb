import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scoreEmail } from '@/lib/risk-engine'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// How many recipient rows we insert per DB call. Keeps big lists (100k+) from
// timing out the serverless function — we insert in chunks.
const INSERT_CHUNK = 1000

// Schedule a campaign to be sent LATER, fully server-side. The job is stored with
// status='scheduled' + a scheduled_for time. The send-batch cron promotes it to
// 'active' once that time has passed — so it fires even if the desktop app is closed.
export async function POST(req: Request) {
  console.log('[SCHEDULE_ROUTE] LIVE build hit at', new Date().toISOString())

  try {
    // 1. Auth — same Bearer API key pattern as /api/campaign/launch
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
    }
    const apiKey = authHeader.split(' ')[1]

    // 2. Parse the payload — same as launch, plus a scheduled time
    const body = await req.json()
    const {
      campaign_name,
      subject,
      html_body,
      from_email,
      from_name,
      recipients,    // [{ email, first_name, last_name }, ...]
      scheduled_for, // ISO timestamp string, e.g. "2026-07-01T14:30:00Z"
    } = body

    if (!subject || !html_body || !from_email) {
      return NextResponse.json({ error: 'Missing subject, body, or from_email' }, { status: 400 })
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    // Validate the scheduled time — must be a real timestamp.
    const when = scheduled_for ? new Date(scheduled_for) : null
    if (!when || isNaN(when.getTime())) {
      return NextResponse.json({ error: 'Invalid or missing scheduled_for time' }, { status: 400 })
    }

    // 3. Resolve the user via their API key
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }
    const userId = profile.id

    // 4. De-duplicate + clean the incoming list (defensive; the app cleans too)
    const seen = new Set<string>()
    const clean: { email: string; first_name: string | null; last_name: string | null }[] = []
    for (const r of recipients) {
      const email = (r?.email || '').toString().trim().toLowerCase()
      if (!email || !email.includes('@')) continue
      if (seen.has(email)) continue
      seen.add(email)
      clean.push({
        email,
        first_name: r?.first_name ? String(r.first_name) : null,
        last_name: r?.last_name ? String(r.last_name) : null,
      })
    }

    if (clean.length === 0) {
      return NextResponse.json({ error: 'No valid recipients after cleaning' }, { status: 400 })
    }

    // 4.5 SAFETY GATE — score before scheduling. Same rules as launch.
    const risk = await scoreEmail({ subject, html_body, from_email, from_name, recipients: clean, userId, supabaseAdmin })
    if (risk.action === 'BLOCK') {
      return NextResponse.json({
        error: 'Campaign blocked by safety system',
        classification: risk.classification,
        risk_score: risk.risk_score,
        risk_level: risk.risk_level,
        reasons: risk.reasons,
      }, { status: 403 })
    }
    // REQUIRE_REVIEW → 'held' (cron never promotes it). Otherwise normal 'scheduled'.
    const jobStatus = risk.action === 'REQUIRE_REVIEW' ? 'held' : 'scheduled'

    // 5. Create the job row — as 'scheduled' (or 'held'), NOT active. The cron flips
    //    'scheduled' → 'active' once scheduled_for has passed.
    const { data: job, error: jobError } = await supabaseAdmin
      .from('send_jobs')
      .insert({
        user_id: userId,
        api_key: apiKey,
        campaign_name: campaign_name || 'Untitled Campaign',
        subject,
        html_body,
        from_email,
        from_name: from_name || '',
        status: jobStatus,
        scheduled_for: when.toISOString(),
        total_count: clean.length,
        risk_score: risk.risk_score,
        risk_level: risk.risk_level,
        risk_action: risk.action,
        classification: risk.classification,
        risk_reasons: risk.reasons,
      })
      .select('id')
      .single()

    if (jobError || !job) {
      console.error('[SCHEDULE_ROUTE] job insert FAILED:', jobError)
      return NextResponse.json(
        { error: 'Could not create scheduled job', detail: jobError?.message || String(jobError) },
        { status: 500 }
      )
    }

    // 6. Insert all recipients as 'pending', in chunks so huge lists don't time out.
    for (let i = 0; i < clean.length; i += INSERT_CHUNK) {
      const chunk = clean.slice(i, i + INSERT_CHUNK).map(r => ({
        job_id: job.id,
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        status: 'pending',
      }))
      const { error: recErr } = await supabaseAdmin.from('send_recipients').insert(chunk)
      if (recErr) {
        console.error('[SCHEDULE_ROUTE] recipient chunk insert FAILED:', recErr)
        await supabaseAdmin.from('send_jobs').update({ status: 'paused' }).eq('id', job.id)
        return NextResponse.json(
          { error: 'Failed while queueing recipients', detail: recErr.message },
          { status: 500 }
        )
      }
    }

    console.log('[SCHEDULE_ROUTE] created job', job.id, 'for', when.toISOString(), 'recipients', clean.length)

    // 7. Done — the server now owns the schedule.
    return NextResponse.json({
      success: true,
      job_id: job.id,
      queued: clean.length,
      held: jobStatus === 'held',
      scheduled_for: when.toISOString(),
      risk_score: risk.risk_score,
      risk_level: risk.risk_level,
      risk_action: risk.action,
      reasons: risk.reasons,
      message: jobStatus === 'held'
        ? 'Campaign held for review (elevated risk).'
        : 'Campaign scheduled. Server will deliver at the chosen time.',
    }, { status: 200 })

  } catch (error: any) {
    console.error('[SCHEDULE_ROUTE] fatal error:', error)
    return NextResponse.json({ error: 'Internal Server Error', detail: String(error?.message || error) }, { status: 500 })
  }
}