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
    const rawBody = await req.text()
    
    const hmacHeader = req.headers.get('hmac')
    const ipnSecret = process.env.COINPAYMENTS_IPN_SECRET
    const merchantId = process.env.COINPAYMENTS_MERCHANT_ID

    if (!hmacHeader || !ipnSecret || !merchantId) {
      return NextResponse.json({ error: 'Missing security configuration' }, { status: 400 })
    }

    // 1. Verify Signature
    const calculatedHmac = crypto.createHmac('sha512', ipnSecret).update(rawBody).digest('hex')
    if (calculatedHmac !== hmacHeader) {
      console.error('⚠️ IPN Signature mismatch. Possible spoofing attempt.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Parse URL-encoded data
    const params = new URLSearchParams(rawBody)
    const status = Number(params.get('status'))
    const merchant = params.get('merchant')
    const customOrderId = params.get('custom')
    const depositAmount = Number(params.get('amount1')) // Exact USDT amount received

    if (merchant !== merchantId) {
      return NextResponse.json({ error: 'Merchant ID mismatch' }, { status: 401 })
    }

    // 3. Process Completed Payments
    if (status >= 100 || status === 2) {
      console.log(`✅ CoinPayments confirmed deposit for Order ID: ${customOrderId}`)

      if (!customOrderId) {
        return NextResponse.json({ error: 'Missing custom order ID' }, { status: 400 })
      }

      const parts = customOrderId.split('_')
      const txType = parts[0]
      const clientEmail = parts[1]

      // Fetch User Profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', clientEmail)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'User profile match failed' }, { status: 404 })
      }
      const userId = profile.id

      // Fetch Wallet
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

      // 🚀 FIXED: Fetch Live Pricing from Database to determine the plan
      if (txType === 'activation') {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 30)

        // Pull live pricing tiers from your database and sort them from most expensive to cheapest
        const { data: pricingTiers, error: pricingError } = await supabaseAdmin
          .from('system_pricing')
          .select('id, price')
          .order('price', { ascending: false })

        if (pricingError || !pricingTiers || pricingTiers.length === 0) {
          console.error("Critical Error: system_pricing table is empty or unreadable.")
          return NextResponse.json({ error: 'Pricing database unavailable' }, { status: 500 })
        }

        // Loop through the prices to see what the user can afford
        let assignedPlan = 'starter' // Failsafe default
        
        for (const tier of pricingTiers) {
          if (depositAmount >= tier.price) {
            assignedPlan = tier.id // e.g., 'enterprise', 'pro', or 'starter'
            break // Stop searching once we find the highest plan they can afford
          }
        }

        dbOperations.push(
          supabaseAdmin
            .from('profiles')
            .update({ 
              active_plan_id: assignedPlan, 
              plan_expires_at: expirationDate.toISOString() 
            })
            .eq('id', userId)
        )
      }

      // Execute all updates
      const results = await Promise.all(dbOperations)
      const hasError = results.some(res => res.error)

      if (hasError) {
        console.error('Database adjustment failure inside IPN pipeline:', results.map(r => r.error))
        return NextResponse.json({ error: 'Ledger update failed' }, { status: 500 })
      }

      console.log(`💰 Successfully credited ${depositAmount} USDT. Plan updated for ${clientEmail}`)
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('CoinPayments Webhook Error:', error)
    return NextResponse.json({ error: 'Internal pipeline error' }, { status: 500 })
  }
}