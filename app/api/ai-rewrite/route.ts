import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Maps the desktop app's preset goals to concrete instructions for the model.
const GOAL_PROMPTS: Record<string, string> = {
  warmer: 'Make it warmer, friendlier and more human — write like one thoughtful person to another.',
  persuasive: 'Make it more persuasive: lead with a clear benefit, add gentle social proof or specificity, and build a logical reason to act.',
  shorter: 'Make it shorter and punchier. Cut filler and redundancy; keep the core message and the call to action.',
  expand: 'Add useful depth and detail where it strengthens the message, without padding or fluff.',
  less_spammy: 'Remove spam-trigger words, ALL-CAPS, excessive punctuation and hypey claims so it lands in the inbox. Keep it honest.',
  formal: 'Make it more formal, refined and polished — appropriate for executives and premium brands.',
  storytelling: 'Open with a short, relatable hook or mini-story (1–2 sentences) that draws the reader in, then transition naturally to the message.',
  strong_cta: 'Sharpen the call to action: make it single, specific, benefit-led and easy to act on.',
  fix_grammar: 'Fix grammar, spelling and punctuation and lightly polish phrasing without changing meaning.',
  personalize: 'Weave in the {{first_name}} merge tag naturally near the opening so it reads personal, not templated.',
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate via Bearer Token (same scheme as /api/send)
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
    }
    const apiKey = authHeader.split(' ')[1]

    // 2. Parse payload from the desktop editor
    const body = await req.json()
    const { subject, html_body } = body
    // Accept the new multi-goal payload, falling back to the legacy single `goal`.
    const goals: string[] = Array.isArray(body.goals) && body.goals.length
      ? body.goals
      : [body.goal || 'warmer']
    const tone: string = (body.tone || 'professional').toString()
    const length: string = (body.length || 'keep').toString()
    const audience: string = (body.audience || '').toString().slice(0, 400)
    if (!html_body || typeof html_body !== 'string') {
      return NextResponse.json({ error: 'Missing email body to rewrite.' }, { status: 400 })
    }

    // 3. Resolve the user from their API key (authorize the request)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }

    // 4. Build the instruction (AI rewrites are free — no billing/limits here)
    const goalLines = goals
      .map((g) => GOAL_PROMPTS[g])
      .filter(Boolean)
      .map((line, i) => `${i + 1}. ${line}`)
      .join('\n')

    const lengthMap: Record<string, string> = {
      keep: 'Keep roughly the same length as the original.',
      short: 'Aim for a concise email of about 60–110 words.',
      medium: 'Aim for a medium email of about 120–200 words.',
      long: 'Aim for a richer email of about 220–320 words, but never padded.',
    }

    const systemPrompt =
      'You are a world-class email copywriter and editor for premium brands. You craft elegant, ' +
      'high-converting marketing emails that feel personal, credible and effortless to read — never cheap, ' +
      'never gimmicky, never spammy. You write with rhythm and restraint: strong specific subject lines, ' +
      'a compelling first line, clear structure, and one clean call to action. ' +
      'You will receive an email subject and HTML body and must rewrite BOTH. ' +
      'Rules: preserve every merge tag exactly ({{first_name}}, {{last_name}}, {{email}}, {{unsubscribe_url}}); ' +
      'never remove an existing unsubscribe link; keep HTML valid and simple (<p>, <a>, <b>, <strong>, <em>, <ul>, <li>, <img>, <br>); ' +
      'do not invent links, prices, or facts that were not present; avoid ALL-CAPS, "!!!", and spam-trigger hype. ' +
      'Write a subject line under ~55 characters. Respond with STRICT JSON only, no markdown: ' +
      '{"subject": "...", "html_body": "..."}.'

    const userPrompt =
      `APPLY THESE GOALS TOGETHER:\n${goalLines || '1. Improve overall quality.'}\n\n` +
      `TONE: ${tone}.\n` +
      `LENGTH: ${lengthMap[length] || lengthMap.keep}\n` +
      (audience ? `AUDIENCE / CONTEXT: ${audience}\n` : '') +
      `\nCURRENT SUBJECT: ${subject || '(none)'}\n\n` +
      `CURRENT HTML BODY:\n${html_body}`

    // 5. Call OpenAI (key stays on the server; never in the desktop app)
    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.75,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!aiResp.ok) {
      let msg = `AI provider error (${aiResp.status}).`
      try { msg = (await aiResp.json())?.error?.message || msg } catch (_) {}
      console.error('OpenAI Error:', msg)
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const aiData = await aiResp.json()
    const raw = aiData?.choices?.[0]?.message?.content || '{}'

    let parsed: { subject?: string; html_body?: string }
    try {
      parsed = JSON.parse(raw)
    } catch (_) {
      return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 502 })
    }

    return NextResponse.json(
      {
        subject: parsed.subject ?? subject ?? '',
        html_body: parsed.html_body ?? html_body,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('AI Rewrite Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}