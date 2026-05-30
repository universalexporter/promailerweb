import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const COST_PER_EMAIL = 0.001

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { apiKey, targetEmail, subject, htmlBody } = body

    if (!apiKey || !targetEmail) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('api_key', apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
    }

    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', profile.id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    const currentBalance = Number(wallet.balance)

    if (currentBalance < COST_PER_EMAIL) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 })
    }

    // Fire the Email through Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ProMail Node <noreply@pro-mail.club>',
        to: [targetEmail],
        subject: subject,
        html: htmlBody
      })
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json()
      console.error('Resend Error:', resendError)
      return NextResponse.json({ error: 'Failed to route email' }, { status: 502 })
    }

    const newBalance = currentBalance - COST_PER_EMAIL
    
    await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', profile.id)

    return NextResponse.json({ success: true, remaining_balance: newBalance }, { status: 200 })

  } catch (error) {
    console.error('Send Relay Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}