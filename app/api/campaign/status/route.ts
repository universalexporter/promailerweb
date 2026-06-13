import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns delivery progress for a job (or the caller's most recent job).
// Auth: same Bearer API key as the rest of the app.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
    }
    const apiKey = authHeader.split(' ')[1]

    const body = await req.json().catch(() => ({}))
    const jobId = body?.job_id || null

    // Resolve user (and confirm the key is valid)
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles').select('id').eq('api_key', apiKey).single()
    if (profErr || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }

    // Pick the job: explicit id, else this user's most recent
    let jobQuery = supabaseAdmin
      .from('send_jobs')
      .select('id, campaign_name, status, total_count, sent_count, failed_count, created_at')
      .eq('api_key', apiKey)
      .order('created_at', { ascending: false })
      .limit(1)

    if (jobId) {
      jobQuery = supabaseAdmin
        .from('send_jobs')
        .select('id, campaign_name, status, total_count, sent_count, failed_count, created_at')
        .eq('id', jobId)
        .eq('api_key', apiKey)
        .limit(1)
    }

    const { data: jobs } = await jobQuery
    const job = jobs && jobs[0]
    if (!job) {
      return NextResponse.json({ error: 'No job found' }, { status: 404 })
    }

    // Live recipient-status counts for this job
    const { data: rows } = await supabaseAdmin
      .from('send_recipients')
      .select('status')
      .eq('job_id', job.id)

    let sent = 0, failed = 0, pending = 0, unsub = 0
    for (const r of rows || []) {
      if (r.status === 'sent') sent++
      else if (r.status === 'failed') failed++
      else if (r.status === 'unsubscribed') unsub++
      else pending++
    }

    // A small sample of recent results for the activity table
    const { data: recent } = await supabaseAdmin
      .from('send_recipients')
      .select('email, status, error_log, processed_at')
      .eq('job_id', job.id)
      .not('processed_at', 'is', null)
      .order('processed_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      job_id: job.id,
      campaign_name: job.campaign_name,
      status: job.status,             // active | completed | paused
      total: job.total_count,
      sent, failed, unsubscribed: unsub, pending,
      recent: recent || [],
    }, { status: 200 })

  } catch (error: any) {
    console.error('campaign status error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}