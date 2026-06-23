import type { SupabaseClient } from '@supabase/supabase-js'

export interface RiskInput {
  subject: string
  html_body: string
  from_email: string
  from_name?: string
  recipients: { email: string }[]
  userId: string
  supabaseAdmin: SupabaseClient<any, any, any>
}

export interface RiskResult {
  classification: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  action: 'ALLOW' | 'WARN' | 'REQUIRE_REVIEW' | 'BLOCK'
  reasons: string[]
  rewrite_recommended: boolean
  domain_status: string
  tenant_status: string
  notes: string[]
}

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'rb.gy']
const ROLE_PREFIXES = ['info', 'admin', 'support', 'contact', 'sales', 'billing', 'help', 'no-reply', 'noreply', 'postmaster', 'abuse', 'webmaster']
const DISPOSABLE = ['mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'trashmail.com', 'yopmail.com', 'getnada.com', 'sharklasers.com', 'dispostable.com']
const URGENCY = ['urgent', 'act now', 'limited time', 'expires', 'final notice', 'last chance', 'hurry', "don't miss"]
const DECEPTION = ['account will be closed', 'account suspended', 'verify your account', 'unusual activity', 'confirm your password', 'update your billing', 'payment failed', 'click here to verify']

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levelFor(score: number): RiskResult['risk_level'] {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}
function actionFor(score: number): RiskResult['action'] {
  if (score >= 80) return 'BLOCK'
  if (score >= 60) return 'REQUIRE_REVIEW'
  if (score >= 30) return 'WARN'
  return 'ALLOW'
}

// ---- Layer 1: deterministic structural/recipient heuristics (no API cost) ----
function structuralScore(input: RiskInput) {
  const reasons: string[] = []
  const notes: string[] = []
  let score = 0

  const subject = input.subject || ''
  const html = input.html_body || ''
  const text = stripHtml(html)
  const words = text.split(/\s+/).filter(Boolean).length || 1

  const links = (html.match(/<a\s[^>]*href=/gi) || []).length
  const imgs = (html.match(/<img\s/gi) || []).length
  const linkDensity = (links / words) * 100

  if (links > 15) { score += 12; reasons.push(`High link count (${links})`) }
  if (linkDensity > 4 && links > 3) { score += 10; reasons.push('High link-to-text density') }
  if (imgs > 0 && words < 25) { score += 18; reasons.push('Image-only email (little/no text)') }

  const hasUnsub = /unsubscribe/i.test(html) || /\{\{unsubscribe_url\}\}/i.test(html)
  if (!hasUnsub) { score += 10; reasons.push('No unsubscribe link') }
  if (!/(street|st\.|ave|avenue|road|rd\.|suite|p\.o\.|box|blvd)/i.test(text)) {
    notes.push('No physical business address detected')
  }

  const shortenerHit = SHORTENERS.filter(s => html.toLowerCase().includes(s))
  if (shortenerHit.length) { score += 14; reasons.push(`URL shortener used (${shortenerHit[0]})`) }

  const capsRunSubj = (subject.match(/\b[A-Z]{4,}\b/g) || []).length
  if (subject && subject === subject.toUpperCase() && subject.length > 8) { score += 10; reasons.push('Subject is ALL CAPS') }
  else if (capsRunSubj >= 2) { score += 5; reasons.push('Excessive capitalization') }

  const emojis = (subject + ' ' + text).match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []
  if (emojis.length > 8) { score += 6; reasons.push('Excessive emoji usage') }

  const urgencyHit = URGENCY.filter(u => (subject + ' ' + text).toLowerCase().includes(u))
  if (urgencyHit.length >= 2) { score += 8; reasons.push('Urgency manipulation language') }
  const decepHit = DECEPTION.filter(d => text.toLowerCase().includes(d))
  if (decepHit.length) { score += 16; reasons.push('Account/security scare pattern') }

  const emails = input.recipients.map(r => (r.email || '').toLowerCase())
  const total = emails.length || 1
  const roleCount = emails.filter(e => ROLE_PREFIXES.includes(e.split('@')[0])).length
  const dispCount = emails.filter(e => DISPOSABLE.includes(e.split('@')[1] || '')).length
  if (roleCount / total > 0.3) { score += 10; reasons.push('High concentration of role addresses') }
  if (dispCount > 0) { score += 8; reasons.push('Disposable recipient domains present') }

  return { score: Math.min(score, 100), reasons, notes, hasUnsub }
}

// ---- Layer 2: semantic AI judge (classification + phishing/scam/impersonation) ----
async function aiJudge(subject: string, text: string) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return { judged: false, risk: 0, classification: '', hardBlock: false, reasons: [] as string[] }

  const sys =
    'You are an email safety + spam risk classifier for a multi-tenant sending platform. ' +
    'Judge meaning and intent, not keywords. Classify the email and detect phishing, scams, ' +
    'impersonation (banks, govt, brands, payment processors), fraud, malware, credential theft, ' +
    'extortion, fake invoices/payment requests, and illegal content. ' +
    'Respond ONLY as JSON: {"risk":0-100,"classification":"SAFE|TRANSACTIONAL|MARKETING|NEWSLETTER|SUSPICIOUS|PHISHING|SCAM|ILLEGAL",' +
    '"phishing":bool,"impersonation":bool,"scam":bool,"illegal":bool,"reasons":["<12 words", ...]}. Max 5 reasons.'

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 15000)
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `SUBJECT: ${subject}\n\nBODY:\n${text}` },
        ],
      }),
    })
    clearTimeout(t)
    if (!resp.ok) return { judged: false, risk: 0, classification: '', hardBlock: false, reasons: [] }
    const data = await resp.json()
    const raw = data?.choices?.[0]?.message?.content || ''
    const p = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1))
    const risk = Math.max(0, Math.min(100, parseInt(p?.risk, 10) || 0))
    const cls = String(p?.classification || '').toUpperCase()
    const hardBlock = !!p?.phishing || !!p?.impersonation || !!p?.scam || !!p?.illegal ||
      ['PHISHING', 'SCAM', 'ILLEGAL'].includes(cls)
    const reasons = Array.isArray(p?.reasons) ? p.reasons.slice(0, 5).map((s: any) => `[AI] ${String(s).slice(0, 120)}`) : []
    return { judged: true, risk, classification: cls, hardBlock, reasons }
  } catch {
    return { judged: false, risk: 0, classification: '', hardBlock: false, reasons: [] }
  }
}

