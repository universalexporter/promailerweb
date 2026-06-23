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

async function pauseDomainJobs(userId: string, domain: string) {
  await supabaseAdmin.from('send_jobs')
    .update({ status: 'paused' })
    .eq('user_id', userId)
    .in('status', ['active', 'scheduled'])
    .ilike('from_email', `%@${domain}`)
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

  try {
    let userId: string | null = null
    let domainRow: any = null
    if (domain) {
      const { data: dom } = await supabaseAdmin
        .from('client_domains')
        .select('id, user_id, status, sent_count, bounce_count, complaint_count, reputation_score')
        .eq('domain_name', domain)
        .maybeSingle()
      if (dom) { domainRow = dom; userId = dom.user_id }
    }

    // ───────────── BOUNCE ─────────────
    if (type === 'email.bounced') {
      const bounceType = String(data?.bounce?.type || data?.type || '').toLowerCase()
      const isHard = bounceType.includes('hard') || bounceType === 'permanent'

      if (isHard) {
        for (const em of recipients) await suppress(em, 'hard_bounce', 'resend', userId)
      }

      if (domainRow && isHard) {
        const bounceCount = (domainRow.bounce_count || 0) + 1
        const sent = domainRow.sent_count || 0
        const rep = Math.max(0, (domainRow.reputation_score ?? 100) - 2)
        await supabaseAdmin.from('client_domains').update({
          bounce_count: bounceCount,
          reputation_score: rep,
          last_event_at: new Date().toISOString(),
        }).eq('id', domainRow.id)

        if (sent >= 50 && userId) {
          const rate = bounceCount / sent
          if (rate >= 0.10) {
            await supabaseAdmin.from('profiles').update({ status: 'suspended' }).eq('id', userId)
            console.warn(`[RESEND_WEBHOOK] tenant ${userId} suspended — bounce ${(rate * 100).toFixed(1)}%`)
          } else if (rate >= 0.08) {
            await pauseDomainJobs(userId, domain)
            console.warn(`[RESEND_WEBHOOK] domain ${domain} jobs paused — bounce ${(rate * 100).toFixed(1)}%`)
          }
        }
      }
    }

    // ───────────── COMPLAINT ─────────────
    else if (type === 'email.complained') {
      for (const em of recipients) await suppress(em, 'complaint', 'resend', userId)

      if (domainRow) {
        const complaintCount = (domainRow.complaint_count || 0) + 1
        const sent = domainRow.sent_count || 0
        const rep = Math.max(0, (domainRow.reputation_score ?? 100) - 10)
        await supabaseAdmin.from('client_domains').update({
          complaint_count: complaintCount,
          reputation_score: rep,
          last_event_at: new Date().toISOString(),
        }).eq('id', domainRow.id)

        if (sent >= 50 && userId) {
          const rate = complaintCount / sent
          if (rate >= 0.01) {
            await supabaseAdmin.from('profiles').update({ status: 'suspended' }).eq('id', userId)
            console.warn(`[RESEND_WEBHOOK] tenant ${userId} suspended — complaint ${(rate * 100).toFixed(2)}%`)
          } else if (rate >= 0.005) {
            await supabaseAdmin.from('client_domains').update({ status: 'suspended' }).eq('id', domainRow.id)
            console.warn(`[RESEND_WEBHOOK] domain ${domain} suspended — complaint ${(rate * 100).toFixed(2)}%`)
          }
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })

  } catch (error: any) {
    console.error('resend webhook error:', error)
    return NextResponse.json({ ok: false, note: 'handled with error' }, { status: 200 })
  }
}