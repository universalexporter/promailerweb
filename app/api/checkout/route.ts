import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── ORDER ID FORMAT (matches dashboard + webhook) ───────────────────────────
//   type|planId|userId|timestamp
// We parse it to store the right data, but we do NOT do any database work
// BEFORE calling CoinPayments — that keeps the payment path identical to the
// original working version, so the gateway never fails on our account.
function parseOrderId(orderId: string) {
  const parts = (orderId || '').split('|');
  if (parts.length >= 4) {
    return { type: parts[0], planId: parts[1], userId: parts[2], ts: parts[3] };
  }
  // tolerate the old underscore format just in case
  const legacy = (orderId || '').split('_');
  return { type: legacy[0] || 'activation', planId: legacy[1] || 'wallet', userId: '', ts: legacy[3] || '' };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description, order_id } = body;

    const PUBLIC_KEY = process.env.COINPAYMENTS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.COINPAYMENTS_PRIVATE_KEY;

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return NextResponse.json({ error: "Missing Keys" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pro-mail.club';

    // Parse the parts we need to STORE later (no DB calls here).
    const { type, planId, userId } = parseOrderId(order_id);

    // Buyer email for the receipt — kept simple like the original working code.
    // (No pre-call database lookup; a generic email is fine for CoinPayments.)
    const clientEmail = 'client@pro-mail.club';

    const payloadParams = new URLSearchParams({
      version: '1',
      cmd: 'create_transaction',
      key: PUBLIC_KEY,
      format: 'json',
      amount: amount.toString(),
      currency1: 'USDT',
      currency2: 'USDT.TRC20',
      buyer_email: clientEmail,
      item_name: description,
      custom: order_id,
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/dashboard?payment=cancelled`
    });

    const payloadString = payloadParams.toString();
    const hmac = crypto.createHmac('sha512', PRIVATE_KEY).update(payloadString).digest('hex');

    const response = await fetch('https://www.coinpayments.net/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'HMAC': hmac
      },
      body: payloadString
    });

    const data = await response.json();

    if (data.error === 'ok' && data.result) {
      // Only AFTER a successful gateway response do we touch the database.
      // Wrapped so a DB issue can never block the user's payment redirect.
      try {
        await supabaseAdmin.from('transactions').insert({
          txn_id: data.result.txn_id,
          user_id: userId || null,
          plan_id: planId,
          type: type,
          amount: amount,
          currency: 'USDT.TRC20',
          status: 'pending',
          description: description,
          order_id: order_id
        });
      } catch (e) {
        console.error('Transaction insert failed (payment still proceeding):', e);
      }

      return NextResponse.json({ checkout_url: data.result.checkout_url }, { status: 200 });
    } else {
      // Surface the real CoinPayments reason so any issue is diagnosable.
      return NextResponse.json({ error: data.error || 'CoinPayments rejected the request' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}