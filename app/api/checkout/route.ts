import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize admin Supabase client using service role key to bypass RLS for server actions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description, order_id } = body;

    const PUBLIC_KEY = process.env.COINPAYMENTS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.COINPAYMENTS_PRIVATE_KEY;

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return NextResponse.json({ error: "Missing Keys" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Extract user ID from your order_id schema (assuming order_id format is "userId_timestamp")
    const userId = order_id.split('_')[0];
    const clientEmail = order_id.split('_')[1] || 'client@promail.club';

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
      // 💾 SAVE PENDING TRANSACTION TO SUPABASE BEFORE REDIRECTING
      await supabaseAdmin.from('transactions').insert({
        txn_id: data.result.txn_id, // CoinPayments tracking ID
        user_id: userId,
        amount: amount,
        currency: 'USDT.TRC20',
        status: 'pending',
        description: description,
        order_id: order_id
      });

      return NextResponse.json({ checkout_url: data.result.checkout_url }, { status: 200 });
    } else {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}