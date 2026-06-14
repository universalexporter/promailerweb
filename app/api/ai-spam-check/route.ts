import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Strip HTML to plain text so the model judges content, not markup.
function stripHtml(html: string): string {
  return (html || '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: Request) {
  try {
    // Auth — same Bearer API key pattern as the rest of the app
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
    }
    const apiKey = authHeader.split(' ')[1]

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('id').eq('api_key', apiKey).single()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }

    const body = await req.json()
    const subject = (body?.subject || '').toString().slice(0, 500)
    const rawBody = (body?.html_body || body?.body || '').toString()
    const text = stripHtml(rawBody).slice(0, 6000) // cap to control token cost

    if (!subject && !text) {
      return NextResponse.json({ risk: 0, issues: [], judged: false }, { status: 200 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      // No key configured — let the app fall back to local + Postmark.
      return NextResponse.json({ risk: 0, issues: [], judged: false }, { status: 200 })
    }

    const systemPrompt =
      'You are an expert email-deliverability and spam-filter analyst. Judge how likely a ' +
      'marketing/outreach email is to be flagged as spam or to harm sender reputation, considering: ' +
      'phishing/scam/fraud signals, threats, profanity or slurs, deceptive claims, aggressive sales ' +
      'language, misleading subject lines, and anything illegal or abusive. Judge MEANING and intent, ' +
      'not just keywords — a clean professional email should score low even if it mentions words like ' +
      '"free" legitimately, and a harmful email should score high even if it avoids obvious trigger words. ' +
      'Respond with ONLY a JSON object of the form {"risk": <integer 0-100>, "issues": ["short reason", ...]}. ' +
      'risk 0-29 = clean/inbox-safe, 30-59 = some concerns, 60-100 = high risk / likely blocked or harmful. ' +
      'Each issue under 12 words. Max 5 issues.'

    const userContent = `SUBJECT: ${subject}\n\nBODY:\n${text}`

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 400,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    })

    if (!resp.ok) {
      return NextResponse.json({ risk: 0, issues: [], judged: false }, { status: 200 })
    }

    const data = await resp.json()
    const textOut = data?.choices?.[0]?.message?.content || ''

    let parsed: any = null
    try {
      const clean = textOut.replace(/```json/gi, '').replace(/```/g, '').trim()
      const start = clean.indexOf('{')
      const end = clean.lastIndexOf('}')
      parsed = JSON.parse(clean.slice(start, end + 1))
    } catch {
      return NextResponse.json({ risk: 0, issues: [], judged: false }, { status: 200 })
    }

    let risk = parseInt(parsed?.risk, 10)
    if (isNaN(risk)) risk = 0
    risk = Math.max(0, Math.min(100, risk))
    const issues = Array.isArray(parsed?.issues)
      ? parsed.issues.slice(0, 5).map((s: any) => `[AI] ${String(s).slice(0, 120)}`)
      : []

    return NextResponse.json({ risk, issues, judged: true }, { status: 200 })

  } catch (error: any) {
    console.error('ai-spam-check error:', error)
    return NextResponse.json({ risk: 0, issues: [], judged: false }, { status: 200 })
  }
}