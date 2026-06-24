import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifySignature(secret: string, headers: Headers, rawBody: string): boolean {
  if (!secret) {
    console.warn('[RESEND_WEBHOOK] no RESEND_WEBHOOK_SECRET set — accepting unverified')
    return true
  }
  const id = headers.get('svix-id')
  const ts = headers.get('svix-timestamp')
  const sigHeader = headers.get('svix-signature')
  if (!id || !ts || !sigHeader) return false
  try {
    const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64')
    const signedContent = `${id}.${ts}.${rawBody}`
    const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')
    const provided = sigHeader.split(' ').map(s => s.split(',')[1]).filter(Boolean)
    return provided.some(s => {
      try { return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)) } catch { return false }
    })
  } catch {
    return false
  }
}

function domainOf(from: string): string {
  const m = (from || '').match(/<([^>]+)>/)
  const addr = (m ? m[1] : from || '').trim().toLowerCase()
  return addr.split('@')[1] || ''
}

function toEmails(to: any): string[] {
  if (Array.isArray(to)) return to.map((x) => String(x).toLowerCase())
  if (typeof to === 'string') return [to.toLowerCase()]
  return []
}

async function suppress(email: string, reason: string, source: string, userId: string | null) {
  const { data: existing } = await supabaseAdmin
    .from('suppression_list').select('id').eq('email', email).maybeSingle()
  if (!existing) {
    await supabaseAdmin.from('suppression_list').insert({ email, reason, source, user_id: userId })
  }
}

// Pull a short human reason out of whatever the event carries.
function reasonFor(type: string, data: any): string | null {
  try {
    if (type === 'email.bounced') return String(data?.bounce?.message || data?.bounce?.type || 'bounced').slice(0, 300)
    if (type === 'email.complained') return 'spam complaint'
    if (type === 'email.clicked') return String(data?.click?.link || data?.click?.url || '').slice(0, 500) || null
    if (type === 'email.delivery_delayed') return String(data?.delivery_delayed?.message || 'delayed').slice(0, 300)
  } catch { /* ignore */ }
  return null
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  if (!verifySignature(process.env.RESEND_WEBHOOK_SECRET || '', req.headers, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let evt: any
  try {
    evt = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  const type: string = evt?.type || ''
  const data: any = evt?.data || {}
  const domain = domainOf(data?.from || '')
  const recipients = toEmails(data?.to)
  const resendId: string | null = data?.email_id ? String(data.email_id) : null

  try {
    // ── Resolve which tenant this belongs to ──
    // Primary: by the sending domain. Fallback: by the Resend message id we stored
    // on send_recipients at send time (so attribution still works if the domain
    // isn't in the ledger for some reason).
    let userId: string | null = null
    let domainRow: any = null
    if (domain) {
      const { data: dom } = await supabaseAdmin
        .from('client_domains')
        .select('id, user_id, bounce_count, complaint_count, reputation_score')
        .eq('domain_name', domain)
        .maybeSingle()
      if (dom) { domainRow = dom; userId = dom.user_id }
    }
    if (!userId && resendId) {
      const { data: rec } = await supabaseAdmin
        .from('send_recipients').select('job_id').eq('resend_id', resendId).maybeSingle()
      if (rec?.job_id) {
        const { data: jb } = await supabaseAdmin
          .from('send_jobs').select('user_id').eq('id', rec.job_id).maybeSingle()
        if (jb?.user_id) userId = jb.user_id
      }
    }

    // ── 1. STORE THE EVENT (every email.* type) ──
    if (type.startsWith('email.')) {
      const eventType = type.slice('email.'.length)  // delivered | opened | bounced | ...
      const email = recipients[0] || null
      const subject = data?.subject ? String(data.subject).slice(0, 500) : null
      const fromEmail = data?.from ? String(data.from).slice(0, 300) : null
      const reason = reasonFor(type, data)
      try {
        await supabaseAdmin.from('email_events').insert({
          user_id: userId,
          resend_id: resendId,
          email,
          event_type: eventType,
          subject,
          from_email: fromEmail,
          reason,
        })
      } catch (e) {
        console.error('[RESEND_WEBHOOK] event insert failed', e)
      }
    }

    // ── 2. BOUNCE: suppress the address; nudge reputation (never block domain) ──
    if (type === 'email.bounced') {
      const bounceType = String(data?.bounce?.type || data?.type || '').toLowerCase()
      const isHard = bounceType.includes('hard') || bounceType === 'permanent'
      if (isHard) {
        for (const em of recipients) await suppress(em, 'hard_bounce', 'resend', userId)
        if (domainRow) {
          await supabaseAdmin.from('client_domains').update({
            bounce_count: (domainRow.bounce_count || 0) + 1,
            reputation_score: Math.max(0, (domainRow.reputation_score ?? 100) - 2),
            last_event_at: new Date().toISOString(),
          }).eq('id', domainRow.id)
        }
      }
    }

    // ── 3. COMPLAINT: always suppress; nudge reputation (never block domain) ──
    else if (type === 'email.complained') {
      for (const em of recipients) await suppress(em, 'complaint', 'resend', userId)
      if (domainRow) {
        await supabaseAdmin.from('client_domains').update({
          complaint_count: (domainRow.complaint_count || 0) + 1,
          reputation_score: Math.max(0, (domainRow.reputation_score ?? 100) - 10),
          last_event_at: new Date().toISOString(),
        }).eq('id', domainRow.id)
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })

  } catch (error: any) {
    console.error('resend webhook error:', error)
    return NextResponse.json({ ok: false, note: 'handled with error' }, { status: 200 })
  }
}