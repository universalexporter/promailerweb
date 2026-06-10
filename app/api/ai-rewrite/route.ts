import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Maps the desktop app's preset goals to concrete instructions for the model.
const GOAL_PROMPTS: Record<string, string> = {
  warmer: 'Rewrite to sound warmer, friendlier and more human, while keeping the same meaning.',
  shorter: 'Rewrite to be shorter and more concise. Cut filler, keep the core message and any call to action.',
  less_spammy: 'Rewrite to avoid spam-trigger words, ALL-CAPS, excessive punctuation and hypey claims, so it is more likely to land in the inbox. Keep it honest and professional.',
  fix_grammar: 'Fix grammar, spelling and punctuation, and lightly polish phrasing. Do not change the meaning or tone.',
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
    const { subject, html_body, goal } = body
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
    const instruction = GOAL_PROMPTS[goal] || GOAL_PROMPTS.warmer

    const systemPrompt =
      'You are an expert email-marketing copy editor. You will receive an email subject and an HTML body. ' +
      'Rewrite them according to the instruction. Preserve any merge tags exactly as written, including {{first_name}}, ' +
      '{{last_name}} and {{email}}. Keep the HTML structure valid and simple (keep tags like <p>, <a>, <b>, <ul>, <li>, <img>). ' +
      'Do not invent links or facts. Respond with STRICT JSON only, no markdown, in the form: ' +
      '{"subject": "...", "html_body": "..."}.'

    const userPrompt =
      `INSTRUCTION: ${instruction}\n\n` +
      `CURRENT SUBJECT: ${subject || '(none)'}\n\n` +
      `CURRENT HTML BODY:\n${html_body}`

    // 5. Call OpenAI (key stays on the server; never in the desktop app)
    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
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