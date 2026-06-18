// =============================================================================
//  ProMail Suite — Unsubscribe endpoint
//  Deploy to:  app/api/unsubscribe/route.ts
//
//  Handles the link recipients click in your emails. The link is built by
//  /api/send as:
//      https://promailerweb.vercel.app/api/unsubscribe?u=<token>&d=<sendingDomain>
//  where <token> = base64url(email) + "." + HMAC_SHA256(UNSUB_SECRET, email)
//  and  <d>      = the domain the email was sent from (shown on the page).
//
//  GET  -> shows a friendly confirmation page and unsubscribes (works for the
//          link people click, and for Gmail/Yahoo "List-Unsubscribe" GET).
//  POST -> RFC 8058 one-click unsubscribe (Gmail/Yahoo send an empty POST).
//
//  Required env vars (Vercel → Settings → Environment Variables):
//      UNSUB_SECRET                 a long random string (same value used by /api/send)
//      NEXT_PUBLIC_SUPABASE_URL     (you already have this)
//      SUPABASE_SERVICE_ROLE_KEY    (you already have this)
// =============================================================================
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- token helpers (must match /api/send) ----------------------------------
function b64urlDecode(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Buffer.from(s, 'base64').toString('utf8')
}

function verifyToken(token: string): string | null {
  try {
    const secret = process.env.UNSUB_SECRET || ''
    if (!secret || !token || token.indexOf('.') === -1) return null
    const [encEmail, sig] = token.split('.')
    const email = b64urlDecode(encEmail)
    const expected = crypto.createHmac('sha256', secret).update(email).digest('hex').slice(0, 32)
    // constant-time compare
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    return email
  } catch {
    return null
  }
}

// Only allow a clean, safe domain string to be echoed back into the page.
function safeDomain(raw: string | null): string {
  if (!raw) return ''
  const d = raw.trim().toLowerCase()
  // valid domain characters only — blocks any HTML/script injection
  if (!/^[a-z0-9.-]{1,253}$/.test(d)) return ''
  return d
}

async function unsubscribe(email: string) {
  await supabaseAdmin
    .from('contacts')
    .update({ status: 'unsubscribed' })
    .eq('email', email)
}

function page(message: string, ok: boolean, domain: string): string {
  const accent = ok ? '#10b981' : '#ef4444'
  const brand = domain
    ? `<div style="margin-bottom:18px;font-family:'Segoe UI',system-ui,sans-serif;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#9b5de5;">${domain}</div>`
    : ''
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribe</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#0b0716;font-family:'Segoe UI',system-ui,sans-serif;color:#fff;}
  .card{max-width:440px;padding:40px;border-radius:16px;background:#11091f;
        border:1px solid rgba(255,255,255,0.08);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);}
  .dot{width:54px;height:54px;border-radius:50%;background:${accent};margin:0 auto 20px;
       display:flex;align-items:center;justify-content:center;font-size:28px;color:#0b0716;font-weight:900;}
  h1{font-size:21px;margin:0 0 10px;font-weight:800;}
  p{color:#a79fbb;font-size:14px;line-height:1.6;margin:0;}
</style></head>
<body><div class="card">${brand}<div class="dot">${ok ? '\u2713' : '!'}</div>
<h1>${ok ? 'You\u2019re unsubscribed' : 'Link problem'}</h1><p>${message}</p></div></body></html>`
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('u') || ''
  const domain = safeDomain(url.searchParams.get('d'))
  const email = verifyToken(token)
  if (!email) {
    return new NextResponse(page('This unsubscribe link is invalid or has expired.', false, domain), {
      status: 400, headers: { 'Content-Type': 'text/html' },
    })
  }
  await unsubscribe(email)
  const from = domain ? `emails from ${domain}` : 'this mailing list'
  return new NextResponse(
    page(`${email} has been removed and won\u2019t receive further ${from}.`, true, domain),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}

// Gmail / Yahoo one-click (RFC 8058): an empty POST to the same URL.
export async function POST(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('u') || ''
  const email = verifyToken(token)
  if (!email) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  await unsubscribe(email)
  return NextResponse.json({ ok: true }, { status: 200 })
}