// ---- Layer 3: behavioral/reputation context from DB ----
async function contextSignals(input: RiskInput) {
  const reasons: string[] = []
  const notes: string[] = []
  let score = 0
  let domain_status = 'unknown'
  let tenant_status = 'unknown'

  const domainPart = (input.from_email || '').split('@')[1] || ''
  try {
    const { data: dom } = await input.supabaseAdmin
      .from('client_domains').select('status, created_at')
      .eq('user_id', input.userId).eq('domain_name', domainPart).maybeSingle()
    if (dom) {
      domain_status = (dom as any).status || 'unknown'
      const ageHrs = (Date.now() - new Date((dom as any).created_at).getTime()) / 3.6e6
      if (ageHrs < 24 && input.recipients.length > 50) {
        score += 20; reasons.push(`New domain (<24h) sending ${input.recipients.length}`)
      } else if (ageHrs < 72 && input.recipients.length > 500) {
        score += 12; reasons.push('Young domain large send')
      }
    } else {
      score += 8; notes.push('Sending domain not found in ledger')
    }
  } catch { /* fail-open */ }

  try {
    const { data: prof } = await input.supabaseAdmin
      .from('profiles').select('status').eq('id', input.userId).maybeSingle()
    if (prof) tenant_status = (prof as any).status || 'unknown'
  } catch { /* ignore */ }

  try {
    const since = new Date(Date.now() - 24 * 3.6e6).toISOString()
    const { count } = await input.supabaseAdmin
      .from('send_jobs').select('id', { count: 'exact', head: true })
      .eq('user_id', input.userId).eq('subject', input.subject).gte('created_at', since)
    if ((count || 0) >= 3) { score += 10; reasons.push('Identical campaign repeated recently') }
  } catch { /* ignore */ }

  return { score: Math.min(score, 40), reasons, notes, domain_status, tenant_status }
}

export async function scoreEmail(input: RiskInput): Promise<RiskResult> {
  try {
    const text = stripHtml(input.html_body).slice(0, 6000)
    const struct = structuralScore(input)
    const [ai, ctx] = await Promise.all([aiJudge((input.subject || '').slice(0, 500), text), contextSignals(input)])

    let score = Math.max(struct.score, ai.risk)
    score = Math.min(100, score + Math.round(ctx.score * 0.5))

    let classification = ai.classification || (score >= 60 ? 'SUSPICIOUS' : 'MARKETING')
    let action = actionFor(score)
    const reasons = [...new Set([...struct.reasons, ...ai.reasons, ...ctx.reasons])]
    const notes = [...new Set([...struct.notes, ...ctx.notes])]

    if (ai.hardBlock) {
      score = 100; action = 'BLOCK'; classification = classification || 'PHISHING'
      reasons.unshift('Phishing/scam/impersonation/illegal detected')
    }
    if (!ai.judged) notes.push('AI judge unavailable — structural-only scoring')

    return {
      classification,
      risk_score: score,
      risk_level: levelFor(score),
      action,
      reasons,
      rewrite_recommended: score >= 30 && action !== 'BLOCK',
      domain_status: ctx.domain_status,
      tenant_status: ctx.tenant_status,
      notes,
    }
  } catch (e) {
    return {
      classification: 'SAFE', risk_score: 0, risk_level: 'low', action: 'ALLOW',
      reasons: [], rewrite_recommended: false, domain_status: 'unknown',
      tenant_status: 'unknown', notes: ['risk-engine error: ' + String((e as any)?.message || e).slice(0, 120)],
    }
  }
}