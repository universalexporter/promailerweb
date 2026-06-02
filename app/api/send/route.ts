import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // 1. Authenticate via Bearer Token (Perfectly matches your Python engine.py)
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 })
    }
    const apiKey = authHeader.split(' ')[1]

    // 2. Parse the exact payload your Python app sends
    const body = await req.json()
    const { to, from_email, from_name, subject, html_body } = body

    if (!to || !from_email) {
      return NextResponse.json({ error: 'Missing routing parameters' }, { status: 400 })
    }

    // 3. Find the User via their API Key
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, active_plan_id, emails_sent')
      .eq('api_key', apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }

    const userId = profile.id

    // 4. Verify Domain Ownership (Layer 2 Security Check)
    const domainPart = from_email.split('@')[1]
    const { data: domainCheck } = await supabaseAdmin
      .from('client_domains')
      .select('status')
      .eq('user_id', userId)
      .eq('domain_name', domainPart)
      .single()

    if (!domainCheck || domainCheck.status !== 'active') {
      return NextResponse.json({ error: `Domain ${domainPart} is not verified.` }, { status: 403 })
    }

    // 5. Billing & Limits Engine
    let canSend = false
    let isOverage = false
    let overageCost = 0.006 // Failsafe default

    // Check if they have an active plan with available limits
    if (profile.active_plan_id) {
      const { data: planData } = await supabaseAdmin
        .from('system_pricing')
        .select('email_limit, overage_cost')
        .eq('id', profile.active_plan_id)
        .single()

      if (planData) {
        overageCost = planData.overage_cost
        if (profile.emails_sent < planData.email_limit) {
          canSend = true // Room left in base plan
        }
      }
    }

    let walletData = null

    // If plan is exhausted (or they have no plan), check Wallet for Pay-As-You-Go
    if (!canSend) {
      const { data: wData } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()
      
      walletData = wData

      if (walletData && Number(walletData.balance) >= overageCost) {
        canSend = true
        isOverage = true 
      }
    }

    // 6. Hard Block if broke
    if (!canSend) {
      return NextResponse.json({ error: 'Insufficient Balance or Plan Limits Exhausted.' }, { status: 402 })
    }

    // 7. FIRE THE EMAIL VIA RESEND (Using native fetch so no extra installs needed)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${from_name} <${from_email}>`,
        to: [to],
        subject: subject,
        html: html_body
      })
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json()
      console.error('Resend Error:', resendError)
      return NextResponse.json({ error: resendError.message || 'Failed to route email' }, { status: 502 })
    }

    // 8. Financial Accounting
    if (isOverage && walletData) {
      // Deduct overage cost from wallet
      await supabaseAdmin
        .from('wallets')
        .update({ balance: Number(walletData.balance) - overageCost })
        .eq('user_id', userId)
    } else {
      // Increment monthly plan usage
      await supabaseAdmin
        .from('profiles')
        .update({ emails_sent: profile.emails_sent + 1 })
        .eq('id', userId)
    }

    return NextResponse.json({ success: true, message: 'Dispatched' }, { status: 200 })

  } catch (error: any) {
    console.error('API Send Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}