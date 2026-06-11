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

    // 1. Verify Signature Authenticity
    const calculatedHmac = crypto.createHmac('sha512', ipnSecret).update(rawBody).digest('hex')
    if (calculatedHmac !== hmacHeader) {
      console.error('⚠️ IPN Signature mismatch. Possible spoofing attempt.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Parse URL-encoded payment data incoming from CoinPayments
    const params = new URLSearchParams(rawBody)
    const status = Number(params.get('status'))
    const merchant = params.get('merchant')
    const customOrderId = params.get('custom')
    const depositAmount = Number(params.get('amount1')) // Exact currency amount received (e.g. USDT)

    if (merchant !== merchantId) {
      return NextResponse.json({ error: 'Merchant ID mismatch' }, { status: 401 })
    }

    // 3. Process Successfully Completed Payments (Status 100+ or Status 2 means success)
    if (status >= 100 || status === 2) {
      console.log(`✅ CoinPayments confirmed deposit for Order ID: ${customOrderId}`)

      if (!customOrderId) {
        return NextResponse.json({ error: 'Missing custom order ID metadata' }, { status: 400 })
      }

      const parts = customOrderId.split('_')
      const txType = parts[0]      // e.g., 'activation', 'topup', 'upgrade'
      const clientEmail = parts[1] // Extract client target email address securely

      // Fetch User Profile by Unique Email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', clientEmail)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'User profile match failed' }, { status: 404 })
      }
      const userId = profile.id

      // Fetch Existing User Wallet Ledger Balance
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

      // Build Transaction Queue
      const dbOperations: any[] = [
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
            description: txType === 'activation' || txType === 'upgrade' 
              ? 'Premium Node Network Plan Activation' 
              : 'Prepaid Wallet Top-Up'
          })
      ]

      // ─── 4. PLAN PROVISIONING ENGINE (ACTIVATION & UPGRADES) ───
      if (txType === 'activation' || txType === 'upgrade') {
        
        // Calculate exact expiration window: 30 days from the moment of confirmation
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 30)

        // Pull current admin config tiers dynamically from system configuration matrix
        const { data: pricingTiers, error: pricingError } = await supabaseAdmin
          .from('system_pricing')
          .select('id, price')
          .order('price', { ascending: false }) // Evaluate descending (highest match tier first)

        if (pricingError || !pricingTiers || pricingTiers.length === 0) {
          console.error("Critical System Warning: system_pricing registry configurations missing.")
          return NextResponse.json({ error: 'Pricing schema database unavailable' }, { status: 500 })
        }

        // Loop through pricing setups to match the deposit amount correctly
        let assignedPlan = 'starter' // Failsafe fallback anchor point
        
        for (const tier of pricingTiers) {
          if (depositAmount >= tier.price) {
            assignedPlan = tier.id // Assign matched level tier key (e.g., 'pro', 'scale', 'starter')
            break // Stop on highest verified financial tier bracket achieved
          }
        }

        // Add user profile update action to atomic request pool
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

      // Execute all operations asynchronously in parallel securely
      const results = await Promise.all(dbOperations)
      const hasError = results.some(res => res.error)

      if (hasError) {
        console.error('Database adjustment failure inside IPN ledger queue:', results.map(r => r.error))
        return NextResponse.json({ error: 'Database pipeline provisioning error' }, { status: 500 })
      }

      console.log(`💰 Ledger Credited: +${depositAmount} USDT. Tier state matched to [${txType}] for user ${clientEmail}`)
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('CoinPayments Critical IPN Exception Handler:', error)
    return NextResponse.json({ error: 'Internal system pipeline exception' }, { status: 500 })
  }
}