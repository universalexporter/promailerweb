import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = 'https://www.pro-mail.club'

// ---- smart pacing: how many to send per 1-minute cron tick, by job size ----
function batchSizeFor(total: number): number {
  if (total <= 100) return 100
  if (total <= 1000) return 60      // ~1/sec
  if (total <= 10000) return 120    // 10k over ~80 min
  if (total <= 100000) return 250   // 100k over ~7 h
  return 400                        // very large blasts spread over many hours
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

// Per-recipient unsubscribe link (same scheme as /api/send)
function buildUnsubUrl(email: string): string {
  const secret = process.env.UNSUB_SECRET || ''
  const sig = crypto.createHmac('sha256', secret).update(email).digest('hex').slice(0, 32)
  const enc = Buffer.from(email, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${APP_URL}/api/unsubscribe?u=${enc}.${sig}`
}

function fillMerge(text: string, r: any): string {
  // Graceful fallbacks: a missing first name becomes "there" so the email reads
  // "Hi there," instead of "Hi ,". Last name falls back to empty.
  const first = (r.first_name && String(r.first_name).trim()) ? String(r.first_name).trim() : 'there'
  const last = (r.last_name && String(r.last_name).trim()) ? String(r.last_name).trim() : ''
  return (text || '')
    .split('{{first_name}}').join(first)
    .split('{{last_name}}').join(last)
    .split('{{email}}').join(r.email || '')
}

export async function POST(req: Request) {
  // 0. Only our cron may call this — protected by a shared secret.
  const auth = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET || ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Grab the oldest active job
    const { data: job } = await supabaseAdmin
      .from('send_jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!job) {
      return NextResponse.json({ idle: true, message: 'No active jobs' }, { status: 200 })
    }

    // 2. Load this job's sender profile once (billing/quota live on the profile).
    //    We read the PAYS/Test package fields too, so Test plans count correctly
    //    (exactly like /api/send and what the desktop app displays).
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, active_plan_id, emails_sent, pays_enabled, pays_total_quota, pays_daily_cap, pays_used_total, pays_used_today, pays_today_date, pays_expires_at')
      .eq('api_key', job.api_key)
      .single()

    if (!profile) {
      await supabaseAdmin.from('send_jobs').update({ status: 'paused' }).eq('id', job.id)
      return NextResponse.json({ error: 'Job profile not found; paused' }, { status: 200 })
    }

    // 3. Pull a paced batch of pending recipients
    const batchSize = batchSizeFor(job.total_count || 0)
    const { data: batch } = await supabaseAdmin
      .from('send_recipients')
      .select('*')
      .eq('job_id', job.id)
      .eq('status', 'pending')
      .order('id', { ascending: true })
      .limit(batchSize)

    if (!batch || batch.length === 0) {
      // Nothing left — finalize the job.
      await supabaseAdmin.from('send_jobs').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', job.id)
      return NextResponse.json({ done: true, job_id: job.id }, { status: 200 })
    }

    // 4. Domain check once per batch (same rule as /api/send)
    const domainPart = (job.from_email || '').split('@')[1]
    const { data: domainCheck } = await supabaseAdmin
      .from('client_domains')
      .select('status')
      .eq('user_id', profile.id)
      .eq('domain_name', domainPart)
      .single()

    const domainOk = domainCheck && domainCheck.status === 'active'

    // running counters we persist at the end
    let sentThisRun = 0
    let failedThisRun = 0
    let emailsSent = profile.emails_sent || 0

    // ── PAYS / Test package state (mutable across the batch) ──
    // A client on a Test/PAYS package bills against the package quota, NOT a plan.
    // This mirrors /api/send so the count moves and blocks identically.
    const paysEnabled = !!profile.pays_enabled
    const today = new Date().toISOString().slice(0, 10)
    let paysUsedTotal = Number(profile.pays_used_total) || 0
    let paysUsedToday = (profile.pays_today_date === today) ? (Number(profile.pays_used_today) || 0) : 0
    const paysTotalQuota = Number(profile.pays_total_quota) || 0
    const paysDailyCap = Number(profile.pays_daily_cap) || 0
    const paysExpired = profile.pays_expires_at ? (new Date(profile.pays_expires_at).getTime() < Date.now()) : false

    // plan limit (read once) — only used when NOT on a PAYS/Test package
    let planLimit = 0
    let overageCost = 0.006
    if (profile.active_plan_id) {
      const { data: planData } = await supabaseAdmin
        .from('system_pricing')
        .select('email_limit, overage_cost')
        .eq('id', profile.active_plan_id)
        .single()
      if (planData) {
        planLimit = planData.email_limit || 0
        overageCost = planData.overage_cost ?? 0.006
      }
    }

    for (const r of batch) {
      let status = 'sent'
      let errorLog: string | null = null

      try {
        // ---- per-recipient checks (the part Resend can't do) ----

        // a) domain must be verified
        if (!domainOk) {
          status = 'failed'
          errorLog = `Domain ${domainPart} not verified`
        }

        // b) skip if this contact is unsubscribed in our system
        if (status === 'sent') {
          const { data: contactRow } = await supabaseAdmin
            .from('contacts').select('status').eq('email', r.email).maybeSingle()
          if (contactRow && contactRow.status === 'unsubscribed') {
            status = 'unsubscribed'
            errorLog = 'Recipient previously unsubscribed'
          }
        }

        // c) billing — TWO modes, exactly like /api/send:
        //    • PAYS/Test package  → bill against package quota + daily cap
        //    • Regular plan       → plan room, else wallet overage
        let isOverage = false
        let isPaysSend = false

        if (status === 'sent') {
          if (paysEnabled) {
            // ----- PAYS / TEST PACKAGE PATH -----
            if (paysExpired) {
              status = 'failed'; errorLog = 'Test/package expired'
            } else if (paysTotalQuota > 0 && paysUsedTotal >= paysTotalQuota) {
              status = 'failed'; errorLog = 'Package allowance used up'
            } else if (paysDailyCap > 0 && paysUsedToday >= paysDailyCap) {
              status = 'failed'; errorLog = 'Daily cap reached for today'
            } else {
              isPaysSend = true
            }
          } else {
            // ----- REGULAR PLAN PATH -----
            let canSend = false
            if (planLimit > 0 && emailsSent < planLimit) {
              canSend = true
            } else {
              const { data: wallet } = await supabaseAdmin
                .from('wallets').select('balance').eq('user_id', profile.id).single()
              if (wallet && Number(wallet.balance) >= overageCost) {
                canSend = true; isOverage = true
              }
            }
            if (!canSend) {
              status = 'failed'
              errorLog = 'Insufficient balance or plan limit reached'
            }
          }
        }

        // d) actually send (only if still good to go)
        if (status === 'sent') {
          const unsubUrl = buildUnsubUrl(r.email)
          let html = fillMerge(job.html_body, r).split('{{unsubscribe_url}}').join(unsubUrl)
          if (!/unsubscribe/i.test(html)) {
            html += `<p style="font-size:12px;color:#888;margin-top:24px;">If you no longer wish to receive these emails, you can <a href="${unsubUrl}" style="color:#888;">unsubscribe here</a>.</p>`
          }
          const subject = fillMerge(job.subject, r)

          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${job.from_name} <${job.from_email}>`,
              to: [r.email],
              subject,
              html,
              headers: {
                'List-Unsubscribe': `<${unsubUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }),
          })

          if (!resp.ok) {
            const e = await resp.json().catch(() => ({}))
            status = 'failed'
            errorLog = (e && e.message) ? String(e.message).slice(0, 200) : `Resend error ${resp.status}`
          } else {
            // ---- accounting on SUCCESS ----
            // ALWAYS increment emails_sent (this is the single counter the desktop
            // app, client dashboard and admin all read — for every plan type).
            emailsSent += 1
            if (isPaysSend) {
              // Test/PAYS: also advance the package counters.
              paysUsedTotal += 1
              paysUsedToday += 1
              await supabaseAdmin.from('profiles').update({
                emails_sent: emailsSent,
                pays_used_total: paysUsedTotal,
                pays_used_today: paysUsedToday,
                pays_today_date: today,
              }).eq('id', profile.id)
            } else if (isOverage) {
              // Plan exhausted but wallet has balance: deduct overage + count it.
              const { data: w } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', profile.id).single()
              if (w) await supabaseAdmin.from('wallets').update({ balance: Number(w.balance) - overageCost }).eq('user_id', profile.id)
              await supabaseAdmin.from('profiles').update({ emails_sent: emailsSent }).eq('id', profile.id)
            } else {
              // Normal in-plan send.
              await supabaseAdmin.from('profiles').update({ emails_sent: emailsSent }).eq('id', profile.id)
            }
          }
        }
      } catch (err: any) {
        status = 'failed'
        errorLog = `Send fault: ${String(err).slice(0, 150)}`
      }

      // mark the recipient row
      await supabaseAdmin.from('send_recipients').update({
        status,
        error_log: errorLog,
        attempts: (r.attempts || 0) + 1,
        processed_at: new Date().toISOString(),
      }).eq('id', r.id)

      if (status === 'sent') sentThisRun += 1
      else if (status === 'failed') failedThisRun += 1
      // 'unsubscribed' is neither a success nor a hard failure for counts

      // gentle in-batch spacing so we never burst
      await sleep(250)
    }

    // 5. Update the job's rolling counts
    await supabaseAdmin.from('send_jobs').update({
      sent_count: (job.sent_count || 0) + sentThisRun,
      failed_count: (job.failed_count || 0) + failedThisRun,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id)

    // 6. If no pending remain, complete the job
    const { count } = await supabaseAdmin
      .from('send_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', job.id)
      .eq('status', 'pending')

    if (!count || count === 0) {
      await supabaseAdmin.from('send_jobs').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', job.id)
    }

    return NextResponse.json({
      job_id: job.id,
      processed: batch.length,
      sent: sentThisRun,
      failed: failedThisRun,
      remaining: count ?? 0,
    }, { status: 200 })

  } catch (error: any) {
    console.error('send-batch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}