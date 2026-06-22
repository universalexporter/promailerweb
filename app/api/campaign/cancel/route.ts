// =============================================================================
//  ProMail Suite — Cancel / Reschedule a scheduled send
//  Deploy to:  app/api/campaign/cancel/route.ts
//
//  The desktop app already remembers each scheduled campaign's server job id.
//  This endpoint lets the app tell the SERVER to either:
//     • CANCEL a job        → body: { "job_id": "<id>" }
//     • RESCHEDULE a job    → body: { "job_id": "<id>", "new_time": "2026-07-01T14:30:00Z" }
//
//  Why this is safe: your send-batch cron only ever acts on jobs whose status is
//  'scheduled' (to wake them up) or 'active' (to send them). Setting a job to
//  'canceled' takes it out of both paths permanently — it will never send.
//  Rescheduling just moves the 'scheduled_for' time on a job that hasn't fired yet.
//
//  Auth: same Bearer API key the rest of your app already uses.
//  Required env vars (already present): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// =============================================================================
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  // LIVE-BUILD MARKER — if you see this in Vercel logs, this exact file is live.
  console.log('[CANCEL_ROUTE] hit at', new Date().toISOString())

  try {
    // 1. Auth — Bearer API key (same pattern as launch/schedule/status)
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
    }
    const apiKey = authHeader.split(' ')[1]

    // 2. Parse the request
    const body = await req.json().catch(() => ({}))
    const jobId = body?.job_id || null
    const newTime = body?.new_time || null   // present => reschedule; absent => cancel
    if (!jobId) {
      return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })
    }

    // 3. Resolve the user from their API key (also proves the key is valid)
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles').select('id').eq('api_key', apiKey).single()
    if (profErr || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }

    // 4. Load the job and confirm it belongs to this caller
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('send_jobs')
      .select('id, status, api_key, scheduled_for')
      .eq('id', jobId)
      .eq('api_key', apiKey)
      .single()
    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found for this account' }, { status: 404 })
    }

    // Already finished or already canceled? Nothing to do — say so plainly.
    if (job.status === 'completed') {
      return NextResponse.json(
        { error: 'That campaign has already finished sending — it cannot be changed.' },
        { status: 409 }
      )
    }
    if (job.status === 'canceled') {
      return NextResponse.json({ success: true, status: 'canceled', message: 'Already canceled.' }, { status: 200 })
    }

    // 5a. RESCHEDULE — only valid while the job is still waiting ('scheduled')
    if (newTime) {
      const when = new Date(newTime)
      if (isNaN(when.getTime())) {
        return NextResponse.json({ error: 'Invalid new_time' }, { status: 400 })
      }
      if (when.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'new_time must be in the future' }, { status: 400 })
      }
      if (job.status !== 'scheduled') {
        return NextResponse.json(
          { error: 'This campaign is already sending and can no longer be rescheduled — cancel it instead.' },
          { status: 409 }
        )
      }
      const { error: updErr } = await supabaseAdmin
        .from('send_jobs')
        .update({ scheduled_for: when.toISOString() })
        .eq('id', jobId)
        .eq('api_key', apiKey)
      if (updErr) {
        console.error('[CANCEL_ROUTE] reschedule failed:', updErr)
        return NextResponse.json({ error: 'Could not reschedule', detail: updErr.message }, { status: 500 })
      }
      console.log('[CANCEL_ROUTE] rescheduled', jobId, '->', when.toISOString())
      return NextResponse.json(
        { success: true, status: 'scheduled', scheduled_for: when.toISOString(), message: 'Schedule updated.' },
        { status: 200 }
      )
    }

    // 5b. CANCEL — flip the job to 'canceled' so the cron never touches it again.
    const { error: cancErr } = await supabaseAdmin
      .from('send_jobs')
      .update({ status: 'canceled' })
      .eq('id', jobId)
      .eq('api_key', apiKey)
    if (cancErr) {
      console.error('[CANCEL_ROUTE] cancel failed:', cancErr)
      return NextResponse.json({ error: 'Could not cancel', detail: cancErr.message }, { status: 500 })
    }

    // Best-effort: stop any recipients that haven't gone out yet. (Already-sent
    // ones are left exactly as they are — this never "unsends" anything.)
    await supabaseAdmin
      .from('send_recipients')
      .update({ status: 'canceled' })
      .eq('job_id', jobId)
      .eq('status', 'pending')

    console.log('[CANCEL_ROUTE] canceled', jobId)
    return NextResponse.json(
      { success: true, status: 'canceled', message: 'Campaign canceled — it will not send.' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('[CANCEL_ROUTE] fatal:', error)
    return NextResponse.json({ error: 'Internal Server Error', detail: String(error?.message || error) }, { status: 500 })
  }
}