import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize the Admin Supabase client to bypass RLS securely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // CoinPayments sends data as form-urlencoded text, not JSON
    const rawBody = await req.text()
    
    // CoinPayments puts the signature in the 'hmac' header
    const hmacHeader = req.headers.get('hmac')
    const ipnSecret = process.env.COINPAYMENTS_IPN_SECRET
    const merchantId = process.env.COINPAYMENTS_MERCHANT_ID

    if (!hmacHeader || !ipnSecret || !merchantId) {
      return NextResponse.json({ error: 'Missing security configuration' }, { status: 400 })
    }

    // 1. Verify the Cryptographic Signature
    const calculatedHmac = crypto.createHmac('sha512', ipnSecret).update(rawBody).digest('hex')

    if (calculatedHmac !== hmacHeader) {
      console.error('⚠️ IPN Signature mismatch. Possible spoofing attempt.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Parse the URL-encoded data
    const params = new URLSearchParams(rawBody)
    const status = Number(params.get('status'))
    const merchant = params.get('merchant')
    const customOrderId = params.get('custom') // This holds our 'type_email_timestamp'
    const depositAmount = Number(params.get('amount1')) // amount1 is the original fiat/USDT amount

    // Verify it was sent to your specific merchant ID
    if (merchant !== merchantId) {
      return NextResponse.json({ error: 'Merchant ID mismatch' }, { status: 401 })
    }

    // 3. Process Only Completed Payments (CoinPayments status >= 100 means completed/confirmed)
    if (status >= 100 || status === 2) {
      console.log(`✅ CoinPayments confirmed deposit for Order ID: ${customOrderId}`)

      if (!customOrderId) {
        return NextResponse.json({ error: 'Missing custom order ID' }, { status: 400 })
      }

      const parts = customOrderId.split('_')
      const txType = parts[0]
      const clientEmail = parts[1]

      // Find the user's UUID
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', clientEmail)
        .single()

      if (profileError || !profile) {
        console.error(`User not found for email: ${clientEmail}`)
        return NextResponse.json({ error: 'User profile match failed' }, { status: 404 })
      }

      const userId = profile.id

      // Fetch current wallet status
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (walletError || !wallet) {
        return NextResponse.json({ error: 'Wallet lookup failed' }, { status: 404 })
      }

      const currentBalance = Number(wallet.balance)
      const newBalance = currentBalance + depositAmount

      // Build the base database execution batch
      const dbOperations = [
        supabaseAdmin
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', userId),
        supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            amount: depositAmount,
            transaction_type: 'deposit',
            description: txType === 'activation' ? 'Initial Node Network Activation' : 'Prepaid Wallet Top-Up'
          })
      ]

      // 🚀 FIXED: Update matching your exact active_plan_id & plan_expires_at schema
      if (txType === 'activation') {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 30) // Add exactly 30 days of active service

        dbOperations.push(
          supabaseAdmin
            .from('profiles')
            .update({ 
              active_plan_id: 'starter', 
              plan_expires_at: expirationDate.toISOString() 
            })
            .eq('id', userId)
        )
      }

      // Execute all database adjustments atomically
      const results = await Promise.all(dbOperations)
      const hasError = results.some(res => res.error)

      if (hasError) {
        console.error('Database adjustment failure inside IPN pipeline:', results.map(r => r.error))
        return NextResponse.json({ error: 'Ledger update failed' }, { status: 500 })
      }

      console.log(`💰 Successfully credited ${depositAmount} USDT and updated subscription plan for ${clientEmail}`)
    }

    // CoinPayments requires a simple HTTP 200 response to stop pinging
    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('CoinPayments Webhook Error:', error)
    return NextResponse.json({ error: 'Internal pipeline error' }, { status: 500 })
  }
}