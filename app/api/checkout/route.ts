import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Service-role client to write the pending transaction (bypasses RLS).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── ORDER ID FORMAT (must match dashboard + webhook) ────────────────────────
//   type|planId|userId|timestamp
// We use "|" as the separator because it never appears in emails, plan ids or
// uuids, so the parts can always be split back out reliably.
// type   = activation | upgrade | topup
// planId = starter | pro | enterprise   (or 'wallet' for a top-up)
// userId = the REAL auth user id (uuid)
// ────────────────────────────────────────────────────────────────────────────
function parseOrderId(orderId: string) {
  const parts = (orderId || '').split('|');
  if (parts.length >= 4) {
    return { type: parts[0], planId: parts[1], userId: parts[2], ts: parts[3] };
  }
  // Backward-compat: tolerate the OLD underscore format so in-flight orders
  // don't crash. (type_plan_email_ts) — we can't recover userId from it, so
  // we leave userId empty and let manual approval handle those.
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

    // Correctly pull the real userId + planId + type out of the order_id.
    const { type, planId, userId } = parseOrderId(order_id);

    // Look up the buyer's email for the CoinPayments receipt (best-effort).
    // This must NEVER break the payment — wrap it so any failure just falls
    // back to a default email and the transaction still goes through.
    let clientEmail = 'client@pro-mail.club';
    try {
      if (userId) {
        const { data: prof } = await supabaseAdmin
          .from('profiles').select('email').eq('id', userId).single();
        if (prof?.email) clientEmail = prof.email;
      }
    } catch {
      /* ignore — keep the default email */
    }
    // Guarantee a syntactically valid email for CoinPayments.
    if (!clientEmail || !clientEmail.includes('@')) clientEmail = 'client@pro-mail.club';

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
      custom: order_id,                       // CoinPayments echoes this back in the IPN
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
      // Save the pending transaction WITH the real user_id, plan_id and type,
      // so the webhook (or a manual approve) can activate the right plan later.
      // Wrapped so a DB hiccup never blocks the user's payment redirect.
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
      // Surface the real CoinPayments error so it's diagnosable.
      return NextResponse.json({ error: data.error || 'CoinPayments rejected the request' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}