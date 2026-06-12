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
      console.error('IPN config missing: hmac/secret/merchant not all present.')
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
      console.log(`✅ CoinPayments confirmed deposit. Order: ${customOrderId}, amount: ${depositAmount}`)

      if (!customOrderId) {
        return NextResponse.json({ error: 'Missing custom order ID metadata' }, { status: 400 })
      }

      // ─── ROBUST ORDER PARSING ───
      // New format:  {type}_{planId}_{email}_{timestamp}
      // Old format:  {type}_{email}_{timestamp}   (still supported as a fallback)
      // We split, then rebuild the email from the MIDDLE parts so emails that
      // themselves contain "_" never corrupt the parse.
      const parts = customOrderId.split('_')
      const txType = parts[0] // 'activation' | 'upgrade' | 'topup'

      let planIdFromOrder: string | null = null
      let clientEmail = ''

      const KNOWN_TYPES = ['activation', 'upgrade', 'topup']
      // Detect the new 4+ part format (has an explicit plan id slot).
      if (parts.length >= 4 && KNOWN_TYPES.includes(txType)) {
        planIdFromOrder = parts[1] === 'wallet' ? null : parts[1]
        // email = everything between the planId slot and the trailing timestamp
        clientEmail = parts.slice(2, parts.length - 1).join('_')
      } else {
        // Legacy: {type}_{email}_{timestamp}
        clientEmail = parts.slice(1, parts.length - 1).join('_')
      }

      if (!clientEmail) {
        return NextResponse.json({ error: 'Could not parse client email from order id' }, { status: 400 })
      }

      // Fetch User Profile by Unique Email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', clientEmail)
        .single()

      if (profileError || !profile) {
        console.error('Profile match failed for email:', clientEmail)
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

      // Build Transaction Queue (wallet credit + ledger record always happen)
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
            description: (txType === 'activation' || txType === 'upgrade')
              ? 'Premium Node Network Plan Activation'
              : 'Prepaid Wallet Top-Up'
          })
      ]

      // ─── 4. PLAN PROVISIONING ENGINE (ACTIVATION & UPGRADES) ───
      if (txType === 'activation' || txType === 'upgrade') {

        // 30 days from the exact moment of confirmation
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 30)

        // Pull the admin-managed tiers (id + price) to validate / fall back.
        const { data: pricingTiers, error: pricingError } = await supabaseAdmin
          .from('system_pricing')
          .select('id, price')
          .order('price', { ascending: false }) // highest first for price fallback

        if (pricingError || !pricingTiers || pricingTiers.length === 0) {
          console.error('Critical: system_pricing registry missing.')
          return NextResponse.json({ error: 'Pricing schema database unavailable' }, { status: 500 })
        }

        const validIds = new Set(pricingTiers.map(t => t.id))

        // PRIMARY: trust the plan id embedded in the order, if it is a real tier.
        let assignedPlan: string | null = null
        if (planIdFromOrder && validIds.has(planIdFromOrder)) {
          assignedPlan = planIdFromOrder
          console.log(`Plan assigned by ORDER ID: ${assignedPlan}`)
        }

        // FALLBACK: no/invalid id in the order → match by the amount paid.
        // NOTE: for upgrades the amount is only the price DIFFERENCE, so the
        // order-id path above is what makes upgrades correct. This fallback is
        // a safety net for legacy/activation orders only.
        if (!assignedPlan) {
          for (const tier of pricingTiers) {
            if (depositAmount >= tier.price) {
              assignedPlan = tier.id
              break
            }
          }
          // If they paid less than the cheapest tier, take the cheapest as anchor.
          if (!assignedPlan && pricingTiers.length > 0) {
            assignedPlan = pricingTiers[pricingTiers.length - 1].id
          }
          console.log(`Plan assigned by PRICE fallback: ${assignedPlan} (amount ${depositAmount})`)
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

      // Execute all operations in parallel
      const results = await Promise.all(dbOperations)
      const hasError = results.some(res => res.error)

      if (hasError) {
        console.error('DB adjustment failure inside IPN ledger queue:', results.map(r => r.error))
        return NextResponse.json({ error: 'Database pipeline provisioning error' }, { status: 500 })
      }

      console.log(`💰 Ledger credited +${depositAmount} USDT · type=${txType} · user=${clientEmail}`)
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('CoinPayments Critical IPN Exception Handler:', error)
    return NextResponse.json({ error: 'Internal system pipeline exception' }, { status: 500 })
  }
}